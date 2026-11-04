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
} from "lucide-react";
import { VedicBenchmarkRunner, VedicSuiteReport, TestCaseResult } from "@/lib/vedic/vedicBenchmarkTests";
import { VedicChartData } from "@/lib/astronomy/vedic";

interface VedicBenchmarkPanelProps {
  vedicData?: VedicChartData;
  birthDate?: string;
  birthTime?: string;
}

export const VedicBenchmarkPanel: React.FC<VedicBenchmarkPanelProps> = ({
  vedicData,
  birthDate,
  birthTime,
}) => {
  const [selectedChartMode, setSelectedChartMode] = useState<"current" | "avatar" | "synthetic">("current");
  const [selectedCategory, setSelectedCategory] = useState<"All" | "Ashtakavarga" | "Shadbala" | "Avasthas" | "Classical Benchmark">("All");
  const [copied, setCopied] = useState(false);
  const [runIteration, setRunIteration] = useState(0);

  // Initialize runner
  const runner = useMemo(() => new VedicBenchmarkRunner(), []);

  // Prepare input chart based on mode
  const currentChartInput = useMemo(() => {
    if (selectedChartMode === "avatar") {
      return {
        ascendant: 95.0, // Cancer
        planets: {
          Sun: { longitude: 10.0 }, // Exalted Aries 10°
          Moon: { longitude: 93.0 }, // Cancer 3°
          Mars: { longitude: 298.0 }, // Exalted Capricorn 28°
          Mercury: { longitude: 25.0 }, // Aries 25°
          Jupiter: { longitude: 95.0 }, // Exalted Cancer 5°
          Venus: { longitude: 357.0 }, // Exalted Pisces 27°
          Saturn: { longitude: 200.0 }, // Exalted Libra 20°
        },
      };
    }

    if (selectedChartMode === "synthetic") {
      return {
        ascendant: 0.0,
        planets: {
          Sun: { longitude: 30.0 },
          Moon: { longitude: 60.0 },
          Mars: { longitude: 90.0 },
          Mercury: { longitude: 120.0 },
          Jupiter: { longitude: 150.0 },
          Venus: { longitude: 180.0 },
          Saturn: { longitude: 210.0 },
        },
      };
    }

    // Default to currently loaded native chart
    if (vedicData) {
      const planetsRecord: Record<string, { longitude: number; isRetrograde?: boolean; speed?: number }> = {};
      vedicData.planets.forEach((p) => {
        planetsRecord[p.name] = {
          longitude: p.siderealLongitude,
          isRetrograde: p.isRetrograde,
          speed: 1.0, // default or speed if available
        };
      });

      return {
        ascendant: vedicData.lagna?.siderealLongitude || 0,
        planets: planetsRecord,
        birthDate: birthDate ? new Date(`${birthDate}T${birthTime || "12:00"}:00Z`) : undefined,
      };
    }

    return undefined;
  }, [selectedChartMode, vedicData, birthDate, birthTime]);

  // Execute test report whenever mode or iteration triggers
  const report: VedicSuiteReport = useMemo(() => {
    // runIteration dependency ensures re-run capability
    return runner.runFullSuite(currentChartInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runner, currentChartInput, runIteration]);

  // Filter test results
  const filteredResults = useMemo(() => {
    if (selectedCategory === "All") return report.results;
    return report.results.filter((r) => r.category === selectedCategory);
  }, [report, selectedCategory]);

  const handleCopyReport = () => {
    const md = [
      `# Vedic Astrological Mathematical Benchmark Report`,
      `**Generated:** ${report.timestamp}`,
      `**Total Tests:** ${report.totalTests} | **Passed:** ${report.passedCount} | **Failed:** ${report.failedCount}`,
      `**Pass Rate:** ${report.passRatePercent}% in ${report.durationMs}ms`,
      `**Test Mode:** ${selectedChartMode.toUpperCase()}`,
      ``,
      `| ID | Category | Test Name | Shastra Ref | Expected | Actual | Status |`,
      `|---|---|---|---|---|---|---|`,
      ...report.results.map(
        (r) =>
          `| ${r.id} | ${r.category} | ${r.name} | ${r.shastraReference} | ${r.expected} | ${r.actual} | ${r.passed ? "PASSED" : "FAILED"} |`
      ),
    ].join("\n");

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Shastric Invariant Engine
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Zap className="w-3 h-3 text-amber-400" />
                {report.durationMs}ms Fast Eval
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              Automated Vedic Testing & Verification Suite
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              100% rigorous validation of Parashari rules against classical texts (Brihat Parashara Hora Shastra, Sripathi Paddhati). Verifies the 337-point Sarvashtakavarga constant, individual donor points, 6-fold Virupa thresholds, and odd/even Baladi reversals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setRunIteration((prev) => prev + 1)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Re-Run All Assertions
            </button>

            <button
              onClick={handleCopyReport}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Report Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Audit Markdown</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Metric Badges Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Total Invariant Tests
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-100 font-mono">
                {report.totalTests}
              </span>
              <span className="text-xs text-slate-500 font-normal">Assertions</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-emerald-900/40 rounded-xl p-4">
            <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block">
              Pass Rate
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                {report.passRatePercent}%
              </span>
              <span className="text-xs text-emerald-500/80 font-normal">
                {report.passedCount}/{report.totalTests} Passed
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Failures / Anomalies
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-2xl font-bold font-mono ${
                  report.failedCount === 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {report.failedCount}
              </span>
              <span className="text-xs text-slate-500 font-normal">Zero Deviations</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-amber-900/30 rounded-xl p-4">
            <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider block">
              Execution Speed
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-amber-300 font-mono">
                {report.durationMs}
              </span>
              <span className="text-xs text-amber-500/80 font-normal">milliseconds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Horoscope Selector */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300">Test Horoscope Context:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedChartMode("current")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedChartMode === "current"
                ? "bg-amber-500/20 text-amber-200 border border-amber-500/40"
                : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60"
            }`}
          >
            Current Birth Chart ({vedicData?.lagna?.rasiName || "Mesha"} Lagna)
          </button>
          <button
            onClick={() => setSelectedChartMode("avatar")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedChartMode === "avatar"
                ? "bg-amber-500/20 text-amber-200 border border-amber-500/40"
                : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60"
            }`}
          >
            Exalted Avatar Benchmark (BPHS Exemplar)
          </button>
          <button
            onClick={() => setSelectedChartMode("synthetic")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedChartMode === "synthetic"
                ? "bg-amber-500/20 text-amber-200 border border-amber-500/40"
                : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60"
            }`}
          >
            Equal-Span Synthetic Benchmark
          </button>
        </div>
      </div>

      {/* Category Tabs Strip */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: "All", label: "All Tests", count: report.totalTests },
          { id: "Ashtakavarga", label: "Ashtakavarga (अष्टकवर्ग)", count: report.categories.ashtakavarga.total },
          { id: "Shadbala", label: "Shadbala (षड्बल)", count: report.categories.shadbala.total },
          { id: "Avasthas", label: "Planetary Avasthas (अवस्था)", count: report.categories.avasthas.total },
          { id: "Classical Benchmark", label: "Avatar Benchmarks", count: report.categories.benchmarks.total },
        ].map((tab) => {
          const active = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                active
                  ? "bg-amber-500/20 text-amber-200 border border-amber-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  active ? "bg-amber-500/30 text-amber-300" : "bg-slate-800 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results Table & Details */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Test ID & Name</th>
                <th className="py-3 px-4">Engine Category</th>
                <th className="py-3 px-4">Classical Shastra Ref</th>
                <th className="py-3 px-4">Expected Value</th>
                <th className="py-3 px-4">Actual Engine Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal text-slate-300">
              {filteredResults.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Status Pill */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {item.passed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold font-mono text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold font-mono text-[11px]">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        FAIL
                      </span>
                    )}
                  </td>

                  {/* Test ID & Name */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <span className="font-mono text-amber-400/80 text-[11px]">{item.id}</span>
                      <span>{item.name}</span>
                    </div>
                    {item.notes && (
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {item.notes}
                      </p>
                    )}
                  </td>

                  {/* Engine Category */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[11px] border border-slate-700">
                      {item.category}
                    </span>
                  </td>

                  {/* Classical Shastra Reference */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-amber-300/90 font-medium">
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      <span>{item.shastraReference}</span>
                    </div>
                  </td>

                  {/* Expected */}
                  <td className="py-3 px-4 font-mono text-slate-400 max-w-xs break-words">
                    {item.expected}
                  </td>

                  {/* Actual */}
                  <td className="py-3 px-4 font-mono font-medium max-w-xs break-words">
                    <span
                      className={item.passed ? "text-emerald-300" : "text-rose-300 font-bold"}
                    >
                      {item.actual}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shastric Principles Deep-Dive Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2">
            <Award className="w-4 h-4 text-amber-400" />
            Ashtakavarga 337 Law
          </h4>
          <p className="text-[12px] text-slate-400 leading-relaxed">
            The mathematical total of 7 planetary Bhinnashtakavargas is immutable: Sun (48) + Moon (49) + Mars (39) + Mercury (54) + Jupiter (56) + Venus (52) + Saturn (39) = exactly 337 bindus. Lagna adds 49 points.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Shadbala 6-Fold Virupas
          </h4>
          <p className="text-[12px] text-slate-400 leading-relaxed">
            Measures Positional (Sthana), Directional (Dig), Temporal (Kala), Motional (Cheshta), Natural (Naisargika), and Aspectual (Drik) strengths. Standard required minimum thresholds (Rupas) are strictly maintained.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Baladi Odd/Even Inversion
          </h4>
          <p className="text-[12px] text-slate-400 leading-relaxed">
            Odd signs progress through Bala (0°-6°), Kumara (6°-12°), Yuva (12°-18°), Vriddha (18°-24°), and Mrita (24°-30°). Even signs invert this order: 0°-6° is Mrita, and 24°-30° is Bala.
          </p>
        </div>
      </div>
    </div>
  );
};
