/**
 * Autonomy-supportive practical planning desk.
 * It helps structure choices and plans; it does not guarantee outcomes.
 */
import type { DeskSource } from "./psychologyBehaviour";

export type StrategyMode = "decision" | "goal-plan" | "study-plan" | "career-exploration" | "routine-review";

export const LIFE_STRATEGY_SOURCES: readonly DeskSource[] = [
  {
    id: "bailey-goal-action-planning",
    title: "Goal Setting and Action Planning for Health Behavior Change",
    organization: "American Journal of Lifestyle Medicine (PubMed Central)",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6796229/",
    evidenceType: "peer-reviewed-review",
    supports: ["specific goals", "approach and mastery goals", "action planning", "coping plans", "review and adjustment"],
    limitations: ["Health-behaviour context; principles may not transfer unchanged to every education, career or life decision.", "Planning supports action but cannot guarantee behaviour change."]
  },
  {
    id: "nimh-mental-health-priorities",
    title: "Caring for Your Mental Health",
    organization: "US National Institute of Mental Health",
    url: "https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health",
    evidenceType: "government-health-guidance",
    supports: ["setting goals and priorities", "sleep and self-care routines", "social support", "recognising when professional help is needed"],
    limitations: ["General wellbeing guidance, not career or financial advice."]
  },
  {
    id: "apa-evidence-practice",
    title: "Policy Statement on Evidence-Based Practice in Psychology",
    organization: "American Psychological Association",
    url: "https://www.apa.org/practice/guidelines/evidence-based-statement",
    evidenceType: "professional-guidance",
    supports: ["collaborative decisions", "individual context", "uncertainty and limits of evidence"],
    limitations: ["Professional practice policy; not a universal decision formula."]
  }
] as const;

export interface StrategyStep {
  id: string;
  title: string;
  prompt: string;
  output: string;
}

export const LIFE_STRATEGY_STEPS: readonly StrategyStep[] = [
  { id: "define", title: "Define the real problem", prompt: "What decision or outcome are you trying to address, and by when?", output: "A concise problem statement and time horizon." },
  { id: "separate", title: "Separate facts from assumptions", prompt: "What do you know, what are you assuming, and what is still unknown?", output: "Facts, assumptions, feelings and unknowns kept distinct." },
  { id: "constraints", title: "Map values and constraints", prompt: "What matters most, and what limits time, money, energy, access or support?", output: "User-stated priorities and practical constraints." },
  { id: "options", title: "Compare realistic options", prompt: "What are the feasible options, benefits, costs, risks and reversibility?", output: "A balanced comparison, including the option to wait or gather information." },
  { id: "choose", title: "Choose a small next step", prompt: "Which step is useful, low-risk and within your control?", output: "One user-selected next action." },
  { id: "cope", title: "Plan for obstacles", prompt: "If the main obstacle appears, what is a realistic alternative?", output: "An if-then coping plan." },
  { id: "review", title: "Set a review point", prompt: "When will you review what happened and adjust the plan?", output: "A review date and simple progress signal." }
] as const;

export interface LifeStrategyBrief {
  desk: "life-strategy";
  mode: StrategyMode;
  responseStructure: readonly string[];
  steps: readonly StrategyStep[];
  guardrails: readonly string[];
  sources: readonly DeskSource[];
}

export function buildLifeStrategyBrief(mode: StrategyMode = "goal-plan"): LifeStrategyBrief {
  const modeInstruction: Record<StrategyMode, string> = {
    decision: "Compare options and trade-offs; do not choose on the user's behalf.",
    "goal-plan": "Translate a user-selected goal into a short action plan and coping plan.",
    "study-plan": "Build a realistic study plan from syllabus, time available, baseline and exam date; do not promise marks.",
    "career-exploration": "Explore interests, skills, constraints and information-gathering steps; avoid deterministic career predictions.",
    "routine-review": "Review cues, workload, energy and barriers; change one practical variable at a time."
  };
  return {
    desk: "life-strategy",
    mode,
    responseStructure: [
      modeInstruction[mode],
      "State which facts came from the user and which points are assumptions.",
      "Show trade-offs and uncertainty without false precision.",
      "End with one specific, achievable next action and a review point."
    ],
    steps: LIFE_STRATEGY_STEPS,
    guardrails: [
      "The user retains decision authority; do not pressure, shame or manipulate.",
      "Do not guarantee exam, career, relationship, financial or health outcomes.",
      "For legal, medical, financial or crisis decisions, explain limits and direct the user to qualified support when needed.",
      "For minors, use age-appropriate guidance and encourage a trusted adult when safety or high-stakes decisions require it.",
      "Do not use astrology or numerology as evidence for factual claims about ability, diagnosis or future outcomes."
    ],
    sources: LIFE_STRATEGY_SOURCES
  };
}
