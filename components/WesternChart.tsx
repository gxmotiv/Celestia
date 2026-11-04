"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  WesternChartData,
  PlanetPosition,
  AspectData,
  ZODIAC_SIGNS,
  normalizeDegrees,
} from "@/lib/astronomy/ephemeris";
import {
  SUN_SIGN_INTERPRETATIONS,
  MOON_SIGN_INTERPRETATIONS,
  ASCENDANT_INTERPRETATIONS,
  HOUSE_INTERPRETATIONS,
  ASPECT_INTERPRETATIONS,
} from "@/lib/astronomy/interpretations";
import { Info, Sparkles, Orbit, Compass, Eye, SlidersHorizontal, Layers, Shield, ShieldAlert, Sparkle, CheckCircle2 } from "lucide-react";
import { MinorAspectsPanel } from "./MinorAspectsPanel";
import { MinorAspect, MinorAspectsEngine } from "@/lib/astronomy/minorAspects";
import { PlanetSelector } from "./PlanetSelector";
import { AdvancedWesternPanel } from "./AdvancedWesternPanel";
import { RelationshipAstrologyView } from "./RelationshipAstrologyView";
import { WesternBenchmarkPanel } from "./WesternBenchmarkPanel";
import { AlmutenHoursPanel } from "./AlmutenHoursPanel";
import {
  ASTEROID_SIGN_INTERPRETATIONS,
  ASTEROID_HOUSE_INTERPRETATIONS,
  LILITH_SIGN_INTERPRETATIONS,
  LILITH_HOUSE_INTERPRETATIONS,
  ADDITIONAL_POINTS_INTERPRETATIONS,
} from "@/lib/astronomy/westernExtendedInterpretations";

interface WesternChartProps {
  chartData: WesternChartData;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  latitude?: number;
  longitude?: number;
  timezoneOffset?: number;
}

export function WesternChart({
  chartData,
  fullName = "Leonardo da Vinci",
  birthDate = "1452-04-15",
  birthTime = "22:00",
  latitude = 43.7844,
  longitude = 10.9253,
  timezoneOffset = 1,
}: WesternChartProps) {
  // Construct comprehensive list of all celestial bodies and points available
  const allAvailableBodies: PlanetPosition[] = React.useMemo(() => {
    const list: PlanetPosition[] = [...chartData.planets];

    if (chartData.asteroids) {
      list.push(chartData.asteroids.ceres);
      list.push(chartData.asteroids.pallas);
      list.push(chartData.asteroids.juno);
      list.push(chartData.asteroids.vesta);
    }

    if (chartData.additionalPoints) {
      list.push(chartData.additionalPoints.meanLilith);
      list.push(chartData.additionalPoints.trueLilith);
      list.push(chartData.additionalPoints.whiteMoon);
      list.push(chartData.additionalPoints.vertex);
      list.push(chartData.additionalPoints.antiVertex);
      list.push(chartData.additionalPoints.eastPoint);
      list.push(chartData.additionalPoints.proserpine);
      list.push(chartData.additionalPoints.hypnos);
    }

    if (chartData.arabianParts) {
      chartData.arabianParts.allParts.forEach((part) => {
        list.push({
          id: `Part_${part.id}`,
          name: part.name,
          symbol: part.symbol,
          longitude: part.longitude,
          latitude: 0,
          speed: 0,
          isRetrograde: false,
          sign: part.sign,
          signIndex: part.signIndex,
          signDegree: part.signDegree,
          signDegreeFormatted: part.signDegreeFormatted,
          house: part.house,
          element: (chartData.planets[0]?.element || "Fire") as any,
          modality: (chartData.planets[0]?.modality || "Cardinal") as any,
        });
      });
    }

    return list;
  }, [chartData]);

  // Selected bodies for the wheel (default: 10 classical planets + Nodes + Chiron + 4 Asteroids + Lilith + Fortune)
  const [selectedBodies, setSelectedBodies] = useState<string[]>([
    "Sun",
    "Moon",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
    "Pluto",
    "NorthNode",
    "SouthNode",
    "Chiron",
    "Ceres",
    "Pallas",
    "Juno",
    "Vesta",
    "MeanLilith",
    "Part_fortune",
  ]);

  const toggleBody = (id: string) => {
    setSelectedBodies((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllGroup = (groupPlanets: string[]) => {
    setSelectedBodies((prev) => Array.from(new Set([...prev, ...groupPlanets])));
  };

  const deselectAllGroup = (groupPlanets: string[]) => {
    setSelectedBodies((prev) => prev.filter((id) => !groupPlanets.includes(id)));
  };

  const [selectedPlanet, setSelectedPlanet] = useState<PlanetPosition>(
    chartData.planets.find((p) => p.name === "Sun") || chartData.planets[0]
  );
  const [selectedAspect, setSelectedAspect] = useState<AspectData | null>(null);
  const [selectedMinorAspect, setSelectedMinorAspect] = useState<MinorAspect | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [aspectDisplayMode, setAspectDisplayMode] = useState<"both" | "major" | "minor" | "none">("both");
  const [aspectsTab, setAspectsTab] = useState<"major" | "minor">("major");
  const [westernSubView, setWesternSubView] = useState<"chart" | "almuten" | "advanced" | "relationships" | "verification">("chart");

  // Minor Aspects calculation
  const minorAspects = React.useMemo(() => {
    return (
      chartData.minorAspects ||
      new MinorAspectsEngine().calculateMinorAspects(chartData.planets)
    );
  }, [chartData.minorAspects, chartData.planets]);

  // SVG Geometry Constants
  const size = 640;
  const center = size / 2;
  const radius = center - 24;
  const outerRingR = radius;
  const zodiacInnerR = radius - 46;
  const houseInnerR = zodiacInnerR - 40;
  const aspectInnerR = houseInnerR - 20;

  // The Ascendant is traditionally positioned at 9 o'clock (180° in standard Cartesian coordinates)
  // Or in SVG where angle 0 is at 3 o'clock: rotation offset = 180 - Ascendant.longitude
  const ascLon = chartData.ascendant.longitude;
  const rotationOffset = 180 - ascLon;

  // Convert zodiac longitude to SVG coordinates (X, Y) with 2 decimal places rounding
  const getCoordinates = (lon: number, r: number) => {
    // Ecliptic increases counter-clockwise in traditional charts
    const adjustedAngle = (lon + rotationOffset) * (Math.PI / 180.0);
    const x = Math.round((center + r * Math.cos(adjustedAngle)) * 100) / 100;
    const y = Math.round((center - r * Math.sin(adjustedAngle)) * 100) / 100;
    return { x, y };
  };

  // Color mappings for elements
  const elementColors: Record<string, { bg: string; text: string; fill: string; ring: string }> = {
    Fire: { bg: "bg-red-500/15", text: "text-red-400", fill: "#ef4444", ring: "rgba(239, 68, 68, 0.25)" },
    Earth: { bg: "bg-emerald-500/15", text: "text-emerald-400", fill: "#10b981", ring: "rgba(16, 185, 129, 0.25)" },
    Air: { bg: "bg-amber-500/15", text: "text-amber-400", fill: "#f59e0b", ring: "rgba(245, 158, 11, 0.25)" },
    Water: { bg: "bg-blue-500/15", text: "text-blue-400", fill: "#3b82f6", ring: "rgba(59, 130, 246, 0.25)" },
  };

  // Aspect colors
  const aspectColors: Record<string, string> = {
    Conjunction: "#f59e0b", // Gold
    Sextile: "#06b6d4", // Cyan
    Trine: "#3b82f6", // Blue
    Square: "#ef4444", // Red
    Opposition: "#a855f7", // Purple
    Quincunx: "#14b8a6",
    Semisextile: "#64748b",
  };

  // Count elements & modalities
  const elementCounts = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const modalityCounts = { Cardinal: 0, Fixed: 0, Mutable: 0 };

  chartData.planets.forEach((p) => {
    if (["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].includes(p.name)) {
      elementCounts[p.element] = (elementCounts[p.element] || 0) + 1;
      modalityCounts[p.modality] = (modalityCounts[p.modality] || 0) + 1;
    }
  });

  // Get interpretation for selected planet
  const getPlanetInterpretation = (planet: PlanetPosition) => {
    if (planet.name === "Sun") {
      const info = SUN_SIGN_INTERPRETATIONS[planet.sign];
      const houseInfo = HOUSE_INTERPRETATIONS[planet.house];
      return {
        title: `${planet.name} in ${planet.sign}`,
        archetype: info?.archetype || "Solar Essence",
        essence: info?.essence || "Vital life force and conscious purpose.",
        strengths: info?.strengths || [],
        growthEdges: info?.growthEdges || [],
        houseNote: houseInfo ? `Expresses in ${houseInfo.title}: ${houseInfo.area}.` : "",
      };
    } else if (planet.name === "Moon") {
      const essence = MOON_SIGN_INTERPRETATIONS[planet.sign] || "Emotional sanctuary and subconscious needs.";
      const houseInfo = HOUSE_INTERPRETATIONS[planet.house];
      return {
        title: `${planet.name} in ${planet.sign}`,
        archetype: "The Emotional Anchor & Lunar Sanctum",
        essence,
        strengths: ["Intuitive attunement", "Emotional adaptability", "Inner sanctuary"],
        growthEdges: ["Mood swings", "Guarded defensiveness"],
        houseNote: houseInfo ? `Nourished in ${houseInfo.title}: ${houseInfo.area}.` : "",
      };
    } else if (planet.name === "Ascendant") {
      const essence = ASCENDANT_INTERPRETATIONS[planet.sign] || "Physical vitality and persona.";
      return {
        title: `Rising Sign (${planet.sign})`,
        archetype: "The Physical Mask & First Perception",
        essence,
        strengths: ["Authentic persona", "Natural magnetism", "Distinctive presence"],
        growthEdges: ["Over-identifying with superficial optics"],
        houseNote: "Sets the baseline perspective for the entire 12-house lifecycle.",
      };
    } else if (["Ceres", "Pallas", "Juno", "Vesta"].includes(planet.name)) {
      const astKey = planet.name as "Ceres" | "Pallas" | "Juno" | "Vesta";
      const signMeaning = ASTEROID_SIGN_INTERPRETATIONS[astKey]?.[planet.sign] || "Sacred feminine asteroid archetype.";
      const houseMeaning = ASTEROID_HOUSE_INTERPRETATIONS[astKey]?.[planet.house] || "";
      const archetypes: Record<string, string> = {
        Ceres: "The Nurturing Matriarch & Sacred Harvest",
        Pallas: "Athena's Warrior Wisdom & Pattern Strategist",
        Juno: "Divine Consort & Sacred Partnership Parity",
        Vesta: "The Sacred Flame, Devotion & Sanctuary",
      };
      return {
        title: `${planet.name} in ${planet.sign}`,
        archetype: archetypes[planet.name] || "Major Asteroid",
        essence: `${signMeaning} ${houseMeaning}`,
        strengths: ["Dedicated sacred devotion", "Empowered feminine consciousness", "Specialized soul intelligence"],
        growthEdges: ["Avoid extreme self-sacrifice or dogmatic defense"],
        houseNote: `Anchored in House ${planet.house}.`,
      };
    } else if (planet.name.includes("Lilith")) {
      const signMeaning = LILITH_SIGN_INTERPRETATIONS[planet.sign] || "Primal sovereignty and untamed shadow.";
      const houseMeaning = LILITH_HOUSE_INTERPRETATIONS[planet.house] || "";
      return {
        title: `${planet.name} in ${planet.sign}`,
        archetype: "The Untamed Shadow & Sovereign Rebel",
        essence: `${signMeaning} ${houseMeaning}`,
        strengths: ["Uncompromising truth-telling", "Refusal of subjugation", "Primal instinctual wisdom"],
        growthEdges: ["Rage projection", "Fear of intimacy due to betrayal expectations"],
        houseNote: `Challenging and liberating House ${planet.house}.`,
      };
    } else if (ADDITIONAL_POINTS_INTERPRETATIONS[planet.name]) {
      return {
        title: `${planet.name} in ${planet.sign}`,
        archetype: "Cosmic Destined Coordinate",
        essence: ADDITIONAL_POINTS_INTERPRETATIONS[planet.name],
        strengths: ["Fated life catalyst", "Intuitive navigation", "Spiritual synchronicity"],
        growthEdges: ["Surrendering control over fated encounters"],
        houseNote: `Manifesting through House ${planet.house}.`,
      };
    } else {
      const houseInfo = HOUSE_INTERPRETATIONS[planet.house];
      return {
        title: `${planet.name} in ${planet.sign}`,
        archetype: `${planet.element} ${planet.modality} Vibration`,
        essence: `${planet.name} directs its energy through the filter of ${planet.sign}, emphasizing ${planet.element} virtues (${elementColors[planet.element].text}) with ${planet.modality} movement.`,
        strengths: [`Natural mastery of ${planet.element.toLowerCase()} dynamics`, "Focused planetary drive"],
        growthEdges: ["Balancing opposing polarities"],
        houseNote: houseInfo ? `Operating in ${houseInfo.title}: ${houseInfo.area}.` : "",
      };
    }
  };

  const selectedPlanetInfo = getPlanetInterpretation(selectedPlanet);

  return (
    <div className="space-y-8">
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Sun Sign</span>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-sm font-semibold">☉</span>
            <span className="text-sm font-semibold text-slate-100">
              {chartData.planets.find((p) => p.name === "Sun")?.signDegreeFormatted || "Aries"}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Moon Sign</span>
          <div className="flex items-center gap-1.5">
            <span className="text-blue-300 text-sm font-semibold">☽</span>
            <span className="text-sm font-semibold text-slate-100">
              {chartData.planets.find((p) => p.name === "Moon")?.signDegreeFormatted || "Taurus"}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Ascendant (Rising)</span>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 text-xs font-semibold">AC</span>
            <span className="text-sm font-semibold text-slate-100">
              {chartData.ascendant.signDegreeFormatted}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Midheaven (MC)</span>
          <div className="flex items-center gap-1.5">
            <span className="text-purple-400 text-xs font-semibold">MC</span>
            <span className="text-sm font-semibold text-slate-100">
              {chartData.midheaven.signDegreeFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Western Systems Master Navigation Strip */}
      <div className="relative flex items-center gap-1.5 p-1 bg-slate-950/90 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar shadow-inner">
        {[
          { id: "chart", label: "Natal Wheel & Placements", icon: Compass },
          { id: "almuten", label: "Almuten & Planetary Hours", icon: Shield },
          { id: "advanced", label: "Advanced Western Engines", icon: Sparkles },
          { id: "relationships", label: "Synastry & Relationships", icon: Orbit },
          { id: "verification", label: "Verification & Benchmarks", icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = westernSubView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setWesternSubView(tab.id as any)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer z-10 ${
                isActive
                  ? "text-amber-200"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeWesternSubViewIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-amber-500/10 border border-amber-500/40 rounded-lg shadow-sm -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.id === "verification" && (
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono font-bold border border-emerald-500/30">
                  27 Tests
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={westernSubView}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="w-full"
        >
          {/* VIEW 4: VERIFICATION & BENCHMARKS */}
          {westernSubView === "verification" && (
            <WesternBenchmarkPanel
              chartData={chartData}
              fullName={fullName}
              birthDate={birthDate}
              birthTime={birthTime}
            />
          )}

          {/* VIEW: ALMUTEN FIGURIS & PLANETARY HOURS */}
          {westernSubView === "almuten" && (
            <AlmutenHoursPanel chartData={chartData} />
          )}

          {/* VIEW 2: ADVANCED WESTERN ENGINES */}
          {westernSubView === "advanced" && (
            <AdvancedWesternPanel
              chartData={chartData}
              fullName={fullName}
              birthDateStr={birthDate}
              birthTimeStr={birthTime}
              latitude={latitude}
              longitude={longitude}
              timezoneOffset={timezoneOffset}
            />
          )}

          {/* VIEW 3: RELATIONSHIP ASTROLOGY */}
          {westernSubView === "relationships" && (
            <RelationshipAstrologyView
              person1Chart={chartData}
              person1Name={fullName}
              person1Date={birthDate}
              person1Time={birthTime}
              person1Lat={latitude}
              person1Lon={longitude}
            />
          )}

          {/* VIEW 1: NATAL WHEEL & PLACEMENTS */}
          {westernSubView === "chart" && (
            <>
              {/* Planet & Celestial Bodies Selector */}
              <PlanetSelector
                selectedBodies={selectedBodies}
                onToggleBody={toggleBody}
                onSelectAllGroup={selectAllGroup}
                onDeselectAllGroup={deselectAllGroup}
              />

      {/* Main Wheel & Planet Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Interactive SVG Wheel (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl relative shadow-2xl">
          {/* Wheel Aspect Display Controls */}
          <div className="w-full flex flex-wrap items-center justify-between mb-3 px-1 gap-2 text-xs">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Orbit className="w-3.5 h-3.5 text-amber-400" />
              Wheel Aspect Cords:
            </span>
            <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[11px]">
              {[
                { id: "both", label: "All Aspects" },
                { id: "major", label: "Major Only" },
                { id: "minor", label: "Minor Only" },
                { id: "none", label: "Off" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setAspectDisplayMode(m.id as any)}
                  className={`px-2.5 py-0.5 rounded transition-colors ${
                    aspectDisplayMode === m.id
                      ? "bg-amber-500/20 text-amber-300 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full max-w-[560px] aspect-square relative">
            <svg
              suppressHydrationWarning
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-full select-none"
              style={{ filter: "drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5))" }}
            >
              <defs>
                {/* Subtle radial glow */}
                <radialGradient id="celestialGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
                  <stop offset="70%" stopColor="#090b10" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#030712" stopOpacity="1" />
                </radialGradient>
              </defs>

              {/* Background Plate */}
              <circle cx={center} cy={center} r={outerRingR} fill="url(#celestialGlow)" />
              <circle cx={center} cy={center} r={outerRingR} stroke="#334155" strokeWidth="1.5" fill="none" />
              <circle cx={center} cy={center} r={zodiacInnerR} stroke="#334155" strokeWidth="1" fill="none" />
              <circle cx={center} cy={center} r={houseInnerR} stroke="#1e293b" strokeWidth="1" fill="none" />
              <circle cx={center} cy={center} r={aspectInnerR} stroke="#334155" strokeWidth="1" strokeDasharray="2,3" fill="none" opacity="0.6" />

              {/* 12 Zodiac Sign Sectors */}
              {ZODIAC_SIGNS.map((sign, index) => {
                const startDeg = index * 30;
                const endDeg = (index + 1) * 30;
                const midDeg = startDeg + 15;

                const p1 = getCoordinates(startDeg, outerRingR);
                const p2 = getCoordinates(startDeg, zodiacInnerR);
                const midPt = getCoordinates(midDeg, (outerRingR + zodiacInnerR) / 2);

                const elemColor = elementColors[sign.element].fill;

                return (
                  <g key={sign.name}>
                    {/* Sector Divider */}
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#334155" strokeWidth="1" />

                    {/* Zodiac Symbol Glyph */}
                    <text
                      x={midPt.x}
                      y={midPt.y}
                      fill={elemColor}
                      fontSize="17"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="cursor-default transition-all"
                    >
                      {sign.symbol}
                    </text>
                  </g>
                );
              })}

              {/* 12 House Cusp Spokes */}
              {chartData.houses.map((house) => {
                const cuspPtOuter = getCoordinates(house.longitude, zodiacInnerR);
                const cuspPtInner = getCoordinates(house.longitude, aspectInnerR);
                const isAxis = [1, 4, 7, 10].includes(house.house);

                // Label position
                const nextHouseLon = chartData.houses[house.house % 12].longitude;
                let span = nextHouseLon - house.longitude;
                if (span < 0) span += 360;
                const houseMidLon = normalizeDegrees(house.longitude + span / 2);
                const labelPt = getCoordinates(houseMidLon, (houseInnerR + aspectInnerR) / 2);

                return (
                  <g key={house.house}>
                    <line
                      x1={cuspPtOuter.x}
                      y1={cuspPtOuter.y}
                      x2={cuspPtInner.x}
                      y2={cuspPtInner.y}
                      stroke={isAxis ? "#94a3b8" : "#334155"}
                      strokeWidth={isAxis ? "1.75" : "0.75"}
                      strokeDasharray={isAxis ? "none" : "2,2"}
                    />
                    <text
                      x={labelPt.x}
                      y={labelPt.y}
                      fill="#64748b"
                      fontSize="10"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="tabular-nums font-mono"
                    >
                      {house.house}
                    </text>
                  </g>
                );
              })}

              {/* Major Aspect Lines across Center */}
              {(aspectDisplayMode === "major" || aspectDisplayMode === "both") &&
                chartData.aspects.map((asp, i) => {
                  const p1 = chartData.planets.find((p) => p.name === asp.planet1) || (asp.planet1 === "Ascendant" ? chartData.ascendant : chartData.midheaven);
                  const p2 = chartData.planets.find((p) => p.name === asp.planet2) || (asp.planet2 === "Ascendant" ? chartData.ascendant : chartData.midheaven);

                  if (!p1 || !p2) return null;

                  const c1 = getCoordinates(p1.longitude, aspectInnerR);
                  const c2 = getCoordinates(p2.longitude, aspectInnerR);
                  const color = aspectColors[asp.aspectName] || "#64748b";
                  const isHovered = hoveredPlanet && (asp.planet1 === hoveredPlanet || asp.planet2 === hoveredPlanet);
                  const isPlanetSelected = selectedPlanet && (asp.planet1 === selectedPlanet.name || asp.planet2 === selectedPlanet.name);
                  const isHighlighted = isHovered || isPlanetSelected;
                  const opacity = isHighlighted ? 0.95 : (hoveredPlanet || selectedPlanet) ? 0.2 : 0.35;
                  const strokeWidth = isHighlighted ? 2.5 : Math.round(Math.max(0.6, 2 - asp.orb * 0.25) * 100) / 100;
                  const strokeColor = isHighlighted ? (isHovered ? "#fbbf24" : color) : color;

                  return (
                    <line
                      key={`major-${i}`}
                      x1={c1.x}
                      y1={c1.y}
                      x2={c2.x}
                      y2={c2.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity}
                      className="cursor-pointer transition-all hover:stroke-amber-400"
                      onClick={() => {
                        setSelectedAspect(asp);
                        setSelectedMinorAspect(null);
                        setAspectsTab("major");
                      }}
                    />
                  );
                })}

              {/* Minor Aspect Lines across Center */}
              {(aspectDisplayMode === "minor" || aspectDisplayMode === "both") &&
                minorAspects.map((asp, i) => {
                  const p1 = chartData.planets.find((p) => p.name === asp.planet1) || (asp.planet1 === "Ascendant" ? chartData.ascendant : chartData.midheaven);
                  const p2 = chartData.planets.find((p) => p.name === asp.planet2) || (asp.planet2 === "Ascendant" ? chartData.ascendant : chartData.midheaven);

                  if (!p1 || !p2) return null;

                  const c1 = getCoordinates(p1.longitude, aspectInnerR);
                  const c2 = getCoordinates(p2.longitude, aspectInnerR);
                  const isHovered = hoveredPlanet && (asp.planet1 === hoveredPlanet || asp.planet2 === hoveredPlanet);
                  const isSelected = selectedMinorAspect && selectedMinorAspect.planet1 === asp.planet1 && selectedMinorAspect.planet2 === asp.planet2 && selectedMinorAspect.aspectType.name === asp.aspectType.name;
                  const opacity = isSelected ? 1 : isHovered ? 0.9 : 0.45;
                  const strokeWidth = isSelected ? 2.5 : isHovered ? 2 : Math.round(Math.max(0.5, 1.6 - asp.orb * 0.35) * 100) / 100;

                  return (
                    <line
                      key={`minor-${i}`}
                      x1={c1.x}
                      y1={c1.y}
                      x2={c2.x}
                      y2={c2.y}
                      stroke={asp.aspectType.color}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity}
                      strokeDasharray={
                        asp.aspectType.nature === "spiritual"
                          ? "2,3"
                          : asp.aspectType.nature === "challenging"
                          ? "4,2"
                          : undefined
                      }
                      className="cursor-pointer transition-all hover:stroke-amber-300"
                      onClick={() => {
                        setSelectedMinorAspect(asp);
                        setSelectedAspect(null);
                        setAspectsTab("minor");
                      }}
                    />
                  );
                })}

              {/* Ascendant & Midheaven Markers */}
              {(() => {
                const ascPt = getCoordinates(chartData.ascendant.longitude, zodiacInnerR + 10);
                const mcPt = getCoordinates(chartData.midheaven.longitude, zodiacInnerR + 10);
                return (
                  <>
                    <text
                      x={ascPt.x}
                      y={ascPt.y}
                      fill="#10b981"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      ASC
                    </text>
                    <text
                      x={mcPt.x}
                      y={mcPt.y}
                      fill="#a855f7"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      MC
                    </text>
                  </>
                );
              })()}

              {/* Planets Position Markers */}
              {allAvailableBodies
                .filter((b) => selectedBodies.includes(b.id) || selectedBodies.includes(b.name))
                .map((planet) => {
                  const isAsteroid = ["Ceres", "Pallas", "Juno", "Vesta"].includes(planet.name);
                  const isPoint = ["MeanLilith", "TrueLilith", "WhiteMoon", "Vertex", "AntiVertex", "EastPoint", "Proserpine", "Hypnos"].includes(planet.id);
                  const isArabian = planet.id.startsWith("Part_");
                  
                  // Radial layer offset to prevent overcrowding when multiple asteroids/points are active
                  const radialR = isArabian
                    ? houseInnerR + 6
                    : isPoint
                    ? houseInnerR + 14
                    : isAsteroid
                    ? (zodiacInnerR + houseInnerR) / 2 - 5
                    : (zodiacInnerR + houseInnerR) / 2;

                  const pt = getCoordinates(planet.longitude, radialR);
                  const isSelected = selectedPlanet.id === planet.id;
                  const isHovered = hoveredPlanet === planet.name;
                  const elemCol = isAsteroid
                    ? "#f43f5e"
                    : isPoint
                    ? "#c084fc"
                    : isArabian
                    ? "#34d399"
                    : elementColors[planet.element]?.fill || "#f59e0b";

                  const markerRadius = isAsteroid ? 8 : isPoint || isArabian ? 7 : 10;
                  const fontSize = isAsteroid ? "9" : isPoint || isArabian ? "8" : "11";

                  return (
                    <g
                      key={planet.id}
                      className="cursor-pointer transition-all"
                      onClick={() => {
                        setSelectedPlanet(planet);
                        setSelectedAspect(null);
                      }}
                      onMouseEnter={() => setHoveredPlanet(planet.name)}
                      onMouseLeave={() => setHoveredPlanet(null)}
                    >
                      {/* Planet selection ring & celestial glow */}
                      {(isSelected || isHovered) && (
                        <>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={markerRadius + 7}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="1"
                            strokeOpacity={isSelected ? 0.45 : 0.25}
                            strokeDasharray="2,3"
                          />
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={markerRadius + 4}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            strokeDasharray={isSelected ? "none" : "2,2"}
                          />
                        </>
                      )}

                      {/* Planet disc */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={markerRadius}
                        fill="#0f172a"
                        stroke={isSelected ? "#f59e0b" : elemCol}
                        strokeWidth="1.2"
                      />

                      {/* Planet Glyph */}
                      <text
                        x={pt.x}
                        y={pt.y}
                        fill={isSelected ? "#fbbf24" : isAsteroid ? "#fda4af" : isPoint ? "#e9d5ff" : isArabian ? "#a7f3d0" : "#f8fafc"}
                        fontSize={fontSize}
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {planet.symbol}
                      </text>
                    </g>
                  );
                })}
            </svg>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Interactive Chart Wheel: Click any planet marker or aspect cord to view details.
          </p>
        </div>

        {/* Selected Planet / Aspect Dossier (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Placement Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPlanet.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4"
            >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-amber-400">{selectedPlanet.symbol}</span>
                  <h3 className="text-lg font-bold text-slate-100">{selectedPlanetInfo.title}</h3>
                  {selectedPlanet.isRetrograde && (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                      Rx Retrograde
                    </span>
                  )}
                  {selectedPlanet.solarProximity && selectedPlanet.solarProximity !== "Free" && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        selectedPlanet.solarProximity === "Cazimi"
                          ? "text-amber-300 bg-amber-500/20 border-amber-400"
                          : selectedPlanet.solarProximity === "Combust"
                          ? "text-rose-400 bg-rose-500/20 border-rose-500/40"
                          : "text-orange-300 bg-orange-500/15 border-orange-500/30"
                      }`}
                    >
                      {selectedPlanet.solarProximity === "Cazimi"
                        ? "✦ Cazimi (<17')"
                        : selectedPlanet.solarProximity === "Combust"
                        ? "🔥 Combust (<8.5°)"
                        : "☼ Under Beams (<17°)"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-300/80 mt-0.5">{selectedPlanetInfo.archetype}</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-slate-300 block">
                  {selectedPlanet.signDegreeFormatted}
                </span>
                <span className="text-[11px] text-slate-400">
                  House {selectedPlanet.house} · {selectedPlanet.element}
                </span>
              </div>
            </div>

            {/* Core Essence */}
            <p className="text-xs text-slate-300 leading-relaxed">{selectedPlanetInfo.essence}</p>

            {/* House Placement Note */}
            {selectedPlanetInfo.houseNote && (
              <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded text-xs text-slate-400">
                <span className="text-amber-400/90 font-medium">House Domain: </span>
                {selectedPlanetInfo.houseNote}
              </div>
            )}

            {/* Strengths & Growth */}
            {selectedPlanetInfo.strengths.length > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-400 block mb-1">
                    Solar Gifts & Talents
                  </span>
                  <ul className="space-y-1">
                    {selectedPlanetInfo.strengths.map((str, i) => (
                      <li key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                        <span className="text-emerald-500">·</span>
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-rose-400 block mb-1">
                    Evolutionary Edges
                  </span>
                  <ul className="space-y-1">
                    {selectedPlanetInfo.growthEdges.map((ge, i) => (
                      <li key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                        <span className="text-rose-500">·</span>
                        {ge}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

          {/* Quick Select Planet Pills */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">Active Planets, Asteroids & Points ({allAvailableBodies.filter((b) => selectedBodies.includes(b.id) || selectedBodies.includes(b.name)).length}):</span>
            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
              {allAvailableBodies
                .filter((b) => selectedBodies.includes(b.id) || selectedBodies.includes(b.name))
                .map((p) => {
                  const isActive = selectedPlanet.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPlanet(p);
                        setSelectedAspect(null);
                      }}
                      className={`px-2 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      <span className="text-amber-400 font-mono font-bold">{p.symbol}</span>
                      <span>{p.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Elemental & Modality Breakdown */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">Elemental & Modality Distribution</span>

            {/* Elements */}
            <div className="grid grid-cols-4 gap-2">
              {(["Fire", "Earth", "Air", "Water"] as const).map((el) => {
                const count = elementCounts[el];
                const pct = Math.round((count / 10) * 100);
                const col = elementColors[el];
                return (
                  <div key={el} className={`p-2 rounded border border-slate-800 ${col.bg}`}>
                    <span className={`text-[11px] font-semibold block ${col.text}`}>{el}</span>
                    <span className="text-sm font-bold text-slate-100 tabular-nums">{count}</span>
                    <span className="text-[10px] text-slate-400 block">{pct}%</span>
                  </div>
                );
              })}
            </div>

            {/* Modalities */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
              <div>
                <span className="text-[11px] text-slate-400 block">Cardinal</span>
                <span className="text-xs font-semibold text-slate-200">{modalityCounts.Cardinal} planets</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Fixed</span>
                <span className="text-xs font-semibold text-slate-200">{modalityCounts.Fixed} planets</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Mutable</span>
                <span className="text-xs font-semibold text-slate-200">{modalityCounts.Mutable} planets</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aspects Master Section (Major & Minor Tabs) */}
      <div className="space-y-4">
        {/* Navigation Tabs between Major and Minor */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAspectsTab("major")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                aspectsTab === "major"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Orbit className="w-4 h-4 text-amber-400" />
              <span>Major Ptolemaic Aspects</span>
              <span className="px-1.5 py-0.2 bg-slate-900 text-amber-300 rounded font-mono text-[10px] border border-slate-700">
                {chartData.aspects.length}
              </span>
            </button>

            <button
              onClick={() => setAspectsTab("minor")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                aspectsTab === "minor"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Minor & Harmonic Aspects</span>
              <span className="px-1.5 py-0.2 bg-slate-900 text-cyan-300 rounded font-mono text-[10px] border border-slate-700">
                {minorAspects.length}
              </span>
            </button>
          </div>

          <span className="text-xs text-slate-400 hidden sm:block">
            {aspectsTab === "major" ? "Classical 5 Ptolemaic Angles" : "9 Harmonic Subdivision Frequencies"}
          </span>
        </div>

        {/* TAB 1: MAJOR ASPECTS TABLE */}
        {aspectsTab === "major" && (
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                  <Orbit className="w-4 h-4 text-amber-400" />
                  Major Planetary Aspects & Orbs
                </h3>
                <p className="text-xs text-slate-400">
                  Geometric angles between planetary fields (sorted by tightest exactitude)
                </p>
              </div>
              <span className="text-xs text-slate-400 tabular-nums">
                {chartData.aspects.length} Active Aspects
              </span>
            </div>

            {selectedAspect && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-300">
                    {selectedAspect.planet1} {selectedAspect.aspectName} {selectedAspect.planet2} ({selectedAspect.symbol} {selectedAspect.angle}°)
                  </span>
                  <span className="text-slate-400">Orb: {selectedAspect.orb}° ({selectedAspect.isApplying ? "Applying" : "Separating"})</span>
                </div>
                <p className="text-slate-300">
                  {ASPECT_INTERPRETATIONS[selectedAspect.aspectName]}
                </p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Planets</th>
                    <th className="py-2.5 px-3">Aspect</th>
                    <th className="py-2.5 px-3">Orb</th>
                    <th className="py-2.5 px-3">Phase</th>
                    <th className="py-2.5 px-3">Nature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {chartData.aspects.slice(0, 12).map((asp, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedAspect(asp)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-2 px-3 font-sans font-medium text-slate-200">
                        {asp.planet1} · {asp.planet2}
                      </td>
                      <td className="py-2 px-3 flex items-center gap-1.5">
                        <span
                          className="font-bold"
                          style={{ color: aspectColors[asp.aspectName] || "#94a3b8" }}
                        >
                          {asp.symbol}
                        </span>
                        <span className="font-sans">{asp.aspectName}</span>
                      </td>
                      <td className="py-2 px-3 tabular-nums">{asp.orb}°</td>
                      <td className="py-2 px-3 font-sans">
                        {asp.isApplying ? (
                          <span className="text-amber-400/90">Applying</span>
                        ) : (
                          <span className="text-slate-400">Separating</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-sans">
                        {asp.nature === "Harmonious" ? (
                          <span className="text-emerald-400">Harmonious</span>
                        ) : asp.nature === "Challenging" ? (
                          <span className="text-rose-400">Challenging</span>
                        ) : (
                          <span className="text-slate-400">Dynamic</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: MINOR & HARMONIC ASPECTS PANEL */}
        {aspectsTab === "minor" && (
          <MinorAspectsPanel planets={chartData.planets} />
        )}
      </div>
        </>
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
