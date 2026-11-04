"use client";

import React, { useState, useMemo } from "react";
import {
  WesternChartData,
  PlanetPosition,
  ZODIAC_SIGNS,
  normalizeDegrees,
} from "@/lib/astronomy/ephemeris";
import {
  Sparkles,
  Orbit,
  Compass,
  Calendar,
  RefreshCw,
  Info,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface TransitingPlanet {
  name: string;
  sign: string;
  longitude: number;
  degreeFormatted: string;
  isRetrograde?: boolean;
}

interface TransitBiWheelProps {
  westernChart: WesternChartData;
  transitingPlanets: TransitingPlanet[];
  selectedDate: Date;
  onDateChange: (daysDelta: number) => void;
  onDateReset: () => void;
}

interface BiWheelAspect {
  transitPlanet: string;
  transitLon: number;
  natalPlanet: string;
  natalLon: number;
  type: "Conjunction" | "Opposition" | "Trine" | "Square" | "Sextile";
  angle: number;
  exactAngle: number;
  orb: number;
  color: string;
}

export function TransitBiWheel({
  westernChart,
  transitingPlanets,
  selectedDate,
  onDateChange,
  onDateReset,
}: TransitBiWheelProps) {
  const [selectedTransitPlanet, setSelectedTransitPlanet] = useState<string | null>(null);
  const [selectedNatalPlanet, setSelectedNatalPlanet] = useState<string | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  // SVG Geometry Constants
  const size = 660;
  const center = size / 2;
  const outerRadius = center - 20; // 310
  const transitRingR = outerRadius - 42; // 268
  const zodiacInnerR = transitRingR - 38; // 230
  const natalRingR = zodiacInnerR - 44; // 186
  const houseInnerR = natalRingR - 36; // 150
  const coreAspectR = houseInnerR - 20; // 130

  // The Ascendant is fixed at 9 o'clock (180°) in Western Chart Wheel
  const ascLon = westernChart.ascendant.longitude;
  const rotationOffset = 180 - ascLon;

  const getCoordinates = (lon: number, r: number) => {
    const adjustedAngle = (lon + rotationOffset) * (Math.PI / 180.0);
    const x = Math.round((center + r * Math.cos(adjustedAngle)) * 100) / 100;
    const y = Math.round((center - r * Math.sin(adjustedAngle)) * 100) / 100;
    return { x, y };
  };

  const elementColors: Record<string, { fill: string; text: string; bg: string }> = {
    Fire: { fill: "#ef4444", text: "text-red-400", bg: "bg-red-500/10" },
    Earth: { fill: "#10b981", text: "text-emerald-400", bg: "bg-emerald-500/10" },
    Air: { fill: "#f59e0b", text: "text-amber-400", bg: "bg-amber-500/10" },
    Water: { fill: "#3b82f6", text: "text-blue-400", bg: "bg-blue-500/10" },
  };

  const aspectStyles: Record<string, { color: string; label: string }> = {
    Conjunction: { color: "#f59e0b", label: "Conjunction (0°)" },
    Sextile: { color: "#06b6d4", label: "Sextile (60°)" },
    Square: { color: "#ef4444", label: "Square (90°)" },
    Trine: { color: "#3b82f6", label: "Trine (120°)" },
    Opposition: { color: "#a855f7", label: "Opposition (180°)" },
  };

  // Calculate Transit-to-Natal Aspects
  const biWheelAspects: BiWheelAspect[] = useMemo(() => {
    const aspects: BiWheelAspect[] = [];
    const aspectDefs = [
      { type: "Conjunction" as const, target: 0, orb: 6, color: "#f59e0b" },
      { type: "Opposition" as const, target: 180, orb: 6, color: "#a855f7" },
      { type: "Trine" as const, target: 120, orb: 6, color: "#3b82f6" },
      { type: "Square" as const, target: 90, orb: 5, color: "#ef4444" },
      { type: "Sextile" as const, target: 60, orb: 4, color: "#06b6d4" },
    ];

    transitingPlanets.forEach((t) => {
      westernChart.planets.forEach((n) => {
        let diff = Math.abs(t.longitude - n.longitude);
        if (diff > 180) diff = 360 - diff;

        for (const def of aspectDefs) {
          const orb = Math.abs(diff - def.target);
          if (orb <= def.orb) {
            aspects.push({
              transitPlanet: t.name,
              transitLon: t.longitude,
              natalPlanet: n.name,
              natalLon: n.longitude,
              type: def.type,
              angle: def.target,
              exactAngle: Math.round(diff * 100) / 100,
              orb: Math.round(orb * 100) / 100,
              color: def.color,
            });
            break;
          }
        }
      });
    });

    return aspects;
  }, [transitingPlanets, westernChart.planets]);

  // Filtered aspects when hovering or selecting
  const activeAspects = useMemo(() => {
    if (selectedTransitPlanet) {
      return biWheelAspects.filter((a) => a.transitPlanet === selectedTransitPlanet);
    }
    if (selectedNatalPlanet) {
      return biWheelAspects.filter((a) => a.natalPlanet === selectedNatalPlanet);
    }
    if (hoveredEntity) {
      return biWheelAspects.filter(
        (a) => a.transitPlanet === hoveredEntity || a.natalPlanet === hoveredEntity
      );
    }
    return biWheelAspects;
  }, [biWheelAspects, selectedTransitPlanet, selectedNatalPlanet, hoveredEntity]);

  return (
    <div className="space-y-6">
      {/* Control Header & Stepper */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Orbit className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-serif-celestial font-bold text-slate-100">
              Astronomical Bi-Wheel Transit Chart
            </h3>
            <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              Dual Ephemeris
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Outer Ring = <strong>Current Transiting Sky</strong> · Inner Ring = <strong>Birth Natal Positions</strong>
          </p>
        </div>

        {/* Date Stepper Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl shadow-inner flex-wrap justify-center">
          <button
            onClick={() => onDateChange(-30)}
            className="px-2 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Step Back 30 Days"
          >
            -30d
          </button>
          <button
            onClick={() => onDateChange(-1)}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDateReset}
            className="px-2.5 py-1 text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset to Current Moment"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Today</span>
          </button>
          <button
            onClick={() => onDateChange(1)}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDateChange(30)}
            className="px-2 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Step Forward 30 Days"
          >
            +30d
          </button>
          <span className="text-xs font-mono font-medium text-amber-200 px-2" suppressHydrationWarning>
            {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
          </span>
        </div>
      </div>

      {/* Main Wheel & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* The Bi-Wheel SVG Container (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col items-center justify-center relative">
          {/* Wheel Legend Header */}
          <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <span>Natal (Inner)</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Transit (Outer)</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {activeAspects.length} Active Harmonic Orbs
            </span>
          </div>

          <div className="relative w-full max-w-[620px] aspect-square flex items-center justify-center">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-full select-none"
              style={{ filter: "drop-shadow(0 0 25px rgba(0,0,0,0.8))" }}
            >
              <defs>
                <radialGradient id="biWheelGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
                  <stop offset="70%" stopColor="#07090e" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="1" />
                </radialGradient>
              </defs>

              {/* Background Concentric Rings */}
              <circle cx={center} cy={center} r={outerRadius} fill="url(#biWheelGlow)" />
              <circle cx={center} cy={center} r={outerRadius} stroke="#334155" strokeWidth="1.5" fill="none" />
              <circle cx={center} cy={center} r={transitRingR} stroke="#475569" strokeWidth="1" strokeDasharray="3,3" fill="none" />
              <circle cx={center} cy={center} r={zodiacInnerR} stroke="#334155" strokeWidth="1.5" fill="none" />
              <circle cx={center} cy={center} r={natalRingR} stroke="#334155" strokeWidth="1" strokeDasharray="2,2" fill="none" />
              <circle cx={center} cy={center} r={houseInnerR} stroke="#1e293b" strokeWidth="1" fill="none" />
              <circle cx={center} cy={center} r={coreAspectR} stroke="#334155" strokeWidth="1" strokeDasharray="2,4" fill="none" opacity="0.6" />

              {/* 12 Zodiac Sign Sectors (Middle Ring) */}
              {ZODIAC_SIGNS.map((sign, index) => {
                const startDeg = index * 30;
                const midDeg = startDeg + 15;
                const p1 = getCoordinates(startDeg, transitRingR);
                const p2 = getCoordinates(startDeg, zodiacInnerR);
                const midPt = getCoordinates(midDeg, (transitRingR + zodiacInnerR) / 2);
                const elemColor = elementColors[sign.element]?.fill || "#f59e0b";

                return (
                  <g key={sign.name}>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#334155" strokeWidth="1" />
                    <text
                      x={midPt.x}
                      y={midPt.y}
                      fill={elemColor}
                      fontSize="14"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {sign.symbol}
                    </text>
                  </g>
                );
              })}

              {/* Natal House Cusps */}
              {westernChart.houses.map((house) => {
                const cuspPtOuter = getCoordinates(house.longitude, zodiacInnerR);
                const cuspPtInner = getCoordinates(house.longitude, coreAspectR);
                const isAxis = [1, 4, 7, 10].includes(house.house);

                return (
                  <line
                    key={house.house}
                    x1={cuspPtOuter.x}
                    y1={cuspPtOuter.y}
                    x2={cuspPtInner.x}
                    y2={cuspPtInner.y}
                    stroke={isAxis ? "#94a3b8" : "#334155"}
                    strokeWidth={isAxis ? "1.5" : "0.75"}
                    strokeDasharray={isAxis ? "none" : "2,2"}
                  />
                );
              })}

              {/* Aspect Lines Between Transiting & Natal Planets */}
              {activeAspects.map((aspect, i) => {
                const pTransit = getCoordinates(aspect.transitLon, coreAspectR);
                const pNatal = getCoordinates(aspect.natalLon, coreAspectR);
                const isHighlighted =
                  selectedTransitPlanet === aspect.transitPlanet ||
                  selectedNatalPlanet === aspect.natalPlanet ||
                  hoveredEntity === aspect.transitPlanet ||
                  hoveredEntity === aspect.natalPlanet;

                return (
                  <line
                    key={i}
                    x1={pTransit.x}
                    y1={pTransit.y}
                    x2={pNatal.x}
                    y2={pNatal.y}
                    stroke={aspect.color}
                    strokeWidth={isHighlighted ? 2.5 : 1}
                    strokeOpacity={isHighlighted ? 0.95 : 0.45}
                    strokeDasharray={aspect.type === "Opposition" || aspect.type === "Square" ? "3,3" : "none"}
                  />
                );
              })}

              {/* Natal Planets (Inner Ring) */}
              {westernChart.planets.map((p) => {
                const pt = getCoordinates(p.longitude, (zodiacInnerR + natalRingR) / 2);
                const isSelected = selectedNatalPlanet === p.name;
                const isHovered = hoveredEntity === p.name;

                return (
                  <g
                    key={p.name}
                    className="cursor-pointer transition-all"
                    onClick={() => {
                      setSelectedNatalPlanet(isSelected ? null : p.name);
                      setSelectedTransitPlanet(null);
                    }}
                    onMouseEnter={() => setHoveredEntity(p.name)}
                    onMouseLeave={() => setHoveredEntity(null)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected || isHovered ? 12 : 9}
                      fill={isSelected ? "#6366f1" : "#1e293b"}
                      stroke={isSelected ? "#a5b4fc" : "#475569"}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <text
                      x={pt.x}
                      y={pt.y}
                      fill={isSelected ? "#ffffff" : "#cbd5e1"}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {p.symbol || p.name.slice(0, 2)}
                    </text>
                  </g>
                );
              })}

              {/* Transiting Planets (Outer Ring) */}
              {transitingPlanets.map((t) => {
                const pt = getCoordinates(t.longitude, (outerRadius + transitRingR) / 2);
                const isSelected = selectedTransitPlanet === t.name;
                const isHovered = hoveredEntity === t.name;

                return (
                  <g
                    key={t.name}
                    className="cursor-pointer transition-all"
                    onClick={() => {
                      setSelectedTransitPlanet(isSelected ? null : t.name);
                      setSelectedNatalPlanet(null);
                    }}
                    onMouseEnter={() => setHoveredEntity(t.name)}
                    onMouseLeave={() => setHoveredEntity(null)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected || isHovered ? 13 : 10}
                      fill={isSelected ? "#d97706" : "#78350f"}
                      stroke={isSelected ? "#fde68a" : "#f59e0b"}
                      strokeWidth={isSelected ? 2 : 1.25}
                    />
                    <text
                      x={pt.x}
                      y={pt.y}
                      fill="#fef3c7"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {t.name.slice(0, 2)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick Clear Filter */}
          {(selectedTransitPlanet || selectedNatalPlanet) && (
            <button
              onClick={() => {
                setSelectedTransitPlanet(null);
                setSelectedNatalPlanet(null);
              }}
              className="mt-3 px-3 py-1 bg-slate-900 border border-slate-700 text-amber-300 text-xs rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Clear Filter: Showing all aspects
            </button>
          )}
        </div>

        {/* Detailed Inspector & Aspects Ledger (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Aspects Table Card */}
          <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Transit Aspects to Natal Positions ({activeAspects.length})
              </h4>
              <span className="text-[10px] text-slate-400">Orb within 6°</span>
            </div>

            {activeAspects.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No major aspects detected for this configuration. Step date forward or backward to observe ingress.
              </p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {activeAspects.map((aspect, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: aspect.color }}
                      />
                      <div>
                        <span className="font-bold text-amber-300">
                          {aspect.transitPlanet}{" "}
                          <span className="text-[10px] font-normal text-slate-400">(T)</span>
                        </span>
                        <span className="text-slate-400 font-medium mx-1.5">
                          {aspect.type === "Conjunction"
                            ? "☌ Conjunct"
                            : aspect.type === "Opposition"
                            ? "☍ Opposing"
                            : aspect.type === "Trine"
                            ? "△ Trining"
                            : aspect.type === "Square"
                            ? "□ Squaring"
                            : "⚹ Sextiling"}
                        </span>
                        <span className="font-bold text-indigo-300">
                          {aspect.natalPlanet}{" "}
                          <span className="text-[10px] font-normal text-slate-400">(N)</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[11px] text-slate-300 block">
                        {aspect.exactAngle}°
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        orb {aspect.orb}°
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aspect Color Guide */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 block">
              Transit Harmonic Color Spectrum
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
              {Object.entries(aspectStyles).map(([type, style]) => (
                <div key={type} className="flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-md border border-slate-800">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: style.color }} />
                  <span className="text-slate-300 font-medium truncate">{style.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
