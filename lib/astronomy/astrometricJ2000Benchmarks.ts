import { createHash } from "node:crypto";
import { validateInpopEpochs } from "./inpopWesternEphemerisBenchmarks";

export const ASTROMETRIC_OUTER_PLANETS = [
  { body: "Saturn", targetId: "699" },
  { body: "Uranus", targetId: "799" },
  { body: "Neptune", targetId: "899" },
] as const;
export type AstrometricOuterPlanet = typeof ASTROMETRIC_OUTER_PLANETS[number]["body"];

export interface AstrometricVector {
  body: AstrometricOuterPlanet;
  epochUtc: string;
  xAu: number;
  yAu: number;
  zAu: number;
  rangeAu: number;
  longitudeDegrees: number;
  latitudeDegrees: number;
}

export interface AstrometricDataset {
  schemaVersion: number;
  datasetStatus: string;
  epochsUtc: string[];
  retrievedAtUtc: string;
  query: Record<string, string>;
  miriadeResponses: Array<Record<string, unknown>>;
  horizonsResponses: Array<Record<string, unknown>>;
  fixtures: Array<{
    body: AstrometricOuterPlanet;
    epochUtc: string;
    miriade: AstrometricVector;
    horizons: AstrometricVector;
  }>;
}

export function formatAstrometricEpochFile(epochs: string[]): string {
  validateInpopEpochs(epochs);
  return epochs.map((epoch) => {
    if (!epoch.endsWith(".000Z")) throw new Error("Whole-second epochs required: " + epoch);
    return epoch.slice(0, -5);
  }).join("\n") + "\n";
}

export function buildMiriadeAstrometricUrl(body: AstrometricOuterPlanet): string {
  const url = new URL("https://ssp.imcce.fr/webservices/miriade/api/ephemcc.php");
  const args: Record<string, string> = {
    "-name": "p:" + body, "-from": "CelestiaResearch", "-tscale": "UTC",
    "-observer": "500", "-theory": "INPOP", "-teph": "1",
    "-tcoor": "2", "-rplane": "2", "-mime": "json", "-output": "--iso",
  };
  Object.entries(args).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

export function buildHorizonsAstrometricUrl(targetId: string, epochs: string[]): string {
  if (!/^\d+$/.test(targetId)) throw new RangeError("Invalid numeric JPL target id.");
  validateInpopEpochs(epochs);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const tlist = epochs.map((epoch) => {
    const d = new Date(epoch);
    return "'" + epoch.slice(0,4) + "-" + months[d.getUTCMonth()] + "-" +
      epoch.slice(8,10) + " " + epoch.slice(11,19) + ".000'";
  }).join(" ");
  const args: Record<string,string> = {
    format:"json", COMMAND:"'" + targetId + "'", OBJ_DATA:"'NO'", MAKE_EPHEM:"'YES'",
    EPHEM_TYPE:"'VECTORS'", CENTER:"'500@399'", TLIST:tlist, TLIST_TYPE:"'CAL'",
    TIME_TYPE:"'UT'", TIME_DIGITS:"'FRACSEC'", CAL_TYPE:"'GREGORIAN'",
    REF_SYSTEM:"'ICRF'", REF_PLANE:"'ECLIPTIC'", VEC_CORR:"'LT'",
    VEC_TABLE:"'1'", OUT_UNITS:"'AU-D'",
  };
  const url = new URL("https://ssd.jpl.nasa.gov/api/horizons.api");
  Object.entries(args).forEach(([key,value])=>url.searchParams.set(key,value));
  return url.toString().replace(/\+/g,"%20");
}

function vector(body: AstrometricOuterPlanet, epochUtc: string, x: number, y: number, z: number): AstrometricVector {
  const rho = Math.hypot(x,y);
  const rangeAu = Math.hypot(rho,z);
  if (!Number.isFinite(rangeAu) || rangeAu === 0) throw new Error("Invalid zero vector for " + body);
  return {
    body, epochUtc, xAu:x, yAu:y, zAu:z, rangeAu,
    longitudeDegrees:(Math.atan2(y,x)*180/Math.PI+360)%360,
    latitudeDegrees:Math.atan2(z,rho)*180/Math.PI,
  };
}

function readNumber(row: Record<string,unknown>, aliases: string[]): number {
  const entries = new Map(Object.entries(row).map(([k,v])=>[k.toLowerCase().replace(/[^a-z]/g,""),v]));
  for(const alias of aliases){
    const value=entries.get(alias);
    if(value!==undefined && value!==null && value!==""){
      const parsed=typeof value==="number"?value:Number(value);
      if(Number.isFinite(parsed)) return parsed;
    }
  }
  throw new Error("Missing coordinate column: "+aliases.join("/"));
}

function parseMiriadeDate(value: unknown): string {
  if(typeof value!=="string") throw new Error("Miriade row missing date.");
  const date=new Date(/(?:Z|[+-]\d\d:?\d\d)$/i.test(value)?value:value+"Z");
  if(!Number.isFinite(date.getTime())) throw new Error("Invalid Miriade date: "+value);
  return date.toISOString();
}

export function parseMiriadeAstrometricRows(payload: any, body: AstrometricOuterPlanet, epochs: string[]): AstrometricVector[] {
  validateInpopEpochs(epochs);
  const theory=String(payload?.ephemeris?.planetary_theory??"");
  if(!theory.toUpperCase().includes("INPOP")) throw new Error("Miriade did not report INPOP theory.");
  if(String(payload?.ephemeris?.time_scale??"").toUpperCase()!=="UTC") throw new Error("Miriade response time scale is not UTC.");
  if(!String(payload?.ephemeris?.coordinates??"").toLowerCase().includes("rectangular")) throw new Error("Miriade output is not rectangular.");
  const frame=payload?.ephemeris?.reference_frame??{};
  if(!String(frame.plane??"").toLowerCase().includes("ecliptic") ||
     !String(frame.center??"").toLowerCase().includes("geocenter")) throw new Error("Miriade output is not geocentric ecliptic.");
  const identity=[frame.type,payload?.coosys?.epoch,payload?.coosys?.equinox,payload?.coosys?.system].join(" ").toLowerCase();
  if(!/j2000|astrometric/.test(identity)) throw new Error("Miriade response does not identify astrometric J2000 frame.");
  if(!Array.isArray(payload?.data)) throw new Error("Miriade response has no data rows.");
  const rows=payload.data.map((row:Record<string,unknown>,i:number)=>{
    const epoch=parseMiriadeDate(row.Date??row.date);
    if(epoch!==epochs[i]) throw new Error("Miriade epoch mismatch at row "+(i+1)+": "+epoch);
    return vector(body,epoch,readNumber(row,["px","x"]),readNumber(row,["py","y"]),readNumber(row,["pz","z"]));
  });
  if(rows.length!==epochs.length) throw new Error("Miriade returned wrong row count.");
  return rows;
}

function parseHorizonsDate(line:string):{epoch:string}|null{
  const m=/(\d{4})-([A-Za-z]{3})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/.exec(line);
  if(!m)return null;
  const month=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(m[2]);
  if(month<0)throw new Error("Invalid Horizons month.");
  const d=new Date(Date.UTC(+m[1],month,+m[3],+m[4],+m[5],+m[6],+((m[7]??"").padEnd(3,"0").slice(0,3))));
  return {epoch:d.toISOString()};
}

export function parseHorizonsAstrometricRows(text:string,body:AstrometricOuterPlanet,epochs:string[]):AstrometricVector[]{
  validateInpopEpochs(epochs);
  const start=text.indexOf("$$SOE"),end=text.indexOf("$$EOE");
  if(start<0||end<=start)throw new Error("Horizons VECTORS output missing $$SOE/$$EOE.");
  const lines=text.slice(start+5,end).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const rows:AstrometricVector[]=[];
  for(let i=0;i<lines.length;i++){
    const parsed=parseHorizonsDate(lines[i]);
    if(!parsed)continue;
    if(parsed.epoch!==epochs[rows.length])throw new Error("Horizons epoch mismatch: "+parsed.epoch);
    const block=lines.slice(i,Math.min(lines.length,i+3)).join(" ");
    const values=["x","y","z"].map((axis)=>{
      const m=new RegExp("\\b"+axis+"\\s*=\\s*([-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[Ee][+-]?\\d+)?)","i").exec(block);
      return m?Number(m[1]):NaN;
    });
    if(!values.every(Number.isFinite))throw new Error("Could not parse X/Y/Z vector from Horizons row: "+block);
    rows.push(vector(body,parsed.epoch,values[0],values[1],values[2]));
  }
  if(rows.length!==epochs.length)throw new Error("Horizons returned "+rows.length+" rows; expected "+epochs.length);
  return rows;
}

export function angularSeparationArcseconds(a:AstrometricVector,b:AstrometricVector):number{
  const dot=a.xAu*b.xAu+a.yAu*b.yAu+a.zAu*b.zAu;
  const cross=Math.hypot(a.yAu*b.zAu-a.zAu*b.yAu,a.zAu*b.xAu-a.xAu*b.zAu,a.xAu*b.yAu-a.yAu*b.xAu);
  return Math.atan2(cross,dot)*180/Math.PI*3600;
}

export function sha256Hex(text:string):string{return createHash("sha256").update(text).digest("hex");}
