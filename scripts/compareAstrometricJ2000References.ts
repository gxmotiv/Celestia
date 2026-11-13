import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  angularSeparationArcseconds,
  type AstrometricDataset,
  type AstrometricVector,
} from "../lib/astronomy/astrometricJ2000Benchmarks";

const root=process.cwd();
const datasetPath=path.join(root,"data/benchmarks/astrometric-j2000-western-reference.json");

async function verify(entries:Array<Record<string,unknown>>,provider:string):Promise<void>{
  if(!Array.isArray(entries)||entries.length!==3)throw new Error(provider+" response manifest must have three entries.");
  for(const entry of entries){
    const file=entry.responseFile,expected=entry.responseSha256;
    if(typeof file!=="string"||!file.startsWith("data/benchmarks/astrometric-j2000-raw/")||
       typeof expected!=="string"||!/^[0-9a-f]{64}$/i.test(expected))throw new Error("Invalid "+provider+" checksum manifest.");
    const actual=createHash("sha256").update(await readFile(path.join(root,file))).digest("hex");
    if(actual!==expected)throw new Error(provider+" SHA-256 mismatch for "+String(entry.body));
    console.log("CHECKSUM PASS "+provider+" "+String(entry.body));
  }
}

function stats(values:number[]):string{
  const sorted=[...values].sort((a,b)=>a-b);
  const rms=Math.sqrt(values.reduce((sum,v)=>sum+v*v,0)/values.length);
  const p95=sorted[Math.max(0,Math.ceil(sorted.length*.95)-1)];
  return "median/p95/max="+sorted[Math.floor(sorted.length/2)].toFixed(4)+"/"+
    p95.toFixed(4)+"/"+sorted[sorted.length-1].toFixed(4);
}

function difference(a:AstrometricVector,b:AstrometricVector){
  const dx=a.xAu-b.xAu,dy=a.yAu-b.yAu,dz=a.zAu-b.zAu;
  return {
    dx,dy,dz,norm:Math.hypot(dx,dy,dz),range:a.rangeAu-b.rangeAu,
    angle:angularSeparationArcseconds(a,b),
  };
}

async function main():Promise<void>{
  const data=JSON.parse(await readFile(datasetPath,"utf8")) as AstrometricDataset;
  if(data.schemaVersion!==1||!Array.isArray(data.fixtures)||data.fixtures.length!==18)
    throw new Error("Expected 18 matched astrometric J2000 rows.");
  await verify(data.miriadeResponses,"Miriade");
  await verify(data.horizonsResponses,"Horizons");
  const byBody=new Map<string,ReturnType<typeof difference>[]>();
  for(const row of data.fixtures){
    if(row.miriade.epochUtc!==row.epochUtc||row.horizons.epochUtc!==row.epochUtc)
      throw new Error("Nested provider epoch mismatch.");
    const result=difference(row.miriade,row.horizons);
    const list=byBody.get(row.body)??[];
    list.push(result);byBody.set(row.body,list);
    console.log("REVIEW "+row.body+" "+row.epochUtc+
      " | Δxyz="+result.dx.toExponential(5)+","+result.dy.toExponential(5)+","+result.dz.toExponential(5)+" AU"+
      " | Δr="+result.norm.toExponential(5)+" AU"+
      " | Δrange="+result.range.toExponential(5)+" AU"+
      " | angle="+result.angle.toFixed(4)+" arcsec");
  }
  console.log("Common-frame astrometric J2000 provider comparison (descriptive residuals, no pass thresholds):");
  for(const [body,rows] of byBody){
    console.log(body+" n="+rows.length);
    console.log("  angular separation arcsec "+stats(rows.map(r=>r.angle)));
    console.log("  vector delta AU "+stats(rows.map(r=>r.norm)));
    console.log("  absolute range delta AU "+stats(rows.map(r=>Math.abs(r.range))));
  }
  console.log("All "+data.fixtures.length+" comparisons remain REVIEW, not absolute-accuracy certification.");
}
main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1;});
