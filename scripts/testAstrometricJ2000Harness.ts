import assert from "node:assert/strict";
import {
  angularSeparationArcseconds,
  buildHorizonsAstrometricUrl,
  buildMiriadeAstrometricUrl,
  equatorialJ2000ToEclipticJ2000,
  formatAstrometricEpochFile,
  parseHorizonsAstrometricRows,
  parseMiriadeAstrometricRows,
} from "../lib/astronomy/astrometricJ2000Benchmarks";

let assertions=0;
function check(v:unknown,m:string){assert.ok(v,m);assertions++;}
function close(a:number,e:number,t:number,m:string){assert.ok(Math.abs(a-e)<=t,m+" expected "+e+" got "+a);assertions++;}

const epochs=["2000-01-01T12:00:00.000Z","2024-02-29T00:00:00.000Z"];
const miriade=new URL(buildMiriadeAstrometricUrl("Saturn"));
check(miriade.searchParams.get("-theory")==="INPOP","Miriade uses INPOP");
check(miriade.searchParams.get("-teph")==="1","Miriade requests astrometric J2000");
check(miriade.searchParams.get("-tcoor")==="2"&&miriade.searchParams.get("-rplane")==="2","Miriade requests rectangular ecliptic vectors");
check(miriade.searchParams.get("-observer")==="500"&&miriade.searchParams.get("-tscale")==="UTC","Miriade uses Earth geocenter and UTC");
check(formatAstrometricEpochFile(epochs)==="2000-01-01T12:00:00\n2024-02-29T00:00:00\n","Miriade epoch file uses whole-second timestamps");
assertions++;
assert.throws(()=>formatAstrometricEpochFile(["2000-01-01T12:00:00.125Z"]),/Whole-second/);assertions++;

const horizons=new URL(buildHorizonsAstrometricUrl("699",epochs));
check(horizons.searchParams.get("EPHEM_TYPE")==="'VECTORS'","Horizons requests vector table");
check(horizons.searchParams.get("CENTER")==="'500@399'","Horizons vector origin is geocenter");
check(horizons.searchParams.get("REF_SYSTEM")==="'ICRF'"&&horizons.searchParams.get("REF_PLANE")==="'ECLIPTIC'","Horizons uses ICRF fixed ecliptic");
check(horizons.searchParams.get("VEC_CORR")==="'LT'"&&horizons.searchParams.get("VEC_TABLE")==="'1'","Horizons uses LT astrometric vectors");
check(horizons.searchParams.get("OUT_UNITS")==="'AU-D'","Horizons output units are AU and day");
check(horizons.searchParams.get("TLIST")==="'2000-Jan-01 12:00:00.000' '2024-Feb-29 00:00:00.000'","Horizons receives the same discrete epochs");assertions++;

const payload={
 ephemeris:{time_scale:"UTC",planetary_theory:"INPOP19",coordinates:"rectangular",
  reference_frame:{type:"astrometric J2000",plane:"ecliptic",center:"geocenter"}},
 coosys:{epoch:"J2000",equinox:"J2000",system:"ec_ICRF"},
 data:[{Date:"2000-01-01T12:00:00.000",px:1,py:2,pz:3},{Date:"2024-02-29T00:00:00.000",px:-1,py:0,pz:0}],
};
const mr=parseMiriadeAstrometricRows(payload,"Saturn",epochs);
check(mr.length===2,"Miriade parser reads both rows");
close(mr[0].rangeAu,Math.sqrt(14),1e-12,"Miriade parser calculates vector range");
close(mr[0].longitudeDegrees,Math.atan2(2,1)*180/Math.PI,1e-12,"Miriade parser calculates ecliptic longitude");

const jplText=[
 "JPL/HORIZONS vector table","$$SOE",
 "2451545.000000000 = A.D. 2000-Jan-01 12:00:00.0000 UT",
 " X = 1.000000000000000E+00 Y = 2.000000000000000E+00 Z = 3.000000000000000E+00",
 "2460370.500000000 = A.D. 2024-Feb-29 00:00:00.0000 UT",
 " X = -1.000000000000000E+00 Y = 0.000000000000000E+00 Z = 0.000000000000000E+00",
 "$$EOE"
].join("\n");
const jr=parseHorizonsAstrometricRows(jplText,"Saturn",epochs);
check(jr.length===2,"Horizons parser reads both rows");
close(jr[0].xAu,1,1e-12,"Horizons parses x");
close(jr[0].yAu,2,1e-12,"Horizons parses y");
close(jr[0].zAu,3,1e-12,"Horizons parses z");
assert.throws(()=>parseHorizonsAstrometricRows(jplText.replace("2024-Feb-29","2024-Feb-28"),"Saturn",epochs),/epoch mismatch/);assertions++;
assert.throws(()=>parseHorizonsAstrometricRows("no data markers","Saturn",epochs),/SOE/);assertions++;

const angle=angularSeparationArcseconds(
 {body:"Saturn",epochUtc:epochs[0],xAu:1,yAu:0,zAu:0,rangeAu:1,longitudeDegrees:0,latitudeDegrees:0},
 {body:"Saturn",epochUtc:epochs[0],xAu:1,yAu:1e-6,zAu:0,rangeAu:Math.hypot(1,1e-6),longitudeDegrees:0,latitudeDegrees:0},
);
close(angle,1e-6*180/Math.PI*3600,1e-8,"Angular separation uses stable atan2 cross/dot geometry");

const rotated=equatorialJ2000ToEclipticJ2000(0,1,0);
const epsilon=84381.448/3600*Math.PI/180;
close(rotated.yAu,Math.cos(epsilon),1e-14,"EQJ-to-ecliptic rotation uses J2000 mean obliquity");
close(rotated.zAu,-Math.sin(epsilon),1e-14,"EQJ-to-ecliptic rotation has the correct handedness");
close(Math.hypot(rotated.xAu,rotated.yAu,rotated.zAu),1,1e-14,"Fixed-frame coordinate rotation preserves vector norm");

console.log("Astrometric J2000 harness passed: "+assertions+" assertions; parser/configuration validation only, not accuracy validation.");
