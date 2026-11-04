"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  System5LevelHierarchy,
  DashaLevelItem,
  generateChildrenForNode,
} from "@/lib/vedic/fiveLevelDashaEngines";
import {
  Layers,
  Clock,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  CornerDownRight,
  Sun,
  ShieldCheck,
  Zap,
  FolderTree,
  ListFilter,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface FiveLevelDashaSystemViewProps {
  system: System5LevelHierarchy;
  systemTitle: string;
  tradition: string; // e.g. "Parashari Classical 120-Year"
  onSelectBranch?: (path: { level1?: string; level2?: string; level3?: string; level4?: string }) => void;
}

export function FiveLevelDashaSystemView({
  system,
  systemTitle,
  tradition,
  onSelectBranch,
}: FiveLevelDashaSystemViewProps) {
  // Exploration view mode: interactive drill-down vs full nested tree
  const [viewMode, setViewMode] = useState<"interactive" | "tree">("interactive");

  // Current active level tab in interactive mode (1 to 5)
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | 4 | 5>(5);

  // Selected item in interactive mode
  const [selectedItem, setSelectedItem] = useState<DashaLevelItem>(() => {
    return (
      system.activeHierarchy.level5 ||
      system.activeHierarchy.level1 ||
      system.levels[1][0]
    );
  });

  // Dynamic child cache for tree exploration: key = item.fullName, value = DashaLevelItem[]
  const [childCache, setChildCache] = useState<Record<string, DashaLevelItem[]>>({});
  // Set of expanded node fullNames in the accordion tree
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Pre-expand active path if available
    if (system.activeHierarchy.level1) initial.add(system.activeHierarchy.level1.fullName);
    if (system.activeHierarchy.level2) initial.add(system.activeHierarchy.level2.fullName);
    if (system.activeHierarchy.level3) initial.add(system.activeHierarchy.level3.fullName);
    if (system.activeHierarchy.level4) initial.add(system.activeHierarchy.level4.fullName);
    return initial;
  });

  // Current live active item at the selected level
  const activeItemAtSelectedLevel = useMemo(() => {
    return (
      system.levels[selectedLevel]?.find((item) => item.isCurrent) ||
      system.levels[selectedLevel]?.[0]
    );
  }, [system, selectedLevel]);

  // Jump to currently active period today across all 5 levels
  const handleJumpToActive = () => {
    const liveTarget =
      system.activeHierarchy[`level${selectedLevel}` as keyof typeof system.activeHierarchy] ||
      activeItemAtSelectedLevel;
    if (liveTarget) {
      setSelectedItem(liveTarget);
    }
  };

  // Helper to expand/collapse an accordion node
  const toggleNodeExpansion = useCallback(
    (node: DashaLevelItem) => {
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        if (next.has(node.fullName)) {
          next.delete(node.fullName);
        } else {
          next.add(node.fullName);
          // If children not in cache and not precomputed, generate them
          if (!childCache[node.fullName] && node.level < 5) {
            const children = generateChildrenForNode(system.systemName, node);
            setChildCache((c) => ({ ...c, [node.fullName]: children }));
          }
        }
        return next;
      });
    },
    [childCache, system.systemName]
  );

  // Expand active lineage all the way to Level 5
  const expandActiveBranch = useCallback(() => {
    const next = new Set(expandedNodes);
    if (system.activeHierarchy.level1) next.add(system.activeHierarchy.level1.fullName);
    if (system.activeHierarchy.level2) next.add(system.activeHierarchy.level2.fullName);
    if (system.activeHierarchy.level3) next.add(system.activeHierarchy.level3.fullName);
    if (system.activeHierarchy.level4) next.add(system.activeHierarchy.level4.fullName);
    setExpandedNodes(next);
  }, [expandedNodes, system.activeHierarchy]);

  const collapseAllNodes = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Fetch children for a node in the tree
  const getChildrenFor = useCallback(
    (node: DashaLevelItem): DashaLevelItem[] => {
      if (node.level >= 5) return [];
      // 1. Check dynamic cache
      if (childCache[node.fullName]) return childCache[node.fullName];

      // 2. Check if this node matches active hierarchy and next level exists in system.levels
      const nextLevel = (node.level + 1) as 2 | 3 | 4 | 5;
      const activeAtThisLevel = system.activeHierarchy[`level${node.level}` as keyof typeof system.activeHierarchy];
      if (activeAtThisLevel && activeAtThisLevel.name === node.name && system.levels[nextLevel]) {
        return system.levels[nextLevel];
      }

      // 3. Fallback to generating on demand
      const generated = generateChildrenForNode(system.systemName, node);
      return generated;
    },
    [childCache, system]
  );

  const levelLabels: Record<1 | 2 | 3 | 4 | 5, { title: string; timeSpan: string; desc: string }> = {
    1: { title: "Level 1: Mahadasha", timeSpan: "Major Cycle (Years)", desc: "Overarching life direction, planetary guardian & karmic themes" },
    2: { title: "Level 2: Antardasha", timeSpan: "Sub-Period (Months to Years)", desc: "Primary catalyst manifesting specific milestones & life chapters" },
    3: { title: "Level 3: Pratyantardasha", timeSpan: "Sub-Sub-Period (Weeks to Months)", desc: "Trigger events, seasonal shifts, and acute opportunities" },
    4: { title: "Level 4: Sookshma Dasha", timeSpan: "Fine Period (Days to Weeks)", desc: "Daily psychological focus, physical vitality, and short-term moves" },
    5: { title: "Level 5: Prana Dasha", timeSpan: "Hourly Live Pulse (1–3 Days)", desc: "Precise hourly planetary breath, immediate negotiations, high-stakes timing" },
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER & VIEW MODE CONTROLS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/30 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-300">
                {tradition}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {system.totalCycleYears}y Total Base Cycle
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
              <span>{systemTitle}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Levels 1–5 Active
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {system.description}
            </p>
          </div>

          {/* Mode Switcher & Jump to Live */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => setViewMode("interactive")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "interactive"
                    ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5 text-amber-400" />
                <span>Interactive Explorer</span>
              </button>

              <button
                onClick={() => setViewMode("tree")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "tree"
                    ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FolderTree className="w-3.5 h-3.5 text-teal-400" />
                <span>Nested Accordion Tree</span>
              </button>
            </div>

            <button
              onClick={handleJumpToActive}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>⚡ Jump to Live</span>
            </button>
          </div>
        </div>

        {/* 5 LEVEL SELECTOR TABS (In Interactive Mode) */}
        {viewMode === "interactive" && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80">
            {([1, 2, 3, 4, 5] as const).map((lvl) => {
              const isSelected = selectedLevel === lvl;
              const activePeriod = system.activeHierarchy[`level${lvl}` as keyof typeof system.activeHierarchy];

              return (
                <button
                  key={lvl}
                  onClick={() => {
                    setSelectedLevel(lvl);
                    const activeInLevel =
                      system.activeHierarchy[`level${lvl}` as keyof typeof system.activeHierarchy] ||
                      system.levels[lvl]?.[0];
                    if (activeInLevel) {
                      setSelectedItem(activeInLevel);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-200 ring-1 ring-amber-400/40 shadow-md"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Lv {lvl}
                    </span>
                    {activePeriod?.isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active live today" />
                    )}
                  </div>
                  <div className="text-xs font-bold truncate">
                    {levelLabels[lvl].title.replace(`Level ${lvl}: `, "")}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    Active: <strong className="text-slate-200">{activePeriod?.name || "Active"}</strong>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. LIVE BREADCRUMBS TRAIL */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 shrink-0">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          Active 5-Level Living Chain:
        </span>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {([1, 2, 3, 4, 5] as const).map((lvl, idx) => {
            const hItem = system.activeHierarchy[`level${lvl}` as keyof typeof system.activeHierarchy];
            const isSelectedLvl = selectedLevel === lvl && viewMode === "interactive";

            return (
              <React.Fragment key={lvl}>
                <button
                  onClick={() => {
                    setViewMode("interactive");
                    setSelectedLevel(lvl);
                    if (hItem) setSelectedItem(hItem);
                  }}
                  className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelectedLvl
                      ? "bg-amber-500/25 border-amber-500/60 text-amber-200 ring-1 ring-amber-400/40 shadow-sm"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span className="text-[10px] font-mono text-slate-400">L{lvl}:</span>
                  <span className="font-bold">{hItem?.name || `L${lvl}`}</span>
                  {lvl === 5 && (
                    <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] border border-emerald-500/40 animate-pulse">
                      Live
                    </span>
                  )}
                </button>
                {idx < 4 && <span className="text-slate-600 font-bold">→</span>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE A: INTERACTIVE 5-LEVEL EXPLORER */}
      {/* ======================================================== */}
      {viewMode === "interactive" && (
        <div className="space-y-5">
          {/* Selected Item Spotlight Card */}
          {selectedItem && (
            <div className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300">
                      Level {selectedItem.level}: {selectedItem.levelLabel}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                      <span>{selectedItem.fullName}</span>
                    </h4>
                    {selectedItem.isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                        Active Today
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {selectedItem.startDateFormatted} to {selectedItem.endDateFormatted} · Duration:{" "}
                    <strong className="text-amber-300">{selectedItem.durationFormatted}</strong> (
                    {selectedItem.durationDays} days)
                  </p>
                </div>

                {selectedItem.bestHours && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-right self-start sm:self-auto">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-semibold">
                      Peak Astrological Hours:
                    </span>
                    <span className="text-xs font-bold text-emerald-300 font-mono">
                      {selectedItem.bestHours}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedItem.brief}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    Planetary / Sign Ruler:
                  </span>
                  <span className="font-semibold text-slate-200">
                    {selectedItem.lord || selectedItem.name}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                    Cosmic Quality & Energy:
                  </span>
                  <span
                    className={`font-semibold capitalize ${
                      selectedItem.tone === "positive"
                        ? "text-emerald-400"
                        : selectedItem.tone === "challenging"
                        ? "text-rose-400"
                        : "text-amber-400"
                    }`}
                  >
                    {selectedItem.tone}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block">
                    Recommended Action Mode:
                  </span>
                  <span className="text-slate-300">
                    {selectedItem.tone === "positive"
                      ? "Initiate ambitious projects & negotiations"
                      : selectedItem.tone === "challenging"
                      ? "Patience, disciplined duty & spiritual remedies"
                      : "Balanced progress, steady documentation"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Grid of All Periods for Selected Level */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>
                    All {system.levels[selectedLevel]?.length || 0} Periods for {levelLabels[selectedLevel].title}
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  {levelLabels[selectedLevel].desc}
                </p>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                Span: {levelLabels[selectedLevel].timeSpan}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {system.levels[selectedLevel]?.map((item, idx) => {
                const isCurrent = item.isCurrent;
                const isSelected = selectedItem?.fullName === item.fullName;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedItem(item);
                      // If user clicks an item at level < 5, drill down to its children
                      if (selectedLevel < 5 && onSelectBranch) {
                        const pathKey = `level${selectedLevel}` as "level1" | "level2" | "level3" | "level4";
                        onSelectBranch({ [pathKey]: item.name });
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                      isCurrent
                        ? "bg-amber-500/15 border-amber-500/50 shadow-md ring-1 ring-amber-400/30"
                        : isSelected
                        ? "bg-slate-900 border-slate-600 shadow-sm"
                        : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.name.slice(0, 2)}
                        </span>
                        <span className="text-xs font-bold text-slate-200">{item.name}</span>
                      </div>

                      {isCurrent && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-400 text-emerald-950 font-mono">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.startDateFormatted} to {item.endDateFormatted}
                    </div>

                    <div className="text-[11px] text-slate-300 mt-2 flex items-center justify-between">
                      <span>Duration: {item.durationFormatted}</span>
                      <span className="text-amber-400 text-[10px] font-semibold">
                        {isSelected ? "Selected ✓" : "Inspect →"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE B: EXPANDABLE NESTED ACCORDION TREE */}
      {/* ======================================================== */}
      {viewMode === "tree" && (
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/90 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-teal-400" />
                <span>Simultaneous 5-Level Nested Hierarchy Tree</span>
              </h4>
              <p className="text-xs text-slate-400">
                Drill down simultaneously through Mahadasha → Antardasha → Pratyantardasha → Sookshma → Prana.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={expandActiveBranch}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Expand Active Path</span>
              </button>

              <button
                onClick={collapseAllNodes}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Minimize2 className="w-3 h-3" />
                <span>Collapse All</span>
              </button>
            </div>
          </div>

          {/* Root Level 1 Nodes Accordion List */}
          <div className="space-y-2">
            {system.levels[1].map((l1Node) => {
              const isL1Expanded = expandedNodes.has(l1Node.fullName);
              const l2Children = isL1Expanded ? getChildrenFor(l1Node) : [];

              return (
                <div
                  key={l1Node.fullName}
                  className="rounded-xl border border-slate-800/90 bg-slate-900/60 overflow-hidden"
                >
                  {/* L1 Mahadasha Header */}
                  <div
                    onClick={() => toggleNodeExpansion(l1Node)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      l1Node.isCurrent
                        ? "bg-amber-500/15 border-l-4 border-l-amber-400"
                        : "hover:bg-slate-900/90"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <button className="text-slate-400">
                        {isL1Expanded ? (
                          <ChevronDown className="w-4 h-4 text-amber-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </button>

                      <span className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {l1Node.name.slice(0, 2)}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100">
                            {l1Node.name} Mahadasha
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            Level 1
                          </span>
                          {l1Node.isCurrent && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                              Active Today
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {l1Node.startDateFormatted} to {l1Node.endDateFormatted} ({l1Node.durationFormatted})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                          l1Node.tone === "positive"
                            ? "text-emerald-400 bg-emerald-500/10"
                            : l1Node.tone === "challenging"
                            ? "text-rose-400 bg-rose-500/10"
                            : "text-amber-400 bg-amber-500/10"
                        }`}
                      >
                        {l1Node.tone}
                      </span>
                    </div>
                  </div>

                  {/* Level 2 Children (Antardashas) */}
                  {isL1Expanded && (
                    <div className="p-3 pl-6 sm:pl-8 space-y-2 bg-slate-950/60 border-t border-slate-800/80">
                      {l2Children.map((l2Node) => {
                        const isL2Expanded = expandedNodes.has(l2Node.fullName);
                        const l3Children = isL2Expanded ? getChildrenFor(l2Node) : [];

                        return (
                          <div
                            key={l2Node.fullName}
                            className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden"
                          >
                            {/* L2 Antardasha Header */}
                            <div
                              onClick={() => toggleNodeExpansion(l2Node)}
                              className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                                l2Node.isCurrent
                                  ? "bg-amber-500/15 border-l-2 border-l-amber-400"
                                  : "hover:bg-slate-900/70"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <button className="text-slate-400">
                                  {isL2Expanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                  )}
                                </button>
                                <span className="text-xs font-semibold text-slate-200">
                                  {l2Node.name}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                  L2 Antar
                                </span>
                                {l2Node.isCurrent && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    Active
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-slate-400 font-mono">
                                {l2Node.startDateFormatted} to {l2Node.endDateFormatted} ({l2Node.durationFormatted})
                              </div>
                            </div>

                            {/* Level 3 Children (Pratyantardashas) */}
                            {isL2Expanded && (
                              <div className="p-2.5 pl-6 sm:pl-8 space-y-1.5 bg-slate-950/80 border-t border-slate-800/60">
                                {l3Children.map((l3Node) => {
                                  const isL3Expanded = expandedNodes.has(l3Node.fullName);
                                  const l4Children = isL3Expanded ? getChildrenFor(l3Node) : [];

                                  return (
                                    <div
                                      key={l3Node.fullName}
                                      className="rounded border border-slate-800/80 bg-slate-900/30 overflow-hidden"
                                    >
                                      {/* L3 Pratyantar Header */}
                                      <div
                                        onClick={() => toggleNodeExpansion(l3Node)}
                                        className={`p-2 flex items-center justify-between cursor-pointer transition-colors ${
                                          l3Node.isCurrent
                                            ? "bg-amber-500/15 border-l-2 border-l-amber-400"
                                            : "hover:bg-slate-900/60"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <button className="text-slate-400">
                                            {isL3Expanded ? (
                                              <ChevronDown className="w-3 h-3 text-amber-400" />
                                            ) : (
                                              <ChevronRight className="w-3 h-3 text-slate-500" />
                                            )}
                                          </button>
                                          <span className="text-xs text-slate-300 font-medium">
                                            {l3Node.name}
                                          </span>
                                          <span className="text-[9px] text-slate-400 font-mono">
                                            L3
                                          </span>
                                          {l3Node.isCurrent && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                          )}
                                        </div>

                                        <div className="text-[9px] text-slate-400 font-mono">
                                          {l3Node.startDateFormatted} to {l3Node.endDateFormatted} ({l3Node.durationFormatted})
                                        </div>
                                      </div>

                                      {/* Level 4 Children (Sookshmas) */}
                                      {isL3Expanded && (
                                        <div className="p-2 pl-5 sm:pl-6 space-y-1 bg-slate-950 border-t border-slate-800/50">
                                          {l4Children.map((l4Node) => {
                                            const isL4Expanded = expandedNodes.has(l4Node.fullName);
                                            const l5Children = isL4Expanded ? getChildrenFor(l4Node) : [];

                                            return (
                                              <div
                                                key={l4Node.fullName}
                                                className="rounded border border-slate-800/60 bg-slate-900/20 overflow-hidden"
                                              >
                                                {/* L4 Sookshma Header */}
                                                <div
                                                  onClick={() => toggleNodeExpansion(l4Node)}
                                                  className={`p-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                                                    l4Node.isCurrent
                                                      ? "bg-amber-500/15 border-l-2 border-l-amber-400"
                                                      : "hover:bg-slate-900/40"
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-1.5">
                                                    <button className="text-slate-400">
                                                      {isL4Expanded ? (
                                                        <ChevronDown className="w-3 h-3 text-amber-400" />
                                                      ) : (
                                                        <ChevronRight className="w-3 h-3 text-slate-500" />
                                                      )}
                                                    </button>
                                                    <span className="text-[11px] text-slate-300">
                                                      {l4Node.name}
                                                    </span>
                                                    <span className="text-[9px] text-slate-500 font-mono">
                                                      L4
                                                    </span>
                                                    {l4Node.isCurrent && (
                                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    )}
                                                  </div>

                                                  <div className="text-[9px] text-slate-400 font-mono">
                                                    {l4Node.startDateFormatted} ({l4Node.durationFormatted})
                                                  </div>
                                                </div>

                                                {/* Level 5 Children (Prana Pulses) */}
                                                {isL4Expanded && (
                                                  <div className="p-2 pl-5 space-y-1 bg-slate-950 border-t border-slate-800/40">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 pt-1">
                                                      {l5Children.map((l5Node) => (
                                                        <div
                                                          key={l5Node.fullName}
                                                          className={`p-2 rounded border text-[10px] font-mono transition-colors ${
                                                            l5Node.isCurrent
                                                              ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-200 ring-1 ring-emerald-400/40"
                                                              : "bg-slate-900/60 border-slate-800 text-slate-300"
                                                          }`}
                                                        >
                                                          <div className="flex items-center justify-between font-bold mb-0.5">
                                                            <span>L5 Prana: {l5Node.name}</span>
                                                            {l5Node.isCurrent && (
                                                              <span className="px-1 py-0.2 rounded bg-emerald-400 text-emerald-950 text-[8px]">
                                                                Live Now
                                                              </span>
                                                            )}
                                                          </div>
                                                          <div className="text-slate-400">
                                                            {l5Node.startDateFormatted} to {l5Node.endDateFormatted}
                                                          </div>
                                                          <div className="text-amber-400/90 mt-0.5">
                                                            {l5Node.durationFormatted} ({l5Node.bestHours || "Muhurta"})
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
