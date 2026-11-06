/**
 * Krishnamurti Padhdhati (KP) System Types & Interfaces
 */

export interface KPCusp {
  house: number; // 1 to 12
  longitude: number; // 0 to 360 in KP Sidereal
  signIndex: number; // 0 = Aries, 11 = Pisces
  signName: string;
  degreeInSign: number; // 0 to 29.999
  degreeFormatted: string;
  signLord: string;
  nakshatraIndex: number; // 0 to 26
  nakshatraName: string;
  starLord: string;
  subLord: string;
  subSubLord: string;
  spanStart: number;
  spanEnd: number;
}

export interface KPCusps {
  cusps: number[]; // 12 cusp longitudes (KP Sidereal)
  houseDetails: KPCusp[];
  houseSigns: string[];
  houseLords: string[];
  ayanamsa: number;
  ayanamsaName: string;
}

export interface KPPlanet {
  id: string;
  name: string;
  symbol: string;
  tropicalLon: number;
  siderealLon: number;
  signIndex: number;
  sign: string;
  degreeInSign: number;
  degreeFormatted: string;
  house: number; // 1 to 12 based on KP cuspal boundaries
  nakshatraIndex: number;
  nakshatraName: string;
  pada: number;
  signLord: string;
  starLord: string;
  subLord: string;
  subSubLord: string;
  isRetrograde: boolean;
  speed: number;
}

export interface SubLordResult {
  starLord: string;
  subLord: string;
  subSubLord: string;
  longitude: number;
  nakshatraIndex: number;
  nakshatraName: string;
  pada: number;
  degreeInNakshatra: number;
  degreeInSub: number;
  subDivisionSpan: number;
}

export interface SignificatorLevels {
  levelA: string[]; // Planets in star of occupants (Grade I - Strongest)
  levelB: string[]; // Occupants of the house (Grade II)
  levelC: string[]; // Planets in star of house lord (Grade III)
  levelD: string[]; // House Lord (Grade IV)
}

export interface KPHouseSignificators {
  house: number;
  houseLord: string;
  occupants: string[];
  planetsInStar: string[];
  planetsInSub: string[];
  levels: SignificatorLevels;
  allSignificators: string[];
}

export interface KPPlanetSignification {
  planet: string;
  occupiesHouse: number;
  ownsHouses: number[];
  starLord: string;
  starLordOccupiesHouse: number;
  starLordOwnsHouses: number[];
  subLord: string;
  subLordOccupiesHouse: number;
  subLordOwnsHouses: number[];
  signifiedHouses: number[]; // Unique ordered list of all signified houses
}

export interface KPPrediction {
  house: number;
  event: string;
  primaryCuspalSubLord: string;
  cslStarLord: string;
  cslSubLord: string;
  favorableHouses: number[];
  negationHouses: number[];
  cslSignifiedHouses: number[];
  isPromiseFavorable: boolean;
  timing: string;
  ruleScore: number; // Deterministic heuristic score; not a calibrated probability
  details: string;
  dashaAnalysis: {
    dashaLord: string;
    isDashaSignificator: boolean;
    antardashaLord: string;
    isAntardashaSignificator: boolean;
    pratyantardashaLord?: string;
    isPratyantarSignificator?: boolean;
    verdict: string;
  };
  verdict: "Highly Favorable" | "Favorable" | "Mixed / Moderate" | "Unfavorable";
  kpRuleBreakdown: string[];
}

export interface KPRulingPlanets {
  dayLord: string;
  moonSignLord: string;
  moonStarLord: string;
  moonSubLord: string;
  lagnaSignLord: string;
  lagnaStarLord: string;
  lagnaSubLord: string;
  rulingPlanetsOrdered: string[];
}

export interface KPChartData {
  ayanamsa: number;
  ayanamsaFormatted: string;
  cusps: KPCusps;
  planets: KPPlanet[];
  houseSignificators: Record<number, KPHouseSignificators>;
  planetSignifications: Record<string, KPPlanetSignification>;
  rulingPlanets: KPRulingPlanets;
  currentDashaLord: string;
  currentAntardashaLord: string;
  currentPratyantardashaLord?: string;
}

// ============================================================
// MODERN KP & ADVANCED EXTENSIONS (4-Step, CIL, Horary, PS)
// ============================================================

export interface PositionalStatus {
  planet: string;
  hasPositionalStatus: boolean;
  reason: "In own star" | "No planets in its star" | "None";
  tenantsInStar: string[];
}

export interface KPStepDetail {
  planet: string;
  occupiesHouse: number;
  ownsHouses: number[];
  allHouses: number[];
  isRetrograde?: boolean;
  hasPositionalStatus?: boolean;
}

export interface KPFourStepData {
  subject: string; // Planet name or "Cusp X (Matter)"
  type: "planet" | "cusp";
  step1: KPStepDetail; // The Planet itself (Source)
  step2: KPStepDetail; // Star Lord of Planet (The Offer)
  step3: KPStepDetail; // Sub Lord of Planet (The Deciding Factor / Fruit)
  step4: KPStepDetail; // Star Lord of Sub Lord (Final End / Confirmation)
  hasPositionalStatus: boolean;
  signifiedHouses: number[];
  favorableHousesForMatter?: number[];
  detrimentalHousesForMatter?: number[];
  stepVerdict: "Favorable" | "Unfavorable" | "Delayed / Mixed";
  analysisText: string;
  gondhalekarRule: string;
}

export interface CuspalInterlink {
  house: number;
  title: string;
  signLord: string;
  starLord: string;
  csl: string; // Cuspal Sub Lord
  cslStarLord: string;
  cslSubLord: string;
  cssl: string; // Cuspal Sub-Sub Lord
  csslStarLord: string;
  linkedHouses: number[];
  supportingHouses: number[];
  detrimentalHouses: number[];
  promiseVerdict: "Promised" | "Denied / Negated" | "Delayed with Obstacles";
  interlinkChain: string;
  classicalPrinciple: string;
}

export interface KPHoraryResult {
  horaryNumber: number;
  tableType: "1-249" | "1-2193";
  queryCategory: string;
  queryQuestion: string;
  horaryAscendant: {
    longitude: number;
    sign: string;
    signIndex: number;
    degreeFormatted: string;
    signLord: string;
    starLord: string;
    subLord: string;
    subSubLord?: string;
    spanStartFormatted: string;
    spanEndFormatted: string;
  };
  horaryChart: KPChartData;
  primaryCusp: number;
  primaryCsl: string;
  rulingPlanetsMatch: {
    rpList: string[];
    matchingSignificators: string[];
    isMoonCslAligned: boolean;
  };
  verdict: "YES - Strongly Promised" | "YES - Delayed / After Effort" | "NO - Denied / Not Feasible";
  ruleScore: number; // Deterministic horary heuristic; not statistical confidence
  detailedJudgment: string[];
  recommendedAction: string;
}

export interface KPRulingPlanetDetail {
  role: string;
  planet: string;
  starLord: string;
  subLord: string;
  isRetrograde: boolean;
  isStarLordRetrograde: boolean;
  representedByNodes: string[];
  statusGrade: "Potent & Direct" | "Modified (Represented by Node)" | "Delayed / Filtered (Retrograde)";
}
