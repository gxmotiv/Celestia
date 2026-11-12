"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
import { WesternChartData } from "@/lib/astronomy/ephemeris";
import { VedicChartData } from "@/lib/astronomy/vedic";
import {
  MultiSystemTransitEngine,
  TRANSIT_SYSTEM_PRESETS,
  TransitSystemConfig,
  DualComparisonResult,
  SystemTransitResult,
} from "@/lib/astronomy/MultiSystemTransitEngine";
import {
  DailyHoroscope,
  TransitEngine,
  PLANET_SYMBOLS,
} from "@/lib/astronomy/transits";
import {
  CompleteBaZiEngine,
  BaZiChart,
  ElementType,
} from "@/lib/astronomy/baziEngine";
import {
  Sparkles,
  Orbit,
  AlertTriangle,
  Clock,
  Compass,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Eye,
  RefreshCw,
  BookOpen,
  Layers,
  Flame,
  HelpCircle,
  Scale,
  Sun,
  Shield,
  Activity,
  Feather,
  Grid3X3,
} from "lucide-react";
import { TransitBiWheel } from "./TransitBiWheel";
import { AshtakavargaPanel } from "./AshtakavargaPanel";

const emptySubscribe = () => () => {};

interface TransitViewProps {
  westernChart: WesternChartData;
  vedicChart?: VedicChartData;
  fullName: string;
  birthDate: string;
  cityName: string;
}

export function TransitView({
  westernChart,
  vedicChart,
  fullName,
  birthDate,
  cityName,
}: TransitViewProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Active Astrological System Mode
  const [systemMode, setSystemMode] = useState<
    "western" | "vedic" | "hellenistic" | "westernSidereal" | "chinese-bazi" | "comparison"
  >("western");

  // Custom House System Override (for Western)
  const [selectedHouseSystem, setSelectedHouseSystem] = useState<
    "auto" | "placidus" | "whole-sign" | "equal" | "porphyry"
  >("auto");

  // BaZi Gender (for Da Yun progression direction)
  const [baZiGender, setBaZiGender] = useState<"Male" | "Female">("Male");

  // Navigation sub-tabs
  const [subTab, setSubTab] = useState<
    "transits" | "majorCycles" | "gocharaRemedies" | "ashtakavargaTransit" | "baziPillars" | "comparison" | "timingWindows" | "forecast" | "biwheel"
  >("transits");

  // Target date for predictions (defaults to today)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPlanetKey, setSelectedPlanetKey] = useState<string>("Saturn");
  const [isEducationModalOpen, setIsEducationModalOpen] = useState<boolean>(false);

  // Parse birth date object safely
  const birthDateObj = useMemo(() => {
    return new Date(birthDate.includes("T") ? birthDate : `${birthDate}T12:00:00Z`);
  }, [birthDate]);

  // Active configuration based on system mode
  const activeConfig: TransitSystemConfig = useMemo(() => {
    if (systemMode === "comparison") return TRANSIT_SYSTEM_PRESETS.western;
    const base = TRANSIT_SYSTEM_PRESETS[systemMode] || TRANSIT_SYSTEM_PRESETS.western;
    if (systemMode === "western") {
      const natalResolvedSystem = westernChart.houseSystem === "WholeSign" ? "whole-sign"
        : westernChart.houseSystem === "Equal" ? "equal"
        : westernChart.houseSystem === "Porphyry" ? "porphyry" : "placidus";
      return {
        ...base,
        houseSystem: selectedHouseSystem === "auto" ? natalResolvedSystem : selectedHouseSystem,
      };
    }
    return base;
  }, [systemMode, selectedHouseSystem, westernChart.houseSystem]);

  // Multi-System Transit Engine Instance
  const multiEngine = useMemo(() => {
    return new MultiSystemTransitEngine(
      activeConfig,
      westernChart,
      vedicChart,
      selectedDate
    );
  }, [activeConfig, westernChart, vedicChart, selectedDate]);

  // Current System Results
  const systemResults: SystemTransitResult = useMemo(() => {
    return multiEngine.calculateSystemTransits(selectedDate);
  }, [multiEngine, selectedDate]);

  // Dual Comparison Results
  const comparisonResults: DualComparisonResult = useMemo(() => {
    return multiEngine.compareSystems(selectedDate);
  }, [multiEngine, selectedDate]);

  // BaZi Engine Instance & Calculation
  const baziEngine = useMemo(() => new CompleteBaZiEngine(), []);
  const baziChart: BaZiChart = useMemo(() => {
    return baziEngine.generateBaZiChart(birthDateObj, baZiGender, selectedDate);
  }, [baziEngine, birthDateObj, baZiGender, selectedDate]);

  // Fallback Daily Horoscope & Timing Windows
  const { dailyHoroscope, legacyEngine } = useMemo(() => {
    const engine = new TransitEngine(westernChart, selectedDate);
    const horoscope = new DailyHoroscope(westernChart);
    return { dailyHoroscope: horoscope, legacyEngine: engine };
  }, [westernChart, selectedDate]);

  const dailyData = useMemo(() => {
    return dailyHoroscope.generateDailyHoroscope(selectedDate);
  }, [dailyHoroscope, selectedDate]);

  const timingWindows = useMemo(() => {
    return legacyEngine.getTimingWindows();
  }, [legacyEngine]);

  const handleDateChange = (daysDelta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + daysDelta);
    setSelectedDate(newDate);
  };

  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-slate-800/80 rounded-full animate-pulse" />
            <div className="h-7 w-72 bg-slate-800/60 rounded-lg animate-pulse" />
            <div className="h-3 w-56 bg-slate-800/40 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-amber-400/80 text-xs font-medium bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl">
            <Orbit className="w-4 h-4 animate-spin text-amber-400" />
            <span>Aligning Multi-System Planetary Ephemeris...</span>
          </div>
        </div>
      </div>
    );
  }

  const selectedPlanetData = systemResults.planets.find(
    (p) => p.name === selectedPlanetKey
  ) || systemResults.planets[0];

  const selectedInterp = systemResults.interpretations[selectedPlanetData?.name] || null;

  // Element Color Palette Helper
  const getElementColor = (el: ElementType | string) => {
    switch (el) {
      case "Wood":
        return "#10b981"; // Emerald
      case "Fire":
        return "#ef4444"; // Red
      case "Earth":
        return "#f59e0b"; // Amber/Gold
      case "Metal":
        return "#cbd5e1"; // Slate/Silver
      case "Water":
        return "#3b82f6"; // Blue
      default:
        return "#94a3b8";
    }
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. TOP SYSTEM SWITCHER & ARCHITECTURAL CONTROLLER            */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/50 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Pure Multi-System Engine
              </span>
              <span className="text-xs text-slate-400">· Zero Cross-System Bleed</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif-celestial font-bold text-slate-100 mt-1.5">
              Planetary Transit & Astrological Prediction Engine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Independent calculation engines for <strong className="text-slate-200">{fullName}</strong> (born {birthDate} in {cityName})
            </p>
          </div>

          {/* Quick Date Stepper & Education Trigger */}
          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            <button
              onClick={() => setIsEducationModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Learn how Western, Vedic, and Chinese BaZi systems differ"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Why Do Systems Differ?</span>
            </button>

            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => handleDateChange(-1)}
                className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors cursor-pointer"
                title="Previous Day"
              >
                ←
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-2.5 py-1 text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset to Today"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Today</span>
              </button>
              <button
                onClick={() => handleDateChange(1)}
                className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors cursor-pointer"
                title="Next Day"
              >
                →
              </button>
              <span className="text-xs text-slate-300 font-medium px-2" suppressHydrationWarning>
                {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
              </span>
            </div>
          </div>
        </div>

        {/* System Preset Selector Grid */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Choose Astrological Calculation Mode:
            </span>

            {systemMode === "western" && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">House System:</span>
                <select
                  value={selectedHouseSystem}
                  onChange={(e) => setSelectedHouseSystem(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-amber-300 text-xs font-medium focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="auto">Auto — follow natal Western chart ({westernChart.houseSystem})</option>
                  <option value="placidus">Placidus (Quadrant)</option>
                  <option value="porphyry">Porphyry (Equal Quadrants)</option>
                  <option value="whole-sign">Whole Sign (Hellenistic)</option>
                  <option value="equal">Equal House (30° from Ascendant)</option>
                </select>
              </div>
            )}

            {systemMode === "chinese-bazi" && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Luck Pillar Gender:</span>
                <select
                  value={baZiGender}
                  onChange={(e) => setBaZiGender(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-red-300 text-xs font-medium focus:outline-none focus:border-red-400 cursor-pointer"
                >
                  <option value="Male">Male (Yang Forward / Yin Reverse)</option>
                  <option value="Female">Female (Yin Forward / Yang Reverse)</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3">
            {/* 1. Western Modern */}
            <button
              onClick={() => {
                setSystemMode("western");
                if (subTab === "gocharaRemedies" || subTab === "comparison" || subTab === "baziPillars") setSubTab("transits");
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                systemMode === "western"
                  ? "bg-amber-500/20 border-amber-500/50 shadow-md ring-1 ring-amber-500/30"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-300">Western Modern</span>
                {systemMode === "western" && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                Tropical Zodiac · {selectedHouseSystem.toUpperCase()} · Ptolemaic Orbs · Psychological
              </p>
            </button>

            {/* 2. Vedic Jyotish */}
            <button
              onClick={() => {
                setSystemMode("vedic");
                if (subTab === "comparison" || subTab === "baziPillars") setSubTab("transits");
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                systemMode === "vedic"
                  ? "bg-indigo-500/25 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-indigo-300">Vedic Jyotish</span>
                {systemMode === "vedic" && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                Sidereal (Lahiri 24°12&apos;) · Chandra Lagna Gochara · Graha Drishti · Upayas
              </p>
            </button>

            {/* 3. Hellenistic */}
            <button
              onClick={() => {
                setSystemMode("hellenistic");
                if (subTab === "gocharaRemedies" || subTab === "comparison" || subTab === "baziPillars") setSubTab("transits");
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                systemMode === "hellenistic"
                  ? "bg-emerald-500/25 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-300">Hellenistic</span>
                {systemMode === "hellenistic" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                Tropical Whole Sign · Traditional 7 Planets · Diurnal/Nocturnal Sect
              </p>
            </button>

            {/* 4. Western Sidereal */}
            <button
              onClick={() => {
                setSystemMode("westernSidereal");
                if (subTab === "gocharaRemedies" || subTab === "comparison" || subTab === "baziPillars") setSubTab("transits");
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                systemMode === "westernSidereal"
                  ? "bg-purple-500/25 border-purple-500/50 shadow-md ring-1 ring-purple-500/30"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-purple-300">Western Sidereal</span>
                {systemMode === "westernSidereal" && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                Fagan-Bradley Sidereal · Placidus Quadrants · Psychological Synthesis
              </p>
            </button>

            {/* 5. Chinese BaZi (Four Pillars) */}
            <button
              onClick={() => {
                setSystemMode("chinese-bazi");
                setSubTab("baziPillars");
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                systemMode === "chinese-bazi"
                  ? "bg-red-500/25 border-red-500/50 shadow-md ring-1 ring-red-500/30"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-red-300">Chinese BaZi</span>
                {systemMode === "chinese-bazi" && <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                24 Solar Terms (Lichun) · Four Pillars (八字) · Five Elements · Da Yun
              </p>
            </button>

            {/* 6. Dual Comparison */}
            <button
              onClick={() => {
                setSystemMode("comparison");
                setSubTab("comparison");
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                systemMode === "comparison"
                  ? "bg-gradient-to-r from-amber-500/30 to-indigo-500/30 border-amber-400/50 shadow-lg ring-1 ring-amber-400/40"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-200 flex items-center gap-1">
                  <Scale className="w-3 h-3 text-amber-400" />
                  Comparison
                </span>
                {systemMode === "comparison" && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                Side-by-side reconciliation: Western vs Vedic degrees & synthesis
              </p>
            </button>
          </div>
        </div>

        {/* System Active Configuration Breakdown Banner */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-300 bg-slate-950/40 px-3.5 py-2 rounded-xl">
          <div className="flex items-center gap-3 flex-wrap">
            {systemMode === "chinese-bazi" ? (
              <>
                <span className="flex items-center gap-1 font-semibold text-slate-200">
                  <Sun className="w-3.5 h-3.5 text-red-400" />
                  Calendar: <span className="text-red-300 font-bold uppercase">Solar Terms (Jie Qi 24)</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-semibold text-slate-200">
                  Current Term: <span className="text-amber-300 font-bold">{baziChart.currentSolarTerm.name} ({baziChart.currentSolarTerm.chinese})</span>
                </span>
                <span>·</span>
                <span className="text-slate-400">
                  Sun Longitude: <strong className="text-slate-200">{baziChart.currentSolarTerm.currentLongitude}°</strong> · {baziChart.currentSolarTerm.daysRemaining}d to next term
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1 font-semibold text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Zodiac: <span className="text-amber-300 font-bold uppercase">{systemResults.zodiacUsed}</span>
                  {systemResults.config.ayanamsa !== "none" && (
                    <span className="text-slate-400 font-normal">
                      ({systemResults.config.ayanamsa} Ayanamsa: {systemResults.ayanamsaDegrees.toFixed(2)}°)
                    </span>
                  )}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-semibold text-slate-200">
                  House Framework: <span className="text-indigo-300 font-bold uppercase">{systemResults.houseSystemUsed}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-semibold text-slate-200">
                  Aspect Model:{" "}
                  <span className="text-emerald-300 font-bold uppercase">
                    {systemResults.config.aspectSystem === "vedic" ? "Graha Drishti (Sight)" : "Ptolemaic Degree Orbs"}
                  </span>
                </span>
              </>
            )}
          </div>

          <div className="text-slate-400 font-medium">
            Interpretation:{" "}
            <span className="text-slate-200 font-semibold uppercase">
              {systemMode === "chinese-bazi"
                ? "Wu Xing Five Elements & Da Yun"
                : systemResults.config.interpretation === "vedic"
                ? "Gochara Karmic + Upayas"
                : "Psychological Growth"}
            </span>
          </div>
        </div>

        {/* Special Vedic Astrological Alerts (Sade Sati, Ashtama Shani, Guru Gochara) */}
        {systemMode === "vedic" && (
          <div className="mt-3.5 space-y-2">
            {systemResults.specialConditions.isSadeSati && (
              <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                  <span>
                    <strong>ACTIVE SADE SATI:</strong> Currently undergoing Saturn&apos;s 7.5-year cycle (
                    <strong className="text-amber-300">{systemResults.specialConditions.sadeSatiPhase}</strong>).
                    Shani transits 12th/1st/2nd from your natal Moon. Practice discipline, humility, and Saturday seva.
                  </span>
                </div>
                <button
                  onClick={() => setSubTab("gocharaRemedies")}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded text-[11px] font-bold text-amber-300 cursor-pointer shrink-0"
                >
                  View Shani Remedies
                </button>
              </div>
            )}

            {systemResults.specialConditions.isAshtamaShani && (
              <div className="p-3 bg-rose-950/40 border border-rose-600/40 rounded-xl flex items-center gap-2 text-xs text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>ASHTAMA SHANI (8th from Moon):</strong> Saturn transits the 8th house from natal Chandra. Exercise caution in taxes, sudden decisions, and risky endeavors. Chanting Maha Mrityunjaya Mantra is prescribed.
                </span>
              </div>
            )}

            {systemResults.specialConditions.isGuruGocharaFavorable && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-600/40 rounded-xl flex items-center gap-2 text-xs text-emerald-200">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>FAVORABLE GURU GOCHARA:</strong> Transiting Jupiter occupies an auspicious house from your natal Moon. Divine grace, intellectual breakthroughs, and material blessings are highlighted.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-5 pt-4 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          {systemMode === "comparison" ? (
            <button
              onClick={() => setSubTab("comparison")}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap bg-gradient-to-r from-amber-500/25 to-indigo-500/25 text-amber-200 border border-amber-400/40 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Side-by-Side System Comparison</span>
            </button>
          ) : systemMode === "chinese-bazi" ? (
            <button
              onClick={() => setSubTab("baziPillars")}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap bg-red-500/25 text-red-200 border border-red-500/40 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Feather className="w-3.5 h-3.5 text-red-400" />
              <span>BaZi Four Pillars & Da Yun Timeline</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setSubTab("biwheel")}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === "biwheel"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Orbit className="w-3.5 h-3.5 text-amber-400" />
                <span>Bi-Wheel Transit Chart</span>
              </button>

              <button
                onClick={() => setSubTab("transits")}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === "transits"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Active Transits ({systemResults.planets.length})</span>
              </button>

              {systemMode === "vedic" && (
                <>
                  <button
                    onClick={() => setSubTab("gocharaRemedies")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      subTab === "gocharaRemedies"
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Vedic Gochara & Remedies</span>
                  </button>

                  <button
                    onClick={() => setSubTab("ashtakavargaTransit")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      subTab === "ashtakavargaTransit"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-bold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                    }`}
                  >
                    <Grid3X3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ashtakavarga Transit (SAV)</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setSubTab("timingWindows")}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === "timingWindows"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Timing Windows</span>
              </button>

              <button
                onClick={() => setSubTab("forecast")}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === "forecast"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Horoscope & Energy Curve</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. CHINESE BAZI (FOUR PILLARS) VIEW                          */}
      {/* ============================================================ */}
      {systemMode === "chinese-bazi" && (
        <div className="space-y-6">
          {/* A. Four Pillars Card Display */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div>
                <h3 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-red-400" />
                  Four Pillars of Destiny (BaZi - 八字)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated using astronomical Sun longitude at Lichun (315°) and true solar month boundaries.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-300">
                  Birth Solar Node: {baziChart.solarTermAtBirth.name} ({baziChart.solarTermAtBirth.chinese})
                </span>
              </div>
            </div>

            {/* The 4 Pillars Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {[
                { title: "Hour Pillar (时柱)", pillar: baziChart.pillars.hour, isDayMaster: false },
                { title: "Day Pillar (日柱)", pillar: baziChart.pillars.day, isDayMaster: true },
                { title: "Month Pillar (月柱)", pillar: baziChart.pillars.month, isDayMaster: false },
                { title: "Year Pillar (年柱)", pillar: baziChart.pillars.year, isDayMaster: false },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-center space-y-3 transition-all relative overflow-hidden ${
                    item.isDayMaster
                      ? "bg-gradient-to-b from-red-950/40 via-slate-900 to-slate-950 border-red-500/70 shadow-lg ring-1 ring-red-500/40"
                      : "bg-slate-900/80 border-slate-800/90"
                  }`}
                >
                  {item.isDayMaster && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500 text-white uppercase tracking-wider">
                      Day Master
                    </div>
                  )}

                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {item.title}
                  </div>

                  {/* Heavenly Stem Block */}
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
                      Heavenly Stem
                    </span>
                    <div
                      className="text-3xl font-serif font-black"
                      style={{ color: getElementColor(item.pillar.heavenlyStem.element) }}
                    >
                      {item.pillar.heavenlyStem.chinese}
                    </div>
                    <div className="text-xs font-bold text-slate-200">
                      {item.pillar.heavenlyStem.pinyin} ({item.pillar.heavenlyStem.name})
                    </div>
                    <div className="text-[11px] font-medium" style={{ color: getElementColor(item.pillar.heavenlyStem.element) }}>
                      {item.pillar.heavenlyStem.yinYang} {item.pillar.heavenlyStem.element}
                    </div>
                  </div>

                  {/* Earthly Branch Block */}
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
                      Earthly Branch
                    </span>
                    <div
                      className="text-3xl font-serif font-black"
                      style={{ color: getElementColor(item.pillar.earthlyBranch.element) }}
                    >
                      {item.pillar.earthlyBranch.chinese}
                    </div>
                    <div className="text-xs font-bold text-slate-200">
                      {item.pillar.earthlyBranch.pinyin} ({item.pillar.earthlyBranch.animal})
                    </div>
                    <div className="text-[11px] font-medium" style={{ color: getElementColor(item.pillar.earthlyBranch.element) }}>
                      {item.pillar.earthlyBranch.element} ({item.pillar.earthlyBranch.yinYang})
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/60">
                    {item.pillar.significance}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* B. Five Element Balance & Day Master Strength */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Five Elements Wu Xing Bar Chart */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-sm font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Five Element (Wu Xing - 五行) Distribution
                </h4>
                <span className="text-xs text-slate-400">Total Stems + Hidden Cang Gan</span>
              </div>

              <div className="space-y-3.5 pt-1">
                {(["Wood", "Fire", "Earth", "Metal", "Water"] as ElementType[]).map((el) => {
                  const count = baziChart.elementBalance[el] || 0;
                  const total = Object.values(baziChart.elementBalance).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  const color = getElementColor(el);

                  return (
                    <div key={el} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-medium">
                        <span className="flex items-center gap-1.5 font-bold" style={{ color }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          {el}
                        </span>
                        <span className="text-slate-300 font-bold">
                          {count.toFixed(1)} pts ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(8, pct))}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Productive vs Destructive Cycle Reference */}
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-600/30">
                  <strong className="text-emerald-400 block mb-1">Productive Cycle (Sheng - 生):</strong>
                  <span>Wood → Fire → Earth → Metal → Water → Wood</span>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-600/30">
                  <strong className="text-rose-400 block mb-1">Controlling Cycle (Ke - 克):</strong>
                  <span>Wood → Earth → Water → Fire → Metal → Wood</span>
                </div>
              </div>
            </div>

            {/* Right: Day Master Deep Analysis */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-serif text-2xl font-bold border"
                      style={{
                        backgroundColor: `${getElementColor(baziChart.dayMaster.element)}20`,
                        borderColor: getElementColor(baziChart.dayMaster.element),
                        color: getElementColor(baziChart.dayMaster.element),
                      }}
                    >
                      {baziChart.dayMaster.stem.chinese}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-100">
                        Day Master: {baziChart.dayMaster.deityArchetype}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Core Soul Essence ({baziChart.dayMaster.stem.name} · {baziChart.dayMaster.stem.pinyin})
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold ${
                      baziChart.dayMaster.strengthLabel.includes("Strong")
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : baziChart.dayMaster.strengthLabel === "Balanced"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    }`}
                  >
                    {baziChart.dayMaster.strengthLabel} ({baziChart.dayMaster.strengthScore}/10)
                  </span>
                </div>

                <div className="mt-3.5 space-y-3 text-xs leading-relaxed">
                  <p className="text-slate-300">
                    <strong className="text-slate-200">Temperament:</strong> {baziChart.dayMaster.temperament}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-600/30">
                      <strong className="text-emerald-400 block text-[11px] uppercase tracking-wider mb-1">
                        Favorable Elements (Yong Shen):
                      </strong>
                      <span className="font-bold text-slate-200">
                        {baziChart.dayMaster.favorableElements.join(", ")}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-600/30">
                      <strong className="text-rose-400 block text-[11px] uppercase tracking-wider mb-1">
                        Unfavorable Elements (Ji Shen):
                      </strong>
                      <span className="font-bold text-slate-200">
                        {baziChart.dayMaster.unfavorableElements.join(", ")}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-300 text-[11px] pt-1">
                    {baziChart.dayMaster.seasonSupport
                      ? "✓ Supported by birth season in the month branch (De Ling)."
                      : "✕ Not born in supporting season; requires companion & resource elements."}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
                <span className="font-bold text-amber-400 block mb-0.5">Metaphysical Advice:</span>
                Surround yourself with {baziChart.dayMaster.favorableElements.join(" and ")} disciplines, colors, and industry sectors to optimize energy flow.
              </div>
            </div>
          </div>

          {/* C. 10-Year Luck Pillars (Da Yun - 大运) Timeline */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
              <div>
                <h4 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  10-Year Luck Pillars Timeline (Da Yun - 大运)
                </h4>
                <p className="text-xs text-slate-400">
                  Major life destiny shifts calculated with {baZiGender} progression rules.
                </p>
              </div>

              <span className="text-xs text-amber-400 font-semibold">
                9 Decades Covered (Ages 5 to 94)
              </span>
            </div>

            {/* Horizontal Timeline Scroll */}
            <div className="flex overflow-x-auto gap-3 pb-3 pt-1 no-scrollbar">
              {baziChart.luckPillars.map((lp, idx) => (
                <div
                  key={idx}
                  className={`shrink-0 w-36 p-3.5 rounded-xl border text-center space-y-2 transition-all ${
                    lp.isCurrent
                      ? "bg-red-950/40 border-red-500 shadow-xl ring-2 ring-red-500/50"
                      : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>Decade {lp.order}</span>
                    {lp.isCurrent && (
                      <span className="px-1.5 py-0.2 rounded bg-red-500 text-white font-black text-[9px] uppercase tracking-wider">
                        Current
                      </span>
                    )}
                  </div>

                  <div
                    className="text-2xl font-serif font-black"
                    style={{ color: getElementColor(lp.element) }}
                  >
                    {lp.pillar.chinese}
                  </div>

                  <div className="text-xs font-bold text-slate-200">
                    {lp.pillar.pinyin}
                  </div>

                  <div className="text-[11px] font-medium" style={{ color: getElementColor(lp.element) }}>
                    {lp.element} {lp.pillar.branch.animal}
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                    <div>Ages {lp.startAge}–{lp.endAge}</div>
                    <div className="text-amber-400 font-medium">({lp.startYear}–{lp.endYear})</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* D. Current Annual Influence (Liu Nian - 流年) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-serif text-2xl font-bold border"
                  style={{
                    backgroundColor: `${getElementColor(baziChart.currentAnnualInfluence.element)}20`,
                    borderColor: getElementColor(baziChart.currentAnnualInfluence.element),
                    color: getElementColor(baziChart.currentAnnualInfluence.element),
                  }}
                >
                  {baziChart.currentAnnualInfluence.pillar.chinese}
                </span>
                <div>
                  <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    {baziChart.currentAnnualInfluence.year} Annual Influence (Liu Nian - 流年)
                    <span className="text-xs font-normal text-slate-400">
                      · Year of the {baziChart.currentAnnualInfluence.animal} ({baziChart.currentAnnualInfluence.pillar.name})
                    </span>
                  </h4>
                  <p className="text-xs text-amber-400 font-medium">
                    Interaction with Day Master: {baziChart.currentAnnualInfluence.interactionWithDayMaster.relation}
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  baziChart.currentAnnualInfluence.interactionWithDayMaster.harmonyType.includes("Support")
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : baziChart.currentAnnualInfluence.interactionWithDayMaster.harmonyType.includes("Clash")
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}
              >
                {baziChart.currentAnnualInfluence.interactionWithDayMaster.harmonyType}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {baziChart.currentAnnualInfluence.interactionWithDayMaster.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Favorable Annual Activities:
                </span>
                <ul className="space-y-1 list-disc list-inside text-slate-300">
                  {baziChart.currentAnnualInfluence.favorableActivities.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="font-bold text-rose-400 block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  Annual Cautions & Pitfalls:
                </span>
                <ul className="space-y-1 list-disc list-inside text-slate-300">
                  {baziChart.currentAnnualInfluence.cautions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* E. Master BaZi Metaphysics Interpretation */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
              <Feather className="w-4 h-4 text-amber-400" />
              Destiny & Personality Synthesis for {fullName}
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed font-serif italic text-sm">
              &ldquo;{baziChart.personalityInterpretation.summary}&rdquo;
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <strong className="text-amber-300 block font-bold text-xs">Ideal Vocational Fields:</strong>
                <p className="text-slate-300 leading-relaxed">
                  {baziChart.personalityInterpretation.careerFit.join(" · ")}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <strong className="text-emerald-300 block font-bold text-xs">Wealth & Asset Generation:</strong>
                <p className="text-slate-300 leading-relaxed">
                  {baziChart.personalityInterpretation.wealthStyle}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <strong className="text-indigo-300 block font-bold text-xs">Relationship & Marriage Dynamic:</strong>
                <p className="text-slate-300 leading-relaxed">
                  {baziChart.personalityInterpretation.relationshipStyle}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. DUAL COMPARISON VIEW (When in comparison mode)            */}
      {/* ============================================================ */}
      {subTab === "comparison" && systemMode === "comparison" && (
        <div className="space-y-6">
          {/* Divergence Header Explainer */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif-celestial font-bold text-slate-100">
                  Side-by-Side Astrological System Reconciliation
                </h3>
                <p className="text-xs text-slate-400">
                  Comparing current real-time transits calculated through Western Tropical (Placidus) vs Vedic Sidereal (Lahiri Whole Sign / Chandra Lagna)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  1. Zodiac Baseline
                </h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {comparisonResults.divergenceSummary.zodiacReason}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  2. House Framework
                </h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {comparisonResults.divergenceSummary.houseReason}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  3. Aspect Mechanics
                </h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {comparisonResults.divergenceSummary.aspectReason}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  4. Philosophical Goal
                </h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {comparisonResults.divergenceSummary.interpretationReason}
                </p>
              </div>
            </div>
          </div>

          {/* Comparative Planet Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-serif-celestial font-bold text-slate-200">
              Celestial Body Discrepancies & Cross-System Synthesis:
            </h3>

            <div className="space-y-4">
              {comparisonResults.planetComparisons.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg font-bold text-amber-400">
                        {PLANET_SYMBOLS[item.planet] || "✦"}
                      </span>
                      <div>
                        <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                          {item.planet}
                          <span className="text-xs font-normal text-slate-400">
                            ({item.signShift})
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.houseShift}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                        Western: {item.westernDegree}
                      </span>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                        Vedic: {item.vedicDegree}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-600/30 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                        <span>Western Psychological Focus</span>
                        <span>House {item.westernHouse}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.westernInterpretation}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-600/30 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                        <span>Vedic Karmic Gochara</span>
                        <span>{item.vedicHouseFromMoon}th from Moon (Chandra)</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.vedicInterpretation}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Unified Astrological Synthesis:</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.unifiedSynthesis}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3B. BI-WHEEL TRANSIT CHART VIEW                              */}
      {/* ============================================================ */}
      {subTab === "biwheel" && (
        <TransitBiWheel
          westernChart={westernChart}
          transitingPlanets={systemResults.planets.map((p) => ({
            name: p.name,
            sign: p.sign,
            longitude: p.rawLongitude,
            degreeFormatted: p.degreeFormatted,
            isRetrograde: p.isRetrograde,
          }))}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onDateReset={() => setSelectedDate(new Date())}
        />
      )}

      {/* ============================================================ */}
      {/* 4. ACTIVE TRANSITS VIEW (Western / Vedic / Hellenistic)       */}
      {/* ============================================================ */}
      {subTab === "transits" && systemMode !== "chinese-bazi" && systemMode !== "comparison" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-serif-celestial font-bold text-slate-200 flex items-center gap-2">
                  <Orbit className="w-4 h-4 text-amber-400" />
                  Transiting Celestial Bodies in {systemResults.config.name}
                </h3>
                <span className="text-xs text-slate-400">
                  {systemResults.planets.length} Bodies Calculated
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {systemResults.planets.map((p) => {
                  const isSelected = selectedPlanetKey === p.name;
                  const interp = systemResults.interpretations[p.name];

                  return (
                    <div
                      key={p.name}
                      onClick={() => setSelectedPlanetKey(p.name)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-3 ${
                        isSelected
                          ? "bg-slate-900 border-amber-500/60 shadow-lg ring-1 ring-amber-500/30"
                          : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300">
                            {PLANET_SYMBOLS[p.name] || "✦"}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-slate-100">{p.name}</h4>
                              {p.sanskritName && (
                                <span className="text-[10px] text-amber-400 font-serif">
                                  ({p.sanskritName})
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">{p.degreeFormatted}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            House {p.house}
                          </span>
                          {p.houseFromMoon && (
                            <p className="text-[10px] text-amber-400 mt-1">
                              {p.houseFromMoon}th fm Moon
                            </p>
                          )}
                        </div>
                      </div>

                      {interp && (
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {interp.overview}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                        <span>{p.isRetrograde ? "↺ Retrograde" : "Direct Motion"}</span>
                        <span className="text-amber-400 font-medium flex items-center gap-1">
                          Inspect <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Aspects Section */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h4 className="text-sm font-serif-celestial font-bold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Active Aspects ({systemResults.config.aspectSystem === "vedic" ? "Graha Drishti Sights" : "Ptolemaic Angles"})
                </h4>

                <div className="space-y-2">
                  {systemResults.aspects.length > 0 ? (
                    systemResults.aspects.slice(0, 8).map((asp, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                            {asp.symbol}
                          </span>
                          <div>
                            <span className="font-bold text-slate-100">{asp.type}</span>
                            <p className="text-[11px] text-slate-400 mt-0.5">{asp.description}</p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {asp.nature}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-3 text-center">
                      No exact aspects within orb for the selected date.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Selected Planet Detail Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl font-bold text-amber-300">
                      {PLANET_SYMBOLS[selectedPlanetData.name] || "✦"}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                        {selectedPlanetData.name}
                        {selectedPlanetData.sanskritName && (
                          <span className="text-xs text-amber-400 font-serif">
                            ({selectedPlanetData.sanskritName})
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-amber-400 font-medium">
                        {selectedPlanetData.degreeFormatted} · House {selectedPlanetData.house}
                        {selectedPlanetData.houseFromMoon && ` (${selectedPlanetData.houseFromMoon}th from Moon)`}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {selectedInterp?.nature || "Neutral"}
                  </span>
                </div>

                {selectedInterp && (
                  <div className="mt-4 space-y-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-200 block text-sm">
                        {selectedInterp.title}
                      </span>
                      <p className="text-slate-300 mt-1 leading-relaxed">
                        {selectedInterp.overview}
                      </p>
                    </div>

                    {selectedInterp.psychological && (
                      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-600/30 space-y-1">
                        <span className="font-bold text-amber-400 block text-[11px] uppercase tracking-wider">
                          Psychological Growth Focus:
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {selectedInterp.psychological}
                        </p>
                      </div>
                    )}

                    {selectedInterp.karmic && (
                      <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-600/30 space-y-1">
                        <span className="font-bold text-indigo-400 block text-[11px] uppercase tracking-wider">
                          Karmic Meaning & Gochara Context:
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {selectedInterp.karmic}
                        </p>
                      </div>
                    )}

                    {selectedInterp.remedies && (
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                        <span className="font-bold text-emerald-400 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Prescribed Vedic Remedies (Upayas):
                        </span>
                        <div className="space-y-1 text-slate-300 text-[11px]">
                          {selectedInterp.remedies.mantra && (
                            <div>
                              <strong className="text-slate-200">Mantra:</strong> {selectedInterp.remedies.mantra}
                            </div>
                          )}
                          {selectedInterp.remedies.charity && (
                            <div>
                              <strong className="text-slate-200">Charity (Daana):</strong> {selectedInterp.remedies.charity}
                            </div>
                          )}
                          {selectedInterp.remedies.gemstone && (
                            <div>
                              <strong className="text-slate-200">Gemstone:</strong> {selectedInterp.remedies.gemstone}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
                System: <strong className="text-slate-300">{systemResults.config.name}</strong> · astronomy-engine model (accuracy varies; see calculation notes)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. VEDIC GOCHARA & REMEDIES TAB                              */}
      {/* ============================================================ */}
      {subTab === "gocharaRemedies" && systemMode === "vedic" && (
        <div className="space-y-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif-celestial font-bold text-slate-100">
                  Complete Gochara System (Phaladeepika & Brihat Samhita)
                </h3>
                <p className="text-xs text-slate-400">
                  Planetary transits evaluated strictly from the Natal Moon (Chandra Lagna) with classical remedial prescriptions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {systemResults.planets.map((p) => {
                const interp = systemResults.interpretations[p.name];
                if (!interp || !interp.remedies) return null;

                return (
                  <div
                    key={p.name}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                          {PLANET_SYMBOLS[p.name] || "✦"}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-100 text-sm">
                            {p.name} ({p.sanskritName || p.name})
                          </h4>
                          <span className="text-[11px] text-amber-400">
                            {p.houseFromMoon}th House from Chandra
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          interp.nature === "Auspicious"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {interp.nature}
                      </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed">{interp.overview}</p>

                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-[11px]">
                      <span className="font-bold text-emerald-400 block flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Prescribed Remedial Measure:
                      </span>
                      <p className="text-slate-300">
                        <strong className="text-slate-200">Mantra:</strong> {interp.remedies.mantra}
                      </p>
                      <p className="text-slate-300">
                        <strong className="text-slate-200">Charity:</strong> {interp.remedies.charity}
                      </p>
                      <p className="text-slate-300">
                        <strong className="text-slate-200">Behavioral Vow:</strong> {interp.remedies.behavioral}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5B. ASHTAKAVARGA GOCHARA TRANSIT ANALYSIS                    */}
      {/* ============================================================ */}
      {subTab === "ashtakavargaTransit" && (
        <div className="space-y-6">
          {vedicChart ? (
            <AshtakavargaPanel vedicData={vedicChart} />
          ) : (
            <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400">
              Vedic chart coordinates required for Ashtakavarga transit calculations.
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. TIMING WINDOWS                                            */}
      {/* ============================================================ */}
      {subTab === "timingWindows" && (
        <div className="space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Strategic Astrological Timing Windows (When to Act)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Synthesized timing phases across Career, Love, Finance, Health, and Spiritual Evolution.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {Object.values(timingWindows).map((tw, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-sm">{tw.title}</span>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {tw.currentPhase}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">{tw.advice}</p>

                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                    <strong className="text-amber-400">Next Peak Window:</strong> {tw.nextOpportunity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. DAILY HOROSCOPE & ENERGY CURVE                           */}
      {/* ============================================================ */}
      {subTab === "forecast" && (
        <div className="space-y-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-serif-celestial font-bold text-slate-100">
                  Daily Forecast for {dailyData.date}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Moon in {dailyData.moonSignFormatted} · {dailyData.moonPhase.name} {dailyData.moonPhase.emoji}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-amber-400">Active aspects: {dailyData.activeTransitCount}</span>
                <p className="text-[10px] text-slate-400">{dailyData.transitSummary}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-600/30 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Personal Reflection Prompt (not a prediction):
              </span>
              <p className="text-sm font-serif italic text-amber-200">
                &ldquo;{dailyData.affirmation}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Practical Reflection Prompts:
                </span>
                <ul className="space-y-1 list-disc list-inside text-slate-300">
                  {dailyData.bestActions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="font-bold text-rose-400 block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  General Cautions (not chart predictions):
                </span>
                <ul className="space-y-1 list-disc list-inside text-slate-300">
                  {dailyData.avoidActions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. SYSTEM EDUCATION MODAL                                    */}
      {/* ============================================================ */}
      {isEducationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-serif-celestial font-bold text-slate-100">
                  Astrological Systems Guide: Why Do Calculations Differ?
                </h3>
              </div>
              <button
                onClick={() => setIsEducationModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-sm text-red-300 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-red-400" />
                  1. Chinese BaZi (Solar Terms) vs Zodiac Astrology
                </h4>
                <p>
                  <strong>BaZi (Four Pillars) is NOT based on the 12 Zodiac Constellations.</strong> It is an ancient solar-metaphysical framework governed by the Sun&apos;s exact celestial longitude dividing the solar year into <strong>24 Solar Terms (Jie Qi)</strong>.
                </p>
                <p>
                  The BaZi solar year strictly begins at <strong>Lichun (Start of Spring, 315° Sun Longitude)</strong>, around February 4, rather than the Lunar New Year or January 1. The Four Pillars encode the precise vibrational resonance of the 10 Heavenly Stems and 12 Earthly Branches.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-400" />
                  2. Tropical (Western) vs Sidereal (Vedic) Zodiacs
                </h4>
                <p>
                  <strong>Tropical:</strong> Aligned with Earth&apos;s seasons. 0° Aries is defined as the precise moment of the Vernal Equinox (Spring in the Northern Hemisphere).
                </p>
                <p>
                  <strong>Sidereal:</strong> Aligned with the physical fixed stars and constellations (such as Spica/Chitra at 0° Libra).
                </p>
                <p className="text-amber-400/90 font-medium">
                  <strong>The Ayanamsa Difference (~24°12&apos;):</strong> Because the Earth undergoes axial precession, the Vernal Equinox drifts backwards relative to the constellations by roughly 1° every 71.6 years. Today, the Sidereal Zodiac sits roughly 24 degrees earlier than the Tropical Zodiac.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  3. House Frameworks: Placidus vs Whole Sign
                </h4>
                <p>
                  <strong>Placidus (Western default):</strong> A time-proportional quadrant system dividing the diurnal and nocturnal semi-arcs of the sky into 12 unequal houses based on birth latitude.
                </p>
                <p>
                  <strong>Whole Sign (Vedic & Hellenistic):</strong> The entire 30° zodiac sign containing the Ascendant becomes the 1st House; the next complete sign becomes the 2nd House.
                </p>
                <p className="text-indigo-400/90 font-medium">
                  <strong>The Moon (Chandra Lagna) Difference in Gochara:</strong> In classical Vedic Jyotish, planetary transits (Gochara) are calculated <em>from the Natal Moon</em>! This is why Sade Sati (Saturn in 12th/1st/2nd) is measured strictly relative to your Moon sign.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsEducationModalOpen(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Close & Return to Transit Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
