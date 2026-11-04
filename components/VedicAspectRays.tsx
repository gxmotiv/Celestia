"use client";

import React from "react";
import { GrahaAspect, RashiDrishtiInfo } from "@/lib/vedic/drishtiEngine";

interface VedicAspectRaysProps {
  chartStyle: "NorthIndian" | "SouthIndian";
  grahaAspects: GrahaAspect[];
  rashiDrishtis: RashiDrishtiInfo[];
  selectedHouse: number | null;
  selectedPlanet: string | null;
  showGrahaRays: boolean;
  showRashiRays: boolean;
  ascendantSignIndex: number;
}

// Center coordinates for North Indian Houses in 400x400 viewBox
const NORTH_INDIAN_HOUSE_CENTERS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 105 },
  2: { x: 105, y: 55 },
  3: { x: 50, y: 105 },
  4: { x: 105, y: 200 },
  5: { x: 50, y: 295 },
  6: { x: 105, y: 345 },
  7: { x: 200, y: 295 },
  8: { x: 295, y: 345 },
  9: { x: 350, y: 295 },
  10: { x: 295, y: 200 },
  11: { x: 350, y: 105 },
  12: { x: 295, y: 55 },
};

// Center coordinates for South Indian Signs (0 to 11) in 400x400 viewBox (4x4 grid of 100x100)
const SOUTH_INDIAN_SIGN_CENTERS: Record<number, { x: number; y: number }> = {
  11: { x: 50, y: 50 }, // Pisces (top left)
  0: { x: 150, y: 50 },  // Aries
  1: { x: 250, y: 50 },  // Taurus
  2: { x: 350, y: 50 },  // Gemini (top right)
  3: { x: 350, y: 150 }, // Cancer
  4: { x: 350, y: 250 }, // Leo
  5: { x: 350, y: 350 }, // Virgo (bottom right)
  6: { x: 250, y: 350 }, // Libra
  7: { x: 150, y: 350 }, // Scorpio
  8: { x: 50, y: 350 },  // Sagittarius (bottom left)
  9: { x: 50, y: 250 },  // Capricorn
  10: { x: 50, y: 150 }, // Aquarius
};

const PLANET_RAY_COLORS: Record<string, string> = {
  Jupiter: "#fbbf24", // Golden
  Sun: "#f59e0b",     // Amber
  Mars: "#f43f5e",    // Ruby / Rose
  Venus: "#e879f9",   // Fuchsia
  Mercury: "#34d399", // Emerald
  Moon: "#e2e8f0",    // Silver
  Saturn: "#818cf8",  // Indigo / Violet
  Rahu: "#06b6d4",    // Cyan
  Ketu: "#a855f7",    // Purple
};

export function VedicAspectRays({
  chartStyle,
  grahaAspects,
  rashiDrishtis,
  selectedHouse,
  selectedPlanet,
  showGrahaRays,
  showRashiRays,
  ascendantSignIndex,
}: VedicAspectRaysProps) {
  if (!showGrahaRays && !showRashiRays) return null;

  // Filter aspects based on selection
  const visibleGrahaAspects = grahaAspects.filter((aspect) => {
    if (!showGrahaRays) return false;
    if (selectedPlanet) {
      return aspect.aspectingPlanet === selectedPlanet || aspect.aspectedPlanet === selectedPlanet;
    }
    if (selectedHouse) {
      return aspect.aspectedHouse === selectedHouse;
    }
    // By default show full aspects (60 Virupas) to avoid visual noise
    return aspect.strengthVirupas >= 45;
  });

  return (
    <g className="pointer-events-none transition-opacity duration-300">
      <defs>
        <marker
          id="ray-arrow"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#f59e0b" opacity="0.8" />
        </marker>
        <marker
          id="rashi-arrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="3"
          markerHeight="3"
          orient="auto-start-reverse"
        >
          <circle cx="5" cy="5" r="3" fill="#38bdf8" opacity="0.7" />
        </marker>
      </defs>

      {/* 1. Jaimini Rashi Drishti Rays */}
      {showRashiRays &&
        rashiDrishtis.map((rd) => {
          // In South Indian style, draw directly between sign centers
          if (chartStyle === "SouthIndian") {
            const origin = SOUTH_INDIAN_SIGN_CENTERS[rd.signIndex];
            if (!origin) return null;

            return rd.aspectedSigns.map((target) => {
              const dest = SOUTH_INDIAN_SIGN_CENTERS[target.signIndex];
              if (!dest) return null;

              return (
                <line
                  key={`rashi-s-${rd.signIndex}-${target.signIndex}`}
                  x1={origin.x}
                  y1={origin.y}
                  x2={dest.x}
                  y2={dest.y}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.35"
                  markerEnd="url(#rashi-arrow)"
                />
              );
            });
          } else {
            // In North Indian style, calculate house indices for signs
            const originHouse = ((rd.signIndex - ascendantSignIndex + 12) % 12) + 1;
            const origin = NORTH_INDIAN_HOUSE_CENTERS[originHouse];
            if (!origin) return null;

            return rd.aspectedSigns.map((target) => {
              const targetHouse = ((target.signIndex - ascendantSignIndex + 12) % 12) + 1;
              const dest = NORTH_INDIAN_HOUSE_CENTERS[targetHouse];
              if (!dest) return null;

              return (
                <line
                  key={`rashi-n-${rd.signIndex}-${target.signIndex}`}
                  x1={origin.x}
                  y1={origin.y}
                  x2={dest.x}
                  y2={dest.y}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                  opacity="0.3"
                />
              );
            });
          }
        })}

      {/* 2. Parashari Graha Drishti Rays */}
      {showGrahaRays &&
        visibleGrahaAspects.map((aspect, idx) => {
          let origin: { x: number; y: number } | undefined;
          let dest: { x: number; y: number } | undefined;

          // Find origin house from aspecting planet
          // (We map aspecting planet house from aspect.aspectedHouse - offset or similar)
          if (chartStyle === "NorthIndian") {
            dest = NORTH_INDIAN_HOUSE_CENTERS[aspect.aspectedHouse];
            // Origin house calculation
            // In GrahaAspect: aspectType indicates offset
            let offset = 7;
            if (aspect.aspectType.includes("4th")) offset = 4;
            else if (aspect.aspectType.includes("8th")) offset = 8;
            else if (aspect.aspectType.includes("5th")) offset = 5;
            else if (aspect.aspectType.includes("9th")) offset = 9;
            else if (aspect.aspectType.includes("3rd")) offset = 3;
            else if (aspect.aspectType.includes("10th")) offset = 10;

            const originHouse = (((aspect.aspectedHouse - offset + 12) - 1) % 12) + 1;
            origin = NORTH_INDIAN_HOUSE_CENTERS[originHouse];
          } else {
            // South Indian: map sign coordinates
            dest = SOUTH_INDIAN_SIGN_CENTERS[aspect.aspectedSignIndex];
            let offset = 7;
            if (aspect.aspectType.includes("4th")) offset = 4;
            else if (aspect.aspectType.includes("8th")) offset = 8;
            else if (aspect.aspectType.includes("5th")) offset = 5;
            else if (aspect.aspectType.includes("9th")) offset = 9;
            else if (aspect.aspectType.includes("3rd")) offset = 3;
            else if (aspect.aspectType.includes("10th")) offset = 10;

            const originSignIdx = ((aspect.aspectedSignIndex - (offset - 1) + 12) % 12);
            origin = SOUTH_INDIAN_SIGN_CENTERS[originSignIdx];
          }

          if (!origin || !dest) return null;

          const rayColor = PLANET_RAY_COLORS[aspect.aspectingPlanet] || "#f59e0b";
          const isFull = aspect.strengthVirupas >= 55;

          return (
            <g key={`graha-ray-${idx}`}>
              <line
                x1={origin.x}
                y1={origin.y}
                x2={dest.x}
                y2={dest.y}
                stroke={rayColor}
                strokeWidth={isFull ? 1.75 : 1}
                strokeDasharray={isFull ? "none" : "4 2"}
                opacity={selectedPlanet ? 0.9 : 0.65}
                markerEnd="url(#ray-arrow)"
              />
              {/* Pulsing indicator at destination */}
              <circle cx={dest.x} cy={dest.y} r="3" fill={rayColor} opacity="0.6" />
            </g>
          );
        })}
    </g>
  );
}
