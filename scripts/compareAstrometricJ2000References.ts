import * as Astronomy from "astronomy-engine";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  angularSeparationArcseconds,
  equatorialJ2000ToEclipticJ2000,
  type AstrometricDataset,
  type AstrometricVector,
} from "../lib/astronomy/astrometricJ2000Benchmarks";

const root=process.cwd();
const datasetPath=path.join(root,"data/benchmarks/astrometric-j2000-western-reference.json");
const bodyIds:Record<string,Astronomy.Body>={
  Saturn:Astronomy.Body.Saturn,
  Uranus:Astronomy.Body.Uranus,
  Neptune:Astronomy.Body.Neptune,
};

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
    p95.toFixed(4)+"/"+sorted[sorted.length-1].toFixed(4)+"; RMS="+rms.toFixed(4);
}

function vector(body:string,epochUtc:string,xAu:number,yAu:number,zAu:number):AstrometricVector{
  const rho=Math.hypot(xAu,yAu),rangeAu=Math.hypot(rho,zAu);
  return {
    body:body as AstrometricVector["body"],epochUtc,xAu,yAu,zAu,rangeAu,
    longitudeDegrees:(Math.atan2(yAu,xAu)*180/Math.PI+360)%360,
    latitudeDegrees:Math.atan2(zAu,rho)*180/Math.PI,
  };
}

function difference(a:AstrometricVector,b:AstrometricVector){
  const dx=a.xAu-b.xAu,dy=a.yAu-b.yAu,dz=a.zAu-b.zAu;
  return {
    dx,dy,dz,norm:Math.hypot(dx,dy,dz),range:a.rangeAu-b.rangeAu,
    angle:angularSeparationArcseconds(a,b),
  };
}

function astronomyEngineVector(body:string,epochUtc:string):AstrometricVector{
  const id=bodyIds[body];
  if(id===undefined)throw new Error("No Astronomy Engine body mapping for "+body);
  const jd=Date.parse(epochUtc)/86400000+2440587.5;
  if(!Number.isFinite(jd))throw new Error("Invalid epoch for Astronomy Engine: "+epochUtc);
  const time=new Astronomy.AstroTime(jd-2451545.0);
  // GeoVector always applies light-time; false disables stellar aberration, matching JPL VEC_CORR=LT.
  const eqj=Astronomy.GeoVector(id,time,false);
  const ecl=equatorialJ2000ToEclipticJ2000(eqj.x,eqj.y,eqj.z);
  return vector(body,epochUtc,ecl.xAu,ecl.yAu,ecl.zAu);
}

async function main():Promise<void>{
  const data=JSON.parse(await readFile(datasetPath,"utf8")) as AstrometricDataset;
  if(data.schemaVersion!==1||!Array.isArray(data.fixtures)||data.fixtures.length!==18)
    throw new Error("Expected 18 matched astrometric J2000 rows.");
  await verify(data.miriadeResponses,"Miriade");
  await verify(data.horizonsResponses,"Horizons");
  const byBody=new Map<string,{
    refs:number[]; aeInpop:number[]; aeJpl:number[];
    refsVector:number[]; aeInpopVector:number[]; aeJplVector:number[];
  }>();
  for(const row of data.fixtures){
    if(row.miriade.epochUtc!==row.epochUtc||row.horizons.epochUtc!==row.epochUtc)
      throw new Error("Nested provider epoch mismatch.");
    const references=difference(row.miriade,row.horizons);
    const ae=astronomyEngineVector(row.body,row.epochUtc);
    const aeMiriade=difference(ae,row.miriade);
    const aeHorizons=difference(ae,row.horizons);
    const values=byBody.get(row.body)??{
      refs:[],aeInpop:[],aeJpl:[],refsVector:[],aeInpopVector:[],aeJplVector:[],
    };
    values.refs.push(references.angle);
    values.aeInpop.push(aeMiriade.angle);
    values.aeJpl.push(aeHorizons.angle);
    values.refsVector.push(references.norm);
    values.aeInpopVector.push(aeMiriade.norm);
    values.aeJplVector.push(aeHorizons.norm);
    byBody.set(row.body,values);
    console.log(
      "REVIEW "+row.body+" "+row.epochUtc+
      " | INPOP−JPL="+references.angle.toFixed(4)+"″"+
      " | AE(EQJ/LT)−INPOP="+aeMiriade.angle.toFixed(4)+"″"+
      " | AE(EQJ/LT)−JPL="+aeHorizons.angle.toFixed(4)+"″"+
      " | vector ΔAU(ref/INPOP/JPL)="+references.norm.toExponential(4)+"/"+
      aeMiriade.norm.toExponential(4)+"/"+aeHorizons.norm.toExponential(4)
    );
  }
  console.log("Common-frame J2000 angular separation (descriptive residuals; no acceptance thresholds):");
  for(const [body,v] of byBody){
    console.log(body+" n="+v.refs.length);
    console.log("  INPOP19 vs JPL DE441: "+stats(v.refs));
    console.log("  Astronomy Engine vs INPOP19: "+stats(v.aeInpop));
    console.log("  Astronomy Engine vs JPL DE441: "+stats(v.aeJpl));
    console.log("  Vector norm delta AU (INPOP/JPL): "+stats(v.refsVector));
    console.log("  Vector norm delta AU (AE/INPOP): "+stats(v.aeInpopVector));
    console.log("  Vector norm delta AU (AE/JPL): "+stats(v.aeJplVector));
  }
  console.log("All comparisons remain REVIEW, not absolute-accuracy certification.");
}
main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1;});
