"use client";

import React, { useState } from "react";
import { VedicChartData } from "@/lib/astronomy/vedic";
import { Award, Compass, Star, Shield, ShieldCheck, ShieldAlert, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface ClassicalVedicPanelProps {
  vedicData: VedicChartData;
}

export function ClassicalVedicPanel({ vedicData }: ClassicalVedicPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"jaimini" | "tarabala" | "gocharvedha">("jaimini");

  const jaimini = vedicData.jaiminiKarakas;
  const taraBala = vedicData.taraBala;
  const gochar = vedicData.gocharVedha;

  if (!jaimini || !taraBala || !gochar) {
    return (
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl text-center text-slate-400">
        Classical Vedic modules (Jaimini, Tara Bala, Gochar Vedha) are being computed...
      </div>
    );
  }

  const ak = jaimini.atmakaraka;

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab("jaimini")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSubTab === "jaimini"
              ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Jaimini Chara Karakas (कारक)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("tarabala")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSubTab === "tarabala"
              ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Star className="w-3.5 h-3.5 text-amber-400" />
          <span>Tara Bala (तारा बल 9-Chakra)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("gocharvedha")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSubTab === "gocharvedha"
              ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Gochar Vedha (गोचर वेध Obstruction)</span>
        </button>
      </div>

      {/* 1. JAIMINI CHARA KARAKAS */}
      {activeSubTab === "jaimini" && (
        <div className="space-y-6">
          {/* Atmakaraka Hero Card */}
          <div className="p-6 bg-gradient-to-br from-amber-950/30 via-slate-900/80 to-slate-950/90 border border-amber-500/30 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-3xl font-bold text-amber-300 shadow-inner">
                  {ak.symbol}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      Atmakaraka (AK) · आत्मकारक
                    </span>
                    <span className="text-xs text-slate-400">King of Chart</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-100 mt-1">
                    {ak.planet} ({ak.roleName})
                  </h3>
                  <p className="text-xs text-amber-200/80">
                    Highest Sidereal Arc: {ak.rasiDegreeFormatted} in {ak.sign} (House {ak.house})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-right">
                  <span className="text-[10px] text-slate-400 block">Karakamsa Rasi (कारकांश)</span>
                  <span className="text-sm font-bold text-amber-300">{jaimini.karakamsaSign}</span>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-right">
                  <span className="text-[10px] text-slate-400 block">Karakamsa from Lagna</span>
                  <span className="text-sm font-bold text-cyan-300">House {jaimini.karakamsaHouseFromLagna}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
              {ak.signification} {jaimini.summary}
            </p>
          </div>

          {/* 7 Karakas Grid */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Complete 7-Karaka Council (Jaimini Sutras)
            </h4>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-3 text-left">Role</th>
                    <th className="py-2.5 px-3 text-left">Planet</th>
                    <th className="py-2.5 px-3 text-left">Degree in Sign</th>
                    <th className="py-2.5 px-2 text-center">House</th>
                    <th className="py-2.5 px-3 text-left">Life Domain</th>
                    <th className="py-2.5 px-3 text-left">Classical Signification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {jaimini.karakas.map((k) => (
                    <tr
                      key={k.roleShort}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        k.roleShort === "AK" ? "bg-amber-500/10 font-bold" : ""
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {k.roleShort}
                          </span>
                          <span className="font-semibold text-slate-200">{k.role}</span>
                          <span className="text-[10px] text-slate-500">({k.sanskritName})</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-100">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-400">{k.symbol}</span>
                          <span>{k.planet}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-300">
                        {k.rasiDegreeFormatted} {k.sign}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-300">House {k.house}</td>
                      <td className="py-3 px-3 font-medium text-cyan-300">{k.lifeDomain}</td>
                      <td className="py-3 px-3 text-slate-400 leading-snug">{k.signification}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. TARA BALA (9-TARA CHAKRA) */}
      {activeSubTab === "tarabala" && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Tara Bala Chakra (Nakshatra Constellation Matrix)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reference: Janma Nakshatra is <strong className="text-amber-300">{taraBala.birthNakshatra}</strong>.
                  Evaluates the 9 planetary Taras across the 3 cycles (Janma, Anujanma, Trijanma).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold">
                  {taraBala.auspiciousTarasCount} Auspicious Taras
                </span>
                <span className="text-xs text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded font-semibold">
                  {taraBala.inauspiciousTarasCount} Inauspicious Taras
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              {taraBala.summary}
            </p>
          </div>

          {/* 27 Nakshatras 3-Cycle Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((cycleNum) => {
              const cycleName =
                cycleNum === 1
                  ? "Janma (Cycle 1: 1–9)"
                  : cycleNum === 2
                  ? "Anujanma (Cycle 2: 10–18)"
                  : "Trijanma (Cycle 3: 19–27)";

              const items = taraBala.taraGrid.filter((g) => g.cycleNumber === cycleNum);

              return (
                <div key={cycleNum} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    {cycleName}
                  </h5>

                  <div className="space-y-1.5">
                    {items.map((item) => {
                      const isAuspicious = item.nature === "Auspicious";
                      const isCautionary = item.nature === "Cautionary";

                      return (
                        <div
                          key={item.nakshatraIndex}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                            isAuspicious
                              ? "bg-emerald-950/20 border-emerald-500/30 text-slate-200"
                              : isCautionary
                              ? "bg-amber-950/20 border-amber-500/30 text-slate-200"
                              : "bg-rose-950/20 border-rose-500/30 text-slate-300"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold">{item.nakshatraName}</span>
                              <span className="text-[10px] text-slate-500">({item.nakshatraLord})</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Tara #{item.taraNumber}: {item.taraName} ({item.taraSanskrit})
                            </span>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                                isAuspicious
                                  ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/40"
                                  : isCautionary
                                  ? "text-amber-300 bg-amber-500/15 border-amber-500/40"
                                  : "text-rose-300 bg-rose-500/15 border-rose-500/40"
                              }`}
                            >
                              {item.nature}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              {item.score}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. GOCHAR VEDHA (TRANSIT OBSTRUCTION) */}
      {activeSubTab === "gocharvedha" && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Classical Gochar & Vedha Obstruction Analysis
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluates transiting planets from Natal Moon Sign (Chandra Lagna: <strong className="text-amber-300">{gochar.natalMoonSign}</strong>).
                  Checks whether benefic transits are pure (Shuddha) or obstructed by occupants in paired Vedha houses.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              {gochar.summary}
            </p>
          </div>

          {/* Evaluations Table */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-3 text-left">Transiting Planet</th>
                    <th className="py-2.5 px-2 text-center">House from Moon</th>
                    <th className="py-2.5 px-3 text-left">Benefic House?</th>
                    <th className="py-2.5 px-3 text-left">Transit Status</th>
                    <th className="py-2.5 px-3 text-left">Vedha Obstruction Details</th>
                    <th className="py-2.5 px-3 text-left">Benefic Fruition / Theme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {gochar.evaluations.map((ev) => {
                    const isFavorable = ev.effectiveTransitStatus === "Unobstructed Favorable";
                    const isBlocked = ev.effectiveTransitStatus === "Blocked by Vedha";

                    return (
                      <tr
                        key={ev.planet}
                        className={`hover:bg-slate-800/30 transition-colors ${
                          isFavorable ? "bg-emerald-500/5" : isBlocked ? "bg-rose-500/5" : ""
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                            <span className="text-amber-400 text-sm">{ev.symbol}</span>
                            <span>{ev.planet}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-slate-300">
                          House {ev.transitHouseFromMoon}
                        </td>
                        <td className="py-3 px-3">
                          {ev.isNaturallyBeneficTransit ? (
                            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                              Benefic Transit
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                              General Transit
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              isFavorable
                                ? "text-emerald-300 bg-emerald-500/20 border-emerald-500/40"
                                : isBlocked
                                ? "text-rose-300 bg-rose-500/20 border-rose-500/40"
                                : "text-slate-400 bg-slate-800 border-slate-700"
                            }`}
                          >
                            {ev.effectiveTransitStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {isBlocked ? (
                            <div className="flex items-center gap-1 text-rose-300">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Blocked by {ev.obstructingPlanet} in House {ev.obstructingHouse}</span>
                            </div>
                          ) : ev.isExemptedByClassicalRule ? (
                            <div className="flex items-center gap-1 text-cyan-300 text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{ev.exemptionReason}</span>
                            </div>
                          ) : isFavorable ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Pure & Unhindered (Shuddha)
                            </span>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-400 leading-snug">
                          {ev.beneficMeaning}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
