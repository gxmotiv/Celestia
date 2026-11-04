"use client";

import React, { useState, useMemo } from "react";
import {
  AvasthaEngine,
  PlanetAvasthas,
  AvasthaChartInput,
} from "@/lib/vedic/avasthaEngine";
import { VedicChartData } from "@/lib/astronomy/vedic";
import {
  Sparkles,
  Heart,
  Eye,
  Layers,
  Clock,
  Activity,
} from "lucide-react";

interface AvasthaPanelProps {
  vedicData: VedicChartData;
}

export function AvasthaPanel({ vedicData }: AvasthaPanelProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<string>("Sun");
  const [filterCondition, setFilterCondition] = useState<string>("All");

  const chartInput: AvasthaChartInput = useMemo(() => {
    const planetsMap: AvasthaChartInput["planets"] = {};
    vedicData.planets.forEach((p) => {
      planetsMap[p.name] = {
        longitude: p.siderealLongitude,
        isRetrograde: p.isRetrograde,
      };
    });
    return {
      ascendant: vedicData.lagna.siderealLongitude,
      planets: planetsMap,
    };
  }, [vedicData]);

  const engine = useMemo(() => new AvasthaEngine(), []);

  const allAvasthas: PlanetAvasthas[] = useMemo(() => {
    return engine.calculateAllPlanetAvasthas(chartInput);
  }, [engine, chartInput]);

  const filteredAvasthas = useMemo(() => {
    if (filterCondition === "All") return allAvasthas;
    return allAvasthas.filter((p) => p.overallCondition === filterCondition);
  }, [allAvasthas, filterCondition]);

  const activePlanet = useMemo(() => {
    return allAvasthas.find((p) => p.planet === selectedPlanet) || allAvasthas[0];
  }, [allAvasthas, selectedPlanet]);

  return (
    <div className="space-y-6 text-slate-200">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20 text-rose-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                Classical Planetary Avasthas (अवस्था प्रणाली)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              The 4 Classical States of Consciousness, Biological Maturity & Functional Potency from Brihat Parashara Hora Shastra
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              Yuva (Adult): {allAvasthas.filter((p) => p.baladi.state.includes("Yuva")).length} Planets
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              Jagrata (Awake): {allAvasthas.filter((p) => p.jagradi.state.includes("Jagrata")).length} Planets
            </span>
          </div>
        </div>

        <div className="pt-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {allAvasthas.map((p) => {
            const active = selectedPlanet === p.planet;
            return (
              <button
                key={p.planet}
                onClick={() => setSelectedPlanet(p.planet)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  active
                    ? "bg-rose-500/25 text-rose-200 border border-rose-500/50 shadow-sm font-bold"
                    : "bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="text-amber-400 font-serif">{p.symbol}</span>
                <span>{p.planet}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {p.functionalPotencyPercent}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-serif text-rose-300">{activePlanet.symbol}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-100">{activePlanet.planet}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                      {activePlanet.degreeInSign.toFixed(2)}° in {activePlanet.signName}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {activePlanet.isOddSign ? "Odd Zodiac Sign (विषम राशि)" : "Even Zodiac Sign (सम राशि)"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-950/70 px-4 py-2 rounded-xl border border-slate-800">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Composite Potency
                  </span>
                  <span className="text-xl font-black font-mono text-rose-400">
                    {activePlanet.functionalPotencyPercent}%
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-rose-500/40 flex items-center justify-center font-bold text-xs text-rose-300">
                  {activePlanet.overallCondition.slice(0, 3)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/70 rounded-xl border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    1. Baladi Avastha (Age State)
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                    {activePlanet.baladi.strengthPercent}% Power
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{activePlanet.baladi.state}</h4>
                  <span className="text-[11px] font-mono text-slate-400">{activePlanet.baladi.sanskrit}</span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  {activePlanet.baladi.description}
                </p>
                <div className="text-[10px] text-amber-300/80 pt-1 border-t border-slate-800/80">
                  Rule applied: {activePlanet.isOddSign ? "Standard Odd Sign order (0-6 Bala)" : "Inverted Even Sign order (0-6 Mrita)"}
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 rounded-xl border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    2. Jagradi Avastha (Consciousness)
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded">
                    {activePlanet.jagradi.functionalPercent}% Potency
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{activePlanet.jagradi.state}</h4>
                  <span className="text-[11px] font-mono text-slate-400">{activePlanet.jagradi.sanskrit}</span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  {activePlanet.jagradi.functionalDescription}
                </p>
                <div className="text-[10px] text-cyan-300/80 pt-1 border-t border-slate-800/80">
                  Based on dignity in {activePlanet.signName} (Own/Exalted = Awake)
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 rounded-xl border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5" />
                    3. Deeptadi Avastha (Mood & Dignity)
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">
                    {activePlanet.deeptadi.dignityLevel}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{activePlanet.deeptadi.state}</h4>
                  <span className="text-[11px] font-mono text-slate-400">{activePlanet.deeptadi.sanskrit}</span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  Mood: {activePlanet.deeptadi.mood}
                </p>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  {activePlanet.deeptadi.advice}
                </p>
              </div>

              <div className="p-4 bg-slate-950/70 rounded-xl border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    4. Sayanadi Avastha (Activity State)
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded">
                    State #{activePlanet.sayanadi.index} of 12
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{activePlanet.sayanadi.name}</h4>
                  <span className="text-[11px] font-mono text-slate-400">{activePlanet.sayanadi.sanskrit}</span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  Action: {activePlanet.sayanadi.meaning}
                </p>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  {activePlanet.sayanadi.effect}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Parashari Holistic Synthesis
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activePlanet.interpretation}
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-xs text-emerald-300 flex items-start gap-2">
                <span className="font-bold shrink-0">Remedy / Upaya:</span>
                <span>{activePlanet.remedialMeasure}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-400" />
              9 Planets Avastha Summary
            </h3>
            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs px-2 py-1 text-slate-300 focus:outline-none"
            >
              <option value="All">All States</option>
              <option value="Exceptional">Exceptional (80%+)</option>
              <option value="Robust">Robust (60-79%)</option>
              <option value="Balanced">Balanced (40-59%)</option>
              <option value="Challenged">Challenged (&lt;40%)</option>
            </select>
          </div>

          <div className="space-y-2.5">
            {filteredAvasthas.map((p) => {
              const isSelected = selectedPlanet === p.planet;
              return (
                <div
                  key={p.planet}
                  onClick={() => setSelectedPlanet(p.planet)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900/90 border-rose-500/60 shadow-md shadow-rose-950/20"
                      : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-serif text-rose-300 font-bold">{p.symbol}</span>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">{p.planet}</span>
                        <span className="text-[10px] text-slate-400">
                          {p.baladi.state.split(" ")[0]} · {p.jagradi.state.split(" ")[0]}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-200 block">
                        {p.functionalPotencyPercent}%
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          p.overallCondition === "Exceptional" || p.overallCondition === "Robust"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : p.overallCondition === "Balanced"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {p.overallCondition}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
