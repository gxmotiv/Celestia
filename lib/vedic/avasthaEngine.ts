/**
 * Complete Classical Avastha Engine
 * Implements all 4 primary Avastha systems from Brihat Parashara Hora Shastra (BPHS):
 * 1. Baladi Avastha (Age states: Bala, Kumara, Yuva, Vriddha, Mrita with Odd/Even sign reversals)
 * 2. Jagradi Avastha (Wakefulness: Jagrata, Svapna, Sushupti)
 * 3. Deeptadi Avastha (9 Mood/Dignity states: Deepta, Swastha, Pramudita, Santa, Din, Vikala, Duhkhita, Khal, Kopa)
 * 4. Sayanadi Avastha (12 Activity states: Sayana, Upavesana, Netrapani, Prakasana, Gamana, etc.)
 */

export interface BaladiAvastha {
  state: "Bala (Child)" | "Kumara (Youth)" | "Yuva (Adult)" | "Vriddha (Old)" | "Mrita (Dead)";
  sanskrit: string;
  strengthPercent: number;
  description: string;
}

export interface JagradiAvastha {
  state: "Jagrata (Awake)" | "Svapna (Dreaming)" | "Sushupti (Sleeping)";
  sanskrit: string;
  functionalPercent: number;
  functionalDescription: string;
}

export interface DeeptadiAvastha {
  state:
    | "Deepta (Splendid)"
    | "Swastha (Healthy)"
    | "Pramudita (Joyful)"
    | "Santa (Peaceful)"
    | "Din (Distressed)"
    | "Vikala (Anxious)"
    | "Duhkhita (Sad)"
    | "Khal (Wretched)"
    | "Kopa (Angry)";
  sanskrit: string;
  mood: string;
  dignityLevel: "Exalted" | "Own Sign" | "Great Friend" | "Friend" | "Neutral" | "Enemy" | "Debilitated" | "Afflicted";
  advice: string;
}

export interface SayanadiAvastha {
  index: number;
  name: string;
  sanskrit: string;
  meaning: string;
  effect: string;
}

export interface PlanetAvasthas {
  planet: string;
  symbol: string;
  longitude: number;
  signIndex: number;
  signName: string;
  degreeInSign: number;
  isOddSign: boolean;
  baladi: BaladiAvastha;
  jagradi: JagradiAvastha;
  deeptadi: DeeptadiAvastha;
  sayanadi: SayanadiAvastha;
  overallCondition: "Exceptional" | "Robust" | "Balanced" | "Challenged" | "Dormant";
  functionalPotencyPercent: number;
  interpretation: string;
  remedialMeasure: string;
}

export interface AvasthaChartInput {
  ascendant: number;
  planets: {
    [name: string]: {
      longitude: number;
      isRetrograde?: boolean;
    };
  };
  birthDate?: Date;
}

export class AvasthaEngine {
  public static readonly PLANETS = [
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn",
    "Rahu",
    "Ketu",
  ];

  public static readonly PLANET_NUMBERS: Record<string, number> = {
    Sun: 1,
    Moon: 2,
    Mars: 3,
    Mercury: 4,
    Jupiter: 5,
    Venus: 6,
    Saturn: 7,
    Rahu: 8,
    Ketu: 9,
  };

  public static readonly SIGN_NAMES = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];

  public static readonly PLANET_SYMBOLS: Record<string, string> = {
    Sun: "☉",
    Moon: "☽",
    Mars: "♂",
    Mercury: "☿",
    Jupiter: "♃",
    Venus: "♀",
    Saturn: "♄",
    Rahu: "☊",
    Ketu: "☋",
  };

  public calculateAllPlanetAvasthas(input: AvasthaChartInput): PlanetAvasthas[] {
    return AvasthaEngine.PLANETS.map((planet) => this.calculatePlanetAvasthas(planet, input));
  }

  public calculatePlanetAvasthas(planet: string, input: AvasthaChartInput): PlanetAvasthas {
    const pPos = input.planets[planet];
    const lon = pPos ? ((pPos.longitude % 360) + 360) % 360 : 0;
    const signIndex = Math.floor(lon / 30);
    const degreeInSign = lon % 30;
    const isOddSign = signIndex % 2 === 0;

    const baladi = this.calculateBaladiAvastha(degreeInSign, isOddSign);
    const jagradi = this.calculateJagradiAvastha(planet, signIndex);
    const deeptadi = this.calculateDeeptadiAvastha(planet, signIndex, input);
    const sayanadi = this.calculateSayanadiAvastha(planet, lon, input.ascendant);

    const functionalPotencyPercent = Math.round(
      baladi.strengthPercent * 0.4 +
        jagradi.functionalPercent * 0.35 +
        this.getDeeptadiWeight(deeptadi.dignityLevel) * 0.25
    );

    let overallCondition: PlanetAvasthas["overallCondition"] = "Balanced";
    if (functionalPotencyPercent >= 80) overallCondition = "Exceptional";
    else if (functionalPotencyPercent >= 60) overallCondition = "Robust";
    else if (functionalPotencyPercent >= 40) overallCondition = "Balanced";
    else if (functionalPotencyPercent >= 20) overallCondition = "Challenged";
    else overallCondition = "Dormant";

    const interpretation = this.interpretCombinedAvasthas(
      planet,
      baladi,
      jagradi,
      deeptadi,
      sayanadi,
      functionalPotencyPercent
    );
    const remedialMeasure = this.getRemedialGuidance(planet, overallCondition);

    return {
      planet,
      symbol: AvasthaEngine.PLANET_SYMBOLS[planet] || "✦",
      longitude: Math.round(lon * 100) / 100,
      signIndex,
      signName: AvasthaEngine.SIGN_NAMES[signIndex] || "Aries",
      degreeInSign: Math.round(degreeInSign * 100) / 100,
      isOddSign,
      baladi,
      jagradi,
      deeptadi,
      sayanadi,
      overallCondition,
      functionalPotencyPercent,
      interpretation,
      remedialMeasure,
    };
  }

  private calculateBaladiAvastha(deg: number, isOddSign: boolean): BaladiAvastha {
    if (isOddSign) {
      if (deg < 6) {
        return {
          state: "Bala (Child)",
          sanskrit: "बाल (Bala)",
          strengthPercent: 25,
          description: "Infant state: Nascent, pure, requires supportive external nurturance to manifest fruits.",
        };
      } else if (deg < 12) {
        return {
          state: "Kumara (Youth)",
          sanskrit: "कुमार (Kumara)",
          strengthPercent: 50,
          description: "Youthful state: Vigorous, developing strength, energetic growth and continuous striving.",
        };
      } else if (deg < 18) {
        return {
          state: "Yuva (Adult)",
          sanskrit: "युवा (Yuva)",
          strengthPercent: 100,
          description: "Prime adult state: MAXIMUM PEAK POTENCY (100%), fully mature to deliver definitive results.",
        };
      } else if (deg < 24) {
        return {
          state: "Vriddha (Old)",
          sanskrit: "वृद्ध (Vriddha)",
          strengthPercent: 50,
          description: "Elderly state: Deep experiential wisdom, mature insight, yet physical vigor is in decline.",
        };
      } else {
        return {
          state: "Mrita (Dead)",
          sanskrit: "मृत (Mrita)",
          strengthPercent: 10,
          description: "Dormant state: Minimal direct physical output (10%), fruits manifest indirectly.",
        };
      }
    } else {
      if (deg < 6) {
        return {
          state: "Mrita (Dead)",
          sanskrit: "मृत (Mrita)",
          strengthPercent: 10,
          description: "Dormant state in even sign: Weak direct vitality, operates subtly through conjunctions.",
        };
      } else if (deg < 12) {
        return {
          state: "Vriddha (Old)",
          sanskrit: "वृद्ध (Vriddha)",
          strengthPercent: 50,
          description: "Elderly state in even sign: Experienced, contemplative, acts as a wise counselor.",
        };
      } else if (deg < 18) {
        return {
          state: "Yuva (Adult)",
          sanskrit: "युवा (Yuva)",
          strengthPercent: 100,
          description: "Prime adult state in even sign: MAXIMUM PEAK POTENCY (100%), resolute execution.",
        };
      } else if (deg < 24) {
        return {
          state: "Kumara (Youth)",
          sanskrit: "कुमार (Kumara)",
          strengthPercent: 50,
          description: "Youthful state in even sign: Vibrant, receptive, developing resilience.",
        };
      } else {
        return {
          state: "Bala (Child)",
          sanskrit: "बाल (Bala)",
          strengthPercent: 25,
          description: "Infant state in even sign: Fresh beginnings, gentle, requires nurturing environment.",
        };
      }
    }
  }

  private calculateJagradiAvastha(planet: string, sign: number): JagradiAvastha {
    const isExalted = this.isExaltedSign(planet, sign);
    const isOwn = this.isOwnSign(planet, sign);
    const isFriend = this.isFriendSign(planet, sign);

    if (isExalted || isOwn) {
      return {
        state: "Jagrata (Awake)",
        sanskrit: "जाग्रत (Jagrata)",
        functionalPercent: 100,
        functionalDescription: "Fully conscious & vigilant (100% capacity). Delivers clear, proactive, and unhindered results.",
      };
    } else if (isFriend || this.isNeutralSign(planet, sign)) {
      return {
        state: "Svapna (Dreaming)",
        sanskrit: "स्वप्न (Svapna)",
        functionalPercent: 50,
        functionalDescription: "Dreaming state (~50% capacity). Active in intentions, requires conscious effort to materialize.",
      };
    } else {
      return {
        state: "Sushupti (Sleeping)",
        sanskrit: "सुषुप्ति (Sushupti)",
        functionalPercent: 25,
        functionalDescription: "Deep slumber (~25% capacity). Sluggish, promises are slow to awaken.",
      };
    }
  }

  private calculateDeeptadiAvastha(
    planet: string,
    sign: number,
    input: AvasthaChartInput
  ): DeeptadiAvastha {
    if (this.isExaltedSign(planet, sign)) {
      return {
        state: "Deepta (Splendid)",
        sanskrit: "दीप्त (Deepta)",
        mood: "Luminous, regal, confident, and magnanimous",
        dignityLevel: "Exalted",
        advice: "Supreme dignity - bestows royal honor, enduring victory, and clear life direction.",
      };
    }

    if (this.isOwnSign(planet, sign)) {
      return {
        state: "Swastha (Healthy)",
        sanskrit: "स्वस्थ (Swastha)",
        mood: "Comfortable, grounded, sovereign, self-reliant",
        dignityLevel: "Own Sign",
        advice: "Flourishes in its own natural kingdom - steady domestic peace, security, and wealth.",
      };
    }

    if (this.isDebilitatedSign(planet, sign)) {
      return {
        state: "Khal (Wretched)",
        sanskrit: "खल (Khal)",
        mood: "Friction-prone, distressed, vulnerable to hardship",
        dignityLevel: "Debilitated",
        advice: "Lowest point of energy - requires specific remedial propitiation and disciplined patience.",
      };
    }

    const sunLon = input.planets["Sun"]?.longitude;
    const pLon = input.planets[planet]?.longitude;
    if (sunLon !== undefined && pLon !== undefined && planet !== "Sun" && planet !== "Rahu" && planet !== "Ketu") {
      let combustionDistance = Math.abs(pLon - sunLon);
      if (combustionDistance > 180) combustionDistance = 360 - combustionDistance;
      const combustionLimit = planet === "Moon" ? 12 : planet === "Mars" ? 17 : planet === "Mercury" ? 14 : planet === "Jupiter" ? 11 : planet === "Venus" ? 10 : 15;
      if (combustionDistance < combustionLimit) {
        return {
          state: "Vikala (Anxious)",
          sanskrit: "विकल (Vikala)",
          mood: "Combust by solar proximity; anxious, overshadowed",
          dignityLevel: "Afflicted",
          advice: "Ego and solar brightness overshadow individual autonomy - spiritual surrender recommended.",
        };
      }
    }

    if (this.isFriendSign(planet, sign) && [0, 4, 8].includes(sign)) {
      return {
        state: "Pramudita (Joyful)",
        sanskrit: "प्रमुदित (Pramudita)",
        mood: "Cheerful, generous, optimistic, and celebratory",
        dignityLevel: "Great Friend",
        advice: "Warmly hosted by noble allies - creates harmony, joy, and prosperous partnerships.",
      };
    }

    if (this.isFriendSign(planet, sign)) {
      return {
        state: "Santa (Peaceful)",
        sanskrit: "शान्त (Santa)",
        mood: "Tranquil, balanced, cooperative, and ethical",
        dignityLevel: "Friend",
        advice: "Peaceful environment - promotes steady intellectual progress and amicable resolution.",
      };
    }

    if (this.isNeutralSign(planet, sign)) {
      return {
        state: "Din (Distressed)",
        sanskrit: "दीन (Din)",
        mood: "Humble, laboring, self-conscious, modest",
        dignityLevel: "Neutral",
        advice: "Neutral territory - requires personal elbow grease and diligence without relying on luck.",
      };
    }

    return {
      state: "Duhkhita (Sad)",
      sanskrit: "दुःखित (Duhkhita)",
      mood: "Restricted, grief-stricken, embattled, unappreciated",
      dignityLevel: "Enemy",
      advice: "Hostile residence - challenges test character and cultivate inner resilience.",
    };
  }

  private calculateSayanadiAvastha(planet: string, lon: number, ascendant: number): SayanadiAvastha {
    const pNum = AvasthaEngine.PLANET_NUMBERS[planet] || 1;
    const nakshatraNo = Math.floor(lon / (360 / 27)) + 1;
    const navamsaNo = Math.floor((lon % 30) / (30 / 9)) + 1;
    const ascSign = Math.floor(ascendant / 30) + 1;

    const product = pNum * nakshatraNo * navamsaNo + ascSign;
    const stateIdx = ((product % 12) + 12) % 12;

    const sayanadiStates = [
      {
        index: 1,
        name: "Sayana (Resting)",
        sanskrit: "शयन (Sayana)",
        meaning: "Lying down / reclining at ease",
        effect: "Craves comfort and tranquility; inclined to rest, luxury, or contemplative seclusion.",
      },
      {
        index: 2,
        name: "Upavesana (Sitting)",
        sanskrit: "उपवेशन (Upavesana)",
        meaning: "Sitting in council or planning",
        effect: "Intellectually deliberative, prepares strategies, cautious assessment before action.",
      },
      {
        index: 3,
        name: "Netrapani (Eyes on Hands)",
        sanskrit: "नेत्रपाणि (Netrapani)",
        meaning: "Deep meditating / observing discreetly",
        effect: "Operates behind the scenes; secret discernment, vigilant observation of motives.",
      },
      {
        index: 4,
        name: "Prakasana (Illuminating)",
        sanskrit: "प्रकाशन (Prakasana)",
        meaning: "Shining brightly, public visibility",
        effect: "Radiant, expresses creative talents, gains public recognition and honors.",
      },
      {
        index: 5,
        name: "Gamana (Going / Moving)",
        sanskrit: "गमन (Gamana)",
        meaning: "Active movement, journey, pursuit",
        effect: "Dynamic, initiates travel, moves decisively towards goals, overcomes inertia.",
      },
      {
        index: 6,
        name: "Agamana (Returning / Arriving)",
        sanskrit: "आगमन (Agamana)",
        meaning: "Arriving at destination, homecoming",
        effect: "Brings fruits home, reunion with kindred souls, harvest of past endeavors.",
      },
      {
        index: 7,
        name: "Sabhastha (In Royal Assembly)",
        sanskrit: "सभास्थ (Sabhastha)",
        meaning: "Presiding in assembly or court",
        effect: "Commands social respect, participates in governance, dignified speech among peers.",
      },
      {
        index: 8,
        name: "Agama (Attaining Wisdom)",
        sanskrit: "आगम (Agama)",
        meaning: "Study of sacred shastras & sciences",
        effect: "Spiritual discernment, academic absorption, acquiring rare insights.",
      },
      {
        index: 9,
        name: "Bhojana (Feasting / Consuming)",
        sanskrit: "भोजन (Bhojana)",
        meaning: "Dining, enjoying rich sensory feast",
        effect: "Material enjoyment, fine dining, acquisition of riches and nourishing delights.",
      },
      {
        index: 10,
        name: "Nrityalipsa (Desire to Dance / Arts)",
        sanskrit: "नृत्यलिप्सा (Nrityalipsa)",
        meaning: "Aesthetic passion, celebration, music",
        effect: "Artistic charisma, joyous celebration, love for theater, design, and celebration.",
      },
      {
        index: 11,
        name: "Kauthuka (Curious / Sports)",
        sanskrit: "कौतुक (Kauthuka)",
        meaning: "Playful enthusiasm, festive eagerness",
        effect: "Youthful curiosity, sporting victory, playful optimism, and buoyant charisma.",
      },
      {
        index: 12,
        name: "Nidra (Asleep / Torpor)",
        sanskrit: "निद्रा (Nidra)",
        meaning: "Deep slumber, resting senses",
        effect: "Internalized energy, delays external outcomes, favors meditation and restful recovery.",
      },
    ];

    return sayanadiStates[stateIdx];
  }

  private getDeeptadiWeight(dignity: DeeptadiAvastha["dignityLevel"]): number {
    switch (dignity) {
      case "Exalted":
        return 100;
      case "Own Sign":
        return 90;
      case "Great Friend":
        return 80;
      case "Friend":
        return 70;
      case "Neutral":
        return 50;
      case "Afflicted":
        return 35;
      case "Enemy":
        return 30;
      case "Debilitated":
        return 15;
      default:
        return 50;
    }
  }

  private isExaltedSign(planet: string, sign: number): boolean {
    const ex: Record<string, number> = {
      Sun: 0,
      Moon: 1,
      Mars: 9,
      Mercury: 5,
      Jupiter: 3,
      Venus: 11,
      Saturn: 6,
      Rahu: 1,
      Ketu: 7,
    };
    return ex[planet] === sign;
  }

  private isDebilitatedSign(planet: string, sign: number): boolean {
    const deb: Record<string, number> = {
      Sun: 6,
      Moon: 7,
      Mars: 3,
      Mercury: 11,
      Jupiter: 9,
      Venus: 5,
      Saturn: 0,
      Rahu: 7,
      Ketu: 1,
    };
    return deb[planet] === sign;
  }

  private isOwnSign(planet: string, sign: number): boolean {
    const own: Record<string, number[]> = {
      Sun: [4],
      Moon: [3],
      Mars: [0, 7],
      Mercury: [2, 5],
      Jupiter: [8, 11],
      Venus: [1, 6],
      Saturn: [9, 10],
      Rahu: [10],
      Ketu: [8],
    };
    return (own[planet] || []).includes(sign);
  }

  private isFriendSign(planet: string, sign: number): boolean {
    const friends: Record<string, number[]> = {
      Sun: [3, 8, 0],
      Moon: [4, 2, 5],
      Mars: [4, 3, 8],
      Mercury: [4, 1, 6],
      Jupiter: [4, 3, 0],
      Venus: [2, 5, 9, 10],
      Saturn: [2, 5, 1, 6],
      Rahu: [2, 5, 1, 6],
      Ketu: [0, 3, 4, 8],
    };
    return (friends[planet] || []).includes(sign);
  }

  private isNeutralSign(planet: string, sign: number): boolean {
    const neutrals: Record<string, number[]> = {
      Sun: [2, 5],
      Moon: [0, 7, 8, 9, 10, 11],
      Mars: [1, 6, 9, 10],
      Mercury: [0, 7, 8, 9, 10],
      Jupiter: [9, 10],
      Venus: [0, 7, 8, 11],
      Saturn: [8, 11],
      Rahu: [8, 11],
      Ketu: [1, 6, 9, 10],
    };
    return (neutrals[planet] || []).includes(sign);
  }

  private interpretCombinedAvasthas(
    planet: string,
    baladi: BaladiAvastha,
    jagradi: JagradiAvastha,
    deeptadi: DeeptadiAvastha,
    sayanadi: SayanadiAvastha,
    potency: number
  ): string {
    return `${planet} operates at ${potency}% functional potency. It embodies the ${baladi.state} phase (${baladi.strengthPercent}% power), is in a ${jagradi.state} consciousness state, and projects a ${deeptadi.state} disposition. In daily activity, it expresses through ${sayanadi.name} (${sayanadi.meaning}).`;
  }

  private getRemedialGuidance(planet: string, condition: PlanetAvasthas["overallCondition"]): string {
    const remedies: Record<string, string> = {
      Sun: "Chant Gayatri Mantra or Surya Ashtakam at dawn; offer arghya with water and copper vessel; honor paternal figures.",
      Moon: "Practice Pranayama and meditation near water; wear silver; chant Om Namah Shivaya on Mondays; honor mother.",
      Mars: "Chant Hanuman Chalisa; engage in physical training; donate red lentils; cultivate patience before reacting.",
      Mercury: "Chant Vishnu Sahasranama or Budha Beej mantra; study sacred literature; nurture green plants and speech clarity.",
      Jupiter: "Chant Brihaspati mantra or Guru Stotram on Thursdays; respect teachers and mentors; donate yellow grains or turmeric.",
      Venus: "Chant Shukra Stotram; cultivate fine arts and music; treat partners and women with veneration; wear white or silk.",
      Saturn: "Recite Shani Chalisa or Dasharatha Shani Stotram; serve the elderly or underprivileged on Saturdays; light sesame oil lamp.",
      Rahu: "Chant Durga Saptashati or Rahu Beej mantra; maintain clean living quarters; avoid illusions or intoxicants.",
      Ketu: "Chant Ganesha Atharvashirsha; practice detachment and Vipassana meditation; feed stray dogs with devotion.",
    };

    const base = remedies[planet] || "Practice daily mindfulness and mantra japa.";
    if (condition === "Exceptional" || condition === "Robust") {
      return `Fortified graha: Maintain dharmic gratitude. ${base}`;
    }
    return `Remedial propitiation strongly advised: ${base}`;
  }
}
