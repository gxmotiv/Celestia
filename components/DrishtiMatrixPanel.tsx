"use client";

import React, { useState, useMemo } from "react";
import { VedicChartData } from "@/lib/astronomy/vedic";
import { calculateDrishtiMatrix, DrishtiMatrixReport, GrahaAspect } from "@/lib/vedic/drishtiEngine";
import { Eye, Compass, Shield, Sparkles, Filter, ChevronRight, Activity } from "lucide-react";

interface DrishtiMatrixPanelProps {
  vedicData: VedicChartData;
  fullName?: string;
}

export function DrishtiMatrixPanel({ vedicData, fullName = "Seeker" }: DrishtiMatrixPanelProps) {
  const [activeTab, setActiveTab] = useState<"graha" | "rashi" | "mutual">("graha");
  const [aspectFilter, setAspectFilter] = useState<"all" | "special" | "benefic" | "malefic">("all");
  const [selectedPlanetFilter, setSelectedPlanetFilter] = useState<string | "all">("all");

  const drishtiReport: DrishtiMatrixReport = useMemo(() => {
    return calculateDrishtiMatrix(vedicData.planets, vedicData.lagna.rasiIndex);
  }, [vedicData]);

  const planetsList = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

  // Filtered Graha Aspects
  const filteredGrahaAspects = useMemo(() => {
    return drishtiReport.grahaAspects.filter((aspect) => {
      if (selectedPlanetFilter !== "all" && aspect.aspectingPlanet !== selectedPlanetFilter) {
        return false;
      }
      if (aspectFilter === "special") {
        return aspect.aspectType.includes("Special");
      }
      if (aspectFilter === "benefic") {
        return aspect.nature === "Benefic";
      }
      if (aspectFilter === "malefic") {
        return aspect.nature === "Malefic";
      }
      return true;
    });
  }, [drishtiReport, aspectFilter, selectedPlanetFilter]);

  return (
    <div className="space-y-6">
      {/* 1. HEADER BANNER */}
      <div className="p-5 md:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Vedic Drishti (Aspects) Matrix
              </span>
              <span className="text-xs text-slate-400">· Parashari & Jaimini Sutras</span>
            </div>
            <h2 className="text-xl md:text-2xl font-serif-celestial font-bold text-slate-100 mt-1">
              Planetary (Graha) & Sign (Rashi) Drishti
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
              Comprehensive evaluation of planetary sight (Graha Drishti with special Parashari full aspects) and Jaimini sign sight (Rashi Drishti) with Virupa strength scores.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("graha")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "graha"
                  ? "bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Graha Drishti (Planets)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("rashi")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "rashi"
                  ? "bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Rashi Drishti (Signs)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mutual")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "mutual"
                  ? "bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Mutual Aspects ({drishtiReport.mutualAspects.length})
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAB CONTENT: PARASHARI GRAHA DRISHTI */}
      {activeTab === "graha" && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Filter:
              </span>
              {(["all", "special", "benefic", "malefic"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setAspectFilter(filter)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer capitalize ${
                    aspectFilter === filter
                      ? "bg-amber-500/20 text-amber-300 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  {filter === "special" ? "Special Aspects (Mars/Jup/Sat)" : filter}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Planet:</span>
              <select
                value={selectedPlanetFilter}
                onChange={(e) => setSelectedPlanetFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">All Planets</option>
                {planetsList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Two-Way Aspect Matrix Grid */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl overflow-x-auto shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                9-Graha Parashari Aspect Matrix (Drishti Pinda / Virupas)
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Full Aspect = 60 Virupas</span>
            </div>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-2 px-2 text-left">From \ To</th>
                  {planetsList.map((target) => (
                    <th key={target} className="py-2 px-2 text-center">
                      {target.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {planetsList.map((source) => {
                  const pSource = vedicData.planets.find((p) => p.name === source);
                  return (
                    <tr key={source} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-2 font-bold text-slate-300 font-sans flex items-center gap-1.5">
                        <span className="text-amber-400">{pSource?.symbol}</span>
                        <span>{source}</span>
                      </td>
                      {planetsList.map((target) => {
                        if (source === target) {
                          return (
                            <td key={target} className="py-2.5 px-2 text-center text-slate-600">
                              —
                            </td>
                          );
                        }

                        const pTarget = vedicData.planets.find((p) => p.name === target);
                        if (!pSource || !pTarget) {
                          return <td key={target} className="text-center text-slate-600">-</td>;
                        }

                        // Check aspect from source to target
                        const aspect = drishtiReport.grahaAspects.find(
                          (a) => a.aspectingPlanet === source && a.aspectedPlanet === target
                        );

                        if (!aspect) {
                          return (
                            <td key={target} className="py-2.5 px-2 text-center text-slate-600">
                              0
                            </td>
                          );
                        }

                        const isFull = aspect.strengthVirupas >= 55;

                        return (
                          <td key={target} className="py-2.5 px-2 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isFull
                                  ? aspect.nature === "Benefic"
                                    ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                                    : "bg-rose-500/25 text-rose-300 border border-rose-500/40"
                                  : "bg-amber-500/15 text-amber-300"
                              }`}
                              title={`${aspect.aspectType}: ${aspect.strengthVirupas} Virupas (${aspect.strengthPercent}%)`}
                            >
                              {aspect.strengthVirupas}v
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards: Detailed Aspect List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredGrahaAspects.slice(0, 15).map((aspect, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl space-y-2 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    {aspect.aspectingPlanet} → {aspect.aspectedPlanet || `House ${aspect.aspectedHouse}`}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      aspect.nature === "Benefic"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {aspect.strengthVirupas} Virupas ({aspect.strengthPercent}%)
                  </span>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Aspect Type:</span>
                    <span className="text-amber-300 font-semibold">{aspect.aspectType}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Target Sign:</span>
                    <span className="text-slate-200">{aspect.aspectedSign} (House {aspect.aspectedHouse})</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{aspect.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: JAIMINI RASHI DRISHTI */}
      {activeTab === "rashi" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Classical Jaimini Sign Aspect Principles (Rashi Drishti)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300 pt-2">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold block">Chara (Movable Signs)</span>
                <p className="text-slate-400 text-[11px]">
                  Aries, Cancer, Libra, Capricorn aspect all Fixed signs EXCEPT the adjacent one.
                </p>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-blue-400 font-bold block">Sthira (Fixed Signs)</span>
                <p className="text-slate-400 text-[11px]">
                  Taurus, Leo, Scorpio, Aquarius aspect all Movable signs EXCEPT the adjacent one.
                </p>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold block">Dwisvabhava (Dual Signs)</span>
                <p className="text-slate-400 text-[11px]">
                  Gemini, Virgo, Sagittarius, Pisces aspect all other Dual signs.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {drishtiReport.rashiDrishtis.map((rd) => (
              <div
                key={rd.signName}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-slate-100">{rd.signName}</h5>
                    <span className="text-[10px] text-slate-400 font-mono">{rd.signSanskrit}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono border border-slate-800">
                    {rd.modality.split(" ")[0]}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Aspected Signs (Rashi Drishti)</span>
                    <p className="text-amber-300 font-semibold mt-0.5">
                      {rd.aspectedSigns.map((as) => as.signName).join(", ")}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Planets in Aspected Signs</span>
                    <p className="text-slate-200 mt-0.5">
                      {rd.aspectedSigns
                        .filter((as) => as.planetsPresent.length > 0)
                        .map((as) => `${as.signName}: ${as.planetsPresent.join(", ")}`)
                        .join(" | ") || "No planets in aspected signs"}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">{rd.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: MUTUAL ASPECTS (PARASPARA DRISHTI) */}
      {activeTab === "mutual" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Paraspara Drishti (Mutual Planetary Sight)
              </h4>
              <p className="text-xs text-slate-400">
                Planets in direct mutual gaze across opposite or special aspectual axes, exchanging planetary energies.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
              {drishtiReport.mutualAspects.length} Mutual Pairs
            </span>
          </div>

          {drishtiReport.mutualAspects.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-950 border border-slate-800 rounded-xl">
              No mutual aspects detected in the chart.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drishtiReport.mutualAspects.map((ma, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold font-serif-celestial text-slate-100">
                      {ma.planet1} ⇄ {ma.planet2}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                        ma.quality.includes("Auspicious")
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : ma.quality.includes("Challenging")
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {ma.quality}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">{ma.planet1}</span>
                      <p className="font-semibold text-slate-200">
                        H{ma.house1} ({ma.sign1})
                      </p>
                      <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">{ma.aspectType1To2}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">{ma.planet2}</span>
                      <p className="font-semibold text-slate-200">
                        H{ma.house2} ({ma.sign2})
                      </p>
                      <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">{ma.aspectType2To1}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{ma.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
