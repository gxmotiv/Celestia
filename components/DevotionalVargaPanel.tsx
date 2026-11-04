"use client";

import React, { useState, useMemo } from "react";
import { VedicChartData } from "@/lib/astronomy/vedic";
import {
  calculateDivisionalChart,
  calculateVaisheshikamsa,
  DIVISIONAL_CHARTS_CONFIG,
  DivisionalChartResult,
} from "@/lib/vedic/divisionalCalc";
import { calculateD20DevotionalProfile, D20DevotionalReport } from "@/lib/vedic/vimsamsaDevotionalEngine";
import { VedicKundliChart } from "./VedicKundliChart";
import {
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  Flame,
  Shield,
  Layers,
  ChevronRight,
  Sun,
  Moon,
  Info,
} from "lucide-react";

interface DevotionalVargaPanelProps {
  vedicData: VedicChartData;
  fullName?: string;
}

export function DevotionalVargaPanel({ vedicData, fullName = "Seeker" }: DevotionalVargaPanelProps) {
  const [selectedVargaTab, setSelectedVargaTab] = useState<string>("D20");
  const [activeCategory, setActiveCategory] = useState<"All" | "Basic" | "Secondary" | "Devotional" | "Subtle">("All");

  // Calculate D20 Devotional Profile
  const d20Profile: D20DevotionalReport = useMemo(() => {
    return calculateD20DevotionalProfile(vedicData.planets, vedicData.lagna.siderealLongitude);
  }, [vedicData]);

  // Calculate Vaisheshikamsa ratings across all 16 vargas
  const vaisheshikamsaRanks = useMemo(() => {
    return calculateVaisheshikamsa(vedicData.planets, vedicData.lagna.siderealLongitude);
  }, [vedicData]);

  // Calculate selected divisional chart
  const selectedChart: DivisionalChartResult = useMemo(() => {
    return calculateDivisionalChart(vedicData.planets, vedicData.lagna.siderealLongitude, selectedVargaTab);
  }, [vedicData, selectedVargaTab]);

  const vargaEntries = Object.entries(DIVISIONAL_CHARTS_CONFIG).filter(([_, config]) => {
    if (activeCategory === "All") return true;
    return config.category === activeCategory;
  });

  return (
    <div className="space-y-6">
      {/* 1. HEADER BANNER */}
      <div className="p-5 md:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Vedic Shodashavarga & Devotional Suite
              </span>
              <span className="text-xs text-slate-400">· 16 Classical Harmonic Divisions</span>
            </div>
            <h2 className="text-xl md:text-2xl font-serif-celestial font-bold text-slate-100 mt-1">
              Divisional Vargas & D20 Spiritual Devotion
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
              Explore the micro-destinies encoded in Parashari divisional harmonics, featuring dedicated Upasana, Ishta Devata, and career throne evaluations.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedVargaTab("D20")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedVargaTab === "D20"
                  ? "bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm"
                  : "bg-slate-900/60 text-slate-300 border border-slate-800 hover:bg-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>D20 Devotional Upasana</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedVargaTab("D10")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedVargaTab === "D10"
                  ? "bg-blue-500/25 text-blue-200 border border-blue-500/40 shadow-sm"
                  : "bg-slate-900/60 text-slate-300 border border-slate-800 hover:bg-slate-800"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              <span>D10 Dasamsa Career</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(["All", "Basic", "Secondary", "Devotional", "Subtle"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              {cat === "Devotional" ? "Devotional (D20)" : cat}
            </button>
          ))}
        </div>

        {/* Shodashavarga Grid Selector */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {vargaEntries.map(([code, config]) => (
            <button
              key={code}
              type="button"
              onClick={() => setSelectedVargaTab(code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedVargaTab === code
                  ? "bg-amber-500/30 text-amber-100 border border-amber-400/50 shadow-sm font-semibold"
                  : "bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <span className="font-mono font-bold text-amber-400/90">{code}</span>
              <span>{config.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. D20 DEVOTIONAL & UPASANA DOSSIER (FEATURED WHEN D20 IS ACTIVE) */}
      {selectedVargaTab === "D20" && (
        <div className="space-y-4">
          <div className="p-5 bg-gradient-to-br from-amber-950/20 via-slate-950 to-slate-900 border border-amber-500/30 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  Bhakti & Upasana Sthana (20th Harmonic)
                </span>
                <h3 className="text-lg font-serif-celestial font-bold text-slate-100 mt-0.5">
                  D20 Vimsamsa Devotional Blueprint
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                  Bhakti Bhava: {d20Profile.bhaktiBhava.name}
                </span>
              </div>
            </div>

            {/* Sacred Trinity Cards: Ishta, Dharma, and Palana Devatas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Ishta Devata */}
              <div className="p-4 bg-slate-950/90 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Liberating Divinity</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 font-bold">Ishta Devata</span>
                </div>
                <h4 className="text-base font-bold font-serif-celestial text-slate-100">{d20Profile.ishtaDevata.deityName}</h4>
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                  <p className="text-[11px] font-mono text-amber-300">{d20Profile.ishtaDevata.sanskritName}</p>
                  <p className="text-[11px] text-slate-400">{d20Profile.ishtaDevata.bhaktiPath}</p>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed italic">{d20Profile.ishtaDevata.scriptureBasis}</p>
              </div>

              {/* Dharma Devata */}
              <div className="p-4 bg-slate-950/90 border border-blue-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-blue-400 font-bold">Righteous Guide</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 font-bold">Dharma Devata</span>
                </div>
                <h4 className="text-base font-bold font-serif-celestial text-slate-100">{d20Profile.dharmaDevata.deityName}</h4>
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                  <p className="text-[11px] font-mono text-blue-300">{d20Profile.dharmaDevata.sanskritName}</p>
                  <p className="text-[11px] text-slate-400">{d20Profile.dharmaDevata.bhaktiPath}</p>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed italic">{d20Profile.dharmaDevata.scriptureBasis}</p>
              </div>

              {/* Palana Devata */}
              <div className="p-4 bg-slate-950/90 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Sustaining Grace</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 font-bold">Palana Devata</span>
                </div>
                <h4 className="text-base font-bold font-serif-celestial text-slate-100">{d20Profile.palanaDevata.deityName}</h4>
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                  <p className="text-[11px] font-mono text-emerald-300">{d20Profile.palanaDevata.sanskritName}</p>
                  <p className="text-[11px] text-slate-400">{d20Profile.palanaDevata.bhaktiPath}</p>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed italic">{d20Profile.palanaDevata.scriptureBasis}</p>
              </div>
            </div>

            {/* Presiding Canonical Vimsamsa Deities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    Ascendant Vimsamsa Deity:
                  </span>
                  <span className="font-semibold text-amber-300">{d20Profile.ascendantDeity.deityName}</span>
                </div>
                <p className="text-[11px] text-slate-400">{d20Profile.ascendantDeity.significance}</p>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-slate-300" />
                    Chandra Vimsamsa Deity:
                  </span>
                  <span className="font-semibold text-amber-300">{d20Profile.moonDeity.deityName}</span>
                </div>
                <p className="text-[11px] text-slate-400">{d20Profile.moonDeity.significance}</p>
              </div>
            </div>

            {/* Upasana Protocols */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 text-xs">
              <h5 className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Prescribed Upasana & Meditation Protocol
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Sacred Timing</span>
                  <p className="text-slate-200 font-medium">{d20Profile.upasanaGuidance.sacredTime}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Recommended Direction</span>
                  <p className="text-slate-200 font-medium">Facing {d20Profile.upasanaGuidance.direction}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Altar Sanctification</span>
                  <p className="text-slate-300 text-[11px]">{d20Profile.upasanaGuidance.altarElements.join(", ")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. D10 DASAMSA CAREER MATRIX (FEATURED WHEN D10 IS ACTIVE) */}
      {selectedVargaTab === "D10" && (
        <div className="p-5 bg-gradient-to-br from-blue-950/20 via-slate-950 to-slate-900 border border-blue-500/30 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold block">
                Executive & Professional Throne (10th Harmonic)
              </span>
              <h3 className="text-lg font-serif-celestial font-bold text-slate-100 mt-0.5">
                D10 Dasamsa Career & Authority Matrix
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 text-xs font-mono font-bold">
              D10 Lagna: {selectedChart.ascendant.sign}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">10th House Lord in D10</span>
              <p className="text-sm font-bold text-blue-300">
                {selectedChart.houses[9]?.signName || "Aries"}
              </p>
              <p className="text-[11px] text-slate-400">Governs ultimate career zenith, executive reputation, and public legacy.</p>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Planets in D10 Kendras</span>
              <p className="text-sm font-bold text-slate-200">
                {selectedChart.planets.filter((p) => [1, 4, 7, 10].includes(p.house)).map((p) => p.name).join(", ") || "Quiet Kendras"}
              </p>
              <p className="text-[11px] text-slate-400">Planets in 1, 4, 7, 10 propel rapid career acceleration and high visibility.</p>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Exalted Planets in D10</span>
              <p className="text-sm font-bold text-emerald-300">
                {selectedChart.planets.filter((p) => p.dignity === "Exalted").map((p) => p.name).join(", ") || "Standard Dignities"}
              </p>
              <p className="text-[11px] text-slate-400">Indicates unshakeable professional authority and enduring recognition.</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. CURRENT SELECTED DIVISIONAL CHART VIEW */}
      <div className="space-y-3">
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold text-slate-100 font-serif-celestial text-sm">
              {DIVISIONAL_CHARTS_CONFIG[selectedVargaTab]?.name || selectedVargaTab} ({selectedVargaTab})
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              · {DIVISIONAL_CHARTS_CONFIG[selectedVargaTab]?.significance}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-[11px]">
            Lagna: {selectedChart.ascendant.sign}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <VedicKundliChart
              key={selectedVargaTab}
              vedicData={vedicData}
              initialDivision={selectedVargaTab}
              initialStyle="NorthIndian"
              onDivisionChange={(div) => setSelectedVargaTab(div)}
            />
          </div>

        {/* VAISHESHIKAMSA STRENGTH RANKINGS (COL 3) */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Vaisheshikamsa Strengths
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">16-Varga Test</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Classical measure of planetary power when posited in own or exalted signs across divisional charts (Parijata to Brahmaloka).
            </p>

            <div className="space-y-2.5">
              {vaisheshikamsaRanks.map((item) => (
                <div
                  key={item.planet}
                  className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{item.planet}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        item.favorableCount >= 4
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold"
                          : item.favorableCount >= 2
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.favorableCount} Vargas · {item.rankSanskrit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-amber-300 font-semibold">{item.rankName}</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {item.favorableVargas.join(", ") || "None"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{item.significance}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
