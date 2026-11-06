import { resolveLocalDateTime } from "../lib/astronomy/historicalTimezone";

interface TestResult { name:string; passed:boolean; expected:string; actual:string; }
const results:TestResult[]=[];
function test(name:string,condition:boolean,expected:string,actual:string){
  results.push({name,passed:condition,expected,actual});
}
function resolve(timeZone:string,year:number,month:number,day:number,hour:number,minute:number,second=0,millisecond=0){
  return resolveLocalDateTime({year,month,day,hour,minute,second,millisecond},timeZone);
}

const londonWinter=resolve("Europe/London",2024,1,15,12,0);
test("London winter resolves to UTC+00:00",londonWinter.status==="resolved"&&londonWinter.candidates[0]?.offsetSeconds===0,"resolved, offset 0",londonWinter.status+", "+londonWinter.candidates.map(c=>c.offsetSeconds).join(","));
const londonSummer=resolve("Europe/London",2024,7,15,12,0);
test("London summer resolves to UTC+01:00",londonSummer.status==="resolved"&&londonSummer.candidates[0]?.offsetSeconds===3600,"resolved, offset 3600",londonSummer.status+", "+londonSummer.candidates.map(c=>c.offsetSeconds).join(","));
const londonGap=resolve("Europe/London",2024,3,31,1,30);
test("London spring-forward local time is nonexistent",londonGap.status==="nonexistent","nonexistent",londonGap.status);
const londonFold=resolve("Europe/London",2024,10,27,1,30);
test("London autumn local time is ambiguous with two candidates",londonFold.status==="ambiguous"&&londonFold.candidates.length===2,"ambiguous, 2 candidates",londonFold.status+", "+londonFold.candidates.length);
const newYorkGap=resolve("America/New_York",2024,3,10,2,30);
test("New York spring-forward local time is nonexistent",newYorkGap.status==="nonexistent","nonexistent",newYorkGap.status);
const newYorkFold=resolve("America/New_York",2024,11,3,1,30);
test("New York autumn local time is ambiguous with two candidates",newYorkFold.status==="ambiguous"&&newYorkFold.candidates.length===2,"ambiguous, 2 candidates",newYorkFold.status+", "+newYorkFold.candidates.length);
const wartimeLondon=resolve("Europe/London",1944,6,1,12,0);
test("UK 1944 wartime double-summer time resolves to UTC+02:00",wartimeLondon.status==="resolved"&&wartimeLondon.candidates[0]?.offsetSeconds===7200,"resolved, offset 7200",wartimeLondon.status+", "+wartimeLondon.candidates.map(c=>c.offsetSeconds).join(","));
const historicalNewYork=resolve("America/New_York",1883,11,18,11,30);
test("Historical New York local mean time preserves second-level offset",historicalNewYork.status==="resolved"&&historicalNewYork.candidates[0]?.offsetSeconds===-17762,"resolved, offset -17762",historicalNewYork.status+", "+historicalNewYork.candidates.map(c=>c.offsetSeconds).join(","));
const kathmanduAfter=resolve("Asia/Kathmandu",1986,1,1,0,20);
test("Kathmandu after 1986 transition resolves to UTC+05:45",kathmanduAfter.status==="resolved"&&kathmanduAfter.candidates[0]?.offsetSeconds===20700,"resolved, offset 20700",kathmanduAfter.status+", "+kathmanduAfter.candidates.map(c=>c.offsetSeconds).join(","));
const kathmanduGap=resolve("Asia/Kathmandu",1986,1,1,0,7);
test("Kathmandu's skipped 15-minute interval is nonexistent",kathmanduGap.status==="nonexistent","nonexistent",kathmanduGap.status);
const lordHoweGap=resolve("Australia/Lord_Howe",2024,10,6,2,15);
test("Lord Howe 30-minute spring-forward gap is nonexistent",lordHoweGap.status==="nonexistent","nonexistent",lordHoweGap.status);
const lordHoweFold=resolve("Australia/Lord_Howe",2024,4,7,1,45);
test("Lord Howe 30-minute autumn fold is ambiguous",lordHoweFold.status==="ambiguous"&&lordHoweFold.candidates.length===2,"ambiguous, 2 candidates",lordHoweFold.status+", "+lordHoweFold.candidates.length);
const samoaSkip=resolve("Pacific/Apia",2011,12,30,12,0);
test("Samoa's skipped calendar date in 2011 is nonexistent",samoaSkip.status==="nonexistent","nonexistent",samoaSkip.status);
const invalidDate=resolve("UTC",2023,2,29,12,0);
test("Invalid calendar date is unsupported",invalidDate.status==="unsupported","unsupported",invalidDate.status);
const invalidTime=resolve("UTC",2024,1,1,24,0);
test("Invalid clock time is unsupported",invalidTime.status==="unsupported","unsupported",invalidTime.status);
const invalidZone=resolve("Mars/Olympus_Mons",2024,1,1,12,0);
test("Unknown IANA time zone is unsupported",invalidZone.status==="unsupported","unsupported",invalidZone.status);
const milliseconds=resolve("Europe/London",2024,1,15,12,0,0,123);
test("Millisecond precision is preserved",milliseconds.status==="resolved"&&milliseconds.candidates[0]?.instant.toISOString()==="2024-01-15T12:00:00.123Z","2024-01-15T12:00:00.123Z",milliseconds.candidates[0]?.instant.toISOString()??milliseconds.status);
const unsupportedYear=resolve("UTC",1799,1,1,12,0);
test("Dates before declared supported range are unsupported",unsupportedYear.status==="unsupported","unsupported",unsupportedYear.status);

let passed=0,failed=0;
for(const result of results){
  if(result.passed)passed++;else failed++;
  console.log("["+(result.passed?"PASS":"FAIL")+"] "+result.name);
  if(!result.passed)console.log("  Expected: "+result.expected+"\n  Actual:   "+result.actual);
}
console.log("TOTAL TESTS: "+results.length);
console.log("PASSED: "+passed);
console.log("FAILED: "+failed);
if(failed>0)process.exit(1);
