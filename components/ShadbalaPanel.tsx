"use client";

import React, { useState, useMemo } from "react";
import {
  ShadbalaEngine,
  ShadbalaResult,
  ShadbalaChartInput,
} from "@/lib/vedic/shadbalaEngine";
import { VedicChartData } from "@/lib/astronomy/vedic";
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ShadbalaPanelProps {
  vedicData: VedicChartData;
  birthDate?: string;
  birthTime?: string;
}

export function ShadbalaPanel({
  vedicData,
  birthDate = "1990-01-01",
  birthTime = "12:00",
}: ShadbalaPanelProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<string>("Sun");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const chartInput: ShadbalaChartInput = useMemo(() => {
    const planetsMap: ShadbalaChartInput["planets"] = {};
    vedicData.planets.forEach((p) => {
      planetsMap[p.name] = {
        longitude: p.siderealLongitude,
        isRetrograde: p.isRetrograde,
        dailyMotion: p.isRetrograde ? -0.1 : 0.95,
      };
    });

    const [yStr, mStr, dStr] = birthDate.split("-");
    const [hStr, minStr] = birthTime.split(":");
    const bDateObj = new Date(
      Date.UTC(
        parseInt(yStr, 10) || 1990,
        (parseInt(mStr, 10) || 1) - 1,
        parseInt(dStr, 10) || 1,
        parseInt(hStr, 10) || 12,
        parseInt(minStr, 10) || 0
      )
    );

    return {
      ascendant: vedicData.lagna.siderealLongitude,
      planets: planetsMap,
      birthDate: bDateObj,
    };
  }, [vedicData, birthDate, birthTime]);

  const engine = useMemo(() => new ShadbalaEngine(), []);

  const shadbalaList: ShadbalaResult[] = useMemo(() => {
    return engine.calculateAllShadbala(chartInput);
  }, [engine, chartInput]);

  const activeResult = useMemo(() => {
    return shadbalaList.find((p) => p.planet === selectedPlanet) || shadbalaList[0];
  }, [shadbalaList, selectedPlanet]);

  const toggleExpand = (planet: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [planet]: !prev[planet],
    }));
  };

  const maxVirupas = useMemo(() => {
    return Math.max(...shadbalaList.map((p) => p.totalVirupas), 500);
  }, [shadbalaList]);

  return (
    <div className="space-y-6 text-slate-200">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-400">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                Planetary Strength Analysis (Shadbala षड्बल)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              The 6-Fold Classical Planetary Power System: Sthana, Dig, Kala, Cheshta, Naisargika & Drik Balas in Virupas and Rupas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Strong Planets: {shadbalaList.filter((p) => p.isStrong).length}
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Challenged: {shadbalaList.filter((p) => !p.isStrong).length}
            </span>
          </div>
        </div>

        <div className="pt-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs text-slate-400 font-semibold shrink-0">Rank Order:</span>
          {shadbalaList.map((p) => (
            <button
              key={p.planet}
              onClick={() => setSelectedPlanet(p.planet)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedPlanet === p.planet
                  ? "bg-purple-500/25 text-purple-200 border border-purple-500/50 shadow-sm font-bold"
                  : "bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-[10px] font-mono text-purple-400 font-bold">#{p.rank}</span>
              <span>{p.planet}</span>
              <span className={`text-[10px] font-mono ${p.isStrong ? "text-emerald-400" : "text-rose-400"}`}>
                {p.totalRupas}R
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Planetary Strength Comparison
            </h3>
            <span className="text-xs text-slate-400">1 Rupa = 60 Virupas</span>
          </div>

          <div className="space-y-3.5">
            {shadbalaList.map((planet) => {
              const isSelected = selectedPlanet === planet.planet;
              const isExpanded = !!expandedCards[planet.planet];

              const balas = [
                { name: "Sthana (Positional)", points: planet.sthanaBala.total, max: 250, color: "bg-amber-500" },
                { name: "Dig (Directional)", points: planet.digBala.points, max: 60, color: "bg-cyan-500" },
                { name: "Kala (Temporal)", points: planet.kalaBala.total, max: 200, color: "bg-purple-500" },
                { name: "Cheshta (Motional)", points: planet.cheshtaBala.points, max: 60, color: "bg-emerald-500" },
                { name: "Naisargika (Natural)", points: planet.naisargikaBala.points, max: 60, color: "bg-blue-500" },
                { name: "Drik (Aspectual)", points: planet.drikBala.points, max: 30, color: "bg-rose-500" },
              ];

              return (
                <div
                  key={planet.planet}
                  className={`p-5 rounded-2xl border transition-all ${
                    isSelected
                      ? "bg-slate-900/90 border-purple-500/60 shadow-lg shadow-purple-950/20"
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => setSelectedPlanet(planet.planet)}
                    >
                      <span className="text-2xl font-bold text-purple-300 font-serif">
                        {planet.symbol}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-100">{planet.planet}</h4>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            Rank #{planet.rank}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {planet.totalRupas} Rupas ({planet.totalVirupas} Virupas) · Req: {planet.requiredRupas} Rupas
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          planet.isStrong
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}
                      >
                        {planet.isStrong ? "Strong" : "Weak"} ({(planet.strengthRatio * 100).toFixed(0)}%)
                      </span>

                      <button
                        onClick={() => toggleExpand(planet.planet)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Toggle Detailed Balas"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>Total Strength vs Requirement</span>
                      <span>
                        {planet.totalVirupas} / {planet.requiredVirupas} Virupas
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 relative">
                      <div
                        className="absolute top-0 bottom-0 w-[2px] bg-amber-400 z-10"
                        style={{ left: `${Math.min(100, (planet.requiredVirupas / maxVirupas) * 100)}%` }}
                        title={`Requirement: ${planet.requiredVirupas} Virupas`}
                      />
                      <div
                        className={`h-full rounded-full transition-all ${
                          planet.isStrong
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : "bg-gradient-to-r from-rose-500 to-amber-500"
                        }`}
                        style={{ width: `${Math.min(100, (planet.totalVirupas / maxVirupas) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2.5 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {balas.map((b) => (
                          <div key={b.name} className="space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-300">
                              <span className="truncate">{b.name}</span>
                              <span className="font-mono font-bold text-slate-200">
                                {b.points.toFixed(1)} pt
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className={`h-full rounded-full ${b.color}`}
                                style={{
                                  width: `${Math.min(100, Math.max(0, (b.points / b.max) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 leading-relaxed">
                        {planet.interpretation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5 sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl font-bold text-amber-300 font-serif">
                  {activeResult.symbol}
                </span>
                <div>
                  <h4 className="text-lg font-bold text-slate-100">{activeResult.planet}</h4>
                  <span className="text-xs text-slate-400">
                    Detailed Shadbala Analysis
                  </span>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                  activeResult.isStrong
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                }`}
              >
                {activeResult.isStrong ? "Strong" : "Weak"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Total Rupas
                </span>
                <span className="text-xl font-black text-slate-100 font-mono">
                  {activeResult.totalRupas}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Required: {activeResult.requiredRupas}
                </span>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Strength Ratio
                </span>
                <span
                  className={`text-xl font-black font-mono ${
                    activeResult.isStrong ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {(activeResult.strengthRatio * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Rank #{activeResult.rank} of 7
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                Component Balas Breakdown
              </h5>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>1. Sthana Bala (Positional)</span>
                  <span className="font-mono text-amber-300">{activeResult.sthanaBala.total} Virupas</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {activeResult.sthanaBala.description}
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>2. Dig Bala (Directional)</span>
                  <span className="font-mono text-cyan-300">{activeResult.digBala.points} Virupas</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {activeResult.digBala.description}
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>3. Kala Bala (Temporal)</span>
                  <span className="font-mono text-purple-300">{activeResult.kalaBala.total} Virupas</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {activeResult.kalaBala.description}
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>4. Cheshta Bala (Motional)</span>
                  <span className="font-mono text-emerald-300">{activeResult.cheshtaBala.points} Virupas</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {activeResult.cheshtaBala.description}
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>5. Naisargika Bala (Natural)</span>
                  <span className="font-mono text-blue-300">{activeResult.naisargikaBala.points} Virupas</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {activeResult.naisargikaBala.description}
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>6. Drik Bala (Aspectual)</span>
                  <span className="font-mono text-rose-300">{activeResult.drikBala.points} Virupas</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {activeResult.drikBala.description}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2.5 text-xs">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Classical Significations
              </h5>
              <div className="space-y-1.5">
                {(activeResult.isStrong
                  ? activeResult.predictions.strongEffects
                  : activeResult.predictions.weakEffects
                ).map((effect, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300 text-[11px]">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>{effect}</span>
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
