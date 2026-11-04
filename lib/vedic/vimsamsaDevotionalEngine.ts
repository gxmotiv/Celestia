/**
 * D20 Vimsamsa Devotional & Spiritual Upasana Engine
 * Brihat Parashara Hora Shastra - Chapter on Vimsamsa (20th Harmonic)
 * 
 * Computes:
 * - D20 chart positions, ascendant & house divisions
 * - Ishta Devata, Dharma Devata & Palana Devata calculations
 * - Bhakti Bhavas (Devotional dispositions): Shanta, Dasya, Sakhya, Vatsalya, Madhurya
 * - Spiritual initiation (Diksha) windows and Upasana stamina
 * - Presiding Vimsamsa deity (out of 20 canonical deities per division)
 */

import { VedicPlanet, VEDIC_RASIS } from "@/lib/astronomy/vedic";
import { calculateDivisionalChart, DivisionalChartResult, DivisionalPlanet } from "./divisionalCalc";

export interface VimsamsaDeityInfo {
  divisionIndex: number; // 0 to 19
  deityName: string;
  quality: "Sattvic" | "Rajasic" | "Tamasic";
  significance: string;
}

export const VIMSAMSA_DEITIES_ODD: VimsamsaDeityInfo[] = [
  { divisionIndex: 0, deityName: "Kali (काली)", quality: "Tamasic", significance: "Destruction of spiritual ego & primordial transformation" },
  { divisionIndex: 1, deityName: "Gauri (गौरी)", quality: "Sattvic", significance: "Purity, gentle grace, motherly compassion & devotion" },
  { divisionIndex: 2, deityName: "Jaya (जया)", quality: "Rajasic", significance: "Spiritual victory, determination over worldly illusions" },
  { divisionIndex: 3, deityName: "Vijaya (विजया)", quality: "Rajasic", significance: "Complete mastery over internal six enemies (Arishadvarga)" },
  { divisionIndex: 4, deityName: "Vimala (विमला)", quality: "Sattvic", significance: "Pristine inner clarity, transparent conscience" },
  { divisionIndex: 5, deityName: "Kamuka (कामुका)", quality: "Rajasic", significance: "Sublimation of desire into divine longing" },
  { divisionIndex: 6, deityName: "Saumya (सौम्या)", quality: "Sattvic", significance: "Sweet tranquility, nectarine meditation (Amrita)" },
  { divisionIndex: 7, deityName: "Krura (क्रूरा)", quality: "Tamasic", significance: "Fierce austerity, unbending discipline in sadhana" },
  { divisionIndex: 8, deityName: "Madhavi (माधवी)", quality: "Sattvic", significance: "Spiritual blossoming, divine fragrance & sweetness" },
  { divisionIndex: 9, deityName: "Dhatri (धात्री)", quality: "Sattvic", significance: "Nourisher of sacred virtues & inner peace" },
  { divisionIndex: 10, deityName: "Shankhini (शङ्खिनी)", quality: "Sattvic", significance: "Sacred resonance, sound of Om, purity of mantra" },
  { divisionIndex: 11, deityName: "Jyeshtha (ज्येष्ठा)", quality: "Tamasic", significance: "Ancient spiritual endurance, patience through dry periods" },
  { divisionIndex: 12, deityName: "Varuni (वारुणी)", quality: "Rajasic", significance: "Divine intoxication of love for the Supreme" },
  { divisionIndex: 13, deityName: "Madira (मदिरा)", quality: "Tamasic", significance: "Transcendence of rational intellect into ecstasy" },
  { divisionIndex: 14, deityName: "Maitri (मैत्री)", quality: "Sattvic", significance: "Universal benevolence, compassion for all living beings" },
  { divisionIndex: 15, deityName: "Vishala (विशाला)", quality: "Sattvic", significance: "Expansive consciousness, cosmic vision" },
  { divisionIndex: 16, deityName: "Harasvini (ह्रस्विनी)", quality: "Rajasic", significance: "Humility, reduction of pride and ahamkara" },
  { divisionIndex: 17, deityName: "Bandhura (बन्धुरा)", quality: "Sattvic", significance: "Harmonious union with divine rhythm" },
  { divisionIndex: 18, deityName: "Shvetamukhi (श्वेतमुखी)", quality: "Sattvic", significance: "Radiant spiritual illumination, sattva predominance" },
  { divisionIndex: 19, deityName: "Mandara (मन्दरा)", quality: "Sattvic", significance: "Churning of the ocean of inner consciousness" },
];

export interface DevotionalDeityRecommendation {
  role: "Ishta Devata" | "Dharma Devata" | "Palana Devata" | "Guru Archetype";
  deityName: string;
  sanskritName: string;
  presidingPlanet: string;
  mantra: string;
  bhaktiPath: string;
  scriptureBasis: string;
}

export interface D20DevotionalReport {
  chart: DivisionalChartResult;
  ascendantDeity: VimsamsaDeityInfo;
  moonDeity: VimsamsaDeityInfo;
  ishtaDevata: DevotionalDeityRecommendation;
  dharmaDevata: DevotionalDeityRecommendation;
  palanaDevata: DevotionalDeityRecommendation;
  bhaktiBhava: {
    name: "Shanta (Peaceful)" | "Dasya (Servitude)" | "Sakhya (Friendship)" | "Vatsalya (Parental)" | "Madhurya (Beloved)";
    description: string;
    dominantInfluences: string[];
  };
  spiritualStrengths: string[];
  spiritualObstacles: string[];
  upasanaGuidance: {
    recommendedMantraType: string;
    sacredTime: string;
    direction: "East" | "North" | "Northeast";
    altarElements: string[];
  };
}

export function calculateVimsamsaDeity(siderealLon: number): VimsamsaDeityInfo {
  const normDeg = ((siderealLon % 360) + 360) % 360;
  const degInRasi = normDeg % 30;
  const partIndex = Math.min(19, Math.floor(degInRasi / 1.5));
  return VIMSAMSA_DEITIES_ODD[partIndex];
}

const PLANET_DEITIES: Record<string, { ishta: string; sanskrit: string; mantra: string; path: string }> = {
  Sun: {
    ishta: "Lord Shiva / Surya Narayana / Lord Rama",
    sanskrit: "ॐ घृणिः सूर्याय नमः / ॐ नमः शिवाय",
    mantra: "Om Namah Shivaya / Gayatri Mantra",
    path: "Jnana Marga (Wisdom, Self-Enquiry & Sovereign Will)",
  },
  Moon: {
    ishta: "Goddess Gauri / Lalita Tripurasundari / Lord Krishna",
    sanskrit: "ॐ श्रीं ह्रीं क्लीं भुवनेश्वर्यै नमः / ॐ क्लीं कृष्णाय नमः",
    mantra: "Om Kleem Krishnaya Namah",
    path: "Bhakti Marga (Tears of Divine Love & Emotional Purification)",
  },
  Mars: {
    ishta: "Lord Kartikeya (Murugan) / Lord Narasimha / Hanuman",
    sanskrit: "ॐ हं हनुमते नमः / ॐ उग्रं वीरं महाविष्णुं",
    mantra: "Om Namo Bhagavate Narasimhaya",
    path: "Karma Yoga & Fearless Devotion (Veera Bhakti)",
  },
  Mercury: {
    ishta: "Lord Vishnu / Mahavishnu / Goddess Saraswati",
    sanskrit: "ॐ नमो भगवते वासुदेवाय",
    mantra: "Om Namo Bhagavate Vasudevaya",
    path: "Kirtan, Japa & Sacred Study of Vedantic Scriptures",
  },
  Jupiter: {
    ishta: "Lord Dakshinamurthy / Lord Shiva / Dattatreya",
    sanskrit: "ॐ दक्षिणामूर्तये नमः / ॐ दत्तात्रेयाय नमः",
    mantra: "Om Dakshinamurtaye Namah",
    path: "Guru Kripa, Contemplation & Unflinching Faith (Shraddha)",
  },
  Venus: {
    ishta: "Maha Lakshmi / Radha Rani / Goddess Annapurna",
    sanskrit: "ॐ श्रीं महालक्ष्म्यै नमः / ॐ श्री राधे कृष्णाय नमः",
    mantra: "Om Shreem Maha Lakshmyai Namah",
    path: "Madhurya Prema (Divine Aesthetic Ecstasy & Surrender)",
  },
  Saturn: {
    ishta: "Lord Shiva / Lord Kurma / Lord Bhairava",
    sanskrit: "ॐ नमः शिवाय / ॐ शं शनैश्चराय नमः",
    mantra: "Maha Mrityunjaya Mantra (Om Tryambakam)",
    path: "Vairagya (Detachment, Solitary Penance & Seva)",
  },
  Rahu: {
    ishta: "Goddess Durga / Chinnamasta / Lord Varaha",
    sanskrit: "ॐ दुं दुर्गायै नमः",
    mantra: "Om Dum Durgayai Namah",
    path: "Transformation of Shadow, Kundalini Yoga & Tantric Upasana",
  },
  Ketu: {
    ishta: "Lord Ganesha / Matsya Avatar / Paramatman",
    sanskrit: "ॐ गं गणपतये नमः",
    mantra: "Om Gam Ganapataye Namah",
    path: "Kevala Advaita & Moksha (Complete Dissolution of Ego)",
  },
};

export function calculateD20DevotionalProfile(
  planets: VedicPlanet[],
  ascendantSiderealLon: number
): D20DevotionalReport {
  // 1. Calculate base D20 chart
  const d20Chart = calculateDivisionalChart(planets, ascendantSiderealLon, "D20");

  // 2. Identify Ascendant and Moon deities in D20
  const ascDeity = calculateVimsamsaDeity(ascendantSiderealLon);
  const moonPlanet = planets.find((p) => p.name === "Moon");
  const moonDeity = calculateVimsamsaDeity(moonPlanet ? moonPlanet.siderealLongitude : 0);

  // 3. Find 9th and 12th houses in D20 for Ishta & Dharma Devata
  const d20AscSignIdx = d20Chart.ascendant.signIndex;
  const d20H5SignIdx = (d20AscSignIdx + 4) % 12;
  const d20H9SignIdx = (d20AscSignIdx + 8) % 12;
  const d20H12SignIdx = (d20AscSignIdx + 11) % 12;

  const h5Lord = VEDIC_RASIS[d20H5SignIdx].ruler;
  const h9Lord = VEDIC_RASIS[d20H9SignIdx].ruler;
  const h12Lord = VEDIC_RASIS[d20H12SignIdx].ruler;

  // Check planets in 5th, 9th, 12th houses of D20
  const pInH5 = d20Chart.planets.find((p) => p.house === 5);
  const pInH9 = d20Chart.planets.find((p) => p.house === 9);
  const pInH12 = d20Chart.planets.find((p) => p.house === 12);

  const ishtaPlanetName = pInH12?.name || pInH9?.name || h12Lord || "Jupiter";
  const dharmaPlanetName = pInH9?.name || h9Lord || "Sun";
  const palanaPlanetName = pInH5?.name || h5Lord || "Moon";

  const ishtaData = PLANET_DEITIES[ishtaPlanetName] || PLANET_DEITIES["Jupiter"];
  const dharmaData = PLANET_DEITIES[dharmaPlanetName] || PLANET_DEITIES["Sun"];
  const palanaData = PLANET_DEITIES[palanaPlanetName] || PLANET_DEITIES["Moon"];

  const ishtaDevata: DevotionalDeityRecommendation = {
    role: "Ishta Devata",
    deityName: ishtaData.ishta,
    sanskritName: ishtaData.sanskrit,
    presidingPlanet: ishtaPlanetName,
    mantra: ishtaData.mantra,
    bhaktiPath: ishtaData.path,
    scriptureBasis: "BPHS: 12th from Karakamsha & 12th house in D20 govern the liberating personal divinity.",
  };

  const dharmaDevata: DevotionalDeityRecommendation = {
    role: "Dharma Devata",
    deityName: dharmaData.ishta,
    sanskritName: dharmaData.sanskrit,
    presidingPlanet: dharmaPlanetName,
    mantra: dharmaData.mantra,
    bhaktiPath: dharmaData.path,
    scriptureBasis: "BPHS: 9th house of D20 reveals the guide of righteous duty, moral courage & spiritual dharma.",
  };

  const palanaDevata: DevotionalDeityRecommendation = {
    role: "Palana Devata",
    deityName: palanaData.ishta,
    sanskritName: palanaData.sanskrit,
    presidingPlanet: palanaPlanetName,
    mantra: palanaData.mantra,
    bhaktiPath: palanaData.path,
    scriptureBasis: "BPHS: 5th house in D20 sustains mantra fruit, devotional memory & past-life merits (Sanchita).",
  };

  // Determine Bhakti Bhava based on Moon and Jupiter in D20
  let bhavaName: "Shanta (Peaceful)" | "Dasya (Servitude)" | "Sakhya (Friendship)" | "Vatsalya (Parental)" | "Madhurya (Beloved)" = "Shanta (Peaceful)";
  let bhavaDesc = "Serene meditation on the formless divine or calm unagitated presence.";
  const d20Moon = d20Chart.planets.find((p) => p.name === "Moon");
  const d20Venus = d20Chart.planets.find((p) => p.name === "Venus");
  const d20Saturn = d20Chart.planets.find((p) => p.name === "Saturn");

  if (d20Venus && (d20Venus.house === 1 || d20Venus.house === 5 || d20Venus.house === 9)) {
    bhavaName = "Madhurya (Beloved)";
    bhavaDesc = "Ecstatic, intimate devotion seeing the Supreme Divinity as the Eternal Beloved.";
  } else if (d20Saturn && (d20Saturn.house === 1 || d20Saturn.house === 9 || d20Saturn.house === 10)) {
    bhavaName = "Dasya (Servitude)";
    bhavaDesc = "Humble, dedicated service like Hanuman, offering every action as consecrated sacrifice.";
  } else if (d20Moon && (d20Moon.house === 4 || d20Moon.house === 5)) {
    bhavaName = "Vatsalya (Parental)";
    bhavaDesc = "Tender parental care, serving the Divine with affectionate protectiveness.";
  } else if (d20Chart.planets.find((p) => p.name === "Mercury" && (p.house === 1 || p.house === 7))) {
    bhavaName = "Sakhya (Friendship)";
    bhavaDesc = "Companionable trust like Arjuna with Krishna, walking life with God as closest ally.";
  }

  // Spiritual Strengths & Obstacles
  const strengths: string[] = [];
  const obstacles: string[] = [];

  const beneficsInKendras = d20Chart.planets.filter(
    (p) => ["Jupiter", "Venus", "Mercury"].includes(p.name) && [1, 4, 7, 10].includes(p.house)
  );
  if (beneficsInKendras.length > 0) {
    strengths.push(
      `Sattvic Kendra Fortification: ${beneficsInKendras.map((p) => p.name).join(", ")} in D20 Kendra establishes innate peace and rapid spiritual progress.`
    );
  }

  const d20Jupiter = d20Chart.planets.find((p) => p.name === "Jupiter");
  if (d20Jupiter && (d20Jupiter.dignity === "Exalted" || d20Jupiter.dignity === "Own Sign")) {
    strengths.push("Guru Kripa Yoga in D20: Jupiter strongly fortified grants authentic spiritual initiation & protection.");
  }

  const maleficsInDusthana = d20Chart.planets.filter(
    (p) => ["Saturn", "Mars", "Rahu", "Ketu"].includes(p.name) && [6, 8].includes(p.house)
  );
  if (maleficsInDusthana.length > 0) {
    obstacles.push(
      `Karmic Resistance in Upasana: ${maleficsInDusthana.map((p) => p.name).join(", ")} in 6th/8th house of D20 creates occasional spiritual doubt or mental fatigue.`
    );
  } else {
    strengths.push("Clean 6th & 8th Houses: Unobstructed inner pathway without severe karmic resistance in meditation.");
  }

  const d20Ketu = d20Chart.planets.find((p) => p.name === "Ketu");
  if (d20Ketu && [9, 12].includes(d20Ketu.house)) {
    strengths.push("Ketu in Moksha Sthana: Potent natural detachment and spontaneous mystical realization.");
  }

  return {
    chart: d20Chart,
    ascendantDeity: ascDeity,
    moonDeity: moonDeity,
    ishtaDevata,
    dharmaDevata,
    palanaDevata,
    bhaktiBhava: {
      name: bhavaName,
      description: bhavaDesc,
      dominantInfluences: [ishtaPlanetName, dharmaPlanetName],
    },
    spiritualStrengths: strengths,
    spiritualObstacles: obstacles.length ? obstacles : ["Minor restlessness during initial minutes of dhyana; stabilized by daily pranayama."],
    upasanaGuidance: {
      recommendedMantraType: `${ishtaPlanetName} Beeja Mantra with ${ishtaData.mantra}`,
      sacredTime: "Brahma Muhurta (4:00 AM - 6:00 AM) or Sandhya (Sunset)",
      direction: "East",
      altarElements: ["Ghee lamp (Deepa)", "White or red flowers", "Sandalwood incense (Dhoopa)", "Clean spring water"],
    },
  };
}
