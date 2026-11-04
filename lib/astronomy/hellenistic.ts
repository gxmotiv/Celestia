import { WesternChartData, PlanetPosition } from "./ephemeris";

export interface HellenisticAnalysis {
  isDiurnal: boolean;
  sectLight: string;
  beneficOfSect: string;
  maleficOfSect: string;
  contraryBenefic: string;
  contraryMalefic: string;
  joys: Array<{ planet: string; joyHouse: number; actualHouse: number; hasJoy: boolean }>;
  lots: {
    fortune: { longitude: number; sign: string; house: number; degreeStr: string };
    spirit: { longitude: number; sign: string; house: number; degreeStr: string };
    eros: { longitude: number; sign: string; house: number; degreeStr: string };
    necessity: { longitude: number; sign: string; house: number; degreeStr: string };
  };
  wholeSignPlacements: Array<{
    planet: string;
    sign: string;
    signIndex: number;
    wholeSignHouse: number;
    isAngular: boolean;
    isSuccedent: boolean;
    isCadent: boolean;
  }>;
}

export interface SiderealComparison {
  faganBradleyAyanamsa: number;
  planets: Array<{
    name: string;
    tropicalSign: string;
    tropicalDegree: number;
    siderealSign: string;
    siderealDegree: number;
    signShifted: boolean;
  }>;
}

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

function normalizeDeg(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

function getSignAndDegree(lon: number): { sign: string; degree: number; degreeStr: string; signIndex: number } {
  const norm = normalizeDeg(lon);
  const signIndex = Math.floor(norm / 30);
  const degree = norm % 30;
  const degInt = Math.floor(degree);
  const minInt = Math.floor((degree - degInt) * 60);
  return {
    sign: ZODIAC_SIGNS[signIndex] || "Aries",
    degree,
    degreeStr: `${degInt}°${minInt < 10 ? "0" : ""}${minInt}'`,
    signIndex,
  };
}

export function calculateHellenisticAnalysis(western: WesternChartData): HellenisticAnalysis {
  const sun = western.planets.find(p => p.name === "Sun");
  const moon = western.planets.find(p => p.name === "Moon");
  const ascLon = western.ascendant.longitude;

  // Diurnal check: Sun is above horizon (Houses 7 through 12 in quadrant, or relative to Asc/Dsc)
  const isDiurnal = sun ? (sun.house >= 7 && sun.house <= 12) : true;

  const sectLight = isDiurnal ? "Sun" : "Moon";
  const beneficOfSect = isDiurnal ? "Jupiter" : "Venus";
  const maleficOfSect = isDiurnal ? "Saturn" : "Mars";
  const contraryBenefic = isDiurnal ? "Venus" : "Jupiter";
  const contraryMalefic = isDiurnal ? "Mars" : "Saturn";

  const traditionalJoys = [
    { planet: "Mercury", joyHouse: 1 },
    { planet: "Moon", joyHouse: 3 },
    { planet: "Venus", joyHouse: 5 },
    { planet: "Mars", joyHouse: 6 },
    { planet: "Sun", joyHouse: 9 },
    { planet: "Jupiter", joyHouse: 11 },
    { planet: "Saturn", joyHouse: 12 },
  ];

  const joys = traditionalJoys.map(j => {
    const pl = western.planets.find(p => p.name === j.planet);
    const actualHouse = pl ? pl.house : 1;
    return {
      planet: j.planet,
      joyHouse: j.joyHouse,
      actualHouse,
      hasJoy: actualHouse === j.joyHouse,
    };
  });

  // Calculate Hellenistic Lots
  const sunLon = sun ? sun.longitude : 0;
  const moonLon = moon ? moon.longitude : 0;
  const venus = western.planets.find(p => p.name === "Venus");
  const mercury = western.planets.find(p => p.name === "Mercury");
  const venusLon = venus ? venus.longitude : 0;
  const mercuryLon = mercury ? mercury.longitude : 0;

  // Lot of Fortune: Day = Asc + Moon - Sun; Night = Asc + Sun - Moon
  const fortuneLon = isDiurnal
    ? normalizeDeg(ascLon + moonLon - sunLon)
    : normalizeDeg(ascLon + sunLon - moonLon);

  // Lot of Spirit: Day = Asc + Sun - Moon; Night = Asc + Moon - Sun
  const spiritLon = isDiurnal
    ? normalizeDeg(ascLon + sunLon - moonLon)
    : normalizeDeg(ascLon + moonLon - sunLon);

  // Lot of Eros: Day = Asc + Venus - Spirit; Night = Asc + Spirit - Venus
  const erosLon = isDiurnal
    ? normalizeDeg(ascLon + venusLon - spiritLon)
    : normalizeDeg(ascLon + spiritLon - venusLon);

  // Lot of Necessity: Day = Asc + Fortune - Mercury; Night = Asc + Mercury - Fortune
  const necessityLon = isDiurnal
    ? normalizeDeg(ascLon + fortuneLon - mercuryLon)
    : normalizeDeg(ascLon + mercuryLon - fortuneLon);

  // Whole Sign house determination from Ascendant sign
  const ascSignIdx = Math.floor(normalizeDeg(ascLon) / 30);

  const getHouseFromLon = (lon: number) => {
    const pSignIdx = Math.floor(normalizeDeg(lon) / 30);
    return ((pSignIdx - ascSignIdx + 12) % 12) + 1;
  };

  const fortuneInfo = getSignAndDegree(fortuneLon);
  const spiritInfo = getSignAndDegree(spiritLon);
  const erosInfo = getSignAndDegree(erosLon);
  const necessityInfo = getSignAndDegree(necessityLon);

  const wholeSignPlacements = western.planets.map(p => {
    const pSignIdx = Math.floor(normalizeDeg(p.longitude) / 30);
    const wholeSignHouse = ((pSignIdx - ascSignIdx + 12) % 12) + 1;
    const isAngular = [1, 4, 7, 10].includes(wholeSignHouse);
    const isSuccedent = [2, 5, 8, 11].includes(wholeSignHouse);
    const isCadent = [3, 6, 9, 12].includes(wholeSignHouse);

    return {
      planet: p.name,
      sign: ZODIAC_SIGNS[pSignIdx] || "Aries",
      signIndex: pSignIdx,
      wholeSignHouse,
      isAngular,
      isSuccedent,
      isCadent,
    };
  });

  return {
    isDiurnal,
    sectLight,
    beneficOfSect,
    maleficOfSect,
    contraryBenefic,
    contraryMalefic,
    joys,
    lots: {
      fortune: {
        longitude: fortuneLon,
        sign: fortuneInfo.sign,
        house: getHouseFromLon(fortuneLon),
        degreeStr: fortuneInfo.degreeStr,
      },
      spirit: {
        longitude: spiritLon,
        sign: spiritInfo.sign,
        house: getHouseFromLon(spiritLon),
        degreeStr: spiritInfo.degreeStr,
      },
      eros: {
        longitude: erosLon,
        sign: erosInfo.sign,
        house: getHouseFromLon(erosLon),
        degreeStr: erosInfo.degreeStr,
      },
      necessity: {
        longitude: necessityLon,
        sign: necessityInfo.sign,
        house: getHouseFromLon(necessityLon),
        degreeStr: necessityInfo.degreeStr,
      },
    },
    wholeSignPlacements,
  };
}

export function calculateSiderealComparison(western: WesternChartData): SiderealComparison {
  // Fagan-Bradley Ayanamsa is approximately 24.8° currently
  const faganBradleyAyanamsa = 24.84;

  const planets = western.planets.map(p => {
    const tropicalSign = p.sign;
    const tropicalDegree = p.signDegree;

    const siderealLon = normalizeDeg(p.longitude - faganBradleyAyanamsa);
    const siderealInfo = getSignAndDegree(siderealLon);

    return {
      name: p.name,
      tropicalSign,
      tropicalDegree: Math.round(tropicalDegree * 100) / 100,
      siderealSign: siderealInfo.sign,
      siderealDegree: Math.round(siderealInfo.degree * 100) / 100,
      signShifted: tropicalSign !== siderealInfo.sign,
    };
  });

  return {
    faganBradleyAyanamsa,
    planets,
  };
}
