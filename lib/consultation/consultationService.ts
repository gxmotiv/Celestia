import {
  getConsultationDesk,
  routeConsultationQuestion,
  type ConsultationDeskId,
} from "./deskRegistry";

export interface PreparedConsultationRoute {
  question: string;
  routingOnly: true;
  route: ReturnType<typeof routeConsultationQuestion>;
  desks: Array<{
    id: ConsultationDeskId;
    label: string;
    status: "existing-system" | "partial" | "planned";
    purpose: string;
    methods: readonly string[];
    limitations: readonly string[];
  }>;
  canUseExistingSpecialistAI: boolean;
  blockedByPlannedDesks: ConsultationDeskId[];
  nextAction: "urgent-support" | "refuse-exploitation" | "planned-desk-unavailable" | "specialist-review-required" | "existing-desk-route";
}

/**
 * Prepare a transparent routing decision without calling an AI provider.
 * This is deliberately a capability check, not an answer-generation service.
 */
export function prepareConsultationRoute(question: string): PreparedConsultationRoute {
  const route = routeConsultationQuestion(question);
  const desks = route.desks.flatMap((id) => {
    const desk = getConsultationDesk(id);
    return desk ? [{
      id: desk.id,
      label: desk.label,
      status: desk.status,
      purpose: desk.purpose,
      methods: desk.methods,
      limitations: desk.limitations,
    }] : [];
  });
  const blockedByPlannedDesks = desks
    .filter((desk) => desk.status === "planned")
    .map((desk) => desk.id);

  let nextAction: PreparedConsultationRoute["nextAction"];
  if (route.safetyMode === "urgent-review") {
    nextAction = "urgent-support";
  } else if (route.safetyMode === "refuse-exploitation") {
    nextAction = "refuse-exploitation";
  } else if (blockedByPlannedDesks.length > 0) {
    nextAction = "planned-desk-unavailable";
  } else if (desks.some((desk) => desk.status === "partial")) {
    nextAction = "specialist-review-required";
  } else {
    nextAction = "existing-desk-route";
  }

  return {
    question: question.trim(),
    routingOnly: true,
    route,
    desks,
    canUseExistingSpecialistAI: nextAction === "existing-desk-route",
    blockedByPlannedDesks,
    nextAction,
  };
}
