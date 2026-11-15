/**
 * Technique-aware house-system policy for Western astrology.
 *
 * A recommendation is not a claim that one house system is objectively correct.
 * It records a named school/technique convention, whether this repository can
 * calculate it, and whether the method should inherit a chart's existing choice.
 */
export type WesternHouseTechnique =
  | "modern-natal"
  | "koch-school-natal"
  | "western-sidereal-natal"
  | "hellenistic-natal"
  | "hellenistic-time-lord"
  | "western-transits"
  | "solar-lunar-returns"
  | "synastry"
  | "composite"
  | "davison"
  | "lilly-horary"
  | "lilly-electional"
  | "general-electional"
  | "primary-directions"
  | "uranian-hamburg"
  | "cosmobiology"
  | "mundane"
  | "astrocartography";

export type WesternHouseSystemName =
  | "Placidus"
  | "Koch"
  | "Porphyry"
  | "Regiomontanus"
  | "Campanus"
  | "Equal"
  | "WholeSign"
  | "Vehlow"
  | "Meridian"
  | "Horizontal"
  | "Topocentric"
  | "Alcabitius"
  | "Morinus"
  | "Krusinski"
  | "EqualMC"
  | "EqualAries"
  | "Gauquelin"
  | "Sunshine"
  | "APC"
  | "Carter"
  | "PullenSD"
  | "PullenSR"
  | "Sripati";

export type ImplementedWesternHouseSystem =
  | "Placidus"
  | "Equal"
  | "WholeSign"
  | "Porphyry"
  | "Regiomontanus"
  | "Koch";

export type HouseSystemRecommendationMode =
  | "automatic"
  | "inherit-natal"
  | "per-chart"
  | "method-specific"
  | "not-applicable";

export type HouseSystemRecommendationStatus =
  | "supported"
  | "unsupported"
  | "requires-inherited-system"
  | "requires-method-choice"
  | "not-applicable";

export interface WesternHouseSystemRecommendation {
  technique: WesternHouseTechnique;
  mode: HouseSystemRecommendationMode;
  status: HouseSystemRecommendationStatus;
  /** Method convention, even when this repository cannot yet calculate it. */
  preferredSystem?: WesternHouseSystemName;
  /** Actual selectable result only when this repository has the calculation. */
  resolvedSystem?: ImplementedWesternHouseSystem;
  /** True when Celestia's documented polar policy changes Placidus to Porphyry. */
  usedPolarFallback: boolean;
  rationale: string;
}

const IMPLEMENTED_SYSTEMS = new Set<WesternHouseSystemName>([
  "Placidus",
  "Equal",
  "WholeSign",
  "Porphyry",
  "Regiomontanus",
  "Koch",
]);

function automatic(
  technique: WesternHouseTechnique,
  preferredSystem: ImplementedWesternHouseSystem,
  latitude: number | undefined,
  rationale: string
): WesternHouseSystemRecommendation {
  if (latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
    throw new RangeError("House-system recommendation latitude must be finite and between -90° and +90°.");
  }

  const usedPolarFallback =
    preferredSystem === "Placidus" &&
    latitude !== undefined &&
    Math.abs(latitude) >= 66.5622;
  const resolvedSystem: ImplementedWesternHouseSystem =
    usedPolarFallback ? "Porphyry" : preferredSystem;

  return {
    technique,
    mode: "automatic",
    status: "supported",
    preferredSystem,
    resolvedSystem,
    usedPolarFallback,
    rationale: usedPolarFallback
      ? "Celestia's conservative policy selected Porphyry at |latitude| ≥ 66.5622°. This is an application fallback, not a claim that Placidus is impossible at every such location; other implementations may resolve it at some high-latitude dates and coordinates."
      : rationale,
  };
}

function unavailable(
  technique: WesternHouseTechnique,
  mode: HouseSystemRecommendationMode,
  status: HouseSystemRecommendationStatus,
  preferredSystem: WesternHouseSystemName | undefined,
  rationale: string
): WesternHouseSystemRecommendation {
  return {
    technique,
    mode,
    status,
    preferredSystem,
    usedPolarFallback: false,
    rationale,
  };
}

/**
 * A named technique can have a supported house calculation while its broader
 * judgement/search workflow remains absent. The rationale must keep those
 * scopes separate so the UI cannot imply that horary/electional is complete.
 */
function implementedPreset(
  technique: WesternHouseTechnique,
  system: ImplementedWesternHouseSystem,
  rationale: string
): WesternHouseSystemRecommendation {
  return {
    technique,
    mode: "automatic",
    status: "supported",
    preferredSystem: system,
    resolvedSystem: system,
    usedPolarFallback: false,
    rationale,
  };
}

/**
 * Recommend a house-system policy for a named Western technique.
 *
 * This deliberately refuses to silently substitute a different method when a
 * technique's convention is not implemented. For example, a Lilly-style
 * Regiomontanus horary chart is reported as unsupported instead of being
 * presented as a Placidus horary chart.
 */
export function recommendWesternHouseSystem(
  technique: WesternHouseTechnique,
  latitude?: number
): WesternHouseSystemRecommendation {
  switch (technique) {
    case "modern-natal":
    case "western-sidereal-natal":
      return automatic(
        technique,
        "Placidus",
        latitude,
        "Placidus is Celestia's current default for a modern Western natal chart. It is a configurable convention, not a universally superior system."
      );

    case "koch-school-natal": {
      if (latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
        throw new RangeError("Koch house-system recommendation latitude must be finite and between -90° and +90°.");
      }
      const usedKochPolarFallback = latitude !== undefined && Math.abs(latitude) >= 66.5622;
      return {
        technique,
        mode: "automatic",
        status: "supported",
        preferredSystem: "Koch",
        resolvedSystem: usedKochPolarFallback ? "Porphyry" : "Koch",
        usedPolarFallback: usedKochPolarFallback,
        rationale: usedKochPolarFallback
          ? "Koch houses are undefined within the polar circle. Celestia therefore uses Porphyry and reports the actual system used; choose Equal or Whole Sign for other polar-compatible frameworks."
          : "Koch (Birthplace) houses are selected for an explicitly Koch-school natal profile. The standard modern Western Auto profile remains Placidus; Koch is not silently substituted for other schools.",
      };
    }

    case "hellenistic-natal":
    case "hellenistic-time-lord":
      return automatic(
        technique,
        "WholeSign",
        latitude,
        "Whole Sign is the selected framework for this Hellenistic natal/time-lord workflow. Source-specific historical variants must still be kept separate."
      );

    case "western-transits":
    case "solar-lunar-returns":
      return unavailable(
        technique,
        "inherit-natal",
        "requires-inherited-system",
        undefined,
        "Inherit the explicitly resolved natal house-system preference for this chart. Do not silently switch house systems between the natal chart and its transit/return comparison."
      );

    case "synastry":
      return unavailable(
        technique,
        "per-chart",
        "requires-inherited-system",
        undefined,
        "Each person's natal houses must retain that person's own chart settings. House overlays must disclose which person's house framework is used."
      );

    case "composite":
    case "davison":
      return unavailable(
        technique,
        "method-specific",
        "requires-method-choice",
        undefined,
        "Relationship-chart angle and house construction is convention-dependent. Require an explicitly named composite/Davison house method and disclose any derived-angle approximation."
      );

    case "lilly-horary":
      return implementedPreset(
        technique,
        "Regiomontanus",
        "The Regiomontanus house calculation is supported. This does not mean the complete Lilly horary judgement engine is implemented; radicality, significators, receptions, perfection and timing remain separate work."
      );

    case "lilly-electional":
      return implementedPreset(
        technique,
        "Regiomontanus",
        "The named Lilly-derived preset can now calculate Regiomontanus houses. The complete election search, candidate scoring and Lilly-specific judgement workflow are not implemented; other electional sources may prescribe other conventions."
      );

    case "general-electional":
    case "primary-directions":
    case "uranian-hamburg":
    case "cosmobiology":
    case "mundane":
      return unavailable(
        technique,
        "method-specific",
        "requires-method-choice",
        undefined,
        "There is no single house-system setting that can safely represent every source, direction method, chart type or school in this category. The user must choose a documented variant; the engine must not invent a default."
      );

    case "astrocartography":
      return unavailable(
        technique,
        "not-applicable",
        "not-applicable",
        undefined,
        "Astrocartography line geometry is based on angular/meridian relationships and geographic location; an ordinary twelve-house division is not a required input to the line calculation."
      );
  }
}

/** True only for a house system that this repository calculates today. */
export function isWesternHouseSystemImplemented(
  system: WesternHouseSystemName
): system is ImplementedWesternHouseSystem {
  return IMPLEMENTED_SYSTEMS.has(system);
}
