/**
 * Complete Tamil Numerology (En Kaniyam - எண் கணிதம்) Engine
 * Classical Southern Siddhanta Numerology
 * Incorporates:
 * 1. Janma En (Birth Number / பிறந்த எண்)
 * 2. Vidhi En (Destiny Number / விதி எண்)
 * 3. Peyar En (Name Number / பெயர் எண்)
 * 4. Navagraha lords in Tamil tradition (Suriyan, Chandran, Guru, Rahu, Budhan, Sukran, Kethu, Sani, Sevvai)
 * 5. Auspicious days, colors, gems, directions, and auspicious initial letter sounds
 * 6. Business & marriage harmony numbers
 */

import { TamilNumerologyProfile } from "./types";
import { VEDIC_CHALDEAN_MAP } from "./vedic";

export const TAMIL_GRAHA_PROFILES: Record<
  number,
  {
    tamilGraha: string;
    tamilName: string;
    auspiciousDays: string[];
    auspiciousColors: string[];
    auspiciousGems: string[];
    auspiciousDirections: string[];
    luckyInitialSounds: string[];
    marriageHarmony: number[];
    businessHarmony: number[];
    proverb: string;
  }
> = {
  1: {
    tamilGraha: "Suriyan (சூரியன் - Sun)",
    tamilName: "முதன்மை எண் (Pinnacle Sovereign)",
    auspiciousDays: ["Sunday (ஞாயிறு)", "Tuesday (செவ்வாய்)", "Thursday (வியாழன்)"],
    auspiciousColors: ["Gold (தங்கம்)", "Orange (ஆரஞ்சு)", "Ruby Red (சிகப்பு)"],
    auspiciousGems: ["Manikkam / Ruby (மாணிக்கம்)", "Garnet"],
    auspiciousDirections: ["East (கிழக்கு)"],
    luckyInitialSounds: ["A, I, J, Y, Q"],
    marriageHarmony: [1, 2, 3, 9],
    businessHarmony: [1, 3, 5, 9],
    proverb: "சூரியனைப் போல் சுடர்விட்டுப் பிரகாசி (Radiate sovereign brilliance like the divine Sun).",
  },
  2: {
    tamilGraha: "Chandran (சந்திரன் - Moon)",
    tamilName: "அமைதி எண் (Serene Harmonizer)",
    auspiciousDays: ["Monday (திங்கள்)", "Friday (வெள்ளி)"],
    auspiciousColors: ["Pearl White (வெள்ளை)", "Silver (வெள்ளி நிறம்)", "Cream"],
    auspiciousGems: ["Muthu / Pearl (முத்து)", "Moonstone"],
    auspiciousDirections: ["North-West (வடமேற்கு)"],
    luckyInitialSounds: ["B, K, R"],
    marriageHarmony: [1, 2, 7],
    businessHarmony: [1, 2, 5],
    proverb: "மனம் அமைதியானால் உலகமே அமைதியாகும் (When the mind is at peace, the entire universe reflects serenity).",
  },
  3: {
    tamilGraha: "Guru / Vyazhan (குரு / வியாழன் - Jupiter)",
    tamilName: "ஞான எண் (Wisdom & Knowledge)",
    auspiciousDays: ["Thursday (வியாழன்)", "Sunday (ஞாயிறு)", "Tuesday (செவ்வாய்)"],
    auspiciousColors: ["Yellow (மஞ்சள்)", "Golden Honey (தங்க நிறம்)"],
    auspiciousGems: ["Pushparagam / Yellow Sapphire (புஷ்பராகம்)", "Topaz"],
    auspiciousDirections: ["North-East (வடகிழக்கு - ஈசான்யம்)"],
    luckyInitialSounds: ["C, G, L, S"],
    marriageHarmony: [1, 3, 9],
    businessHarmony: [1, 3, 5, 9],
    proverb: "குருவருள் இருந்தால் திருவருள் கூடிவரும் (Where the Guru's grace abides, all divine fortune naturally gathers).",
  },
  4: {
    tamilGraha: "Rahu (ராகு - North Node)",
    tamilName: "துணிவு எண் (Courage & Revolutionary Breakthrough)",
    auspiciousDays: ["Saturday (சனி)", "Sunday (ஞாயிறு)"],
    auspiciousColors: ["Smoky Grey (சாம்பல்)", "Electric Blue (நீலம்)"],
    auspiciousGems: ["Gomedhakam / Hessonite (கோமேதகம்)"],
    auspiciousDirections: ["South-West (தென்மேற்கு)"],
    luckyInitialSounds: ["D, M, T"],
    marriageHarmony: [1, 4, 6, 8],
    businessHarmony: [4, 5, 6, 8],
    proverb: "விடாமுயற்சியே வெற்றியின் ரகசியம் (Relentless enterprise turns unexpected storms into triumphant victories).",
  },
  5: {
    tamilGraha: "Budhan (புதன் - Mercury)",
    tamilName: "புத்தி எண் (Intellect & Eloquent Commerce)",
    auspiciousDays: ["Wednesday (புதன்)", "Friday (வெள்ளி)"],
    auspiciousColors: ["Emerald Green (பச்சை)", "Mint"],
    auspiciousGems: ["Maragatham / Emerald (மரகதம்)", "Green Tourmaline"],
    auspiciousDirections: ["North (வடக்கு)"],
    luckyInitialSounds: ["E, H, N, X"],
    marriageHarmony: [1, 5, 6],
    businessHarmony: [1, 2, 3, 5, 6],
    proverb: "பொன் கிடைத்தாலும் புதன் கிடைக்காது (Even if raw gold is accessible, the auspicious blessing of Budhan is rare and priceless).",
  },
  6: {
    tamilGraha: "Sukran / Velli (சுக்கிரன் / வெள்ளி - Venus)",
    tamilName: "சுபயோக எண் (Artistic Elegance & Wealth)",
    auspiciousDays: ["Friday (வெள்ளி)", "Wednesday (புதன்)"],
    auspiciousColors: ["Shining White (பளபளப்பான வெள்ளை)", "Light Blue", "Pink"],
    auspiciousGems: ["Vairam / Diamond (வைரம்)", "White Zircon"],
    auspiciousDirections: ["South-East (தென்கிழக்கு)"],
    luckyInitialSounds: ["U, V, W"],
    marriageHarmony: [5, 6, 8],
    businessHarmony: [1, 4, 5, 6],
    proverb: "சுக்கிர திசை கூடினால் செல்வம் தானே வரும் (When Sukran's frequency is activated, joy, beauty, and prosperity flow effortlessly).",
  },
  7: {
    tamilGraha: "Kethu (கேது - South Node)",
    tamilName: "ஞான மோட்ச எண் (Spiritual Awakening & Mysticism)",
    auspiciousDays: ["Tuesday (செவ்வாய்)", "Thursday (வியாழன்)"],
    auspiciousColors: ["Smoky Brown (பழுப்பு)", "Multi-color (சித்திரக்கபிலம்)"],
    auspiciousGems: ["Vaidooryam / Cat's Eye (வைடூரியம்)"],
    auspiciousDirections: ["North-East (வடகிழக்கு)"],
    luckyInitialSounds: ["O, Z"],
    marriageHarmony: [1, 2, 7],
    businessHarmony: [1, 4, 5, 7],
    proverb: "அகத்தின் அழகே முகத்தில் தெரியும் (Inner spiritual purity and truth illuminate outer existence without words).",
  },
  8: {
    tamilGraha: "Sani (சனி - Saturn)",
    tamilName: "நீதி எண் (Karma, Justice & Enduring Labor)",
    auspiciousDays: ["Saturday (சனி)", "Friday (வெள்ளி)"],
    auspiciousColors: ["Dark Navy (கருநீலம்)", "Black (கருப்பு)", "Steel"],
    auspiciousGems: ["Neelam / Blue Sapphire (நீலக்கல்)", "Amethyst"],
    auspiciousDirections: ["West (மேற்கு)"],
    luckyInitialSounds: ["F, P"],
    marriageHarmony: [3, 5, 6],
    businessHarmony: [3, 5, 6, 8],
    proverb: "பொறுமை கடலினும் பெரிது; உழைப்பே உயர்வு தரும் (Patience is vaster than the ocean; dedicated labor builds everlasting dynasties).",
  },
  9: {
    tamilGraha: "Sevvai / Murugan (செவ்வாய் - Mars)",
    tamilName: "வீர எண் (Valor, Leadership & Kinetic Force)",
    auspiciousDays: ["Tuesday (செவ்வாய்)", "Sunday (ஞாயிறு)", "Thursday (வியாழன்)"],
    auspiciousColors: ["Blood Red (சிவப்பு)", "Coral (பவள நிறம்)"],
    auspiciousGems: ["Pavazham / Red Coral (பவளம்)", "Carnelian"],
    auspiciousDirections: ["South (தெற்கு)"],
    luckyInitialSounds: ["A, I, J, Q"],
    marriageHarmony: [1, 2, 3, 9],
    businessHarmony: [1, 3, 9],
    proverb: "வீரமும் விவேகமும் சேர்ந்தால் வெற்றி நிச்சயம் (When fearless valor is joined with discerning wisdom, victory is guaranteed).",
  },
};

function reduceTo9(num: number): number {
  let cur = Math.abs(num);
  while (cur > 9) {
    cur = cur
      .toString()
      .split("")
      .reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return cur || 9;
}

export function calculateTamilNumerology(
  fullName: string,
  birthYear: number,
  birthMonth: number,
  birthDay: number
): TamilNumerologyProfile {
  // Janma En (Birth date reduced to 1-9)
  const janmaEn = reduceTo9(birthDay);

  // Vidhi En (Full birth date reduced to 1-9)
  const dSum = birthDay
    .toString()
    .split("")
    .reduce((s, c) => s + parseInt(c, 10), 0);
  const mSum = birthMonth
    .toString()
    .split("")
    .reduce((s, c) => s + parseInt(c, 10), 0);
  const ySum = birthYear
    .toString()
    .split("")
    .reduce((s, c) => s + parseInt(c, 10), 0);
  const vidhiEn = reduceTo9(dSum + mSum + ySum);

  // Peyar En (Tamil phonetic name sum)
  const clean = fullName.toUpperCase().replace(/[^A-Z]/g, "");
  let nameSum = 0;
  for (const ch of clean) {
    nameSum += VEDIC_CHALDEAN_MAP[ch] || 0;
  }
  const peyarEn = reduceTo9(nameSum || 1);

  const profile = TAMIL_GRAHA_PROFILES[janmaEn] || TAMIL_GRAHA_PROFILES[1];

  return {
    janmaEn,
    vidhiEn,
    peyarEn,
    tamilGraha: profile.tamilGraha,
    auspiciousDays: profile.auspiciousDays,
    auspiciousColors: profile.auspiciousColors,
    auspiciousGems: profile.auspiciousGems,
    auspiciousDirections: profile.auspiciousDirections,
    luckyInitialSounds: profile.luckyInitialSounds,
    marriageHarmonyNumbers: profile.marriageHarmony,
    businessHarmonyNumbers: profile.businessHarmony,
    tamilProverbGuidance: profile.proverb,
  };
}
