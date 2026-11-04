"use client";

import React, { useState, useMemo } from "react";
import {
  AshtakavargaEngine,
  Sarvashtakavarga,
  Bhinnashtakavarga,
  AshtakavargaBirthChart,
  STANDARD_BAV_TOTALS,
} from "@/lib/vedic/ashtakavargaEngine";
import { VedicChartData } from "@/lib/astronomy/vedic";
import {
  Grid3X3,
  Sparkles,
  Calendar,
  Layers,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

interface AshtakavargaPanelProps {
  vedicData: VedicChartData;
}

export function AshtakavargaPanel({ vedicData }: AshtakavargaPanelProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<string>("SAV");
  const [transitPlanetFilter, setTransitPlanetFilter] = useState<string>("All");
  const [activeSubTab, setActiveSubTab] = useState<"grid" | "matrix" | "reductions" | "transits">("grid");

  const birthChart: AshtakavargaBirthChart = useMemo(() => {
    const planetsMap: AshtakavargaBirthChart["planets"] = {};
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

  const engine = useMemo(() => new AshtakavargaEngine(), []);

  const bav: Bhinnashtakavarga = useMemo(() => {
    return engine.calculateBhinnashtakavarga(birthChart);
  }, [engine, birthChart]);

  const sav: Sarvashtakavarga = useMemo(() => {
    return engine.calculateSarvashtakavarga(bav);
  }, [engine, bav]);

  const currentTransitAnalysis = useMemo(() => {
    const planets = ["Jupiter", "Saturn", "Mars", "Sun", "Venus", "Mercury", "Moon"];
    return planets.map((p) => {
      const natalP = vedicData.planets.find((item) => item.name === p);
      const house = natalP?.house || 1;
      return engine.calculateTransitFavorability(p, house, sav);
    });
  }, [engine, vedicData, sav]);

  const transitCalendar = useMemo(() => {
    return engine.generateTransitCalendar(sav, new Date(), 12);
  }, [engine, sav]);

  const filteredCalendar = useMemo(() => {
    if (transitPlanetFilter === "All") return transitCalendar;
    return transitCalendar.filter((item) => item.planet === transitPlanetFilter);
  }, [transitCalendar, transitPlanetFilter]);

  const houseSigns = useMemo(() => {
    return vedicData.houses.map((h) => ({
      house: h.house,
      signName: h.rasiName,
    }));
  }, [vedicData]);

  const displayedBindus = useMemo(() => {
    if (selectedPlanet === "SAV") {
      return sav.houseBindus;
    }
    return bav.housePointsByPlanet[selectedPlanet] || new Array(12).fill(0);
  }, [selectedPlanet, sav, bav]);

  const isSAV = selectedPlanet === "SAV";

  return (
    <div className="space-y-6 text-slate-200">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
                <Grid3X3 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                Classical Ashtakavarga Matrix (अष्टकवर्ग)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Complete Bhinnashtakavarga (BAV), 337-Point Sarvashtakavarga (SAV), Shodhana Reductions & Transit Favorability
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
              Total Points: {sav.totalPoints} / 337
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              Strong Houses: {sav.strongHouses.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 overflow-x-auto no-scrollbar">
          {[
            { id: "grid", label: "SAV & BAV Wheel Grid", icon: Grid3X3 },
            { id: "matrix", label: "12-House Planetary Matrix", icon: Layers },
            { id: "reductions", label: "Trikona & Ekadhipatya Shodhana", icon: ShieldCheck },
            { id: "transits", label: "12-Month Transit Forecast", icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-amber-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeSubTab === "grid" && (
        <div className="space-y-6">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedPlanet("SAV")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedPlanet === "SAV"
                  ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sarvashtakavarga (SAV - Total)
            </button>
            {AshtakavargaEngine.REFERENCE_POINTS.map((p) => {
              const active = selectedPlanet === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPlanet(p)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p} ({bav.totals[p] || STANDARD_BAV_TOTALS[p]})
                </button>
              );
            })}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {isSAV ? "Sarvashtakavarga (SAV) 12-House Grid" : `${selectedPlanet} Bhinnashtakavarga (BAV) Points`}
                </h3>
                <p className="text-xs text-slate-400">
                  {isSAV
                    ? "Sum of all 8 reference points. Houses with 30+ bindus are strong, 25-29 average, <25 challenging."
                    : `Points donated across 12 houses. Total: ${bav.totals[selectedPlanet] || STANDARD_BAV_TOTALS[selectedPlanet]} points.`}
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] self-start sm:self-auto">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                  <span className="text-slate-300 font-medium">{isSAV ? "Strong (30+)" : "High (5-8)"}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" />
                  <span className="text-slate-300 font-medium">{isSAV ? "Average (25-29)" : "Avg (4)"}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
                  <span className="text-slate-300 font-medium">{isSAV ? "Weak (<25)" : "Low (0-3)"}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {displayedBindus.map((bindus, index) => {
                const houseNum = index + 1;
                const sign = houseSigns[index]?.signName || "Sign";

                let colorStyle = "";
                let badgeLabel = "";

                if (isSAV) {
                  if (bindus >= 30) {
                    colorStyle = "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-emerald-950/20";
                    badgeLabel = "Fortified";
                  } else if (bindus >= 25) {
                    colorStyle = "bg-amber-950/30 border-amber-500/40 text-amber-300 shadow-amber-950/20";
                    badgeLabel = "Balanced";
                  } else {
                    colorStyle = "bg-rose-950/40 border-rose-500/40 text-rose-300 shadow-rose-950/20";
                    badgeLabel = "Vulnerable";
                  }
                } else {
                  if (bindus >= 5) {
                    colorStyle = "bg-emerald-950/40 border-emerald-500/50 text-emerald-300";
                    badgeLabel = "Potent";
                  } else if (bindus === 4) {
                    colorStyle = "bg-amber-950/30 border-amber-500/40 text-amber-300";
                    badgeLabel = "Moderate";
                  } else {
                    colorStyle = "bg-rose-950/40 border-rose-500/40 text-rose-300";
                    badgeLabel = "Deficient";
                  }
                }

                return (
                  <div
                    key={houseNum}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] shadow-sm ${colorStyle}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        House {houseNum}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-950/60 border border-slate-800">
                        {badgeLabel}
                      </span>
                    </div>

                    <div className="my-2 text-center">
                      <span className="text-3xl font-black tracking-tight">{bindus}</span>
                      <span className="text-[11px] block mt-0.5 font-medium opacity-80">Bindus</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] opacity-80">
                      <span className="truncate">{sign}</span>
                      <span className="font-mono">H{houseNum}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                {isSAV ? "Sarvashtakavarga Synthesis" : `${selectedPlanet} BAV Interpretation`}
              </h4>
              <p className="text-xs leading-relaxed text-slate-300">
                {isSAV ? sav.interpretation.summary : bav.interpretation[selectedPlanet]}
              </p>
              {isSAV && sav.interpretation.advice && (
                <p className="text-xs text-emerald-300 pt-1 border-t border-slate-800/80">
                  💡 {sav.interpretation.advice}
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Real-Time Transit Favorability (Gochara via Ashtakavarga)
                </h3>
                <p className="text-xs text-slate-400">
                  Classical prediction: High bindus in the transited house deliver auspicious fruits
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {currentTransitAnalysis.map((item) => {
                const isGreat = item.favorability === "excellent" || item.favorability === "good";
                return (
                  <div
                    key={item.planet}
                    className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                      isGreat
                        ? "bg-slate-950/70 border-emerald-500/30"
                        : "bg-slate-950/70 border-amber-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">{item.planet}</span>
                        <span className="text-xs text-slate-400">in House {item.house}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          item.favorability === "excellent"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : item.favorability === "good"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : item.favorability === "neutral"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}
                      >
                        {item.favorability} ({item.bindus} pts)
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-snug">{item.advice}</p>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Key Focus:</span>
                      <span className="text-amber-300 font-medium truncate max-w-[200px]">
                        {item.bestActivities[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "matrix" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Complete 8-Planet Bhinnashtakavarga & SAV Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Cross-reference bindus donated to each of the 12 houses by all 7 planets plus Ascendant (Lagna)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-300 border-b border-slate-800 font-semibold">
                  <th className="py-2.5 px-3 text-left">Graha / Point</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} className="py-2.5 px-2">
                      H{i + 1}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 bg-amber-500/10 text-amber-300 font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {AshtakavargaEngine.REFERENCE_POINTS.map((planet) => {
                  const pts = bav.housePointsByPlanet[planet] || [];
                  const tot = bav.totals[planet] || pts.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={planet} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-left font-semibold text-slate-200">
                        {planet}
                      </td>
                      {pts.map((val, hIdx) => (
                        <td
                          key={hIdx}
                          className={`py-2.5 px-2 font-mono ${
                            val >= 5
                              ? "text-emerald-400 font-bold bg-emerald-500/5"
                              : val <= 2
                              ? "text-rose-400 font-medium"
                              : "text-slate-300"
                          }`}
                        >
                          {val}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-300 bg-amber-500/10">
                        {tot}
                      </td>
                    </tr>
                  );
                })}

                <tr className="bg-slate-950 text-slate-100 font-bold border-t-2 border-amber-500/40">
                  <td className="py-3 px-3 text-left text-amber-400 uppercase tracking-wider">
                    SAV Total
                  </td>
                  {sav.houseBindus.map((val, hIdx) => (
                    <td
                      key={hIdx}
                      className={`py-3 px-2 font-mono text-sm ${
                        val >= 30
                          ? "text-emerald-300 font-black bg-emerald-500/15"
                          : val < 25
                          ? "text-rose-300 font-bold bg-rose-500/15"
                          : "text-amber-200"
                      }`}
                    >
                      {val}
                    </td>
                  ))}
                  <td className="py-3 px-3 font-mono font-black text-amber-400 text-sm bg-amber-500/20">
                    {sav.totalPoints}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "reductions" && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Classical Parashara Shodhana (Reductions)
              </h3>
              <p className="text-xs text-slate-400">
                Trikona Shodhana followed by Ekadhipatya Shodhana
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950/70 border border-amber-500/30 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                  Rasi Pinda (राशि पिण्ड)
                </span>
                <span className="text-2xl font-black text-slate-100 font-mono">
                  {sav.shodhyaPinda.rasiPinda}
                </span>
                <p className="text-[11px] text-slate-400">
                  Signs multiplied by classical rasi multipliers
                </p>
              </div>

              <div className="p-4 bg-slate-950/70 border border-purple-500/30 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block">
                  Graha Pinda (ग्रह पिण्ड)
                </span>
                <span className="text-2xl font-black text-slate-100 font-mono">
                  {sav.shodhyaPinda.grahaPinda}
                </span>
                <p className="text-[11px] text-slate-400">
                  Planetary occupancy multipliers in reduced signs
                </p>
              </div>

              <div className="p-4 bg-slate-950/70 border border-emerald-500/30 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  Yoga Pinda (योग पिण्ड)
                </span>
                <span className="text-2xl font-black text-emerald-300 font-mono">
                  {sav.shodhyaPinda.yogaPinda}
                </span>
                <p className="text-[11px] text-slate-400">
                  Composite strength for longevity & transit hits
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-300 border-b border-slate-800">
                    <th className="py-2.5 px-3 text-left">Stage</th>
                    {Array.from({ length: 12 }, (_, i) => (
                      <th key={i} className="py-2.5 px-2">
                        H{i + 1}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-amber-300">Sum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-left font-semibold text-slate-300">
                      Raw SAV Points
                    </td>
                    {sav.houseBindus.map((v, i) => (
                      <td key={i} className="py-2.5 px-2 font-mono">
                        {v}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                      {sav.totalPoints}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-left font-semibold text-amber-300">
                      1. Trikona Shodhana
                    </td>
                    {sav.trikonaReductions.map((v, i) => (
                      <td key={i} className="py-2.5 px-2 font-mono text-amber-300">
                        {v}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                      {sav.trikonaReductions.reduce((a, b) => a + b, 0)}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-left font-semibold text-emerald-300">
                      2. Ekadhipatya Shodhana
                    </td>
                    {sav.ekadhipatyaReductions.map((v, i) => (
                      <td key={i} className="py-2.5 px-2 font-mono text-emerald-300 font-bold">
                        {v}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-300">
                      {sav.ekadhipatyaReductions.reduce((a, b) => a + b, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "transits" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                12-Month Ashtakavarga Transit Calendar
              </h3>
              <p className="text-xs text-slate-400">
                Monthly astrological forecast calculated by mapping transiting grahas into your natal SAV houses
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Filter Graha:</span>
              <select
                value={transitPlanetFilter}
                onChange={(e) => setTransitPlanetFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="All">All Planets</option>
                <option value="Jupiter">Jupiter (Guru)</option>
                <option value="Saturn">Saturn (Shani)</option>
                <option value="Mars">Mars (Mangala)</option>
                <option value="Sun">Sun (Surya)</option>
                <option value="Venus">Venus (Shukra)</option>
                <option value="Mercury">Mercury (Budha)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredCalendar.map((entry, idx) => {
              const isExcellent = entry.status === "excellent";
              const isGood = entry.status === "good";
              const isChallenging = entry.status === "challenging" || entry.status === "difficult";

              return (
                <div
                  key={idx}
                  className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-20 shrink-0">
                      <span className="text-xs font-bold text-slate-200 block">{entry.month}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{entry.date}</span>
                    </div>

                    <div className="h-7 w-[1px] bg-slate-800 hidden sm:block" />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300">{entry.planet}</span>
                        <span className="text-xs text-slate-400">transits House {entry.house}</span>
                        <span className="text-[11px] text-slate-500 font-mono">({entry.sign})</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{entry.recommendation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {entry.bindus} Bindus
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        isExcellent
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : isGood
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : isChallenging
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
