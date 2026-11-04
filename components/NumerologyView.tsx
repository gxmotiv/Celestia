"use client";

import React, { useState, useMemo } from "react";
import { NumerologyProfile } from "@/lib/astronomy/numerology";
import { CHALDEAN_COMPOUND_DATABASE } from "@/lib/numerology/chaldean";
import {
  Sparkles,
  Hash,
  Compass,
  Layers,
  Heart,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Copy,
  Check,
  Zap,
  Globe,
  Star,
  Activity,
  Award,
} from "lucide-react";

interface NumerologyViewProps {
  numerologyData: NumerologyProfile;
  fullName: string;
}

type NumerologySystemTab =
  | "pythagorean"
  | "vedic"
  | "chaldean"
  | "loshu"
  | "kabbalah"
  | "tamil"
  | "synthesis";

export function NumerologyView({ numerologyData, fullName }: NumerologyViewProps) {
  const [activeTab, setActiveTab] = useState<NumerologySystemTab>("pythagorean");
  const [copiedMantra, setCopiedMantra] = useState(false);
  const [compoundSearchQuery, setCompoundSearchQuery] = useState("");
  const [selectedCompoundNum, setSelectedCompoundNum] = useState<number | null>(null);

  const report = numerologyData.completeReport;
  const isMaster = (n: number) => n === 11 || n === 22 || n === 33;

  const handleCopyMantra = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMantra(true);
    setTimeout(() => setCopiedMantra(false), 2000);
  };

  // Chaldean compound database list for the explorer
  const compoundList = useMemo(() => {
    const list = Object.values(CHALDEAN_COMPOUND_DATABASE);
    if (!compoundSearchQuery.trim()) return list;
    const q = compoundSearchQuery.toLowerCase();
    return list.filter(
      (c) =>
        c.number.toString().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.nature.toLowerCase().includes(q) ||
        c.fortuneCategory.toLowerCase().includes(q)
    );
  }, [compoundSearchQuery]);

  return (
    <div className="space-y-8">
      {/* Top Multi-System Selector Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("pythagorean")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "pythagorean"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-amber-400" />
            <span>Pythagorean (14 Numbers)</span>
          </button>

          <button
            onClick={() => setActiveTab("vedic")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "vedic"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <span className="text-amber-400 font-serif">🕉️</span>
            <span>Indian Vedic & Remedies</span>
          </button>

          <button
            onClick={() => setActiveTab("chaldean")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "chaldean"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>Chaldean (10–52)</span>
          </button>

          <button
            onClick={() => setActiveTab("loshu")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "loshu"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Chinese Lo Shu Grid</span>
          </button>

          <button
            onClick={() => setActiveTab("kabbalah")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "kabbalah"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Kabbalah Tree of Life</span>
          </button>

          <button
            onClick={() => setActiveTab("tamil")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "tamil"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <span className="text-amber-400 font-serif">🪔</span>
            <span>Tamil En Kaniyam</span>
          </button>

          <button
            onClick={() => setActiveTab("synthesis")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "synthesis"
                ? "bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-amber-200 border border-amber-400/50 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Cross-System Matrix</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PYTHAGOREAN SYSTEM VIEW (ALL 14 NUMBERS) */}
      {/* ========================================================================= */}
      {activeTab === "pythagorean" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                <Hash className="w-5 h-5 text-amber-400" />
                Pythagorean Numerology: All 14 Sacred Vibrations
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete classical spectrum including Core Numbers, 4 Pinnacles, 4 Challenges, Karmic Lessons, Hidden Passion, Balance Number, and 4 Planes of Expression.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              <span>Personal Year:</span>
              <strong className="text-slate-100">{report.pythagorean.personalYearNumber} ({report.pythagorean.currentYear})</strong>
            </div>
          </div>

          {/* 1. Core Vibrational Numbers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Life Path */}
            <div className="p-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-xl relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 p-3 opacity-10 font-serif-celestial text-7xl font-bold text-amber-400 select-none">
                {report.pythagorean.lifePathNumber}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Life Path
                </span>
                {report.pythagorean.isMasterLifePath && (
                  <span className="text-[10px] font-bold text-amber-950 bg-amber-400 px-2 py-0.5 rounded-full shadow">
                    Master
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-serif-celestial font-bold text-slate-100">
                  {report.pythagorean.lifePathNumber}
                </span>
                <span className="text-xs font-medium text-amber-300 truncate">
                  {report.pythagorean.detailedInterpretations.lifePath.archetype}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mb-2">
                {report.pythagorean.lifePathRaw}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {report.pythagorean.detailedInterpretations.lifePath.description}
              </p>
            </div>

            {/* Expression */}
            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 p-3 opacity-10 font-serif-celestial text-7xl font-bold text-slate-400 select-none">
                {report.pythagorean.expressionNumber}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Expression / Destiny
                </span>
                {report.pythagorean.isMasterExpression && (
                  <span className="text-[10px] font-bold text-amber-950 bg-amber-400 px-2 py-0.5 rounded-full">
                    Master
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-serif-celestial font-bold text-slate-100">
                  {report.pythagorean.expressionNumber}
                </span>
                <span className="text-xs font-medium text-slate-300 truncate">
                  {report.pythagorean.detailedInterpretations.expression.archetype}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Derived from full birth name
              </p>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {report.pythagorean.detailedInterpretations.expression.description}
              </p>
            </div>

            {/* Soul Urge */}
            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 p-3 opacity-10 font-serif-celestial text-7xl font-bold text-slate-400 select-none">
                {report.pythagorean.soulUrgeNumber}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Soul Urge
                </span>
                {report.pythagorean.isMasterSoulUrge && (
                  <span className="text-[10px] font-bold text-amber-950 bg-amber-400 px-2 py-0.5 rounded-full">
                    Master
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-serif-celestial font-bold text-slate-100">
                  {report.pythagorean.soulUrgeNumber}
                </span>
                <span className="text-xs font-medium text-slate-300 truncate">
                  {report.pythagorean.detailedInterpretations.soulUrge.archetype}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Heart&apos;s desire from vowels
              </p>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {report.pythagorean.detailedInterpretations.soulUrge.description}
              </p>
            </div>

            {/* Personality */}
            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 p-3 opacity-10 font-serif-celestial text-7xl font-bold text-slate-400 select-none">
                {report.pythagorean.personalityNumber}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Personality
                </span>
                {report.pythagorean.isMasterPersonality && (
                  <span className="text-[10px] font-bold text-amber-950 bg-amber-400 px-2 py-0.5 rounded-full">
                    Master
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-serif-celestial font-bold text-slate-100">
                  {report.pythagorean.personalityNumber}
                </span>
                <span className="text-xs font-medium text-slate-300 truncate">
                  {report.pythagorean.detailedInterpretations.personality.archetype}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Outer persona from consonants
              </p>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {report.pythagorean.detailedInterpretations.personality.description}
              </p>
            </div>

            {/* Birthday Number */}
            <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Birthday Number</span>
                <span className="font-mono text-amber-400">Day of Month</span>
              </div>
              <div className="text-2xl font-serif-celestial font-bold text-slate-100 mb-1">
                {report.pythagorean.birthdayNumber}
              </div>
              <p className="text-xs text-slate-400">
                Special natal talent and sub-vibration gifted at inception.
              </p>
            </div>

            {/* Maturity Number */}
            <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Maturity Number</span>
                <span className="font-mono text-amber-400">LP + Expression</span>
              </div>
              <div className="text-2xl font-serif-celestial font-bold text-slate-100 mb-1">
                {report.pythagorean.maturityNumber}
              </div>
              <p className="text-xs text-slate-400">
                {report.pythagorean.detailedInterpretations.maturity.theme}
              </p>
            </div>

            {/* Attitude / Sun Number */}
            <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Attitude / Sun Number</span>
                <span className="font-mono text-amber-400">Month + Day</span>
              </div>
              <div className="text-2xl font-serif-celestial font-bold text-slate-100 mb-1">
                {report.pythagorean.attitudeNumber}
              </div>
              <p className="text-xs text-slate-400">
                {report.pythagorean.detailedInterpretations.attitude.theme}
              </p>
            </div>

            {/* Balance Number */}
            <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Balance Number</span>
                <span className="font-mono text-amber-400">Initials</span>
              </div>
              <div className="text-2xl font-serif-celestial font-bold text-slate-100 mb-1">
                {report.pythagorean.balanceNumber}
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">
                {report.pythagorean.balanceInterpretation}
              </p>
            </div>
          </div>

          {/* 2. Four Pinnacles (Life Phases Timeline) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  The 4 Life Pinnacles (Cycles of Opportunity & Attainment)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated from intersecting lifecycle sums; indicates primary environmental conditions and achievements across each era.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {report.pythagorean.pinnacles.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl relative overflow-hidden hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                      Pinnacle {idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      {p.ageRange}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-serif-celestial font-bold text-slate-100">
                      {p.number}
                    </span>
                    {p.isMaster && (
                      <span className="text-[9px] font-bold text-amber-950 bg-amber-400 px-1.5 py-0.5 rounded">
                        Master
                      </span>
                    )}
                  </div>

                  <h5 className="text-xs font-semibold text-slate-200 mb-1.5">{p.theme}</h5>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{p.description}</p>
                  <div className="text-[11px] text-amber-300/90 pt-2 border-t border-slate-800">
                    <strong className="text-amber-400">Opportunity: </strong>
                    {p.opportunity}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Four Challenges (Life Obstacles & Mastery) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="mb-4">
              <h4 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                The 4 Life Challenges (Karmic Obstacles & Self-Mastery)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated by subtracting month, day, and year components; reveals recurring hurdles designed to forge soul fortitude.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {report.pythagorean.challenges.map((c, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border relative ${
                    idx === 2
                      ? "bg-slate-900/90 border-rose-500/40 shadow-md"
                      : "bg-slate-900/50 border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider ${
                        idx === 2 ? "text-rose-400" : "text-slate-400"
                      }`}
                    >
                      {idx === 2 ? "Main Life Challenge" : `Challenge ${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      C{idx + 1}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-serif-celestial font-bold text-slate-100">
                      {c.number}
                    </span>
                  </div>

                  <h5 className="text-xs font-semibold text-rose-300/90 mb-1.5">{c.obstacle}</h5>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{c.lesson}</p>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <strong className="text-slate-300">Prescription: </strong>
                    {c.advice}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Planes of Expression & Hidden Passion */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expression Planes Breakdown */}
            <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    Planes of Expression (Physical, Mental, Emotional, Intuitive)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Analyzes how your mind, body, emotions, and spirit partition energy based on letter vibrations.
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                  Dominant: {report.pythagorean.expressionPlanes.dominantPlane}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {/* Physical */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">
                      Physical Plane (D, E, M, W)
                    </span>
                    <span className="text-slate-400 font-mono">
                      {report.pythagorean.expressionPlanes.physical.count} letters (
                      {report.pythagorean.expressionPlanes.physical.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${report.pythagorean.expressionPlanes.physical.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Mental */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">
                      Mental Plane (A, H, J, N, P, G)
                    </span>
                    <span className="text-slate-400 font-mono">
                      {report.pythagorean.expressionPlanes.mental.count} letters (
                      {report.pythagorean.expressionPlanes.mental.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-400 h-full rounded-full transition-all"
                      style={{ width: `${report.pythagorean.expressionPlanes.mental.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Emotional */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">
                      Emotional Plane (B, I, O, R, S, T, X, Z)
                    </span>
                    <span className="text-slate-400 font-mono">
                      {report.pythagorean.expressionPlanes.emotional.count} letters (
                      {report.pythagorean.expressionPlanes.emotional.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-400 h-full rounded-full transition-all"
                      style={{ width: `${report.pythagorean.expressionPlanes.emotional.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Intuitive */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">
                      Intuitive Plane (C, F, K, L, Q, U, V, Y)
                    </span>
                    <span className="text-slate-400 font-mono">
                      {report.pythagorean.expressionPlanes.intuitive.count} letters (
                      {report.pythagorean.expressionPlanes.intuitive.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all"
                      style={{ width: `${report.pythagorean.expressionPlanes.intuitive.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
                {report.pythagorean.expressionPlanes.interpretation}
              </div>
            </div>

            {/* Hidden Passion & Karmic Lessons */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              {/* Hidden Passion */}
              <div>
                <h4 className="text-sm font-serif-celestial font-bold text-slate-100 flex items-center gap-2 mb-2">
                  <FlameIcon className="w-4 h-4 text-amber-400" />
                  Hidden Passion (Dominant Drive)
                </h4>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-2xl font-serif-celestial font-bold text-amber-400">
                    Number {report.pythagorean.hiddenPassion.numbers.join(" & ")}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({report.pythagorean.hiddenPassion.count} occurrences)
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-2">
                  {report.pythagorean.hiddenPassion.meaning}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {report.pythagorean.hiddenPassion.traits.map((t, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Karmic Lessons (Missing Letters) */}
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-sm font-serif-celestial font-bold text-slate-100 flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  Karmic Lessons (Missing Letters)
                </h4>
                {report.pythagorean.karmicLessons.length === 0 ? (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    No missing numbers! Your name contains all 9 vibrational digits.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {report.pythagorean.karmicLessons.map((k, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs"
                      >
                        <span className="font-semibold text-amber-300">
                          Missing {k.number}:{" "}
                        </span>
                        <span className="text-slate-300">{k.lesson}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INDIAN VEDIC (SANKHYA SHASTRA) VIEW & REMEDIES */}
      {/* ========================================================================= */}
      {activeTab === "vedic" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                <span className="text-amber-400 font-serif">🕉️</span>
                Indian Vedic Numerology & Classical Remedies (सांख्य शास्त्र)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authentic Navagraha vibrations based on Mulank (Psychic/Driver), Bhagyank (Destiny/Conductor), and Namank with comprehensive gemstone, mantra, and daan prescriptions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                Synergy: <strong>{report.vedic.mulankBhagyankRelation}</strong>
              </span>
            </div>
          </div>

          {/* Primary Numbers Cards (Mulank, Bhagyank, Namank) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mulank */}
            <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Mulank (Driver / Psychic)
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  Birth Day {report.birthDay}
                </span>
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-serif-celestial font-bold text-slate-100">
                  {report.vedic.mulank}
                </span>
                <span className="text-sm font-semibold text-amber-300">
                  {report.vedic.rulingPlanetMulank.planet} ({report.vedic.rulingPlanetMulank.sanskrit})
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Governs your personal disposition, self-image, instinctual habits, and inner motivations up to age 35–40.
              </p>

              <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Presiding Deity:</span>
                  <span className="text-slate-200 font-medium">
                    {report.vedic.rulingPlanetMulank.deity.primary}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Auspicious Day:</span>
                  <span className="text-amber-300 font-medium">
                    {report.vedic.rulingPlanetMulank.day}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Favorable Direction:</span>
                  <span className="text-slate-200 font-medium">
                    {report.vedic.rulingPlanetMulank.direction.favorable}
                  </span>
                </div>
              </div>
            </div>

            {/* Bhagyank */}
            <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Bhagyank (Destiny / Conductor)
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  Full Birthdate Sum
                </span>
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-serif-celestial font-bold text-slate-100">
                  {report.vedic.bhagyank}
                </span>
                <span className="text-sm font-semibold text-amber-300">
                  {report.vedic.rulingPlanetBhagyank.planet} ({report.vedic.rulingPlanetBhagyank.sanskrit})
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Governs your worldly destiny, career karma, public achievements, and life calling especially after age 35.
              </p>

              <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Presiding Deity:</span>
                  <span className="text-slate-200 font-medium">
                    {report.vedic.rulingPlanetBhagyank.deity.primary}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Auspicious Day:</span>
                  <span className="text-amber-300 font-medium">
                    {report.vedic.rulingPlanetBhagyank.day}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Favorable Direction:</span>
                  <span className="text-slate-200 font-medium">
                    {report.vedic.rulingPlanetBhagyank.direction.favorable}
                  </span>
                </div>
              </div>
            </div>

            {/* Namank & Synergy */}
            <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl relative overflow-hidden shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Namank (Vedic Name Number)
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Phonetic Sum
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-serif-celestial font-bold text-slate-100">
                    {report.vedic.namank}
                  </span>
                  <span className="text-xs text-slate-300">
                    Active vibration in social commerce
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {report.vedic.relationAnalysis}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-xs text-amber-300 mb-1 font-semibold">
                  Favorable Dates of Any Month:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {report.vedic.favorableDates.map((d) => (
                    <span
                      key={d}
                      className="px-2 py-0.5 bg-slate-800 text-slate-200 text-xs font-mono rounded"
                    >
                      {d}th
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Complete Classical Vedic Remedies Suite */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h4 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Comprehensive Vedic Upayas (Planetary Remedies for {report.vedic.rulingPlanetMulank.planet})
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Classical prescriptions to strengthen favorable vibrations and mitigate karmic afflictions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gemstone Remedy */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <GemIcon className="w-4 h-4" />
                  <span>Gemstone (रत्न)</span>
                </div>
                <div className="text-sm font-bold text-slate-100">
                  {report.vedic.gemstoneRemedy.name}
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div><strong>Weight:</strong> {report.vedic.gemstoneRemedy.carat}</div>
                  <div><strong>Metal:</strong> {report.vedic.gemstoneRemedy.metal}</div>
                  <div><strong>Finger:</strong> {report.vedic.gemstoneRemedy.finger}</div>
                  <div><strong>Time:</strong> {report.vedic.gemstoneRemedy.day}</div>
                </div>
              </div>

              {/* Mantra Remedy */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                  <div className="flex items-center gap-2">
                    <span className="font-serif">📿</span>
                    <span>Beej Mantra (मन्त्र)</span>
                  </div>
                  <button
                    onClick={() => handleCopyMantra(report.vedic.mantraRemedy.transliteration)}
                    className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedMantra ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedMantra ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="text-xs font-serif text-amber-200">
                  {report.vedic.mantraRemedy.sanskrit}
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  &quot;{report.vedic.mantraRemedy.transliteration}&quot;
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  Chant {report.vedic.mantraRemedy.count} times daily using {report.vedic.mantraRemedy.beads}.
                </div>
              </div>

              {/* Charity / Daan */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>Charity / Daan (दान)</span>
                </div>
                <div className="text-xs text-slate-200">
                  {report.vedic.rulingPlanetMulank.generalRemedies.charity}
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <strong>Auspicious Day:</strong> {report.vedic.rulingPlanetMulank.day}
                </div>
              </div>

              {/* Fasting & Yantra */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Vrat & Yantra (यन्त्र)</span>
                </div>
                <div className="text-xs text-slate-200">
                  <strong>Fast (व्रत):</strong> {report.vedic.rulingPlanetMulank.fast.method}
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <strong>Yantra:</strong> {report.vedic.rulingPlanetMulank.yantra.name} on {report.vedic.rulingPlanetMulank.yantra.material}.
                </div>
              </div>
            </div>
          </div>

          {/* Friendly / Enemy / Neutral Matrix */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h4 className="text-base font-serif-celestial font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Navagraha Harmony Matrix for Mulank {report.vedic.mulank} ({report.vedic.rulingPlanetMulank.planet})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
                <div className="font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Friendly Numbers (Mitra / मित्र)</span>
                </div>
                <div className="flex gap-2 mb-2">
                  {report.vedic.rulingPlanetMulank.friendlyNumbers.map((n) => (
                    <span
                      key={n}
                      className="w-7 h-7 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold rounded-lg flex items-center justify-center font-mono"
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <p className="text-slate-300 text-[11px]">
                  Ideal partners for marriage, close friendships, business founders, and auspicious contracts.
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-400 flex items-center justify-center text-[10px]">
                    =
                  </span>
                  <span>Neutral Numbers (Sama / सम)</span>
                </div>
                <div className="flex gap-2 mb-2">
                  {report.vedic.rulingPlanetMulank.neutralNumbers.map((n) => (
                    <span
                      key={n}
                      className="w-7 h-7 bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-lg flex items-center justify-center font-mono"
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <p className="text-slate-400 text-[11px]">
                  Produce moderate, transactional outcomes; requires mutual patience and clear communication.
                </p>
              </div>

              <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl">
                <div className="font-semibold text-rose-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Challenging Numbers (Shatru / शत्रु)</span>
                </div>
                <div className="flex gap-2 mb-2">
                  {report.vedic.rulingPlanetMulank.enemyNumbers.map((n) => (
                    <span
                      key={n}
                      className="w-7 h-7 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold rounded-lg flex items-center justify-center font-mono"
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <p className="text-slate-300 text-[11px]">
                  Frictional vibrations; avoid scheduling critical launches or high-risk contracts on these calendar dates.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CHALDEAN NUMEROLOGY & COMPOUND NUMBERS (10-52) */}
      {/* ========================================================================= */}
      {activeTab === "chaldean" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                Chaldean Numerology & Occult Compound Numbers (10 to 52)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                The ancient Babylonian-Chaldean system where numbers 10 through 52 represent the hidden esoteric forces governing destiny.
              </p>
            </div>
            <div className="text-xs text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              Cheiro Tradition
            </div>
          </div>

          {/* User's Personal Name Vibrations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Full Name Compound */}
            <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Full Name Compound
                </span>
                <span className="text-[10px] text-amber-300 font-medium bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded">
                  {report.chaldean.fullName.compoundMeaning.fortuneCategory}
                </span>
              </div>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-4xl font-serif-celestial font-bold text-slate-100">
                  {report.chaldean.fullName.compoundNumber}
                </span>
                <span className="text-sm font-semibold text-amber-300">
                  {report.chaldean.fullName.compoundMeaning.title}
                </span>
              </div>
              <div className="text-xs text-slate-400 mb-3">
                Single Root: <strong className="text-slate-200">{report.chaldean.fullName.singleRoot}</strong>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {report.chaldean.fullName.compoundMeaning.occultSignificance}
              </p>
              <div className="text-[11px] text-rose-300 pt-2 border-t border-slate-800">
                <strong>Warning: </strong>{report.chaldean.fullName.compoundMeaning.warning}
              </div>
              <div className="text-[11px] text-emerald-300 mt-1">
                <strong>Advice: </strong>{report.chaldean.fullName.compoundMeaning.advice}
              </div>
            </div>

            {/* First Name Compound */}
            <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  First Name Vibration
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  Individual Self
                </span>
              </div>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-4xl font-serif-celestial font-bold text-slate-100">
                  {report.chaldean.firstName.compoundNumber}
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  {report.chaldean.firstName.compoundMeaning.title}
                </span>
              </div>
              <div className="text-xs text-slate-400 mb-3">
                Root: <strong className="text-slate-200">{report.chaldean.firstName.singleRoot}</strong> (&quot;{report.chaldean.firstName.name}&quot;)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {report.chaldean.firstName.compoundMeaning.nature}
              </p>
            </div>

            {/* Last Name Compound */}
            <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Surname Vibration
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  Ancestral Heritage
                </span>
              </div>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-4xl font-serif-celestial font-bold text-slate-100">
                  {report.chaldean.lastName.compoundNumber}
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  {report.chaldean.lastName.compoundMeaning.title}
                </span>
              </div>
              <div className="text-xs text-slate-400 mb-3">
                Root: <strong className="text-slate-200">{report.chaldean.lastName.singleRoot}</strong> (&quot;{report.chaldean.lastName.name}&quot;)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {report.chaldean.lastName.compoundMeaning.nature}
              </p>
            </div>
          </div>

          {/* Master Chaldean Guidance Box */}
          <div className="p-4 bg-slate-950/60 border border-amber-500/20 rounded-xl text-xs text-slate-300 leading-relaxed">
            <span className="text-amber-400 font-semibold">Cheiro Insight: </span>
            {report.chaldean.cheiroGuidance}
          </div>

          {/* Interactive Compound Numbers Database Explorer (10-52) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                  <Search className="w-4 h-4 text-amber-400" />
                  Complete Chaldean Compound Explorer (All Numbers 10 to 52)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Browse and inspect the classical occult significance of any number from 10 to 52.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by number or title..."
                  value={compoundSearchQuery}
                  onChange={(e) => setCompoundSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {compoundList.map((c) => (
                <div
                  key={c.number}
                  onClick={() => setSelectedCompoundNum(selectedCompoundNum === c.number ? null : c.number)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedCompoundNum === c.number || c.number === report.chaldean.fullName.compoundNumber
                      ? "bg-slate-900 border-amber-500/50 shadow-md"
                      : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-serif-celestial font-bold text-amber-400 text-base">
                        {c.number}
                      </span>
                      <span className="font-semibold text-slate-200 truncate">{c.title}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        c.fortuneCategory.includes("Fortunate")
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                          : c.fortuneCategory.includes("Warning") || c.fortuneCategory.includes("Caution")
                          ? "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {c.fortuneCategory}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-2 mb-2">{c.nature}</p>

                  {(selectedCompoundNum === c.number || c.number === report.chaldean.fullName.compoundNumber) && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5 animate-fadeIn">
                      <p className="text-[11px] text-slate-300">{c.occultSignificance}</p>
                      <p className="text-[10px] text-rose-300">
                        <strong>Warning: </strong>{c.warning}
                      </p>
                      <p className="text-[10px] text-emerald-300">
                        <strong>Advice: </strong>{c.advice}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CHINESE LO SHU GRID VIEW */}
      {/* ========================================================================= */}
      {activeTab === "loshu" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                Chinese Lo Shu Grid: The Sacred 3x3 Magic Square (洛书)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ancient cosmic grid summing to 15 in all directions; reveals elemental harmony, Arrows of Strength, Arrows of Emptiness, and Feng Shui cures.
              </p>
            </div>
            <div className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              Balance Score: <strong>{report.loShu.lifeBalanceScore}/100</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Visual 3x3 Magic Square */}
            <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-serif-celestial font-bold text-slate-200 text-center">
                Your Personal Lo Shu Energy Distribution
              </h4>

              {/* 3x3 Grid */}
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto aspect-square p-2 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner">
                {/* Cell 4 */}
                <LoShuCell
                  num={4}
                  count={report.loShu.digitCounts[4]}
                  element="Wood"
                  area="Wealth (SE)"
                />
                {/* Cell 9 */}
                <LoShuCell
                  num={9}
                  count={report.loShu.digitCounts[9]}
                  element="Fire"
                  area="Fame (S)"
                />
                {/* Cell 2 */}
                <LoShuCell
                  num={2}
                  count={report.loShu.digitCounts[2]}
                  element="Earth"
                  area="Love (SW)"
                />

                {/* Cell 3 */}
                <LoShuCell
                  num={3}
                  count={report.loShu.digitCounts[3]}
                  element="Wood"
                  area="Family (E)"
                />
                {/* Cell 5 */}
                <LoShuCell
                  num={5}
                  count={report.loShu.digitCounts[5]}
                  element="Earth"
                  area="Tai Chi (Center)"
                />
                {/* Cell 7 */}
                <LoShuCell
                  num={7}
                  count={report.loShu.digitCounts[7]}
                  element="Metal"
                  area="Creativity (W)"
                />

                {/* Cell 8 */}
                <LoShuCell
                  num={8}
                  count={report.loShu.digitCounts[8]}
                  element="Earth"
                  area="Wisdom (NE)"
                />
                {/* Cell 1 */}
                <LoShuCell
                  num={1}
                  count={report.loShu.digitCounts[1]}
                  element="Water"
                  area="Career (N)"
                />
                {/* Cell 6 */}
                <LoShuCell
                  num={6}
                  count={report.loShu.digitCounts[6]}
                  element="Metal"
                  area="Mentors (NW)"
                />
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 text-center leading-relaxed">
                Dominant Element: <strong className="text-amber-300">{report.loShu.dominantElement}</strong>.{" "}
                {report.loShu.overallInterpretation}
              </div>
            </div>

            {/* Arrows Analysis (Strength & Weakness) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Arrows of Strength */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h4 className="text-sm font-serif-celestial font-bold text-emerald-400 flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4" />
                  Arrows of Strength (Active Lines of Power)
                </h4>

                <div className="space-y-2.5">
                  {report.loShu.arrowsOfStrength.map((arrow, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                        arrow.isPresent
                          ? "bg-emerald-950/20 border-emerald-500/40 text-slate-200"
                          : "bg-slate-900/30 border-slate-800/60 text-slate-500 opacity-60"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold ${arrow.isPresent ? "text-emerald-300" : "text-slate-400"}`}>
                            {arrow.name}
                          </span>
                          {arrow.isPresent && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed">{arrow.meaning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrows of Weakness */}
              {report.loShu.arrowsOfWeakness.some((a) => a.isPresent) && (
                <div className="bg-slate-950/70 border border-rose-500/30 rounded-2xl p-5 shadow-xl">
                  <h4 className="text-sm font-serif-celestial font-bold text-rose-400 flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    Arrows of Weakness / Emptiness (Energy Gaps)
                  </h4>

                  <div className="space-y-2.5">
                    {report.loShu.arrowsOfWeakness
                      .filter((a) => a.isPresent)
                      .map((arrow, i) => (
                        <div
                          key={i}
                          className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl text-xs space-y-1"
                        >
                          <span className="font-semibold text-rose-300">{arrow.name}</span>
                          <p className="text-slate-300 text-[11px]">{arrow.meaning}</p>
                          <p className="text-amber-300 text-[10px] pt-1 border-t border-rose-900/50">
                            {arrow.guidance}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Missing Numbers & Feng Shui Elemental Remedies */}
          {report.loShu.missingNumbers.length > 0 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Missing Numbers & Feng Shui Elemental Cures
              </h4>
              <p className="text-xs text-slate-400">
                In classical Chinese numerology, missing digits represent vacant Bagua directions. Balancing these with natural elements restores flow.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.loShu.missingNumbers.map((m) => (
                  <div
                    key={m.number}
                    className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif-celestial font-bold text-amber-400 text-lg">
                        Missing {m.number}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {m.element} Element
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{m.weakness}</p>
                    <div className="text-[11px] text-amber-300 pt-2 border-t border-slate-800">
                      <strong>Feng Shui Cure: </strong>{m.fengShuiRemedy}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      <strong>Items: </strong>{m.remedyItems.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Excess Numbers (3+ occurrences) */}
          {report.loShu.excessNumbers.length > 0 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Excess Numbers (Overdeveloped Energies)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {report.loShu.excessNumbers.map((e) => (
                  <div key={e.number} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="font-semibold text-amber-300">
                      Digit {e.number} ({e.count} Occurrences)
                    </div>
                    <p className="text-slate-300 text-[11px]">{e.trait}</p>
                    <p className="text-emerald-300 text-[10px]">
                      <strong>Advice: </strong>{e.advice}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. KABBALAH TREE OF LIFE & GEMATRIA VIEW */}
      {/* ========================================================================= */}
      {activeTab === "kabbalah" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Kabbalah Numerology: Hebrew Gematria & The Tree of Life (עץ חיים)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Maps the soul across the 10 Sephiroth (Divine Emanations) and 22 connecting Paths with Tarot correspondences.
              </p>
            </div>
            <div className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              Gematria Total: <strong>{report.kabbalah.hebrewGematriaValue}</strong> (Root {report.kabbalah.hebrewReducedValue})
            </div>
          </div>

          {/* Transliterated Hebrew Name Gematria Table */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-serif-celestial font-bold text-slate-200">
              Hebrew Letter Transliteration & Gematria Values
            </h4>
            <div className="flex flex-wrap gap-2">
              {report.kabbalah.transliteratedLetters.map((l, i) => (
                <div
                  key={i}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center flex flex-col items-center min-w-[50px]"
                >
                  <span className="text-xs font-mono text-slate-400">{l.letter}</span>
                  <span className="text-lg font-serif text-amber-300 font-bold">{l.hebrew}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{l.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pt-2">
              {report.kabbalah.mysticalReading}
            </p>
          </div>

          {/* Soul & Outer Sephiroth Hero Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Soul Sephirah */}
            <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Soul Sephirah (Inner Essence)
                </span>
                <span className="text-xs font-serif text-amber-300 font-bold text-xl">
                  {report.kabbalah.soulSephirah.hebrew}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-serif-celestial font-bold text-slate-100">
                  {report.kabbalah.soulSephirah.number}. {report.kabbalah.soulSephirah.name}
                </span>
              </div>
              <p className="text-xs text-amber-300/90 font-medium">
                {report.kabbalah.soulSephirah.meaning}
              </p>
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong>Divine Attribute: </strong>{report.kabbalah.soulSephirah.divineAttribute}
              </div>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <strong>Spiritual Lesson: </strong>{report.kabbalah.soulSephirah.spiritualLesson}
              </div>
            </div>

            {/* Outer Life Sephirah */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Outer Destiny Sephirah (Manifestation)
                </span>
                <span className="text-xs font-serif text-slate-300 font-bold text-xl">
                  {report.kabbalah.outerLifeSephirah.hebrew}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-serif-celestial font-bold text-slate-100">
                  {report.kabbalah.outerLifeSephirah.number}. {report.kabbalah.outerLifeSephirah.name}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {report.kabbalah.outerLifeSephirah.meaning}
              </p>
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong>Divine Attribute: </strong>{report.kabbalah.outerLifeSephirah.divineAttribute}
              </div>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <strong>Spiritual Lesson: </strong>{report.kabbalah.outerLifeSephirah.spiritualLesson}
              </div>
            </div>
          </div>

          {/* All 10 Sephiroth Grid */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-base font-serif-celestial font-bold text-slate-100">
              The 10 Divine Emanations (Sephiroth on the Tree of Life)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {report.kabbalah.allSephiroth.map((s) => (
                <div
                  key={s.number}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                    s.number === report.kabbalah.soulSephirah.number ||
                    s.number === report.kabbalah.outerLifeSephirah.number
                      ? "bg-slate-900 border-amber-500/50 shadow-md ring-1 ring-amber-500/20"
                      : "bg-slate-900/40 border-slate-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif-celestial font-bold text-amber-400 text-sm">
                      {s.number}. {s.name}
                    </span>
                    <span className="font-serif text-slate-300 text-base">{s.hebrew}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">{s.meaning}</p>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    Planet: {s.planet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAMIL NUMEROLOGY (EN KANIYAM) VIEW */}
      {/* ========================================================================= */}
      {activeTab === "tamil" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                <span className="text-amber-400 font-serif">🪔</span>
                Tamil Numerology: En Kaniyam (எண் கணிதம்)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Classical Southern Siddhanta numerology analyzing Janma En (பிறந்த எண்), Vidhi En (விதி எண்), and auspicious letter sounds.
              </p>
            </div>
            <div className="text-xs text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              Siddhanta Tradition
            </div>
          </div>

          {/* Numbers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl relative shadow-xl">
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                Janma En (பிறந்த எண்)
              </div>
              <div className="text-4xl font-serif-celestial font-bold text-slate-100 mb-2">
                {report.tamil.janmaEn}
              </div>
              <p className="text-xs text-slate-300 mb-2">
                Ruled by: <strong className="text-amber-300">{report.tamil.tamilGraha}</strong>
              </p>
              <p className="text-[11px] text-slate-400">
                Governs innate tendencies, physical health, and personality traits.
              </p>
            </div>

            <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl relative shadow-xl">
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                Vidhi En (விதி எண்)
              </div>
              <div className="text-4xl font-serif-celestial font-bold text-slate-100 mb-2">
                {report.tamil.vidhiEn}
              </div>
              <p className="text-xs text-slate-300 mb-2">
                Destiny calling & karmic fruition through life&apos;s second half.
              </p>
            </div>

            <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl relative shadow-xl">
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                Peyar En (பெயர் எண்)
              </div>
              <div className="text-4xl font-serif-celestial font-bold text-slate-100 mb-2">
                {report.tamil.peyarEn}
              </div>
              <p className="text-xs text-slate-300 mb-2">
                Active social and commercial name frequency.
              </p>
            </div>
          </div>

          {/* Tamil Guidance and Proverbs */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              Auspicious Alignments & Wisdom
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold">Auspicious Days:</span>
                <p className="text-slate-200 font-medium">{report.tamil.auspiciousDays.join(", ")}</p>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold">Auspicious Colors:</span>
                <p className="text-slate-200 font-medium">{report.tamil.auspiciousColors.join(", ")}</p>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold">Auspicious Gems:</span>
                <p className="text-slate-200 font-medium">{report.tamil.auspiciousGems.join(", ")}</p>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold">Lucky Initial Letters:</span>
                <p className="text-amber-300 font-mono font-bold">{report.tamil.luckyInitialSounds.join(", ")}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-900/80 border border-amber-500/20 rounded-xl text-xs text-slate-200 font-medium leading-relaxed">
              <span className="text-amber-400 font-serif">பழமொழி (Ancient Guidance): </span>
              &quot;{report.tamil.tamilProverbGuidance}&quot;
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CROSS-SYSTEM SYNTHESIS & MATRIX COMPARISON VIEW */}
      {/* ========================================================================= */}
      {activeTab === "synthesis" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Cross-System Numerological Matrix & Unified Synthesis
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Harmonizes Pythagorean, Indian Vedic, Chaldean, Lo Shu, Kabbalah, and Tamil perspectives into a single unified cosmic blueprint.
              </p>
            </div>
            <div className="text-xs text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              Universal Resonance: <strong>{report.crossSystemSynthesis.resonanceScore}%</strong>
            </div>
          </div>

          {/* Unified Archetype Hero Card */}
          <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl shadow-xl space-y-3">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Unified Cosmic Archetype
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-celestial font-bold text-slate-100">
              {report.crossSystemSynthesis.unifiedArchetype}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              {report.crossSystemSynthesis.coreKarmicTheme}
            </p>
          </div>

          {/* Side-by-Side Systems Comparative Matrix Table */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-x-auto">
            <h4 className="text-base font-serif-celestial font-bold text-slate-100 mb-4">
              Side-by-Side Vibrational Alignment
            </h4>

            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Tradition / System</th>
                  <th className="pb-3 font-semibold">Core Number</th>
                  <th className="pb-3 font-semibold">Planetary / Archetypal Ruler</th>
                  <th className="pb-3 font-semibold">Key Realm of Influence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3 font-semibold text-amber-300">Pythagorean</td>
                  <td className="py-3 font-mono font-bold text-slate-100">
                    LP {report.pythagorean.lifePathNumber}
                  </td>
                  <td className="py-3">{report.pythagorean.detailedInterpretations.lifePath.archetype}</td>
                  <td className="py-3 text-slate-400">Psychological journey & evolutionary lessons</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-amber-300">Indian Vedic</td>
                  <td className="py-3 font-mono font-bold text-slate-100">
                    Mulank {report.vedic.mulank} · Bhagyank {report.vedic.bhagyank}
                  </td>
                  <td className="py-3">
                    {report.vedic.rulingPlanetMulank.planet} / {report.vedic.rulingPlanetBhagyank.planet}
                  </td>
                  <td className="py-3 text-slate-400">Karmic dharma, health, upayas & deities</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-amber-300">Chaldean</td>
                  <td className="py-3 font-mono font-bold text-slate-100">
                    Compound {report.chaldean.fullName.compoundNumber} ({report.chaldean.fullName.singleRoot})
                  </td>
                  <td className="py-3">{report.chaldean.fullName.compoundMeaning.title}</td>
                  <td className="py-3 text-slate-400">Hidden occult fortune, warnings & destiny</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-amber-300">Chinese Lo Shu</td>
                  <td className="py-3 font-mono font-bold text-slate-100">
                    {report.loShu.dominantElement} Element
                  </td>
                  <td className="py-3">
                    {report.loShu.arrowsOfStrength.filter((a) => a.isPresent).length} Active Power Arrows
                  </td>
                  <td className="py-3 text-slate-400">Feng Shui energy balance & home bagua</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-amber-300">Kabbalah</td>
                  <td className="py-3 font-mono font-bold text-slate-100">
                    Gematria {report.kabbalah.hebrewGematriaValue}
                  </td>
                  <td className="py-3">
                    Sephirah {report.kabbalah.soulSephirah.number} ({report.kabbalah.soulSephirah.name})
                  </td>
                  <td className="py-3 text-slate-400">Divine emanations & soul consciousness</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-amber-300">Tamil En Kaniyam</td>
                  <td className="py-3 font-mono font-bold text-slate-100">
                    Janma {report.tamil.janmaEn} · Vidhi {report.tamil.vidhiEn}
                  </td>
                  <td className="py-3">{report.tamil.tamilGraha}</td>
                  <td className="py-3 text-slate-400">Auspicious letter sounds & marital harmony</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Actionable Directives */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              Synthesized Strategic Directives for {fullName || "You"}
            </h4>

            <div className="space-y-2.5">
              {report.crossSystemSynthesis.actionableDirectives.map((directive, i) => (
                <div
                  key={i}
                  className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs flex items-start gap-3"
                >
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200 leading-relaxed">{directive}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper Subcomponent: Lo Shu Grid Cell
 */
function LoShuCell({
  num,
  count,
  element,
  area,
}: {
  num: number;
  count: number;
  element: "Water" | "Earth" | "Wood" | "Metal" | "Fire";
  area: string;
}) {
  const isPresent = count > 0;

  const elementColorMap: Record<string, string> = {
    Water: "border-blue-500/40 text-blue-300 bg-blue-950/30",
    Wood: "border-emerald-500/40 text-emerald-300 bg-emerald-950/30",
    Fire: "border-rose-500/40 text-rose-300 bg-rose-950/30",
    Earth: "border-amber-500/40 text-amber-300 bg-amber-950/30",
    Metal: "border-slate-400/40 text-slate-200 bg-slate-800/40",
  };

  return (
    <div
      className={`rounded-xl border flex flex-col items-center justify-center p-2 relative transition-all ${
        isPresent
          ? elementColorMap[element]
          : "border-slate-800 bg-slate-950/40 text-slate-600 opacity-40"
      }`}
    >
      <div className="absolute top-1 left-1.5 text-[9px] font-mono text-slate-400">
        {num}
      </div>

      <div className="text-xl sm:text-2xl font-serif-celestial font-bold">
        {isPresent ? num.toString().repeat(Math.min(count, 3)) : "-"}
      </div>

      <div className="text-[9px] text-center font-medium mt-1 truncate max-w-full">
        {area}
      </div>

      {isPresent && (
        <span className="text-[9px] font-mono opacity-80 mt-0.5">
          ({count}×)
        </span>
      )}
    </div>
  );
}

function FlameIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"
      />
    </svg>
  );
}

function GemIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 3h12l4 6-10 12L2 9l4-6z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 3L8 9l4 12 4-12-3-6"
      />
    </svg>
  );
}
