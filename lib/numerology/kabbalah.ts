/**
 * Complete Kabbalah Numerology & Tree of Life Engine
 * Features:
 * 1. Hebrew Letter Values (Alef=1 to Tav=400)
 * 2. Western-to-Hebrew phonetic transliteration
 * 3. 10 Sephiroth of the Tree of Life
 * 4. 22 Sacred Connecting Paths with Tarot Major Arcana correspondences
 * 5. Soul Sephirah, Outer Life Sephirah, and Path of Destiny integration
 */

import {
  KabbalahProfile,
  Sephirah,
  KabbalahPath,
} from "./types";

export const HEBREW_VALUES: Record<string, number> = {
  "א": 1,   // Alef
  "ב": 2,   // Bet
  "ג": 3,   // Gimel
  "ד": 4,   // Dalet
  "ה": 5,   // He
  "ו": 6,   // Vav
  "ז": 7,   // Zayin
  "ח": 8,   // Chet
  "ט": 9,   // Tet
  "י": 10,  // Yod
  "כ": 20,  // Kaf
  "ל": 30,  // Lamed
  "מ": 40,  // Mem
  "נ": 50,  // Nun
  "ס": 60,  // Samekh
  "ע": 70,  // Ayin
  "פ": 80,  // Pe
  "צ": 90,  // Tsadi
  "ק": 100, // Qof
  "ר": 200, // Resh
  "ש": 300, // Shin
  "ת": 400, // Tav
};

// Western Latin to Hebrew Letter Phonetic Mapping
export const LATIN_TO_HEBREW_MAP: Record<string, { hebrew: string; value: number }> = {
  A: { hebrew: "א", value: 1 },
  B: { hebrew: "ב", value: 2 },
  C: { hebrew: "כ", value: 20 },
  D: { hebrew: "ד", value: 4 },
  E: { hebrew: "ה", value: 5 },
  F: { hebrew: "פ", value: 80 },
  G: { hebrew: "ג", value: 3 },
  H: { hebrew: "ח", value: 8 },
  I: { hebrew: "י", value: 10 },
  J: { hebrew: "י", value: 10 },
  K: { hebrew: "ק", value: 100 },
  L: { hebrew: "ל", value: 30 },
  M: { hebrew: "מ", value: 40 },
  N: { hebrew: "נ", value: 50 },
  O: { hebrew: "ו", value: 6 },
  P: { hebrew: "פ", value: 80 },
  Q: { hebrew: "ק", value: 100 },
  R: { hebrew: "ר", value: 200 },
  S: { hebrew: "ס", value: 60 },
  T: { hebrew: "ת", value: 400 },
  U: { hebrew: "ו", value: 6 },
  V: { hebrew: "ו", value: 6 },
  W: { hebrew: "ו", value: 6 },
  X: { hebrew: "ס", value: 60 },
  Y: { hebrew: "י", value: 10 },
  Z: { hebrew: "ז", value: 7 },
};

export const ALL_SEPHIROT: Sephirah[] = [
  {
    number: 1,
    name: "Kether",
    hebrew: "כתר",
    meaning: "The Crown, Primal Divine Will, Boundless Light",
    planet: "Neptune / Primum Mobile",
    element: "Pure Light / Spirit",
    divineAttribute: "Eheieh (I Am That I Am) - Pure Consciousness",
    spiritualLesson: "Surrender to the supreme cosmic source; acting as an unclouded vessel for the divine will.",
  },
  {
    number: 2,
    name: "Chokmah",
    hebrew: "חכמה",
    meaning: "Wisdom, The Creative Spark, Divine Father",
    planet: "Uranus / Zodiacal Sphere",
    element: "Cosmic Fire",
    divineAttribute: "Yah - Illumination & Original Genesis",
    spiritualLesson: "Embracing spontaneous, unbounded creative vision without rushing to prematurely define or restrict it.",
  },
  {
    number: 3,
    name: "Binah",
    hebrew: "בינה",
    meaning: "Understanding, The Cosmic Matrix, Divine Mother",
    planet: "Saturn",
    element: "Cosmic Water / Primordial Sea",
    divineAttribute: "Elohim - Form, Structure, Sanctification",
    spiritualLesson: "Giving tangible sacred form to divine ideas; developing patience with sorrow, gestation, and boundaries.",
  },
  {
    number: 4,
    name: "Chesed",
    hebrew: "חסד",
    meaning: "Mercy, Loving-Kindness, Grace & Expansion",
    planet: "Jupiter",
    element: "Water",
    divineAttribute: "El - Boundless Benevolence & Abundance",
    spiritualLesson: "Radiating unconditional generosity, forgiveness, and magnanimity without expectation of return.",
  },
  {
    number: 5,
    name: "Geburah",
    hebrew: "גבורה",
    meaning: "Severity, Sacred Strength, Justice & Discipline",
    planet: "Mars",
    element: "Fire",
    divineAttribute: "Elohim Gibor - Righteous Power & Discernment",
    spiritualLesson: "Pruning the corrupt and obsolete; establishing courageous moral boundaries and fearless truth.",
  },
  {
    number: 6,
    name: "Tiphareth",
    hebrew: "תפארת",
    meaning: "Beauty, Harmony, The Solar Heart & Christ/Krishna Light",
    planet: "Sun",
    element: "Air / Solar Ether",
    divineAttribute: "Tetragrammaton Eloah Va-Daath - Center of Grace",
    spiritualLesson: "Integrating the higher spirit with earthly ego; radiating radiant love, artistic balance, and peace.",
  },
  {
    number: 7,
    name: "Netzach",
    hebrew: "נצח",
    meaning: "Victory, Eternity, Emotional Passion & Natural Instinct",
    planet: "Venus",
    element: "Fire / Earth Instinct",
    divineAttribute: "YHVH Tzabaoth - Enduring Passion & Creative Arts",
    spiritualLesson: "Honoring raw emotional fire, poetic intuition, and the ecstatic beauty of nature.",
  },
  {
    number: 8,
    name: "Hod",
    hebrew: "הוד",
    meaning: "Glory, Splendor, Intellectual Order & Sacred Words",
    planet: "Mercury",
    element: "Water / Intellect",
    divineAttribute: "Elohim Tzabaoth - Truth, Logic & Sacred Texts",
    spiritualLesson: "Mastering scientific communication, clear rational thinking, and honest self-appraisal.",
  },
  {
    number: 9,
    name: "Yesod",
    hebrew: "יסוד",
    meaning: "Foundation, Astral Blueprint, Subconscious & Dreams",
    planet: "Moon",
    element: "Air / Astral Light",
    divineAttribute: "Shaddai El Chai - The Purifier of the Soul",
    spiritualLesson: "Purifying dreams, mental illusions, and subconscious desires before they condense into physical form.",
  },
  {
    number: 10,
    name: "Malkuth",
    hebrew: "מלכות",
    meaning: "The Kingdom, Physical Earth, Concrete Manifestation",
    planet: "Earth / Physical Elements",
    element: "Earth",
    divineAttribute: "Adonai Ha-Aretz - Lord of Earth",
    spiritualLesson: "Grounded stewardship of the material body, sacred work in the world, and sanctifying earthly matter.",
  },
];

export const ALL_KABBALAH_PATHS: KabbalahPath[] = [
  { pathNumber: 11, fromSephirah: 1, toSephirah: 2, hebrewLetter: "Alef (א)", tarotCard: "The Fool", meaning: "Unbounded spiritual leap of faith into pure consciousness." },
  { pathNumber: 12, fromSephirah: 1, toSephirah: 3, hebrewLetter: "Bet (ב)", tarotCard: "The Magician", meaning: "Conscious channel of divine will into tangible manifestation." },
  { pathNumber: 13, fromSephirah: 1, toSephirah: 6, hebrewLetter: "Gimel (ג)", tarotCard: "The High Priestess", meaning: "The direct vertical conduit of intuition connecting Crown to Heart." },
  { pathNumber: 14, fromSephirah: 2, toSephirah: 3, hebrewLetter: "Dalet (ד)", tarotCard: "The Empress", meaning: "The luminous bridge of divine fertility, creative love, and abundance." },
  { pathNumber: 15, fromSephirah: 2, toSephirah: 6, hebrewLetter: "He (ה)", tarotCard: "The Emperor", meaning: "Visionary authority ordering cosmic chaos into harmonic law." },
  { pathNumber: 16, fromSephirah: 2, toSephirah: 4, hebrewLetter: "Vav (ו)", tarotCard: "The Hierophant", meaning: "Spiritual mentorship, esoteric transmission, and higher wisdom." },
  { pathNumber: 17, fromSephirah: 3, toSephirah: 6, hebrewLetter: "Zayin (ז)", tarotCard: "The Lovers", meaning: "Integration of sacred opposites and spiritual discernment." },
  { pathNumber: 18, fromSephirah: 3, toSephirah: 5, hebrewLetter: "Chet (ח)", tarotCard: "The Chariot", meaning: "Triumphant spiritual mastery over emotional and astral forces." },
  { pathNumber: 19, fromSephirah: 4, toSephirah: 5, hebrewLetter: "Tet (ט)", tarotCard: "Strength", meaning: "The reconciliation of boundless mercy with righteous strength." },
  { pathNumber: 20, fromSephirah: 4, toSephirah: 6, hebrewLetter: "Yod (י)", tarotCard: "The Hermit", meaning: "Solitary inner illumination guiding seekers along the path of truth." },
  { pathNumber: 21, fromSephirah: 4, toSephirah: 7, hebrewLetter: "Kaf (כ)", tarotCard: "The Wheel of Fortune", meaning: "Cosmic cyclical laws and the harvest of benevolent karma." },
  { pathNumber: 22, fromSephirah: 5, toSephirah: 6, hebrewLetter: "Lamed (ל)", tarotCard: "Justice", meaning: "Karmic equilibrium, objective moral balance, and truth." },
  { pathNumber: 23, fromSephirah: 5, toSephirah: 8, hebrewLetter: "Mem (מ)", tarotCard: "The Hanged Man", meaning: "Sacred surrender and viewing reality through spiritual inversion." },
  { pathNumber: 24, fromSephirah: 6, toSephirah: 7, hebrewLetter: "Nun (נ)", tarotCard: "Death / Transformation", meaning: "Metamorphic dissolution of the ego into higher emotional radiance." },
  { pathNumber: 25, fromSephirah: 6, toSephirah: 9, hebrewLetter: "Samekh (ס)", tarotCard: "Temperance", meaning: "The direct arrow of testing and spiritual alchemy on the Middle Pillar." },
  { pathNumber: 26, fromSephirah: 6, toSephirah: 8, hebrewLetter: "Ayin (ע)", tarotCard: "The Devil / The Pan", meaning: "Confronting material illusions and transmuting shadow energy." },
  { pathNumber: 27, fromSephirah: 7, toSephirah: 8, hebrewLetter: "Pe (פ)", tarotCard: "The Tower", meaning: "The shatterer of false dogmas; awakening through breakthrough." },
  { pathNumber: 28, fromSephirah: 7, toSephirah: 9, hebrewLetter: "Tsadi (צ)", tarotCard: "The Star", meaning: "Hope, celestial inspiration, and serene faith in divine destiny." },
  { pathNumber: 29, fromSephirah: 7, toSephirah: 10, hebrewLetter: "Qof (ק)", tarotCard: "The Moon", meaning: "Navigating nocturnal illusions, psychic dreams, and ancestral subconscious." },
  { pathNumber: 30, fromSephirah: 8, toSephirah: 9, hebrewLetter: "Resh (ר)", tarotCard: "The Sun", meaning: "Intellectual clarity, joyful revelation, and conscious brilliance." },
  { pathNumber: 31, fromSephirah: 8, toSephirah: 10, hebrewLetter: "Shin (ש)", tarotCard: "Judgement", meaning: "The Holy Spirit fire calling forth resurrection of authentic soul purpose." },
  { pathNumber: 32, fromSephirah: 9, toSephirah: 10, hebrewLetter: "Tav (ת)", tarotCard: "The World", meaning: "The final threshold uniting astral blueprint with physical Earth." },
];

export function calculateKabbalahProfile(fullName: string): KabbalahProfile {
  const clean = fullName.toUpperCase().replace(/[^A-Z]/g, "");
  const transliteratedLetters: { letter: string; hebrew: string; value: number }[] = [];
  let gematriaTotal = 0;

  for (const ch of clean) {
    const item = LATIN_TO_HEBREW_MAP[ch] || { hebrew: "א", value: 1 };
    transliteratedLetters.push({
      letter: ch,
      hebrew: item.hebrew,
      value: item.value,
    });
    gematriaTotal += item.value;
  }

  // Reduce to 1-10 for Sephirah mapping
  let reduced = gematriaTotal;
  while (reduced > 10) {
    reduced = reduced
      .toString()
      .split("")
      .reduce((s, c) => s + parseInt(c, 10), 0);
  }
  if (reduced === 0) reduced = 10;

  // Soul Sephirah based on vowels in transliteration
  const vowels = new Set(["A", "E", "I", "O", "U"]);
  let vowelGematria = 0;
  for (const ch of clean) {
    if (vowels.has(ch)) {
      vowelGematria += (LATIN_TO_HEBREW_MAP[ch] || { value: 1 }).value;
    }
  }
  let soulReduced = vowelGematria;
  while (soulReduced > 10) {
    soulReduced = soulReduced
      .toString()
      .split("")
      .reduce((s, c) => s + parseInt(c, 10), 0);
  }
  if (soulReduced === 0) soulReduced = 6; // default Tiphareth (Heart)

  const outerLifeSephirah = ALL_SEPHIROT.find((s) => s.number === reduced) || ALL_SEPHIROT[9];
  const soulSephirah = ALL_SEPHIROT.find((s) => s.number === soulReduced) || ALL_SEPHIROT[5];

  // Connecting path if between adjacent or recognized nodes
  const connectingPath = ALL_KABBALAH_PATHS.find(
    (p) =>
      (p.fromSephirah === soulSephirah.number && p.toSephirah === outerLifeSephirah.number) ||
      (p.fromSephirah === outerLifeSephirah.number && p.toSephirah === soulSephirah.number)
  );

  const mysticalReading = `Your sacred Hebrew Gematria value is ${gematriaTotal} (Root ${reduced}). In the Tree of Life (Otz Chiim), your inner soul spark dwells in Sephirah ${soulSephirah.number} (${soulSephirah.name} - ${soulSephirah.meaning}), while your outer destiny manifests through Sephirah ${outerLifeSephirah.number} (${outerLifeSephirah.name} - ${outerLifeSephirah.meaning}).`;

  return {
    hebrewGematriaValue: gematriaTotal,
    hebrewReducedValue: reduced,
    soulSephirah,
    outerLifeSephirah,
    connectingPath,
    allSephiroth: ALL_SEPHIROT,
    allPaths: ALL_KABBALAH_PATHS,
    transliteratedLetters,
    mysticalReading,
  };
}
