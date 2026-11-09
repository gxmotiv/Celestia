"use client";

import React, { useState, useMemo } from "react";
import { WesternChartData } from "@/lib/astronomy/ephemeris";
import { VedicChartData } from "@/lib/astronomy/vedic";
import { BaZiProfile } from "@/lib/astronomy/chinese";
import { NumerologyProfile } from "@/lib/astronomy/numerology";
import {
  MultiSystemBenchmarkRunner,
  MultiSystemReport,
  SystemTestAssertion,
} from "@/lib/astronomy/multiSystemBenchmarkTests";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Search,
  Orbit,
  Moon,
  Target,
  Compass,
  Hash,
  Sparkles,
  BookOpen,
  HelpCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface MultiSystemVerificationPanelProps {
  westernData?: WesternChartData;
  vedicData?: VedicChartData;
  baziData?: BaZiProfile;
  numerologyData?: NumerologyProfile;
}

export function MultiSystemVerificationPanel({
  westernData,
  vedicData,
  baziData,
  numerologyData,
}: MultiSystemVerificationPanelProps) {
  const [activeTab, setActiveTab] = useState<"assertions" | "formulas">("assertions");
  const [selectedSystem, setSelectedSystem] = useState<
    "All" | "Western" | "Vedic" | "KP" | "BaZi" | "Numerology"
  >("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "passed" | "failed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [runIteration, setRunIteration] = useState(0);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  // Initialize and run the 108 assertions
  const runner = useMemo(() => new MultiSystemBenchmarkRunner(), []);
  const report: MultiSystemReport = useMemo(() => {
    void runIteration;
    return runner.runFullSuite({
      western: westernData,
      vedic: vedicData,
      bazi: baziData,
      numerology: numerologyData,
    });
  }, [runner, westernData, vedicData, baziData, numerologyData, runIteration]);

  // Filtered assertions
  const filteredAssertions = useMemo(() => {
    return report.assertions.filter((a) => {
      if (selectedSystem !== "All" && a.system !== selectedSystem) return false;
      if (statusFilter === "passed" && !a.passed) return false;
      if (statusFilter === "failed" && a.passed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.classicalAuthority.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [report.assertions, selectedSystem, statusFilter, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedTestId((prev) => (prev === id ? null : id));
  };

  const getSystemIcon = (system: string) => {
    switch (system) {
      case "Western":
        return <Orbit className="w-3.5 h-3.5 text-amber-400" />;
      case "Vedic":
        return <Moon className="w-3.5 h-3.5 text-amber-300" />;
      case "KP":
        return <Target className="w-3.5 h-3.5 text-cyan-400" />;
      case "BaZi":
        return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
      case "Numerology":
        return <Hash className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO VERIFICATION BANNER */}
      <div className="p-6 bg-gradient-to-br from-emerald-950/30 via-slate-900/80 to-slate-950/90 border border-emerald-500/30 rounded-2xl shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-3xl font-bold text-emerald-300 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Internal Calculation Check Center
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {report.executionTimeMs}ms
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mt-1">
                108 Internal Mathematical & Rule Assertions
              </h2>
              <p className="text-xs text-slate-300">
                Internal assertions check selected formulas, arithmetic invariants, and rule-level examples across Western, Vedic Jyotish, KP, BaZi, and Numerology.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block">Pass Rate</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {report.passRatePercentage}%
              </span>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block">Passed Checks</span>
              <span className="text-xl font-bold font-mono text-slate-100">
                {report.passedCount} / {report.totalAssertions}
              </span>
            </div>
            <button
              onClick={() => setRunIteration((prev) => prev + 1)}
              className="p-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Re-run all 108 internal checks"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Re-Run Suite</span>
            </button>
          </div>
        </div>

              <p className="text-[11px] text-amber-100/80 border-t border-emerald-500/20 pt-3">
                A passing result means only that these selected internal checks passed. It does not independently certify
                ephemeris accuracy, house cusps, historical civil-time data, every tradition-specific rule, or predictive validity.
              </p>

        {/* 5-Tradition Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-800/80">
          {[
            { key: "Western", label: "Western Astrology", total: report.systemBreakdown.Western.total, passed: report.systemBreakdown.Western.passed, icon: Orbit, color: "text-amber-400" },
            { key: "Vedic", label: "Vedic Jyotish", total: report.systemBreakdown.Vedic.total, passed: report.systemBreakdown.Vedic.passed, icon: Moon, color: "text-amber-300" },
            { key: "KP", label: "KP System", total: report.systemBreakdown.KP.total, passed: report.systemBreakdown.KP.passed, icon: Target, color: "text-cyan-400" },
            { key: "BaZi", label: "Chinese BaZi", total: report.systemBreakdown.BaZi.total, passed: report.systemBreakdown.BaZi.passed, icon: Compass, color: "text-emerald-400" },
            { key: "Numerology", label: "Numerology", total: report.systemBreakdown.Numerology.total, passed: report.systemBreakdown.Numerology.passed, icon: Hash, color: "text-purple-400" },
          ].map((sys) => {
            const Icon = sys.icon;
            const isAllPassed = sys.passed === sys.total;
            return (
              <div
                key={sys.key}
                onClick={() => setSelectedSystem(sys.key as any)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  selectedSystem === sys.key
                    ? "bg-slate-800/80 border-emerald-500/60 shadow"
                    : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${sys.color}`} />
                    <span className="text-[11px] font-semibold text-slate-200">{sys.key}</span>
                  </div>
                  {isAllPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-[10px] text-slate-400">{sys.label}</span>
                  <span className="text-xs font-mono font-bold text-slate-100">
                    {sys.passed}/{sys.total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SUB-NAVIGATION: ASSERTIONS VS FORMULA GUIDE */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("assertions")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "assertions"
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Internal Assertions ({report.totalAssertions})</span>
          </button>

          <button
            onClick={() => setActiveTab("formulas")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "formulas"
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Classical & Mathematical Formula Guide</span>
          </button>
        </div>

        {activeTab === "assertions" && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* System Filter */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 border border-slate-800 rounded-lg text-xs">
              {["All", "Western", "Vedic", "KP", "BaZi", "Numerology"].map((sys) => (
                <button
                  key={sys}
                  onClick={() => setSelectedSystem(sys as any)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                    selectedSystem === sys
                      ? "bg-slate-800 text-slate-100 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {sys}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 border border-slate-800 rounded-lg text-xs">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2 py-1 rounded text-[11px] font-medium ${
                  statusFilter === "all" ? "bg-slate-800 text-slate-100" : "text-slate-400"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("passed")}
                className={`px-2 py-1 rounded text-[11px] font-medium ${
                  statusFilter === "passed" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400"
                }`}
              >
                Passed ({report.passedCount})
              </button>
              {report.failedCount > 0 && (
                <button
                  onClick={() => setStatusFilter("failed")}
                  className={`px-2 py-1 rounded text-[11px] font-medium ${
                    statusFilter === "failed" ? "bg-rose-500/20 text-rose-300" : "text-slate-400"
                  }`}
                >
                  Failed ({report.failedCount})
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assertions..."
                className="pl-8 pr-3 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-40 sm:w-52"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. TAB CONTENT */}
      {activeTab === "assertions" ? (
        /* ASSERTIONS TABLE */
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing {filteredAssertions.length} of {report.totalAssertions} assertions
            </span>
            <span className="text-xs text-slate-500">Click any row to reveal classical notes & mathematical proof</span>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-2 text-left">ID</th>
                  <th className="py-2.5 px-3 text-left">System</th>
                  <th className="py-2.5 px-3 text-left">Test Name</th>
                  <th className="py-2.5 px-3 text-left">Classical Authority</th>
                  <th className="py-2.5 px-3 text-left">Expected Formula / Bound</th>
                  <th className="py-2.5 px-3 text-left">Actual Computed Result</th>
                  <th className="py-2.5 px-2 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAssertions.map((a) => {
                  const isExpanded = expandedTestId === a.id;
                  return (
                    <React.Fragment key={a.id}>
                      <tr
                        onClick={() => toggleExpand(a.id)}
                        className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${
                          isExpanded ? "bg-slate-800/20" : ""
                        }`}
                      >
                        <td className="py-2.5 px-2 text-center">
                          {a.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 inline" />
                          )}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-[11px] text-slate-400">{a.id}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 font-medium text-slate-200">
                            {getSystemIcon(a.system)}
                            <span>{a.system}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-100">{a.name}</td>
                        <td className="py-2.5 px-3 text-slate-400">{a.classicalAuthority}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                          {a.expectedFormula}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-amber-300">
                          {a.actualResult}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-500">
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 inline" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 inline" />
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-950/60">
                          <td colSpan={8} className="p-3.5 border-b border-slate-800">
                            <div className="text-xs space-y-1.5 pl-6 border-l-2 border-emerald-500/50">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-200">Category:</span>
                                <span className="text-slate-400">{a.category}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-200">Classical Rationale: </span>
                                <span className="text-slate-300">{a.notes}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CLASSICAL & MATHEMATICAL FORMULA GUIDE */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Western Astrological Formulas */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Orbit className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">Western Classical Mechanics</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-semibold text-amber-300 block mb-1">
                  1. Placidus Semi-Arc Trisecting Algorithm
                </span>
                <p className="font-mono text-[11px] text-slate-400">
                  RAMC = GMST * 15 + Longitude; ASC = arctan2(-cos(RAMC), sin(RAMC)*cos(ε) + tan(φ)*sin(ε))
                </p>
                <p className="mt-1 text-slate-400">
                  Trisects diurnal and nocturnal semi-arcs. Polar latitude fallback to Porphyry prevents imaginary division.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-semibold text-amber-300 block mb-1">
                  2. Almuten Figuris (Ibn Ezra & Lilly)
                </span>
                <p className="font-mono text-[11px] text-slate-400">
                  Score = Domicile(+5) + Exalt(+4) + Triplicity(+3) + Term(+2) + Face(+1) + HouseAccidental(+1..+12) + Day/Hour(+7/+6)
                </p>
                <p className="mt-1 text-slate-400">
                  Evaluated across the 5 Hylegical points: ASC, Sun, Moon, Part of Fortune, and Pre-natal Syzygy (SAN).
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-semibold text-amber-300 block mb-1">
                  3. Solar Proximity (Cazimi vs Combustion)
                </span>
                <p className="text-slate-400">
                  Cazimi (&le; 17&apos; arc): planet in the heart of the Sun, immensely fortified. Combust (&le; 8&deg;30&apos;): planet weakened by solar heat. Under the Beams (&le; 17&deg;): hidden from vision.
                </p>
              </div>
            </div>
          </div>

          {/* Vedic Jyotish Formulas */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-amber-300" />
              <h3 className="text-sm font-bold text-slate-100">Vedic Parashari & Jaimini Rigor</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-semibold text-amber-300 block mb-1">
                  1. Lahiri Nirayana Sidereal Conversion
                </span>
                <p className="font-mono text-[11px] text-slate-400">
                  λ_sidereal = (λ_tropical - Ayanamsha) mod 360° (Lahiri 23°51&apos;11&quot; at J2000.0)
                </p>
                <p className="mt-1 text-slate-400">
                  Anchored to Spica (Chitra at 180°00&apos;00&quot;). Computes all 16 Divisional Shodashavargas (D1 to D60).
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-semibold text-amber-300 block mb-1">
                  2. Sarvashtakavarga 337-Bindu Universal Invariant
                </span>
                <p className="font-mono text-[11px] text-slate-400">
                  SAV = Sun(48) + Moon(49) + Mars(39) + Merc(54) + Jup(56) + Ven(52) + Sat(39) = 337 Bindus
                </p>
                <p className="mt-1 text-slate-400">
                  Strictly conserved across all charts prior to Trikona and Ekadhipatya Shodhana reductions.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-semibold text-amber-300 block mb-1">
                  3. Jaimini 7 Chara Karakas
                </span>
                <p className="text-slate-400">
                  Planets ordered by decreasing degree within sign (0° to 30°): Atmakaraka (AK), Amatyakaraka (AmK), Bhratrikaraka (BK), Matrikaraka (MK), Putrakaraka (PK), Gnatikaraka (GK), Darakaraka (DK).
                </p>
              </div>
            </div>
          </div>

          {/* Krishnamurti Paddhati (KP) Formulas */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">Krishnamurti Paddhati (KP System)</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-semibold text-cyan-300 block mb-1">
                  1. Stellar Sub-Lord Arc Partition
                </span>
                <p className="font-mono text-[11px] text-slate-400">
                  Sub-Arc = 13°20&apos; * (Planet Dasha Years / 120 Years)
                </p>
                <p className="mt-1 text-slate-400">
                  Divides 27 constellations into 249 distinct stellar sub-divisions covering 360° continuously.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-semibold text-cyan-300 block mb-1">
                  2. 4-Fold Significators Hierarchy
                </span>
                <p className="text-slate-400">
                  Grade A: Planet in constellation of house occupant (Supreme). Grade B: House occupant. Grade C: Planet in constellation of house lord. Grade D: House lord.
                </p>
              </div>
            </div>
          </div>

          {/* Chinese BaZi & Numerology Formulas */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Chinese BaZi & Universal Numerology</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-semibold text-emerald-300 block mb-1">
                  1. BaZi Solar Term Lichun Boundary
                </span>
                <p className="font-mono text-[11px] text-slate-400">
                  Year changes when Solar Ecliptic Longitude = 315° (Lichun ~Feb 4)
                </p>
                <p className="mt-1 text-slate-400">
                  Solar astronomical year boundary, independent of Lunar Chinese New Year.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-semibold text-purple-300 block mb-1">
                  2. Pythagorean Period-by-Period Reduction
                </span>
                <p className="font-mono text-[11px] text-slate-400">
                  Life Path = Reduce(Month) + Reduce(Day) + Reduce(Year), preserving 11, 22, 33
                </p>
                <p className="mt-1 text-slate-400">
                  Prevents improper flattening of Master Numbers. Detects Karmic Debt Numbers (13, 14, 16, 19).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
