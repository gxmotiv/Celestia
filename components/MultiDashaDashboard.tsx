"use client";

import React, { useState, useMemo } from "react";
import { VedicChartData } from "@/lib/astronomy/vedic";
import {
  CompleteDashaOrchestrator,
  AllDashaSystems,
} from "@/lib/vedic/completeDashaSystems";
import { ExtendedDashaCalculator } from "@/lib/vedic/extendedDashaLevels";
import {
  Sparkles,
  Calendar,
  Clock,
  Compass,
  Layers,
  TrendingUp,
  Award,
  RefreshCw,
  LayoutGrid,
  Shield,
  Zap,
} from "lucide-react";
import { FiveLevelDashaSystemView } from "@/components/FiveLevelDashaSystemView";
import { CrossSystemComparativeMatrix } from "@/components/CrossSystemComparativeMatrix";
import { MasterAIAstrologerCockpit } from "@/components/MasterAIAstrologerCockpit";

interface MultiDashaDashboardProps {
  vedicData: VedicChartData;
  birthDate: string;
  birthTime: string;
  birthUtcInstant?: string;
}

export type DashaTabId =
  | "convergence"
  | "matrix"
  | "vimshottari"
  | "yogini"
  | "chara"
  | "ashtottari"
  | "kalachakra"
  | "shodashottari"
  | "dwisaptati"
  | "shastihayani"
  | "sthira"
  | "mandooka";

export function MultiDashaDashboard({
  vedicData,
  birthDate,
  birthTime,
  birthUtcInstant,
}: MultiDashaDashboardProps) {
  // Navigation tab across all 10 systems + convergence + comparative matrix
  const [activeSystemTab, setActiveSystemTab] = useState<DashaTabId>("convergence");
  const [isAiConsultOpen, setIsAiConsultOpen] = useState(false);

  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());

  // Prepare input data for the orchestrator
  const orchestrator = useMemo(() => new CompleteDashaOrchestrator(), []);
  const extendedCalc = useMemo(() => new ExtendedDashaCalculator(), []);

  // Use the exact instant resolved by the main birth-profile pipeline.
  // The local-clock fallback is retained for standalone callers and preserves midnight.
  const birthDateObj = useMemo(() => {
    if (birthUtcInstant) {
      const resolved = new Date(birthUtcInstant);
      if (!Number.isFinite(resolved.getTime())) {
        throw new RangeError("The resolved UTC birth instant is invalid.");
      }
      return resolved;
    }
    const [yStr, mStr, dStr] = birthDate.split("-");
    const [hStr, minStr] = birthTime.split(":");
    const year = Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);
    const hour = Number(hStr);
    const minute = Number(minStr);
    if (![year, month, day, hour, minute].every(Number.isFinite) ||
        month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new RangeError("Enter a valid birth date and local birth time.");
    }
    return new Date(Date.UTC(year, month - 1, day, hour, minute));
  }, [birthDate, birthTime, birthUtcInstant]);

  // Extract Moon coordinates and Nakshatra parameters
  const moonPlanet = useMemo(() => {
    return (
      vedicData.planets.find((p) => p.name === "Moon") || {
        siderealLongitude: 180,
        nakshatraIndex: 13,
        rasiName: "Libra",
        rasiDegree: 10,
      }
    );
  }, [vedicData]);

  // Build planetsInSigns map for Jaimini Chara Dasha
  const planetsInSigns = useMemo(() => {
    const map: Record<string, string> = {};
    vedicData.planets.forEach((p) => {
      map[p.rasiName] = p.name;
    });
    return map;
  }, [vedicData]);

  // Calculate current Sookshma context for Level 5 Prana
  const currentMD = useMemo(() => {
    return vedicData.vimshottariDashas.find((period) => {
      const start = new Date(period.startDate).getTime();
      const end = new Date(period.endDate).getTime();
      return Number.isFinite(start) && Number.isFinite(end) &&
        referenceDate.getTime() >= start && referenceDate.getTime() < end;
    }) ?? null;
  }, [vedicData, referenceDate]);

  const currentAD = useMemo(() => {
    if (!currentMD) return null;
    return currentMD.subPeriods?.find((period) => {
      const start = new Date(period.startDate).getTime();
      const end = new Date(period.endDate).getTime();
      return Number.isFinite(start) && Number.isFinite(end) &&
        referenceDate.getTime() >= start && referenceDate.getTime() < end;
    }) ?? null;
  }, [currentMD, referenceDate]);

  const sookshmaContext = useMemo(() => {
    if (!currentMD || !currentAD) return undefined;
    const mdName = currentMD.planet;
    const adName = currentAD.planet;
    const mdYears = ExtendedDashaCalculator.DASHA_YEARS[mdName] || 10;
    const adYears = ExtendedDashaCalculator.DASHA_YEARS[adName] || 10;
    const adTotalYears = (mdYears * adYears) / 120;
    const adStartDate = new Date(currentAD.startDate);

    const pds = extendedCalc.generatePratyantardashas(
      mdName,
      adName,
      adStartDate,
      adTotalYears,
      referenceDate
    );
    const activePD = pds.find((period) => period.isCurrent);
    const activeSK = activePD?.sookshmas.find((period) => period.isCurrent);
    if (!activePD || !activeSK) return undefined;

    return {
      mahadasha: mdName,
      antardasha: adName,
      pratyantardasha: activePD.lord,
      sookshma: activeSK.lord,
      startDate: activeSK.startDate,
      years: activeSK.durationYears,
    };
  }, [currentMD, currentAD, extendedCalc, referenceDate]);

  // Generate All 10 Systems simultaneously
  const allDashas: AllDashaSystems = useMemo(() => {
    const moonNakshatra1Indexed = moonPlanet.nakshatraIndex + 1;
    const moonDegreeInNakshatra = moonPlanet.siderealLongitude % (360 / 27);

    return orchestrator.generateAllDashas({
      moonLongitude: moonPlanet.siderealLongitude,
      moonNakshatra1Indexed,
      moonDegreeInNakshatra,
      ascendantSign: vedicData.lagna.rasiName,
      planetsInSigns,
      birthDate: birthDateObj,
      sookshmaContext,
      referenceDate,
    });
  }, [
    orchestrator,
    moonPlanet,
    vedicData.lagna.rasiName,
    planetsInSigns,
    birthDateObj,
    sookshmaContext,
    referenceDate,
  ]);

  return (
    <div className="space-y-6">
      {/* HEADER & MULTI-SYSTEM SELECTOR */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                Vedic Multi-Dasha Synthesis Engine
              </span>
              <span className="text-xs text-slate-400">
                · 10 Classical Parashari & Jaimini Traditions
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold font-serif text-slate-100 mt-1">
              10 Classical Dasha Systems & 5-Level Timing Cockpit
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Full Level 1 (Mahadasha) to Level 5 (Prana) precision across Parashari, Jaimini, Tantric, and Special Conditional cycles.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setIsAiConsultOpen(!isAiConsultOpen)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiConsultOpen ? "Close Master AI" : "Consult Master AI"}</span>
            </button>

            <button
              onClick={() => setReferenceDate(new Date())}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset to Now</span>
            </button>
          </div>
        </div>

        {/* MASTER AI ASTROLOGER COCKPIT DRAWER */}
        {isAiConsultOpen && (
          <div className="pt-2">
            <MasterAIAstrologerCockpit
              seekerName="Seeker"
              birthDate={birthDate}
              birthTime={birthTime}
              vedicData={vedicData}
              activeDashas={allDashas.convergence}
              onClose={() => setIsAiConsultOpen(false)}
            />
          </div>
        )}

        {/* COMPREHENSIVE SYSTEM SELECTOR TABS */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          {/* Group 1: Synthesis & Comparative Matrix */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveSystemTab("convergence")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSystemTab === "convergence"
                  ? "bg-gradient-to-r from-amber-500/25 to-amber-600/25 text-amber-200 border border-amber-500/40 shadow-sm ring-1 ring-amber-400/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 bg-slate-900/40 border border-slate-800/80"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Cross-System Convergence</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>

            <button
              onClick={() => setActiveSystemTab("matrix")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSystemTab === "matrix"
                  ? "bg-gradient-to-r from-emerald-500/25 to-teal-600/25 text-emerald-200 border border-emerald-500/40 shadow-sm ring-1 ring-emerald-400/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 bg-slate-900/40 border border-slate-800/80"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-teal-400" />
              <span>Side-by-Side Comparative Matrix</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-teal-500/20 text-teal-300 font-bold">
                All 10 Systems
              </span>
            </button>
          </div>

          {/* Group 2: Individual 10 Systems */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0 mr-1">
              Systems:
            </span>

            <button
              onClick={() => setActiveSystemTab("vimshottari")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSystemTab === "vimshottari"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Vimshottari (120y)</span>
            </button>

            <button
              onClick={() => setActiveSystemTab("yogini")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSystemTab === "yogini"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Yogini (36y)</span>
            </button>

            <button
              onClick={() => setActiveSystemTab("chara")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSystemTab === "chara"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>Jaimini Chara</span>
            </button>

            <button
              onClick={() => setActiveSystemTab("ashtottari")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSystemTab === "ashtottari"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
              <span>Ashtottari (108y)</span>
            </button>

            <button
              onClick={() => setActiveSystemTab("kalachakra")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSystemTab === "kalachakra"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>Kalachakra (108 Padas)</span>
            </button>

            <button
              onClick={() => setActiveSystemTab("shodashottari")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSystemTab === "shodashottari"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Shodashottari (116y)</span>
            </button>

            <button
              onClick={() => setActiveSystemTab("dwisaptati")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSystemTab === "dwisaptati"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dwisaptati (168y)</span>
            </button>

            <button
              onClick={() => setActiveSystemTab("shastihayani")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSystemTab === "shastihayani"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Shastihayani (60y)</span>
            </button>

            <button
              onClick={() => setActiveSystemTab("sthira")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSystemTab === "sthira"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Award className="w-3.5 h-3.5 text-teal-400" />
              <span>Jaimini Sthira (96y)</span>
            </button>

            <button
              onClick={() => setActiveSystemTab("mandooka")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSystemTab === "mandooka"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Jaimini Mandooka (Frog-Leap)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. CROSS-SYSTEM CONVERGENCE VIEW */}
      {activeSystemTab === "convergence" && (
        <div className="space-y-6">
          {/* Quick Master AI Oracle Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  Synthesize Active 10-Dasha Matrix with Master AI
                </h4>
                <p className="text-xs text-slate-400">
                  Generate cross-tradition timing forecasts, harmonic confluences, and classical Vedic remedies.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAiConsultOpen(true)}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Master Consultation</span>
            </button>
          </div>

          {/* Top Simultaneous Active Status Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Simultaneous Active Periods Across All 10 Systems Today
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {allDashas.convergence.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 shadow-lg space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.system}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.tone === "positive"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : item.tone === "challenging"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {item.tone}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <span>{item.activePeriodName}</span>
                  </h4>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {item.coreTheme}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Duration: {item.durationRemaining}</span>
                    <span className="text-amber-400 font-semibold">{item.lordOrSign}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deep Cross-System Interpretation Analysis */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              Classical Multi-System Synthesis & Predictive Verdict
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              When multiple independent Dasha traditions point toward the same planetary or sign qualities, the astrological manifestation becomes inevitable. At this current moment:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <strong className="text-emerald-400 block text-xs font-semibold">
                  Parashari Guardianship:
                </strong>
                <p>
                  Vimshottari ({allDashas.currentPrana?.lord || "Active"}), Ashtottari ({allDashas.currentAshtottari?.planet || "Active"}), and Shodashottari ({allDashas.fiveLevels.shodashottari.activeHierarchy.level1?.name || "Active"}) emphasize focused karmic fruition and decisive personal momentum.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <strong className="text-indigo-400 block text-xs font-semibold">
                  Jaimini Sign Triplicity:
                </strong>
                <p>
                  Chara ({allDashas.currentChara?.sign || "Active"}), Sthira ({allDashas.fiveLevels.sthira.activeHierarchy.level1?.name || "Active"}), and Mandooka ({allDashas.fiveLevels.mandooka.activeHierarchy.level1?.name || "Active"}) highlight sign karakas and house activations.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <strong className="text-amber-400 block text-xs font-semibold">
                  Tantric & Deity Currents:
                </strong>
                <p>
                  Yogini ({allDashas.currentYogini?.yogini || "Active"}) and Kalachakra ({allDashas.currentKalachakra?.deity || "Active"} {allDashas.currentKalachakra?.direction}) reveal subconscious spiritual energy and directional protection.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SIDE-BY-SIDE COMPARATIVE MATRIX */}
      {activeSystemTab === "matrix" && (
        <CrossSystemComparativeMatrix
          fiveLevels={allDashas.fiveLevels}
          referenceDate={referenceDate}
        />
      )}

      {/* 3. VIMSHOTTARI DASHA (LEVELS 1 TO 5) */}
      {activeSystemTab === "vimshottari" && (
        <FiveLevelDashaSystemView
          system={allDashas.fiveLevels.vimshottari}
          systemTitle="Vimshottari Dasha (Levels 1 to 5)"
          tradition="Parashari 120-Year Classical System"
        />
      )}

      {/* 4. YOGINI DASHA (LEVELS 1 TO 5) */}
      {activeSystemTab === "yogini" && (
        <FiveLevelDashaSystemView
          system={allDashas.fiveLevels.yogini}
          systemTitle="Yogini Dasha (Levels 1 to 5)"
          tradition="Shakta & Parashari 36-Year Classical System"
        />
      )}

      {/* 5. JAIMINI CHARA DASHA (LEVELS 1 TO 5) */}
      {activeSystemTab === "chara" && (
        <FiveLevelDashaSystemView
          system={allDashas.fiveLevels.chara}
          systemTitle="Jaimini Chara Dasha (Levels 1 to 5)"
          tradition="Jaimini Upadesha Sutras Sign-Based System"
        />
      )}

      {/* 6. ASHTOTTARI DASHA (LEVELS 1 TO 5) */}
      {activeSystemTab === "ashtottari" && (
        <FiveLevelDashaSystemView
          system={allDashas.fiveLevels.ashtottari}
          systemTitle="Ashtottari Dasha (Levels 1 to 5)"
          tradition="Parashari 108-Year Planetary System"
        />
      )}

      {/* 7. KALACHAKRA DASHA (LEVELS 1 TO 5) */}
      {activeSystemTab === "kalachakra" && (
        <FiveLevelDashaSystemView
          system={allDashas.fiveLevels.kalachakra}
          systemTitle="Kalachakra Dasha (Levels 1 to 5)"
          tradition="108 Pada Directional Deity System"
        />
      )}

      {/* 8. SHODASHOTTARI DASHA (LEVELS 1 TO 5) */}
      {activeSystemTab === "shodashottari" && (
        <FiveLevelDashaSystemView
          system={allDashas.fiveLevels.shodashottari}
          systemTitle="Shodashottari Dasha (Levels 1 to 5)"
          tradition="Parashari 116-Year Conditional System"
        />
      )}

      {/* 9. DWISAPTATI DASHA (LEVELS 1 TO 5) */}
      {activeSystemTab === "dwisaptati" && (
        <FiveLevelDashaSystemView
          system={allDashas.fiveLevels.dwisaptati}
          systemTitle="Dwisaptati Sama Dasha (Levels 1 to 5)"
          tradition="Parashari 168-Year Conditional System"
        />
      )}

      {/* 10. SHASTIHAYANI DASHA (LEVELS 1 TO 5) */}
      {activeSystemTab === "shastihayani" && (
        <FiveLevelDashaSystemView
          system={allDashas.fiveLevels.shastihayani}
          systemTitle="Shastihayani Dasha (Levels 1 to 5)"
          tradition="Parashari 60-Year Conditional System"
        />
      )}

      {/* 11. JAIMINI STHIRA DASHA (LEVELS 1 TO 5) */}
      {activeSystemTab === "sthira" && (
        <FiveLevelDashaSystemView
          system={allDashas.fiveLevels.sthira}
          systemTitle="Jaimini Sthira Dasha (Levels 1 to 5)"
          tradition="Jaimini Sthira 96-Year Sign-Based System"
        />
      )}

      {/* 12. JAIMINI MANDOOKA DASHA (LEVELS 1 TO 5) */}
      {activeSystemTab === "mandooka" && (
        <FiveLevelDashaSystemView
          system={allDashas.fiveLevels.mandooka}
          systemTitle="Jaimini Mandooka Dasha (Levels 1 to 5)"
          tradition="Jaimini Frog-Leap Progression System"
        />
      )}
    </div>
  );
}
