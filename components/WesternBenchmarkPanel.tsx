"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  BookOpen,
  ShieldCheck,
  Award,
  Zap,
  Sliders,
  Sparkles,
  ClipboardCheck,
  Check,
  HelpCircle,
  Orbit,
  Compass,
  Star,
  Globe,
  Clock,
  Layers,
} from "lucide-react";
import {
  WesternBenchmarkRunner,
  WesternSuiteReport,
  WesternTestCaseResult,
} from "@/lib/astronomy/westernBenchmarkTests";
import { WesternChartData } from "@/lib/astronomy/ephemeris";

interface WesternBenchmarkPanelProps {
  chartData?: WesternChartData;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
}

export const WesternBenchmarkPanel: React.FC<WesternBenchmarkPanelProps> = ({
  chartData,
  fullName = "Native",
  birthDate,
  birthTime,
}) => {
  const [selectedChartMode, setSelectedChartMode] = useState<"current" | "leonardo" | "j2000">("current");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copied, setCopied] = useState(false);
  const [runIteration, setRunIteration] = useState(0);

  // Initialize test runner
  const runner = useMemo(() => new WesternBenchmarkRunner(), []);

  // Compute test report
  const report: WesternSuiteReport = useMemo(() => {
    // Re-run whenever runIteration, chartData, or selectedChartMode changes
    void runIteration;
    return runner.runFullSuite(selectedChartMode === "current" ? chartData : undefined);
  }, [runner, chartData, selectedChartMode, runIteration]);

  // Categories list
  const categoriesList = useMemo(() => {
    return [
      "All",
      "Astronomical Ephemeris & Houses",
      "Aspects & Orbs",
      "Predictive Hellenistic",
      "Advanced Systems & Harmonics",
      "Relationship Astrology",
      "Classical Benchmark Verification",
    ];
  }, []);

  // Filtered results
  const filteredResults = useMemo(() => {
    if (selectedCategory === "All") return report.results;
    return report.results.filter((r) => r.category === selectedCategory);
  }, [report.results, selectedCategory]);

  const handleCopyReport = () => {
    const text = `CELESTIA Western Astrology Calculation Checks
Timestamp: ${report.timestamp}
Pass Rate: ${report.passRatePercent}% (${report.passedCount}/${report.totalTests} Tests Passed)
Execution Time: ${report.durationMs}ms
Checks run (internal regression tests only):
- Coordinate ranges, house structure, and nodal invariants
- Aspect and chart-structure arithmetic
- Dasha and timing implementation checks
- Relationship-chart and traditional-rule consistency checks
- Internal invariant checks for configured astrology systems
- Regression checks do not compare every output with an independent ephemeris.
Not an independent ephemeris accuracy certification. Planetary positions use astronomy-engine; custom node, house, and ayanamsa calculations need separate reference validation.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Western Astrology Calculation Check Suite
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {report.passRatePercent}% Checks passed
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Internal regression checks · external astronomical accuracy validation pending
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setRunIteration((c) => c + 1)}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Re-run 27 Tests
          </button>
          <button
            onClick={handleCopyReport}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Export Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Test Suite Status
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {report.passedCount}/{report.totalTests}
            </span>
            <span className="text-xs text-emerald-300/80 font-medium">checks passed</span>
          </div>
          <span className="text-[10px] text-slate-400 block">No failures in these checks; astronomical accuracy is not measured here</span>
        </div>

        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Calculation check run time
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-amber-400">
              {report.durationMs}
            </span>
            <span className="text-xs text-slate-400 font-mono">ms</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Modelled geocentric positions; no per-result precision guarantee</span>
        </div>

        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            House Calculation Status
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-blue-400">Custom model</span>
            <span className="text-xs text-blue-300/80 font-medium">Error bound not validated</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Independent house benchmark pending</span>
        </div>

        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-purple-400" />
            Astrological Authority
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-purple-400">14 Engines</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Ptolemy, Kepler, Valens, Ebertin</span>
        </div>
      </div>

      {/* Chart Selector Mode */}
      <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          Benchmark Subject Chart:
        </span>
        <div className="flex items-center gap-1.5">
          {[
            { id: "current", label: `Active Profile (${fullName})` },
            { id: "leonardo", label: "Leonardo da Vinci (1452 Historic)" },
            { id: "j2000", label: "Greenwich J2000.0 Epoch Standard" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedChartMode(mode.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedChartMode === mode.id
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categoriesList.map((cat) => {
          const count =
            cat === "All"
              ? report.totalTests
              : report.categories[cat]?.total || 0;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <span>{cat}</span>
              <span className="px-1.5 py-0.2 bg-slate-900 text-slate-300 rounded font-mono text-[10px]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Test Cases Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Assertion / Test Name</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">Classical Standard</th>
                <th className="py-3 px-3.5">Expected Standard</th>
                <th className="py-3 px-3.5">Actual Measured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredResults.map((test) => (
                <tr
                  key={test.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-3.5">
                    {test.passed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                        FAIL
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="font-semibold text-slate-100 block">
                      {test.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {test.id}
                    </span>
                    {test.details && (
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        {test.details}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-slate-300 font-medium">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
                      {test.category}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-[11px] text-amber-300/90 font-medium">
                    {test.standardReference}
                  </td>
                  <td className="py-3 px-3.5 font-mono text-[11px] text-slate-300">
                    {test.expected}
                  </td>
                  <td className="py-3 px-3.5 font-mono text-[11px] text-emerald-300 font-medium">
                    {test.actual}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Classical Standards Documentation Footer */}
      <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
        <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Classical Astrological & Astronomical Canonical References
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-400">
          <div className="space-y-1">
            <span className="font-semibold text-slate-200 block">Ptolemy & Spherical Astronomy</span>
            <p>
              Tetrabiblos Books I–IV: Standard 5 Ptolemaic angles (0°, 60°, 90°, 120°, 180°), Horizon/Meridian orthogonality, and Diurnal vs Nocturnal solar sect.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-slate-200 block">Kepler & Modern Harmonics</span>
            <p>
              Johannes Kepler (Harmonices Mundi, 1619) & John Addey (1976): Division of the 360° celestial wave into 5th (quintile), 7th (septile), 8th, and 9th harmonics.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-slate-200 block">Hellenistic & Medieval Mastery</span>
            <p>
              Vettius Valens Anthologies: Annual Profections (12-yr cycle), Zodiacal Releasing from Spirit &amp; Fortune, and Abu Ma&apos;shar&apos;s 75-year Chaldean Firdaria sequence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
