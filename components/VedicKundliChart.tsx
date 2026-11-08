"use client";

import React, { useState, useMemo, useEffect } from "react";
import { VedicChartData, VedicPlanet } from "@/lib/astronomy/vedic";
import {
  calculateDivisionalChart,
  DIVISIONAL_CHARTS_CONFIG,
  DivisionalChartResult,
  DivisionalPlanet,
} from "@/lib/vedic/divisionalCalc";
import { Sparkles, Compass, Info, Check, ChevronDown, Eye } from "lucide-react";
import { VedicAspectRays } from "./VedicAspectRays";
import { calculateDrishtiMatrix } from "@/lib/vedic/drishtiEngine";

interface VedicKundliChartProps {
  vedicData: VedicChartData;
  initialDivision?: string;
  initialStyle?: "NorthIndian" | "SouthIndian";
  onDivisionChange?: (division: string) => void;
}

const POPULAR_DIVISIONS = [
  { code: "D1", label: "D1 Rasi", tag: "Birth & Body" },
  { code: "D9", label: "D9 Navamsa", tag: "Soul & Spouse" },
  { code: "D10", label: "D10 Dasamsa", tag: "Career & Status" },
  { code: "D20", label: "D20 Vimsamsa", tag: "Devotion & Upasana" },
  { code: "D7", label: "D7 Saptamsa", tag: "Children" },
  { code: "D2", label: "D2 Hora", tag: "Wealth" },
  { code: "D3", label: "D3 Drekkana", tag: "Courage" },
  { code: "D12", label: "D12 Dwadasamsa", tag: "Parents" },
  { code: "D60", label: "D60 Shashtiamsa", tag: "Past Karma" },
];

export function VedicKundliChart({
  vedicData,
  initialDivision = "D1",
  initialStyle = "NorthIndian",
  onDivisionChange,
}: VedicKundliChartProps) {
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [showGrahaRays, setShowGrahaRays] = useState<boolean>(false);
  const [showRashiRays, setShowRashiRays] = useState<boolean>(false);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);

  const [prevInitialDivision, setPrevInitialDivision] = useState(initialDivision);
  const [selectedDivision, setSelectedDivision] = useState<string>(initialDivision);

  if (initialDivision !== prevInitialDivision) {
    setPrevInitialDivision(initialDivision);
    setSelectedDivision(initialDivision);
    setSelectedHouse(null);
  }

  const [prevInitialStyle, setPrevInitialStyle] = useState(initialStyle);
  const [chartStyle, setChartStyle] = useState<"NorthIndian" | "SouthIndian">(initialStyle);

  if (initialStyle !== prevInitialStyle) {
    setPrevInitialStyle(initialStyle);
    setChartStyle(initialStyle);
  }

  const handleDivisionSelect = (code: string) => {
    setSelectedDivision(code);
    setSelectedHouse(null);
    if (onDivisionChange) onDivisionChange(code);
  };

  // Calculate divisional chart
  const currentChart: DivisionalChartResult = useMemo(() => {
    return calculateDivisionalChart(
      vedicData.planets,
      vedicData.lagna.siderealLongitude,
      selectedDivision
    );
  }, [vedicData, selectedDivision]);

  // Calculate Drishti from the same varga placements displayed in the chart.
  const drishtiReport = useMemo(() => {
    return calculateDrishtiMatrix(
      currentChart.planets.map((planet) => ({
        name: planet.name,
        house: planet.house,
        rasiIndex: planet.signIndex,
        rasiName: planet.sign,
      })),
      currentChart.ascendant.signIndex
    );
  }, [currentChart.planets, currentChart.ascendant.signIndex]);

  // House helpers
  const getHouseData = (houseNum: number) => {
    return currentChart.houses.find((h) => h.house === houseNum);
  };

  const getHouseOccupants = (houseNum: number): DivisionalPlanet[] => {
    const h = getHouseData(houseNum);
    return h ? h.planets : [];
  };

  const getHouseSignName = (houseNum: number): string => {
    const h = getHouseData(houseNum);
    return h ? h.signName : "";
  };

  const getHouseSignIndex = (houseNum: number): number => {
    const h = getHouseData(houseNum);
    return h ? h.signIndex + 1 : 1; // 1-indexed sign number (Aries=1, Taurus=2, etc.)
  };

  // South Indian Sign lookup
  const getSouthIndianSignOccupants = (signIndex: number): DivisionalPlanet[] => {
    return currentChart.planets.filter((p) => p.signIndex === signIndex);
  };

  const isSouthIndianSignAscendant = (signIndex: number): boolean => {
    return currentChart.ascendant.signIndex === signIndex;
  };

  // Dignity badge colors
  const getDignityBadge = (dignity: DivisionalPlanet["dignity"]) => {
    switch (dignity) {
      case "Exalted":
        return "text-amber-300 font-bold";
      case "Own Sign":
        return "text-cyan-300 font-semibold";
      case "Debilitated":
        return "text-rose-400 font-bold";
      case "Friendly":
        return "text-emerald-300";
      default:
        return "text-slate-200";
    }
  };

  const selectedHouseDetail = selectedHouse ? getHouseData(selectedHouse) : null;

  return (
    <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-2xl space-y-4">
      {/* Top Controller Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-serif-celestial font-bold text-slate-100 flex items-center gap-1.5">
                <span>{currentChart.divisionName} Kundli</span>
                <span className="text-amber-400 text-xs font-mono font-normal">
                  ({currentChart.divisionCode})
                </span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Lagna: {currentChart.ascendant.sign}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">{currentChart.significance}</p>
          </div>
        </div>

        {/* Aspect Rays & Style Controls */}
        <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto text-xs">
          {/* Aspect Ray Toggles */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setShowGrahaRays(!showGrahaRays)}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                showGrahaRays
                  ? "bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Toggle Parashari Graha Drishti Rays"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Graha Rays</span>
            </button>
            <button
              type="button"
              onClick={() => setShowRashiRays(!showRashiRays)}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                showRashiRays
                  ? "bg-blue-500/25 text-blue-200 border border-blue-500/40 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Toggle Jaimini Rashi Drishti Rays"
            >
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>Rashi Rays</span>
            </button>
          </div>

          {/* Style Selector (North Indian vs South Indian) */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setChartStyle("NorthIndian")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                chartStyle === "NorthIndian"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              North (Diamond)
            </button>
            <button
              type="button"
              onClick={() => setChartStyle("SouthIndian")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                chartStyle === "SouthIndian"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              South (Square)
            </button>
          </div>
        </div>
      </div>

      {/* Quick Division Selector Pills & All 16 Vargas Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 text-xs flex-1">
          <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1 pr-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Charts:
          </span>
          {POPULAR_DIVISIONS.map((div) => {
            const isSelected = selectedDivision === div.code;
            return (
              <button
                key={div.code}
                type="button"
                onClick={() => handleDivisionSelect(div.code)}
                className={`px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-amber-500/25 text-amber-200 border border-amber-500/50 shadow-md ring-1 ring-amber-500/30 font-semibold"
                    : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700"
                }`}
              >
                <span className="font-bold">{div.code}</span>
                <span className="text-[10px] opacity-80">({div.tag})</span>
              </button>
            );
          })}
        </div>

        {/* Complete 16 Shodashavarga Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <label htmlFor="kundli-all-vargas" className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
            All 16 Vargas:
          </label>
          <select
            id="kundli-all-vargas"
            value={selectedDivision}
            onChange={(e) => handleDivisionSelect(e.target.value)}
            className="bg-slate-900 border border-slate-700 hover:border-amber-500/50 rounded-lg px-2 py-1 text-xs text-amber-200 font-medium focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
          >
            {Object.entries(DIVISIONAL_CHARTS_CONFIG).map(([code, cfg]) => (
              <option key={code} value={code} className="bg-slate-900 text-slate-200">
                {code} · {cfg.name} ({cfg.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Kundli Canvas Grid (Chart on Left/Center, Quick Inspector on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Visual Chart Container */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-950 border border-slate-800/90 rounded-xl relative shadow-inner">
          <div className="w-full max-w-[440px] aspect-square relative select-none">
            {chartStyle === "NorthIndian" ? (
              /* North Indian Classical Diamond Chart */
              <svg
                suppressHydrationWarning
                viewBox="0 0 400 400"
                className="w-full h-full font-sans cursor-pointer"
              >
                <defs>
                  <linearGradient id="diamondBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0b0f19" />
                    <stop offset="50%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#070a12" />
                  </linearGradient>
                  <linearGradient id="lagnaGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.03" />
                  </linearGradient>
                </defs>

                {/* Outer Frame */}
                <rect
                  x="6"
                  y="6"
                  width="388"
                  height="388"
                  fill="url(#diamondBg)"
                  stroke="#475569"
                  strokeWidth="2"
                  rx="6"
                />

                {/* Diagonal Crossing Lines */}
                <line x1="6" y1="6" x2="394" y2="394" stroke="#334155" strokeWidth="1.5" />
                <line x1="6" y1="394" x2="394" y2="6" stroke="#334155" strokeWidth="1.5" />

                {/* Inner Diamond (Kendra Rhombus: 200,6; 394,200; 200,394; 6,200) */}
                <polygon
                  points="200,6 394,200 200,394 6,200"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="2"
                />

                {/* Lagna House 1 Highlight Polygon */}
                <polygon
                  points="200,6 297,103 200,200 103,103"
                  fill={selectedHouse === 1 ? "rgba(245, 158, 11, 0.2)" : "url(#lagnaGlow)"}
                  stroke={selectedHouse === 1 ? "#fbbf24" : "none"}
                  strokeWidth="1.5"
                  onClick={() => setSelectedHouse(1)}
                  className="transition-colors hover:fill-amber-500/20"
                />

                {/* ---------------- HOUSE 1 (Top Center Lagna Diamond) ---------------- */}
                <g onClick={() => setSelectedHouse(1)} className="cursor-pointer">
                  <text x="200" y="32" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">
                    H1 · {getHouseSignName(1)} ({getHouseSignIndex(1)})
                  </text>
                  <text x="200" y="50" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">
                    [LAGNA]
                  </text>
                  {getHouseOccupants(1).map((p, idx) => (
                    <text
                      key={p.name}
                      x="200"
                      y={72 + idx * 16}
                      fill={p.dignity === "Exalted" ? "#fde047" : p.dignity === "Debilitated" ? "#fda4af" : "#f8fafc"}
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted} {p.isRetrograde ? "(R)" : ""}
                    </text>
                  ))}
                </g>

                {/* ---------------- HOUSE 2 (Top Left Triangle) ---------------- */}
                <g onClick={() => setSelectedHouse(2)} className="cursor-pointer">
                  <text x="100" y="30" fill="#94a3b8" fontSize="9" textAnchor="middle">
                    H2 ({getHouseSignIndex(2)})
                  </text>
                  {getHouseOccupants(2).map((p, idx) => (
                    <text key={p.name} x="100" y={50 + idx * 14} fill="#e2e8f0" fontSize="10" textAnchor="middle">
                      {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                    </text>
                  ))}
                </g>

                {/* ---------------- HOUSE 3 (Far Left Top Triangle) ---------------- */}
                <g onClick={() => setSelectedHouse(3)} className="cursor-pointer">
                  <text x="45" y="95" fill="#94a3b8" fontSize="9" textAnchor="middle">
                    H3 ({getHouseSignIndex(3)})
                  </text>
                  {getHouseOccupants(3).map((p, idx) => (
                    <text key={p.name} x="45" y={115 + idx * 14} fill="#e2e8f0" fontSize="10" textAnchor="middle">
                      {p.symbol} {p.name.slice(0, 3)}
                    </text>
                  ))}
                </g>

                {/* ---------------- HOUSE 4 (Left Center Diamond) ---------------- */}
                <g onClick={() => setSelectedHouse(4)} className="cursor-pointer">
                  <polygon
                    points="6,200 103,103 200,200 103,297"
                    fill={selectedHouse === 4 ? "rgba(245, 158, 11, 0.2)" : "transparent"}
                    stroke={selectedHouse === 4 ? "#fbbf24" : "none"}
                    strokeWidth="1.5"
                  />
                  <text x="103" y="185" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">
                    H4 · {getHouseSignName(4)} ({getHouseSignIndex(4)})
                  </text>
                  {getHouseOccupants(4).map((p, idx) => (
                    <text key={p.name} x="103" y={205 + idx * 15} fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">
                      {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                    </text>
                  ))}
                </g>

                {/* ---------------- HOUSE 5 (Far Left Bottom Triangle) ---------------- */}
                <g onClick={() => setSelectedHouse(5)} className="cursor-pointer">
                  <text x="45" y="285" fill="#94a3b8" fontSize="9" textAnchor="middle">
                    H5 ({getHouseSignIndex(5)})
                  </text>
                  {getHouseOccupants(5).map((p, idx) => (
                    <text key={p.name} x="45" y={305 + idx * 14} fill="#e2e8f0" fontSize="10" textAnchor="middle">
                      {p.symbol} {p.name.slice(0, 3)}
                    </text>
                  ))}
                </g>

                {/* ---------------- HOUSE 6 (Bottom Left Triangle) ---------------- */}
                <g onClick={() => setSelectedHouse(6)} className="cursor-pointer">
                  <text x="100" y="375" fill="#94a3b8" fontSize="9" textAnchor="middle">
                    H6 ({getHouseSignIndex(6)})
                  </text>
                  {getHouseOccupants(6).map((p, idx) => (
                    <text key={p.name} x="100" y={355 - idx * 14} fill="#e2e8f0" fontSize="10" textAnchor="middle">
                      {p.symbol} {p.name.slice(0, 3)}
                    </text>
                  ))}
                </g>

                {/* ---------------- HOUSE 7 (Bottom Center Diamond) ---------------- */}
                <g onClick={() => setSelectedHouse(7)} className="cursor-pointer">
                  <polygon
                    points="200,200 297,297 200,394 103,297"
                    fill={selectedHouse === 7 ? "rgba(245, 158, 11, 0.2)" : "transparent"}
                    stroke={selectedHouse === 7 ? "#fbbf24" : "none"}
                    strokeWidth="1.5"
                  />
                  <text x="200" y="315" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">
                    H7 · {getHouseSignName(7)} ({getHouseSignIndex(7)})
                  </text>
                  {getHouseOccupants(7).map((p, idx) => (
                    <text key={p.name} x="200" y={335 + idx * 15} fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">
                      {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                    </text>
                  ))}
                </g>

                {/* ---------------- HOUSE 8 (Bottom Right Triangle) ---------------- */}
                <g onClick={() => setSelectedHouse(8)} className="cursor-pointer">
                  <text x="300" y="375" fill="#94a3b8" fontSize="9" textAnchor="middle">
                    H8 ({getHouseSignIndex(8)})
                  </text>
                  {getHouseOccupants(8).map((p, idx) => (
                    <text key={p.name} x="300" y={355 - idx * 14} fill="#e2e8f0" fontSize="10" textAnchor="middle">
                      {p.symbol} {p.name.slice(0, 3)}
                    </text>
                  ))}
                </g>

                {/* ---------------- HOUSE 9 (Far Right Bottom Triangle) ---------------- */}
                <g onClick={() => setSelectedHouse(9)} className="cursor-pointer">
                  <text x="355" y="285" fill="#94a3b8" fontSize="9" textAnchor="middle">
                    H9 ({getHouseSignIndex(9)})
                  </text>
                  {getHouseOccupants(9).map((p, idx) => (
                    <text key={p.name} x="355" y={305 + idx * 14} fill="#e2e8f0" fontSize="10" textAnchor="middle">
                      {p.symbol} {p.name.slice(0, 3)}
                    </text>
                  ))}
                </g>

                {/* ---------------- HOUSE 10 (Right Center Diamond) ---------------- */}
                <g onClick={() => setSelectedHouse(10)} className="cursor-pointer">
                  <polygon
                    points="394,200 297,103 200,200 297,297"
                    fill={selectedHouse === 10 ? "rgba(245, 158, 11, 0.2)" : "transparent"}
                    stroke={selectedHouse === 10 ? "#fbbf24" : "none"}
                    strokeWidth="1.5"
                  />
                  <text x="297" y="185" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">
                    H10 · {getHouseSignName(10)} ({getHouseSignIndex(10)})
                  </text>
                  {getHouseOccupants(10).map((p, idx) => (
                    <text key={p.name} x="297" y={205 + idx * 15} fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">
                      {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                    </text>
                  ))}
                </g>

                {/* ---------------- HOUSE 11 (Far Right Top Triangle) ---------------- */}
                <g onClick={() => setSelectedHouse(11)} className="cursor-pointer">
                  <text x="355" y="95" fill="#94a3b8" fontSize="9" textAnchor="middle">
                    H11 ({getHouseSignIndex(11)})
                  </text>
                  {getHouseOccupants(11).map((p, idx) => (
                    <text key={p.name} x="355" y={115 + idx * 14} fill="#e2e8f0" fontSize="10" textAnchor="middle">
                      {p.symbol} {p.name.slice(0, 3)}
                    </text>
                  ))}
                </g>

                {/* ---------------- HOUSE 12 (Top Right Triangle) ---------------- */}
                <g onClick={() => setSelectedHouse(12)} className="cursor-pointer">
                  <text x="300" y="30" fill="#94a3b8" fontSize="9" textAnchor="middle">
                    H12 ({getHouseSignIndex(12)})
                  </text>
                  {getHouseOccupants(12).map((p, idx) => (
                    <text key={p.name} x="300" y={50 + idx * 14} fill="#e2e8f0" fontSize="10" textAnchor="middle">
                      {p.symbol} {p.name.slice(0, 3)}
                    </text>
                  ))}
                </g>

                {/* Visual Aspect Rays Layer */}
                <VedicAspectRays
                  chartStyle="NorthIndian"
                  grahaAspects={drishtiReport.grahaAspects}
                  rashiDrishtis={drishtiReport.rashiDrishtis}
                  selectedHouse={selectedHouse}
                  selectedPlanet={selectedPlanet}
                  showGrahaRays={showGrahaRays}
                  showRashiRays={showRashiRays}
                  ascendantSignIndex={currentChart.ascendant.signIndex}
                />
              </svg>
            ) : (
              /* South Indian Fixed 12-Sign Square Grid */
              <div className="grid grid-cols-4 grid-rows-4 w-full h-full border-2 border-slate-700 bg-slate-950 divide-x divide-y divide-slate-800 text-[10px] rounded-lg overflow-hidden">
                {/* Fixed South Indian Signs: 
                    Row 1: Pisces(11), Aries(0), Taurus(1), Gemini(2)
                    Row 2: Aquarius(10), [Center 2x2], Cancer(3)
                    Row 3: Capricorn(9), [Center 2x2], Leo(4)
                    Row 4: Sagittarius(8), Scorpio(7), Libra(6), Virgo(5)
                */}
                {/* 1. Pisces */}
                <div
                  className={`p-1.5 flex flex-col justify-between cursor-pointer ${
                    isSouthIndianSignAscendant(11) ? "bg-amber-500/10 border-l-2 border-amber-400" : ""
                  }`}
                  onClick={() => setSelectedHouse(currentChart.houses.find((h) => h.signIndex === 11)?.house || null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Pisces (12)</span>
                    {isSouthIndianSignAscendant(11) && <span className="text-amber-400 font-extrabold">[ASC]</span>}
                  </div>
                  <div className="space-y-0.5 text-slate-100 font-medium">
                    {getSouthIndianSignOccupants(11).map((p) => (
                      <div key={p.name} className={getDignityBadge(p.dignity)}>
                        {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Aries */}
                <div
                  className={`p-1.5 flex flex-col justify-between cursor-pointer ${
                    isSouthIndianSignAscendant(0) ? "bg-amber-500/10 border-t-2 border-amber-400" : ""
                  }`}
                  onClick={() => setSelectedHouse(currentChart.houses.find((h) => h.signIndex === 0)?.house || null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Aries (1)</span>
                    {isSouthIndianSignAscendant(0) && <span className="text-amber-400 font-extrabold">[ASC]</span>}
                  </div>
                  <div className="space-y-0.5 text-slate-100 font-medium">
                    {getSouthIndianSignOccupants(0).map((p) => (
                      <div key={p.name} className={getDignityBadge(p.dignity)}>
                        {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Taurus */}
                <div
                  className={`p-1.5 flex flex-col justify-between cursor-pointer ${
                    isSouthIndianSignAscendant(1) ? "bg-amber-500/10 border-t-2 border-amber-400" : ""
                  }`}
                  onClick={() => setSelectedHouse(currentChart.houses.find((h) => h.signIndex === 1)?.house || null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Taurus (2)</span>
                    {isSouthIndianSignAscendant(1) && <span className="text-amber-400 font-extrabold">[ASC]</span>}
                  </div>
                  <div className="space-y-0.5 text-slate-100 font-medium">
                    {getSouthIndianSignOccupants(1).map((p) => (
                      <div key={p.name} className={getDignityBadge(p.dignity)}>
                        {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Gemini */}
                <div
                  className={`p-1.5 flex flex-col justify-between cursor-pointer ${
                    isSouthIndianSignAscendant(2) ? "bg-amber-500/10 border-r-2 border-amber-400" : ""
                  }`}
                  onClick={() => setSelectedHouse(currentChart.houses.find((h) => h.signIndex === 2)?.house || null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Gemini (3)</span>
                    {isSouthIndianSignAscendant(2) && <span className="text-amber-400 font-extrabold">[ASC]</span>}
                  </div>
                  <div className="space-y-0.5 text-slate-100 font-medium">
                    {getSouthIndianSignOccupants(2).map((p) => (
                      <div key={p.name} className={getDignityBadge(p.dignity)}>
                        {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Aquarius (Row 2, Col 1) */}
                <div
                  className={`p-1.5 flex flex-col justify-between cursor-pointer ${
                    isSouthIndianSignAscendant(10) ? "bg-amber-500/10 border-l-2 border-amber-400" : ""
                  }`}
                  onClick={() => setSelectedHouse(currentChart.houses.find((h) => h.signIndex === 10)?.house || null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Aquarius (11)</span>
                    {isSouthIndianSignAscendant(10) && <span className="text-amber-400 font-extrabold">[ASC]</span>}
                  </div>
                  <div className="space-y-0.5 text-slate-100 font-medium">
                    {getSouthIndianSignOccupants(10).map((p) => (
                      <div key={p.name} className={getDignityBadge(p.dignity)}>
                        {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Center Core Box (2x2 span) */}
                <div className="col-span-2 row-span-2 bg-slate-900/60 p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-amber-400 font-serif-celestial font-bold text-sm sm:text-base">
                    {currentChart.divisionName} ({currentChart.divisionCode})
                  </span>
                  <span className="text-slate-300 text-[11px] font-medium mt-1">
                    Lagna: <strong className="text-amber-300">{currentChart.ascendant.sign}</strong>
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 max-w-[180px] line-clamp-2">
                    {currentChart.significance}
                  </span>
                </div>

                {/* 6. Cancer (Row 2, Col 4) */}
                <div
                  className={`p-1.5 flex flex-col justify-between cursor-pointer ${
                    isSouthIndianSignAscendant(3) ? "bg-amber-500/10 border-r-2 border-amber-400" : ""
                  }`}
                  onClick={() => setSelectedHouse(currentChart.houses.find((h) => h.signIndex === 3)?.house || null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Cancer (4)</span>
                    {isSouthIndianSignAscendant(3) && <span className="text-amber-400 font-extrabold">[ASC]</span>}
                  </div>
                  <div className="space-y-0.5 text-slate-100 font-medium">
                    {getSouthIndianSignOccupants(3).map((p) => (
                      <div key={p.name} className={getDignityBadge(p.dignity)}>
                        {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. Capricorn (Row 3, Col 1) */}
                <div
                  className={`p-1.5 flex flex-col justify-between cursor-pointer ${
                    isSouthIndianSignAscendant(9) ? "bg-amber-500/10 border-l-2 border-amber-400" : ""
                  }`}
                  onClick={() => setSelectedHouse(currentChart.houses.find((h) => h.signIndex === 9)?.house || null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Capricorn (10)</span>
                    {isSouthIndianSignAscendant(9) && <span className="text-amber-400 font-extrabold">[ASC]</span>}
                  </div>
                  <div className="space-y-0.5 text-slate-100 font-medium">
                    {getSouthIndianSignOccupants(9).map((p) => (
                      <div key={p.name} className={getDignityBadge(p.dignity)}>
                        {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 8. Leo (Row 3, Col 4) */}
                <div
                  className={`p-1.5 flex flex-col justify-between cursor-pointer ${
                    isSouthIndianSignAscendant(4) ? "bg-amber-500/10 border-r-2 border-amber-400" : ""
                  }`}
                  onClick={() => setSelectedHouse(currentChart.houses.find((h) => h.signIndex === 4)?.house || null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Leo (5)</span>
                    {isSouthIndianSignAscendant(4) && <span className="text-amber-400 font-extrabold">[ASC]</span>}
                  </div>
                  <div className="space-y-0.5 text-slate-100 font-medium">
                    {getSouthIndianSignOccupants(4).map((p) => (
                      <div key={p.name} className={getDignityBadge(p.dignity)}>
                        {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 9. Sagittarius (Row 4, Col 1) */}
                <div
                  className={`p-1.5 flex flex-col justify-between cursor-pointer ${
                    isSouthIndianSignAscendant(8) ? "bg-amber-500/10 border-b-2 border-amber-400" : ""
                  }`}
                  onClick={() => setSelectedHouse(currentChart.houses.find((h) => h.signIndex === 8)?.house || null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Sagittarius (9)</span>
                    {isSouthIndianSignAscendant(8) && <span className="text-amber-400 font-extrabold">[ASC]</span>}
                  </div>
                  <div className="space-y-0.5 text-slate-100 font-medium">
                    {getSouthIndianSignOccupants(8).map((p) => (
                      <div key={p.name} className={getDignityBadge(p.dignity)}>
                        {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 10. Scorpio (Row 4, Col 2) */}
                <div
                  className={`p-1.5 flex flex-col justify-between cursor-pointer ${
                    isSouthIndianSignAscendant(7) ? "bg-amber-500/10 border-b-2 border-amber-400" : ""
                  }`}
                  onClick={() => setSelectedHouse(currentChart.houses.find((h) => h.signIndex === 7)?.house || null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Scorpio (8)</span>
                    {isSouthIndianSignAscendant(7) && <span className="text-amber-400 font-extrabold">[ASC]</span>}
                  </div>
                  <div className="space-y-0.5 text-slate-100 font-medium">
                    {getSouthIndianSignOccupants(7).map((p) => (
                      <div key={p.name} className={getDignityBadge(p.dignity)}>
                        {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 11. Libra (Row 4, Col 3) */}
                <div
                  className={`p-1.5 flex flex-col justify-between cursor-pointer ${
                    isSouthIndianSignAscendant(6) ? "bg-amber-500/10 border-b-2 border-amber-400" : ""
                  }`}
                  onClick={() => setSelectedHouse(currentChart.houses.find((h) => h.signIndex === 6)?.house || null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Libra (7)</span>
                    {isSouthIndianSignAscendant(6) && <span className="text-amber-400 font-extrabold">[ASC]</span>}
                  </div>
                  <div className="space-y-0.5 text-slate-100 font-medium">
                    {getSouthIndianSignOccupants(6).map((p) => (
                      <div key={p.name} className={getDignityBadge(p.dignity)}>
                        {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 12. Virgo (Row 4, Col 4) */}
                <div
                  className={`p-1.5 flex flex-col justify-between cursor-pointer ${
                    isSouthIndianSignAscendant(5) ? "bg-amber-500/10 border-r-2 border-amber-400" : ""
                  }`}
                  onClick={() => setSelectedHouse(currentChart.houses.find((h) => h.signIndex === 5)?.house || null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Virgo (6)</span>
                    {isSouthIndianSignAscendant(5) && <span className="text-amber-400 font-extrabold">[ASC]</span>}
                  </div>
                  <div className="space-y-0.5 text-slate-100 font-medium">
                    {getSouthIndianSignOccupants(5).map((p) => (
                      <div key={p.name} className={getDignityBadge(p.dignity)}>
                        {p.symbol} {p.name.slice(0, 3)} {p.degreeFormatted}
                      </div>
                    ))}
                  </div>
                </div>

                {/* South Indian Aspect Rays SVG Overlay */}
                {(showGrahaRays || showRashiRays) && (
                  <svg
                    viewBox="0 0 400 400"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    <VedicAspectRays
                      chartStyle="SouthIndian"
                      grahaAspects={drishtiReport.grahaAspects}
                      rashiDrishtis={drishtiReport.rashiDrishtis}
                      selectedHouse={selectedHouse}
                      selectedPlanet={selectedPlanet}
                      showGrahaRays={showGrahaRays}
                      showRashiRays={showRashiRays}
                      ascendantSignIndex={currentChart.ascendant.signIndex}
                    />
                  </svg>
                )}
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Tip: Tap any house on the chart to inspect its Bhava details below.
          </p>
        </div>

        {/* Right Side: Planet Placement Table & House Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* House Inspector Box (If house selected) */}
          {selectedHouseDetail && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">
                  House {selectedHouseDetail.house} ({selectedHouseDetail.signName})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedHouse(null)}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <p className="text-[11px] text-slate-300">
                Sanskrit: <strong className="text-amber-200">{selectedHouseDetail.signSanskrit}</strong>
              </p>
              <div className="text-[11px] text-slate-200">
                Occupants:{" "}
                {selectedHouseDetail.planets.length > 0 ? (
                  <span className="font-semibold text-amber-200">
                    {selectedHouseDetail.planets.map((p) => `${p.name} (${p.degreeFormatted})`).join(", ")}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">None (Empty Bhava)</span>
                )}
              </div>
            </div>
          )}

          {/* Planetary Placements in this Division */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                {currentChart.divisionCode} Planetary Placements
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentChart.planets.length} Bodies
              </span>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-[360px] overflow-y-auto no-scrollbar text-xs">
              {currentChart.planets.map((p) => (
                <div
                  key={p.name}
                  className="px-3 py-2 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base text-amber-400 w-4 text-center">{p.symbol}</span>
                    <div>
                      <span className="font-medium text-slate-100 block">
                        {p.name} {p.isRetrograde ? "(R)" : ""}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        H{p.house} · {p.sign}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-slate-200 block text-[11px]">
                      {p.degreeFormatted}
                    </span>
                    <span className={`text-[10px] ${getDignityBadge(p.dignity)}`}>
                      {p.dignity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
