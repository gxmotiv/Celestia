"use client";

import React, { useState } from "react";
import { WesternChartData } from "@/lib/astronomy/ephemeris";
import { Shield, Clock, Sun, Moon, Sparkles, Award, Star, Compass, Info, CheckCircle2 } from "lucide-react";

interface AlmutenHoursPanelProps {
  chartData: WesternChartData;
}

export function AlmutenHoursPanel({ chartData }: AlmutenHoursPanelProps) {
  const [activeTab, setActiveTab] = useState<"almuten" | "hours">("almuten");
  const almuten = chartData.almutenFiguris;
  const hours = chartData.planetaryHours;

  if (!almuten || !hours) {
    return (
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl text-center text-slate-400">
        Almuten Figuris and Planetary Hours data are being computed...
      </div>
    );
  }

  const topPlanet = almuten.scores[0] ?? null;
  const runnerUpPlanet = almuten.scores[1] ?? null;

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("almuten")}
          className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === "almuten"
              ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Almuten Figuris (Ruler of Geniture)</span>
        </button>
        <button
          onClick={() => setActiveTab("hours")}
          className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === "hours"
              ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Planetary Hours & Day Ruler</span>
        </button>
      </div>

      {activeTab === "almuten" ? (
        <div className="space-y-6">
          {/* Sovereign Almuten Figuris Hero Card */}
          <div className="p-6 bg-gradient-to-br from-amber-950/30 via-slate-900/80 to-slate-950/90 border border-amber-500/30 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-3xl font-bold text-amber-300 shadow-inner">
                  {almuten.almutenSymbol}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      Top-ranked planet · Celestia Almuten
                    </span>
                    <span className="text-xs text-slate-400">Rank #1</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-100 mt-1">
                    {almuten.almutenFiguris}
                  </h3>
                  <p className="text-xs text-amber-200/80">
                    Celestia weighted total: {almuten.almutenScore} pts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-right">
                  <span className="text-[10px] text-slate-400 block">Rank 1 · Almuten score</span>
                  <span className="text-sm font-bold text-amber-300">{topPlanet?.planet ?? "—"}</span>
                  <span className="text-[10px] text-slate-500 block">{topPlanet?.totalScore ?? 0} pts</span>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-right">
                  <span className="text-[10px] text-slate-400 block">Rank 2 · Runner-up</span>
                  <span className="text-sm font-bold text-cyan-300">{runnerUpPlanet?.planet ?? "—"}</span>
                  <span className="text-[10px] text-slate-500 block">{runnerUpPlanet?.totalScore ?? 0} pts</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-800/80 pt-3">
              <p className="text-xs text-slate-300 leading-relaxed">{almuten.significance}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">{almuten.methodNote}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Pre-Natal Syzygy (SAN)</span>
                <span className="text-xs font-semibold text-slate-200">{almuten.sanFormatted}</span>
                <span className="text-[10px] text-amber-400/90 block">({almuten.sanType}) · {almuten.sanDaysBeforeBirth.toFixed(2)} days before birth</span>
                <span className="text-[9px] text-slate-500 block">UTC: {almuten.sanUtcInstant}</span>
              </div>
              <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Day ruler · +7 custom pts</span>
                <span className="text-xs font-semibold text-slate-200">{almuten.dayRuler ?? "Unavailable (polar conditions)"}</span>
              </div>
              <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Hour ruler · +6 custom pts</span>
                <span className="text-xs font-semibold text-slate-200">{almuten.hourRuler ?? "Unavailable (polar conditions)"}</span>
              </div>
              <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Sect Determination</span>
                <span className="text-xs font-semibold text-slate-200">
                  {hours.isBirthInDaytime ? "Diurnal (Day Chart)" : "Nocturnal (Night Chart)"}
                </span>
              </div>
            </div>
          </div>

          {/* 5 Hylegical / Candidate Points Table */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Five Almuten Candidate Points
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selected point rulers: domicile (+5), exaltation (+4), active Dorothean triplicity (+3), Egyptian term (+2), Chaldean face (+1). House and temporal additions use Celestia-specific weights.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-3 text-left">Hylegical Point</th>
                    <th className="py-2.5 px-3 text-left">Sign Degree</th>
                    <th className="py-2.5 px-3 text-left">Domicile (+5)</th>
                    <th className="py-2.5 px-3 text-left">Exaltation (+4)</th>
                    <th className="py-2.5 px-3 text-left">Triplicity (+3)</th>
                    <th className="py-2.5 px-3 text-left">Term (+2)</th>
                    <th className="py-2.5 px-3 text-left">Face (+1)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {almuten.points.map((pt, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{pt.name}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-300">{pt.degreeFormatted}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-100">{pt.domicile}</td>
                      <td className="py-2.5 px-3 text-slate-300">{pt.exaltation}</td>
                      <td className="py-2.5 px-3 text-cyan-300">{pt.triplicity}</td>
                      <td className="py-2.5 px-3 text-slate-300">{pt.term}</td>
                      <td className="py-2.5 px-3 text-slate-400">{pt.face}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Planetary Scores Table */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Complete Dignity Scoring Matrix for the 7 Traditional Planets
            </h4>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-2 text-center">Rank</th>
                    <th className="py-2.5 px-3 text-left">Planet</th>
                    <th className="py-2.5 px-2 text-center">House</th>
                    <th className="py-2.5 px-2 text-center">House Pts</th>
                    <th className="py-2.5 px-2 text-center">Domiciles</th>
                    <th className="py-2.5 px-2 text-center">Exalts</th>
                    <th className="py-2.5 px-2 text-center">Triplicities</th>
                    <th className="py-2.5 px-2 text-center">Terms</th>
                    <th className="py-2.5 px-2 text-center">Faces</th>
                    <th className="py-2.5 px-2 text-center">Day/Hour</th>
                    <th className="py-2.5 px-3 text-right">Total Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {almuten.scores.map((sc) => {
                    const isWinner = sc.rank === 1;
                    return (
                      <tr
                        key={sc.planet}
                        className={`transition-colors ${
                          isWinner ? "bg-amber-500/10 font-bold" : "hover:bg-slate-800/30"
                        }`}
                      >
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] ${
                              isWinner
                                ? "bg-amber-500 text-slate-950 font-bold"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            #{sc.rank}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-400 text-sm font-semibold">{sc.symbol}</span>
                            <span className={isWinner ? "text-amber-200" : "text-slate-200"}>
                              {sc.planet}
                            </span>
                            {isWinner && (
                              <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1 rounded border border-amber-500/30 ml-1">
                                Almuten
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-400">H{sc.house}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-cyan-300">+{sc.accidentalScore}</td>
                        <td className="py-2.5 px-2 text-center text-slate-300">+{sc.breakdown.domiciles}</td>
                        <td className="py-2.5 px-2 text-center text-slate-300">+{sc.breakdown.exaltations}</td>
                        <td className="py-2.5 px-2 text-center text-slate-300">+{sc.breakdown.triplicities}</td>
                        <td className="py-2.5 px-2 text-center text-slate-300">+{sc.breakdown.terms}</td>
                        <td className="py-2.5 px-2 text-center text-slate-300">+{sc.breakdown.faces}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-emerald-400">
                          {sc.dayHourBonus > 0 ? `+${sc.dayHourBonus}` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300 text-sm">
                          {sc.totalScore}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Planetary Hours & Day Ruler View */
        <div className="space-y-6">
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Day Ruler</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-amber-400 text-sm font-bold">{hours.dayRulerSymbol}</span>
                  <span className="text-sm font-bold text-slate-100">{hours.dayRuler ?? "Unavailable"}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Current Hour Ruler at Birth</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-cyan-400 text-sm font-bold">{hours.currentHourRulerSymbol}</span>
                  <span className="text-sm font-bold text-slate-100">{hours.currentHourRuler ?? "Unavailable"}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Sunrise / Sunset</span>
                <span className="text-xs font-semibold text-slate-200 block mt-0.5 font-mono">
                  {hours.sunriseTime} / {hours.sunsetTime}
                </span>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Hour Duration (Day / Night)</span>
                <span className="text-xs font-semibold text-slate-200 block mt-0.5 font-mono">
                  {hours.dayHourDurationMinutes === null || hours.nightHourDurationMinutes === null
                    ? "Unavailable"
                    : `${hours.dayHourDurationMinutes}m / ${hours.nightHourDurationMinutes}m`}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Classical planetary hours follow the descending Chaldean sequence: Saturn → Jupiter → Mars → Sun → Venus → Mercury → Moon.
              On ordinary dates, each day has 12 unequal diurnal hours (sunrise to sunset) and 12 nocturnal hours (sunset to sunrise). Polar dates without a sunrise/sunset pair are disclosed below rather than assigned zero-length hours.
            </p>
          </div>

          {hours.hoursAvailable ? (
            {/* 24 Unequal Hours Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Diurnal Hours */}
              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5" />
                  12 Diurnal Hours (Daytime)
                </h4>
                <div className="space-y-1">
                  {hours.hours
                    .filter((h) => h.isDayHour)
                    .map((h) => (
                      <div
                        key={h.hourNumber}
                        className={`flex items-center justify-between p-2 rounded text-xs transition-colors ${
                          h.isCurrentBirthHour
                            ? "bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold"
                            : "hover:bg-slate-800/40 text-slate-300"
                        }`}
                      >
                        <span className="text-slate-400 font-mono">Hour {h.hourNumber}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 font-semibold">{h.rulerSymbol}</span>
                          <span>{h.ruler}</span>
                          {h.isCurrentBirthHour && (
                            <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1 py-0.2 rounded font-normal">
                              Birth Hour
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {h.startTime} – {h.endTime}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
  
              {/* Nocturnal Hours */}
              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5" />
                  12 Nocturnal Hours (Nighttime)
                </h4>
                <div className="space-y-1">
                  {hours.hours
                    .filter((h) => !h.isDayHour)
                    .map((h) => (
                      <div
                        key={h.hourNumber}
                        className={`flex items-center justify-between p-2 rounded text-xs transition-colors ${
                          h.isCurrentBirthHour
                            ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 font-bold"
                            : "hover:bg-slate-800/40 text-slate-300"
                        }`}
                      >
                        <span className="text-slate-400 font-mono">Hour {h.hourNumber}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-cyan-400 font-semibold">{h.rulerSymbol}</span>
                          <span>{h.ruler}</span>
                          {h.isCurrentBirthHour && (
                            <span className="text-[9px] bg-cyan-500/30 text-cyan-300 px-1 py-0.2 rounded font-normal">
                              Birth Hour
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {h.startTime} – {h.endTime}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div role="status" className="rounded-xl border border-amber-700/30 bg-amber-950/20 p-4 text-xs text-amber-100/90">
              {hours.availabilityNote}
              <span className="block text-slate-400 mt-2">No day/hour ruler or 24 unequal-hour schedule has been invented for this date.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
