"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Eye,
  CheckSquare,
  Square,
  SlidersHorizontal,
} from "lucide-react";

export interface PlanetSelectorProps {
  selectedBodies: string[];
  onToggleBody: (id: string) => void;
  onSelectAllGroup: (groupPlanets: string[]) => void;
  onDeselectAllGroup: (groupPlanets: string[]) => void;
}

export interface BodyGroup {
  id: string;
  group: string;
  tag: string;
  color: string;
  bodies: Array<{ id: string; name: string; symbol: string; desc: string }>;
}

export const CELESTIAL_GROUPS: BodyGroup[] = [
  {
    id: "classical",
    group: "Classical Planets & Luminaries",
    tag: "Core 10",
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    bodies: [
      { id: "Sun", name: "Sun", symbol: "☉", desc: "Core identity, solar purpose & vitality" },
      { id: "Moon", name: "Moon", symbol: "☽", desc: "Emotional sanctuary, instincts & soul memory" },
      { id: "Mercury", name: "Mercury", symbol: "☿", desc: "Mind, communication, logic & perceptions" },
      { id: "Venus", name: "Venus", symbol: "♀", desc: "Love, attraction, values & aesthetic harmony" },
      { id: "Mars", name: "Mars", symbol: "♂", desc: "Drive, physical energy, courage & passion" },
      { id: "Jupiter", name: "Jupiter", symbol: "♃", desc: "Expansion, faith, luck & philosophical vision" },
      { id: "Saturn", name: "Saturn", symbol: "♄", desc: "Discipline, karma, boundaries & mastery" },
      { id: "Uranus", name: "Uranus", symbol: "♅", desc: "Breakthroughs, awakening & radical freedom" },
      { id: "Neptune", name: "Neptune", symbol: "♆", desc: "Mysticism, dreams, spiritual dissolution & imagination" },
      { id: "Pluto", name: "Pluto", symbol: "♇", desc: "Underworld power, death-rebirth & alchemical metamorphosis" },
    ],
  },
  {
    id: "asteroids",
    group: "Major Asteroids",
    tag: "The 4 Goddesses",
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    bodies: [
      { id: "Ceres", name: "Ceres", symbol: "⚳", desc: "Nurturing, maternal grief, harvests & food security" },
      { id: "Pallas", name: "Pallas Athena", symbol: "⚴", desc: "Strategic wisdom, creative pattern recognition & justice" },
      { id: "Juno", name: "Juno", symbol: "⚵", desc: "Sacred marriage, commitment, fidelity & relational equality" },
      { id: "Vesta", name: "Vesta", symbol: "⚶", desc: "Sacred focus, devotion to holy flame & spiritual solitude" },
    ],
  },
  {
    id: "points",
    group: "Lunar Nodes & Shadow Points",
    tag: "Nodal & Lilith Axis",
    color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    bodies: [
      { id: "NorthNode", name: "North Node", symbol: "☊", desc: "Soul destiny, evolutionary growth vector" },
      { id: "SouthNode", name: "South Node", symbol: "☋", desc: "Past-life karma, innate talents & comfort trap" },
      { id: "Chiron", name: "Chiron (approx.)", symbol: "⚷", desc: "Approximate illustrative orbit model only; not a precision Chiron ephemeris. Astrological interpretation is symbolic." },
      { id: "MeanLilith", name: "Mean Lilith", symbol: "⚸", desc: "Primal independence, untamed feminine shadow" },
      { id: "TrueLilith", name: "True Lilith (Osc.)", symbol: "⚸*", desc: "Osculating lunar apogee, raw instinctive sovereignty" },
      { id: "WhiteMoon", name: "White Moon (symbolic)", symbol: "☽*", desc: "Hypothetical, tradition-dependent esoteric point; not a physical body or measured lunar orbit." },
    ],
  },
  {
    id: "angles",
    group: "Fated Angles & Theoretical Bodies",
    tag: "Destiny Cross",
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    bodies: [
      { id: "Vertex", name: "Vertex", symbol: "Vx", desc: "Fated encounters & irresistible life turning points" },
      { id: "AntiVertex", name: "Anti-Vertex", symbol: "AVx", desc: "Polar catalyst sparking external destiny" },
      { id: "EastPoint", name: "East Point", symbol: "EP", desc: "Equatorial Ascendant, mental projection of self" },
      { id: "Proserpine", name: "Proserpine", symbol: "⚹P", desc: "Total cellular regeneration & subconscious immortality" },
      { id: "Hypnos", name: "Hypnos", symbol: "⚹H", desc: "Lucid dream gates, liminal subconscious visions" },
    ],
  },
  {
    id: "arabian",
    group: "Arabian Parts (Lots)",
    tag: "Hellenistic Lots",
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    bodies: [
      { id: "Part_fortune", name: "Part of Fortune", symbol: "⊕", desc: "Material prosperity, bodily vessel & spontaneous luck" },
      { id: "Part_spirit", name: "Part of Spirit", symbol: "☉", desc: "Inner divine will, creative mind & soul purpose" },
      { id: "Part_love", name: "Part of Love (Eros)", symbol: "♡", desc: "Devotional affection & pure heart desires" },
      { id: "Part_marriage", name: "Part of Marriage", symbol: "⚭", desc: "Sacred union, contractual covenant & fidelity" },
      { id: "Part_career", name: "Part of Career", symbol: "⚖", desc: "Public reputation, mastery & vocation honors" },
    ],
  },
];

export function PlanetSelector({
  selectedBodies,
  onToggleBody,
  onSelectAllGroup,
  onDeselectAllGroup,
}: PlanetSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalCount = CELESTIAL_GROUPS.reduce((acc, g) => acc + g.bodies.length, 0);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-900/90 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200">
            Celestial Body & Points Selector
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-medium">
            {selectedBodies.length} / {totalCount} Active on Wheel
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {isExpanded ? "Click to collapse" : "Click to customize bodies & asteroids"}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Expanded multi-group grid */}
      {isExpanded && (
        <div className="p-4 space-y-5 bg-slate-950/40">
          <p className="text-xs text-slate-400">
            Toggle which planetary archetypes, asteroids, lunar points, and Arabian lots are highlighted on the chart wheel and aspect matrix.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CELESTIAL_GROUPS.map((group) => {
              const groupBodyIds = group.bodies.map((b) => b.id);
              const allSelected = groupBodyIds.every((id) => selectedBodies.includes(id));
              const someSelected = groupBodyIds.some((id) => selectedBodies.includes(id));

              return (
                <div
                  key={group.id}
                  className="p-3 bg-slate-900/70 border border-slate-800/90 rounded-lg space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${group.color}`}>
                          {group.tag}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">{group.group}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (allSelected) {
                              onDeselectAllGroup(groupBodyIds);
                            } else {
                              onSelectAllGroup(groupBodyIds);
                            }
                          }}
                          className="text-[10px] text-slate-400 hover:text-amber-300 transition-colors px-1"
                        >
                          {allSelected ? "Clear" : "All"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-2">
                      {group.bodies.map((body) => {
                        const isChecked = selectedBodies.includes(body.id);
                        return (
                          <label
                            key={body.id}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[11px] cursor-pointer transition-all border ${
                              isChecked
                                ? "bg-amber-500/15 border-amber-500/40 text-amber-200 font-medium"
                                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onToggleBody(body.id)}
                              className="sr-only"
                            />
                            <span className="text-amber-400 font-bold font-mono">{body.symbol}</span>
                            <span className="truncate">{body.name}</span>
                          </label>
                        );
                      })}
                    </div>
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
