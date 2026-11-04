"use client";

import React, { useState } from "react";
import { D9Chart, NavamsaPosition } from "@/lib/vedic/d9NavamsaEngine";
import {
  Sparkles,
  Heart,
  Compass,
  Award,
  ShieldCheck,
  Flame,
  Layers,
  ChevronRight,
  Eye,
  Info,
  Calendar,
  Star,
  Users,
} from "lucide-react";

interface D9ChartComponentProps {
  d9Chart: D9Chart;
}

export function D9ChartComponent({ d9Chart }: D9ChartComponentProps) {
  const [chartStyle, setChartStyle] = useState<"NorthIndian" | "SouthIndian">("NorthIndian");
  const [selectedPlanet, setSelectedPlanet] = useState<NavamsaPosition>(
    d9Chart.planets["Sun"] || Object.values(d9Chart.planets)[0]
  );
  const [activeTab, setActiveTab] = useState<"overview" | "planets" | "marriage" | "spiritual">("overview");

  // Helper for North Indian Diamond Kundli coordinates
  const getHousePlanets = (houseNum: number) => {
    return d9Chart.houses[houseNum]?.planets || [];
  };

  const getHouseSign = (houseNum: number) => {
    return d9Chart.houses[houseNum]?.signName || "";
  };

  const getHouseSignSanskrit = (houseNum: number) => {
    return d9Chart.houses[houseNum]?.signSanskrit || "";
  };

  // Dignity badge helper
  const getDignityBadge = (pos: NavamsaPosition) => {
    if (pos.vargottama) {
      return (
        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Vargottama
        </span>
      );
    }
    if (pos.dignity === "Exalted") {
      return (
        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
          Uchha (Exalted)
        </span>
      );
    }
    if (pos.dignity === "Own Sign") {
      return (
        <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/40">
          Swakshetra (Own)
        </span>
      );
    }
    if (pos.dignity === "Debilitated") {
      return (
        <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/40">
          Neecha (Debilitated)
        </span>
      );
    }
    return (
      <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
        {pos.dignity}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and View Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs font-serif">
              D9
            </span>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Navamsa Kundli (D9 Chart)
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-medium border border-slate-700">
              Score: {d9Chart.analysis.overallStrengthScore}/100
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            The Soul&apos;s Subtle Fruit (Phala) · Marriage, Life Partner, Dharma Destiny & Second Half of Life
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
          {[
            { id: "overview", label: "Overview & Wheel" },
            { id: "planets", label: `Planets (${Object.keys(d9Chart.planets).length})` },
            { id: "marriage", label: "Marriage & 7th House" },
            { id: "spiritual", label: "Spiritual Path & Ishta" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-amber-500/20 text-amber-300 font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & CHART WHEEL */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* SVG Kundli Wheel (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center p-5 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl space-y-4">
              <div className="w-full flex items-center justify-between px-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  D9 Navamsa Chakra
                </span>

                {/* Style toggle */}
                <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setChartStyle("NorthIndian")}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      chartStyle === "NorthIndian"
                        ? "bg-amber-500/20 text-amber-300 font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    North Indian (Diamond)
                  </button>
                  <button
                    onClick={() => setChartStyle("SouthIndian")}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      chartStyle === "SouthIndian"
                        ? "bg-amber-500/20 text-amber-300 font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    South Indian (Square)
                  </button>
                </div>
              </div>

              {/* Chart SVG */}
              <div className="w-full max-w-[440px] aspect-square relative select-none">
                {chartStyle === "NorthIndian" ? (
                  /* North Indian Diamond Kundli */
                  <svg suppressHydrationWarning viewBox="0 0 400 400" className="w-full h-full font-sans">
                    <rect x="10" y="10" width="380" height="380" fill="#090b10" stroke="#334155" strokeWidth="2" />
                    <line x1="10" y1="10" x2="390" y2="390" stroke="#334155" strokeWidth="1.5" />
                    <line x1="10" y1="390" x2="390" y2="10" stroke="#334155" strokeWidth="1.5" />
                    <polygon points="200,10 390,200 200,390 10,200" fill="none" stroke="#f59e0b" strokeWidth="1.5" />

                    {/* House labels & planets */}
                    {[
                      { h: 1, x: 200, y: 100 },
                      { h: 2, x: 100, y: 55 },
                      { h: 3, x: 55, y: 100 },
                      { h: 4, x: 100, y: 200 },
                      { h: 5, x: 55, y: 300 },
                      { h: 6, x: 100, y: 345 },
                      { h: 7, x: 200, y: 300 },
                      { h: 8, x: 300, y: 345 },
                      { h: 9, x: 345, y: 300 },
                      { h: 10, x: 300, y: 200 },
                      { h: 11, x: 345, y: 100 },
                      { h: 12, x: 300, y: 55 },
                    ].map((pos) => {
                      const planets = getHousePlanets(pos.h);
                      const signName = getHouseSign(pos.h);
                      const signIndex = d9Chart.houses[pos.h]?.signIndex ?? 0;
                      return (
                        <g key={pos.h}>
                          {/* Sign index number */}
                          <text
                            x={pos.x}
                            y={pos.y - 12}
                            fill="#64748b"
                            fontSize="9"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            {signIndex + 1}
                          </text>

                          {/* House number */}
                          <text
                            x={pos.x}
                            y={pos.y - 2}
                            fill="#94a3b8"
                            fontSize="8"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            H{pos.h}
                          </text>

                          {/* Resident planets */}
                          {planets.length > 0 ? (
                            <text
                              x={pos.x}
                              y={pos.y + 12}
                              fill="#fbbf24"
                              fontSize="10"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {planets.map((p) => p.symbol).join(" ")}
                            </text>
                          ) : (
                            <text
                              x={pos.x}
                              y={pos.y + 11}
                              fill="#334155"
                              fontSize="8"
                              textAnchor="middle"
                            >
                              {signName.slice(0, 3)}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                ) : (
                  /* South Indian Square Kundli */
                  <svg suppressHydrationWarning viewBox="0 0 400 400" className="w-full h-full font-sans">
                    <rect x="10" y="10" width="380" height="380" fill="#090b10" stroke="#334155" strokeWidth="2" />
                    <line x1="105" y1="10" x2="105" y2="390" stroke="#334155" strokeWidth="1" />
                    <line x1="200" y1="10" x2="200" y2="390" stroke="#334155" strokeWidth="1" />
                    <line x1="295" y1="10" x2="295" y2="390" stroke="#334155" strokeWidth="1" />
                    <line x1="10" y1="105" x2="390" y2="105" stroke="#334155" strokeWidth="1" />
                    <line x1="10" y1="200" x2="390" y2="200" stroke="#334155" strokeWidth="1" />
                    <line x1="10" y1="295" x2="390" y2="295" stroke="#334155" strokeWidth="1" />
                    <rect x="105" y="105" width="190" height="190" fill="#05070a" stroke="#f59e0b" strokeWidth="1" />

                    <text x="200" y="195" fill="#f59e0b" fontSize="12" fontWeight="bold" textAnchor="middle">
                      NAVAMSA (D9)
                    </text>
                    <text x="200" y="215" fill="#94a3b8" fontSize="9" textAnchor="middle">
                      Lagna: {d9Chart.ascendant.sign}
                    </text>

                    {/* South Indian 12 Rasis */}
                    {[
                      { rasi: 11, x: 57, y: 57 }, // Pisces
                      { rasi: 0, x: 152, y: 57 }, // Aries
                      { rasi: 1, x: 247, y: 57 }, // Taurus
                      { rasi: 2, x: 342, y: 57 }, // Gemini
                      { rasi: 10, x: 57, y: 152 }, // Aquarius
                      { rasi: 3, x: 342, y: 152 }, // Cancer
                      { rasi: 9, x: 57, y: 247 }, // Capricorn
                      { rasi: 4, x: 342, y: 247 }, // Leo
                      { rasi: 8, x: 57, y: 342 }, // Sag
                      { rasi: 7, x: 152, y: 342 }, // Scorpio
                      { rasi: 6, x: 247, y: 342 }, // Libra
                      { rasi: 5, x: 342, y: 342 }, // Virgo
                    ].map((pos) => {
                      const planetsInRasi = Object.values(d9Chart.planets).filter(
                        (p) => p.signIndex === pos.rasi
                      );
                      const isLagna = d9Chart.ascendant.signIndex === pos.rasi;

                      return (
                        <g key={pos.rasi}>
                          {isLagna && (
                            <text x={pos.x} y={pos.y - 18} fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">
                              [LAGNA]
                            </text>
                          )}
                          <text x={pos.x} y={pos.y} fill="#fbbf24" fontSize="11" fontWeight="bold" textAnchor="middle">
                            {planetsInRasi.map((p) => p.symbol).join(" ")}
                          </text>
                          <text x={pos.x} y={pos.y + 16} fill="#64748b" fontSize="8" textAnchor="middle">
                            {d9Chart.houses[Object.values(d9Chart.houses).find((h) => h.signIndex === pos.rasi)?.house || 1]?.signName.slice(0, 3)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                D9 Ascendant: <strong className="text-amber-300">{d9Chart.ascendant.sign}</strong> ({d9Chart.ascendant.signSanskrit}) at {d9Chart.ascendant.degreeFormatted}
              </p>
            </div>

            {/* Quick Highlights & Core Pillars (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Vargottama Banner */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    Vargottama Planets (Superior Strength)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
                    {d9Chart.analysis.vargottamaPlanets.length}
                  </span>
                </div>

                {d9Chart.analysis.vargottamaPlanets.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No planets occupy identical Rasi and Navamsa signs. Strength is distributed through dignity and divisional padas.
                  </p>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {d9Chart.analysis.vargottamaPlanets.map((p) => (
                      <div
                        key={p.planetName}
                        onClick={() => {
                          setSelectedPlanet(p);
                          setActiveTab("planets");
                        }}
                        className="p-2 bg-slate-950/60 rounded-lg border border-amber-500/20 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 font-bold">{p.symbol}</span>
                          <span className="text-xs font-semibold text-slate-200">{p.planetName}</span>
                          <span className="text-[10px] text-slate-400">in {p.sign}</span>
                        </div>
                        <span className="text-[10px] text-amber-300 font-mono font-bold">
                          {p.strength.score}/100 Power
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pushkara Navamsa Banner */}
              {d9Chart.analysis.pushkaraPlanets.length > 0 && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Pushkara Navamsas (Sacred Rejuvenation)
                  </span>
                  <p className="text-xs text-slate-300">
                    {d9Chart.analysis.pushkaraPlanets.map((p) => p.planetName).join(", ")} reside in sacred Pushkara divisions that heal karma and bestow enduring good fortune.
                  </p>
                </div>
              )}

              {/* Marriage & Dharma Quick Summaries */}
              <div
                onClick={() => setActiveTab("marriage")}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1 cursor-pointer hover:bg-rose-500/15 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    Marriage Compatibility Rating
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-200">
                    {d9Chart.marriageIndicators.relationshipCompatibilityScore}%
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-snug line-clamp-2">
                  {d9Chart.marriageIndicators.venusStrength}
                </p>
                <span className="text-[10px] text-rose-300/80 flex items-center gap-0.5 pt-1">
                  Explore full partnership breakdown <ChevronRight className="w-3 h-3" />
                </span>
              </div>

              <div
                onClick={() => setActiveTab("spiritual")}
                className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1 cursor-pointer hover:bg-purple-500/15 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    Karakamsha (Soul&apos;s Liberation)
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-200">
                    {d9Chart.spiritualPath.karakamshaLagna.atmakarakaPlanet} in {d9Chart.spiritualPath.karakamshaLagna.sign}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-snug line-clamp-2">
                  Ishta Devata: <strong>{d9Chart.spiritualPath.ishtaDevata.deityName}</strong> ({d9Chart.spiritualPath.ishtaDevata.rulingPlanet})
                </p>
                <span className="text-[10px] text-purple-300/80 flex items-center gap-0.5 pt-1">
                  Explore spiritual path & mantras <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* 12 D9 Houses Grid */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                12 Navamsa House Placements (Whole Sign Framework)
              </h4>
              <span className="text-[11px] text-slate-400">
                1st House = {d9Chart.ascendant.sign} ({d9Chart.ascendant.signSanskrit})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
              {Object.values(d9Chart.houses).map((h) => (
                <div
                  key={h.house}
                  className={`p-3 rounded-lg border flex flex-col justify-between space-y-1.5 transition-all ${
                    h.condition === "Fortified"
                      ? "bg-amber-500/10 border-amber-500/40"
                      : h.condition === "Harmonious"
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : h.condition === "Challenged"
                      ? "bg-rose-500/10 border-rose-500/30"
                      : "bg-slate-950/70 border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">House {h.house}</span>
                    <span className="text-[10px] font-mono text-slate-400">{h.signName}</span>
                  </div>

                  <div className="min-h-[22px] flex items-center gap-1 font-bold text-sm text-amber-300">
                    {h.planets.length > 0 ? (
                      h.planets.map((p) => (
                        <span key={p.planetName} title={p.planetName}>
                          {p.symbol}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-600 font-normal">Empty</span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 truncate">
                    Lord: {h.lord}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED PLANET-WISE ANALYSIS */}
      {activeTab === "planets" && (
        <div className="space-y-6">
          {/* Active Selected Planet Spotlight */}
          {selectedPlanet && (
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl text-amber-400 font-bold">{selectedPlanet.symbol}</span>
                  <div>
                    <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      {selectedPlanet.planetName} in {selectedPlanet.sign} Navamsa
                      {getDignityBadge(selectedPlanet)}
                    </h4>
                    <p className="text-xs text-amber-300/80">
                      House {selectedPlanet.house} of D9 · Pada {selectedPlanet.navamsaNumber} ({selectedPlanet.element} Sign)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-slate-300 block">
                    D9 Degree: {selectedPlanet.degreeFormatted}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    D1 Origin: {selectedPlanet.originalDegreeFormatted}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                <div className="space-y-2">
                  <strong className="text-slate-300 block font-semibold">Core Navamsa Influence:</strong>
                  <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {selectedPlanet.interpretation}
                  </p>
                </div>

                <div className="space-y-2">
                  <strong className="text-slate-300 block font-semibold">Relational & Spiritual Nuance:</strong>
                  <div className="space-y-1.5 text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <p>• {selectedPlanet.relationshipSignificance}</p>
                    <p>• {selectedPlanet.spiritualSignificance}</p>
                  </div>
                </div>
              </div>

              {/* Strength factors list */}
              <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-300">Dignity Factors:</span>
                {selectedPlanet.strength.factors.map((f, fi) => (
                  <span key={fi} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Grid of all planets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(d9Chart.planets).map(([name, pos]) => {
              const isSelected = selectedPlanet?.planetName === name;
              return (
                <div
                  key={name}
                  onClick={() => setSelectedPlanet(pos)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? "bg-slate-900 border-amber-500 ring-1 ring-amber-500/40 shadow-lg"
                      : "bg-slate-950/70 border-slate-800 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base text-amber-400 font-bold">{pos.symbol}</span>
                        <h4 className="font-bold text-sm text-slate-100">{name}</h4>
                      </div>
                      <span className="text-xs text-amber-300 font-medium mt-0.5 block">
                        {pos.sign}
                      </span>
                    </div>
                    {getDignityBadge(pos)}
                  </div>

                  <div className="space-y-1 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>D9 House:</span>
                      <strong className="text-slate-200">House {pos.house}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Navamsa Pada:</span>
                      <strong className="text-slate-200">Pada {pos.navamsaNumber} of 9</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Original D1:</span>
                      <span className="text-slate-300 font-mono text-[11px]">{pos.originalSign.slice(0, 3)} {Math.floor(pos.originalDegree)}°</span>
                    </div>
                  </div>

                  {/* Power Bar */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-500">Power Rating</span>
                      <span className="text-amber-300 font-bold">{pos.strength.score}/100</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${pos.strength.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MARRIAGE & PARTNERSHIPS ANALYSIS */}
      {activeTab === "marriage" && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="p-5 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                D9 Marriage, Partnerships & Relationship Karma
              </span>
              <span className="px-3 py-1 bg-rose-500/20 text-rose-200 border border-rose-500/30 rounded-full font-mono text-xs font-bold">
                Compatibility Index: {d9Chart.marriageIndicators.relationshipCompatibilityScore}%
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In classical Vedic Jyotish, the Rasi chart (D1) represents the tree, but the Navamsa (D9) reveals the actual fruit. The 7th house and Venus in D9 describe the emotional reality, temperament, and mutual destiny of your committed partnerships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Venus Condition Card */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Venus (Shukra) Condition in Navamsa
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {d9Chart.marriageIndicators.venusStrength}
              </p>
            </div>

            {/* Jupiter Blessing Card */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Jupiter (Guru) Grace & Moral Counsel
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {d9Chart.marriageIndicators.jupiterBlessing}
              </p>
            </div>

            {/* Partner Characteristics */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Spouse & Life Partner Archetype
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {d9Chart.marriageIndicators.partnerCharacteristics}
              </p>
            </div>

            {/* 7th House Dynamics & Challenges */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                7th House Condition & Karmic Checkpoints
              </h4>
              <div className="space-y-2 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <p>• {d9Chart.marriageIndicators.seventhHouseCondition}</p>
                <p>• <strong>Caution:</strong> {d9Chart.marriageIndicators.challenges}</p>
              </div>
            </div>
          </div>

          {/* Timing & Lessons */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Marriage Timing & Key Relational Lessons
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {d9Chart.marriageIndicators.marriageTiming}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              {d9Chart.marriageIndicators.karmicLessons.map((l, idx) => (
                <div key={idx} className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg text-slate-300">
                  <span className="font-bold text-amber-400 block mb-1">Lesson {idx + 1}</span>
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SPIRITUAL PATH & ISHTA DEVATA */}
      {activeTab === "spiritual" && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="p-5 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-400" />
                Dharma Destiny, Karakamsha & Ishta Devata
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-200 border border-purple-500/30 rounded-full font-mono text-xs font-bold">
                Moksha Gateway
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {d9Chart.spiritualPath.pathSummary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Karakamsha Card */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  Karakamsha Lagna (Soul&apos;s Anchor)
                </h4>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {d9Chart.spiritualPath.karakamshaLagna.sign} (House {d9Chart.spiritualPath.karakamshaLagna.houseInD9})
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {d9Chart.spiritualPath.karakamshaLagna.meaning}
              </p>
            </div>

            {/* Ishta Devata Card */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ishta Devata (Chosen Divinity)
                </h4>
                <span className="text-xs font-mono font-bold text-purple-300">
                  12th from Karakamsha: {d9Chart.spiritualPath.ishtaDevata.sign}
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  Governed by <strong>{d9Chart.spiritualPath.ishtaDevata.rulingPlanet}</strong>: Divinity manifested as <strong className="text-amber-300">{d9Chart.spiritualPath.ishtaDevata.deityName}</strong>.
                </p>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-purple-500/20 text-center font-mono font-bold text-purple-200">
                  {d9Chart.spiritualPath.ishtaDevata.mantra}
                </div>
                <p className="text-slate-400 text-[11px]">
                  {d9Chart.spiritualPath.ishtaDevata.guidance}
                </p>
              </div>
            </div>
          </div>

          {/* Spiritual Remedies */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Prescribed Soul Remedies (Sadhana)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {d9Chart.spiritualPath.spiritualRemedies.map((rem, idx) => (
                <div key={idx} className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg text-slate-300">
                  <strong className="text-emerald-400 block mb-1">Practice {idx + 1}</strong>
                  {rem}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
