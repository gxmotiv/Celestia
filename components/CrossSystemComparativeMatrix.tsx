"use client";

import React, { useState, useMemo } from "react";
import {
  All5LevelDashasResult,
  DashaLevelItem,
  System5LevelHierarchy,
} from "@/lib/vedic/fiveLevelDashaEngines";
import {
  Layers,
  Sparkles,
  Calendar,
  Clock,
  Compass,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Filter,
} from "lucide-react";

interface CrossSystemComparativeMatrixProps {
  fiveLevels: All5LevelDashasResult;
  referenceDate?: Date;
}

interface SystemMatrixRow {
  id: string;
  systemName: string;
  tradition: string;
  totalYears: number;
  activeItem: DashaLevelItem | null;
  levelLabel: string;
}

const SYSTEM_CONFIGS: {
  key: keyof All5LevelDashasResult;
  title: string;
  tradition: string;
  totalYears: number;
}[] = [
  { key: "vimshottari", title: "Vimshottari Dasha", tradition: "Parashari 120y", totalYears: 120 },
  { key: "yogini", title: "Yogini Dasha", tradition: "Shakta 36y", totalYears: 36 },
  { key: "chara", title: "Jaimini Chara Dasha", tradition: "Jaimini Sign-Based", totalYears: 96 },
  { key: "ashtottari", title: "Ashtottari Dasha", tradition: "Parashari 108y", totalYears: 108 },
  { key: "kalachakra", title: "Kalachakra Dasha", tradition: "108 Pada Directional", totalYears: 45 },
  { key: "shodashottari", title: "Shodashottari Dasha", tradition: "Parashari Conditional 116y", totalYears: 116 },
  { key: "dwisaptati", title: "Dwisaptati Sama", tradition: "Parashari Conditional 168y", totalYears: 168 },
  { key: "shastihayani", title: "Shastihayani Dasha", tradition: "Parashari Conditional 60y", totalYears: 60 },
  { key: "sthira", title: "Jaimini Sthira Dasha", tradition: "Jaimini Fixed 96y", totalYears: 96 },
  { key: "mandooka", title: "Jaimini Mandooka Dasha", tradition: "Frog-Leap Progression", totalYears: 96 },
];

export function CrossSystemComparativeMatrix({
  fiveLevels,
  referenceDate = new Date(),
}: CrossSystemComparativeMatrixProps) {
  // Level filter: 1, 2, 3, 4, 5
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [filterTone, setFilterTone] = useState<"all" | "positive" | "neutral" | "challenging">("all");

  // Map each system to its active item at the selected level
  const matrixRows: SystemMatrixRow[] = useMemo(() => {
    return SYSTEM_CONFIGS.map((cfg) => {
      const sysData = fiveLevels[cfg.key] as System5LevelHierarchy | undefined;
      if (!sysData) {
        return {
          id: cfg.key,
          systemName: cfg.title,
          tradition: cfg.tradition,
          totalYears: cfg.totalYears,
          activeItem: null,
          levelLabel: `Level ${selectedLevel}`,
        };
      }

      // Find active item at selectedLevel
      const activeInLevel =
        sysData.activeHierarchy[`level${selectedLevel}` as keyof typeof sysData.activeHierarchy] ||
        sysData.levels[selectedLevel]?.find((item) => item.isCurrent) ||
        sysData.levels[selectedLevel]?.[0] ||
        null;

      return {
        id: cfg.key,
        systemName: cfg.title,
        tradition: cfg.tradition,
        totalYears: cfg.totalYears,
        activeItem: activeInLevel,
        levelLabel: `Level ${selectedLevel}`,
      };
    });
  }, [fiveLevels, selectedLevel]);

  // Filter rows if tone filter applied
  const filteredRows = useMemo(() => {
    if (filterTone === "all") return matrixRows;
    return matrixRows.filter((r) => r.activeItem?.tone === filterTone);
  }, [matrixRows, filterTone]);

  // Calculate convergence harmony stats
  const harmonyStats = useMemo(() => {
    let positive = 0;
    let challenging = 0;
    let neutral = 0;

    matrixRows.forEach((r) => {
      if (r.activeItem) {
        if (r.activeItem.tone === "positive") positive++;
        else if (r.activeItem.tone === "challenging") challenging++;
        else neutral++;
      }
    });

    const total = matrixRows.length;
    const positivePercent = Math.round((positive / total) * 100);

    return {
      positive,
      challenging,
      neutral,
      total,
      positivePercent,
      verdict:
        positivePercent >= 60
          ? "High Cosmic Alignment (Favorable for Initiatives & Breakthroughs)"
          : positivePercent >= 40
          ? "Balanced Dynamic Momentum (Steady Progress with Caution)"
          : "Disciplined Karmic Rectification (Focus on Duty & Spiritual Remedies)",
    };
  }, [matrixRows]);

  const levelNames: Record<1 | 2 | 3 | 4 | 5, { name: string; span: string }> = {
    1: { name: "Level 1: Mahadashas", span: "Major Epochs (Years)" },
    2: { name: "Level 2: Antardashas", span: "Sub-Periods (Months - Years)" },
    3: { name: "Level 3: Pratyantardashas", span: "Sub-Sub Periods (Weeks - Months)" },
    4: { name: "Level 4: Sookshma Dashas", span: "Fine Periods (Days - Weeks)" },
    5: { name: "Level 5: Prana Dashas", span: "Live Pulses (~1 - 3 Days)" },
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & HARMONIC CONVERGENCE METER */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                10-System Side-by-Side Comparative Matrix
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Levels 1 to 5 Synchronized
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-100 mt-1">
              Cross-Tradition Astrological Alignment Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect and contrast which planetary and sign lords are operating simultaneously across all 10 Parashari, Jaimini, and Conditional Dasha systems.
            </p>
          </div>

          {/* Harmony Resonance Metric */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 min-w-[240px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Harmonic Resonance:</span>
              <strong className="text-emerald-400 font-mono text-sm">
                {harmonyStats.positivePercent}% Favorable
              </strong>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                style={{ width: `${(harmonyStats.positive / harmonyStats.total) * 100}%` }}
                className="bg-emerald-500 transition-all"
                title={`${harmonyStats.positive} Favorable`}
              />
              <div
                style={{ width: `${(harmonyStats.neutral / harmonyStats.total) * 100}%` }}
                className="bg-amber-500 transition-all"
                title={`${harmonyStats.neutral} Neutral`}
              />
              <div
                style={{ width: `${(harmonyStats.challenging / harmonyStats.total) * 100}%` }}
                className="bg-rose-500 transition-all"
                title={`${harmonyStats.challenging} Challenging`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span className="text-emerald-400 font-semibold">{harmonyStats.positive} Favorable</span>
              <span className="text-amber-400 font-semibold">{harmonyStats.neutral} Neutral</span>
              <span className="text-rose-400 font-semibold">{harmonyStats.challenging} Disciplined</span>
            </div>
          </div>
        </div>

        {/* 2. LEVEL SELECTOR TABS & FILTER BAR */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" /> Level:
            </span>
            {([1, 2, 3, 4, 5] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedLevel === lvl
                    ? "bg-amber-500/25 border border-amber-500/50 text-amber-200 ring-1 ring-amber-400/30 shadow-sm"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <span>Lv {lvl}: {levelNames[lvl].name.split(": ")[1]}</span>
              </button>
            ))}
          </div>

          {/* Tone Filter */}
          <div className="flex items-center gap-1.5 text-xs self-start sm:self-auto">
            <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>
            {(["all", "positive", "neutral", "challenging"] as const).map((tone) => (
              <button
                key={tone}
                onClick={() => setFilterTone(tone)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all cursor-pointer ${
                  filterTone === tone
                    ? "bg-slate-800 border border-slate-600 text-slate-100 font-bold"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. COMPARATIVE SYNTHESIS VERDICT BANNER */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 flex items-start gap-3 shadow-md">
        <Compass className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <span>Synthesis at {levelNames[selectedLevel].name}</span>
            <span className="text-[10px] text-amber-400 font-mono">
              ({levelNames[selectedLevel].span})
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {harmonyStats.verdict}. Across the 10 traditions at Level {selectedLevel},{" "}
            <strong className="text-emerald-300">{harmonyStats.positive} systems</strong> indicate expansive progress,{" "}
            <strong className="text-amber-300">{harmonyStats.neutral} systems</strong> provide steady support, and{" "}
            <strong className="text-rose-300">{harmonyStats.challenging} systems</strong> demand heightened caution.
          </p>
        </div>
      </div>

      {/* 4. SIDE-BY-SIDE MATRIX TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Dasha System & Tradition</th>
                <th className="py-3 px-4">Active Lord / Sign</th>
                <th className="py-3 px-4">Operating Window</th>
                <th className="py-3 px-4">Duration & Remaining</th>
                <th className="py-3 px-4">Energy Tone</th>
                <th className="py-3 px-4">Peak Astrological Hours</th>
                <th className="py-3 px-4">Classical Astrological Nature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredRows.map((row) => {
                const item = row.activeItem;
                if (!item) return null;

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-900/50 transition-colors"
                  >
                    {/* System Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-200">{row.systemName}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {row.tradition}
                        </span>
                        <span className="font-mono">{row.totalYears}y cycle</span>
                      </div>
                    </td>

                    {/* Active Lord */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-300">
                          {item.name.slice(0, 2)}
                        </span>
                        <div>
                          <div className="font-bold text-slate-100">{item.name}</div>
                          {item.lord && item.lord !== item.name && (
                            <div className="text-[10px] text-slate-400">Ruler: {item.lord}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      <div>{item.startDateFormatted}</div>
                      <div className="text-slate-500 text-[10px]">to {item.endDateFormatted}</div>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                      <strong className="text-amber-300">{item.durationFormatted}</strong>
                      <div className="text-[10px] text-slate-400">
                        {Math.round(item.durationDays * 10) / 10} days
                      </div>
                    </td>

                    {/* Tone */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          item.tone === "positive"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : item.tone === "challenging"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {item.tone}
                      </span>
                    </td>

                    {/* Best Hours */}
                    <td className="py-3 px-4 font-mono text-[11px] text-emerald-300 whitespace-nowrap">
                      {item.bestHours || "Standard Muhurta"}
                    </td>

                    {/* Brief Nature */}
                    <td className="py-3 px-4 text-xs text-slate-300 max-w-xs leading-relaxed">
                      {item.brief}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
