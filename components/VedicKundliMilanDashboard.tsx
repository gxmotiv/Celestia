"use client";

import React, { useState } from "react";
import { MasterKundliReport } from "@/lib/vedic/masterKundliMilan";
import { KundliMilanReport, KootaScoreDetail, KootaName } from "@/lib/vedic/kundliMilanEngine";
import {
  Sparkles,
  Shield,
  Heart,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info,
  Flower2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Award,
  CircleDot,
  Compass,
  Layers,
  Activity,
  Calendar,
  Zap,
  Scale,
  Gem,
} from "lucide-react";

interface VedicKundliMilanDashboardProps {
  masterReport?: MasterKundliReport | null;
  milanReport?: KundliMilanReport | null;
}

export function VedicKundliMilanDashboard({
  masterReport,
  milanReport: legacyMilanReport,
}: VedicKundliMilanDashboardProps) {
  const [expandedKoota, setExpandedKoota] = useState<KootaName | null>(null);
  const [expandedPapaPlanet, setExpandedPapaPlanet] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<
    "ashtakoota" | "dasakoota" | "papasamya" | "dashasandhi" | "jaimini" | "remedies"
  >("ashtakoota");

  // Fallback if legacy report is passed alone
  const milanReport: KundliMilanReport | null =
    masterReport?.ashtakootaReport || legacyMilanReport || null;

  if (!masterReport && !milanReport) {
    return (
      <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
        <Flower2 className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
        <h3 className="text-base font-semibold text-slate-200">
          Calculating Master Vedic Kundli Milan...
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Synchronizing Ashtakoota 36 Gunas, Dasakoota vetoes (Rajju &amp; Vedha), Papa Samya malefic balance, Dasha Sandhi timelines, and Jaimini Upapada synergy.
        </p>
      </div>
    );
  }

  // Destructure Ashtakoota data
  const {
    person1Name,
    person2Name,
    totalGunas,
    percentage: ashtakootaPercent,
    verdict: ashtakootaVerdict,
    verdictGrade: ashtakootaGrade,
    verdictDescription: ashtakootaDesc,
    kootas,
    manglikAnalysis,
    navamsaSynergy,
    activeDoshas,
    cancellationsApplied,
    shantiRemedies,
  } = milanReport!;

  // Master Level Data (if available)
  const masterIndex = masterReport?.masterIndex ?? ashtakootaPercent;
  const masterGrade = masterReport?.masterGrade ?? ashtakootaGrade;
  const masterVerdict = masterReport?.masterVerdict ?? ashtakootaVerdict;
  const masterSummary = masterReport?.masterSummary ?? ashtakootaDesc;
  const dasakoota = masterReport?.dasakootaReport;
  const papaSamya = masterReport?.papaSamyaReport;
  const dashaSandhi = masterReport?.dashaSandhiReport;
  const jaimini = masterReport?.jaiminiReport;
  const criticalVetoes = masterReport?.criticalVetoes ?? [];
  const auspiciousYogas = masterReport?.auspiciousYogas ?? [];

  // Grade badge styling
  const gradeColor =
    masterGrade === "A+"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      : masterGrade === "A"
      ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
      : masterGrade === "B"
      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
      : "bg-rose-500/20 text-rose-300 border-rose-500/40";

  const kootaKeys: KootaName[] = [
    "varna",
    "vashya",
    "tara",
    "yoni",
    "grahaMaitri",
    "gana",
    "bhakoot",
    "nadi",
  ];

  return (
    <div className="space-y-6">
      {/* 1. TOP MASTER HERO: EXECUTIVE SCORECARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-900 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Left Column: Title & Master Verdict */}
          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Flower2 className="w-3.5 h-3.5 text-amber-400" />
                Master Vivaha Melapak
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${gradeColor}`}>
                Grade: {masterGrade} • {masterVerdict}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center justify-center md:justify-start gap-2">
              <span>{person1Name}</span>
              <span className="text-amber-400 text-base font-normal">🕉️</span>
              <span>{person2Name}</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              {masterSummary}
            </p>

            {/* Master Health Bar Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">36 Gunas Total</span>
                <span className="font-bold text-amber-300">{totalGunas} / 36 Pts</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Rajju &amp; Vedha Vetoes</span>
                <span className={`font-bold ${dasakoota?.vetoAlerts.length === 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {dasakoota ? (dasakoota.vetoAlerts.length === 0 ? "Clear (Auspicious)" : "Afflicted / Remedy") : "Clear"}
                </span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Papa Samya Balance</span>
                <span className="font-bold text-cyan-300">
                  {papaSamya ? papaSamya.balanceStatus.split(" ")[0] : "Balanced"}
                </span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Dasha Sandhi</span>
                <span className={`font-bold ${dashaSandhi?.verdict.includes("Safe") ? "text-emerald-400" : "text-amber-300"}`}>
                  {dashaSandhi ? (dashaSandhi.verdict.includes("Safe") ? "Safe Timelines" : "Sandhi Caution") : "Safe"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Composite Master Gauge */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950/80 border border-amber-500/20 rounded-2xl min-w-[180px] shadow-inner text-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-amber-400 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - masterIndex / 100)}`}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-amber-300 leading-none">
                  {masterIndex}%
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                  Master Index
                </span>
              </div>
            </div>
            <div className="mt-2 text-xs font-semibold text-amber-200">
              Grade: {masterGrade}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Synthesis of 5 Master Systems
            </div>
          </div>
        </div>

        {/* Critical Alerts Banner (if any) */}
        {criticalVetoes.length > 0 && (
          <div className="mt-4 p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Critical Master Alerts to Pacify:</span>
            </div>
            <ul className="list-disc pl-5 text-slate-300 space-y-0.5">
              {criticalVetoes.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: "ashtakoota", label: "36 Gunas & Navamsa", icon: Award },
          { id: "dasakoota", label: "Dasakoota (Rajju & Vedha)", icon: Shield },
          { id: "papasamya", label: "Papa Samya (Malefic Balance)", icon: Scale },
          { id: "dashasandhi", label: "Dasha Sandhi & Timelines", icon: Calendar },
          { id: "jaimini", label: "Jaimini & Ashtakavarga", icon: Sparkles },
          { id: "remedies", label: "Master Shanti Remedies", icon: Flower2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80"
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-amber-400" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: ASHTAKOOTA (36 GUNAS) & KUJA DOSHA & NAVAMSA */}
      {activeSubTab === "ashtakoota" && (
        <div className="space-y-5">
          {/* Ashtakoota Header Info */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Classical 8 Kootas derived from Lunar Mansions (Nakshatras) and Moon Rasis:</span>
            <span className="font-semibold text-amber-300">Total: {totalGunas} / 36 Gunas</span>
          </div>

          {/* 8 Kootas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {kootaKeys.map((key) => {
              const k = kootas[key];
              const isExpanded = expandedKoota === key;
              const isPerfect = k.pointsEarned === k.maxPoints;
              const hasDosha = k.doshaPresent && !k.cancellationPresent;

              return (
                <div
                  key={key}
                  className={`border rounded-xl transition-all ${
                    hasDosha
                      ? "bg-rose-950/15 border-rose-500/30"
                      : isPerfect
                      ? "bg-slate-900/70 border-amber-500/30"
                      : "bg-slate-900/50 border-slate-800"
                  }`}
                >
                  <div
                    onClick={() => setExpandedKoota(isExpanded ? null : key)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-200">
                          {k.displayName}
                        </span>
                        <span className="text-[10px] text-amber-400 font-serif">
                          {k.sanskritName}
                        </span>
                        {k.cancellationPresent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded">
                            Bhanga / Cancelled
                          </span>
                        )}
                        {hasDosha && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded">
                            {k.doshaName || "Dosha"}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{person1Name}: <strong className="text-slate-300">{k.person1Trait}</strong></span>
                        <span>•</span>
                        <span>{person2Name}: <strong className="text-slate-300">{k.person2Trait}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-black text-amber-300">
                          {k.pointsEarned} <span className="text-[10px] text-slate-400 font-normal">/ {k.maxPoints}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">
                          {isPerfect ? "Full" : k.pointsEarned === 0 ? "Zero" : "Partial"}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3.5 pt-0 border-t border-slate-800/80 text-xs text-slate-300 space-y-2 mt-1">
                      <p className="leading-relaxed text-slate-300">{k.description}</p>
                      {k.cancellationReason && (
                        <div className="p-2 bg-teal-950/20 border border-teal-500/30 rounded text-[11px] text-teal-300">
                          <strong>Classical Mitigation:</strong> {k.cancellationReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Kuja (Manglik) Dosha Section */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-400" />
                Kuja (Manglik) Dosha Analysis &amp; 8 Classical Cancellations
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  manglikAnalysis.mutualCancellation
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    : manglikAnalysis.person1.isManglik || manglikAnalysis.person2.isManglik
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                {manglikAnalysis.mutualCancellation
                  ? "Mutual Cancellation Active"
                  : manglikAnalysis.person1.isManglik || manglikAnalysis.person2.isManglik
                  ? "Dosha Evaluated"
                  : "Both Non-Manglik"}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {manglikAnalysis.compatibilitySummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {[
                { person: manglikAnalysis.person1, label: person1Name },
                { person: manglikAnalysis.person2, label: person2Name },
              ].map(({ person, label }, i) => (
                <div key={i} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-200">{label}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        person.finalStatus === "Non-Manglik"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : person.finalStatus === "Manglik (Cancelled)"
                          ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {person.finalStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Mars Houses: Lagna ({person.marsHouseFromLagna}H) • Moon ({person.marsHouseFromMoon}H) • Venus ({person.marsHouseFromVenus}H)
                  </div>
                  <p className="text-slate-300 text-[11px]">{person.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Navamsa D9 Soulmate Synergy Section */}
          <div className="p-4 bg-slate-950/80 border border-indigo-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Navamsa (D9) Dharmic Bond &amp; Soulmate Connection
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Score: {navamsaSynergy.synergyScore} / 100 • {navamsaSynergy.soulConnectionLevel}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {navamsaSynergy.summary}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{person1Name} D9 Moon</span>
                <span className="text-xs font-bold text-indigo-300">{navamsaSynergy.p1NavamsaMoonSign}</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{person2Name} D9 Moon</span>
                <span className="text-xs font-bold text-indigo-300">{navamsaSynergy.p2NavamsaMoonSign}</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{person1Name} D9 Venus</span>
                <span className="text-xs font-bold text-amber-300">{navamsaSynergy.p1NavamsaVenusSign}</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{person2Name} D9 Venus</span>
                <span className="text-xs font-bold text-amber-300">{navamsaSynergy.p2NavamsaVenusSign}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: DASAKOOTA & VETO CHECKS (RAJJU & VEDHA) */}
      {activeSubTab === "dasakoota" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Classical Dasakoota &amp; Primary Veto System</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              In traditional South Indian and Muhurta classical texts, <strong>Rajju</strong> (Vital Rope) and <strong>Vedha</strong> (Piercing Star Affliction) serve as primary vetoes. Even with high Ashtakoota points, unmitigated Rajju or Vedha dosha requires focused attention and remedies.
            </p>
          </div>

          {dasakoota ? (
            <div className="space-y-3">
              {/* Rajju Card */}
              <div className={`p-4 rounded-xl border ${
                dasakoota.rajju.isAfflicted
                  ? "bg-rose-950/20 border-rose-500/40"
                  : dasakoota.rajju.isCancelled
                  ? "bg-teal-950/20 border-teal-500/40"
                  : "bg-slate-900/60 border-emerald-500/40"
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">Rajju Koota (Vital Rope Energy)</span>
                    <span className="text-[10px] text-amber-400 font-serif">रज्जु कूट</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    dasakoota.rajju.isAfflicted
                      ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                      : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  }`}>
                    {dasakoota.rajju.verdict}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">{person1Name} Rajju:</span>
                    <strong className="text-slate-200">{dasakoota.rajju.groomRajju}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">{person2Name} Rajju:</span>
                    <strong className="text-slate-200">{dasakoota.rajju.brideRajju}</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-300 pt-2 leading-relaxed">
                  {dasakoota.rajju.description}
                </p>

                <div className="mt-2 p-2 bg-slate-950/60 rounded border border-slate-800/80 text-[11px] text-slate-400">
                  <strong>Vital Significance:</strong> {dasakoota.rajju.signification}
                </div>
              </div>

              {/* Vedha Card */}
              <div className={`p-4 rounded-xl border ${
                dasakoota.vedha.isVedhaPresent
                  ? "bg-rose-950/20 border-rose-500/40"
                  : "bg-slate-900/60 border-emerald-500/40"
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">Vedha Koota (Piercing Affliction)</span>
                    <span className="text-[10px] text-amber-400 font-serif">वेध कूट</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    dasakoota.vedha.isVedhaPresent
                      ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                      : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  }`}>
                    {dasakoota.vedha.verdict}
                  </span>
                </div>

                <p className="text-xs text-slate-300 pt-3 leading-relaxed">
                  {dasakoota.vedha.description}
                </p>
              </div>

              {/* Mahendra & Stree Deergha Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Mahendra */}
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200">Mahendra Koota</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      dasakoota.mahendra.isFavorable
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}>
                      {dasakoota.mahendra.verdict}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Nakshatra Separation: <strong>{dasakoota.mahendra.nakshatraDistance} positions</strong>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {dasakoota.mahendra.signification}
                  </p>
                </div>

                {/* Stree Deergha */}
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200">Stree Deergha (Woman&apos;s Fortune)</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      dasakoota.streeDeergha.isFavorable
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    }`}>
                      {dasakoota.streeDeergha.verdict}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Distance: <strong>{dasakoota.streeDeergha.distanceFromBride} Nakshatras</strong> ({dasakoota.streeDeergha.strength})
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {dasakoota.streeDeergha.description}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              Dasakoota analysis requires sidereal birth positions.
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: PAPA SAMYA (MALEFIC BALANCE) */}
      {activeSubTab === "papasamya" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Classical Papa Samya (Dosha Balance) Engine</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Evaluating malefic points for <strong>Mars, Saturn, Sun, Rahu, and Ketu</strong> situated in sensitive marital houses (1st, 2nd, 4th, 7th, 8th, and 12th) measured from <strong>Janma Lagna (100%)</strong>, <strong>Chandra Lagna (50%)</strong>, and <strong>Shukra Lagna (25%)</strong>.
            </p>
          </div>

          {papaSamya ? (
            <div className="space-y-4">
              {/* Verdict Card */}
              <div className="p-4 bg-slate-900/70 border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200">
                    Papa Samya Status: <span className="text-amber-300">{papaSamya.balanceStatus}</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Delta: {papaSamya.pointsDifference.toFixed(2)} pts ({papaSamya.relativeDifferencePercent}%)
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {papaSamya.verdictDescription}
                </p>

                {/* Score Comparison Visual Bars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-300">{person1Name}</span>
                      <span className="font-mono font-bold text-slate-200">
                        {papaSamya.person1Score.totalPoints.toFixed(2)} Total Points
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400 text-center">
                      <div className="p-1 bg-slate-900/60 rounded border border-slate-800">
                        Lagna: {papaSamya.person1Score.pointsFromLagna.toFixed(1)}
                      </div>
                      <div className="p-1 bg-slate-900/60 rounded border border-slate-800">
                        Moon: {papaSamya.person1Score.pointsFromMoon.toFixed(1)}
                      </div>
                      <div className="p-1 bg-slate-900/60 rounded border border-slate-800">
                        Venus: {papaSamya.person1Score.pointsFromVenus.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-300">{person2Name}</span>
                      <span className="font-mono font-bold text-slate-200">
                        {papaSamya.person2Score.totalPoints.toFixed(2)} Total Points
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400 text-center">
                      <div className="p-1 bg-slate-900/60 rounded border border-slate-800">
                        Lagna: {papaSamya.person2Score.pointsFromLagna.toFixed(1)}
                      </div>
                      <div className="p-1 bg-slate-900/60 rounded border border-slate-800">
                        Moon: {papaSamya.person2Score.pointsFromMoon.toFixed(1)}
                      </div>
                      <div className="p-1 bg-slate-900/60 rounded border border-slate-800">
                        Venus: {papaSamya.person2Score.pointsFromVenus.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Malefic Breakdown Table */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <h5 className="text-xs font-bold text-slate-300">
                  Planetary Malefic Breakdown (Weighted Contribution)
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  {["Mars", "Saturn", "Sun", "Rahu", "Ketu"].map((p) => {
                    const p1Val = papaSamya.person1Score.pointsByPlanet[p] || 0;
                    const p2Val = papaSamya.person2Score.pointsByPlanet[p] || 0;
                    return (
                      <div key={p} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
                        <span className="text-[11px] font-bold text-slate-300 block">{p}</span>
                        <div className="text-[10px] text-slate-400">
                          {person1Name}: <strong className="text-amber-300">{p1Val.toFixed(2)}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {person2Name}: <strong className="text-rose-300">{p2Val.toFixed(2)}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              Papa Samya calculation pending chart synchronization.
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 4: DASHA SANDHI & TIMELINE SYNCHRONIZATION */}
      {activeSubTab === "dashasandhi" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Dasha Sandhi &amp; Timeline Compatibility</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dasha Sandhi occurs when major Mahadasha cycles transition simultaneously within 6–12 months. Classical masters avoid simultaneous transition vulnerabilities where neither partner can anchor the household.
            </p>
          </div>

          {dashaSandhi ? (
            <div className="space-y-4">
              {/* Active Dasha Lords Harmony */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200">
                    Active Mahadasha Lords: {dashaSandhi.activeLordsHarmony.person1Lord} ({person1Name}) &amp; {dashaSandhi.activeLordsHarmony.person2Lord} ({person2Name})
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    dashaSandhi.activeLordsHarmony.relationship === "Natural Friends"
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      : dashaSandhi.activeLordsHarmony.relationship === "Neutral"
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                  }`}>
                    {dashaSandhi.activeLordsHarmony.relationship} ({dashaSandhi.activeLordsHarmony.score}/100)
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {dashaSandhi.activeLordsHarmony.description}
                </p>
              </div>

              {/* Sandhi Alerts (if any) */}
              {dashaSandhi.upcomingSandhis.length > 0 ? (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Identified Transition Junctions (Sandhis):</span>
                  </h5>
                  {dashaSandhi.upcomingSandhis.map((alert, idx) => (
                    <div key={idx} className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-amber-300">
                        <span>{alert.type}</span>
                        <span>Gap: {alert.gapMonths} Months</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {person1Name}: {alert.person1Period} ({alert.transitionDate1}) • {person2Name}: {alert.person2Period} ({alert.transitionDate2})
                      </div>
                      <p className="text-slate-300">{alert.description}</p>
                      <div className="text-[11px] text-amber-300/90 pt-1 border-t border-slate-800">
                        <strong>Remedial Recommendation:</strong> {alert.remedy}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-emerald-950/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>No concurrent Mahadasha Sandhi collisions detected across the timeline. Timelines are complementary and mutually supportive.</span>
                </div>
              )}

              {/* 10-Year Timeline Synchronization */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <h5 className="text-xs font-bold text-slate-200">
                  10-Year Synchronized Mahadasha Trajectory
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {dashaSandhi.tenYearTimeline.map((item) => (
                    <div
                      key={item.year}
                      className={`p-2.5 rounded-lg border text-center space-y-1 ${
                        item.status === "Harmonious"
                          ? "bg-slate-900/60 border-emerald-500/30 text-slate-200"
                          : item.status === "Vulnerable / Sandhi"
                          ? "bg-amber-950/25 border-amber-500/40 text-amber-200"
                          : "bg-slate-900/40 border-slate-800 text-slate-300"
                      }`}
                    >
                      <span className="font-bold block text-slate-100">{item.year}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{item.person1Dasha.split(" ")[0]} / {item.person2Dasha.split(" ")[0]}</span>
                      <span className={`text-[9px] font-bold block ${
                        item.status === "Harmonious" ? "text-emerald-400" : item.status === "Vulnerable / Sandhi" ? "text-amber-400" : "text-slate-400"
                      }`}>
                        {item.status} ({item.harmonyScore}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              Dasha Sandhi data pending.
            </div>
          )}
        </div>
      )}

      {/* 7. TAB 5: JAIMINI & ASHTAKAVARGA */}
      {activeSubTab === "jaimini" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Jaimini Upapada Lagna, Dara Karaka &amp; Ashtakavarga</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Maharishi Jaimini&apos;s Upapada Lagna (UL) reveals the actual institution of marriage, the 2nd from UL reveals its sustenance and durability, while Dara Karaka (DK) reveals the destined spousal archetype.
            </p>
          </div>

          {jaimini ? (
            <div className="space-y-4">
              {/* Upapada Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold pb-1 border-b border-slate-800">
                    <span className="text-amber-300">{person1Name}&apos;s Upapada Lagna (UL)</span>
                    <span className="font-mono text-slate-200">{jaimini.person1UL.upapadaRasiName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Darapada (A7): <strong>{jaimini.person1UL.darapadaRasiName}</strong> • 12th Lord: <strong>{jaimini.person1UL.twelfthLord}</strong>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80 text-[11px] text-slate-300">
                    <strong>2nd from UL (Sustenance):</strong> {jaimini.person1UL.secondFromULRasiName} ({jaimini.person1UL.secondFromULQuality})
                    <p className="text-slate-400 mt-1">{jaimini.person1UL.sustenanceAnalysis}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold pb-1 border-b border-slate-800">
                    <span className="text-rose-300">{person2Name}&apos;s Upapada Lagna (UL)</span>
                    <span className="font-mono text-slate-200">{jaimini.person2UL.upapadaRasiName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Darapada (A7): <strong>{jaimini.person2UL.darapadaRasiName}</strong> • 12th Lord: <strong>{jaimini.person2UL.twelfthLord}</strong>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80 text-[11px] text-slate-300">
                    <strong>2nd from UL (Sustenance):</strong> {jaimini.person2UL.secondFromULRasiName} ({jaimini.person2UL.secondFromULQuality})
                    <p className="text-slate-400 mt-1">{jaimini.person2UL.sustenanceAnalysis}</p>
                  </div>
                </div>
              </div>

              {/* Dara Karaka Synergy */}
              <div className="p-4 bg-slate-900/60 border border-indigo-500/30 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="font-bold text-indigo-300">Dara Karaka (DK) Soul Affinity</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {jaimini.dkSynergy.harmonyRating} ({jaimini.dkSynergy.score}/100)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1 text-[11px] text-slate-300">
                  <div>
                    {person1Name} DK: <strong className="text-slate-100">{jaimini.person1DK.planet}</strong> ({jaimini.person1DK.rasiName} at {jaimini.person1DK.degreeFormatted})
                  </div>
                  <div>
                    {person2Name} DK: <strong className="text-slate-100">{jaimini.person2DK.planet}</strong> ({jaimini.person2DK.rasiName} at {jaimini.person2DK.degreeFormatted})
                  </div>
                </div>
                <p className="text-slate-300 pt-1 leading-relaxed">
                  {jaimini.dkSynergy.description}
                </p>
              </div>

              {/* 7th House Ashtakavarga Bindus */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
                <h5 className="font-bold text-slate-200">
                  7th House Sarvashtakavarga (SAV) Bindu Stability
                </h5>
                <p className="text-slate-300 leading-relaxed">
                  {jaimini.ashtakavarga7thHouse.summary}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1 text-center">
                  <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{person1Name} 7th House SAV</span>
                    <span className="text-sm font-black text-amber-300">{jaimini.ashtakavarga7thHouse.person1House7Bindus} Bindus</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{jaimini.ashtakavarga7thHouse.person1Evaluation}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{person2Name} 7th House SAV</span>
                    <span className="text-sm font-black text-rose-300">{jaimini.ashtakavarga7thHouse.person2House7Bindus} Bindus</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{jaimini.ashtakavarga7thHouse.person2Evaluation}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              Jaimini calculations pending.
            </div>
          )}
        </div>
      )}

      {/* 8. TAB 6: MASTER SHANTI REMEDIES */}
      {activeSubTab === "remedies" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Flower2 className="w-4 h-4 text-amber-400" />
              <span>Comprehensive Master Vedic Remedial Protocol</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              In authentic Jyotish, planetary configurations are not fatalistic prophecies, but maps of karmic tendencies. Traditional Shanti rituals, japa mantras, and conscious charities pacify energetic friction and anchor lasting harmony.
            </p>
          </div>

          <div className="space-y-3">
            {masterReport?.unifiedRemedies.map((rem, idx) => (
              <div key={idx} className="p-4 bg-slate-900/60 border border-amber-500/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-800">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {rem.title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Category: {rem.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {rem.description}
                </p>
              </div>
            ))}

            {/* Classical Specific Dosha Remedies */}
            {shantiRemedies.map((rem, idx) => (
              <div key={`dosha-${idx}`} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-800">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                    {rem.dosha}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    Severity: {rem.severity}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Deity Puja:</span>
                    <span className="text-slate-200">{rem.deityPuja}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Japa Mantra:</span>
                    <span className="text-amber-200 font-serif italic">{rem.mantra}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Charitable Action:</span>
                    <span className="text-slate-200">{rem.gemstoneOrCharity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Lifestyle Practice:</span>
                    <span className="text-slate-200">{rem.lifestyleAdvice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
