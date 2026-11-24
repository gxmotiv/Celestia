/**
 * Expanded astrology specialist catalogue.
 *
 * This is a discoverability and implementation-planning registry, NOT a claim
 * that every listed technique is currently calculated or AI-ready. Readiness
 * is deliberately conservative and must be upgraded only with deterministic
 * implementation, provenance, fixtures and boundary tests.
 */
import type { ConsultationDeskId } from "./deskRegistry";

export type AstrologySpecialtyStatus =
  | "existing-foundation"
  | "partial-foundation"
  | "research-required"
  | "planned";

export interface AstrologySpecialty {
  id: string;
  parentDesk: ConsultationDeskId;
  label: string;
  scope: string;
  methods: readonly string[];
  status: AstrologySpecialtyStatus;
  requiredGates: readonly string[];
  limitations: readonly string[];
}

const CALCULATION_GATES = [
  "Document the exact tradition, school and calculation convention.",
  "Use deterministic chart/calculation inputs; never ask an LLM to invent placements.",
  "Add authoritative or independently reproducible reference fixtures, including boundary cases.",
  "Expose source provenance, calculation version and uncertainty in the result.",
] as const;

const INTERPRETATION_GATES = [
  "Separate traditional symbolism from empirically established claims.",
  "Cite the method and source tradition; preserve conflicting interpretations.",
  "Avoid certainty, fatalism, diagnosis and guaranteed event predictions.",
] as const;

export const ASTROLOGY_SPECIALTIES: readonly AstrologySpecialty[] = [
  // Western astrology
  { id: "western-natal", parentDesk: "western-astrology", label: "Western Natal Astrology", scope: "Birth-chart structure and interpretation.", methods: ["tropical zodiac", "planetary condition", "houses", "aspects", "sect", "essential dignity"], status: "existing-foundation", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Traditional and modern techniques must remain distinguishable."] },
  { id: "western-traditional", parentDesk: "western-astrology", label: "Traditional / Hellenistic", scope: "Traditional techniques with explicit historical lineage.", methods: ["whole-sign houses", "sect", "lots", "annual profections", "time-lord techniques", "receptions"], status: "partial-foundation", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Annual profections has a deterministic calculator; other listed techniques remain unimplemented or unverified."] },
  { id: "western-modern", parentDesk: "western-astrology", label: "Modern Psychological Astrology", scope: "Modern symbolic interpretation, kept separate from clinical psychology.", methods: ["outer planets", "modern rulership conventions", "psychological symbolism"], status: "partial-foundation", requiredGates: [...INTERPRETATION_GATES], limitations: ["Astrological symbolism is not a psychological assessment."] },
  { id: "western-horary", parentDesk: "western-astrology", label: "Horary Astrology", scope: "Question-chart interpretation under a declared horary tradition.", methods: ["radicality considerations", "significators", "reception", "perfection", "prohibition"], status: "planned", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Requires question timestamp, location policy and tradition-specific rules."] },
  { id: "western-electional", parentDesk: "western-astrology", label: "Electional Astrology", scope: "Comparing candidate times using declared electional rules.", methods: ["candidate chart comparison", "planetary condition", "angularity", "lunar condition"], status: "planned", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Never replace practical, legal, medical or safety considerations."] },
  { id: "western-secondary-progressions", parentDesk: "western-astrology", label: "Secondary Progressions", scope: "Symbolic progressed-chart timing.", methods: ["day-for-year progression", "progressed Moon", "progressed aspects"], status: "partial-foundation", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Progression conventions and date handling must be explicit."] },
  { id: "western-solar-return", parentDesk: "western-astrology", label: "Solar & Lunar Returns", scope: "Return charts calculated for exact return instants.", methods: ["solar return", "lunar return", "relocation comparison"], status: "planned", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Return location policy changes houses and must be disclosed."] },
  { id: "western-mundane", parentDesk: "western-astrology", label: "Mundane Astrology", scope: "Historical and collective-event symbolism.", methods: ["ingresses", "eclipses", "conjunction cycles"], status: "planned", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["No deterministic claims about nations, disasters or public events."] },

  // Vedic and Jaimini
  { id: "vedic-parashari", parentDesk: "vedic-jyotish", label: "Parashari Jyotish", scope: "Classical Parashari natal and timing framework.", methods: ["Rashi", "graha drishti", "house lords", "Vimshottari Dasha", "yoga assessment"], status: "existing-foundation", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Each yoga and strength rule needs explicit source and test coverage."] },
  { id: "vedic-varga", parentDesk: "vedic-jyotish", label: "Varga / Divisional Charts", scope: "Divisional-chart calculation and narrowly scoped interpretation.", methods: ["D2 Hora", "D3 Drekkana", "D4 Chaturthamsha", "D7 Saptamsha", "D9 Navamsha", "D10 Dashamsha", "D12 Dwadashamsha", "D16", "D20", "D24", "D27", "D30", "D40", "D45", "D60"], status: "partial-foundation", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Birth-time sensitivity differs by varga; do not imply equal reliability across charts."] },
  { id: "vedic-shadbala", parentDesk: "vedic-jyotish", label: "Graha Bala & Shadbala", scope: "Planetary strength using documented classical components.", methods: ["Sthana Bala", "Dig Bala", "Kala Bala", "Cheshta Bala", "Naisargika Bala", "Drik Bala"], status: "planned", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Component formulas, units and source editions must be fixed before scoring."] },
  { id: "vedic-ashtakavarga", parentDesk: "vedic-jyotish", label: "Ashtakavarga", scope: "Bindu-based sign and transit assessment.", methods: ["Bhinna Ashtakavarga", "Sarva Ashtakavarga", "Kakshya"], status: "planned", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["All bindu tables and exception rules require fixtures."] },
  { id: "vedic-prashna", parentDesk: "vedic-jyotish", label: "Prashna / Horary Jyotish", scope: "Question-time chart under a named Jyotish lineage.", methods: ["Prashna Lagna", "question significators", "traditional omens where explicitly supported"], status: "planned", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Question time, location and school are mandatory inputs."] },
  { id: "vedic-muhurta", parentDesk: "vedic-jyotish", label: "Muhurta", scope: "Traditional electional time analysis.", methods: ["Tithi", "Vara", "Nakshatra", "Yoga", "Karana", "Panchanga factors"], status: "planned", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Panchanga source, sunrise convention and location must be disclosed."] },
  { id: "vedic-tajika", parentDesk: "vedic-jyotish", label: "Tajika / Varshaphala", scope: "Annual chart interpretation using a declared Tajika tradition.", methods: ["Varsha Pravesh", "Muntha", "Tajika aspects"], status: "planned", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Do not mix Tajika rules silently with Parashari rules."] },
  { id: "jaimini-karakas", parentDesk: "jaimini", label: "Jaimini Chara Karakas", scope: "Separately labelled Jaimini eight-karaka and Parashari seven-karaka calculation conventions.", methods: ["Jaimini 8-karaka sequence", "Rahu reverse-degree treatment", "Parashari 7-karaka sequence", "Atmakaraka and Karakamsa via declared Navamsa method", "explicit degree-tie warnings"], status: "partial-foundation", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Seven-graha option merges Matru/Putra; eight-graha option includes Rahu in reverse degree and a separate Dara role. These are source-text options, not an assertion that all lineages use them identically. Other Karakamsa/Navamsa variants remain unimplemented; exact ties require school-specific rules."] },
  { id: "jaimini-arudha", parentDesk: "jaimini", label: "Jaimini Arudhas & Rashi Drishti", scope: "Arudha and sign-aspect methods.", methods: ["Arudha Lagna", "Upapada Lagna", "Rashi Drishti"], status: "planned", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Exceptions and lineage differences require dedicated fixtures."] },
  { id: "jaimini-dasha", parentDesk: "jaimini", label: "Jaimini Rashi Dashas", scope: "Sign-based timing methods.", methods: ["Chara Dasha", "Sthira Dasha", "Shoola Dasha"], status: "partial-foundation", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Direction, duration and sign-strength variants must be named."] },

  // KP and Chinese metaphysics
  { id: "kp-cusps", parentDesk: "kp", label: "KP Cusps & Sub-Lords", scope: "Sub-lord based cusp and significator analysis.", methods: ["Placidus cusps", "star lord", "sub lord", "sub-sub lord"], status: "partial-foundation", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["A heuristic confidence percentage is not a calibrated probability."] },
  { id: "kp-ruling-planets", parentDesk: "kp", label: "KP Ruling Planets", scope: "Ruling-planet method under a documented KP rule set.", methods: ["day lord", "Moon star/sub lord", "Ascendant star/sub lord"], status: "planned", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Exact timestamp and location are essential."] },
  { id: "bazi-pillars", parentDesk: "bazi", label: "BaZi Four Pillars", scope: "Year, month, day and hour pillars with clock and solar-term policy.", methods: ["Heavenly Stems", "Earthly Branches", "Day Master", "Ten Gods"], status: "partial-foundation", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["The current solar-term model uses modern apparent-Sun (dingqi) boundaries; historical pre-1645 pingqi calendar reconstruction is not implemented.", "Historical timezone, solar-term boundaries and Zi-hour conventions need validation.", "The secondary TransitView CompleteBaZiEngine remains visible but is not a validated natal Four Pillars source: it uses UTC date/hour and a date-only noon-UTC fallback, and its day/hour pillars are not parity-validated; keep this panel explicitly approximate or hidden until corrected."] },
  { id: "bazi-luck", parentDesk: "bazi", label: "BaZi Luck Pillars & Timing", scope: "Luck pillar direction, start age and cycle timing.", methods: ["Da Yun", "annual luck", "monthly luck"], status: "planned", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Gender/year-polarity conventions and exact start-age rules vary by school."] },
  { id: "bazi-qi-men", parentDesk: "bazi", label: "Qi Men Dun Jia", scope: "Separate Chinese metaphysics specialty, not a BaZi sub-method.", methods: ["Ju", "doors", "stars", "deities", "palaces"], status: "planned", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Requires its own engine and source corpus; do not infer from BaZi pillars."] },

  // Other consultation specialties
  { id: "numerology-core", parentDesk: "numerology", label: "Core Numerology", scope: "Named numerology systems with transparent reduction rules.", methods: ["Pythagorean", "Chaldean", "Life Path", "Expression", "Personal Year"], status: "existing-foundation", requiredGates: [...INTERPRETATION_GATES], limitations: ["Numerology is symbolic and not a validated personality or forecasting science."] },
  { id: "relationship-synastry", parentDesk: "relationships", label: "Western Synastry & Composite", scope: "Relationship chart comparison without deterministic compatibility scoring.", methods: ["synastry aspects", "house overlays", "composite chart"], status: "partial-foundation", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Never infer consent, fidelity, motives or relationship outcomes from charts."] },
  { id: "relationship-vedic", parentDesk: "relationships", label: "Vedic Compatibility", scope: "Traditional matching systems with explicit school and scoring rules.", methods: ["Ashtakoota", "Manglik considerations", "Nadi and Bhakoot rules"], status: "research-required", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Do not reduce people to a score or present social/cultural customs as universal facts."] },
  { id: "transit-eclipses", parentDesk: "transits-timing", label: "Transits, Stations & Eclipses", scope: "Ephemeris-based transit and eclipse calculations.", methods: ["planetary transits", "retrograde stations", "solar and lunar eclipses"], status: "partial-foundation", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Astronomical event calculation and astrological interpretation are separate layers."] },
  { id: "timing-dasha-transit", parentDesk: "transits-timing", label: "Dasha + Transit Synthesis", scope: "Compare supported timing systems without manufacturing agreement.", methods: ["Vimshottari periods", "transit triggers", "period overlap"], status: "partial-foundation", requiredGates: [...CALCULATION_GATES, ...INTERPRETATION_GATES], limitations: ["Only validated dasha systems may be included in a result."] },
] as const;

const SPECIALTY_INTENTS: ReadonlyArray<{ id: string; pattern: RegExp }> = [
  { id: "western-natal", pattern: /western natal|tropical natal|birth chart|natal chart|ascendant|rising sign|midheaven/i },
  { id: "western-traditional", pattern: /annual profection|profection|hellenistic|whole.?sign|sect|essential dignit|traditional western|time lord/i },
  { id: "western-horary", pattern: /horary/i },
  { id: "western-electional", pattern: /electional/i },
  { id: "western-secondary-progressions", pattern: /secondary progression|progressed chart|progressed moon/i },
  { id: "western-solar-return", pattern: /solar return|lunar return/i },
  { id: "western-mundane", pattern: /mundane astrology|world astrology|ingress chart/i },
  { id: "vedic-parashari", pattern: /parashari|parashara|vedic natal|jyotish natal/i },
  { id: "vedic-varga", pattern: /divisional chart|\bD(?:2|3|4|7|9|10|12|16|20|24|27|30|40|45|60)\b|navamsa|drekkana|dashamsha|hora chart/i },
  { id: "vedic-shadbala", pattern: /shadbala|shad bala|graha bala|planetary strength/i },
  { id: "vedic-ashtakavarga", pattern: /ashtakavarga|sarvashtakavarga|bhinna ashtakavarga/i },
  { id: "vedic-prashna", pattern: /prashna/i },
  { id: "vedic-muhurta", pattern: /muhurta|panchanga|panchang/i },
  { id: "vedic-tajika", pattern: /tajika|varshaphala|varsha pravesh/i },
  { id: "jaimini-karakas", pattern: /jaimini|chara karaka|atmakaraka|amatyakaraka|darakaraka|karakamsa/i },
  { id: "jaimini-arudha", pattern: /arudha|upapada|rashi drishti/i },
  { id: "jaimini-dasha", pattern: /chara dasha|sthira dasha|shoola dasha|jaimini dasha/i },
  { id: "kp-cusps", pattern: /\bKP\b|krishnamurti|sub.?lord|star lord|cuspal/i },
  { id: "kp-ruling-planets", pattern: /ruling planets/i },
  { id: "bazi-pillars", pattern: /ba.?zi|four pillars|day master|ten gods/i },
  { id: "bazi-luck", pattern: /da yun|luck pillars|luck pillar/i },
  { id: "bazi-qi-men", pattern: /qi.?men|qimen/i },
  { id: "numerology-core", pattern: /numerolog|life path|expression number|personal year/i },
  { id: "relationship-synastry", pattern: /synastry|composite chart|western compatibility/i },
  { id: "relationship-vedic", pattern: /ashtakoota|guna milan|kundli matching|vedic compatibility|manglik/i },
  { id: "transit-eclipses", pattern: /transit|eclipse|retrograde station/i },
  { id: "timing-dasha-transit", pattern: /dasha.*transit|transit.*dasha|timing synthesis/i },
];

export function matchAstrologySpecialties(question: string): AstrologySpecialty[] {
  const normalized = question.trim();
  if (!normalized) return [];
  const matchedIds = new Set(
    SPECIALTY_INTENTS.filter((intent) => intent.pattern.test(normalized)).map((intent) => intent.id)
  );
  return ASTROLOGY_SPECIALTIES.filter((specialty) => matchedIds.has(specialty.id));
}

export function getAstrologySpecialties(parentDesk?: ConsultationDeskId): AstrologySpecialty[] {
  return ASTROLOGY_SPECIALTIES.filter((specialty) => !parentDesk || specialty.parentDesk === parentDesk);
}

export function getAstrologySpecialty(id: string): AstrologySpecialty | undefined {
  return ASTROLOGY_SPECIALTIES.find((specialty) => specialty.id === id);
}
