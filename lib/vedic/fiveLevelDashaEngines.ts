/**
 * Five-Level Classical Vedic Dasha Engines
 * Implements Level 1 (Mahadasha) to Level 5 (Prana) for ALL major Vedic Dasha Systems:
 * 1. Vimshottari Dasha (120 Years - 9 Planets, Parashari)
 * 2. Yogini Dasha (36 Years - 8 Yoginis, Shakta / Parashari)
 * 3. Jaimini Chara Dasha (Sign-Based, Upadesha Sutras)
 * 4. Ashtottari Dasha (108 Years - 8 Planets, Parashari)
 * 5. Kalachakra Dasha (108 Padas / 9 Directional Deities)
 */

export interface DashaLevelItem {
  level: 1 | 2 | 3 | 4 | 5;
  levelLabel: "Mahadasha" | "Antardasha" | "Pratyantardasha" | "Sookshma" | "Prana";
  name: string; // Planet or Sign or Deity or Yogini
  lord?: string;
  fullName: string;
  path: string[];
  startDate: Date;
  endDate: Date;
  startDateFormatted: string;
  endDateFormatted: string;
  durationYears: number;
  durationDays: number;
  durationHours: number;
  durationFormatted: string;
  isCurrent: boolean;
  brief: string;
  tone: "positive" | "neutral" | "challenging";
  hourlyInfluence?: string;
  bestHours?: string;
  actionAdvice?: string;
}

export type VedicDashaSystemId =
  | "Vimshottari"
  | "Yogini"
  | "Chara"
  | "Ashtottari"
  | "Kalachakra"
  | "Shodashottari"
  | "Dwisaptati"
  | "Shastihayani"
  | "Sthira"
  | "Mandooka";

export interface System5LevelHierarchy {
  systemName: VedicDashaSystemId;
  totalCycleYears: number;
  description: string;
  levels: {
    1: DashaLevelItem[];
    2: DashaLevelItem[];
    3: DashaLevelItem[];
    4: DashaLevelItem[];
    5: DashaLevelItem[];
  };
  activeHierarchy: {
    level1: DashaLevelItem | null;
    level2: DashaLevelItem | null;
    level3: DashaLevelItem | null;
    level4: DashaLevelItem | null;
    level5: DashaLevelItem | null;
  };
}

export interface All5LevelDashasResult {
  vimshottari: System5LevelHierarchy;
  yogini: System5LevelHierarchy;
  chara: System5LevelHierarchy;
  ashtottari: System5LevelHierarchy;
  kalachakra: System5LevelHierarchy;
  shodashottari: System5LevelHierarchy;
  dwisaptati: System5LevelHierarchy;
  shastihayani: System5LevelHierarchy;
  sthira: System5LevelHierarchy;
  mandooka: System5LevelHierarchy;
}

// -------------------------------------------------------------
// HELPER UTILITIES
// -------------------------------------------------------------

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDuration(days: number, hours: number): string {
  if (days >= 360) {
    const yrs = Math.floor(days / 360);
    const remMonths = Math.floor((days % 360) / 30);
    return remMonths > 0 ? `${yrs}y ${remMonths}m` : `${yrs}y`;
  }
  if (days >= 30) {
    const mos = Math.floor(days / 30);
    const remDays = Math.round(days % 30);
    return remDays > 0 ? `${mos}m ${remDays}d` : `${mos}m`;
  }
  if (days >= 1) {
    const d = Math.floor(days);
    return hours > 0 ? `${d}d ${hours}h` : `${d}d`;
  }
  return `${hours}h`;
}

// =============================================================
// 1. VIMSHOTTARI 5-LEVEL ENGINE (120 Years)
// =============================================================

export class Vimshottari5LevelEngine {
  public static readonly PLANETS = [
    { name: "Ketu", years: 7, tone: "neutral" as const, hours: "04:00 - 06:30" },
    { name: "Venus", years: 20, tone: "positive" as const, hours: "17:30 - 20:00" },
    { name: "Sun", years: 6, tone: "positive" as const, hours: "11:00 - 13:30" },
    { name: "Moon", years: 10, tone: "neutral" as const, hours: "20:30 - 23:00" },
    { name: "Mars", years: 7, tone: "challenging" as const, hours: "06:30 - 08:30" },
    { name: "Rahu", years: 18, tone: "neutral" as const, hours: "15:00 - 17:00" },
    { name: "Jupiter", years: 16, tone: "positive" as const, hours: "08:30 - 11:00" },
    { name: "Saturn", years: 19, tone: "challenging" as const, hours: "13:30 - 15:30" },
    { name: "Mercury", years: 17, tone: "positive" as const, hours: "09:00 - 11:30" },
  ];

  public static readonly SEQUENCE = [
    "Ketu",
    "Venus",
    "Sun",
    "Moon",
    "Mars",
    "Rahu",
    "Jupiter",
    "Saturn",
    "Mercury",
  ];

  public static readonly NAKSHATRA_LORDS = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury", // 1-9
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury", // 10-18
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury", // 19-27
  ];

  public static readonly YEARS_MAP: Record<string, number> = {
    Ketu: 7,
    Venus: 20,
    Sun: 6,
    Moon: 10,
    Mars: 7,
    Rahu: 18,
    Jupiter: 16,
    Saturn: 19,
    Mercury: 17,
  };

  public getSequenceFrom(start: string): string[] {
    const idx = Vimshottari5LevelEngine.SEQUENCE.indexOf(start);
    if (idx === -1) return [...Vimshottari5LevelEngine.SEQUENCE];
    const res: string[] = [];
    for (let i = 0; i < 9; i++) {
      res.push(Vimshottari5LevelEngine.SEQUENCE[(idx + i) % 9]);
    }
    return res;
  }

  public calculate(
    moonNakshatra0Indexed: number,
    moonDegreeInNak: number,
    birthDate: Date,
    refDate: Date = new Date(),
    selectedPath?: { level1?: string; level2?: string; level3?: string; level4?: string }
  ): System5LevelHierarchy {
    const startLord = Vimshottari5LevelEngine.NAKSHATRA_LORDS[moonNakshatra0Indexed % 27] || "Venus";
    const startLordIdx = Vimshottari5LevelEngine.SEQUENCE.indexOf(startLord);

    const totalSpan = 13.333333333333;
    const elapsedFrac = Math.max(0, Math.min(1, moonDegreeInNak / totalSpan));
    const balanceFrac = 1 - elapsedFrac;
    const startYears = Vimshottari5LevelEngine.YEARS_MAP[startLord] * balanceFrac;

    // Level 1: Mahadashas
    const level1: DashaLevelItem[] = [];
    let currentMs = birthDate.getTime();

    for (let i = 0; i < 9; i++) {
      const pLord = Vimshottari5LevelEngine.SEQUENCE[(startLordIdx + i) % 9];
      const pInfo = Vimshottari5LevelEngine.PLANETS.find((p) => p.name === pLord)!;
      const years = i === 0 ? startYears : pInfo.years;
      const durDays = years * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(currentMs);
      const eDate = new Date(currentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level1.push({
        level: 1,
        levelLabel: "Mahadasha",
        name: pLord,
        lord: pLord,
        fullName: `${pLord} Mahadasha`,
        path: [pLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(years * 100) / 100,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: formatDuration(durDays, 0),
        isCurrent: isCur,
        brief: `${pLord} major 120-year cycle ruler shaping life direction.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      currentMs += durMs;
    }

    const activeL1 = level1.find((item) => item.isCurrent) || level1[0];
    const targetL1Name = selectedPath?.level1 || activeL1.name;
    const targetL1 = level1.find((item) => item.name === targetL1Name) || activeL1;

    // Level 2: Antardashas for targetL1
    const level2: DashaLevelItem[] = [];
    let l2CurrentMs = targetL1.startDate.getTime();
    const l2Seq = this.getSequenceFrom(targetL1.name);

    for (const adLord of l2Seq) {
      const pInfo = Vimshottari5LevelEngine.PLANETS.find((p) => p.name === adLord)!;
      const adYears = (targetL1.durationYears * pInfo.years) / 120;
      const durDays = adYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l2CurrentMs);
      const eDate = new Date(l2CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level2.push({
        level: 2,
        levelLabel: "Antardasha",
        name: adLord,
        lord: adLord,
        fullName: `${targetL1.name} > ${adLord} Antardasha`,
        path: [targetL1.name, adLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(adYears * 1000) / 1000,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: formatDuration(durDays, 0),
        isCurrent: isCur,
        brief: `${adLord} activates sub-period energy under ${targetL1.name}.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l2CurrentMs += durMs;
    }

    const activeL2 = level2.find((item) => item.isCurrent) || level2[0];
    const targetL2Name = selectedPath?.level2 || activeL2.name;
    const targetL2 = level2.find((item) => item.name === targetL2Name) || activeL2;

    // Level 3: Pratyantardashas for targetL2
    const level3: DashaLevelItem[] = [];
    let l3CurrentMs = targetL2.startDate.getTime();
    const l3Seq = this.getSequenceFrom(targetL2.name);

    for (const pdLord of l3Seq) {
      const pInfo = Vimshottari5LevelEngine.PLANETS.find((p) => p.name === pdLord)!;
      const pdYears = (targetL2.durationYears * pInfo.years) / 120;
      const durDays = pdYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l3CurrentMs);
      const eDate = new Date(l3CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level3.push({
        level: 3,
        levelLabel: "Pratyantardasha",
        name: pdLord,
        lord: pdLord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${pdLord}`,
        path: [targetL1.name, targetL2.name, pdLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(pdYears * 10000) / 10000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: Math.round((durDays % 1) * 24),
        durationFormatted: formatDuration(durDays, Math.round((durDays % 1) * 24)),
        isCurrent: isCur,
        brief: `${pdLord} sub-sub-period (~months) catalyzing events.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l3CurrentMs += durMs;
    }

    const activeL3 = level3.find((item) => item.isCurrent) || level3[0];
    const targetL3Name = selectedPath?.level3 || activeL3.name;
    const targetL3 = level3.find((item) => item.name === targetL3Name) || activeL3;

    // Level 4: Sookshma for targetL3
    const level4: DashaLevelItem[] = [];
    let l4CurrentMs = targetL3.startDate.getTime();
    const l4Seq = this.getSequenceFrom(targetL3.name);

    for (const sdLord of l4Seq) {
      const pInfo = Vimshottari5LevelEngine.PLANETS.find((p) => p.name === sdLord)!;
      const sdYears = (targetL3.durationYears * pInfo.years) / 120;
      const durDays = sdYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l4CurrentMs);
      const eDate = new Date(l4CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level4.push({
        level: 4,
        levelLabel: "Sookshma",
        name: sdLord,
        lord: sdLord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${sdLord}`,
        path: [targetL1.name, targetL2.name, targetL3.name, sdLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(sdYears * 100000) / 100000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${sdLord} fine-tuning subtle daily mental focus (~weeks).`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l4CurrentMs += durMs;
    }

    const activeL4 = level4.find((item) => item.isCurrent) || level4[0];
    const targetL4Name = selectedPath?.level4 || activeL4.name;
    const targetL4 = level4.find((item) => item.name === targetL4Name) || activeL4;

    // Level 5: Prana for targetL4
    const level5: DashaLevelItem[] = [];
    let l5CurrentMs = targetL4.startDate.getTime();
    const l5Seq = this.getSequenceFrom(targetL4.name);

    for (const prLord of l5Seq) {
      const pInfo = Vimshottari5LevelEngine.PLANETS.find((p) => p.name === prLord)!;
      const prYears = (targetL4.durationYears * pInfo.years) / 120;
      const durDays = prYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l5CurrentMs);
      const eDate = new Date(l5CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level5.push({
        level: 5,
        levelLabel: "Prana",
        name: prLord,
        lord: prLord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${targetL4.name} > ${prLord}`,
        path: [targetL1.name, targetL2.name, targetL3.name, targetL4.name, prLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(prYears * 1000000) / 1000000,
        durationDays: Math.round(durDays * 100) / 100,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${prLord} Prana (~1-3 days): Precise hourly breath and timing execution.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l5CurrentMs += durMs;
    }

    const activeL5 = level5.find((item) => item.isCurrent) || level5[0];

    return {
      systemName: "Vimshottari",
      totalCycleYears: 120,
      description: "Parashari 120-Year Nakshatra System down to Level 5 Prana precision.",
      levels: {
        1: level1,
        2: level2,
        3: level3,
        4: level4,
        5: level5,
      },
      activeHierarchy: {
        level1: activeL1,
        level2: activeL2,
        level3: activeL3,
        level4: activeL4,
        level5: activeL5,
      },
    };
  }
}

// =============================================================
// 2. YOGINI 5-LEVEL ENGINE (36 Years)
// =============================================================

export class Yogini5LevelEngine {
  public static readonly YOGINIS = [
    { name: "Mangala", lord: "Moon", years: 1, tone: "positive" as const, hours: "05:00 - 07:00" },
    { name: "Pingala", lord: "Sun", years: 2, tone: "challenging" as const, hours: "11:30 - 13:30" },
    { name: "Dhanya", lord: "Jupiter", years: 3, tone: "positive" as const, hours: "08:00 - 10:30" },
    { name: "Bhramari", lord: "Mars", years: 4, tone: "challenging" as const, hours: "14:00 - 16:00" },
    { name: "Bhadrika", lord: "Mercury", years: 5, tone: "positive" as const, hours: "09:30 - 11:30" },
    { name: "Ulka", lord: "Saturn", years: 6, tone: "challenging" as const, hours: "16:30 - 18:30" },
    { name: "Siddha", lord: "Venus", years: 7, tone: "positive" as const, hours: "18:30 - 21:00" },
    { name: "Sankata", lord: "Rahu", years: 8, tone: "challenging" as const, hours: "21:00 - 23:30" },
  ];

  public static readonly SEQUENCE = [
    "Mangala",
    "Pingala",
    "Dhanya",
    "Bhramari",
    "Bhadrika",
    "Ulka",
    "Siddha",
    "Sankata",
  ];

  public getSequenceFrom(start: string): string[] {
    const idx = Yogini5LevelEngine.SEQUENCE.indexOf(start);
    if (idx === -1) return [...Yogini5LevelEngine.SEQUENCE];
    const res: string[] = [];
    for (let i = 0; i < 8; i++) {
      res.push(Yogini5LevelEngine.SEQUENCE[(idx + i) % 8]);
    }
    return res;
  }

  public calculate(
    moonNakshatra1Indexed: number,
    moonDegreeInNak: number,
    birthDate: Date,
    refDate: Date = new Date(),
    selectedPath?: { level1?: string; level2?: string; level3?: string; level4?: string }
  ): System5LevelHierarchy {
    // Starting Yogini: (Nakshatra + 3) % 8
    const remainder = (moonNakshatra1Indexed + 3) % 8;
    const startIdx = remainder === 0 ? 7 : remainder - 1;
    const startYogini = Yogini5LevelEngine.YOGINIS[startIdx];

    const totalSpan = 13.333333333333;
    const elapsedFrac = Math.max(0, Math.min(1, moonDegreeInNak / totalSpan));
    const balanceFrac = 1 - elapsedFrac;
    const firstYears = startYogini.years * balanceFrac;

    // Level 1: Major Yoginis
    const level1: DashaLevelItem[] = [];
    let currentMs = birthDate.getTime();

    for (let i = 0; i < 8; i++) {
      const yName = Yogini5LevelEngine.SEQUENCE[(startIdx + i) % 8];
      const yInfo = Yogini5LevelEngine.YOGINIS.find((y) => y.name === yName)!;
      const years = i === 0 ? firstYears : yInfo.years;
      const durDays = years * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(currentMs);
      const eDate = new Date(currentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level1.push({
        level: 1,
        levelLabel: "Mahadasha",
        name: yName,
        lord: yInfo.lord,
        fullName: `${yName} (${yInfo.lord}) Major Yogini`,
        path: [yName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(years * 100) / 100,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: formatDuration(durDays, 0),
        isCurrent: isCur,
        brief: `${yName} governed by ${yInfo.lord} overseeing karma and prosperity.`,
        tone: yInfo.tone,
        bestHours: yInfo.hours,
      });

      currentMs += durMs;
    }

    const activeL1 = level1.find((item) => item.isCurrent) || level1[0];
    const targetL1Name = selectedPath?.level1 || activeL1.name;
    const targetL1 = level1.find((item) => item.name === targetL1Name) || activeL1;

    // Level 2: Antar-Yoginis = (L1_years * Sub_years) / 36
    const level2: DashaLevelItem[] = [];
    let l2CurrentMs = targetL1.startDate.getTime();
    const l2Seq = this.getSequenceFrom(targetL1.name);

    for (const subName of l2Seq) {
      const yInfo = Yogini5LevelEngine.YOGINIS.find((y) => y.name === subName)!;
      const subYears = (targetL1.durationYears * yInfo.years) / 36;
      const durDays = subYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l2CurrentMs);
      const eDate = new Date(l2CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level2.push({
        level: 2,
        levelLabel: "Antardasha",
        name: subName,
        lord: yInfo.lord,
        fullName: `${targetL1.name} > ${subName} Antar-Yogini`,
        path: [targetL1.name, subName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(subYears * 1000) / 1000,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: formatDuration(durDays, 0),
        isCurrent: isCur,
        brief: `${subName} (${yInfo.lord}) sub-influence within ${targetL1.name}.`,
        tone: yInfo.tone,
        bestHours: yInfo.hours,
      });

      l2CurrentMs += durMs;
    }

    const activeL2 = level2.find((item) => item.isCurrent) || level2[0];
    const targetL2Name = selectedPath?.level2 || activeL2.name;
    const targetL2 = level2.find((item) => item.name === targetL2Name) || activeL2;

    // Level 3: Pratyantar-Yoginis = (L2_years * Sub_years) / 36
    const level3: DashaLevelItem[] = [];
    let l3CurrentMs = targetL2.startDate.getTime();
    const l3Seq = this.getSequenceFrom(targetL2.name);

    for (const subName of l3Seq) {
      const yInfo = Yogini5LevelEngine.YOGINIS.find((y) => y.name === subName)!;
      const subYears = (targetL2.durationYears * yInfo.years) / 36;
      const durDays = subYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l3CurrentMs);
      const eDate = new Date(l3CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level3.push({
        level: 3,
        levelLabel: "Pratyantardasha",
        name: subName,
        lord: yInfo.lord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${subName} Pratyantar-Yogini`,
        path: [targetL1.name, targetL2.name, subName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(subYears * 10000) / 10000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: Math.round((durDays % 1) * 24),
        durationFormatted: formatDuration(durDays, Math.round((durDays % 1) * 24)),
        isCurrent: isCur,
        brief: `${subName} Level 3 timing catalyst in Yogini cycle.`,
        tone: yInfo.tone,
        bestHours: yInfo.hours,
      });

      l3CurrentMs += durMs;
    }

    const activeL3 = level3.find((item) => item.isCurrent) || level3[0];
    const targetL3Name = selectedPath?.level3 || activeL3.name;
    const targetL3 = level3.find((item) => item.name === targetL3Name) || activeL3;

    // Level 4: Sookshma-Yoginis = (L3_years * Sub_years) / 36
    const level4: DashaLevelItem[] = [];
    let l4CurrentMs = targetL3.startDate.getTime();
    const l4Seq = this.getSequenceFrom(targetL3.name);

    for (const subName of l4Seq) {
      const yInfo = Yogini5LevelEngine.YOGINIS.find((y) => y.name === subName)!;
      const subYears = (targetL3.durationYears * yInfo.years) / 36;
      const durDays = subYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l4CurrentMs);
      const eDate = new Date(l4CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level4.push({
        level: 4,
        levelLabel: "Sookshma",
        name: subName,
        lord: yInfo.lord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${subName} Sookshma-Yogini`,
        path: [targetL1.name, targetL2.name, targetL3.name, subName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(subYears * 100000) / 100000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${subName} Level 4 fine sub-period (~days/weeks).`,
        tone: yInfo.tone,
        bestHours: yInfo.hours,
      });

      l4CurrentMs += durMs;
    }

    const activeL4 = level4.find((item) => item.isCurrent) || level4[0];
    const targetL4Name = selectedPath?.level4 || activeL4.name;
    const targetL4 = level4.find((item) => item.name === targetL4Name) || activeL4;

    // Level 5: Prana-Yoginis = (L4_years * Sub_years) / 36
    const level5: DashaLevelItem[] = [];
    let l5CurrentMs = targetL4.startDate.getTime();
    const l5Seq = this.getSequenceFrom(targetL4.name);

    for (const subName of l5Seq) {
      const yInfo = Yogini5LevelEngine.YOGINIS.find((y) => y.name === subName)!;
      const subYears = (targetL4.durationYears * yInfo.years) / 36;
      const durDays = subYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l5CurrentMs);
      const eDate = new Date(l5CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level5.push({
        level: 5,
        levelLabel: "Prana",
        name: subName,
        lord: yInfo.lord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${targetL4.name} > ${subName} Prana-Yogini`,
        path: [targetL1.name, targetL2.name, targetL3.name, targetL4.name, subName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(subYears * 1000000) / 1000000,
        durationDays: Math.round(durDays * 100) / 100,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${subName} Level 5 live Prana pulse (~hours to few days).`,
        tone: yInfo.tone,
        bestHours: yInfo.hours,
      });

      l5CurrentMs += durMs;
    }

    const activeL5 = level5.find((item) => item.isCurrent) || level5[0];

    return {
      systemName: "Yogini",
      totalCycleYears: 36,
      description: "Classical 36-Year Yogini System complete with all 5 hierarchical levels.",
      levels: {
        1: level1,
        2: level2,
        3: level3,
        4: level4,
        5: level5,
      },
      activeHierarchy: {
        level1: activeL1,
        level2: activeL2,
        level3: activeL3,
        level4: activeL4,
        level5: activeL5,
      },
    };
  }
}

// =============================================================
// 3. JAIMINI CHARA DASHA 5-LEVEL ENGINE
// =============================================================

export class Chara5LevelEngine {
  public static readonly SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  public static readonly SIGN_LORDS: Record<string, string> = {
    Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
    Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
    Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
  };

  public getSignSequenceFrom(startSign: string, direct: boolean): string[] {
    const idx = Chara5LevelEngine.SIGNS.indexOf(startSign);
    const validIdx = idx === -1 ? 0 : idx;
    const res: string[] = [];
    for (let i = 0; i < 12; i++) {
      const targetIdx = direct ? (validIdx + i) % 12 : (validIdx - i + 12) % 12;
      res.push(Chara5LevelEngine.SIGNS[targetIdx]);
    }
    return res;
  }

  public getSequenceFrom(startSign: string): string[] {
    return this.getSignSequenceFrom(startSign, true);
  }

  public calculate(
    ascendantSign: string,
    planetsInSigns: Record<string, string>,
    birthDate: Date,
    refDate: Date = new Date(),
    selectedPath?: { level1?: string; level2?: string; level3?: string; level4?: string }
  ): System5LevelHierarchy {
    const startIdx = Chara5LevelEngine.SIGNS.indexOf(ascendantSign);
    const validStart = startIdx === -1 ? 0 : startIdx;
    const isOdd = validStart % 2 === 0; // Aries = 0 (odd 1)
    const directProgression = isOdd;

    // Calculate Level 1: 12 Mahadasha Signs
    const level1: DashaLevelItem[] = [];
    let currentMs = birthDate.getTime();
    let curSignIdx = validStart;

    for (let i = 0; i < 12; i++) {
      const sign = Chara5LevelEngine.SIGNS[curSignIdx];
      // Classical count to 9th house principle (1 to 9 years)
      const ninthIdx = directProgression ? (curSignIdx + 8) % 12 : (curSignIdx - 8 + 12) % 12;
      const count = Math.max(1, Math.min(9, Math.abs(ninthIdx - curSignIdx) || 7));
      const years = count;
      const durDays = years * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(currentMs);
      const eDate = new Date(currentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level1.push({
        level: 1,
        levelLabel: "Mahadasha",
        name: sign,
        lord: Chara5LevelEngine.SIGN_LORDS[sign],
        fullName: `${sign} Rasi Mahadasha`,
        path: [sign],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: years,
        durationDays: durDays,
        durationHours: 0,
        durationFormatted: `${years}y`,
        isCurrent: isCur,
        brief: `Jaimini sign period activating houses governed by ${sign}.`,
        tone: "positive",
        bestHours: "06:00 - 18:00",
      });

      curSignIdx = directProgression ? (curSignIdx + 1) % 12 : (curSignIdx - 1 + 12) % 12;
      currentMs += durMs;
    }

    const activeL1 = level1.find((item) => item.isCurrent) || level1[0];
    const targetL1Name = selectedPath?.level1 || activeL1.name;
    const targetL1 = level1.find((item) => item.name === targetL1Name) || activeL1;

    // Level 2: Antardasha Signs = L1_duration / 12
    const level2: DashaLevelItem[] = [];
    let l2CurrentMs = targetL1.startDate.getTime();
    const l2Seq = this.getSignSequenceFrom(targetL1.name, directProgression);
    const l2Years = targetL1.durationYears / 12;
    const l2Days = l2Years * 360;
    const l2DurMs = l2Days * 24 * 3600 * 1000;

    for (const adSign of l2Seq) {
      const sDate = new Date(l2CurrentMs);
      const eDate = new Date(l2CurrentMs + l2DurMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level2.push({
        level: 2,
        levelLabel: "Antardasha",
        name: adSign,
        lord: Chara5LevelEngine.SIGN_LORDS[adSign],
        fullName: `${targetL1.name} > ${adSign} Antardasha`,
        path: [targetL1.name, adSign],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(l2Years * 1000) / 1000,
        durationDays: Math.round(l2Days),
        durationHours: 0,
        durationFormatted: formatDuration(l2Days, 0),
        isCurrent: isCur,
        brief: `${adSign} sub-sign activation under ${targetL1.name}.`,
        tone: "neutral",
        bestHours: "08:00 - 17:00",
      });

      l2CurrentMs += l2DurMs;
    }

    const activeL2 = level2.find((item) => item.isCurrent) || level2[0];
    const targetL2Name = selectedPath?.level2 || activeL2.name;
    const targetL2 = level2.find((item) => item.name === targetL2Name) || activeL2;

    // Level 3: Pratyantardasha Signs = L2_duration / 12
    const level3: DashaLevelItem[] = [];
    let l3CurrentMs = targetL2.startDate.getTime();
    const l3Seq = this.getSignSequenceFrom(targetL2.name, directProgression);
    const l3Years = targetL2.durationYears / 12;
    const l3Days = l3Years * 360;
    const l3DurMs = l3Days * 24 * 3600 * 1000;

    for (const pdSign of l3Seq) {
      const sDate = new Date(l3CurrentMs);
      const eDate = new Date(l3CurrentMs + l3DurMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level3.push({
        level: 3,
        levelLabel: "Pratyantardasha",
        name: pdSign,
        lord: Chara5LevelEngine.SIGN_LORDS[pdSign],
        fullName: `${targetL1.name} > ${targetL2.name} > ${pdSign}`,
        path: [targetL1.name, targetL2.name, pdSign],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(l3Years * 10000) / 10000,
        durationDays: Math.round(l3Days * 10) / 10,
        durationHours: Math.round((l3Days % 1) * 24),
        durationFormatted: formatDuration(l3Days, Math.round((l3Days % 1) * 24)),
        isCurrent: isCur,
        brief: `${pdSign} Level 3 Jaimini window catalyzing Karaka yogas.`,
        tone: "positive",
        bestHours: "09:00 - 15:00",
      });

      l3CurrentMs += l3DurMs;
    }

    const activeL3 = level3.find((item) => item.isCurrent) || level3[0];
    const targetL3Name = selectedPath?.level3 || activeL3.name;
    const targetL3 = level3.find((item) => item.name === targetL3Name) || activeL3;

    // Level 4: Sookshma Signs = L3_duration / 12
    const level4: DashaLevelItem[] = [];
    let l4CurrentMs = targetL3.startDate.getTime();
    const l4Seq = this.getSignSequenceFrom(targetL3.name, directProgression);
    const l4Years = targetL3.durationYears / 12;
    const l4Days = l4Years * 360;
    const l4DurMs = l4Days * 24 * 3600 * 1000;

    for (const sdSign of l4Seq) {
      const sDate = new Date(l4CurrentMs);
      const eDate = new Date(l4CurrentMs + l4DurMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((l4Days % 1) * 24);

      level4.push({
        level: 4,
        levelLabel: "Sookshma",
        name: sdSign,
        lord: Chara5LevelEngine.SIGN_LORDS[sdSign],
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${sdSign}`,
        path: [targetL1.name, targetL2.name, targetL3.name, sdSign],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(l4Years * 100000) / 100000,
        durationDays: Math.round(l4Days * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(l4Days, hours),
        isCurrent: isCur,
        brief: `${sdSign} fine sub-period focusing daily events.`,
        tone: "neutral",
        bestHours: "10:00 - 14:00",
      });

      l4CurrentMs += l4DurMs;
    }

    const activeL4 = level4.find((item) => item.isCurrent) || level4[0];
    const targetL4Name = selectedPath?.level4 || activeL4.name;
    const targetL4 = level4.find((item) => item.name === targetL4Name) || activeL4;

    // Level 5: Prana Signs = L4_duration / 12
    const level5: DashaLevelItem[] = [];
    let l5CurrentMs = targetL4.startDate.getTime();
    const l5Seq = this.getSignSequenceFrom(targetL4.name, directProgression);
    const l5Years = targetL4.durationYears / 12;
    const l5Days = l5Years * 360;
    const l5DurMs = l5Days * 24 * 3600 * 1000;

    for (const prSign of l5Seq) {
      const sDate = new Date(l5CurrentMs);
      const eDate = new Date(l5CurrentMs + l5DurMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((l5Days % 1) * 24);

      level5.push({
        level: 5,
        levelLabel: "Prana",
        name: prSign,
        lord: Chara5LevelEngine.SIGN_LORDS[prSign],
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${targetL4.name} > ${prSign}`,
        path: [targetL1.name, targetL2.name, targetL3.name, targetL4.name, prSign],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(l5Years * 1000000) / 1000000,
        durationDays: Math.round(l5Days * 100) / 100,
        durationHours: hours,
        durationFormatted: formatDuration(l5Days, hours),
        isCurrent: isCur,
        brief: `${prSign} Level 5 live pulse (~few days precision) under Jaimini Chara.`,
        tone: "positive",
        bestHours: "Daily peak hours",
      });

      l5CurrentMs += l5DurMs;
    }

    const activeL5 = level5.find((item) => item.isCurrent) || level5[0];

    return {
      systemName: "Chara",
      totalCycleYears: level1.reduce((sum, item) => sum + item.durationYears, 0),
      description: "Jaimini Chara Sign-Based System down to Level 5 Prana Sign precision.",
      levels: {
        1: level1,
        2: level2,
        3: level3,
        4: level4,
        5: level5,
      },
      activeHierarchy: {
        level1: activeL1,
        level2: activeL2,
        level3: activeL3,
        level4: activeL4,
        level5: activeL5,
      },
    };
  }
}

// =============================================================
// 4. ASHTOTTARI 5-LEVEL ENGINE (108 Years)
// =============================================================

export class Ashtottari5LevelEngine {
  public static readonly PLANETS = [
    { name: "Sun", years: 6, tone: "positive" as const, hours: "11:00 - 13:00" },
    { name: "Moon", years: 15, tone: "positive" as const, hours: "20:00 - 22:30" },
    { name: "Mars", years: 8, tone: "challenging" as const, hours: "07:00 - 09:00" },
    { name: "Mercury", years: 17, tone: "positive" as const, hours: "09:30 - 12:00" },
    { name: "Saturn", years: 10, tone: "challenging" as const, hours: "14:00 - 16:30" },
    { name: "Jupiter", years: 19, tone: "positive" as const, hours: "08:30 - 11:00" },
    { name: "Rahu", years: 12, tone: "challenging" as const, hours: "16:30 - 18:30" },
    { name: "Venus", years: 21, tone: "positive" as const, hours: "18:00 - 20:30" },
  ];

  public static readonly SEQUENCE = [
    "Sun", "Moon", "Mars", "Mercury", "Saturn", "Jupiter", "Rahu", "Venus"
  ];

  public getPlanetForNakshatra(nakshatraIdx: number): string {
    if ([2, 3, 4].includes(nakshatraIdx)) return "Sun";
    if ([5, 6, 7, 8].includes(nakshatraIdx)) return "Moon";
    if ([9, 10, 11].includes(nakshatraIdx)) return "Mars";
    if ([12, 13, 14, 15].includes(nakshatraIdx)) return "Mercury";
    if ([16, 17, 18].includes(nakshatraIdx)) return "Saturn";
    if ([19, 20, 21].includes(nakshatraIdx)) return "Jupiter";
    if ([22, 23, 24].includes(nakshatraIdx)) return "Rahu";
    return "Venus";
  }

  public getSequenceFrom(start: string): string[] {
    const idx = Ashtottari5LevelEngine.SEQUENCE.indexOf(start);
    if (idx === -1) return [...Ashtottari5LevelEngine.SEQUENCE];
    const res: string[] = [];
    for (let i = 0; i < 8; i++) {
      res.push(Ashtottari5LevelEngine.SEQUENCE[(idx + i) % 8]);
    }
    return res;
  }

  public calculate(
    nakshatra0Indexed: number,
    moonDegreeInNak: number,
    birthDate: Date,
    refDate: Date = new Date(),
    selectedPath?: { level1?: string; level2?: string; level3?: string; level4?: string }
  ): System5LevelHierarchy {
    const startPlanet = this.getPlanetForNakshatra(nakshatra0Indexed);
    const startIdx = Ashtottari5LevelEngine.SEQUENCE.indexOf(startPlanet);
    const startInfo = Ashtottari5LevelEngine.PLANETS.find((p) => p.name === startPlanet)!;

    const totalSpan = 13.333333333333;
    const elapsedFrac = Math.max(0, Math.min(1, moonDegreeInNak / totalSpan));
    const balanceFrac = 1 - elapsedFrac;
    const firstYears = startInfo.years * balanceFrac;

    // Level 1: 8 Mahadashas (108 Years Total)
    const level1: DashaLevelItem[] = [];
    let currentMs = birthDate.getTime();

    for (let i = 0; i < 8; i++) {
      const pName = Ashtottari5LevelEngine.SEQUENCE[(startIdx + i) % 8];
      const pInfo = Ashtottari5LevelEngine.PLANETS.find((p) => p.name === pName)!;
      const years = i === 0 ? firstYears : pInfo.years;
      const durDays = years * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(currentMs);
      const eDate = new Date(currentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level1.push({
        level: 1,
        levelLabel: "Mahadasha",
        name: pName,
        lord: pName,
        fullName: `${pName} Ashtottari Mahadasha`,
        path: [pName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(years * 100) / 100,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: `${years}y`,
        isCurrent: isCur,
        brief: `${pName} 108-year Ashtottari cycle guardian governing life achievements.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      currentMs += durMs;
    }

    const activeL1 = level1.find((item) => item.isCurrent) || level1[0];
    const targetL1Name = selectedPath?.level1 || activeL1.name;
    const targetL1 = level1.find((item) => item.name === targetL1Name) || activeL1;

    // Level 2: Antardashas = (L1_years * Sub_years) / 108
    const level2: DashaLevelItem[] = [];
    let l2CurrentMs = targetL1.startDate.getTime();
    const l2Seq = this.getSequenceFrom(targetL1.name);

    for (const adName of l2Seq) {
      const pInfo = Ashtottari5LevelEngine.PLANETS.find((p) => p.name === adName)!;
      const adYears = (targetL1.durationYears * pInfo.years) / 108;
      const durDays = adYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l2CurrentMs);
      const eDate = new Date(l2CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level2.push({
        level: 2,
        levelLabel: "Antardasha",
        name: adName,
        lord: adName,
        fullName: `${targetL1.name} > ${adName} Antardasha`,
        path: [targetL1.name, adName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(adYears * 1000) / 1000,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: formatDuration(durDays, 0),
        isCurrent: isCur,
        brief: `${adName} sub-period in Ashtottari progression.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l2CurrentMs += durMs;
    }

    const activeL2 = level2.find((item) => item.isCurrent) || level2[0];
    const targetL2Name = selectedPath?.level2 || activeL2.name;
    const targetL2 = level2.find((item) => item.name === targetL2Name) || activeL2;

    // Level 3: Pratyantardashas = (L2_years * Sub_years) / 108
    const level3: DashaLevelItem[] = [];
    let l3CurrentMs = targetL2.startDate.getTime();
    const l3Seq = this.getSequenceFrom(targetL2.name);

    for (const pdName of l3Seq) {
      const pInfo = Ashtottari5LevelEngine.PLANETS.find((p) => p.name === pdName)!;
      const pdYears = (targetL2.durationYears * pInfo.years) / 108;
      const durDays = pdYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l3CurrentMs);
      const eDate = new Date(l3CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level3.push({
        level: 3,
        levelLabel: "Pratyantardasha",
        name: pdName,
        lord: pdName,
        fullName: `${targetL1.name} > ${targetL2.name} > ${pdName}`,
        path: [targetL1.name, targetL2.name, pdName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(pdYears * 10000) / 10000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: Math.round((durDays % 1) * 24),
        durationFormatted: formatDuration(durDays, Math.round((durDays % 1) * 24)),
        isCurrent: isCur,
        brief: `${pdName} Level 3 Ashtottari period.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l3CurrentMs += durMs;
    }

    const activeL3 = level3.find((item) => item.isCurrent) || level3[0];
    const targetL3Name = selectedPath?.level3 || activeL3.name;
    const targetL3 = level3.find((item) => item.name === targetL3Name) || activeL3;

    // Level 4: Sookshma = (L3_years * Sub_years) / 108
    const level4: DashaLevelItem[] = [];
    let l4CurrentMs = targetL3.startDate.getTime();
    const l4Seq = this.getSequenceFrom(targetL3.name);

    for (const sdName of l4Seq) {
      const pInfo = Ashtottari5LevelEngine.PLANETS.find((p) => p.name === sdName)!;
      const sdYears = (targetL3.durationYears * pInfo.years) / 108;
      const durDays = sdYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l4CurrentMs);
      const eDate = new Date(l4CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level4.push({
        level: 4,
        levelLabel: "Sookshma",
        name: sdName,
        lord: sdName,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${sdName}`,
        path: [targetL1.name, targetL2.name, targetL3.name, sdName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(sdYears * 100000) / 100000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${sdName} subtle Ashtottari timing (~days).`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l4CurrentMs += durMs;
    }

    const activeL4 = level4.find((item) => item.isCurrent) || level4[0];
    const targetL4Name = selectedPath?.level4 || activeL4.name;
    const targetL4 = level4.find((item) => item.name === targetL4Name) || activeL4;

    // Level 5: Prana = (L4_years * Sub_years) / 108
    const level5: DashaLevelItem[] = [];
    let l5CurrentMs = targetL4.startDate.getTime();
    const l5Seq = this.getSequenceFrom(targetL4.name);

    for (const prName of l5Seq) {
      const pInfo = Ashtottari5LevelEngine.PLANETS.find((p) => p.name === prName)!;
      const prYears = (targetL4.durationYears * pInfo.years) / 108;
      const durDays = prYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l5CurrentMs);
      const eDate = new Date(l5CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level5.push({
        level: 5,
        levelLabel: "Prana",
        name: prName,
        lord: prName,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${targetL4.name} > ${prName}`,
        path: [targetL1.name, targetL2.name, targetL3.name, targetL4.name, prName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(prYears * 1000000) / 1000000,
        durationDays: Math.round(durDays * 100) / 100,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${prName} Level 5 Live Prana pulse in Ashtottari (~1-3 days).`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l5CurrentMs += durMs;
    }

    const activeL5 = level5.find((item) => item.isCurrent) || level5[0];

    return {
      systemName: "Ashtottari",
      totalCycleYears: 108,
      description: "Parashari 108-Year Ashtottari System down to Level 5 Prana precision.",
      levels: {
        1: level1,
        2: level2,
        3: level3,
        4: level4,
        5: level5,
      },
      activeHierarchy: {
        level1: activeL1,
        level2: activeL2,
        level3: activeL3,
        level4: activeL4,
        level5: activeL5,
      },
    };
  }
}

// =============================================================
// 5. KALACHAKRA 5-LEVEL ENGINE (108 Padas / 45 Years Base)
// =============================================================

export class Kalachakra5LevelEngine {
  public static readonly DEITIES = [
    { name: "Indra", direction: "East", years: 5, tone: "positive" as const, hours: "06:00 - 08:30" },
    { name: "Agni", direction: "Southeast", years: 5, tone: "challenging" as const, hours: "11:30 - 13:30" },
    { name: "Yama", direction: "South", years: 5, tone: "challenging" as const, hours: "13:30 - 15:30" },
    { name: "Nirriti", direction: "Southwest", years: 5, tone: "neutral" as const, hours: "15:30 - 17:30" },
    { name: "Varuna", direction: "West", years: 5, tone: "positive" as const, hours: "17:30 - 19:30" },
    { name: "Vayu", direction: "Northwest", years: 5, tone: "neutral" as const, hours: "19:30 - 21:30" },
    { name: "Kubera", direction: "North", years: 5, tone: "positive" as const, hours: "21:30 - 23:30" },
    { name: "Ishana", direction: "Northeast", years: 5, tone: "positive" as const, hours: "04:00 - 06:00" },
    { name: "Brahma", direction: "Center", years: 5, tone: "positive" as const, hours: "12:00 - 14:00" },
  ];

  public static readonly SEQUENCE = [
    "Indra", "Agni", "Yama", "Nirriti", "Varuna", "Vayu", "Kubera", "Ishana", "Brahma"
  ];

  public getSequenceFrom(start: string): string[] {
    const idx = Kalachakra5LevelEngine.SEQUENCE.indexOf(start);
    if (idx === -1) return [...Kalachakra5LevelEngine.SEQUENCE];
    const res: string[] = [];
    for (let i = 0; i < 9; i++) {
      res.push(Kalachakra5LevelEngine.SEQUENCE[(idx + i) % 9]);
    }
    return res;
  }

  public calculate(
    moonLongitude: number,
    birthDate: Date,
    refDate: Date = new Date(),
    selectedPath?: { level1?: string; level2?: string; level3?: string; level4?: string }
  ): System5LevelHierarchy {
    const nakIdx = Math.floor(moonLongitude / (360 / 27));
    const degInNak = moonLongitude % (360 / 27);
    const pada = Math.floor(degInNak / (13.333333333333 / 4));
    const totalPada = nakIdx * 4 + pada;
    const startIdx = totalPada % 9;

    // Level 1: 9 Deity Cycles (5 Years each = 45 Years Base)
    const level1: DashaLevelItem[] = [];
    let currentMs = birthDate.getTime();

    for (let i = 0; i < 9; i++) {
      const dName = Kalachakra5LevelEngine.SEQUENCE[(startIdx + i) % 9];
      const dInfo = Kalachakra5LevelEngine.DEITIES.find((d) => d.name === dName)!;
      const years = dInfo.years;
      const durDays = years * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(currentMs);
      const eDate = new Date(currentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level1.push({
        level: 1,
        levelLabel: "Mahadasha",
        name: dName,
        lord: dInfo.direction,
        fullName: `${dName} (${dInfo.direction}) Deity Cycle`,
        path: [dName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: years,
        durationDays: durDays,
        durationHours: 0,
        durationFormatted: `${years}y`,
        isCurrent: isCur,
        brief: `Kalachakra celestial movement governed by ${dName} facing ${dInfo.direction}.`,
        tone: dInfo.tone,
        bestHours: dInfo.hours,
      });

      currentMs += durMs;
    }

    const activeL1 = level1.find((item) => item.isCurrent) || level1[0];
    const targetL1Name = selectedPath?.level1 || activeL1.name;
    const targetL1 = level1.find((item) => item.name === targetL1Name) || activeL1;

    // Level 2: Antar-Pada = (L1_years * 5) / 45
    const level2: DashaLevelItem[] = [];
    let l2CurrentMs = targetL1.startDate.getTime();
    const l2Seq = this.getSequenceFrom(targetL1.name);

    for (const adName of l2Seq) {
      const dInfo = Kalachakra5LevelEngine.DEITIES.find((d) => d.name === adName)!;
      const adYears = (targetL1.durationYears * dInfo.years) / 45;
      const durDays = adYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l2CurrentMs);
      const eDate = new Date(l2CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level2.push({
        level: 2,
        levelLabel: "Antardasha",
        name: adName,
        lord: dInfo.direction,
        fullName: `${targetL1.name} > ${adName} Antar-Pada`,
        path: [targetL1.name, adName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(adYears * 1000) / 1000,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: formatDuration(durDays, 0),
        isCurrent: isCur,
        brief: `${adName} directional sub-vector under ${targetL1.name}.`,
        tone: dInfo.tone,
        bestHours: dInfo.hours,
      });

      l2CurrentMs += durMs;
    }

    const activeL2 = level2.find((item) => item.isCurrent) || level2[0];
    const targetL2Name = selectedPath?.level2 || activeL2.name;
    const targetL2 = level2.find((item) => item.name === targetL2Name) || activeL2;

    // Level 3: Pratyantar-Pada = (L2_years * 5) / 45
    const level3: DashaLevelItem[] = [];
    let l3CurrentMs = targetL2.startDate.getTime();
    const l3Seq = this.getSequenceFrom(targetL2.name);

    for (const pdName of l3Seq) {
      const dInfo = Kalachakra5LevelEngine.DEITIES.find((d) => d.name === pdName)!;
      const pdYears = (targetL2.durationYears * dInfo.years) / 45;
      const durDays = pdYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l3CurrentMs);
      const eDate = new Date(l3CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level3.push({
        level: 3,
        levelLabel: "Pratyantardasha",
        name: pdName,
        lord: dInfo.direction,
        fullName: `${targetL1.name} > ${targetL2.name} > ${pdName}`,
        path: [targetL1.name, targetL2.name, pdName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(pdYears * 10000) / 10000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: Math.round((durDays % 1) * 24),
        durationFormatted: formatDuration(durDays, Math.round((durDays % 1) * 24)),
        isCurrent: isCur,
        brief: `${pdName} Level 3 Kalachakra Pada cycle.`,
        tone: dInfo.tone,
        bestHours: dInfo.hours,
      });

      l3CurrentMs += durMs;
    }

    const activeL3 = level3.find((item) => item.isCurrent) || level3[0];
    const targetL3Name = selectedPath?.level3 || activeL3.name;
    const targetL3 = level3.find((item) => item.name === targetL3Name) || activeL3;

    // Level 4: Sookshma-Pada = (L3_years * 5) / 45
    const level4: DashaLevelItem[] = [];
    let l4CurrentMs = targetL3.startDate.getTime();
    const l4Seq = this.getSequenceFrom(targetL3.name);

    for (const sdName of l4Seq) {
      const dInfo = Kalachakra5LevelEngine.DEITIES.find((d) => d.name === sdName)!;
      const sdYears = (targetL3.durationYears * dInfo.years) / 45;
      const durDays = sdYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l4CurrentMs);
      const eDate = new Date(l4CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level4.push({
        level: 4,
        levelLabel: "Sookshma",
        name: sdName,
        lord: dInfo.direction,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${sdName}`,
        path: [targetL1.name, targetL2.name, targetL3.name, sdName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(sdYears * 100000) / 100000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${sdName} subtle directional deity vibration.`,
        tone: dInfo.tone,
        bestHours: dInfo.hours,
      });

      l4CurrentMs += durMs;
    }

    const activeL4 = level4.find((item) => item.isCurrent) || level4[0];
    const targetL4Name = selectedPath?.level4 || activeL4.name;
    const targetL4 = level4.find((item) => item.name === targetL4Name) || activeL4;

    // Level 5: Prana-Pada = (L4_years * 5) / 45
    const level5: DashaLevelItem[] = [];
    let l5CurrentMs = targetL4.startDate.getTime();
    const l5Seq = this.getSequenceFrom(targetL4.name);

    for (const prName of l5Seq) {
      const dInfo = Kalachakra5LevelEngine.DEITIES.find((d) => d.name === prName)!;
      const prYears = (targetL4.durationYears * dInfo.years) / 45;
      const durDays = prYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l5CurrentMs);
      const eDate = new Date(l5CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level5.push({
        level: 5,
        levelLabel: "Prana",
        name: prName,
        lord: dInfo.direction,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${targetL4.name} > ${prName}`,
        path: [targetL1.name, targetL2.name, targetL3.name, targetL4.name, prName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(prYears * 1000000) / 1000000,
        durationDays: Math.round(durDays * 100) / 100,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${prName} Level 5 live pulse (~1-2 days precision).`,
        tone: dInfo.tone,
        bestHours: dInfo.hours,
      });

      l5CurrentMs += durMs;
    }

    const activeL5 = level5.find((item) => item.isCurrent) || level5[0];

    return {
      systemName: "Kalachakra",
      totalCycleYears: 45,
      description: "Kalachakra 108 Pada Deity System down to Level 5 Prana Pada precision.",
      levels: {
        1: level1,
        2: level2,
        3: level3,
        4: level4,
        5: level5,
      },
      activeHierarchy: {
        level1: activeL1,
        level2: activeL2,
        level3: activeL3,
        level4: activeL4,
        level5: activeL5,
      },
    };
  }
}

// =============================================================
// 6. SHODASHOTTARI 5-LEVEL ENGINE (116 Years)
// =============================================================

export class Shodashottari5LevelEngine {
  public static readonly PLANETS = [
    { name: "Sun", years: 11, tone: "positive" as const, hours: "11:00 - 13:00" },
    { name: "Mars", years: 12, tone: "challenging" as const, hours: "06:30 - 08:30" },
    { name: "Jupiter", years: 13, tone: "positive" as const, hours: "08:30 - 11:00" },
    { name: "Saturn", years: 14, tone: "challenging" as const, hours: "13:30 - 15:30" },
    { name: "Ketu", years: 15, tone: "neutral" as const, hours: "04:30 - 06:30" },
    { name: "Moon", years: 16, tone: "positive" as const, hours: "20:00 - 22:30" },
    { name: "Mercury", years: 17, tone: "positive" as const, hours: "09:00 - 11:30" },
    { name: "Venus", years: 18, tone: "positive" as const, hours: "17:30 - 20:00" },
  ];

  public static readonly SEQUENCE = [
    "Sun",
    "Mars",
    "Jupiter",
    "Saturn",
    "Ketu",
    "Moon",
    "Mercury",
    "Venus",
  ];

  public getSequenceFrom(start: string): string[] {
    const idx = Shodashottari5LevelEngine.SEQUENCE.indexOf(start);
    if (idx === -1) return [...Shodashottari5LevelEngine.SEQUENCE];
    const res: string[] = [];
    for (let i = 0; i < 8; i++) {
      res.push(Shodashottari5LevelEngine.SEQUENCE[(idx + i) % 8]);
    }
    return res;
  }

  public calculate(
    moonNakshatra0Indexed: number,
    moonDegreeInNak: number,
    birthDate: Date,
    refDate: Date = new Date(),
    selectedPath?: { level1?: string; level2?: string; level3?: string; level4?: string }
  ): System5LevelHierarchy {
    // Starting planet counted from Pushya (Nakshatra 8, index 7)
    const offset = (moonNakshatra0Indexed - 7 + 28 * 8) % 8;
    const startLord = Shodashottari5LevelEngine.SEQUENCE[offset];
    const startLordIdx = Shodashottari5LevelEngine.SEQUENCE.indexOf(startLord);
    const startPlanetInfo = Shodashottari5LevelEngine.PLANETS.find((p) => p.name === startLord)!;

    const totalSpan = 13.333333333333;
    const elapsedFrac = Math.max(0, Math.min(1, moonDegreeInNak / totalSpan));
    const balanceFrac = 1 - elapsedFrac;
    const startYears = startPlanetInfo.years * balanceFrac;

    // Level 1: Mahadashas
    const level1: DashaLevelItem[] = [];
    let currentMs = birthDate.getTime();

    for (let i = 0; i < 8; i++) {
      const pLord = Shodashottari5LevelEngine.SEQUENCE[(startLordIdx + i) % 8];
      const pInfo = Shodashottari5LevelEngine.PLANETS.find((p) => p.name === pLord)!;
      const years = i === 0 ? startYears : pInfo.years;
      const durDays = years * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(currentMs);
      const eDate = new Date(currentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level1.push({
        level: 1,
        levelLabel: "Mahadasha",
        name: pLord,
        lord: pLord,
        fullName: `${pLord} Shodashottari Mahadasha`,
        path: [pLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(years * 100) / 100,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: formatDuration(durDays, 0),
        isCurrent: isCur,
        brief: `${pLord} conditional 116-year ruler shaping life destiny.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      currentMs += durMs;
    }

    const activeL1 = level1.find((item) => item.isCurrent) || level1[0];
    const targetL1Name = selectedPath?.level1 || activeL1.name;
    const targetL1 = level1.find((item) => item.name === targetL1Name) || activeL1;

    // Level 2: Antardashas = (L1_years * sub_years) / 116
    const level2: DashaLevelItem[] = [];
    let l2CurrentMs = targetL1.startDate.getTime();
    const l2Seq = this.getSequenceFrom(targetL1.name);

    for (const adLord of l2Seq) {
      const pInfo = Shodashottari5LevelEngine.PLANETS.find((p) => p.name === adLord)!;
      const adYears = (targetL1.durationYears * pInfo.years) / 116;
      const durDays = adYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l2CurrentMs);
      const eDate = new Date(l2CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level2.push({
        level: 2,
        levelLabel: "Antardasha",
        name: adLord,
        lord: adLord,
        fullName: `${targetL1.name} > ${adLord} Antardasha`,
        path: [targetL1.name, adLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(adYears * 1000) / 1000,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: formatDuration(durDays, 0),
        isCurrent: isCur,
        brief: `${adLord} sub-cycle within ${targetL1.name}.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l2CurrentMs += durMs;
    }

    const activeL2 = level2.find((item) => item.isCurrent) || level2[0];
    const targetL2Name = selectedPath?.level2 || activeL2.name;
    const targetL2 = level2.find((item) => item.name === targetL2Name) || activeL2;

    // Level 3: Pratyantardashas = (L2_years * sub_years) / 116
    const level3: DashaLevelItem[] = [];
    let l3CurrentMs = targetL2.startDate.getTime();
    const l3Seq = this.getSequenceFrom(targetL2.name);

    for (const pdLord of l3Seq) {
      const pInfo = Shodashottari5LevelEngine.PLANETS.find((p) => p.name === pdLord)!;
      const pdYears = (targetL2.durationYears * pInfo.years) / 116;
      const durDays = pdYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l3CurrentMs);
      const eDate = new Date(l3CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level3.push({
        level: 3,
        levelLabel: "Pratyantardasha",
        name: pdLord,
        lord: pdLord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${pdLord}`,
        path: [targetL1.name, targetL2.name, pdLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(pdYears * 10000) / 10000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${pdLord} timing window (${formatDuration(durDays, hours)}).`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l3CurrentMs += durMs;
    }

    const activeL3 = level3.find((item) => item.isCurrent) || level3[0];
    const targetL3Name = selectedPath?.level3 || activeL3.name;
    const targetL3 = level3.find((item) => item.name === targetL3Name) || activeL3;

    // Level 4: Sookshma = (L3_years * sub_years) / 116
    const level4: DashaLevelItem[] = [];
    let l4CurrentMs = targetL3.startDate.getTime();
    const l4Seq = this.getSequenceFrom(targetL3.name);

    for (const skLord of l4Seq) {
      const pInfo = Shodashottari5LevelEngine.PLANETS.find((p) => p.name === skLord)!;
      const skYears = (targetL3.durationYears * pInfo.years) / 116;
      const durDays = skYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l4CurrentMs);
      const eDate = new Date(l4CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level4.push({
        level: 4,
        levelLabel: "Sookshma",
        name: skLord,
        lord: skLord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${skLord}`,
        path: [targetL1.name, targetL2.name, targetL3.name, skLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(skYears * 100000) / 100000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${skLord} short-term psychological vibration.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l4CurrentMs += durMs;
    }

    const activeL4 = level4.find((item) => item.isCurrent) || level4[0];
    const targetL4Name = selectedPath?.level4 || activeL4.name;
    const targetL4 = level4.find((item) => item.name === targetL4Name) || activeL4;

    // Level 5: Prana = (L4_years * sub_years) / 116
    const level5: DashaLevelItem[] = [];
    let l5CurrentMs = targetL4.startDate.getTime();
    const l5Seq = this.getSequenceFrom(targetL4.name);

    for (const prLord of l5Seq) {
      const pInfo = Shodashottari5LevelEngine.PLANETS.find((p) => p.name === prLord)!;
      const prYears = (targetL4.durationYears * pInfo.years) / 116;
      const durDays = prYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l5CurrentMs);
      const eDate = new Date(l5CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level5.push({
        level: 5,
        levelLabel: "Prana",
        name: prLord,
        lord: prLord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${targetL4.name} > ${prLord}`,
        path: [targetL1.name, targetL2.name, targetL3.name, targetL4.name, prLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(prYears * 1000000) / 1000000,
        durationDays: Math.round(durDays * 100) / 100,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${prLord} Prana pulse (~1-2 days). High-precision action timing.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l5CurrentMs += durMs;
    }

    const activeL5 = level5.find((item) => item.isCurrent) || level5[0];

    return {
      systemName: "Shodashottari",
      totalCycleYears: 116,
      description: "Parashari 116-Year Conditional Nakshatra System down to Level 5 Prana.",
      levels: {
        1: level1,
        2: level2,
        3: level3,
        4: level4,
        5: level5,
      },
      activeHierarchy: {
        level1: activeL1,
        level2: activeL2,
        level3: activeL3,
        level4: activeL4,
        level5: activeL5,
      },
    };
  }
}

// =============================================================
// 7. DWISAPTATI 5-LEVEL ENGINE (168 Years)
// =============================================================

export class Dwisaptati5LevelEngine {
  public static readonly PLANETS = [
    { name: "Sun", years: 21, tone: "positive" as const, hours: "11:00 - 13:00" },
    { name: "Moon", years: 21, tone: "positive" as const, hours: "20:00 - 22:30" },
    { name: "Mars", years: 21, tone: "challenging" as const, hours: "06:30 - 08:30" },
    { name: "Mercury", years: 21, tone: "positive" as const, hours: "09:00 - 11:30" },
    { name: "Jupiter", years: 21, tone: "positive" as const, hours: "08:30 - 11:00" },
    { name: "Venus", years: 21, tone: "positive" as const, hours: "17:30 - 20:00" },
    { name: "Saturn", years: 21, tone: "challenging" as const, hours: "13:30 - 15:30" },
    { name: "Rahu", years: 21, tone: "neutral" as const, hours: "15:00 - 17:00" },
  ];

  public static readonly SEQUENCE = [
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn",
    "Rahu",
  ];

  public getSequenceFrom(start: string): string[] {
    const idx = Dwisaptati5LevelEngine.SEQUENCE.indexOf(start);
    if (idx === -1) return [...Dwisaptati5LevelEngine.SEQUENCE];
    const res: string[] = [];
    for (let i = 0; i < 8; i++) {
      res.push(Dwisaptati5LevelEngine.SEQUENCE[(idx + i) % 8]);
    }
    return res;
  }

  public calculate(
    moonNakshatra0Indexed: number,
    moonDegreeInNak: number,
    birthDate: Date,
    refDate: Date = new Date(),
    selectedPath?: { level1?: string; level2?: string; level3?: string; level4?: string }
  ): System5LevelHierarchy {
    // Starting planet counted from Moola (index 18)
    const offset = (moonNakshatra0Indexed - 18 + 27 * 8) % 8;
    const startLord = Dwisaptati5LevelEngine.SEQUENCE[offset];
    const startLordIdx = Dwisaptati5LevelEngine.SEQUENCE.indexOf(startLord);
    const startPlanetInfo = Dwisaptati5LevelEngine.PLANETS.find((p) => p.name === startLord)!;

    const totalSpan = 13.333333333333;
    const elapsedFrac = Math.max(0, Math.min(1, moonDegreeInNak / totalSpan));
    const balanceFrac = 1 - elapsedFrac;
    const startYears = startPlanetInfo.years * balanceFrac;

    // Level 1: Mahadashas
    const level1: DashaLevelItem[] = [];
    let currentMs = birthDate.getTime();

    for (let i = 0; i < 8; i++) {
      const pLord = Dwisaptati5LevelEngine.SEQUENCE[(startLordIdx + i) % 8];
      const pInfo = Dwisaptati5LevelEngine.PLANETS.find((p) => p.name === pLord)!;
      const years = i === 0 ? startYears : pInfo.years;
      const durDays = years * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(currentMs);
      const eDate = new Date(currentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level1.push({
        level: 1,
        levelLabel: "Mahadasha",
        name: pLord,
        lord: pLord,
        fullName: `${pLord} Dwisaptati Mahadasha`,
        path: [pLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(years * 100) / 100,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: formatDuration(durDays, 0),
        isCurrent: isCur,
        brief: `${pLord} 168-year conditional cycle period.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      currentMs += durMs;
    }

    const activeL1 = level1.find((item) => item.isCurrent) || level1[0];
    const targetL1Name = selectedPath?.level1 || activeL1.name;
    const targetL1 = level1.find((item) => item.name === targetL1Name) || activeL1;

    // Level 2: Antardashas = (L1_years * sub_years) / 168
    const level2: DashaLevelItem[] = [];
    let l2CurrentMs = targetL1.startDate.getTime();
    const l2Seq = this.getSequenceFrom(targetL1.name);

    for (const adLord of l2Seq) {
      const pInfo = Dwisaptati5LevelEngine.PLANETS.find((p) => p.name === adLord)!;
      const adYears = (targetL1.durationYears * pInfo.years) / 168;
      const durDays = adYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l2CurrentMs);
      const eDate = new Date(l2CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level2.push({
        level: 2,
        levelLabel: "Antardasha",
        name: adLord,
        lord: adLord,
        fullName: `${targetL1.name} > ${adLord}`,
        path: [targetL1.name, adLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(adYears * 1000) / 1000,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: formatDuration(durDays, 0),
        isCurrent: isCur,
        brief: `${adLord} sub-cycle within ${targetL1.name}.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l2CurrentMs += durMs;
    }

    const activeL2 = level2.find((item) => item.isCurrent) || level2[0];
    const targetL2Name = selectedPath?.level2 || activeL2.name;
    const targetL2 = level2.find((item) => item.name === targetL2Name) || activeL2;

    // Level 3: Pratyantardashas = (L2_years * sub_years) / 168
    const level3: DashaLevelItem[] = [];
    let l3CurrentMs = targetL2.startDate.getTime();
    const l3Seq = this.getSequenceFrom(targetL2.name);

    for (const pdLord of l3Seq) {
      const pInfo = Dwisaptati5LevelEngine.PLANETS.find((p) => p.name === pdLord)!;
      const pdYears = (targetL2.durationYears * pInfo.years) / 168;
      const durDays = pdYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l3CurrentMs);
      const eDate = new Date(l3CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level3.push({
        level: 3,
        levelLabel: "Pratyantardasha",
        name: pdLord,
        lord: pdLord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${pdLord}`,
        path: [targetL1.name, targetL2.name, pdLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(pdYears * 10000) / 10000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${pdLord} sub-sub window (${formatDuration(durDays, hours)}).`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l3CurrentMs += durMs;
    }

    const activeL3 = level3.find((item) => item.isCurrent) || level3[0];
    const targetL3Name = selectedPath?.level3 || activeL3.name;
    const targetL3 = level3.find((item) => item.name === targetL3Name) || activeL3;

    // Level 4: Sookshma = (L3_years * sub_years) / 168
    const level4: DashaLevelItem[] = [];
    let l4CurrentMs = targetL3.startDate.getTime();
    const l4Seq = this.getSequenceFrom(targetL3.name);

    for (const skLord of l4Seq) {
      const pInfo = Dwisaptati5LevelEngine.PLANETS.find((p) => p.name === skLord)!;
      const skYears = (targetL3.durationYears * pInfo.years) / 168;
      const durDays = skYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l4CurrentMs);
      const eDate = new Date(l4CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level4.push({
        level: 4,
        levelLabel: "Sookshma",
        name: skLord,
        lord: skLord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${skLord}`,
        path: [targetL1.name, targetL2.name, targetL3.name, skLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(skYears * 100000) / 100000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${skLord} fine timing period.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l4CurrentMs += durMs;
    }

    const activeL4 = level4.find((item) => item.isCurrent) || level4[0];
    const targetL4Name = selectedPath?.level4 || activeL4.name;
    const targetL4 = level4.find((item) => item.name === targetL4Name) || activeL4;

    // Level 5: Prana = (L4_years * sub_years) / 168
    const level5: DashaLevelItem[] = [];
    let l5CurrentMs = targetL4.startDate.getTime();
    const l5Seq = this.getSequenceFrom(targetL4.name);

    for (const prLord of l5Seq) {
      const pInfo = Dwisaptati5LevelEngine.PLANETS.find((p) => p.name === prLord)!;
      const prYears = (targetL4.durationYears * pInfo.years) / 168;
      const durDays = prYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l5CurrentMs);
      const eDate = new Date(l5CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level5.push({
        level: 5,
        levelLabel: "Prana",
        name: prLord,
        lord: prLord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${targetL4.name} > ${prLord}`,
        path: [targetL1.name, targetL2.name, targetL3.name, targetL4.name, prLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(prYears * 1000000) / 1000000,
        durationDays: Math.round(durDays * 100) / 100,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${prLord} Prana pulse down to hourly precision.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l5CurrentMs += durMs;
    }

    const activeL5 = level5.find((item) => item.isCurrent) || level5[0];

    return {
      systemName: "Dwisaptati",
      totalCycleYears: 168,
      description: "Parashari 168-Year Conditional Dwisaptati Sama System down to Level 5 Prana.",
      levels: {
        1: level1,
        2: level2,
        3: level3,
        4: level4,
        5: level5,
      },
      activeHierarchy: {
        level1: activeL1,
        level2: activeL2,
        level3: activeL3,
        level4: activeL4,
        level5: activeL5,
      },
    };
  }
}

// =============================================================
// 8. SHASTIHAYANI 5-LEVEL ENGINE (60 Years)
// =============================================================

export class Shastihayani5LevelEngine {
  public static readonly PLANETS = [
    { name: "Jupiter", years: 10, tone: "positive" as const, hours: "08:30 - 11:00" },
    { name: "Sun", years: 10, tone: "positive" as const, hours: "11:00 - 13:00" },
    { name: "Mars", years: 10, tone: "challenging" as const, hours: "06:30 - 08:30" },
    { name: "Moon", years: 6, tone: "positive" as const, hours: "20:00 - 22:30" },
    { name: "Mercury", years: 6, tone: "positive" as const, hours: "09:00 - 11:30" },
    { name: "Venus", years: 6, tone: "positive" as const, hours: "17:30 - 20:00" },
    { name: "Saturn", years: 6, tone: "challenging" as const, hours: "13:30 - 15:30" },
    { name: "Rahu", years: 6, tone: "neutral" as const, hours: "15:00 - 17:00" },
  ];

  public static readonly SEQUENCE = [
    "Jupiter",
    "Sun",
    "Mars",
    "Moon",
    "Mercury",
    "Venus",
    "Saturn",
    "Rahu",
  ];

  public getSequenceFrom(start: string): string[] {
    const idx = Shastihayani5LevelEngine.SEQUENCE.indexOf(start);
    if (idx === -1) return [...Shastihayani5LevelEngine.SEQUENCE];
    const res: string[] = [];
    for (let i = 0; i < 8; i++) {
      res.push(Shastihayani5LevelEngine.SEQUENCE[(idx + i) % 8]);
    }
    return res;
  }

  public calculate(
    moonNakshatra0Indexed: number,
    moonDegreeInNak: number,
    birthDate: Date,
    refDate: Date = new Date(),
    selectedPath?: { level1?: string; level2?: string; level3?: string; level4?: string }
  ): System5LevelHierarchy {
    // Starting planet from Ashwini (0-indexed % 8)
    const offset = moonNakshatra0Indexed % 8;
    const startLord = Shastihayani5LevelEngine.SEQUENCE[offset];
    const startLordIdx = Shastihayani5LevelEngine.SEQUENCE.indexOf(startLord);
    const startPlanetInfo = Shastihayani5LevelEngine.PLANETS.find((p) => p.name === startLord)!;

    const totalSpan = 13.333333333333;
    const elapsedFrac = Math.max(0, Math.min(1, moonDegreeInNak / totalSpan));
    const balanceFrac = 1 - elapsedFrac;
    const startYears = startPlanetInfo.years * balanceFrac;

    // Level 1: Mahadashas
    const level1: DashaLevelItem[] = [];
    let currentMs = birthDate.getTime();

    for (let i = 0; i < 8; i++) {
      const pLord = Shastihayani5LevelEngine.SEQUENCE[(startLordIdx + i) % 8];
      const pInfo = Shastihayani5LevelEngine.PLANETS.find((p) => p.name === pLord)!;
      const years = i === 0 ? startYears : pInfo.years;
      const durDays = years * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(currentMs);
      const eDate = new Date(currentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level1.push({
        level: 1,
        levelLabel: "Mahadasha",
        name: pLord,
        lord: pLord,
        fullName: `${pLord} Shastihayani Mahadasha`,
        path: [pLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(years * 100) / 100,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: formatDuration(durDays, 0),
        isCurrent: isCur,
        brief: `${pLord} 60-year conditional cycle guardian.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      currentMs += durMs;
    }

    const activeL1 = level1.find((item) => item.isCurrent) || level1[0];
    const targetL1Name = selectedPath?.level1 || activeL1.name;
    const targetL1 = level1.find((item) => item.name === targetL1Name) || activeL1;

    // Level 2: Antardashas = (L1_years * sub_years) / 60
    const level2: DashaLevelItem[] = [];
    let l2CurrentMs = targetL1.startDate.getTime();
    const l2Seq = this.getSequenceFrom(targetL1.name);

    for (const adLord of l2Seq) {
      const pInfo = Shastihayani5LevelEngine.PLANETS.find((p) => p.name === adLord)!;
      const adYears = (targetL1.durationYears * pInfo.years) / 60;
      const durDays = adYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l2CurrentMs);
      const eDate = new Date(l2CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level2.push({
        level: 2,
        levelLabel: "Antardasha",
        name: adLord,
        lord: adLord,
        fullName: `${targetL1.name} > ${adLord}`,
        path: [targetL1.name, adLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(adYears * 1000) / 1000,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: formatDuration(durDays, 0),
        isCurrent: isCur,
        brief: `${adLord} sub-period within ${targetL1.name}.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l2CurrentMs += durMs;
    }

    const activeL2 = level2.find((item) => item.isCurrent) || level2[0];
    const targetL2Name = selectedPath?.level2 || activeL2.name;
    const targetL2 = level2.find((item) => item.name === targetL2Name) || activeL2;

    // Level 3: Pratyantardashas = (L2_years * sub_years) / 60
    const level3: DashaLevelItem[] = [];
    let l3CurrentMs = targetL2.startDate.getTime();
    const l3Seq = this.getSequenceFrom(targetL2.name);

    for (const pdLord of l3Seq) {
      const pInfo = Shastihayani5LevelEngine.PLANETS.find((p) => p.name === pdLord)!;
      const pdYears = (targetL2.durationYears * pInfo.years) / 60;
      const durDays = pdYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l3CurrentMs);
      const eDate = new Date(l3CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level3.push({
        level: 3,
        levelLabel: "Pratyantardasha",
        name: pdLord,
        lord: pdLord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${pdLord}`,
        path: [targetL1.name, targetL2.name, pdLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(pdYears * 10000) / 10000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${pdLord} sub-sub cycle.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l3CurrentMs += durMs;
    }

    const activeL3 = level3.find((item) => item.isCurrent) || level3[0];
    const targetL3Name = selectedPath?.level3 || activeL3.name;
    const targetL3 = level3.find((item) => item.name === targetL3Name) || activeL3;

    // Level 4: Sookshma = (L3_years * sub_years) / 60
    const level4: DashaLevelItem[] = [];
    let l4CurrentMs = targetL3.startDate.getTime();
    const l4Seq = this.getSequenceFrom(targetL3.name);

    for (const skLord of l4Seq) {
      const pInfo = Shastihayani5LevelEngine.PLANETS.find((p) => p.name === skLord)!;
      const skYears = (targetL3.durationYears * pInfo.years) / 60;
      const durDays = skYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l4CurrentMs);
      const eDate = new Date(l4CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level4.push({
        level: 4,
        levelLabel: "Sookshma",
        name: skLord,
        lord: skLord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${skLord}`,
        path: [targetL1.name, targetL2.name, targetL3.name, skLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(skYears * 100000) / 100000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${skLord} fine timing window.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l4CurrentMs += durMs;
    }

    const activeL4 = level4.find((item) => item.isCurrent) || level4[0];
    const targetL4Name = selectedPath?.level4 || activeL4.name;
    const targetL4 = level4.find((item) => item.name === targetL4Name) || activeL4;

    // Level 5: Prana = (L4_years * sub_years) / 60
    const level5: DashaLevelItem[] = [];
    let l5CurrentMs = targetL4.startDate.getTime();
    const l5Seq = this.getSequenceFrom(targetL4.name);

    for (const prLord of l5Seq) {
      const pInfo = Shastihayani5LevelEngine.PLANETS.find((p) => p.name === prLord)!;
      const prYears = (targetL4.durationYears * pInfo.years) / 60;
      const durDays = prYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l5CurrentMs);
      const eDate = new Date(l5CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level5.push({
        level: 5,
        levelLabel: "Prana",
        name: prLord,
        lord: prLord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${targetL4.name} > ${prLord}`,
        path: [targetL1.name, targetL2.name, targetL3.name, targetL4.name, prLord],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(prYears * 1000000) / 1000000,
        durationDays: Math.round(durDays * 100) / 100,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${prLord} Prana pulse down to hourly timing.`,
        tone: pInfo.tone,
        bestHours: pInfo.hours,
      });

      l5CurrentMs += durMs;
    }

    const activeL5 = level5.find((item) => item.isCurrent) || level5[0];

    return {
      systemName: "Shastihayani",
      totalCycleYears: 60,
      description: "Parashari 60-Year Conditional System down to Level 5 Prana precision.",
      levels: {
        1: level1,
        2: level2,
        3: level3,
        4: level4,
        5: level5,
      },
      activeHierarchy: {
        level1: activeL1,
        level2: activeL2,
        level3: activeL3,
        level4: activeL4,
        level5: activeL5,
      },
    };
  }
}

// =============================================================
// 9. JAIMINI STHIRA 5-LEVEL ENGINE (96 Years)
// =============================================================

export class Sthira5LevelEngine {
  public static readonly SIGNS = [
    { name: "Aries", years: 7, lord: "Mars", tone: "positive" as const, hours: "06:00 - 08:30" },
    { name: "Taurus", years: 8, lord: "Venus", tone: "positive" as const, hours: "17:30 - 20:00" },
    { name: "Gemini", years: 9, lord: "Mercury", tone: "positive" as const, hours: "09:00 - 11:30" },
    { name: "Cancer", years: 7, lord: "Moon", tone: "neutral" as const, hours: "20:00 - 22:30" },
    { name: "Leo", years: 8, lord: "Sun", tone: "positive" as const, hours: "11:00 - 13:00" },
    { name: "Virgo", years: 9, lord: "Mercury", tone: "positive" as const, hours: "09:00 - 11:30" },
    { name: "Libra", years: 7, lord: "Venus", tone: "positive" as const, hours: "17:30 - 20:00" },
    { name: "Scorpio", years: 8, lord: "Mars", tone: "challenging" as const, hours: "06:30 - 08:30" },
    { name: "Sagittarius", years: 9, lord: "Jupiter", tone: "positive" as const, hours: "08:30 - 11:00" },
    { name: "Capricorn", years: 7, lord: "Saturn", tone: "challenging" as const, hours: "13:30 - 15:30" },
    { name: "Aquarius", years: 8, lord: "Saturn", tone: "neutral" as const, hours: "13:30 - 15:30" },
    { name: "Pisces", years: 9, lord: "Jupiter", tone: "positive" as const, hours: "08:30 - 11:00" },
  ];

  public static readonly SEQUENCE = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  public getSequenceFrom(start: string): string[] {
    const idx = Sthira5LevelEngine.SEQUENCE.indexOf(start);
    if (idx === -1) return [...Sthira5LevelEngine.SEQUENCE];
    const res: string[] = [];
    for (let i = 0; i < 12; i++) {
      res.push(Sthira5LevelEngine.SEQUENCE[(idx + i) % 12]);
    }
    return res;
  }

  public calculate(
    ascendantSign: string,
    birthDate: Date,
    refDate: Date = new Date(),
    selectedPath?: { level1?: string; level2?: string; level3?: string; level4?: string }
  ): System5LevelHierarchy {
    const startSign = Sthira5LevelEngine.SEQUENCE.includes(ascendantSign) ? ascendantSign : "Aries";
    const startIdx = Sthira5LevelEngine.SEQUENCE.indexOf(startSign);

    // Level 1: 12 Signs
    const level1: DashaLevelItem[] = [];
    let currentMs = birthDate.getTime();

    for (let i = 0; i < 12; i++) {
      const sName = Sthira5LevelEngine.SEQUENCE[(startIdx + i) % 12];
      const sInfo = Sthira5LevelEngine.SIGNS.find((s) => s.name === sName)!;
      const years = sInfo.years;
      const durDays = years * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(currentMs);
      const eDate = new Date(currentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level1.push({
        level: 1,
        levelLabel: "Mahadasha",
        name: sName,
        lord: sInfo.lord,
        fullName: `${sName} (${sInfo.lord}) Sthira Dasha`,
        path: [sName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: years,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: `${years}y`,
        isCurrent: isCur,
        brief: `${sName} sign ruled by ${sInfo.lord} spanning ${years} fixed years.`,
        tone: sInfo.tone,
        bestHours: sInfo.hours,
      });

      currentMs += durMs;
    }

    const activeL1 = level1.find((item) => item.isCurrent) || level1[0];
    const targetL1Name = selectedPath?.level1 || activeL1.name;
    const targetL1 = level1.find((item) => item.name === targetL1Name) || activeL1;

    // Level 2: Antardashas = (L1_years * sub_years) / 96
    const level2: DashaLevelItem[] = [];
    let l2CurrentMs = targetL1.startDate.getTime();
    const l2Seq = this.getSequenceFrom(targetL1.name);

    for (const subSign of l2Seq) {
      const sInfo = Sthira5LevelEngine.SIGNS.find((s) => s.name === subSign)!;
      const subYears = (targetL1.durationYears * sInfo.years) / 96;
      const durDays = subYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l2CurrentMs);
      const eDate = new Date(l2CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level2.push({
        level: 2,
        levelLabel: "Antardasha",
        name: subSign,
        lord: sInfo.lord,
        fullName: `${targetL1.name} > ${subSign}`,
        path: [targetL1.name, subSign],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(subYears * 1000) / 1000,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: formatDuration(durDays, 0),
        isCurrent: isCur,
        brief: `${subSign} sub-sign under ${targetL1.name}.`,
        tone: sInfo.tone,
        bestHours: sInfo.hours,
      });

      l2CurrentMs += durMs;
    }

    const activeL2 = level2.find((item) => item.isCurrent) || level2[0];
    const targetL2Name = selectedPath?.level2 || activeL2.name;
    const targetL2 = level2.find((item) => item.name === targetL2Name) || activeL2;

    // Level 3: Pratyantardashas = (L2_years * sub_years) / 96
    const level3: DashaLevelItem[] = [];
    let l3CurrentMs = targetL2.startDate.getTime();
    const l3Seq = this.getSequenceFrom(targetL2.name);

    for (const subSign of l3Seq) {
      const sInfo = Sthira5LevelEngine.SIGNS.find((s) => s.name === subSign)!;
      const subYears = (targetL2.durationYears * sInfo.years) / 96;
      const durDays = subYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l3CurrentMs);
      const eDate = new Date(l3CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level3.push({
        level: 3,
        levelLabel: "Pratyantardasha",
        name: subSign,
        lord: sInfo.lord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${subSign}`,
        path: [targetL1.name, targetL2.name, subSign],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(subYears * 10000) / 10000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${subSign} Pratyantar sign period.`,
        tone: sInfo.tone,
        bestHours: sInfo.hours,
      });

      l3CurrentMs += durMs;
    }

    const activeL3 = level3.find((item) => item.isCurrent) || level3[0];
    const targetL3Name = selectedPath?.level3 || activeL3.name;
    const targetL3 = level3.find((item) => item.name === targetL3Name) || activeL3;

    // Level 4: Sookshma = (L3_years * sub_years) / 96
    const level4: DashaLevelItem[] = [];
    let l4CurrentMs = targetL3.startDate.getTime();
    const l4Seq = this.getSequenceFrom(targetL3.name);

    for (const subSign of l4Seq) {
      const sInfo = Sthira5LevelEngine.SIGNS.find((s) => s.name === subSign)!;
      const subYears = (targetL3.durationYears * sInfo.years) / 96;
      const durDays = subYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l4CurrentMs);
      const eDate = new Date(l4CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level4.push({
        level: 4,
        levelLabel: "Sookshma",
        name: subSign,
        lord: sInfo.lord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${subSign}`,
        path: [targetL1.name, targetL2.name, targetL3.name, subSign],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(subYears * 100000) / 100000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${subSign} Sookshma sign influence.`,
        tone: sInfo.tone,
        bestHours: sInfo.hours,
      });

      l4CurrentMs += durMs;
    }

    const activeL4 = level4.find((item) => item.isCurrent) || level4[0];
    const targetL4Name = selectedPath?.level4 || activeL4.name;
    const targetL4 = level4.find((item) => item.name === targetL4Name) || activeL4;

    // Level 5: Prana = (L4_years * sub_years) / 96
    const level5: DashaLevelItem[] = [];
    let l5CurrentMs = targetL4.startDate.getTime();
    const l5Seq = this.getSequenceFrom(targetL4.name);

    for (const subSign of l5Seq) {
      const sInfo = Sthira5LevelEngine.SIGNS.find((s) => s.name === subSign)!;
      const subYears = (targetL4.durationYears * sInfo.years) / 96;
      const durDays = subYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l5CurrentMs);
      const eDate = new Date(l5CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level5.push({
        level: 5,
        levelLabel: "Prana",
        name: subSign,
        lord: sInfo.lord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${targetL4.name} > ${subSign}`,
        path: [targetL1.name, targetL2.name, targetL3.name, targetL4.name, subSign],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(subYears * 1000000) / 1000000,
        durationDays: Math.round(durDays * 100) / 100,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${subSign} Level 5 sign pulse (~1-2 days).`,
        tone: sInfo.tone,
        bestHours: sInfo.hours,
      });

      l5CurrentMs += durMs;
    }

    const activeL5 = level5.find((item) => item.isCurrent) || level5[0];

    return {
      systemName: "Sthira",
      totalCycleYears: 96,
      description: "Jaimini Sthira 96-Year Sign-Based System down to Level 5 Prana precision.",
      levels: {
        1: level1,
        2: level2,
        3: level3,
        4: level4,
        5: level5,
      },
      activeHierarchy: {
        level1: activeL1,
        level2: activeL2,
        level3: activeL3,
        level4: activeL4,
        level5: activeL5,
      },
    };
  }
}

// =============================================================
// 10. JAIMINI MANDOOKA 5-LEVEL ENGINE (Frog-Leap System)
// =============================================================

export class Mandooka5LevelEngine {
  // Mandooka frog leap progressions:
  // Fire trine -> Earth trine -> Air trine -> Water trine
  public static readonly MANDOOKA_ORDER = [
    "Aries", "Leo", "Sagittarius",
    "Taurus", "Virgo", "Capricorn",
    "Gemini", "Libra", "Aquarius",
    "Cancer", "Scorpio", "Pisces"
  ];

  public static readonly SIGN_DATA = Sthira5LevelEngine.SIGNS;

  public getSequenceFrom(start: string): string[] {
    const idx = Mandooka5LevelEngine.MANDOOKA_ORDER.indexOf(start);
    if (idx === -1) return [...Mandooka5LevelEngine.MANDOOKA_ORDER];
    const res: string[] = [];
    for (let i = 0; i < 12; i++) {
      res.push(Mandooka5LevelEngine.MANDOOKA_ORDER[(idx + i) % 12]);
    }
    return res;
  }

  public calculate(
    ascendantSign: string,
    birthDate: Date,
    refDate: Date = new Date(),
    selectedPath?: { level1?: string; level2?: string; level3?: string; level4?: string }
  ): System5LevelHierarchy {
    const startSign = Mandooka5LevelEngine.MANDOOKA_ORDER.includes(ascendantSign) ? ascendantSign : "Aries";
    const startIdx = Mandooka5LevelEngine.MANDOOKA_ORDER.indexOf(startSign);

    // Level 1: 12 Frog Leap Signs
    const level1: DashaLevelItem[] = [];
    let currentMs = birthDate.getTime();

    for (let i = 0; i < 12; i++) {
      const sName = Mandooka5LevelEngine.MANDOOKA_ORDER[(startIdx + i) % 12];
      const sInfo = Mandooka5LevelEngine.SIGN_DATA.find((s) => s.name === sName)!;
      const years = sInfo.years;
      const durDays = years * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(currentMs);
      const eDate = new Date(currentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level1.push({
        level: 1,
        levelLabel: "Mahadasha",
        name: sName,
        lord: sInfo.lord,
        fullName: `${sName} (${sInfo.lord}) Mandooka Leap`,
        path: [sName],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: years,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: `${years}y`,
        isCurrent: isCur,
        brief: `${sName} Mandooka frog-leap sign ruled by ${sInfo.lord}.`,
        tone: sInfo.tone,
        bestHours: sInfo.hours,
      });

      currentMs += durMs;
    }

    const activeL1 = level1.find((item) => item.isCurrent) || level1[0];
    const targetL1Name = selectedPath?.level1 || activeL1.name;
    const targetL1 = level1.find((item) => item.name === targetL1Name) || activeL1;

    // Level 2: Antardashas = (L1_years * sub_years) / 96
    const level2: DashaLevelItem[] = [];
    let l2CurrentMs = targetL1.startDate.getTime();
    const l2Seq = this.getSequenceFrom(targetL1.name);

    for (const subSign of l2Seq) {
      const sInfo = Mandooka5LevelEngine.SIGN_DATA.find((s) => s.name === subSign)!;
      const subYears = (targetL1.durationYears * sInfo.years) / 96;
      const durDays = subYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l2CurrentMs);
      const eDate = new Date(l2CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();

      level2.push({
        level: 2,
        levelLabel: "Antardasha",
        name: subSign,
        lord: sInfo.lord,
        fullName: `${targetL1.name} > ${subSign}`,
        path: [targetL1.name, subSign],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(subYears * 1000) / 1000,
        durationDays: Math.round(durDays),
        durationHours: 0,
        durationFormatted: formatDuration(durDays, 0),
        isCurrent: isCur,
        brief: `${subSign} Mandooka sub-leap.`,
        tone: sInfo.tone,
        bestHours: sInfo.hours,
      });

      l2CurrentMs += durMs;
    }

    const activeL2 = level2.find((item) => item.isCurrent) || level2[0];
    const targetL2Name = selectedPath?.level2 || activeL2.name;
    const targetL2 = level2.find((item) => item.name === targetL2Name) || activeL2;

    // Level 3: Pratyantardashas = (L2_years * sub_years) / 96
    const level3: DashaLevelItem[] = [];
    let l3CurrentMs = targetL2.startDate.getTime();
    const l3Seq = this.getSequenceFrom(targetL2.name);

    for (const subSign of l3Seq) {
      const sInfo = Mandooka5LevelEngine.SIGN_DATA.find((s) => s.name === subSign)!;
      const subYears = (targetL2.durationYears * sInfo.years) / 96;
      const durDays = subYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l3CurrentMs);
      const eDate = new Date(l3CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level3.push({
        level: 3,
        levelLabel: "Pratyantardasha",
        name: subSign,
        lord: sInfo.lord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${subSign}`,
        path: [targetL1.name, targetL2.name, subSign],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(subYears * 10000) / 10000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${subSign} sub-sub leap.`,
        tone: sInfo.tone,
        bestHours: sInfo.hours,
      });

      l3CurrentMs += durMs;
    }

    const activeL3 = level3.find((item) => item.isCurrent) || level3[0];
    const targetL3Name = selectedPath?.level3 || activeL3.name;
    const targetL3 = level3.find((item) => item.name === targetL3Name) || activeL3;

    // Level 4: Sookshma = (L3_years * sub_years) / 96
    const level4: DashaLevelItem[] = [];
    let l4CurrentMs = targetL3.startDate.getTime();
    const l4Seq = this.getSequenceFrom(targetL3.name);

    for (const subSign of l4Seq) {
      const sInfo = Mandooka5LevelEngine.SIGN_DATA.find((s) => s.name === subSign)!;
      const subYears = (targetL3.durationYears * sInfo.years) / 96;
      const durDays = subYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l4CurrentMs);
      const eDate = new Date(l4CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level4.push({
        level: 4,
        levelLabel: "Sookshma",
        name: subSign,
        lord: sInfo.lord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${subSign}`,
        path: [targetL1.name, targetL2.name, targetL3.name, subSign],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(subYears * 100000) / 100000,
        durationDays: Math.round(durDays * 10) / 10,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${subSign} fine leap period.`,
        tone: sInfo.tone,
        bestHours: sInfo.hours,
      });

      l4CurrentMs += durMs;
    }

    const activeL4 = level4.find((item) => item.isCurrent) || level4[0];
    const targetL4Name = selectedPath?.level4 || activeL4.name;
    const targetL4 = level4.find((item) => item.name === targetL4Name) || activeL4;

    // Level 5: Prana = (L4_years * sub_years) / 96
    const level5: DashaLevelItem[] = [];
    let l5CurrentMs = targetL4.startDate.getTime();
    const l5Seq = this.getSequenceFrom(targetL4.name);

    for (const subSign of l5Seq) {
      const sInfo = Mandooka5LevelEngine.SIGN_DATA.find((s) => s.name === subSign)!;
      const subYears = (targetL4.durationYears * sInfo.years) / 96;
      const durDays = subYears * 360;
      const durMs = durDays * 24 * 3600 * 1000;
      const sDate = new Date(l5CurrentMs);
      const eDate = new Date(l5CurrentMs + durMs);
      const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
      const hours = Math.round((durDays % 1) * 24);

      level5.push({
        level: 5,
        levelLabel: "Prana",
        name: subSign,
        lord: sInfo.lord,
        fullName: `${targetL1.name} > ${targetL2.name} > ${targetL3.name} > ${targetL4.name} > ${subSign}`,
        path: [targetL1.name, targetL2.name, targetL3.name, targetL4.name, subSign],
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: formatDate(sDate),
        endDateFormatted: formatDate(eDate),
        durationYears: Math.round(subYears * 1000000) / 1000000,
        durationDays: Math.round(durDays * 100) / 100,
        durationHours: hours,
        durationFormatted: formatDuration(durDays, hours),
        isCurrent: isCur,
        brief: `${subSign} Level 5 live pulse.`,
        tone: sInfo.tone,
        bestHours: sInfo.hours,
      });

      l5CurrentMs += durMs;
    }

    const activeL5 = level5.find((item) => item.isCurrent) || level5[0];

    return {
      systemName: "Mandooka",
      totalCycleYears: 96,
      description: "Jaimini Mandooka Frog-Leap System down to Level 5 Prana precision.",
      levels: {
        1: level1,
        2: level2,
        3: level3,
        4: level4,
        5: level5,
      },
      activeHierarchy: {
        level1: activeL1,
        level2: activeL2,
        level3: activeL3,
        level4: activeL4,
        level5: activeL5,
      },
    };
  }
}

// =============================================================
// RECURSIVE CHILD GENERATOR FOR FULL 5-LEVEL TREE EXPANSION
// =============================================================

export function generateChildrenForNode(
  systemName: VedicDashaSystemId,
  parent: DashaLevelItem,
  refDate: Date = new Date()
): DashaLevelItem[] {
  if (parent.level >= 5) return [];
  const nextLevel = (parent.level + 1) as 2 | 3 | 4 | 5;
  const nextLevelLabel: Record<2 | 3 | 4 | 5, DashaLevelItem["levelLabel"]> = {
    2: "Antardasha",
    3: "Pratyantardasha",
    4: "Sookshma",
    5: "Prana",
  };

  let subItems: { name: string; lord?: string; years: number; tone: "positive" | "neutral" | "challenging"; hours?: string }[] = [];
  let totalCycleYears = 120;

  if (systemName === "Vimshottari") {
    totalCycleYears = 120;
    const seq = new Vimshottari5LevelEngine().getSequenceFrom(parent.name);
    subItems = seq.map((pLord) => {
      const p = Vimshottari5LevelEngine.PLANETS.find((pl) => pl.name === pLord)!;
      return { name: pLord, lord: pLord, years: p.years, tone: p.tone, hours: p.hours };
    });
  } else if (systemName === "Yogini") {
    totalCycleYears = 36;
    const seq = new Yogini5LevelEngine().getSequenceFrom(parent.name);
    subItems = seq.map((yName) => {
      const y = Yogini5LevelEngine.YOGINIS.find((yo) => yo.name === yName)!;
      return { name: yName, lord: y.lord, years: y.years, tone: y.tone, hours: y.hours };
    });
  } else if (systemName === "Chara") {
    totalCycleYears = 96;
    const seq = new Chara5LevelEngine().getSignSequenceFrom(parent.name, true);
    subItems = seq.map((sName) => {
      const lord = Chara5LevelEngine.SIGN_LORDS[sName] || "Mars";
      return { name: sName, lord, years: 8, tone: "positive" as const, hours: "06:00 - 18:00" };
    });
  } else if (systemName === "Ashtottari") {
    totalCycleYears = 108;
    const seq = new Ashtottari5LevelEngine().getSequenceFrom(parent.name);
    subItems = seq.map((pLord) => {
      const p = Ashtottari5LevelEngine.PLANETS.find((pl) => pl.name === pLord)!;
      return { name: pLord, lord: pLord, years: p.years, tone: p.tone, hours: p.hours };
    });
  } else if (systemName === "Kalachakra") {
    totalCycleYears = 45;
    const seq = new Kalachakra5LevelEngine().getSequenceFrom(parent.name);
    subItems = seq.map((dName) => {
      const d = Kalachakra5LevelEngine.DEITIES.find((de) => de.name === dName)!;
      return { name: dName, lord: d.direction, years: d.years, tone: d.tone, hours: d.hours };
    });
  } else if (systemName === "Shodashottari") {
    totalCycleYears = 116;
    const seq = new Shodashottari5LevelEngine().getSequenceFrom(parent.name);
    subItems = seq.map((pLord) => {
      const p = Shodashottari5LevelEngine.PLANETS.find((pl) => pl.name === pLord)!;
      return { name: pLord, lord: pLord, years: p.years, tone: p.tone, hours: p.hours };
    });
  } else if (systemName === "Dwisaptati") {
    totalCycleYears = 168;
    const seq = new Dwisaptati5LevelEngine().getSequenceFrom(parent.name);
    subItems = seq.map((pLord) => {
      const p = Dwisaptati5LevelEngine.PLANETS.find((pl) => pl.name === pLord)!;
      return { name: pLord, lord: pLord, years: p.years, tone: p.tone, hours: p.hours };
    });
  } else if (systemName === "Shastihayani") {
    totalCycleYears = 60;
    const seq = new Shastihayani5LevelEngine().getSequenceFrom(parent.name);
    subItems = seq.map((pLord) => {
      const p = Shastihayani5LevelEngine.PLANETS.find((pl) => pl.name === pLord)!;
      return { name: pLord, lord: pLord, years: p.years, tone: p.tone, hours: p.hours };
    });
  } else if (systemName === "Sthira") {
    totalCycleYears = 96;
    const seq = new Sthira5LevelEngine().getSequenceFrom(parent.name);
    subItems = seq.map((sName) => {
      const s = Sthira5LevelEngine.SIGNS.find((si) => si.name === sName)!;
      return { name: sName, lord: s.lord, years: s.years, tone: s.tone, hours: s.hours };
    });
  } else if (systemName === "Mandooka") {
    totalCycleYears = 96;
    const seq = new Mandooka5LevelEngine().getSequenceFrom(parent.name);
    subItems = seq.map((sName) => {
      const s = Mandooka5LevelEngine.SIGN_DATA.find((si) => si.name === sName)!;
      return { name: sName, lord: s.lord, years: s.years, tone: s.tone, hours: s.hours };
    });
  }

  const children: DashaLevelItem[] = [];
  let currentMs = parent.startDate.getTime();

  for (const item of subItems) {
    const subYears = (parent.durationYears * item.years) / totalCycleYears;
    const durDays = subYears * 360;
    const durMs = durDays * 24 * 3600 * 1000;
    const sDate = new Date(currentMs);
    const eDate = new Date(currentMs + durMs);
    const isCur = refDate.getTime() >= sDate.getTime() && refDate.getTime() < eDate.getTime();
    const hours = Math.round((durDays % 1) * 24);

    children.push({
      level: nextLevel,
      levelLabel: nextLevelLabel[nextLevel],
      name: item.name,
      lord: item.lord,
      fullName: `${parent.fullName} > ${item.name}`,
      path: [...parent.path, item.name],
      startDate: sDate,
      endDate: eDate,
      startDateFormatted: formatDate(sDate),
      endDateFormatted: formatDate(eDate),
      durationYears: Math.round(subYears * 1000000) / 1000000,
      durationDays: Math.round(durDays * 100) / 100,
      durationHours: hours,
      durationFormatted: formatDuration(durDays, hours),
      isCurrent: isCur,
      brief: `${item.name} (${item.lord || item.name}) Level ${nextLevel} sub-period within ${parent.name}.`,
      tone: item.tone,
      bestHours: item.hours,
    });

    currentMs += durMs;
  }

  return children;
}
