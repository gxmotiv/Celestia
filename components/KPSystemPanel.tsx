"use client";

import React, { useState, useMemo } from "react";
import { WesternChartData } from "@/lib/astronomy/ephemeris";
import { VedicChartData } from "@/lib/astronomy/vedic";
import { KPEngine } from "@/lib/kp/kpEngine";
import { KPPredictionEngine, KP_EVENT_RULES } from "@/lib/kp/kpPredictionEngine";
import {
  KPChartData,
  KPPrediction,
  KPFourStepData,
  CuspalInterlink,
  KPHoraryResult,
  PositionalStatus,
} from "@/lib/kp/kpTypes";
import { KPFourStepEngine } from "@/lib/kp/kpFourStepEngine";
import { KPHoraryEngine, HORARY_QUERIES } from "@/lib/kp/kpHoraryEngine";
import {
  Compass,
  Sparkles,
  Layers,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
  Target,
  Clock,
  Orbit,
  Star,
  Shuffle,
  AlertTriangle,
  ArrowRight,
  Activity,
  Check,
  RotateCcw,
  BookOpen,
  ChevronRight,
} from "lucide-react";

interface KPSystemPanelProps {
  westernData: WesternChartData;
  vedicData: VedicChartData;
  fullName: string;
  birthDateStr: string;
}

const LIFE_EVENTS = [
  { house: 10, label: "Career & Promotion", icon: "💼", tag: "2, 6, 10, 11" },
  { house: 7, label: "Marriage & Union", icon: "💍", tag: "2, 7, 11" },
  { house: 2, label: "Wealth & Finance", icon: "💰", tag: "2, 6, 11" },
  { house: 5, label: "Childbirth & Progeny", icon: "👶", tag: "2, 5, 11" },
  { house: 4, label: "Property & Vehicles", icon: "🏡", tag: "4, 11, 12" },
  { house: 6, label: "Litigation & Jobs", icon: "⚖️", tag: "6, 10, 11" },
  { house: 12, label: "Foreign Relocation", icon: "✈️", tag: "3, 9, 12" },
  { house: 1, label: "Health & Vitality", icon: "🛡️", tag: "1, 3, 9, 11" },
  { house: 3, label: "Courage & Contracts", icon: "📝", tag: "3, 9, 11" },
  { house: 8, label: "Inheritance & Mystery", icon: "🔮", tag: "2, 8, 11" },
  { house: 9, label: "Higher Studies & Dharma", icon: "🎓", tag: "9, 11, 12" },
  { house: 11, label: "Ambition Fulfillment", icon: "🏆", tag: "1, 2, 6, 10, 11" },
];

export function KPSystemPanel({
  westernData,
  vedicData,
  fullName,
  birthDateStr,
}: KPSystemPanelProps) {
  // Navigation tabs: Classical + Modern KP Suite
  const [activeSubTab, setActiveSubTab] = useState<
    | "prediction"
    | "fourStep"
    | "cuspalInterlinks"
    | "horary"
    | "significators"
    | "cusps"
    | "planets"
    | "rulingPlanets"
  >("prediction");

  const [selectedHouse, setSelectedHouse] = useState<number>(10); // Default to Career (House 10)

  // 4-Step Theory state
  const [fourStepTarget, setFourStepTarget] = useState<string>("Sun");
  const [fourStepMode, setFourStepMode] = useState<"planet" | "cusp">("planet");

  // KP Horary State
  const [horaryTableType, setHoraryTableType] = useState<"1-249" | "1-2193">("1-249");
  const [horarySeed, setHorarySeed] = useState<number>(1);
  const [horaryQueryId, setHoraryQueryId] = useState<string>("career");

  // Engines
  const kpEngine = useMemo(() => new KPEngine(), []);
  const predictionEngine = useMemo(() => new KPPredictionEngine(), []);
  const fourStepEngine = useMemo(() => new KPFourStepEngine(), []);
  const horaryEngine = useMemo(() => new KPHoraryEngine(), []);

  const birthDateObj = useMemo(() => {
    return new Date(birthDateStr.includes("T") ? birthDateStr : `${birthDateStr}T12:00:00Z`);
  }, [birthDateStr]);

  // Master KP Chart Data
  const kpData: KPChartData = useMemo(() => {
    return kpEngine.generateKPChart(westernData, vedicData, birthDateObj);
  }, [kpEngine, westernData, vedicData, birthDateObj]);

  // Positional Status (PS)
  const psMap: Record<string, PositionalStatus> = useMemo(() => {
    return fourStepEngine.calculatePositionalStatus(kpData.cusps, kpData.planets);
  }, [fourStepEngine, kpData.cusps, kpData.planets]);

  // Current Classical Prediction based on Selected House
  const currentPrediction: KPPrediction = useMemo(() => {
    return predictionEngine.predictEvent(
      selectedHouse,
      kpData.cusps,
      kpData.planets,
      kpData.currentDashaLord,
      kpData.currentAntardashaLord,
      kpData.currentPratyantardashaLord
    );
  }, [
    predictionEngine,
    selectedHouse,
    kpData.cusps,
    kpData.planets,
    kpData.currentDashaLord,
    kpData.currentAntardashaLord,
    kpData.currentPratyantardashaLord,
  ]);

  // 4-Step Analysis Data for selected item
  const fourStepData: KPFourStepData = useMemo(() => {
    if (fourStepMode === "planet") {
      return fourStepEngine.evaluatePlanetFourStep(
        fourStepTarget,
        kpData.cusps,
        kpData.planets,
        psMap,
        selectedHouse
      );
    } else {
      const houseNum = parseInt(fourStepTarget, 10) || 1;
      return fourStepEngine.evaluateCuspFourStep(houseNum, kpData.cusps, kpData.planets, psMap);
    }
  }, [fourStepEngine, fourStepMode, fourStepTarget, kpData.cusps, kpData.planets, psMap, selectedHouse]);

  // Cuspal Interlinks for all 12 cusps
  const cuspalInterlinks: CuspalInterlink[] = useMemo(() => {
    return fourStepEngine.calculateCuspalInterlinks(kpData.cusps, kpData.planets, psMap);
  }, [fourStepEngine, kpData.cusps, kpData.planets, psMap]);

  // KP Horary Result
  const horaryResult: KPHoraryResult = useMemo(() => {
    return horaryEngine.calculateHoraryJudgment(
      horarySeed,
      horaryTableType,
      horaryQueryId,
      kpData,
      new Date()
    );
  }, [horaryEngine, horarySeed, horaryTableType, horaryQueryId, kpData]);

  // Randomizer helper for Horary Seed
  const generateRandomSeed = () => {
    const max = horaryTableType === "1-249" ? 249 : 2193;
    const randomVal = Math.floor(Math.random() * max) + 1;
    setHorarySeed(randomVal);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & KP Ayanamsa Coordinates */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                Modern KP Mastery Suite
              </span>
              <span className="text-xs text-slate-400">· 4-Step · CIL · Horary 1-249 &amp; 1-2193</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif-celestial font-bold text-slate-100 mt-1.5 flex items-center gap-2">
              KP Astrology Master Console &amp; Predictive Engine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Calculated for <strong className="text-slate-200">{fullName}</strong> with Krishnamurti Ayanamsa ({kpData.ayanamsaFormatted})
            </p>
          </div>

          {/* Quick Stats: Current Dasha & RP */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Active Dasha / Bhukti</span>
              <span className="font-bold text-amber-300 font-mono">
                {kpData.currentDashaLord} / {kpData.currentAntardashaLord}
              </span>
            </div>

            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Ruling Day Lord</span>
              <span className="font-bold text-cyan-300 font-mono">
                {kpData.rulingPlanets.dayLord}
              </span>
            </div>
          </div>
        </div>

        {/* Ruling Planets Mini-Strip */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              Ruling Planets (RP):
            </span>
            <span className="text-slate-300">
              Day: <strong className="text-amber-300">{kpData.rulingPlanets.dayLord}</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">
              Moon Star: <strong className="text-cyan-300">{kpData.rulingPlanets.moonStarLord}</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">
              Moon Sign: <strong className="text-blue-300">{kpData.rulingPlanets.moonSignLord}</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">
              Lagna Star: <strong className="text-emerald-300">{kpData.rulingPlanets.lagnaStarLord}</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">
              Lagna Sign: <strong className="text-purple-300">{kpData.rulingPlanets.lagnaSignLord}</strong>
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Placidus Cusps + KP Rule Adjusted
          </span>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/90 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar shadow-inner text-xs">
        {[
          { id: "prediction", label: "Event Predictions & CSL", icon: Target },
          { id: "fourStep", label: "4-Step Theory & PS", icon: Zap },
          { id: "cuspalInterlinks", label: "Cuspal Interlinks (CIL)", icon: Layers },
          { id: "horary", label: "KP Horary 1-249 / 2193", icon: Compass },
          { id: "significators", label: "4-Grade Significators", icon: Activity },
          { id: "cusps", label: "12 KP Cusps", icon: BookOpen },
          { id: "planets", label: "Planets & Sub-Lords", icon: Orbit },
          { id: "rulingPlanets", label: "Ruling Planets (RP)", icon: Star },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                active
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? "text-amber-400" : "text-slate-500"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================================================================ */}
      {/* VIEW 1: EVENT PREDICTOR & CUSPAL SUB-LORD (CSL) ENGINE            */}
      {/* ================================================================ */}
      {activeSubTab === "prediction" && (
        <div className="space-y-6">
          {/* Life Event Selector Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                Select Life Event or House for KP Cuspal Analysis:
              </span>
              <span className="text-xs text-slate-400">
                Analyzing Cuspal Sub Lord (CSL)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {LIFE_EVENTS.map((item) => {
                const isSelected = selectedHouse === item.house;
                return (
                  <button
                    key={item.house}
                    onClick={() => setSelectedHouse(item.house)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30"
                        : "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{item.icon}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          isSelected ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        H{item.house}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold block truncate text-slate-100">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-amber-400/90 font-mono block">
                        Houses: {item.tag}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Prediction Result Dashboard */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl space-y-5">
            {/* Verdict Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    House {currentPrediction.house} Analysis:
                  </span>
                  <h3 className="text-lg font-serif-celestial font-bold text-slate-100">
                    {currentPrediction.event}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Evaluated through Cuspal Sub Lord (CSL) <strong>{currentPrediction.primaryCuspalSubLord}</strong> and Vimshottari period lords
                </p>
              </div>

              {/* Probability & Verdict Badge */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Rule-based score (not probability)</span>
                  <span className="text-xl font-bold font-mono text-amber-300">
                    {currentPrediction.ruleScore}%
                  </span>
                </div>

                <div
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                    currentPrediction.verdict === "Highly Favorable"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : currentPrediction.verdict === "Favorable"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                      : currentPrediction.verdict === "Mixed / Moderate"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  }`}
                >
                  {currentPrediction.isPromiseFavorable ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{currentPrediction.verdict}</span>
                </div>
              </div>
            </div>

            {/* Core KP CSL Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Cuspal Sub Lord */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                  Cuspal Sub Lord (CSL)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-amber-300">
                    {currentPrediction.primaryCuspalSubLord}
                  </span>
                  <span className="text-xs text-slate-400">
                    Star: {currentPrediction.cslStarLord}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Decides the natal promise of House {currentPrediction.house}
                </span>
              </div>

              {/* Card 2: Favorable Houses */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase block">
                  Favorable Houses
                </span>
                <span className="text-lg font-bold font-mono text-emerald-300 block">
                  {currentPrediction.favorableHouses.join(", ")}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Synergistic houses that consummate the event
                </span>
              </div>

              {/* Card 3: Negation Houses */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[11px] font-semibold text-rose-400 uppercase block">
                  Negation Houses (12th from event)
                </span>
                <span className="text-lg font-bold font-mono text-rose-300 block">
                  {currentPrediction.negationHouses.join(", ")}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Houses causing delay, denial, or dissolution
                </span>
              </div>

              {/* Card 4: Houses Signified by CSL */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[11px] font-semibold text-purple-400 uppercase block">
                  CSL Signified Houses
                </span>
                <span className="text-lg font-bold font-mono text-purple-300 block">
                  {currentPrediction.cslSignifiedHouses.join(", ") || "None"}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Houses activated through CSL &amp; its Star-Lord
                </span>
              </div>
            </div>

            {/* Timing & Dasha Concurrence Box */}
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  KP Timing of Realization (DBAS Synchronization)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Dasha: {currentPrediction.dashaAnalysis.dashaLord} · Bhukti: {currentPrediction.dashaAnalysis.antardashaLord}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {currentPrediction.timing}
              </p>
            </div>

            {/* Classical KP Rule Breakdown Steps */}
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                KP Diagnostic Rule Breakdown
              </span>
              <div className="space-y-1.5">
                {currentPrediction.kpRuleBreakdown.map((rule, idx) => (
                  <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* VIEW 2: 4-STEP THEORY & POSITIONAL STATUS (GONDHALEKAR)          */}
      {/* ================================================================ */}
      {activeSubTab === "fourStep" && (
        <div className="space-y-6">
          {/* Header Explanation */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Sunil Gondhalekar 4-Step Theory &amp; Positional Status (PS)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Modern KP&apos;s most rigorous predictive engine: evaluates Step 1 (Source), Step 2 (The Offer), Step 3 (The Decision / Fruit), and Step 4 (Final Culmination).
                </p>
              </div>

              {/* Selector Mode Toggle */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-xs text-slate-400">Target:</span>
                <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => {
                      setFourStepMode("planet");
                      setFourStepTarget("Sun");
                    }}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      fourStepMode === "planet"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Planets (9)
                  </button>
                  <button
                    onClick={() => {
                      setFourStepMode("cusp");
                      setFourStepTarget("10");
                    }}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      fourStepMode === "cusp"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Cusps (1-12)
                  </button>
                </div>
              </div>
            </div>

            {/* Positional Status (PS) Roster Bar */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Planetary Positional Status (PS) Audit:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                {Object.values(psMap).map((ps) => (
                  <div
                    key={ps.planet}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      ps.hasPositionalStatus
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-900/60 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="text-xs font-bold block">{ps.planet}</span>
                    <span
                      className={`text-[9px] font-mono px-1 py-0.2 rounded font-semibold mt-1 inline-block ${
                        ps.hasPositionalStatus
                          ? "bg-emerald-400 text-slate-950"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {ps.hasPositionalStatus ? "★ PS ACTIVE" : "NO PS"}
                    </span>
                    <span className="text-[8px] text-slate-400 block mt-0.5 truncate" title={ps.reason}>
                      {ps.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Diagnostic Selector Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-1.5 bg-slate-950/80 border border-slate-800 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 pl-2 shrink-0">
              Select {fourStepMode === "planet" ? "Planet" : "Cusp"}:
            </span>
            {fourStepMode === "planet"
              ? ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].map((pName) => {
                  const hasPS = psMap[pName]?.hasPositionalStatus;
                  const isSelected = fourStepTarget === pName;
                  return (
                    <button
                      key={pName}
                      onClick={() => setFourStepTarget(pName)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-sm"
                          : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <span>{pName}</span>
                      {hasPS && <span className="text-[10px] text-emerald-400 font-mono">★PS</span>}
                    </button>
                  );
                })
              : Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                  const isSelected = fourStepTarget === h.toString();
                  return (
                    <button
                      key={h}
                      onClick={() => setFourStepTarget(h.toString())}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-sm"
                          : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      Cusp {h} ({kpData.cusps.houseDetails[h - 1].subLord})
                    </button>
                  );
                })}
          </div>

          {/* 4-Step Flow Chart & Diagnostics */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-amber-400 tracking-wider">
                    4-Step Diagnostic Subject:
                  </span>
                  <span className="text-lg font-bold text-slate-100 font-serif-celestial">
                    {fourStepData.subject}
                  </span>
                  {fourStepData.hasPositionalStatus && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ★ Positional Status Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Signifies all houses: <strong className="text-amber-300 font-mono">[{fourStepData.signifiedHouses.join(", ")}]</strong>
                </p>
              </div>

              {/* Event Promise Meter */}
              <div
                className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  fourStepData.stepVerdict === "Favorable"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : fourStepData.stepVerdict === "Delayed / Mixed"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Promise Verdict: {fourStepData.stepVerdict}</span>
              </div>
            </div>

            {/* 4 Steps Interactive Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Step 1: The Source */}
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Step 1 · Source
                  </span>
                  {fourStepData.step1.hasPositionalStatus ? (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">★ PS Active</span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">Secondary</span>
                  )}
                </div>
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{fourStepData.step1.planet}</span>
                  {fourStepData.step1.isRetrograde && (
                    <span className="text-[10px] text-rose-400 font-mono">(R)</span>
                  )}
                </h4>
                <div className="text-xs space-y-1 text-slate-400 font-mono">
                  <div>Occupies: <strong className="text-slate-200">H{fourStepData.step1.occupiesHouse}</strong></div>
                  <div>Owns: <strong className="text-slate-200">{fourStepData.step1.ownsHouses.join(", ") || "None"}</strong></div>
                  <div className="pt-1 text-amber-300 font-bold">
                    Effective: [{fourStepData.step1.allHouses.join(", ")}]
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  {fourStepData.step1.hasPositionalStatus
                    ? "Strongly triggers source houses due to Positional Status."
                    : "Acts primarily through Star Lord (Step 2)."}
                </p>
              </div>

              {/* Step 2: The Offer */}
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Step 2 · The Offer
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">Star Lord</span>
                </div>
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{fourStepData.step2.planet}</span>
                  {fourStepData.step2.isRetrograde && (
                    <span className="text-[10px] text-rose-400 font-mono">(R)</span>
                  )}
                </h4>
                <div className="text-xs space-y-1 text-slate-400 font-mono">
                  <div>Occupies: <strong className="text-slate-200">H{fourStepData.step2.occupiesHouse}</strong></div>
                  <div>Owns: <strong className="text-slate-200">{fourStepData.step2.ownsHouses.join(", ") || "None"}</strong></div>
                  <div className="pt-1 text-cyan-300 font-bold">
                    Effective: [{fourStepData.step2.allHouses.join(", ")}]
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  Presents the core opportunity / matters offered to native.
                </p>
              </div>

              {/* Step 3: The Decision / Fruit */}
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Step 3 · Decision
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 font-bold">Sub Lord</span>
                </div>
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{fourStepData.step3.planet}</span>
                  {fourStepData.step3.isRetrograde && (
                    <span className="text-[10px] text-rose-400 font-mono">(R)</span>
                  )}
                </h4>
                <div className="text-xs space-y-1 text-slate-400 font-mono">
                  <div>Occupies: <strong className="text-slate-200">H{fourStepData.step3.occupiesHouse}</strong></div>
                  <div>Owns: <strong className="text-slate-200">{fourStepData.step3.ownsHouses.join(", ") || "None"}</strong></div>
                  <div className="pt-1 text-purple-300 font-bold">
                    Effective: [{fourStepData.step3.allHouses.join(", ")}]
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  Decides whether the offer is granted (+) or negated (-).
                </p>
              </div>

              {/* Step 4: Final Confirmation */}
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Step 4 · Culmination
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">Sub&apos;s Star</span>
                </div>
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{fourStepData.step4.planet}</span>
                  {fourStepData.step4.isRetrograde && (
                    <span className="text-[10px] text-rose-400 font-mono">(R)</span>
                  )}
                </h4>
                <div className="text-xs space-y-1 text-slate-400 font-mono">
                  <div>Occupies: <strong className="text-slate-200">H{fourStepData.step4.occupiesHouse}</strong></div>
                  <div>Owns: <strong className="text-slate-200">{fourStepData.step4.ownsHouses.join(", ") || "None"}</strong></div>
                  <div className="pt-1 text-emerald-300 font-bold">
                    Effective: [{fourStepData.step4.allHouses.join(", ")}]
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  Confirms the final outcome, duration, and stability of fruit.
                </p>
              </div>
            </div>

            {/* Gondhalekar Rule Analysis Dossier */}
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-amber-300 uppercase tracking-wider block">
                Gondhalekar Diagnostic Synthesis:
              </span>
              <p className="text-slate-300 leading-relaxed">
                {fourStepData.analysisText}
              </p>
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400 font-mono text-[11px]">
                {fourStepData.gondhalekarRule}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* VIEW 3: CUSPAL INTERLINKS (CIL & CSSL - KHULLAR & BASKARAN)      */}
      {/* ================================================================ */}
      {activeSubTab === "cuspalInterlinks" && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
            <h3 className="text-base sm:text-lg font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              KP Cuspal Interlinks (CIL) &amp; Sub-Sub Lord (CSSL) Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Modern KP Cuspal Interlink Theory (developed by K. Baskaran &amp; S.P. Khullar): Every bhava connects across multiple cusps through its Cuspal Sub Lord (CSL) and Cuspal Sub-Sub Lord (CSSL). A matter is promised only when the CSL/CSSL connects with the primary and supporting bhavas without detriment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cuspalInterlinks.map((cil) => (
              <div
                key={cil.house}
                className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-amber-400 text-slate-950">
                      Cusp {cil.house}
                    </span>
                    <span className="text-sm font-bold text-slate-100">
                      {cil.title}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                      cil.promiseVerdict === "Promised"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : cil.promiseVerdict === "Delayed with Obstacles"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    }`}
                  >
                    {cil.promiseVerdict}
                  </span>
                </div>

                {/* Sub-Lord & Sub-Sub Lord Chain */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Sign Lord</span>
                    <span className="font-bold text-slate-200">{cil.signLord}</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Star Lord</span>
                    <span className="font-bold text-cyan-300">{cil.starLord}</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Cuspal Sub (CSL)</span>
                    <span className="font-bold text-amber-300">{cil.csl}</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Sub-Sub (CSSL)</span>
                    <span className="font-bold text-purple-300">{cil.cssl}</span>
                  </div>
                </div>

                {/* Linked Houses Chips */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-medium">Interlinked Bhavas:</span>
                    {cil.linkedHouses.map((h) => {
                      const isSupp = cil.supportingHouses.includes(h);
                      const isDet = cil.detrimentalHouses.includes(h);
                      return (
                        <span
                          key={h}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isSupp
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : isDet
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          H{h} {isSupp ? "✓" : isDet ? "✗" : ""}
                        </span>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-slate-400 font-mono pt-1">
                    {cil.interlinkChain}
                  </p>
                </div>

                <p className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                  {cil.classicalPrinciple}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* VIEW 4: KP HORARY 1-249 & 1-2193 (PRASHNA STUDIO)                */}
      {/* ================================================================ */}
      {activeSubTab === "horary" && (
        <div className="space-y-6">
          {/* Horary Control Panel */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  KP Horary (Prashna) Precision Engine
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter a sacred seed number to anchor the Horary Ascendant arc, cast Placidus houses, and generate authoritative judgment.
                </p>
              </div>

              {/* Table System Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">System:</span>
                <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => {
                      setHoraryTableType("1-249");
                      if (horarySeed > 249) setHorarySeed(1);
                    }}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      horaryTableType === "1-249"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Classical 1–249
                  </button>
                  <button
                    onClick={() => setHoraryTableType("1-2193")}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      horaryTableType === "1-2193"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Sub-Sub 1–2193
                  </button>
                </div>
              </div>
            </div>

            {/* Input & Query Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800">
              {/* Seed Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Horary Seed Number ({horaryTableType === "1-249" ? "1 to 249" : "1 to 2193"}):
                  </label>
                  <button
                    onClick={generateRandomSeed}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Random Seed</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={horaryTableType === "1-249" ? 249 : 2193}
                    value={horarySeed}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      const max = horaryTableType === "1-249" ? 249 : 2193;
                      setHorarySeed(Math.max(1, Math.min(max, val)));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-bold font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={generateRandomSeed}
                    title="Generate sacred random seed"
                    className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 cursor-pointer"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Query Question Dropdown */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Select Prashna Life Question:
                </label>
                <select
                  value={horaryQueryId}
                  onChange={(e) => setHoraryQueryId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {HORARY_QUERIES.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.category} · {q.question} (Primary: Cusp {q.primaryHouse})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Horary Judgment Dossier */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl space-y-6">
            {/* Verdict Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-amber-400 tracking-wider">
                    Prashna Question ({horaryResult.queryCategory}):
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-serif-celestial font-bold text-slate-100">
                  {horaryResult.queryQuestion}
                </h3>
              </div>

              {/* Confidence & Verdict Badge */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Rule score (not statistical confidence)</span>
                  <span className="text-xl font-bold font-mono text-cyan-300">
                    {horaryResult.ruleScore}%
                  </span>
                </div>

                <div
                  className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-sm ${
                    horaryResult.verdict.startsWith("YES - Strongly")
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : horaryResult.verdict.startsWith("YES - Delayed")
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  }`}
                >
                  {horaryResult.verdict.startsWith("YES") ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{horaryResult.verdict}</span>
                </div>
              </div>
            </div>

            {/* Ascendant & Primary CSL Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Horary Ascendant */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Horary Ascendant #{horaryResult.horaryNumber}
                </span>
                <span className="text-base font-bold text-amber-300 font-mono block">
                  {horaryResult.horaryAscendant.degreeFormatted} {horaryResult.horaryAscendant.sign}
                </span>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>Sign: {horaryResult.horaryAscendant.signLord}</div>
                  <div>Star: {horaryResult.horaryAscendant.starLord} · Sub: {horaryResult.horaryAscendant.subLord}</div>
                </div>
              </div>

              {/* Primary CSL */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Primary Cusp {horaryResult.primaryCusp} Sub-Lord
                </span>
                <span className="text-base font-bold text-emerald-300 block">
                  {horaryResult.primaryCsl}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Decides fruition of {horaryResult.queryCategory}
                </span>
              </div>

              {/* Ruling Planets Match */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Ruling Planets Alignment
                </span>
                <span className="text-base font-bold text-cyan-300 block">
                  {horaryResult.rulingPlanetsMatch.matchingSignificators.length > 0
                    ? horaryResult.rulingPlanetsMatch.matchingSignificators.join(", ")
                    : "Moderate"}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Moon Alignment: {horaryResult.rulingPlanetsMatch.isMoonCslAligned ? "Harmonious ✓" : "Distant"}
                </span>
              </div>

              {/* Arc Span */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Sub-Division Span
                </span>
                <span className="text-xs font-mono text-purple-300 block">
                  {horaryResult.horaryAscendant.spanStartFormatted} – {horaryResult.horaryAscendant.spanEndFormatted}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Precision seed boundary range
                </span>
              </div>
            </div>

            {/* Detailed 6-Step Prashna Dossier */}
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                Authoritative KP Prashna Breakdown:
              </span>
              <div className="space-y-1.5">
                {horaryResult.detailedJudgment.map((step, idx) => (
                  <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Astrological Action */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 block font-semibold mb-0.5">KP Remedial &amp; Practical Guidance:</strong>
                <p>{horaryResult.recommendedAction}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* VIEW 5: 4-GRADE SIGNIFICATORS MATRIX                              */}
      {/* ================================================================ */}
      {activeSubTab === "significators" && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
            <h3 className="text-base sm:text-lg font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Classical KP 4-Fold Significators (Grades I, II, III, IV)
            </h3>
            <p className="text-xs text-slate-400">
              In KP, signification is graded strictly by planetary stellar tenancy: Grade I (Planets in Star of Occupants - Strongest) ➔ Grade II (Occupants) ➔ Grade III (Planets in Star of House Lord) ➔ Grade IV (House Lord - Weakest).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(kpData.houseSignificators).map((hs) => (
              <div
                key={hs.house}
                className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-sm text-slate-100">
                    House {hs.house} ({kpData.cusps.houseDetails[hs.house - 1].signName})
                  </span>
                  <span className="text-xs font-mono text-amber-300">
                    Lord: {hs.houseLord}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-emerald-300">
                    <span>Grade I (Star of Occupant):</span>
                    <strong className="font-mono">
                      {hs.levels.levelA.join(", ") || "None"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-cyan-300">
                    <span>Grade II (Occupants):</span>
                    <strong className="font-mono">
                      {hs.levels.levelB.join(", ") || "None"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-purple-300">
                    <span>Grade III (Star of Lord):</span>
                    <strong className="font-mono">
                      {hs.levels.levelC.join(", ") || "None"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Grade IV (House Lord):</span>
                    <strong className="font-mono">
                      {hs.levels.levelD.join(", ") || "None"}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">All Significators:</span>
                  <span className="font-bold font-mono text-amber-400">
                    [{hs.allSignificators.join(", ") || "None"}]
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* VIEW 6: 12 KP CUSPS & SUB-LORDS TABLE                             */}
      {/* ================================================================ */}
      {activeSubTab === "cusps" && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              12 Placidus Cusps &amp; KP Sub-Lord Division
            </h3>
            <p className="text-xs text-slate-400">
              Accurate Placidus cuspal longitudes computed with Krishnamurti Ayanamsa ({kpData.ayanamsaFormatted}).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Cusp</th>
                  <th className="py-2.5 px-3">KP Longitude</th>
                  <th className="py-2.5 px-3">Sign</th>
                  <th className="py-2.5 px-3">Sign Lord</th>
                  <th className="py-2.5 px-3">Star (Nakshatra)</th>
                  <th className="py-2.5 px-3">Star Lord</th>
                  <th className="py-2.5 px-3 text-amber-300">Sub Lord (CSL)</th>
                  <th className="py-2.5 px-3 text-purple-300">Sub-Sub Lord</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {kpData.cusps.houseDetails.map((c) => (
                  <tr key={c.house} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-200">H{c.house}</td>
                    <td className="py-2.5 px-3 text-amber-400">{c.degreeFormatted}</td>
                    <td className="py-2.5 px-3 text-slate-300">{c.signName}</td>
                    <td className="py-2.5 px-3 text-slate-400">{c.signLord}</td>
                    <td className="py-2.5 px-3 text-cyan-400">{c.nakshatraName}</td>
                    <td className="py-2.5 px-3 text-slate-400">{c.starLord}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-300">{c.subLord}</td>
                    <td className="py-2.5 px-3 text-purple-400">{c.subSubLord}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* VIEW 7: PLANETS & SUB-LORDS TABLE                                 */}
      {/* ================================================================ */}
      {activeSubTab === "planets" && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
              <Orbit className="w-4 h-4 text-cyan-400" />
              Planetary Longitudes &amp; Sub-Lords
            </h3>
            <p className="text-xs text-slate-400">
              Each planet&apos;s KP sidereal coordinate, house occupancy, star lord, and sub-lord.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Planet</th>
                  <th className="py-2.5 px-3">Longitude</th>
                  <th className="py-2.5 px-3">Sign</th>
                  <th className="py-2.5 px-3">Occupies House</th>
                  <th className="py-2.5 px-3">Star Lord</th>
                  <th className="py-2.5 px-3 text-amber-300">Sub Lord</th>
                  <th className="py-2.5 px-3 text-purple-300">Sub-Sub Lord</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {kpData.planets.map((p) => {
                  const ps = psMap[p.name];
                  return (
                    <tr key={p.name} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-200 flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.isRetrograde && <span className="text-rose-400 text-[10px]">(R)</span>}
                      </td>
                      <td className="py-2.5 px-3 text-amber-400">{p.degreeFormatted}</td>
                      <td className="py-2.5 px-3 text-slate-300">{p.sign}</td>
                      <td className="py-2.5 px-3 font-bold text-cyan-300">H{p.house}</td>
                      <td className="py-2.5 px-3 text-slate-400">{p.starLord}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-300">{p.subLord}</td>
                      <td className="py-2.5 px-3 text-purple-400">{p.subSubLord}</td>
                      <td className="py-2.5 px-3">
                        {ps?.hasPositionalStatus ? (
                          <span className="text-[10px] text-emerald-400 font-bold">★ PS Active</span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Regular</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* VIEW 8: RULING PLANETS & TRANSIT CONCURRENCE                      */}
      {/* ================================================================ */}
      {activeSubTab === "rulingPlanets" && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Krishnamurti Padhdhati Ruling Planets (RP) &amp; Transit Concurrence
            </h3>
            <p className="text-xs text-slate-400">
              The cosmic clock of KP: Ruling Planets at any inquiry moment point directly to the fruit of the query.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">1. Day Lord</span>
              <span className="text-lg font-bold text-amber-300 block">{kpData.rulingPlanets.dayLord}</span>
              <span className="text-[10px] text-slate-500">Day of Inception</span>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">2. Moon Star Lord</span>
              <span className="text-lg font-bold text-cyan-300 block">{kpData.rulingPlanets.moonStarLord}</span>
              <span className="text-[10px] text-slate-500">Subconscious Pulse</span>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">3. Moon Sign Lord</span>
              <span className="text-lg font-bold text-blue-300 block">{kpData.rulingPlanets.moonSignLord}</span>
              <span className="text-[10px] text-slate-500">Emotional Vessel</span>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">4. Lagna Star Lord</span>
              <span className="text-lg font-bold text-emerald-300 block">{kpData.rulingPlanets.lagnaStarLord}</span>
              <span className="text-[10px] text-slate-500">Ascendant Nakshatra</span>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">5. Lagna Sign Lord</span>
              <span className="text-lg font-bold text-purple-300 block">{kpData.rulingPlanets.lagnaSignLord}</span>
              <span className="text-[10px] text-slate-500">Physical Persona</span>
            </div>
          </div>

          {/* Advanced Rules of RP: Nodes & Retrograde Planets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2 text-xs">
              <span className="font-semibold text-amber-300 block">Special Rule 1: Node Representation (Rahu &amp; Ketu)</span>
              <p className="text-slate-300 leading-relaxed">
                In KP, Rahu and Ketu are the strongest significators. If Rahu or Ketu conjoins, aspects, or occupies the sign or star of any of the above Ruling Planets, the node replaces or represents that planet in the Ruling Planets list with enhanced potency.
              </p>
            </div>

            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2 text-xs">
              <span className="font-semibold text-rose-300 block">Special Rule 2: Retrograde Planet Filtering</span>
              <p className="text-slate-300 leading-relaxed">
                According to Krishnamurti&apos;s golden rule: A ruling planet that is retrograde, or posited in the star of a retrograde planet, cannot deliver immediate fruition. It denotes delays until the planet turns direct or another strong direct RP takes charge.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
            <span className="font-semibold text-cyan-300 block">How Master KP Astrologers Use Ruling Planets for Precise Event Timing:</span>
            <p className="leading-relaxed">
              When predicting the exact date or time of an event (e.g. marriage, contract, job offer), the event can only fructify when the transiting Sun, Moon, and Ascendant pass through the Stars and Subs ruled by these Ruling Planets, and when the active Dasha-Bhukti lords are among these Ruling Planets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
