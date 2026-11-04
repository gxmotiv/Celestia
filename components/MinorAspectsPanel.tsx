"use client";

import React, { useState, useMemo } from "react";
import { PlanetPosition } from "@/lib/astronomy/ephemeris";
import {
  MinorAspectsEngine,
  MinorAspect,
  AspectSettings,
  DEFAULT_ASPECT_SETTINGS,
  AspectNature,
} from "@/lib/astronomy/minorAspects";
import {
  Sparkles,
  SlidersHorizontal,
  Flame,
  ShieldAlert,
  Feather,
  Compass,
  CheckCircle2,
  HelpCircle,
  Eye,
  Layers,
  ArrowUpDown,
  Filter,
} from "lucide-react";

interface MinorAspectsPanelProps {
  planets: PlanetPosition[];
  initialSettings?: Partial<AspectSettings>;
}

export function MinorAspectsPanel({
  planets,
  initialSettings,
}: MinorAspectsPanelProps) {
  const [settings, setSettings] = useState<AspectSettings>({
    ...DEFAULT_ASPECT_SETTINGS,
    ...initialSettings,
  });

  const [natureFilter, setNatureFilter] = useState<"all" | AspectNature>("all");
  const [harmonicFilter, setHarmonicFilter] = useState<number | "all">("all");
  const [selectedAspect, setSelectedAspect] = useState<MinorAspect | null>(null);
  const [sortBy, setSortBy] = useState<"strength" | "angle" | "planet">("strength");
  const [activeTab, setActiveTab] = useState<"list" | "harmonics">("list");
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  const engine = useMemo(() => new MinorAspectsEngine(), []);

  // Calculate all minor aspects with current settings
  const allAspects = useMemo(() => {
    return engine.calculateMinorAspects(planets, settings);
  }, [engine, planets, settings]);

  // Harmonic Breakdown
  const harmonicBreakdown = useMemo(() => {
    return engine.getHarmonicBreakdown(allAspects);
  }, [engine, allAspects]);

  // Filtered & Sorted aspects
  const filteredAspects = useMemo(() => {
    let list = [...allAspects];

    if (natureFilter !== "all") {
      list = list.filter((asp) => asp.aspectType.nature === natureFilter);
    }

    if (harmonicFilter !== "all") {
      list = list.filter(
        (asp) => asp.aspectType.harmonicNumber === harmonicFilter
      );
    }

    if (sortBy === "strength") {
      list.sort((a, b) => b.strength - a.strength);
    } else if (sortBy === "angle") {
      list.sort((a, b) => a.aspectType.angle - b.aspectType.angle);
    } else if (sortBy === "planet") {
      list.sort((a, b) => a.planet1.localeCompare(b.planet1));
    }

    return list;
  }, [allAspects, natureFilter, harmonicFilter, sortBy]);

  // Nature summary counts
  const natureCounts = useMemo(() => {
    const counts = {
      harmonious: 0,
      challenging: 0,
      spiritual: 0,
      neutral: 0,
    };
    allAspects.forEach((a) => {
      counts[a.aspectType.nature]++;
    });
    return counts;
  }, [allAspects]);

  return (
    <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold font-mono">
              Q
            </span>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Minor & Harmonic Planetary Aspects
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-medium border border-slate-700">
              {allAspects.length} Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Harmonic divisions (5th, 7th, 8th, 9th, 10th, 12th) revealing hidden talents, karmic callings, and acute friction points
          </p>
        </div>

        {/* View and Settings Toggles */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === "list"
                  ? "bg-amber-500/20 text-amber-300 font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Aspects List
            </button>
            <button
              onClick={() => setActiveTab("harmonics")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === "harmonics"
                  ? "bg-amber-500/20 text-amber-300 font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Harmonic Families
            </button>
          </div>

          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              showSettingsDrawer
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}
            title="Configure Orbs & Harmonics"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Settings Config Drawer */}
      {showSettingsDrawer && (
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              Aspect Engine Configuration
            </span>
            <button
              onClick={() => setSettings(DEFAULT_ASPECT_SETTINGS)}
              className="text-[11px] text-amber-400 hover:underline"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Orb Multiplier */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block text-[11px] font-medium">
                Orb Multiplier Window:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: "Tight (0.5x)", val: 0.5 },
                  { label: "Standard (1.0x)", val: 1.0 },
                  { label: "Wide (1.5x)", val: 1.5 },
                ].map((btn) => (
                  <button
                    key={btn.val}
                    onClick={() =>
                      setSettings({ ...settings, minorOrbMultiplier: btn.val })
                    }
                    className={`py-1.5 px-2 rounded text-[11px] font-medium border text-center transition-colors ${
                      settings.minorOrbMultiplier === btn.val
                        ? "bg-amber-500/20 border-amber-500/60 text-amber-200"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Show Weak Aspects */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block text-[11px] font-medium">
                Aspect Sensitivity:
              </label>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    showWeakAspects: !settings.showWeakAspects,
                  })
                }
                className={`w-full py-1.5 px-3 rounded text-[11px] font-medium border text-left flex items-center justify-between transition-colors ${
                  settings.showWeakAspects
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Show Marginal Aspects (&lt;25% strength)</span>
                <span className="font-mono text-[10px]">
                  {settings.showWeakAspects ? "ON" : "OFF"}
                </span>
              </button>
            </div>

            {/* Harmonic Integration */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block text-[11px] font-medium">
                Aspect Engine State:
              </label>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    useMinorAspects: !settings.useMinorAspects,
                  })
                }
                className={`w-full py-1.5 px-3 rounded text-[11px] font-medium border text-left flex items-center justify-between transition-colors ${
                  settings.useMinorAspects
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                    : "bg-rose-500/15 border-rose-500/40 text-rose-300"
                }`}
              >
                <span>Minor Aspects Engine</span>
                <span className="font-mono text-[10px]">
                  {settings.useMinorAspects ? "ENABLED" : "PAUSED"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() =>
            setNatureFilter(natureFilter === "harmonious" ? "all" : "harmonious")
          }
          className={`p-2.5 rounded-lg border text-left transition-all ${
            natureFilter === "harmonious"
              ? "bg-cyan-500/20 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/30"
              : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-cyan-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Harmonious (Q, bQ, Dec)
            </span>
            <span className="font-mono text-xs font-bold text-slate-100">
              {natureCounts.harmonious}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Talent, innovation & craft
          </span>
        </button>

        <button
          onClick={() =>
            setNatureFilter(natureFilter === "challenging" ? "all" : "challenging")
          }
          className={`p-2.5 rounded-lg border text-left transition-all ${
            natureFilter === "challenging"
              ? "bg-rose-500/20 border-rose-500 text-rose-200 ring-1 ring-rose-500/30"
              : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-rose-400 flex items-center gap-1">
              <Flame className="w-3 h-3" /> Challenging (∠, ⚼, ⚻)
            </span>
            <span className="font-mono text-xs font-bold text-slate-100">
              {natureCounts.challenging}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Friction, urgency & realignment
          </span>
        </button>

        <button
          onClick={() =>
            setNatureFilter(natureFilter === "spiritual" ? "all" : "spiritual")
          }
          className={`p-2.5 rounded-lg border text-left transition-all ${
            natureFilter === "spiritual"
              ? "bg-emerald-500/20 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/30"
              : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
              <Feather className="w-3 h-3" /> Spiritual (Sep, Nov)
            </span>
            <span className="font-mono text-xs font-bold text-slate-100">
              {natureCounts.spiritual}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Mysticism, initiation & fate
          </span>
        </button>

        <button
          onClick={() =>
            setNatureFilter(natureFilter === "neutral" ? "all" : "neutral")
          }
          className={`p-2.5 rounded-lg border text-left transition-all ${
            natureFilter === "neutral"
              ? "bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/30"
              : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
              <Compass className="w-3 h-3" /> Neutral (⚺)
            </span>
            <span className="font-mono text-xs font-bold text-slate-100">
              {natureCounts.neutral}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Subtle bridges & incremental growth
          </span>
        </button>
      </div>

      {/* FILTER BAR & SORTING */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Filter className="w-3 h-3 text-amber-400" /> Filter:
          </span>

          <select
            value={natureFilter}
            onChange={(e) => setNatureFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-2.5 py-1 rounded text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Natures ({allAspects.length})</option>
            <option value="harmonious">Harmonious ({natureCounts.harmonious})</option>
            <option value="challenging">Challenging ({natureCounts.challenging})</option>
            <option value="spiritual">Spiritual ({natureCounts.spiritual})</option>
            <option value="neutral">Neutral ({natureCounts.neutral})</option>
          </select>

          <select
            value={harmonicFilter}
            onChange={(e) => {
              const val = e.target.value;
              setHarmonicFilter(val === "all" ? "all" : parseInt(val, 10));
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-2.5 py-1 rounded text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Harmonics</option>
            <option value="5">5th Harmonic (Quintiles / 72°, 144°)</option>
            <option value="7">7th Harmonic (Septile / 51.43°)</option>
            <option value="8">8th Harmonic (Semisquare / 45°, 135°)</option>
            <option value="9">9th Harmonic (Novile / 40°)</option>
            <option value="10">10th Harmonic (Decile / 36°)</option>
            <option value="12">12th Harmonic (Semisextile / 30°, 150°)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <ArrowUpDown className="w-3 h-3 text-amber-400" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-2.5 py-1 rounded text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="strength">Tightest Orb (Strength)</option>
            <option value="angle">Aspect Angle (Smallest to Largest)</option>
            <option value="planet">Planet Name</option>
          </select>
        </div>
      </div>

      {/* TAB 1: ASPECTS LIST */}
      {activeTab === "list" && (
        <div className="space-y-3">
          {filteredAspects.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
              <Compass className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
              <p className="text-sm text-slate-300 font-medium">
                No minor aspects found with current filters
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try setting the Orb Multiplier to &quot;Wide (1.5x)&quot; or enabling &quot;Show Marginal Aspects&quot; in settings.
              </p>
            </div>
          ) : (
            filteredAspects.map((aspect, index) => {
              const isSelected =
                selectedAspect?.planet1 === aspect.planet1 &&
                selectedAspect?.planet2 === aspect.planet2 &&
                selectedAspect?.aspectType.name === aspect.aspectType.name;

              return (
                <div
                  key={`${aspect.planet1}-${aspect.planet2}-${aspect.aspectType.name}-${index}`}
                  onClick={() => setSelectedAspect(isSelected ? null : aspect)}
                  className={`p-4 rounded-xl border-l-4 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-800/90 shadow-lg ring-1 ring-amber-500/40"
                      : "bg-slate-950/70 hover:bg-slate-900/90 border-r border-t border-b border-slate-800"
                  }`}
                  style={{ borderLeftColor: aspect.aspectType.color }}
                >
                  {/* Top Line: Planets & Aspect Symbol */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                        <span className="text-amber-400 font-serif">
                          {aspect.planet1Symbol}
                        </span>
                        <span>{aspect.planet1}</span>
                        <span
                          className="font-bold px-1.5 py-0.5 rounded text-xs font-mono"
                          style={{
                            backgroundColor: `${aspect.aspectType.color}25`,
                            color: aspect.aspectType.color,
                          }}
                        >
                          {aspect.aspectType.symbol}
                        </span>
                        <span className="text-amber-400 font-serif">
                          {aspect.planet2Symbol}
                        </span>
                        <span>{aspect.planet2}</span>
                      </span>

                      <span className="text-xs font-medium text-slate-400">
                        ({aspect.aspectType.name} {aspect.aspectType.angle}°)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          aspect.applying
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {aspect.applying ? "Applying" : "Separating"}
                      </span>

                      <span className="text-slate-300 tabular-nums">
                        Orb: {aspect.orb.toFixed(2)}°
                      </span>
                    </div>
                  </div>

                  {/* Interpretation Text */}
                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed font-sans">
                    {aspect.interpretation}
                  </p>

                  {/* Bottom Line: Badges, Strength Bar & Keywords */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-950 font-sans"
                        style={{ backgroundColor: aspect.aspectType.color }}
                      >
                        {aspect.aspectType.name}
                      </span>

                      <span className="text-slate-400 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {aspect.harmonicFamily.split(" ")[0]} {aspect.aspectType.divisionalOrder}
                      </span>

                      {aspect.keywords.slice(0, 3).map((kw, ki) => (
                        <span
                          key={ki}
                          className="text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded text-[10px] border border-slate-800/80"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>

                    {/* Strength Gauge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Power:
                      </span>
                      <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.round(aspect.strength * 100)}%`,
                            backgroundColor: aspect.aspectType.color,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-200">
                        {Math.round(aspect.strength * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: HARMONIC FAMILIES DEEP DIVE */}
      {activeTab === "harmonics" && (
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-200 leading-relaxed">
            <strong>Harmonic Astrology Principles:</strong> Harmonic aspects reflect fundamental frequency waves dividing the 360° celestial continuum. By examining which harmonic orders dominate your natal chart, we identify the primary vibrational frequencies driving your talents, karmic assignments, and creative output.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {harmonicBreakdown.map((group) => (
              <div
                key={group.harmonicNumber}
                className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono text-[10px]">
                        H{group.harmonicNumber}
                      </span>
                      {group.familyName}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {group.meaning}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono text-xs font-bold border border-slate-700">
                    {group.count}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.aspects.map((asp, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-900/70 rounded-lg border-l-2 flex items-center justify-between text-xs"
                      style={{ borderLeftColor: asp.aspectType.color }}
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-200">
                          {asp.planet1} {asp.aspectType.symbol} {asp.planet2}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {asp.aspectType.name} ({asp.aspectType.angle}°) · Orb {asp.orb.toFixed(2)}°
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-amber-300 block font-bold">
                          {Math.round(asp.strength * 100)}%
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase">
                          {asp.applying ? "Applying" : "Separating"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
