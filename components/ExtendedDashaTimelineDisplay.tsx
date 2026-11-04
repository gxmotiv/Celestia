"use client";

import React, { useState, useMemo } from "react";
import {
  ExtendedDashaCalculator,
  PratyantardashaPeriod,
  SookshmaPeriod,
} from "@/lib/vedic/extendedDashaLevels";
import { PranaCalculator, PranaPeriod } from "@/lib/vedic/completeDashaSystems";
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Layers,
  ArrowRight,
  Flame,
} from "lucide-react";

interface ExtendedDashaTimelineDisplayProps {
  mahadashaLord: string;
  antardashaLord: string;
  antardashaStartDate: Date;
  antardashaYears: number;
  currentDate?: Date;
  allAntardashas?: {
    mahadasha: string;
    antardasha: string;
    startDate: Date;
    years: number;
  }[];
  onSelectAntardasha?: (md: string, ad: string, start: Date, yrs: number) => void;
}

export const PLANET_COLOR_MAP: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    accent: string;
    sanskrit: string;
  }
> = {
  Sun: {
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/40",
    accent: "bg-amber-500",
    sanskrit: "Surya",
  },
  Moon: {
    bg: "bg-sky-500/15",
    text: "text-sky-200",
    border: "border-sky-400/40",
    accent: "bg-sky-400",
    sanskrit: "Chandra",
  },
  Mars: {
    bg: "bg-red-500/15",
    text: "text-red-300",
    border: "border-red-500/40",
    accent: "bg-red-500",
    sanskrit: "Mangala",
  },
  Mercury: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    border: "border-emerald-500/40",
    accent: "bg-emerald-500",
    sanskrit: "Budha",
  },
  Jupiter: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-300",
    border: "border-yellow-500/40",
    accent: "bg-yellow-500",
    sanskrit: "Guru",
  },
  Venus: {
    bg: "bg-pink-500/15",
    text: "text-pink-300",
    border: "border-pink-500/40",
    accent: "bg-pink-500",
    sanskrit: "Shukra",
  },
  Saturn: {
    bg: "bg-indigo-500/15",
    text: "text-indigo-300",
    border: "border-indigo-500/40",
    accent: "bg-indigo-500",
    sanskrit: "Shani",
  },
  Rahu: {
    bg: "bg-purple-500/15",
    text: "text-purple-300",
    border: "border-purple-500/40",
    accent: "bg-purple-500",
    sanskrit: "Rahu",
  },
  Ketu: {
    bg: "bg-stone-500/20",
    text: "text-stone-300",
    border: "border-stone-500/40",
    accent: "bg-stone-500",
    sanskrit: "Ketu",
  },
};

export function ExtendedDashaTimelineDisplay({
  mahadashaLord,
  antardashaLord,
  antardashaStartDate,
  antardashaYears,
  currentDate = new Date(),
  allAntardashas,
  onSelectAntardasha,
}: ExtendedDashaTimelineDisplayProps) {
  // Calculator instance
  const calculator = useMemo(() => new ExtendedDashaCalculator(), []);

  // Compute Level 3 (Pratyantardashas) and Level 4 (Sookshmas)
  const pratyantardashas = useMemo(() => {
    return calculator.generatePratyantardashas(
      mahadashaLord,
      antardashaLord,
      antardashaStartDate,
      antardashaYears,
      currentDate
    );
  }, [calculator, mahadashaLord, antardashaLord, antardashaStartDate, antardashaYears, currentDate]);

  // Find currently active periods and countdowns
  const currentPeriods = useMemo(() => {
    return calculator.findCurrentExtendedPeriods(
      pratyantardashas,
      mahadashaLord,
      antardashaLord,
      currentDate
    );
  }, [calculator, pratyantardashas, mahadashaLord, antardashaLord, currentDate]);

  // Expandable Pratyantardasha state (defaults to active one)
  const [expandedPD, setExpandedPD] = useState<string | null>(() => {
    const active = pratyantardashas.find((pd) => pd.isCurrent);
    return active ? active.fullName : pratyantardashas[0]?.fullName || null;
  });

  // Selected Pratyantardasha for deep-dive panel
  const [selectedPD, setSelectedPD] = useState<PratyantardashaPeriod>(() => {
    const active = pratyantardashas.find((pd) => pd.isCurrent);
    return active || pratyantardashas[0];
  });

  // Selected Sookshma for inspection
  const [selectedSK, setSelectedSK] = useState<SookshmaPeriod | null>(() => {
    return currentPeriods.sookshma || selectedPD?.sookshmas[0] || null;
  });

  const [showPranas, setShowPranas] = useState(false);
  const pranaCalc = useMemo(() => new PranaCalculator(), []);

  const subPranas: PranaPeriod[] = useMemo(() => {
    if (!selectedSK) return [];
    return pranaCalc.generatePranas(
      mahadashaLord,
      antardashaLord,
      selectedPD.lord,
      selectedSK.lord,
      selectedSK.startDate,
      selectedSK.durationYears,
      currentDate
    );
  }, [pranaCalc, mahadashaLord, antardashaLord, selectedPD, selectedSK, currentDate]);

  const getEnergyBadge = (energy: string) => {
    switch (energy) {
      case "excellent":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Auspicious (Shubha)
          </span>
        );
      case "good":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
            Favorable (Mitra)
          </span>
        );
      case "mixed":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Neutral / Mixed (Sama)
          </span>
        );
      case "challenging":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40">
            Rigorous Test (Karmic)
          </span>
        );
      case "difficult":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
            Maximum Testing (Ashubha)
          </span>
        );
      default:
        return null;
    }
  };

  const mdColor = PLANET_COLOR_MAP[mahadashaLord] || PLANET_COLOR_MAP.Jupiter;
  const adColor = PLANET_COLOR_MAP[antardashaLord] || PLANET_COLOR_MAP.Mercury;
  const pdLord = currentPeriods.pratyantardasha?.lord || antardashaLord;
  const pdColor = PLANET_COLOR_MAP[pdLord] || PLANET_COLOR_MAP.Venus;
  const skLord = currentPeriods.sookshma?.lord || pdLord;
  const skColor = PLANET_COLOR_MAP[skLord] || PLANET_COLOR_MAP.Sun;

  return (
    <div className="space-y-6">
      {/* 4-LEVEL HIERARCHY SUMMARY & LIVE COUNTDOWN HERO */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Vimshottari Classical 4-Tier Matrix
              </span>
              <span className="text-xs text-slate-400">· Parashari 360-Day Savana Year</span>
            </div>

            {/* Current Hierarchical Breadcrumb Chain */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs sm:text-sm font-bold">
              {/* Level 1: Mahadasha */}
              <div
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${mdColor.bg} ${mdColor.border} ${mdColor.text}`}
              >
                <span className="text-[10px] uppercase font-semibold text-slate-400">L1</span>
                <span>{mahadashaLord} MD</span>
              </div>

              <span className="text-slate-500">→</span>

              {/* Level 2: Antardasha */}
              <div
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${adColor.bg} ${adColor.border} ${adColor.text}`}
              >
                <span className="text-[10px] uppercase font-semibold text-slate-400">L2</span>
                <span>{antardashaLord} AD</span>
              </div>

              <span className="text-slate-500">→</span>

              {/* Level 3: Pratyantardasha */}
              <div
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-sm ${pdColor.bg} ${pdColor.border} ${pdColor.text}`}
              >
                <span className="text-[10px] uppercase font-semibold text-amber-400 animate-pulse">L3 Active</span>
                <span>{pdLord} PD</span>
              </div>

              <span className="text-slate-500">→</span>

              {/* Level 4: Sookshma */}
              <div
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-sm ${skColor.bg} ${skColor.border} ${skColor.text}`}
              >
                <span className="text-[10px] uppercase font-semibold text-emerald-400 animate-pulse">L4 Fine</span>
                <span>{skLord} Sookshma</span>
              </div>
            </div>
          </div>

          {/* Quick Antardasha Selector (If provided) */}
          {allAntardashas && allAntardashas.length > 0 && onSelectAntardasha && (
            <div className="self-start md:self-auto bg-slate-950/80 border border-slate-800 rounded-xl p-2">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Inspect Other Antardashas:
              </label>
              <select
                aria-label="Inspect Other Antardashas"
                value={`${mahadashaLord}-${antardashaLord}`}
                onChange={(e) => {
                  const [md, ad] = e.target.value.split("-");
                  const found = allAntardashas.find(
                    (item) => item.mahadasha === md && item.antardasha === ad
                  );
                  if (found) {
                    onSelectAntardasha(found.mahadasha, found.antardasha, found.startDate, found.years);
                  }
                }}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400"
              >
                {allAntardashas.map((item, idx) => (
                  <option key={idx} value={`${item.mahadasha}-${item.antardasha}`}>
                    {item.mahadasha} / {item.antardasha} ({item.years}y)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* LIVE DUAL COUNTDOWN CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5 pt-4 border-t border-slate-800/80">
          {/* Level 3 Countdown */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                Current Level 3: {currentPeriods.pratyantardasha?.fullName}
              </span>
              <span className="text-xs text-slate-300">
                {currentPeriods.pratyantardasha?.startDateFormatted} to{" "}
                {currentPeriods.pratyantardasha?.endDateFormatted}
              </span>
              {currentPeriods.nextPratyantardasha && (
                <span className="text-[10px] text-slate-400 block mt-1">
                  Next: {currentPeriods.nextPratyantardasha.fullName} (starts{" "}
                  {currentPeriods.nextPratyantardasha.startDateFormatted})
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-bold font-mono text-amber-300 block">
                {currentPeriods.timeRemainingInPratyantardasha}
              </span>
              <span className="text-[10px] text-slate-400 uppercase">Days Left</span>
            </div>
          </div>

          {/* Level 4 Countdown */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                Current Level 4: {currentPeriods.sookshma?.fullName}
              </span>
              <span className="text-xs text-slate-300">
                {currentPeriods.sookshma?.startDateFormatted} to{" "}
                {currentPeriods.sookshma?.endDateFormatted} ({currentPeriods.sookshma?.durationFormatted})
              </span>
              {currentPeriods.nextSookshma && (
                <span className="text-[10px] text-slate-400 block mt-1">
                  Next: {currentPeriods.nextSookshma.fullName} (starts{" "}
                  {currentPeriods.nextSookshma.startDateFormatted})
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-300 block">
                {currentPeriods.timeRemainingInSookshma}
              </span>
              <span className="text-[10px] text-slate-400 uppercase">Days Left</span>
            </div>
          </div>
        </div>
      </div>

      {/* SELECTED PRATYANTARDASHA DEEP-DIVE INTERPRETATION */}
      {selectedPD && (
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/70 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {selectedPD.fullName}: {selectedPD.interpretation.title}
                </h3>
                {selectedPD.isCurrent && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-amber-950">
                    Active Sub-Sub-Period
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dates: <strong className="text-slate-300">{selectedPD.startDateFormatted}</strong> to{" "}
                <strong className="text-slate-300">{selectedPD.endDateFormatted}</strong> · Duration:{" "}
                <strong className="text-slate-200">{selectedPD.durationFormatted}</strong> ({selectedPD.durationDays} days)
              </p>
            </div>

            <div>{getEnergyBadge(selectedPD.interpretation.energy)}</div>
          </div>

          {/* Classical Description */}
          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedPD.interpretation.description}
          </p>

          {/* Themes Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedPD.interpretation.themes.map((theme, tIdx) => (
              <span
                key={tIdx}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300"
              >
                #{theme}
              </span>
            ))}
          </div>

          {/* Best Actions vs Actions to Avoid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Recommended Actions:
              </h4>
              <ul className="space-y-1">
                {selectedPD.interpretation.bestActions.map((action, aIdx) => (
                  <li key={aIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
              <h4 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                <XCircle className="w-3.5 h-3.5" />
                Actions to Avoid / Pitfalls:
              </h4>
              <ul className="space-y-1">
                {selectedPD.interpretation.avoidActions.map((action, aIdx) => (
                  <li key={aIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-rose-400 mt-0.5">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mental State & Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-slate-300 pt-1">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <strong className="text-slate-200 block mb-1 text-[11px] uppercase tracking-wider text-amber-400">
                Mental State & Focus:
              </strong>
              <span>{selectedPD.interpretation.mentalState}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <strong className="text-slate-200 block mb-1 text-[11px] uppercase tracking-wider text-indigo-400">
                Karmic Opportunities:
              </strong>
              <span>{selectedPD.interpretation.opportunities.join(" · ")}</span>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 3 TIMELINE: ALL 9 PRATYANTARDASHAS (WITH EXPANDABLE LEVEL 4 SOOKSHMAS) */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Complete Pratyantardasha Sequence for {mahadashaLord}-{antardashaLord}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any sub-sub-period to inspect its detailed interpretation and its 9 constituent Sookshmas (Level 4).
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            Total Antardasha: {antardashaYears} Years ({Math.round(antardashaYears * 360)} Days)
          </span>
        </div>

        {/* Pratyantardashas List Accordion */}
        <div className="space-y-2.5">
          {pratyantardashas.map((pd, idx) => {
            const isExpanded = expandedPD === pd.fullName;
            const isSelected = selectedPD.fullName === pd.fullName;
            const color = PLANET_COLOR_MAP[pd.lord] || PLANET_COLOR_MAP.Venus;

            return (
              <div
                key={idx}
                className={`border rounded-xl transition-all overflow-hidden ${
                  pd.isCurrent
                    ? "bg-amber-500/10 border-amber-500/40 shadow-md ring-1 ring-amber-500/20"
                    : isSelected
                    ? "bg-slate-900/90 border-slate-700"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                {/* Row Header */}
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div
                    onClick={() => {
                      setSelectedPD(pd);
                      setExpandedPD(isExpanded ? null : pd.fullName);
                    }}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${color.bg} ${color.border} ${color.text}`}
                    >
                      {pd.lord.slice(0, 2)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{pd.fullName}</span>
                        {pd.isCurrent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-amber-950">
                            Current L3
                          </span>
                        )}
                        {isSelected && !pd.isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            Viewing
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {pd.interpretation.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs tabular-nums">
                    <span className="text-slate-300">
                      {pd.startDateFormatted} — {pd.endDateFormatted}
                    </span>
                    <span className="text-[11px] text-amber-400/90 font-mono font-semibold">
                      ({pd.durationFormatted})
                    </span>

                    <button
                      type="button"
                      onClick={() => setExpandedPD(isExpanded ? null : pd.fullName)}
                      className="p-1 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-md transition-colors cursor-pointer"
                      title={isExpanded ? "Collapse Sookshmas" : "Expand Sookshmas"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Level 4 Sookshmas Sub-Grid (Expandable) */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/95 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        Level 4 Sookshmas (Fine Windows) under {pd.fullName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        9 Fine Sub-Periods · ~7 to 25 Days Each
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {pd.sookshmas.map((sk, sIdx) => {
                        const skCol = PLANET_COLOR_MAP[sk.lord] || PLANET_COLOR_MAP.Sun;
                        const isSKActive = sk.isCurrent;
                        const isSKSelected = selectedSK?.fullName === sk.fullName;

                        return (
                          <div
                            key={sIdx}
                            onClick={() => setSelectedSK(sk)}
                            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                              isSKActive
                                ? "bg-emerald-500/15 border-emerald-500/50 shadow-sm"
                                : isSKSelected
                                ? "bg-slate-900 border-slate-600"
                                : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[11px] font-bold ${skCol.text}`}>
                                {sk.fullName.split("-").slice(-2).join("-")} ({sk.lord})
                              </span>
                              {isSKActive && (
                                <span className="text-[9px] font-bold px-1 rounded bg-emerald-400 text-emerald-950">
                                  Live Now
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] text-slate-400 font-mono">
                              {sk.startDateFormatted} to {sk.endDateFormatted}
                            </div>

                            <div className="text-[10px] text-slate-300 mt-1 flex items-center justify-between">
                              <span>Duration: {sk.durationFormatted}</span>
                              <span
                                className={`text-[9px] font-medium capitalize ${
                                  sk.interpretation.energyQuality === "positive"
                                    ? "text-emerald-400"
                                    : sk.interpretation.energyQuality === "challenging"
                                    ? "text-rose-400"
                                    : "text-amber-400"
                                }`}
                              >
                                {sk.interpretation.energyQuality}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sookshma Detail Inspector */}
                    {selectedSK && (
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5 mt-2">
                        <div className="flex items-center justify-between font-bold text-slate-200">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            Level 4 Focus: {selectedSK.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {selectedSK.startDateFormatted} to {selectedSK.endDateFormatted} ({selectedSK.durationFormatted})
                          </span>
                        </div>
                        <p className="text-slate-300">{selectedSK.interpretation.brief}</p>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
                          <span className="text-emerald-400">
                            <strong>Recommended:</strong> {selectedSK.interpretation.recommendedFocus}
                          </span>
                          <span className="text-rose-400">
                            <strong>Avoid:</strong> {selectedSK.interpretation.avoidDuring}
                          </span>
                        </div>

                        {/* Level 5 Prana Toggle */}
                        <div className="pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => setShowPranas(!showPranas)}
                            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{showPranas ? "Hide Level 5 Prana Periods" : "Drill to Level 5: 9 Prana Periods (~1-3 Days Each)"}</span>
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showPranas ? "rotate-90" : ""}`} />
                          </button>

                          {showPranas && subPranas.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2.5">
                              {subPranas.map((prana, pIdx) => {
                                const pCol = PLANET_COLOR_MAP[prana.lord] || PLANET_COLOR_MAP.Sun;
                                return (
                                  <div
                                    key={pIdx}
                                    className={`p-2 rounded-lg border text-left ${
                                      prana.isCurrent
                                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                                        : "bg-slate-950/80 border-slate-800 text-slate-300"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                      <span className={pCol.text}>{prana.lord} Prana</span>
                                      {prana.isCurrent && (
                                        <span className="text-[9px] bg-amber-400 text-amber-950 px-1 rounded">Live</span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      {prana.startDateFormatted} ({prana.durationFormatted})
                                    </div>
                                    <div className="text-[9px] text-slate-300 mt-1">
                                      Best: {prana.interpretation.bestHours}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
