/**
 * Complete Indian Vedic Numerology (Sankhya Shastra) Engine
 * Calculates:
 * 1. Mulank (Psychic / Driver Number)
 * 2. Bhagyank (Destiny / Conductor Number)
 * 3. Namank (Name Number)
 * 4. Ruling Graha Details for all 9 planets
 * 5. Complete Vedic Remedies: Gemstones, Mantras, Charity, Fasting, Yantras, Colors
 * 6. Friendly (Mitra), Enemy (Shatru), Neutral (Sama) Matrix
 * 7. Mulank-Bhagyank synergy analysis
 */

import {
  VedicNumerologyProfile,
  VedicPlanetDetails,
  VedicGemstoneRemedy,
  VedicMantraRemedy,
  VedicCharityRemedy,
} from "./types";

// Vedic / Cheiro Alphabet Values for Namank
export const VEDIC_CHALDEAN_MAP: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

export const ALL_VEDIC_PLANETS: Record<number, VedicPlanetDetails> = {
  1: {
    number: 1,
    planet: "Sun (Surya)",
    sanskrit: "सूर्य",
    deity: {
      primary: "Lord Surya (Aditya)",
      secondary: "Lord Rama / Lord Shiva",
      worship: "Offer Arghya (water, red sandalwood, red flowers) to the rising Sun facing East every Sunday morning.",
    },
    day: "Sunday",
    color: {
      favorable: ["Gold", "Orange", "Copper", "Deep Yellow", "Ruby Red"],
      unfavorable: ["Black", "Dark Blue", "Smoky Grey"],
    },
    gemstone: {
      name: "Ruby (Manikya)",
      sanskrit: "माणिक्य",
      carat: "3 to 5 carats",
      metal: "Yellow Gold or Pure Copper",
      finger: "Ring Finger (Anamika) of the right hand",
      day: "Sunday morning during Shukla Paksha at Sunrise",
      time: "Within 1 hour of Sunrise",
      substituteGems: ["Red Garnet", "Red Spinel", "Sunstone"],
    },
    mantra: {
      sanskrit: "ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः",
      transliteration: "Om Hraam Hreem Hroum Sah Suryaya Namaha",
      count: 108,
      time: "Sunrise",
      duration: "40 consecutive days or every Sunday",
      beads: "Rudraksha or Red Sandalwood Mala",
    },
    metal: "Pure Gold or Copper",
    direction: { favorable: "East", unfavorable: "West" },
    friendlyNumbers: [1, 2, 3, 9],
    enemyNumbers: [6, 8],
    neutralNumbers: [4, 5, 7],
    bodyParts: ["Heart", "Eyes (Right eye)", "Spine", "Bones", "Vitality / Immune System"],
    career: [
      "Government Administration & Civil Services",
      "Executive CEO / Founder / Directorate",
      "Politics & Public Diplomacy",
      "Medicine, Cardiology, Surgery",
      "Gold, Copper, Jewelry & High-End Luxury Enterprise",
    ],
    fast: {
      day: "Sunday",
      method: "Consume one meal without salt after sunset, or fast from sunrise to sunset with fruits and milk.",
    },
    yantra: {
      name: "Surya Yantra",
      material: "Copper plate or Bhojpatra",
      method: "Install in the East corner of home/altar facing West; light ghee lamp daily.",
    },
    generalRemedies: {
      gemstone: "Wear certified unheated Ruby in gold/copper on right ring finger on Sunday morning.",
      mantra: "Chant Gayatri Mantra or Surya Beej Mantra 108 times daily facing the morning Sun.",
      charity: "Donate wheat, jaggery (gur), copper vessels, or red cloth to needy persons on Sundays.",
      color: "Incorporate saffron, gold, and vibrant orange attire during pivotal meetings.",
    },
  },

  2: {
    number: 2,
    planet: "Moon (Chandra)",
    sanskrit: "चन्द्र",
    deity: {
      primary: "Lord Shiva & Goddess Parvati",
      secondary: "Goddess Gauri",
      worship: "Perform Jalabhishekam (pouring milk and sacred water) on Shiva Lingam on Mondays.",
    },
    day: "Monday",
    color: {
      favorable: ["Pristine White", "Silver", "Cream", "Pearl Blue"],
      unfavorable: ["Black", "Dark Crimson Red"],
    },
    gemstone: {
      name: "Natural Pearl (Mukta / Moti)",
      sanskrit: "मुक्ता",
      carat: "4 to 7 carats",
      metal: "Pure Silver",
      finger: "Little Finger (Kanishtha) of the right hand",
      day: "Monday evening or morning during Shukla Paksha",
      time: "Monday evening during Moonrise or early morning",
      substituteGems: ["Moonstone", "White Coral"],
    },
    mantra: {
      sanskrit: "ॐ श्रां श्रीं श्रौं सः चन्द्राय नमः",
      transliteration: "Om Shraam Shreem Shroum Sah Chandraya Namaha",
      count: 108,
      time: "Evening / Moonrise",
      duration: "40 days or on full moon (Purnima) nights",
      beads: "Sphatik (Quartz Crystal) or Pearl Mala",
    },
    metal: "Pure Silver",
    direction: { favorable: "North-West", unfavorable: "South-East" },
    friendlyNumbers: [1, 2, 3, 5],
    enemyNumbers: [8, 9],
    neutralNumbers: [4, 6, 7],
    bodyParts: ["Mind (Manas)", "Chest / Lungs", "Body Fluids / Blood", "Left Eye", "Stomach"],
    career: [
      "Psychology, Psychotherapy, Counseling",
      "Creative Arts, Music, Poetry, Acting",
      "Hospitality, Culinary Arts, Dairy, Beverage Industry",
      "Marine Navigation, Imports/Exports, Water Resources",
      "Nursing, Maternal Healthcare, Pediatrics",
    ],
    fast: {
      day: "Monday",
      method: "Fast on Mondays, consuming milk, kheer (rice pudding), or fruits after seeing the evening Moon.",
    },
    yantra: {
      name: "Chandra Yantra",
      material: "Silver plate",
      method: "Keep in the North-West area of home; cleanse with raw milk on Purnima.",
    },
    generalRemedies: {
      gemstone: "Wear natural South Sea Pearl in silver on the right little finger.",
      mantra: "Recite 'Om Namah Shivaya' or Chandra Beej Mantra 108 times every Monday.",
      charity: "Donate white rice, milk, sugar, silver, or white clothes to elderly women or the underprivileged on Mondays.",
      color: "Wear white, silver, and soft pastel shades to calm nervous agitation.",
    },
  },

  3: {
    number: 3,
    planet: "Jupiter (Guru / Brihaspati)",
    sanskrit: "बृहस्पति (गुरु)",
    deity: {
      primary: "Lord Vishnu / Brihaspati",
      secondary: "Lord Dattatreya / Dakshinamurthy",
      worship: "Worship the Peepal or Banana tree on Thursdays; offer chana dal, turmeric, and yellow flowers.",
    },
    day: "Thursday",
    color: {
      favorable: ["Bright Yellow", "Golden Amber", "Mustard", "Canary"],
      unfavorable: ["Dark Green", "Black"],
    },
    gemstone: {
      name: "Yellow Sapphire (Pukhraj)",
      sanskrit: "पुखराज",
      carat: "3.5 to 6 carats",
      metal: "Yellow Gold or Panchdhatu",
      finger: "Index Finger (Tarjani) of the right hand",
      day: "Thursday morning during Shukla Paksha",
      time: "Within 1 hour of Sunrise on Thursday",
      substituteGems: ["Yellow Topaz", "Citrine (Sunela)", "Heliodor"],
    },
    mantra: {
      sanskrit: "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः",
      transliteration: "Om Graam Greem Groum Sah Gurave Namaha",
      count: 108,
      time: "Morning / Sunrise",
      duration: "Consecutive Thursdays or 40-day cycle",
      beads: "Haldi (Turmeric) or Tulsi / Sandalwood Mala",
    },
    metal: "Pure Gold or Brass",
    direction: { favorable: "North-East (Ishanya)", unfavorable: "South-West" },
    friendlyNumbers: [1, 2, 3, 9],
    enemyNumbers: [6],
    neutralNumbers: [4, 5, 7, 8],
    bodyParts: ["Liver", "Pancreas", "Thighs", "Arterial System", "Hearing / Ears"],
    career: [
      "Higher Education, University Professorships, Academia",
      "Law, Judiciary, Legal Advisory",
      "Banking, Wealth Management, Financial Advisory",
      "Spiritual Mentorship, Philosophy, Publishing",
      "Advisory Consulting, Government Think-Tanks",
    ],
    fast: {
      day: "Thursday",
      method: "Fast on Thursdays; consume yellow foods (besan, bananas, chana dal) once without salt.",
    },
    yantra: {
      name: "Guru Yantra",
      material: "Gold or Brass plate",
      method: "Install in the North-East sanctum; apply yellow sandalwood tilak daily.",
    },
    generalRemedies: {
      gemstone: "Wear untreated Ceylon Yellow Sapphire in gold on the index finger.",
      mantra: "Chant Brihaspati Beej Mantra or Guru Stotram 108 times on Thursdays.",
      charity: "Donate turmeric, yellow bananas, chana dal, books, or yellow cloth to scholars or priests on Thursdays.",
      color: "Wear yellow or golden garments on auspicious occasions.",
    },
  },

  4: {
    number: 4,
    planet: "Rahu (North Lunar Node)",
    sanskrit: "राहु",
    deity: {
      primary: "Lord Bhairava & Goddess Durga",
      secondary: "Lord Saraswati",
      worship: "Recite Durga Saptashati or worship Lord Bhairava on Saturday evenings.",
    },
    day: "Saturday (governed with Rahu Kaal importance)",
    color: {
      favorable: ["Smoky Grey", "Electric Blue", "Navy", "Metallic Charcoal"],
      unfavorable: ["Bright Red", "Bright Yellow"],
    },
    gemstone: {
      name: "Hessonite Garnet (Gomedh)",
      sanskrit: "गोमेद",
      carat: "4 to 7 carats",
      metal: "Silver or Ashtadhatu",
      finger: "Middle Finger (Madhyama) of the right hand",
      day: "Saturday during twilight / evening",
      time: "2 hours after Sunset",
      substituteGems: ["Brown Tourmaline", "Spessartite"],
    },
    mantra: {
      sanskrit: "ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः",
      transliteration: "Om Bhraam Bhreem Bhroum Sah Rahave Namaha",
      count: 108,
      time: "Night / Twilight",
      duration: "40 days during evening",
      beads: "Rudraksha Mala",
    },
    metal: "Lead, Silver, or Ashtadhatu",
    direction: { favorable: "South-West (Nairutya)", unfavorable: "North-East" },
    friendlyNumbers: [1, 5, 6, 7, 8],
    enemyNumbers: [2, 9],
    neutralNumbers: [3, 4],
    bodyParts: ["Respiratory System", "Nervous Sensitivity", "Calves", "Skin Allergies"],
    career: [
      "Information Technology, AI, Software Engineering, Cryptography",
      "Aviation, Aerospace, Telecommunications",
      "Cinema, Visual Media, Animation, Mass Speculation",
      "Scientific Innovation, Patents, Radical Research",
      "Foreign Trade, Multinational Enterprise",
    ],
    fast: {
      day: "Saturday",
      method: "Observe fasting or consume black sesame and urad dal preparation after sunset.",
    },
    yantra: {
      name: "Rahu Yantra",
      material: "Ashtadhatu or Silver",
      method: "Keep in the South-West zone; worship during evening with mustard oil lamp.",
    },
    generalRemedies: {
      gemstone: "Wear unblemished Honey-colored Hessonite (Gomed) in silver on the middle finger.",
      mantra: "Chant Rahu Beej Mantra or Durga Chalisa 108 times on Wednesday/Saturday nights.",
      charity: "Donate dark blankets, black sesame, mustard oil, or coins to sweepers or lepers on Saturdays.",
      color: "Opt for steel grey, deep navy, and metallic hues; avoid garish fiery tones.",
    },
  },

  5: {
    number: 5,
    planet: "Mercury (Budha)",
    sanskrit: "बुध",
    deity: {
      primary: "Lord Vishnu & Lord Ganesha",
      secondary: "Goddess Saraswati",
      worship: "Worship Lord Ganesha with 21 Durva grass blades on Wednesdays to clear mental obstacles.",
    },
    day: "Wednesday",
    color: {
      favorable: ["Emerald Green", "Mint", "Jade", "Sage", "Olive"],
      unfavorable: ["Fiery Red", "Dark Orange"],
    },
    gemstone: {
      name: "Emerald (Panna)",
      sanskrit: "पन्ना",
      carat: "3 to 6 carats",
      metal: "Yellow Gold or Pure Silver",
      finger: "Little Finger (Kanishtha) of the right hand",
      day: "Wednesday morning during Shukla Paksha",
      time: "Within 2 hours of Sunrise",
      substituteGems: ["Green Tourmaline (Verdelite)", "Peridot", "Tsavorite"],
    },
    mantra: {
      sanskrit: "ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः",
      transliteration: "Om Braam Breem Broum Sah Budhaya Namaha",
      count: 108,
      time: "Morning / Sunrise",
      duration: "Consecutive Wednesdays or 40-day cycle",
      beads: "Tulsi or Green Jade Mala",
    },
    metal: "Brass or Bronze",
    direction: { favorable: "North", unfavorable: "South" },
    friendlyNumbers: [1, 2, 3, 5, 6],
    enemyNumbers: [9],
    neutralNumbers: [4, 7, 8],
    bodyParts: ["Nervous System", "Brain / Intellect", "Speech / Vocal Cords", "Hands", "Skin"],
    career: [
      "Commerce, Trading, Stock Brokerage, E-Commerce",
      "Journalism, Media, Public Relations, Copywriting",
      "Accounting, Auditing, Data Science, Statistics",
      "Diplomacy, Translation, International Logistics",
      "Software Development, Digital Marketing",
    ],
    fast: {
      day: "Wednesday",
      method: "Fast on Wednesdays; eat green mung dal (split green gram) preparation once without salt.",
    },
    yantra: {
      name: "Budha Yantra",
      material: "Copper or Silver plate",
      method: "Place in the North sector of study or office; cleanse with Gangajal on Wednesday.",
    },
    generalRemedies: {
      gemstone: "Wear luminous green Zambian/Colombian Emerald in gold on the right little finger.",
      mantra: "Recite Budha Beej Mantra or Vishnu Sahasranama every Wednesday morning.",
      charity: "Feed green fodder or spinach to cows (Gau Seva); donate green mung beans or green clothes.",
      color: "Wear shades of emerald green and mint on important meetings and exams.",
    },
  },

  6: {
    number: 6,
    planet: "Venus (Shukra)",
    sanskrit: "शुक्र",
    deity: {
      primary: "Goddess Mahalakshmi",
      secondary: "Lord Parashurama",
      worship: "Chant Sri Suktam and offer white lotus or fragrant white flowers to Goddess Lakshmi on Fridays.",
    },
    day: "Friday",
    color: {
      favorable: ["Silky White", "Pastel Pink", "Sky Blue", "Silver", "Iridescent Cream"],
      unfavorable: ["Mustard Yellow", "Rust Red"],
    },
    gemstone: {
      name: "Diamond (Heera)",
      sanskrit: "हीरा",
      carat: "0.5 to 1.5 carats",
      metal: "Platinum or White Gold",
      finger: "Middle Finger or Little Finger of right hand",
      day: "Friday morning at Sunrise",
      time: "Within 1 hour of Sunrise",
      substituteGems: ["White Zircon", "White Sapphire (Safed Pukhraj)", "Opal"],
    },
    mantra: {
      sanskrit: "ॐ द्रां द्रीं द्रौं सः शुक्राय नमः",
      transliteration: "Om Draam Dreem Droum Sah Shukraya Namaha",
      count: 108,
      time: "Sunrise or Dawn",
      duration: "Consecutive Fridays or 40-day cycle",
      beads: "Sphatik (Quartz) or Silver Mala",
    },
    metal: "Silver or Platinum",
    direction: { favorable: "South-East (Agneya)", unfavorable: "North-West" },
    friendlyNumbers: [1, 4, 5, 6, 7, 8],
    enemyNumbers: [3],
    neutralNumbers: [2, 9],
    bodyParts: ["Reproductive System", "Kidneys", "Throat / Voice", "Complexion / Beauty", "Sensory Organs"],
    career: [
      "Fashion, Haute Couture, Interior Architecture, Aesthetics",
      "Fine Arts, Film Direction, Acting, Music, Glamour",
      "Luxury Hotels, Perfumery, Cosmetics, High Dining",
      "Finance, Wealth Advisory, High-Value Real Estate",
      "Jewelry Design, Entertainment Production",
    ],
    fast: {
      day: "Friday",
      method: "Fast on Fridays; avoid sour foods; consume milk, kheer, or white sweets after sunset.",
    },
    yantra: {
      name: "Shukra Yantra",
      material: "Silver or Copper plate",
      method: "Install in the South-East corner; offer fragrant sandalwood and white flowers.",
    },
    generalRemedies: {
      gemstone: "Wear natural Diamond or sparkling White Zircon in platinum/silver.",
      mantra: "Recite Shukra Beej Mantra or Sri Suktam 108 times every Friday morning.",
      charity: "Donate white rice, ghee, curd, sugar, silk clothes, or cosmetics to young girls or women in need.",
      color: "Dress in elegant whites, soft pinks, and refined pastels; apply natural sandalwood perfume.",
    },
  },

  7: {
    number: 7,
    planet: "Ketu (South Lunar Node)",
    sanskrit: "केतु",
    deity: {
      primary: "Lord Ganesha & Lord Matsya Avatar",
      secondary: "Lord Hanuman",
      worship: "Worship Lord Ganesha with modaks and chant Ganesha Atharvashirsha.",
    },
    day: "Tuesday or Thursday (governed with mystic depth)",
    color: {
      favorable: ["Smoky Brown", "Grey", "Multi-colored (Chitrakabara)", "Off-White"],
      unfavorable: ["Jet Black", "Dark Maroon"],
    },
    gemstone: {
      name: "Cat's Eye Chrysoberyl (Lehsuniya / Vaidurya)",
      sanskrit: "वैदूर्य",
      carat: "3 to 6 carats",
      metal: "Silver or Ashtadhatu",
      finger: "Middle Finger (Madhyama) or Ring Finger of right hand",
      day: "Thursday or Tuesday evening during Shukla Paksha",
      time: "At Midnight or Twilight",
      substituteGems: ["Tiger's Eye", "Quartz Cat's Eye"],
    },
    mantra: {
      sanskrit: "ॐ स्रां स्रीं स्रौं सः केतवे नमः",
      transliteration: "Om Sraam Sreem Sroum Sah Ketave Namaha",
      count: 108,
      time: "Twilight / Night",
      duration: "40 days",
      beads: "Rudraksha or Ashwatha Mala",
    },
    metal: "Iron, Lead, or Ashtadhatu",
    direction: { favorable: "North-East", unfavorable: "South-West" },
    friendlyNumbers: [1, 4, 5, 6],
    enemyNumbers: [2, 9],
    neutralNumbers: [3, 7, 8],
    bodyParts: ["Spine", "Nervous Reflexes", "Feet", "Subconscious Aura", "Occult Faculties"],
    career: [
      "Metaphysics, Astrology, Occultism, Spiritual Healing",
      "Advanced Scientific R&D, Microscopic Analysis, Forensics",
      "Software Debugging, Cyber Security, Deep Web Analytics",
      "Monastic Life, Yoga Instruction, Philosophy",
      "Writing of Esoteric Treatises, Solitary Research",
    ],
    fast: {
      day: "Tuesday or Thursday",
      method: "Fast on Tuesdays; consume simple sattvic food once; feed street dogs.",
    },
    yantra: {
      name: "Ketu Yantra",
      material: "Ashtadhatu or Lead",
      method: "Keep in the prayer altar; offer black and white sesame seeds.",
    },
    generalRemedies: {
      gemstone: "Wear genuine Chrysoberyl Cat's Eye with a sharp chatoyant band in silver.",
      mantra: "Chant Ketu Beej Mantra or Ganesha Atharvashirsha regularly.",
      charity: "Feed multi-colored or black-and-white dogs; donate blankets, sesame, or mustard to monks or sadhus.",
      color: "Favor earthy browns, soft heather grey, and warm off-white.",
    },
  },

  8: {
    number: 8,
    planet: "Saturn (Shani)",
    sanskrit: "शनि",
    deity: {
      primary: "Lord Shani & Lord Hanuman",
      secondary: "Lord Shiva (Mahakal)",
      worship: "Chant Hanuman Chalisa 7 times or light a mustard oil lamp under a Peepal tree on Saturday evenings.",
    },
    day: "Saturday",
    color: {
      favorable: ["Dark Blue", "Jet Black", "Navy", "Indigo", "Steel Grey"],
      unfavorable: ["Bright Red", "Pure Gold / Yellow"],
    },
    gemstone: {
      name: "Blue Sapphire (Neelam)",
      sanskrit: "नीलम",
      carat: "4 to 7 carats",
      metal: "Silver, Platinum, or Ashtadhatu",
      finger: "Middle Finger (Madhyama) of the right hand",
      day: "Saturday evening during Shukla Paksha",
      time: "At Sunset / Twilight",
      substituteGems: ["Amethyst (Katela)", "Iolite (Neeli)", "Blue Topaz"],
    },
    mantra: {
      sanskrit: "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः",
      transliteration: "Om Praam Preem Proum Sah Shanaishcharaya Namaha",
      count: 108,
      time: "Sunset / Evening",
      duration: "Consecutive Saturdays or 40-day cycle",
      beads: "Rudraksha or Dark Wood Mala",
    },
    metal: "Iron or Steel",
    direction: { favorable: "West", unfavorable: "East" },
    friendlyNumbers: [3, 5, 6, 7],
    enemyNumbers: [1, 2, 9],
    neutralNumbers: [4, 8],
    bodyParts: ["Bones", "Teeth", "Joints / Knees", "Legs", "Nails / Hair"],
    career: [
      "Heavy Engineering, Mining, Metallurgy, Petroleum, Oil & Gas",
      "Judiciary, Labor Law, Corporate Governance, Compliance",
      "Real Estate Development, Construction, Infrastructure",
      "Agriculture, Forestry, Archeology, Geology",
      "Long-Term Asset Management, Institutional Logistics",
    ],
    fast: {
      day: "Saturday",
      method: "Fast on Saturdays from sunrise to sunset; eat khichdi prepared with black urad dal after sunset.",
    },
    yantra: {
      name: "Shani Yantra",
      material: "Iron or Copper plate",
      method: "Place in the West quadrant; light a mustard oil lamp every Saturday dusk.",
    },
    generalRemedies: {
      gemstone: "Wear tested, unheated Royal Blue Sapphire or Blue Iolite in silver on middle finger.",
      mantra: "Recite Shani Beej Mantra or Dasharatha Shani Stotram 108 times every Saturday.",
      charity: "Donate mustard oil, black umbrellas, iron cookware, black sesame, or leather footwear to laborers on Saturdays.",
      color: "Embrace deep navy blue, charcoal, and dark indigo tones for grounded authority.",
    },
  },

  9: {
    number: 9,
    planet: "Mars (Mangala)",
    sanskrit: "मङ्गल",
    deity: {
      primary: "Lord Hanuman & Lord Kartikeya (Subrahmanya)",
      secondary: "Lord Narasimha",
      worship: "Chant Sundarkand or Hanuman Chalisa; offer red sindoor and boondi on Tuesdays.",
    },
    day: "Tuesday",
    color: {
      favorable: ["Crimson Red", "Coral Pink", "Scarlet", "Rust"],
      unfavorable: ["Green", "Black"],
    },
    gemstone: {
      name: "Red Coral (Moonga)",
      sanskrit: "मूँगा",
      carat: "6 to 9 carats",
      metal: "Copper or Yellow Gold",
      finger: "Ring Finger (Anamika) of the right hand",
      day: "Tuesday morning during Shukla Paksha",
      time: "Within 1 hour of Sunrise",
      substituteGems: ["Carnelian", "Red Jasper"],
    },
    mantra: {
      sanskrit: "ॐ क्रां क्रीं क्रौं सः भौमाय नमः",
      transliteration: "Om Kraam Kreem Kroum Sah Bhaumaya Namaha",
      count: 108,
      time: "Sunrise / Morning",
      duration: "Consecutive Tuesdays or 40-day cycle",
      beads: "Red Sandalwood (Lal Chandan) or Rudraksha Mala",
    },
    metal: "Pure Copper or Gold",
    direction: { favorable: "South", unfavorable: "North" },
    friendlyNumbers: [1, 2, 3],
    enemyNumbers: [4, 5, 8],
    neutralNumbers: [6, 7, 9],
    bodyParts: ["Muscular System", "Bone Marrow", "Blood / Hemoglobin", "Head", "Vital Adrenals"],
    career: [
      "Military Command, Police, Defense, Security Forces",
      "Surgery, Emergency Medicine, Sports Science, Athletics",
      "Mechanical Engineering, Real Estate, Construction, Architecture",
      "Executive Crisis Management, High-Stakes Operations",
      "Culinary Arts (Executive Chefs), Metallurgy, Weapons/Tools Manufacturing",
    ],
    fast: {
      day: "Tuesday",
      method: "Fast on Tuesdays; consume one meal made of wheat, jaggery, or red lentils without salt after sunset.",
    },
    yantra: {
      name: "Mangala Yantra",
      material: "Copper plate",
      method: "Install in the South quadrant; offer red vermilion and red oleander flowers.",
    },
    generalRemedies: {
      gemstone: "Wear triangular Italian or Japanese Red Coral in copper/gold on right ring finger.",
      mantra: "Chant Mangala Beej Mantra or Hanuman Chalisa daily.",
      charity: "Donate red lentils (masoor dal), copper coins, red sweets, or blood on Tuesdays.",
      color: "Wear vibrant coral red or crimson during competitive endeavors.",
    },
  },
};

/**
 * Reduce to single digit 1-9 strictly
 */
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

/**
 * Calculate Mulank (Driver Number from birth day 1-31)
 */
export function calculateMulank(day: number): number {
  return reduceTo9(day);
}

/**
 * Calculate Bhagyank (Conductor Number from complete DD+MM+YYYY)
 */
export function calculateBhagyank(year: number, month: number, day: number): number {
  const dSum = day
    .toString()
    .split("")
    .reduce((s, c) => s + parseInt(c, 10), 0);
  const mSum = month
    .toString()
    .split("")
    .reduce((s, c) => s + parseInt(c, 10), 0);
  const ySum = year
    .toString()
    .split("")
    .reduce((s, c) => s + parseInt(c, 10), 0);
  return reduceTo9(dSum + mSum + ySum);
}

/**
 * Calculate Namank (Vedic Name Number)
 */
export function calculateNamank(fullName: string): number {
  const clean = fullName.toUpperCase().replace(/[^A-Z]/g, "");
  let sum = 0;
  for (const ch of clean) {
    sum += VEDIC_CHALDEAN_MAP[ch] || 0;
  }
  return reduceTo9(sum || 1);
}

/**
 * Analyze Mulank-Bhagyank relationship synergy
 */
export function analyzeMulankBhagyankRelation(
  mulank: number,
  bhagyank: number
): {
  status: "Highly Auspicious" | "Supportive / Friendly" | "Neutral / Karmic" | "Challenging / Enemy";
  analysis: string;
} {
  const pM = ALL_VEDIC_PLANETS[mulank];
  if (mulank === bhagyank) {
    return {
      status: "Highly Auspicious",
      analysis: `Unified Resonance (${mulank} & ${bhagyank}): Both your inner driver (Mulank) and worldly destiny (Bhagyank) are ruled by ${pM.planet}. Your mind, actions, and destiny are aligned with remarkable singular focus and no internal friction.`,
    };
  }

  if (pM.friendlyNumbers.includes(bhagyank)) {
    return {
      status: "Supportive / Friendly",
      analysis: `Harmonious Synergy (${pM.planet} + ${ALL_VEDIC_PLANETS[bhagyank].planet}): Your personal nature works hand-in-hand with your worldly karmic calling. Success comes steadily through collaborative flow.`,
    };
  }

  if (pM.enemyNumbers.includes(bhagyank)) {
    return {
      status: "Challenging / Enemy",
      analysis: `Dynamic Karmic Friction (${pM.planet} vs. ${ALL_VEDIC_PLANETS[bhagyank].planet}): Your inner personality desires differ markedly from what society or karma expects of you. This tension is your greatest engine of growth; conscious balancing through Vedic remedies is recommended.`,
    };
  }

  return {
    status: "Neutral / Karmic",
    analysis: `Independent Equilibrium (${pM.planet} & ${ALL_VEDIC_PLANETS[bhagyank].planet}): Neither inherently supportive nor conflicting. Your success is self-made, requiring proactive effort and clear goals.`,
  };
}

/**
 * Master Vedic Numerology Profile Calculator
 */
export function calculateCompleteVedicProfile(
  fullName: string,
  birthYear: number,
  birthMonth: number,
  birthDay: number
): VedicNumerologyProfile {
  const mulank = calculateMulank(birthDay);
  const bhagyank = calculateBhagyank(birthYear, birthMonth, birthDay);
  const namank = calculateNamank(fullName);

  const rulingPlanetMulank = ALL_VEDIC_PLANETS[mulank];
  const rulingPlanetBhagyank = ALL_VEDIC_PLANETS[bhagyank];

  const relation = analyzeMulankBhagyankRelation(mulank, bhagyank);

  // Favorable dates based on Mulank series
  const favorableDates = [mulank, mulank + 9, mulank + 18, mulank + 27].filter((d) => d <= 31);

  // Common favorable days
  const favorableDays = Array.from(new Set([rulingPlanetMulank.day, rulingPlanetBhagyank.day]));

  const favorableMonths = ["March", "June", "September", "December"]; // Seasonal solstices & equinoxes

  const luckyColors = Array.from(
    new Set([...rulingPlanetMulank.color.favorable, ...rulingPlanetBhagyank.color.favorable])
  );
  const unluckyColors = Array.from(
    new Set([...rulingPlanetMulank.color.unfavorable, ...rulingPlanetBhagyank.color.unfavorable])
  );

  const charityRemedy: VedicCharityRemedy = {
    items: [
      rulingPlanetMulank.generalRemedies.charity,
      "Grains matching planetary lord",
      "Appropriate colored cloth",
    ],
    day: rulingPlanetMulank.day,
    timing: "Morning or Sunset as prescribed",
    recipient: "Deserving, underprivileged individuals or spiritual institutions",
  };

  return {
    mulank,
    bhagyank,
    namank,
    rulingPlanetMulank,
    rulingPlanetBhagyank,
    mulankBhagyankRelation: relation.status,
    relationAnalysis: relation.analysis,
    favorableDates,
    favorableDays,
    favorableMonths,
    luckyColors,
    unluckyColors,
    gemstoneRemedy: rulingPlanetMulank.gemstone,
    mantraRemedy: rulingPlanetMulank.mantra,
    charityRemedy,
    careerGuidance: rulingPlanetMulank.career,
    healthPredispositions: rulingPlanetMulank.bodyParts,
  };
}
