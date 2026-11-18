/**
 * Evidence-informed, non-clinical Psychology & Human Behaviour desk.
 * This module supplies bounded educational frameworks; it does not diagnose,
 * assess clinical severity, infer hidden motives, or provide psychotherapy.
 */
export type PsychologyTopicId =
  | "thinking-and-biases"
  | "emotions-and-regulation"
  | "habits-and-motivation"
  | "personality-and-individual-differences"
  | "attachment-and-relationships"
  | "social-influence-and-groups"
  | "learning-and-performance"
  | "stress-and-coping";

export interface DeskSource {
  id: string;
  title: string;
  organization: string;
  url: string;
  evidenceType: "professional-guidance" | "government-health-guidance" | "peer-reviewed-review" | "research-policy";
  supports: string[];
  limitations: string[];
}

export interface PsychologyTopic {
  id: PsychologyTopicId;
  label: string;
  scope: string;
  safeApproach: string[];
  avoid: string[];
  sourceIds: string[];
}

export const PSYCHOLOGY_SOURCES: readonly DeskSource[] = [
  {
    id: "nimh-psychotherapies",
    title: "Psychotherapies",
    organization: "US National Institute of Mental Health",
    url: "https://www.nimh.nih.gov/health/topics/psychotherapies",
    evidenceType: "government-health-guidance",
    supports: ["automatic-thought reflection", "stress coping", "problem solving", "communication skills", "emotion and behaviour tracking"],
    limitations: ["Describes elements of professional psychotherapy; does not authorize an AI system to deliver psychotherapy or diagnose."]
  },
  {
    id: "nimh-mental-health",
    title: "Caring for Your Mental Health",
    organization: "US National Institute of Mental Health",
    url: "https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health",
    evidenceType: "government-health-guidance",
    supports: ["self-care", "sleep and activity routines", "priorities", "social support", "when to seek professional help"],
    limitations: ["General public guidance; individual needs and access to care differ."]
  },
  {
    id: "apa-evidence-practice",
    title: "Policy Statement on Evidence-Based Practice in Psychology",
    organization: "American Psychological Association",
    url: "https://www.apa.org/practice/guidelines/evidence-based-statement",
    evidenceType: "professional-guidance",
    supports: ["best available research", "individual context", "limits of knowledge", "shared decision making"],
    limitations: ["Professional practice policy, not a self-diagnosis checklist."]
  },
  {
    id: "apa-stress",
    title: "Healthy Ways to Handle Life's Stressors",
    organization: "American Psychological Association",
    url: "https://www.apa.org/topics/stress/tips",
    evidenceType: "professional-guidance",
    supports: ["stress appraisal", "social support", "mindfulness", "reframing", "seeking help"],
    limitations: ["General coping suggestions are not a substitute for assessment or treatment."]
  }
] as const;

export const PSYCHOLOGY_TOPICS: readonly PsychologyTopic[] = [
  {
    id: "thinking-and-biases",
    label: "Thinking patterns and cognitive biases",
    scope: "Explore assumptions, interpretations, attention, memory, confirmation bias and alternative explanations.",
    safeApproach: ["Separate observable facts from interpretations.", "Offer at least one plausible alternative explanation.", "Ask what evidence would change the conclusion."],
    avoid: ["Do not label a person as irrational or claim one bias explains their whole behaviour.", "Do not treat a brief chat as a validated psychological assessment."],
    sourceIds: ["nimh-psychotherapies", "apa-evidence-practice"]
  },
  {
    id: "emotions-and-regulation",
    label: "Emotions and self-regulation",
    scope: "Help name emotions, identify situational triggers and consider low-risk coping options.",
    safeApproach: ["Validate the feeling without confirming an unverified story.", "Offer grounding, reflection, problem-solving or trusted support as options.", "Escalate crisis or immediate-risk language to the safety flow."],
    avoid: ["Do not provide trauma processing or claim to deliver therapy.", "Do not imply that a user can control every emotional response."],
    sourceIds: ["nimh-psychotherapies", "apa-stress"]
  },
  {
    id: "habits-and-motivation",
    label: "Habits, motivation and procrastination",
    scope: "Examine cues, friction, rewards, avoidance, goals and the environment around a repeated behaviour.",
    safeApproach: ["Choose one small user-selected behaviour.", "Identify barriers and an if-then coping option.", "Review progress without shame or guarantees."],
    avoid: ["Do not reduce difficulties to laziness or weak character.", "Do not promise a fixed number of days to form a habit."],
    sourceIds: ["nimh-mental-health", "apa-evidence-practice"]
  },
  {
    id: "personality-and-individual-differences",
    label: "Personality and individual differences",
    scope: "Discuss traits, values, preferences and context as tentative ways to reflect on patterns.",
    safeApproach: ["Distinguish a validated instrument from an informal reflection prompt.", "Describe traits dimensionally and contextually.", "Allow the user to reject a description that does not fit."],
    avoid: ["No personality-disorder diagnosis.", "No certainty from astrology, a single message, or an unvalidated quiz."],
    sourceIds: ["apa-evidence-practice"]
  },
  {
    id: "attachment-and-relationships",
    label: "Attachment concepts and relationships",
    scope: "Explain attachment concepts as broad research frameworks and support reflection on communication and needs.",
    safeApproach: ["Describe patterns as hypotheses, not fixed identities.", "Focus on specific interactions, needs and boundaries.", "Consider situational and cultural alternatives."],
    avoid: ["Do not assign attachment styles to absent third parties.", "Do not infer motives or predict relationship outcomes."],
    sourceIds: ["apa-evidence-practice", "nimh-psychotherapies"]
  },
  {
    id: "social-influence-and-groups",
    label: "Social influence and group behaviour",
    scope: "Explore peer pressure, conformity, social roles, persuasion and group dynamics.",
    safeApproach: ["Explain mechanisms neutrally.", "Distinguish influence from coercion.", "Offer consent-respecting communication and refusal skills."],
    avoid: ["Do not provide instructions to exploit vulnerabilities or override consent."],
    sourceIds: ["apa-evidence-practice"]
  },
  {
    id: "learning-and-performance",
    label: "Learning, focus and performance",
    scope: "Support study routines, feedback, task breakdown and exam preparation without diagnosing learning disorders.",
    safeApproach: ["Start with the task, time and available resources.", "Use short feedback loops and adjustable plans.", "Distinguish skill gaps from stress, fatigue or missing resources."],
    avoid: ["Do not diagnose ADHD, dyslexia or other conditions.", "Do not promise exam outcomes."],
    sourceIds: ["nimh-mental-health", "apa-evidence-practice"]
  },
  {
    id: "stress-and-coping",
    label: "Stress and coping",
    scope: "Identify changeable and unchangeable stressors, coping resources and when professional support may help.",
    safeApproach: ["Offer practical choices, social support and realistic priorities.", "Do not assume the stressor is under the user's control.", "Recommend qualified help for severe, persistent or unsafe situations."],
    avoid: ["Do not assess clinical severity or replace a clinician.", "Do not frame structural hardship as a mindset failure."],
    sourceIds: ["apa-stress", "nimh-mental-health"]
  }
] as const;

export interface PsychologyConsultationBrief {
  desk: "psychology-behaviour";
  mode: "educational-reflection";
  scope: string;
  responseStructure: readonly string[];
  guardrails: readonly string[];
  sources: readonly DeskSource[];
}

/** Build an inspectable brief for future orchestration; no model call occurs. */
export function buildPsychologyConsultationBrief(topicIds: readonly PsychologyTopicId[] = PSYCHOLOGY_TOPICS.map((topic) => topic.id)): PsychologyConsultationBrief {
  const selected = PSYCHOLOGY_TOPICS.filter((topic) => topicIds.includes(topic.id));
  const sourceIds = new Set(selected.flatMap((topic) => topic.sourceIds));
  return {
    desk: "psychology-behaviour",
    mode: "educational-reflection",
    scope: selected.map((topic) => topic.scope).join(" "),
    responseStructure: [
      "Answer the user's actual question in plain language.",
      "Separate user-stated observations, evidence-informed concepts and uncertain hypotheses.",
      "Offer alternative explanations where the cause or another person's motives are unknown.",
      "Give one or two low-risk, user-controlled next steps.",
      "State limitations and cite only sources that support the specific claim."
    ],
    guardrails: [
      "Not a diagnosis, clinical assessment, psychotherapy or crisis service.",
      "Never infer hidden motives or diagnose the user or a third party from chat, a quiz or astrology.",
      "Do not present symbolic astrology or numerology as scientific psychological evidence.",
      "For immediate danger or self-harm risk, bypass this desk and use the safety flow.",
      "Do not use shame, coercion, deterministic labels or unsupported certainty."
    ],
    sources: PSYCHOLOGY_SOURCES.filter((source) => sourceIds.has(source.id))
  };
}
