import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ASTROMETRIC_OUTER_PLANETS,
  buildHorizonsAstrometricUrl,
  buildMiriadeAstrometricUrl,
  formatAstrometricEpochFile,
  parseHorizonsAstrometricRows,
  parseMiriadeAstrometricRows,
  type AstrometricDataset,
} from "../lib/astronomy/astrometricJ2000Benchmarks";

interface EpochManifest { schemaVersion:number; epochsUtc:string[]; }
const root=process.cwd();
const epochPath=path.join(root,"data/benchmarks/western-ephemeris-reference.json");
const datasetPath=path.join(root,"data/benchmarks/astrometric-j2000-western-reference.json");
const rawDir=path.join(root,"data/benchmarks/astrometric-j2000-raw");

async function main():Promise<void>{
  if(!process.argv.includes("--fetch")){console.log("Use --fetch for live Miriade/JPL requests.");return;}
  const manifest=JSON.parse(await readFile(epochPath,"utf8")) as EpochManifest;
  if(manifest.schemaVersion!==1||!Array.isArray(manifest.epochsUtc))throw new Error("Invalid JPL epoch manifest.");
  try{
    const prior=JSON.parse(await readFile(datasetPath,"utf8")) as AstrometricDataset;
    if(prior.fixtures.length&&!process.argv.includes("--overwrite"))throw new Error("Reference fixture exists; pass --overwrite to refresh.");
  }catch(error){if(error instanceof Error&&error.message.startsWith("Reference fixture exists"))throw error;}
  await mkdir(rawDir,{recursive:true});
  const miriadeResponses:Array<Record<string,unknown>>=[];
  const horizonsResponses:Array<Record<string,unknown>>=[];
  const fixtures:AstrometricDataset["fixtures"]=[];
  for(const target of ASTROMETRIC_OUTER_PLANETS){
    const form=new FormData();
    form.append("epochs",new Blob([formatAstrometricEpochFile(manifest.epochsUtc)],{type:"text/plain"}),"epochs.txt");
    console.log("Fetching Miriade INPOP astrometric J2000 "+target.body);
    const mr=await fetch(buildMiriadeAstrometricUrl(target.body),{
      method:"POST",body:form,headers:{Accept:"application/json","User-Agent":"Celestia-Astrometric-J2000-Benchmark/1.0"},
      signal:AbortSignal.timeout(90000),
    });
    const mt=await mr.text();
    if(!mr.ok)throw new Error("Miriade "+target.body+" HTTP "+mr.status+": "+mt.slice(0,800));
    const mp=JSON.parse(mt);
    const mrows=parseMiriadeAstrometricRows(mp,target.body,manifest.epochsUtc);
    const mname="miriade-inpop-astrometric-"+target.body.toLowerCase()+".json";
    const mraw=mt.trimEnd()+"\n";await writeFile(path.join(rawDir,mname),mraw);
    miriadeResponses.push({
      body:target.body,responseFile:"data/benchmarks/astrometric-j2000-raw/"+mname,
      responseSha256:createHash("sha256").update(mraw).digest("hex"),
      planetaryTheory:mp.ephemeris?.planetary_theory??null,timeScale:mp.ephemeris?.time_scale??null,
      coordinateMode:mp.ephemeris?.coordinates??null,referenceFrame:mp.ephemeris?.reference_frame??null,
      coordinateSystem:mp.coosys??null,units:mp.unit??null,
    });
    await new Promise(resolve=>setTimeout(resolve,400));

    console.log("Fetching JPL Horizons LT vectors "+target.body);
    const jr=await fetch(buildHorizonsAstrometricUrl(target.targetId,manifest.epochsUtc),{
      headers:{Accept:"application/json","User-Agent":"Celestia-Astrometric-J2000-Benchmark/1.0"},
      signal:AbortSignal.timeout(90000),
    });
    const jt=await jr.text();
    if(!jr.ok)throw new Error("JPL "+target.body+" HTTP "+jr.status+": "+jt.slice(0,800));
    const jp=JSON.parse(jt);
    if(jp.error||typeof jp.result!=="string")throw new Error("JPL error for "+target.body+": "+(jp.error??"missing result"));
    const jrows=parseHorizonsAstrometricRows(jp.result,target.body,manifest.epochsUtc);
    const jname="horizons-astrometric-vectors-"+target.body.toLowerCase()+".json";
    const jraw=jt.trimEnd()+"\n";await writeFile(path.join(rawDir,jname),jraw);
    horizonsResponses.push({
      body:target.body,responseFile:"data/benchmarks/astrometric-j2000-raw/"+jname,
      responseSha256:createHash("sha256").update(jraw).digest("hex"),
      signature:jp.signature??null,
      query:{center:"500@399",referenceSystem:"ICRF",referencePlane:"ECLIPTIC (J2000 fixed ecliptic)",
        vectorCorrection:"LT (astrometric light-time; no stellar aberration)",vectorTable:"1",units:"AU-D",timeScale:"UT"},
    });
    mrows.forEach((miriade,index)=>fixtures.push({
      body:target.body,epochUtc:miriade.epochUtc,miriade,horizons:jrows[index],
    }));
    console.log("Captured "+mrows.length+" matched rows for "+target.body);
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  const dataset:AstrometricDataset={
    schemaVersion:1,datasetStatus:"captured-from-imcce-inpop19-and-jpl-horizons-lt-vectors",
    epochsUtc:manifest.epochsUtc,retrievedAtUtc:new Date().toISOString(),
    query:{
      miriade:"INPOP; observer 500; UTC; teph=1 astrometric J2000; tcoor=2 rectangular; rplane=2 ecliptic; xyz AU",
      horizons:"DE441; center 500@399; UT; VECTORS; ICRF; ECLIPTIC; VEC_CORR=LT; VEC_TABLE=1; AU-D",
      purpose:"Compare independent planetary theories in an inertial J2000 ecliptic vector frame using astrometric light-time correction.",
    },
    miriadeResponses,horizonsResponses,fixtures,
  };
  await writeFile(datasetPath,JSON.stringify(dataset,null,2)+"\n");
  console.log("Saved "+fixtures.length+" common-frame astrometric vector pairs.");
}
main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1;});
