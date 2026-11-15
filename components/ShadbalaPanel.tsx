"use client";

import React, { useState, useMemo } from "react";
import {
  ShadbalaEngine,
  ShadbalaResult,
  ShadbalaChartInput,
  SHADBALA_IMPLEMENTATION_STATUS,
  DrikFullAspectReading,
  DrikMercuryAssociationRule,
} from "@/lib/vedic/shadbalaEngine";
import type { DrishtiVirupaVariant } from "@/lib/vedic/drishtiEngine";
import { WesternChartData } from "@/lib/astronomy/ephemeris";
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
  westernData?: WesternChartData;
  birthDate?: string;
  birthTime?: string;
}

export function ShadbalaPanel({
  vedicData,
  westernData,
  birthDate = "1990-01-01",
  birthTime = "12:00",
}: ShadbalaPanelProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<string>("Sun");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [saptavargajaScale, setSaptavargajaScale] = useState<
    "bphs-santhanam" | "raman-halving"
  >("bphs-santhanam");
  const [drishtiVirupaVariant, setDrishtiVirupaVariant] =
    useState<DrishtiVirupaVariant>("bphs-verse-special-formula");
  const [drikFullAspectReading, setDrikFullAspectReading] =
    useState<DrikFullAspectReading>("added-to-quarter");
  const [drikMercuryAssociationRule, setDrikMercuryAssociationRule] =
    useState<DrikMercuryAssociationRule>("same-sign");
  const [mercuryAssociationOrbInput, setMercuryAssociationOrbInput] = useState("2");

  const chartInput: ShadbalaChartInput = useMemo(() => {
    const planetsMap: ShadbalaChartInput["planets"] = {};
    vedicData.planets.forEach((p) => {
      const westernPosition = westernData?.planets.find((position) => position.name === p.name);
      const actualDailyMotion = westernPosition?.speed;
      planetsMap[p.name] = {
        longitude: p.siderealLongitude,
        isRetrograde: p.isRetrograde,
        ...(typeof actualDailyMotion === "number" && Number.isFinite(actualDailyMotion)
          ? { dailyMotion: actualDailyMotion }
          : {}),
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

    const tropicalMidheaven = westernData?.midheaven.longitude;
    const siderealMidheaven =
      typeof tropicalMidheaven === "number" && Number.isFinite(tropicalMidheaven)
        ? ((tropicalMidheaven - vedicData.ayanamsa) % 360 + 360) % 360
        : undefined;

    return {
      ascendant: vedicData.lagna.siderealLongitude,
      midheaven: siderealMidheaven,
      planets: planetsMap,
      birthDate: bDateObj,
      saptavargajaScale,
      drishtiVirupaVariant,
      drikFullAspectReading,
      drikMercuryAssociationRule,
      ...(drikMercuryAssociationRule === "degree-orb"
        ? { drikMercuryAssociationOrbDeg: Number(mercuryAssociationOrbInput) }
        : {}),
    };
  }, [
    vedicData,
    westernData,
    birthDate,
    birthTime,
    saptavargajaScale,
    drishtiVirupaVariant,
    drikFullAspectReading,
    drikMercuryAssociationRule,
    mercuryAssociationOrbInput,
  ]);

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
                Shadbala Strength Estimate (षड्बल) — Partial
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Six traditional categories are shown, but several component calculations remain approximate and are not yet source-validated.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Above modeled threshold: {shadbalaList.filter((p) => p.isStrong).length}
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Below modeled threshold: {shadbalaList.filter((p) => !p.isStrong).length}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wide">
            <Shield className="w-4 h-4" />
            {SHADBALA_IMPLEMENTATION_STATUS.label}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {SHADBALA_IMPLEMENTATION_STATUS.summary}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
            {SHADBALA_IMPLEMENTATION_STATUS.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-300">Saptavargaja scoring variant</div>
            <p className="text-[11px] text-slate-500">
              The selected source scale recalculates all seven varga contributions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={saptavargajaScale === "bphs-santhanam"}
              onClick={() => setSaptavargajaScale("bphs-santhanam")}
              className={`px-3 py-2 rounded-lg border text-xs transition-colors ${
                saptavargajaScale === "bphs-santhanam"
                  ? "border-purple-400/60 bg-purple-500/15 text-purple-100"
                  : "border-slate-700 bg-slate-950/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              BPHS · Santhanam (45/30/20/15/10/4/2)
            </button>
            <button
              type="button"
              aria-pressed={saptavargajaScale === "raman-halving"}
              onClick={() => setSaptavargajaScale("raman-halving")}
              className={`px-3 py-2 rounded-lg border text-xs transition-colors ${
                saptavargajaScale === "raman-halving"
                  ? "border-purple-400/60 bg-purple-500/15 text-purple-100"
                  : "border-slate-700 bg-slate-950/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              Raman alternative (45/30/22.5/15/7.5/3.75/1.875)
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <label className="flex flex-col gap-1.5 text-xs text-slate-400">
            Exact Drishti curve (BPHS Ch. 26)
            <select
              value={drishtiVirupaVariant}
              onChange={(event) => setDrishtiVirupaVariant(event.target.value as DrishtiVirupaVariant)}
              className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="bphs-verse-special-formula">BPHS 26.9–12 per-sign special formulae</option>
              <option value="bphs-base-longitude-curve">BPHS 26.6–8 generic curve only</option>
              <option value="bphs-translator-special-adjustments">Raman / translator-note +15/+30/+45 additions</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-slate-400">
            Mercury/Jupiter term (BPHS 27.19)
            <select
              value={drikFullAspectReading}
              onChange={(event) => setDrikFullAspectReading(event.target.value as DrikFullAspectReading)}
              className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="added-to-quarter">Add full term after quarter term</option>
              <option value="in-place-of-quarter">Full term replaces quarter term</option>
              <option value="quarter-only">Quarter term only (Raman worked method)</option>
            </select>
          </label>
          <div className="flex flex-col gap-1.5 text-xs text-slate-400">
            <label htmlFor="shadbala-mercury-association">Mercury association</label>
            <select
              id="shadbala-mercury-association"
              value={drikMercuryAssociationRule}
              onChange={(event) => setDrikMercuryAssociationRule(event.target.value as DrikMercuryAssociationRule)}
              className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="same-sign">Same sidereal sign</option>
              <option value="degree-orb">Explicit degree orb</option>
            </select>
            {drikMercuryAssociationRule === "degree-orb" && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.25"
                  value={mercuryAssociationOrbInput}
                  onChange={(event) => setMercuryAssociationOrbInput(event.target.value)}
                  aria-label="Mercury association orb in degrees"
                  className="w-20 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
                />
                <span>degrees (user-selected; no universal orb is assumed)</span>
              </div>
            )}
          </div>
          <p className="lg:col-span-3 text-[10px] leading-relaxed text-slate-500">
            Nodes are not Shadbala grahas and do not cast Drik Bala here. Rahu/Ketu may only be considered as malefic companions when the optional Mercury association rule is evaluated. Waxing/waning Moon nature is derived from the directed Sun–Moon elongation.
          </p>
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
                { name: "Drik (signed aspect)", points: planet.drikBala.points, max: 210, color: "bg-rose-500", absolute: true },
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
                        {planet.isStrong ? "Above estimate" : "Below estimate"} ({(planet.strengthRatio * 100).toFixed(0)}%)
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
                                  width: `${Math.min(100, (("absolute" in b && b.absolute) ? Math.abs(b.points) : Math.max(0, b.points)) / b.max * 100)}%`,
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
                {activeResult.isStrong ? "Above estimate" : "Below estimate"}
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

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>6. Drik Bala (signed Drishti Pinda)</span>
                  <span className={`font-mono ${activeResult.drikBala.points >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {activeResult.drikBala.available ? activeResult.drikBala.points : "Unavailable"} Virupas
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {activeResult.drikBala.description}
                </p>
                {activeResult.drikBala.available && (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                      <div><span className="text-slate-500 block">Net Pinda</span>{activeResult.drikBala.drishtiPinda}</div>
                      <div><span className="text-emerald-400 block">Benefic</span>+{activeResult.drikBala.beneficDrishtiPinda}</div>
                      <div><span className="text-rose-400 block">Malefic</span>−{activeResult.drikBala.maleficDrishtiPinda}</div>
                    </div>
                    <div className="space-y-1 border-t border-slate-800 pt-2">
                      {activeResult.drikBala.aspects.map((aspect) => (
                        <div key={aspect.aspectingPlanet} className="grid grid-cols-[auto_1fr_auto] gap-2 text-[10px] items-center">
                          <span className="font-semibold text-slate-200">{aspect.aspectingPlanet}</span>
                          <span className="text-slate-500">
                            {aspect.angle.toFixed(2)}° · raw {aspect.rawVirupas.toFixed(2)} · quarter {aspect.quarterVirupas.toFixed(2)} · full {aspect.fullAspectVirupas.toFixed(2)}
                          </span>
                          <span className={aspect.virupas >= 0 ? "text-emerald-300" : "text-rose-300"}>
                            {aspect.virupas > 0 ? "+" : ""}{aspect.virupas.toFixed(2)}v
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {!activeResult.drikBala.available && activeResult.drikBala.missingPlanetInputs.length > 0 && (
                  <p className="text-[10px] text-amber-300">
                    Missing seven-graha positions: {activeResult.drikBala.missingPlanetInputs.join(", ")}
                  </p>
                )}
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
