import assert from "node:assert/strict";
import { CharaDashaCalculator, type CharaDashaPlanetPosition } from "../lib/vedic/completeDashaSystems";
const calculator=new CharaDashaCalculator();
const birth=new Date("2000-01-01T00:00:00.000Z");
const reference=new Date("2001-01-01T00:00:00.000Z");
const baseline:CharaDashaPlanetPosition[]=[{planet:"Sun",sign:"Leo"},{planet:"Moon",sign:"Cancer"},{planet:"Mars",sign:"Virgo"},{planet:"Mercury",sign:"Sagittarius"},{planet:"Jupiter",sign:"Pisces"},{planet:"Venus",sign:"Taurus"},{planet:"Saturn",sign:"Capricorn"},{planet:"Rahu",sign:"Gemini"},{planet:"Ketu",sign:"Libra"}];
function calculate(lagna="Aries",positions:CharaDashaPlanetPosition[]=baseline){return calculator.calculateCharaDasha(lagna,positions,birth,reference);}
function withPosition(positions:CharaDashaPlanetPosition[],planet:string,sign:string){return positions.map((p)=>p.planet===planet?{...p,sign}:p);}
function periodFor(periods:ReturnType<typeof calculate>,sign:string){const p=periods.find((item)=>item.sign===sign);assert.ok(p,"Missing "+sign+" period");return p;}
// BPHS 46.167: global sign-period direction is derived from the ninth sign pada.
const globalDirections=["direct","reverse","reverse","reverse","direct","direct","direct","reverse","reverse","reverse","direct","direct"];
for(let i=0;i<12;i++){const lagna=CharaDashaCalculator.SIGNS[i];const periods=calculate(lagna);assert.equal(periods.length,12);assert.equal(periods[0].direction,globalDirections[i],lagna+" global direction");assert.equal(periods[0].sign,lagna);assert.equal(new Set(periods.map((p)=>p.sign)).size,12);assert.ok(periods.every((p)=>p.profileId==="bphs-santhanam-1984"));for(let j=1;j<12;j++)assert.equal(periods[j-1].endDate.getTime(),periods[j].startDate.getTime());}
// BPHS 46.155–156: individual Dasha year counts use a separate per-sign direction.
const countDirections=["direct","direct","direct","reverse","reverse","reverse","direct","direct","direct","reverse","reverse","reverse"];const aries=calculate("Aries");
for(let i=0;i<12;i++)assert.equal(periodFor(aries,CharaDashaCalculator.SIGNS[i]).countDirection,countDirections[i]);
assert.equal(periodFor(aries,"Aries").years,6);assert.equal(periodFor(aries,"Taurus").years,1);assert.equal(periodFor(aries,"Gemini").years,7);assert.equal(periodFor(aries,"Cancer").years,1);assert.equal(periodFor(aries,"Leo").years,1);assert.equal(periodFor(aries,"Virgo").years,10);assert.equal(periodFor(aries,"Libra").years,8);assert.equal(periodFor(aries,"Sagittarius").years,4);assert.equal(periodFor(aries,"Capricorn").years,1);assert.equal(periodFor(aries,"Pisces").years,1);
assert.equal(periodFor(calculate("Aries",withPosition(baseline,"Mars","Pisces")),"Aries").years,12,"Inclusive sign count is not capped at nine");
// Both co-lords in Scorpio/Aquarius -> 12 years.
let positions=withPosition(withPosition(baseline,"Mars","Scorpio"),"Ketu","Scorpio");assert.equal(periodFor(calculate("Aries",positions),"Scorpio").years,12);
positions=withPosition(withPosition(baseline,"Saturn","Aquarius"),"Rahu","Aquarius");assert.equal(periodFor(calculate("Aries",positions),"Aquarius").years,12);
// Exactly one co-lord in the timed sign: count to the other (BPHS 46.160).
positions=withPosition(withPosition(baseline,"Mars","Scorpio"),"Ketu","Leo");const scorpioOther=periodFor(calculate("Aries",positions),"Scorpio");assert.equal(scorpioOther.lord,"Ketu");assert.equal(scorpioOther.years,10);
positions=withPosition(withPosition(baseline,"Saturn","Aquarius"),"Rahu","Taurus");const aquariusOther=periodFor(calculate("Aries",positions),"Aquarius");assert.equal(aquariusOther.lord,"Rahu");assert.equal(aquariusOther.years,10);
// Both elsewhere: companion occupancy beats an otherwise stronger modality.
positions=withPosition(withPosition(withPosition(withPosition(baseline,"Mars","Leo"),"Venus","Leo"),"Ketu","Pisces"),"Jupiter","Aquarius");
const companionWinner=periodFor(calculate("Aries",positions),"Scorpio");assert.equal(companionWinner.lord,"Mars");assert.equal(companionWinner.years,10);
// Equal companion count: dual > fixed > movable sign strength.
positions=withPosition(withPosition(baseline,"Mars","Virgo"),"Ketu","Taurus");const modalityWinner=periodFor(calculate("Aries",positions),"Scorpio");assert.equal(modalityWinner.lord,"Mars");assert.equal(modalityWinner.years,11);
// Equal sign strength: exalted co-lord selected before longer count in this profile.
positions=[{planet:"Sun",sign:"Aries"},{planet:"Moon",sign:"Taurus"},{planet:"Mars",sign:"Capricorn"},{planet:"Mercury",sign:"Gemini"},{planet:"Jupiter",sign:"Virgo"},{planet:"Venus",sign:"Leo"},{planet:"Saturn",sign:"Pisces"},{planet:"Rahu",sign:"Sagittarius"},{planet:"Ketu",sign:"Cancer"}];
const exaltedCoLord=periodFor(calculate("Aries",positions),"Scorpio");assert.equal(exaltedCoLord.lord,"Mars");assert.equal(exaltedCoLord.years,4);
// If all prior strengths tie, select the co-lord whose sign gives more inclusive years.
positions=withPosition(withPosition(baseline,"Mars","Leo"),"Ketu","Taurus");const longerCount=periodFor(calculate("Aries",positions),"Scorpio");assert.equal(longerCount.lord,"Mars");assert.equal(longerCount.years,10);
// If both co-lords share an outside sign, their duration is the same; report both.
positions=withPosition(withPosition(baseline,"Mars","Gemini"),"Ketu","Gemini");const sameDestination=periodFor(calculate("Aries",positions),"Scorpio");assert.equal(sameDestination.lord,"Mars & Ketu");assert.equal(sameDestination.years,8);
// BPHS 46.165 dignity changes remain inspectable.
positions=withPosition(baseline,"Mars","Capricorn");const exalted=periodFor(calculate("Aries",positions),"Aries");assert.equal(exalted.baseYears,10);assert.equal(exalted.adjustmentYears,1);assert.equal(exalted.years,11);
positions=withPosition(baseline,"Mars","Cancer");const debilitated=periodFor(calculate("Aries",positions),"Aries");assert.equal(debilitated.baseYears,4);assert.equal(debilitated.adjustmentYears,-1);assert.equal(debilitated.years,3);
// Adapter maps the astronomical chart node names and excludes outer planets.
const adapted=CharaDashaCalculator.toPlanetPositions([...baseline.filter((p)=>p.planet!=="Rahu"&&p.planet!=="Ketu").map(({planet,sign})=>({name:planet,rasiName:sign})),{name:"NorthNode",rasiName:"Gemini"},{name:"SouthNode",rasiName:"Libra"},{name:"Uranus",rasiName:"Aquarius"},{name:"Neptune",rasiName:"Pisces"},{name:"Pluto",rasiName:"Capricorn"}]);
assert.deepEqual(adapted.map((p)=>p.planet).sort(),[...CharaDashaCalculator.REQUIRED_PLANETS].sort());assert.ok(adapted.some((p)=>p.planet==="Rahu"&&p.sign==="Gemini"));assert.ok(adapted.some((p)=>p.planet==="Ketu"&&p.sign==="Libra"));
// Malformed chart data fails closed rather than defaulting to Aries.
assert.throws(()=>calculate("Unknown sign"),/valid Ascendant sign/);assert.throws(()=>calculate("Aries",baseline.slice(0,8)),/all nine classical grahas/);assert.throws(()=>calculate("Aries",[...baseline,baseline[0]]),/Duplicate Chara Dasha position/);assert.throws(()=>calculate("Aries",withPosition(baseline,"Mercury","Invalid sign")),/Invalid sign/);assert.throws(()=>calculator.calculateCharaDasha("Aries",baseline,new Date("invalid")),/valid birth date/);
console.log("Jaimini Chara Dasha BPHS source suite passed.");
