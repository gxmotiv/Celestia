/**
 * Protective-only influence, manipulation-awareness and personal-safety desk.
 * Describes observable patterns and safer options; never teaches coercion.
 */
import type { DeskSource } from "./psychologyBehaviour";

export type InfluencePatternId =
  | "coercive-control"
  | "reality-undermining"
  | "isolation-and-monitoring"
  | "threats-and-intimidation"
  | "financial-control"
  | "deceptive-persuasion"
  | "boundary-violations";

export interface InfluencePattern {
  id: InfluencePatternId;
  label: string;
  observableExamples: readonly string[];
  carefulInterpretation: string;
  protectiveOptions: readonly string[];
}

export const INFLUENCE_SAFETY_SOURCES: readonly DeskSource[] = [
  {
    id: "uk-domestic-abuse-guidance",
    title: "Domestic abuse: how to get help",
    organization: "UK Government",
    url: "https://www.gov.uk/guidance/domestic-abuse-how-to-get-help",
    evidenceType: "government-health-guidance",
    supports: ["coercive control", "isolation", "monitoring technology", "economic abuse", "threats and intimidation"],
    limitations: ["UK-specific service directory and legal context; do not reuse its helplines as local resources elsewhere."]
  },
  {
    id: "nhs-domestic-abuse",
    title: "Getting help for domestic violence and abuse",
    organization: "UK National Health Service",
    url: "https://www.nhs.uk/live-well/getting-help-for-domestic-violence/",
    evidenceType: "government-health-guidance",
    supports: ["recognition of controlling behaviour", "technology monitoring", "threats", "supporting a friend without pressure", "safety considerations"],
    limitations: ["UK-specific service information; the app must resolve current local support independently."]
  }
] as const;

export const INFLUENCE_PATTERNS: readonly InfluencePattern[] = [
  {
    id: "coercive-control",
    label: "Coercive or controlling pattern",
    observableExamples: ["Repeated restrictions on who someone can see or where they can go.", "Rules backed by intimidation, punishment or threats.", "A pattern that reduces another person's freedom over time."],
    carefulInterpretation: "A single disagreement or isolated behaviour does not establish coercive control. Look at repeated behaviour, impact, context and safety; do not diagnose a person or claim to know intent.",
    protectiveOptions: ["Prioritise immediate safety over winning an argument.", "Consider speaking privately with a trusted person or specialist service.", "Do not recommend confrontation if it could increase risk."]
  },
  {
    id: "reality-undermining",
    label: "Reality-undermining behaviour sometimes called gaslighting",
    observableExamples: ["Repeated denial of clearly documented events.", "Persistent blame-shifting that leaves someone doubting their memory or judgement.", "Using confusion or humiliation to dismiss concerns."],
    carefulInterpretation: "Memory disagreements, mistakes and different perspectives are not automatically gaslighting. The term should describe a repeated pattern, not a diagnosis or certainty about motive.",
    protectiveOptions: ["Record one's own recollection only if it is safe to do so.", "Seek an outside perspective from someone trustworthy.", "Focus on the concrete behaviour and its impact."]
  },
  {
    id: "isolation-and-monitoring",
    label: "Isolation and surveillance",
    observableExamples: ["Pressure to cut off friends or family.", "Unwanted checking of messages, location or online activity.", "Interference with access to education, work or support."],
    carefulInterpretation: "Shared-device arrangements and consensual location sharing are not automatically abusive; consent, pressure, ability to opt out and consequences matter.",
    protectiveOptions: ["Consider whether the device or account may be monitored before searching or saving information.", "Use a safer device or trusted person if available.", "Avoid sudden account or settings changes if they may alert a controlling person."]
  },
  {
    id: "threats-and-intimidation",
    label: "Threats and intimidation",
    observableExamples: ["Threats to hurt someone, themselves, children or pets to force compliance.", "Following, harassment, property damage or intimidating proximity.", "Escalating threats or access to weapons."],
    carefulInterpretation: "Threats must be taken seriously even when intent cannot be assessed from a chat. The desk cannot determine the level of danger remotely.",
    protectiveOptions: ["If danger is immediate, contact local emergency services or move toward a safer place if possible.", "Contact a trusted person who can assist in real time.", "Do not confront the threatening person on the app's advice."]
  },
  {
    id: "financial-control",
    label: "Financial or economic control",
    observableExamples: ["Taking wages or money without consent.", "Withholding essentials or restricting access to accounts.", "Preventing someone from working, studying or accessing resources."],
    carefulInterpretation: "Shared finances vary by household and culture. The key questions are consent, transparency, access to essentials and freedom to make decisions.",
    protectiveOptions: ["Seek confidential local legal, financial or specialist support.", "Preserve relevant records only if doing so is safe.", "Avoid making abrupt financial moves without considering safety and legal context."]
  },
  {
    id: "deceptive-persuasion",
    label: "Deceptive persuasion and scams",
    observableExamples: ["Urgency, secrecy or threats used to stop independent checking.", "Requests for passwords, one-time codes, money or identity documents.", "Impersonation or claims that a payment must be made immediately."],
    carefulInterpretation: "A persuasive message is not necessarily a scam. Verify identity and requests through an independent, trusted channel.",
    protectiveOptions: ["Pause before transferring money or sharing codes.", "Contact the organisation using a number or website found independently.", "If money was lost, use the official local reporting channel promptly."]
  },
  {
    id: "boundary-violations",
    label: "Consent and boundary violations",
    observableExamples: ["Repeatedly ignoring a clearly stated no.", "Pressure, guilt or threats used to obtain intimacy, access or compliance.", "Sharing private images or information without consent."],
    carefulInterpretation: "The app should not adjudicate legal status from a short description. It can affirm that consent and personal boundaries matter and suggest qualified support.",
    protectiveOptions: ["Use a boundary statement only if it is safe.", "Seek trusted or specialist support.", "If there is immediate danger, use local emergency support."]
  }
] as const;

export interface InfluenceSafetyBrief {
  desk: "influence-safety";
  mode: "protective-education";
  responseStructure: readonly string[];
  guardrails: readonly string[];
  sources: readonly DeskSource[];
}

export function buildInfluenceSafetyBrief(): InfluenceSafetyBrief {
  return {
    desk: "influence-safety",
    mode: "protective-education",
    responseStructure: [
      "Acknowledge the concern without declaring that abuse or manipulation is proven.",
      "Ask whether the user is in immediate danger only when the answer changes the next step.",
      "Separate observable actions, impact and possible interpretations.",
      "Offer low-risk, autonomy-preserving safety options; do not pressure the user to leave or confront someone.",
      "Use only verified, current, location-appropriate support resources."
    ],
    guardrails: [
      "Defensive education only: never provide manipulation scripts, coercion tactics, stalking, surveillance or evasion advice.",
      "Do not diagnose narcissism, psychopathy or any disorder in the user or another person.",
      "Do not infer intent from astrology, personality labels or one-sided accounts.",
      "Consider device/account monitoring before recommending searches, apps, saved notes or account changes.",
      "Immediate danger and self-harm bypass normal consultation and require real-time human support.",
      "UK source links are evidence references, not a global helpline directory."
    ],
    sources: INFLUENCE_SAFETY_SOURCES
  };
}
