/**
 * Historical local-time resolver for IANA time zones.
 * Candidate offsets are sampled once per minute across a bounded +/-36-hour
 * UTC window and accepted only after an exact local-time round trip.
 * This is empirical coverage, not a formal exhaustive TZDB transition API.
 */
export type LocalTimeResolutionStatus = "resolved" | "ambiguous" | "nonexistent" | "unsupported";
export interface LocalDateTimeInput { year:number; month:number; day:number; hour:number; minute:number; second?:number; millisecond?:number; }
export interface LocalTimeCandidate { instant:Date; offsetSeconds:number; offsetLabel:string; }
export interface LocalTimeResolution {
  status:LocalTimeResolutionStatus;
  timeZone:string;
  candidates:LocalTimeCandidate[];
  observedOffsetSeconds:number[];
  method:"minute-sampled-intl-longOffset";
  sampleStepMinutes:1;
  searchRadiusHours:36;
  limitation:string;
  reason?:string;
}
const MIN_SUPPORTED_YEAR=1800, MAX_SUPPORTED_YEAR=2100;
const MINUTE_MS=60_000, SEARCH_RADIUS_MS=36*60*60*1000, SAMPLE_STEP_MS=MINUTE_MS;
const LIMITATION="Offsets are sampled every minute across a +/-36-hour window using the runtime ICU/IANA database. Round-trip checks establish candidate validity, but finite sampling cannot mathematically exclude an offset regime shorter than one minute. Historical accuracy is also limited by the runtime's time-zone database.";
const formatterCache=new Map<string,Intl.DateTimeFormat>();
function unsupported(timeZone:string,reason:string,observedOffsetSeconds:number[]=[]):LocalTimeResolution {
  return {status:"unsupported",timeZone,candidates:[],observedOffsetSeconds,method:"minute-sampled-intl-longOffset",sampleStepMinutes:1,searchRadiusHours:36,limitation:LIMITATION,reason};
}
function getFormatter(timeZone:string):Intl.DateTimeFormat {
  const cached=formatterCache.get(timeZone); if(cached)return cached;
  const formatter=new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn",{
    timeZone,calendar:"gregory",numberingSystem:"latn",year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23",timeZoneName:"longOffset"
  });
  formatterCache.set(timeZone,formatter); return formatter;
}
function partsMap(formatter:Intl.DateTimeFormat,instant:Date):Record<string,string>{
  const output:Record<string,string>={};
  for(const part of formatter.formatToParts(instant))output[part.type]=part.value;
  return output;
}
function parseOffsetSeconds(label:string|undefined):number|null{
  if(!label||label==="GMT"||label==="UTC")return 0;
  const match=/^GMT([+-])(\\d{1,2})(?::?(\\d{2}))?(?::?(\\d{2}))?$/.exec(label);
  if(!match)return null;
  const sign=match[1]==="-"?-1:1,hours=Number(match[2]),minutes=Number(match[3]??"0"),seconds=Number(match[4]??"0");
  if(!Number.isInteger(hours)||!Number.isInteger(minutes)||!Number.isInteger(seconds)||minutes>59||seconds>59||hours>24)return null;
  return sign*(hours*3600+minutes*60+seconds);
}
function offsetSecondsAt(formatter:Intl.DateTimeFormat,instantMs:number):number|null{
  const instant=new Date(instantMs); if(!Number.isFinite(instant.getTime()))return null;
  return parseOffsetSeconds(partsMap(formatter,instant).timeZoneName);
}
function makeWallClockTimestamp(input:LocalDateTimeInput):number|null{
  const second=input.second??0,millisecond=input.millisecond??0;
  const values=[input.year,input.month,input.day,input.hour,input.minute,second,millisecond];
  if(!values.every(Number.isInteger))return null;
  if(input.year<MIN_SUPPORTED_YEAR||input.year>MAX_SUPPORTED_YEAR||input.month<1||input.month>12||input.day<1||input.day>31||input.hour<0||input.hour>23||input.minute<0||input.minute>59||second<0||second>59||millisecond<0||millisecond>999)return null;
  const wall=new Date(0);
  wall.setUTCFullYear(input.year,input.month-1,input.day);
  wall.setUTCHours(input.hour,input.minute,second,millisecond);
  if(wall.getUTCFullYear()!==input.year||wall.getUTCMonth()+1!==input.month||wall.getUTCDate()!==input.day||wall.getUTCHours()!==input.hour||wall.getUTCMinutes()!==input.minute||wall.getUTCSeconds()!==second||wall.getUTCMilliseconds()!==millisecond)return null;
  return wall.getTime();
}
function roundTripsToInput(formatter:Intl.DateTimeFormat,instantMs:number,input:LocalDateTimeInput):boolean{
  const parts=partsMap(formatter,new Date(instantMs));
  return Number(parts.year)===input.year&&Number(parts.month)===input.month&&Number(parts.day)===input.day&&Number(parts.hour)===input.hour&&Number(parts.minute)===input.minute&&Number(parts.second)===(input.second??0);
}
function formatOffset(offsetSeconds:number):string{
  if(offsetSeconds===0)return "UTC+00:00";
  const sign=offsetSeconds<0?"-":"+",absolute=Math.abs(offsetSeconds);
  const hours=Math.floor(absolute/3600),minutes=Math.floor((absolute%3600)/60),seconds=absolute%60;
  const base="UTC"+sign+String(hours).padStart(2,"0")+":"+String(minutes).padStart(2,"0");
  return seconds===0?base:base+":"+String(seconds).padStart(2,"0");
}
/**
 * Resolve a local wall-clock time in an IANA time zone.
 * resolved = one round-tripping candidate; ambiguous = multiple candidates;
 * nonexistent = no candidates; unsupported = invalid input/zone/date/runtime data.
 * The result exposes the sampling method and its limitations.
 */
export function resolveLocalDateTime(input:LocalDateTimeInput,timeZone:string):LocalTimeResolution{
  if(typeof timeZone!=="string"||!timeZone.trim())return unsupported(timeZone??"","An IANA time-zone identifier is required.");
  const wallTimestamp=makeWallClockTimestamp(input);
  if(wallTimestamp===null)return unsupported(timeZone,"Invalid local date/time or unsupported year. Supported years: "+MIN_SUPPORTED_YEAR+"-"+MAX_SUPPORTED_YEAR+".");
  let formatter:Intl.DateTimeFormat;
  try{formatter=getFormatter(timeZone);formatter.format(new Date(wallTimestamp));}
  catch{return unsupported(timeZone,"The time-zone identifier is invalid or unavailable in this runtime.");}
  const observed=new Set<number>(),firstSample=wallTimestamp-SEARCH_RADIUS_MS,lastSample=wallTimestamp+SEARCH_RADIUS_MS;
  for(let instantMs=firstSample;instantMs<=lastSample;instantMs+=SAMPLE_STEP_MS){
    const offset=offsetSecondsAt(formatter,instantMs);
    if(offset===null)return unsupported(timeZone,"The runtime did not provide a parseable GMT offset.",[...observed].sort((a,b)=>a-b));
    observed.add(offset);
  }
  const lastOffset=offsetSecondsAt(formatter,lastSample);
  if(lastOffset===null)return unsupported(timeZone,"Unable to read the time-zone offset at the search boundary.");
  observed.add(lastOffset);
  const candidatesByInstant=new Map<number,LocalTimeCandidate>();
  for(const offsetSeconds of observed){
    const instantMs=wallTimestamp-offsetSeconds*1000;
    if(!roundTripsToInput(formatter,instantMs,input))continue;
    if(offsetSecondsAt(formatter,instantMs)!==offsetSeconds)continue;
    candidatesByInstant.set(instantMs,{instant:new Date(instantMs),offsetSeconds,offsetLabel:formatOffset(offsetSeconds)});
  }
  const candidates=[...candidatesByInstant.values()].sort((a,b)=>a.instant.getTime()-b.instant.getTime());
  return {
    status:candidates.length===1?"resolved":candidates.length>1?"ambiguous":"nonexistent",
    timeZone,candidates,observedOffsetSeconds:[...observed].sort((a,b)=>a-b),
    method:"minute-sampled-intl-longOffset",sampleStepMinutes:1,searchRadiusHours:36,limitation:LIMITATION
  };
}
