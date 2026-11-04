"use client";

import React, { useState, useMemo } from "react";
import { VedicChartData } from "@/lib/astronomy/vedic";
import {
  evaluateDivisionalYogas,
  DivisionalYogasDossier,
  MasterYogaResult,
} from "@/lib/vedic/masterYogasEngine";
import { DIVISIONAL_CHARTS_CONFIG } from "@/lib/vedic/divisionalCalc";
import {
  Award,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Flame,
  Shield,
  Layers,
  Star,
  Compass,
} from "lucide-react";

interface MasterYogasPanelProps {
  vedicData: VedicChartData;
  fullName?: string;
}

const POPULAR_YOGA_DIVISIONS = [
  { code: "D1", label: "D1 Rasi", tag: "Natal Body & Destiny" },
  { code: "D9", label: "D9 Navamsa", tag: "Soul & Marriage" },
  { code: "D10", label: "D10 Dasamsa", tag: "Career & Status" },
  { code: "D20", label: "D20 Vimsamsa", tag: "Devotion & Upasana" },
  { code: "D2", label: "D2 Hora", tag: "Wealth & Treasury" },
  { code: "D3", label: "D3 Drekkana", tag: "Courage & Siblings" },
  { code: "D7", label: "D7 Saptamsa", tag: "Children & Progeny" },
  { code: "D60", label: "D60 Shashtiamsa", tag: "Past Life Karma" },
];

export function MasterYogasPanel({ vedicData, fullName = "Seeker" }: MasterYogasPanelProps) {
  const [selectedDivision, setSelectedDivision] = useState<string>("D1");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [onlyActive, setOnlyActive] = useState<boolean>(true);
  const [expandedYogaId, setExpandedYogaId] = useState<string | null>(null);

  const dossier: DivisionalYogasDossier = useMemo(() => {
    return evaluateDivisionalYogas(vedicData, selectedDivision);
  }, [vedicData, selectedDivision]);

  const categories = [
    "All",
    "Pancha Mahapurusha",
    "Raja Yoga",
    "Dhana Yoga",
    "Vipareeta Raja Yoga",
    "Neechabhanga Raja Yoga",
    "Lunar Yoga",
    "Solar Yoga",
    "Dosha / Malefic Combination",
    "Jaimini Karaka Yoga",
  ];

  const filteredYogas = useMemo(() => {
    return dossier.yogas.filter((y) => {
      if (onlyActive && !y.isPresent) return false;
      if (selectedCategory !== "All" && y.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = y.name.toLowerCase().includes(query);
        const matchesSanskrit = y.sanskritName.toLowerCase().includes(query);
        const matchesPlanets = y.formativePlanets.some((p) => p.toLowerCase().includes(query));
        const matchesDesc = y.description.toLowerCase().includes(query);
        return matchesName || matchesSanskrit || matchesPlanets || matchesDesc;
      }
      return true;
    });
  }, [dossier, onlyActive, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 0. DIVISIONAL HARMONIC SELECTOR BAR */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-sm font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
              <span>Evaluate Yogas Across Divisional Charts (Vargas)</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {dossier.divisionCode} · {dossier.divisionName}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="yoga-varga-select" className="text-xs text-slate-400 font-medium whitespace-nowrap">
              All 16 Vargas:
            </label>
            <select
              id="yoga-varga-select"
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="bg-slate-900 border border-slate-700 hover:border-amber-500/50 rounded-lg px-2.5 py-1 text-xs text-amber-200 font-medium focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              {Object.entries(DIVISIONAL_CHARTS_CONFIG).map(([code, cfg]) => (
                <option key={code} value={code} className="bg-slate-900 text-slate-200">
                  {code} · {cfg.name} ({cfg.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Varga Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 text-xs">
          {POPULAR_YOGA_DIVISIONS.map((item) => {
            const isSelected = selectedDivision === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => setSelectedDivision(item.code)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-amber-500/25 text-amber-100 border border-amber-500/50 shadow-sm font-semibold ring-1 ring-amber-500/30"
                    : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700"
                }`}
              >
                <span className="font-bold">{item.code}</span>
                <span className="text-[10px] opacity-80">({item.tag})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. GRAND METRICS BANNER */}
      <div className="p-5 md:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border border-amber-500/40 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                60+ Classical Vedic Yogas Engine
              </span>
              <span className="text-xs text-slate-400">· Parashari, Jaimini & Divisional Vargas</span>
            </div>
            <h2 className="text-xl md:text-2xl font-serif-celestial font-bold text-slate-100 mt-1">
              Planetary Yogas in {dossier.divisionName} ({dossier.divisionCode})
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
              {dossier.divisionCode === "D1"
                ? "Rigorous evaluation of Mahapurusha, Raja, Dhana, and Vipareeta Yogas in the natal physical chart alongside 5-rule Neechabhanga cancellations."
                : `Analyzing specialized harmonic formations, Kendra-Trikona Raja Yogas, and dignity dynamics in ${dossier.divisionName}: ${dossier.significance}.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-amber-500/30 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">
                {dossier.divisionCode} Strength
              </span>
              <span className="text-xl font-bold font-serif-celestial text-amber-300">
                {dossier.overallYogaStrengthScore}/100
              </span>
            </div>
          </div>
        </div>

        {/* Vargottama Fortification Banner Card (if active in selected division) */}
        {dossier.vargottamaPlanets && dossier.vargottamaPlanets.length > 0 && (
          <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-950 border border-amber-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-200">
                  {dossier.vargottamaPlanets.length} Vargottama Planet{dossier.vargottamaPlanets.length > 1 ? "s" : ""} Fortified in {dossier.divisionCode}:
                </span>
                <span className="text-xs font-semibold text-slate-100 ml-1.5 font-mono">
                  {dossier.vargottamaPlanets.join(", ")}
                </span>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  Occupying the exact same sign in both D1 Rasi and {dossier.divisionCode}, conferring results equivalent to exalted planetary status (Phaladeepika Ch. 3).
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold text-xs shrink-0 self-start sm:self-auto">
              Supreme Dignity
            </span>
          </div>
        )}

        {/* Quick Tally Badges */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs">
          <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-mono uppercase">
              Active in {dossier.divisionCode}
            </span>
            <span className="text-base font-bold text-slate-100">{dossier.activeCount} Active</span>
          </div>
          <div className="p-2.5 bg-slate-950/80 border border-amber-500/20 rounded-xl">
            <span className="text-[10px] text-amber-400 block font-mono uppercase">Raja Yogas</span>
            <span className="text-base font-bold text-amber-300">{dossier.rajaYogasCount} Formed</span>
          </div>
          <div className="p-2.5 bg-slate-950/80 border border-emerald-500/20 rounded-xl">
            <span className="text-[10px] text-emerald-400 block font-mono uppercase">Dhana (Wealth) Yogas</span>
            <span className="text-base font-bold text-emerald-300">{dossier.dhanaYogasCount} Formed</span>
          </div>
          <div className="p-2.5 bg-slate-950/80 border border-blue-500/20 rounded-xl">
            <span className="text-[10px] text-blue-400 block font-mono uppercase">
              {dossier.divisionCode === "D1" ? "Neechabhanga Status" : "Vargottama Fortified"}
            </span>
            <span className="text-base font-bold text-blue-300">
              {dossier.divisionCode === "D1" ? `${dossier.neechabhangaCount} Active` : `${dossier.vargottamaYogasCount} Planets`}
            </span>
          </div>
          <div className="p-2.5 bg-slate-950/80 border border-purple-500/20 rounded-xl">
            <span className="text-[10px] text-purple-400 block font-mono uppercase">Doshas Evaluated</span>
            <span className="text-base font-bold text-purple-300">{dossier.doshasCount} Tracked</span>
          </div>
        </div>
      </div>

      {/* 2. FILTERS & SEARCH BAR */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by yoga name, Sanskrit title, or planet (e.g., Ruchaka, Gaja Kesari, Jupiter)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>

          {/* Active-only Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-amber-500 focus:ring-0 cursor-pointer"
              />
              <span>Show Active Formations Only</span>
            </label>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. YOGAS LIST / GRID */}
      {filteredYogas.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-950 border border-slate-800 rounded-2xl">
          No planetary yogas matched your active filters or search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredYogas.map((yoga) => {
            const isExpanded = expandedYogaId === yoga.id;

            return (
              <div
                key={yoga.id}
                className={`p-4 rounded-2xl border transition-all shadow-sm ${
                  yoga.isPresent
                    ? yoga.category === "Dosha / Malefic Combination"
                      ? yoga.isCancelled
                        ? "bg-slate-950/90 border-slate-800 hover:border-slate-700"
                        : "bg-purple-950/15 border-purple-500/30 hover:border-purple-500/50"
                      : "bg-slate-950/90 border-slate-800 hover:border-amber-500/40"
                    : "bg-slate-950/40 border-slate-900 opacity-60"
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {yoga.category}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                        {dossier.divisionCode}
                      </span>
                      {yoga.isPresent ? (
                        yoga.isCancelled ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                            Cancelled / Nullified
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Active
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">Inactive</span>
                      )}
                    </div>
                    <h4 className="text-base font-bold font-serif-celestial text-slate-100 mt-1">
                      {yoga.name}
                    </h4>
                    <span className="text-[11px] text-amber-400 font-mono block">{yoga.sanskritName}</span>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg block ${
                        yoga.intensity === "Exalted"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : yoga.intensity === "High"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {yoga.intensity} ({yoga.numericScore}%)
                    </span>
                  </div>
                </div>

                {/* Formative Details */}
                <div className="mt-3 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Planets Involved:</span>
                    <span className="text-slate-200 font-semibold">
                      {yoga.formativePlanets.join(", ") || "None"}
                    </span>
                  </div>
                  {yoga.formativeHouses.length > 0 && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Key Houses:</span>
                      <span className="text-amber-300 font-mono">
                        {yoga.formativeHouses.map((h) => `H${h}`).join(", ")}
                      </span>
                    </div>
                  )}
                  {yoga.cancellationReason && (
                    <div className="pt-1 text-[11px] text-blue-300 border-t border-slate-800">
                      <span className="font-bold">Cancellation Rule:</span> {yoga.cancellationReason}
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-2.5">{yoga.description}</p>

                {/* Expandable Classical Citation & Effects */}
                <button
                  type="button"
                  onClick={() => setExpandedYogaId(isExpanded ? null : yoga.id)}
                  className="mt-3 text-xs text-amber-400/90 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isExpanded ? "Hide Scripture & Effects" : "View Classical Scripture & Effects"}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="mt-2.5 p-3 bg-slate-950 rounded-xl border border-amber-500/20 text-xs space-y-2 animate-in fade-in duration-200">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Classical Citation</span>
                      <p className="text-[11px] text-slate-300 italic leading-relaxed">{yoga.classicalCitation}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Manifested Life Effects</span>
                      <p className="text-[11px] text-amber-200 leading-relaxed">{yoga.effects}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
