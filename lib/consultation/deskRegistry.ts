/**
 * Celestia consultation desk registry and deterministic first-pass router.
 *
 * This module performs intent triage only. It does not calculate charts,
 * diagnose people, infer motives, or call an AI provider.
 */
export type ConsultationDeskId =
  | "western-astrology"
  | "vedic-jyotish"
  | "jaimini"
  | "kp"
  | "bazi"
  | "numerology"
  | "relationships"
  | "transits-timing"
  | "psychology-behaviour"
  | "influence-safety"
  | "life-strategy"
  | "cross-system-synthesis";

export type ConsultationSafetyMode = "standard" | "protective" | "urgent-review" | "refuse-exploitation";

export interface ConsultationDesk {
  id: ConsultationDeskId;
  label: string;
  domain: "astrology" | "psychology" | "safety" | "practical" | "synthesis";
  purpose: string;
  status: "existing-system" | "partial" | "planned";
  methods: readonly string[];
  limitations: readonly string[];
}

export const CONSULTATION_DESKS: readonly ConsultationDesk[] = [
  { id: "western-astrology", label: "Western Astrology", domain: "astrology", purpose: "Traditional and modern Western chart consultation.", status: "existing-system", methods: ["natal chart", "houses", "aspects", "transits"], limitations: ["Advanced techniques must be individually verified before being offered."] },
  { id: "vedic-jyotish", label: "Vedic / Jyotish", domain: "astrology", purpose: "Parashari and supported Jyotish consultation.", status: "existing-system", methods: ["Rashi chart", "Nakshatra", "Vimshottari Dasha", "Yogas"], limitations: ["Divisional charts and advanced strength methods require separate accuracy gates."] },
  { id: "jaimini", label: "Jaimini", domain: "astrology", purpose: "A separate desk for Jaimini methods and lineage-specific rules.", status: "planned", methods: ["Chara Karakas", "Arudhas", "Rashi Drishti", "Jaimini Dashas"], limitations: ["Do not claim a method is available until its implementation and fixtures exist."] },
  { id: "kp", label: "Krishnamurti Paddhati", domain: "astrology", purpose: "Traceable KP cusp, star-lord and sub-lord consultation.", status: "partial", methods: ["Cusps", "Star Lords", "Sub Lords", "Significators"], limitations: ["Predictions and confidence values must disclose heuristic or unverified elements."] },
  { id: "bazi", label: "BaZi / Four Pillars", domain: "astrology", purpose: "Chinese Four Pillars consultation with explicit school and clock conventions.", status: "partial", methods: ["Four Pillars", "Ten Gods", "Five Elements", "Luck Pillars"], limitations: ["Solar-term boundaries and historical timezone handling need further validation."] },
  { id: "numerology", label: "Numerology", domain: "astrology", purpose: "Numerology interpretations with each calculation convention kept distinct.", status: "existing-system", methods: ["Pythagorean profile", "Personal Year"], limitations: ["Symbolic framework; not an evidence-based personality assessment."] },
  { id: "relationships", label: "Relationships & Compatibility", domain: "psychology", purpose: "Relationship patterns, communication and supported compatibility methods.", status: "partial", methods: ["Synastry", "Vedic matching", "Communication reflection"], limitations: ["Never reduce a person or relationship to a score or infer another person's motives."] },
  { id: "transits-timing", label: "Transits & Timing", domain: "astrology", purpose: "Time-based astrological cycles using reproducible calculations.", status: "partial", methods: ["Current transits", "Bi-wheel", "Supported dasha timing"], limitations: ["No guaranteed event predictions; each timing method needs its own validation."] },
  { id: "psychology-behaviour", label: "Psychology & Human Behaviour", domain: "psychology", purpose: "Evidence-informed, non-clinical reflection on emotions, habits, thinking and behaviour.", status: "partial", methods: ["Cognitive biases", "Emotion regulation", "Habits and motivation", "Personality concepts", "Attachment concepts", "Social influence", "Learning and performance", "Stress and coping"], limitations: ["Not a diagnosis or substitute for qualified mental-health care."] },
  { id: "influence-safety", label: "Dark Psychology, Influence & Safety", domain: "safety", purpose: "Protective education to recognise coercion, deception and boundary violations.", status: "partial", methods: ["Coercive control indicators", "Reality-undermining patterns", "Isolation and monitoring", "Threats and intimidation", "Financial control", "Scam awareness", "Consent and boundaries"], limitations: ["Protective education only; no exploitation scripts, coercive control or mind-reading."] },
  { id: "life-strategy", label: "Life & Personal Strategy", domain: "practical", purpose: "Autonomy-supportive decision, goal, study and career planning frameworks.", status: "partial", methods: ["Problem definition", "Facts and assumptions", "Values and constraints", "Option comparison", "Goal and action planning", "Coping plans", "Progress review"], limitations: ["Advice must reflect stated context and uncertainty, not deterministic predictions."] },
  { id: "cross-system-synthesis", label: "Cross-System Synthesis", domain: "synthesis", purpose: "Compare only relevant desks and preserve disagreements between systems.", status: "planned", methods: ["Evidence separation", "Method comparison", "Uncertainty synthesis"], limitations: ["Never manufacture consensus between incompatible traditions."] },
] as const;

export interface ConsultationRoute {
  desks: ConsultationDeskId[];
  safetyMode: ConsultationSafetyMode;
  intent: string;
  reasons: string[];
  requiresHumanSupport: boolean;
}

const RULES: ReadonlyArray<{ desk: ConsultationDeskId; intent: string; pattern: RegExp; reason: string }> = [
  { desk: "influence-safety", intent: "manipulation-or-safety", pattern: /manipulat|gaslight|coerc|threaten|blackmail|pressure tactic|control me|scam|deceiv|forced|afraid of (him|her|them)|unsafe|abuse|abused|domestic violence|stalk|scared to go home|afraid to go home|track(s|ing)? my phone|read(s|ing)? my messages|isolat(ing|ed) me/i, reason: "The question mentions possible manipulation, coercion, deception or personal safety." },
  { desk: "psychology-behaviour", intent: "behaviour-and-emotions", pattern: /emotion|anxious|overthink|confidence|self.?esteem|habit|procrastinat|motivat|attachment|behavio[u]?r|personality|blind spot|why do i keep|repeat(ing)? the same pattern|anger|stress|fear|grief|cognitive bias|peer pressure|group dynamics|social influence|persuasion/i, reason: "The question concerns emotions, habits, thinking patterns or behaviour." },
  { desk: "relationships", intent: "relationship-question", pattern: /relationship|partner|marriage|dating|break.?up|compatib|friendship|family conflict|trust issue|intimacy/i, reason: "The question concerns a relationship or interpersonal pattern." },
  { desk: "jaimini", intent: "jaimini-astrology", pattern: /jaimini|chara karaka|atmakaraka|darakaraka|arudha|rashi drishti/i, reason: "The question explicitly requests Jaimini methods." },
  { desk: "kp", intent: "kp-astrology", pattern: /\bkp\b|krishnamurti|sub.?lord|star lord|cuspal sub/i, reason: "The question explicitly requests KP methods." },
  { desk: "bazi", intent: "bazi-astrology", pattern: /bazi|ba.?zi|four pillars|day master|ten gods|luck pillar/i, reason: "The question explicitly requests BaZi methods." },
  { desk: "vedic-jyotish", intent: "vedic-astrology", pattern: /vedic|jyotish|kundli|kundali|nakshatra|dasha|mahadasha|antardasha|lagna|navamsa|divisional chart|yoga/i, reason: "The question explicitly requests Vedic/Jyotish methods." },
  { desk: "western-astrology", intent: "western-astrology", pattern: /western astrology|tropical|natal chart|birth chart|ascendant|rising sign|midheaven|zodiac sign|planetary aspect|house system/i, reason: "The question explicitly requests Western chart concepts." },
  { desk: "transits-timing", intent: "astrological-timing", pattern: /transit|progression|solar return|lunar return|when is.*(period|window)|timing|forecast|upcoming astrological/i, reason: "The question asks about astrological timing or cycles." },
  { desk: "numerology", intent: "numerology", pattern: /numerolog|life path|expression number|personal year|destiny number/i, reason: "The question explicitly requests numerology." },
  { desk: "life-strategy", intent: "life-planning", pattern: /career|education|study plan|exam|goal|decision|choose between|what should i do|planning|routine|work path|strengths?|weaknesses|blind spots|personal development|self improvement|next step/i, reason: "The question asks for practical planning, choices or personal direction." },
];

const URGENT_PATTERN = /suicid|kill myself|self.?harm|hurt myself|in immediate danger|someone is hurting me right now|threat to my life|threatened to kill me|threatening me right now|can't stay safe|not safe right now|outside my door right now/i;
const HARMFUL_INFLUENCE_PATTERN = /\b(how can i|how do i|teach me to|give me a script to|best way to)\s+(manipulat|gaslight|coerce|blackmail|groom|intimidat|isolate|exploit|emotionally control|make someone dependent)\b|\b(make|force|trick)\s+(someone|them|my partner|my friend)\s+(obey|depend on me|feel guilty|do what i want)\b/i;

export function routeConsultationQuestion(question: string): ConsultationRoute {
  const normalized = question.trim();
  if (!normalized) {
    return { desks: ["life-strategy"], safetyMode: "standard", intent: "empty-or-unclear", reasons: ["No question was provided; ask the user what they need help with."], requiresHumanSupport: false };
  }

  if (URGENT_PATTERN.test(normalized)) {
    return {
      desks: ["influence-safety"],
      safetyMode: "urgent-review",
      intent: "urgent-safety",
      reasons: ["The wording may indicate immediate danger or self-harm; prioritise safety and human support, not astrological interpretation."],
      requiresHumanSupport: true,
    };
  }

  if (HARMFUL_INFLUENCE_PATTERN.test(normalized)) {
    return {
      desks: ["influence-safety"],
      safetyMode: "refuse-exploitation",
      intent: "harmful-manipulation-request",
      reasons: ["The request seeks help controlling, coercing or psychologically exploiting another person; offer ethical communication or defensive education instead."],
      requiresHumanSupport: false,
    };
  }

  const matches = RULES.filter((rule) => rule.pattern.test(normalized));
  const desks = Array.from(new Set(matches.map((match) => match.desk)));
  const safetyMode: ConsultationSafetyMode = desks.includes("influence-safety") ? "protective" : "standard";

  if (desks.length === 0) {
    return {
      desks: ["life-strategy"],
      safetyMode,
      intent: "general-personal-question",
      reasons: ["No specialist intent matched confidently; begin with practical clarification rather than guessing."],
      requiresHumanSupport: false,
    };
  }

  if (desks.length > 1 && desks.some((desk) => ["western-astrology", "vedic-jyotish", "jaimini", "kp", "bazi", "numerology"].includes(desk))) {
    desks.push("cross-system-synthesis");
  }

  return {
    desks,
    safetyMode,
    intent: Array.from(new Set(matches.map((match) => match.intent))).join("+"),
    reasons: Array.from(new Set(matches.map((match) => match.reason))),
    requiresHumanSupport: false,
  };
}

export function getConsultationDesk(id: ConsultationDeskId): ConsultationDesk | undefined {
  return CONSULTATION_DESKS.find((desk) => desk.id === id);
}
