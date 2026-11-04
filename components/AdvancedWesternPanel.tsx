"use client";

import React, { useState, useMemo } from "react";
import {
  WesternChartData,
  PlanetPosition,
  formatDegreeMinute,
} from "@/lib/astronomy/ephemeris";
import {
  MidpointCalculator,
  MidpointItem,
  HarmonicChartCalculator,
  HarmonicChart,
  DeclinationCalculator,
  DeclinationReport,
} from "@/lib/astronomy/advancedWesternCalculators";
import {
  ProgressionsEngine,
  ProgressedChartResult,
  ProfectionsEngine,
  ProfectionResult,
  ZodiacalReleasingEngine,
  ZodiacalReleasingReport,
  FirdariaEngine,
  FirdariaReport,
} from "@/lib/astronomy/predictiveHellenisticEngine";
import {
  FixedStarsEngine,
  StarContact,
  EclipseAnalyzer,
  EclipseItem,
  MedicalAstrologyEngine,
  MedicalAstrologyReport,
  AstrocartographyEngine,
  AstrocartographyReport,
} from "@/lib/astronomy/specializedWesternEngines";
import {
  Compass,
  Sparkles,
  Layers,
  Activity,
  Waves,
  Scale,
  Flame,
  Search,
  ChevronRight,
  Info,
  Calendar,
  Star,
  Moon,
  Clock,
  ShieldAlert,
  MapPin,
  HeartPulse,
  ScrollText,
  Crown,
  Sun,
} from "lucide-react";

interface AdvancedWesternPanelProps {
  chartData: WesternChartData;
  fullName?: string;
  birthDateStr?: string;
  birthTimeStr?: string;
  latitude?: number;
  longitude?: number;
  timezoneOffset?: number;
}

export function AdvancedWesternPanel({
  chartData,
  fullName = "Native",
  birthDateStr = "1990-01-01",
  birthTimeStr = "12:00",
  latitude = 40.7128,
  longitude = -74.006,
  timezoneOffset = 0,
}: AdvancedWesternPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    | "asteroids"
    | "lilith"
    | "arabian"
    | "midpoints"
    | "harmonics"
    | "declinations"
    | "progressions"
    | "profections"
    | "releasing"
    | "firdaria"
    | "fixedStars"
    | "eclipses"
    | "medical"
    | "astrocartography"
  >("asteroids");

  // Midpoints calculation
  const midpointCalc = useMemo(() => new MidpointCalculator(), []);
  const allMidpoints = useMemo(() => {
    return midpointCalc.calculateAllMidpoints(chartData.planets);
  }, [midpointCalc, chartData.planets]);

  const [midpointSearch, setMidpointSearch] = useState("");
  const filteredMidpoints = useMemo(() => {
    if (!midpointSearch.trim()) return allMidpoints;
    const term = midpointSearch.toLowerCase();
    return allMidpoints.filter(
      (m) =>
        m.planet1.toLowerCase().includes(term) ||
        m.planet2.toLowerCase().includes(term) ||
        m.sign.toLowerCase().includes(term) ||
        m.activatedBy.some((a) => a.planet.toLowerCase().includes(term))
    );
  }, [allMidpoints, midpointSearch]);

  // Harmonics calculation
  const harmonicCalc = useMemo(() => new HarmonicChartCalculator(), []);
  const [selectedHarmonic, setSelectedHarmonic] = useState<number>(5); // default H5 (creative talent)
  const currentHarmonicChart: HarmonicChart = useMemo(() => {
    return harmonicCalc.calculateHarmonic(chartData.planets, selectedHarmonic);
  }, [harmonicCalc, chartData.planets, selectedHarmonic]);

  // Declinations calculation
  const declinationCalc = useMemo(() => new DeclinationCalculator(), []);
  const declinationReport: DeclinationReport = useMemo(() => {
    return declinationCalc.calculateAll(chartData.planets, chartData.obliquity);
  }, [declinationCalc, chartData.planets, chartData.obliquity]);

  // Birth Date Object
  const birthDateObj = useMemo(() => {
    const [y, m, d] = birthDateStr.split("-").map(Number);
    const [h, min] = birthTimeStr.split(":").map(Number);
    return new Date(Date.UTC(y || 1990, (m || 1) - 1, d || 1, h || 12, min || 0));
  }, [birthDateStr, birthTimeStr]);

  const nowObj = useMemo(() => new Date(), []);
  const currentAgeYears = useMemo(() => {
    const diff = nowObj.getTime() - birthDateObj.getTime();
    return Math.max(0, Math.floor(diff / (365.2422 * 86400000)));
  }, [nowObj, birthDateObj]);

  // Secondary Progressions
  const progEngine = useMemo(() => new ProgressionsEngine(), []);
  const progressionsReport: ProgressedChartResult = useMemo(() => {
    return progEngine.calculateProgressions(birthDateObj, nowObj, latitude, longitude, timezoneOffset);
  }, [progEngine, birthDateObj, nowObj, latitude, longitude, timezoneOffset]);

  // Hellenistic Profections
  const profEngine = useMemo(() => new ProfectionsEngine(), []);
  const profectionReport: ProfectionResult = useMemo(() => {
    return profEngine.calculateAnnualProfection(chartData, currentAgeYears);
  }, [profEngine, chartData, currentAgeYears]);

  // Zodiacal Releasing (from Spirit)
  const zrEngine = useMemo(() => new ZodiacalReleasingEngine(), []);
  const spiritReleasing: ZodiacalReleasingReport = useMemo(() => {
    const spiritLon = chartData.arabianParts?.partOfSpirit.longitude || 0;
    return zrEngine.calculateReleasing(birthDateObj, spiritLon, "Spirit (Career & Purpose)");
  }, [zrEngine, birthDateObj, chartData.arabianParts]);

  // Firdaria
  const firdariaEngine = useMemo(() => new FirdariaEngine(), []);
  const firdariaReport: FirdariaReport = useMemo(() => {
    return firdariaEngine.calculateFirdaria(chartData, currentAgeYears);
  }, [firdariaEngine, chartData, currentAgeYears]);

  // Fixed Stars
  const fixedStarsEngine = useMemo(() => new FixedStarsEngine(), []);
  const starContacts: StarContact[] = useMemo(() => {
    return fixedStarsEngine.calculateStarContacts(chartData);
  }, [fixedStarsEngine, chartData]);

  // Eclipses
  const eclipseEngine = useMemo(() => new EclipseAnalyzer(), []);
  const upcomingEclipses: EclipseItem[] = useMemo(() => {
    return eclipseEngine.analyzeEclipses(chartData);
  }, [eclipseEngine, chartData]);

  // Medical Astrology
  const medicalEngine = useMemo(() => new MedicalAstrologyEngine(), []);
  const medicalReport: MedicalAstrologyReport = useMemo(() => {
    return medicalEngine.analyzeHealth(chartData);
  }, [medicalEngine, chartData]);

  // Astrocartography
  const astrocartographyEngine = useMemo(() => new AstrocartographyEngine(), []);
  const astrocartographyReport: AstrocartographyReport = useMemo(() => {
    return astrocartographyEngine.calculatePowerLines(chartData);
  }, [astrocartographyEngine, chartData]);

  const asteroids = chartData.asteroids;
  const points = chartData.additionalPoints;
  const arabian = chartData.arabianParts;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Complete Western Astrology Architecture
          </h3>
          <p className="text-[11px] text-slate-400">
            Asteroids · Shadow Axis · Arabian Parts · Midpoints · Harmonics · Declinations · Progressions · Profections · Releasing · Firdaria · Fixed Stars · Eclipses · Medical · Astrocartography
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: "asteroids", label: "4 Asteroids", icon: "⚳" },
            { id: "lilith", label: "Lilith & Points", icon: "⚸" },
            { id: "arabian", label: "Arabian Parts", icon: "⊕" },
            { id: "midpoints", label: "90° Midpoints", icon: "⚡" },
            { id: "harmonics", label: "Harmonics", icon: "〰" },
            { id: "declinations", label: "Declinations", icon: "||" },
            { id: "progressions", label: "Progressions", icon: "☽" },
            { id: "profections", label: "Profections", icon: "⏳" },
            { id: "releasing", label: "Zodiacal Releasing", icon: "📜" },
            { id: "firdaria", label: "Firdaria", icon: "👑" },
            { id: "fixedStars", label: "Fixed Stars", icon: "★" },
            { id: "eclipses", label: "Eclipses", icon: "🌑" },
            { id: "medical", label: "Medical Astrology", icon: "⚕" },
            { id: "astrocartography", label: "Astrocartography", icon: "🌐" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === tab.id
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <span className="font-mono text-amber-400">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: 4 MAJOR ASTEROIDS */}
      {activeSubTab === "asteroids" && asteroids && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                data: asteroids.ceres,
                name: "Ceres",
                symbol: "⚳",
                role: "The Nurturing Mother & Harvest cycles",
                color: "text-amber-400 border-amber-500/30",
                desc: "Represents parental conditioning, relationship to food and material nourishment, loss, grief, and emotional self-sustenance.",
              },
              {
                data: asteroids.pallas,
                name: "Pallas Athena",
                symbol: "⚴",
                role: "Wisdom, Strategy & Pattern Recognition",
                color: "text-cyan-400 border-cyan-500/30",
                desc: "Governs warrior intelligence, creative problem solving, judicial fairness, strategic statecraft, and holistic pattern awareness.",
              },
              {
                data: asteroids.juno,
                name: "Juno",
                symbol: "⚵",
                role: "Sacred Marriage, Fidelity & Parity",
                color: "text-rose-400 border-rose-500/30",
                desc: "Illuminates marriage contracts, core needs in life-defining partnerships, vulnerability, and loyalty under trials.",
              },
              {
                data: asteroids.vesta,
                name: "Vesta",
                symbol: "⚶",
                role: "Sacred Focus, Devotion & Hearth Flame",
                color: "text-orange-400 border-orange-500/30",
                desc: "Symbolizes consecration to sacred work, spiritual focus, purity of intention, and preserving sacred personal boundaries.",
              },
            ].map((ast) => (
              <div
                key={ast.name}
                className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono text-amber-400">{ast.symbol}</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{ast.name}</h4>
                      <span className="text-[10px] text-slate-400">{ast.role}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-amber-300 block">
                      {ast.data.signDegreeFormatted}
                    </span>
                    <span className="text-[10px] text-slate-400">House {ast.data.house}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">{ast.desc}</p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Sign: <strong className="text-slate-200">{ast.data.sign}</strong></span>
                  <span>Daily Speed: <strong className="text-slate-200 font-mono">{ast.data.speed?.toFixed(3)}°/day</strong></span>
                  <span>Motion: <strong className={ast.data.isRetrograde ? "text-rose-400" : "text-emerald-400"}>{ast.data.isRetrograde ? "Retrograde" : "Direct"}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LUNAR POINTS & SHADOW AXIS */}
      {activeSubTab === "lilith" && points && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                data: points.meanLilith,
                name: "Mean Lilith (Lunar Apogee)",
                symbol: "⚸",
                desc: "The smoothed mean lunar apogee: marks instinctual rebellion, raw autonomy, and reclaiming power outside social conditioning.",
              },
              {
                data: points.trueLilith,
                name: "True Lilith (Osculating Apogee)",
                symbol: "⚸*",
                desc: "High-precision osculating apogee with solar perturbations: points directly to volatile flashpoints of raw instinct.",
              },
              {
                data: points.whiteMoon,
                name: "White Moon Selena",
                symbol: "☽*",
                desc: "7-year cycle of divine protection, selfless service, karmic grace, and instinctive moral integrity.",
              },
              {
                data: points.vertex,
                name: "Vertex (Axis of Destiny)",
                symbol: "Vx",
                desc: "Western Prime Vertical intersection: the electric gateway of fated encounters, sudden turning points, and synchronicity.",
              },
              {
                data: points.eastPoint,
                name: "East Point (Equatorial Ascendant)",
                symbol: "EP",
                desc: "Equatorial horizon intersection: the conscious mental self-projection and how you perceive reality.",
              },
              {
                data: points.proserpine,
                name: "Proserpine (Symbolic Regeneration)",
                symbol: "⚹P",
                desc: "Theoretical outer octave of Pluto: total cellular regeneration, psychological rebirth, and spiritual immortality.",
              },
            ].map((p) => (
              <div
                key={p.name}
                className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-purple-400">{p.symbol}</span>
                    <h4 className="text-xs font-bold text-slate-100">{p.name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-purple-300 block">
                      {p.data.signDegreeFormatted}
                    </span>
                    <span className="text-[10px] text-slate-400">House {p.data.house}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ARABIAN PARTS */}
      {activeSubTab === "arabian" && arabian && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs px-2 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400">
            <span>Chart Sect: <strong className="text-amber-300">{arabian.isDayChart ? "Diurnal (Day Chart - Sun Above Horizon)" : "Nocturnal (Night Chart - Sun Below Horizon)"}</strong></span>
            <span>Total Arabian Lots: <strong className="text-slate-200 font-mono">{arabian.allParts.length} calculated</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {arabian.allParts.map((part) => (
              <div
                key={part.id}
                className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-mono text-emerald-400 font-bold">{part.symbol}</span>
                    <h4 className="text-xs font-bold text-slate-100">{part.name}</h4>
                  </div>
                  <span className="text-xs font-mono text-emerald-300 font-semibold">
                    {part.signDegreeFormatted}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Formula: {part.formula} · House {part.house}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">{part.interpretation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: 90° MIDPOINT SYSTEM */}
      {activeSubTab === "midpoints" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-xs font-semibold text-slate-200">Cosmobiology & 90° Dial Midpoints (Ebertin)</h4>
              <p className="text-[11px] text-slate-400">
                Calculates direct midpoints and detects active catalytic triggers from 8th-harmonic hard aspects (0°, 45°, 90°, 135°, 180°).
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search planet (e.g. Sun, Moon)..."
                value={midpointSearch}
                onChange={(e) => setMidpointSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Planetary Axis</th>
                  <th className="py-2.5 px-3">Zodiac Position</th>
                  <th className="py-2.5 px-3">90° Dial</th>
                  <th className="py-2.5 px-3">Catalyzed By</th>
                  <th className="py-2.5 px-3">Psychological Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredMidpoints.slice(0, 15).map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-semibold text-amber-300">
                      {m.planet1} / {m.planet2}
                    </td>
                    <td className="py-2.5 px-3">{m.signDegreeFormatted}</td>
                    <td className="py-2.5 px-3 text-cyan-300">{m.dial90.toFixed(2)}°</td>
                    <td className="py-2.5 px-3 font-sans">
                      {m.activatedBy.length > 0 ? (
                        <span className="text-emerald-400 font-medium">
                          {m.activatedBy.map((a) => `${a.planet} (${a.aspectType} ${a.orb}°)`).join(", ")}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300 max-w-md truncate">
                      {m.interpretation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: HARMONIC CHARTS */}
      {activeSubTab === "harmonics" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-xs font-semibold text-slate-200">Wave Harmonics of Consciousness</h4>
              <p className="text-[11px] text-slate-400">
                Multiplying natal longitudes by harmonic frequency numbers unveils specialized soul frequencies.
              </p>
            </div>

            {/* Harmonic Selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {[4, 5, 7, 8, 9].map((h) => (
                <button
                  key={h}
                  onClick={() => setSelectedHarmonic(h)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    selectedHarmonic === h
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  H{h}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-bold text-amber-300">{currentHarmonicChart.name}</h5>
                <span className="text-xs text-slate-400">{currentHarmonicChart.theme}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                {currentHarmonicChart.conjunctions.length} Exact Harmonic Conjunctions
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{currentHarmonicChart.description}</p>

            {/* Harmonic Conjunctions */}
            {currentHarmonicChart.conjunctions.length > 0 && (
              <div className="pt-2 space-y-1.5 border-t border-slate-800">
                <span className="text-xs font-semibold text-emerald-400">Resonant Conjunctions:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentHarmonicChart.conjunctions.map((c, i) => (
                    <div key={i} className="p-2 bg-slate-900/60 border border-slate-800/80 rounded text-xs text-slate-300">
                      <strong className="text-amber-300">{c.planet1} ☌ {c.planet2}</strong> (Orb {c.orb}°): {c.interpretation}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Planet positions in this harmonic */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-2">H{selectedHarmonic} Harmonic Positions:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {currentHarmonicChart.planets.map((p) => (
                  <div key={p.name} className="p-2 bg-slate-900/80 border border-slate-800 rounded text-xs flex items-center justify-between">
                    <span className="font-medium text-slate-200 flex items-center gap-1">
                      <span className="text-amber-400 font-mono">{p.symbol}</span>
                      {p.name}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">{p.signDegreeFormatted}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: DECLINATIONS & PARALLELS */}
      {activeSubTab === "declinations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400">
            <span>
              Out of Bounds (OOB) Planets (&gt; 23°26&apos;):{" "}
              <strong className={declinationReport.outOfBoundsCount > 0 ? "text-rose-400" : "text-slate-200"}>
                {declinationReport.outOfBoundsCount} detected
              </strong>
            </span>
            <span>
              Parallels: <strong className="text-emerald-300 font-mono">{declinationReport.parallels.length}</strong> · Contraparallels: <strong className="text-cyan-300 font-mono">{declinationReport.contraparallels.length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Declination List */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <h5 className="text-xs font-bold text-slate-200">Planetary Declinations (North / South)</h5>
              <div className="divide-y divide-slate-800 text-xs">
                {declinationReport.declinations.map((d) => (
                  <div key={d.planet} className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <span className="text-amber-400 font-mono font-bold">{d.symbol}</span>
                      {d.planet}
                    </span>
                    <div className="flex items-center gap-2">
                      {d.isOutOfBounds && (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 px-1.5 py-0.2 rounded border border-rose-500/30">
                          OOB Out of Bounds
                        </span>
                      )}
                      <span className="font-mono text-slate-200 font-semibold">{d.formattedDec}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parallels & Contraparallels */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <h5 className="text-xs font-bold text-slate-200">Parallels (||) & Contraparallels (∦)</h5>
              <p className="text-[11px] text-slate-400">
                Parallels operate with the cohesive power of a Conjunction; Contraparallels function with the dynamic awareness of an Opposition.
              </p>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {declinationReport.parallels.map((p, i) => (
                  <div key={`par-${i}`} className="p-2.5 bg-slate-900/70 border border-slate-800/80 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-emerald-300">{p.planet1} || {p.planet2} (Parallel)</strong>
                      <span className="text-slate-400 font-mono">Orb {p.orb}°</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{p.interpretation}</p>
                  </div>
                ))}

                {declinationReport.contraparallels.map((cp, i) => (
                  <div key={`cpar-${i}`} className="p-2.5 bg-slate-900/70 border border-slate-800/80 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-cyan-300">{cp.planet1} ∦ {cp.planet2} (Contraparallel)</strong>
                      <span className="text-slate-400 font-mono">Orb {cp.orb}°</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{cp.interpretation}</p>
                  </div>
                ))}

                {declinationReport.parallels.length === 0 && declinationReport.contraparallels.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No tight declination parallels within standard 1.2° orb.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: SECONDARY PROGRESSIONS */}
      {activeSubTab === "progressions" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">Day-For-A-Year Symbolic Unfolding</span>
                <h4 className="text-sm font-bold text-slate-100">
                  Secondary Progressed Chart (Age {progressionsReport.age})
                </h4>
              </div>
              <span className="text-xs font-mono text-slate-300">
                Progressed Date: <strong>{progressionsReport.progressedDate}</strong>
              </span>
            </div>

            {/* Progressed Moon Phase Banner */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between gap-3 text-xs">
              <div>
                <strong className="text-amber-300 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-amber-400" />
                  {progressionsReport.progressedMoonPhase.phaseName} ({progressionsReport.progressedMoonPhase.illumination}% Illumination)
                </strong>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  {progressionsReport.progressedMoonPhase.interpretation}
                </p>
              </div>
              <span className="font-mono text-amber-300 text-xs whitespace-nowrap">
                {progressionsReport.progressedMoonPhase.angle}° Arc
              </span>
            </div>

            {/* Key Progressed Positions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Progressed Sun</span>
                <span className="text-xs font-bold text-amber-300 font-mono">
                  {progressionsReport.progressedSun.signDegreeFormatted}
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Progressed Moon</span>
                <span className="text-xs font-bold text-blue-300 font-mono">
                  {progressionsReport.progressedMoon.signDegreeFormatted}
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg sm:col-span-2">
                <span className="text-[10px] text-slate-400 block">Active 2.5-Year Emotional Chapter</span>
                <span className="text-xs text-slate-200">
                  Progressed Moon in {progressionsReport.progressedMoon.sign}
                </span>
              </div>
            </div>
          </div>

          {/* Progressed Moon Sign Changes Timeline */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Progressed Moon Ingress Timeline (2.5-Year Epochs)
            </h5>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {progressionsReport.moonSignChanges.map((c, i) => (
                <div key={i} className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-lg text-xs flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-200">
                      Year {c.year} (Age {c.age}): {c.fromSign} → <strong className="text-amber-300">{c.toSign}</strong>
                    </span>
                    <p className="text-[11px] text-slate-400">{c.interpretation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 8: HELLENISTIC ANNUAL PROFECTIONS */}
      {activeSubTab === "profections" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">Classical 12-Year Hellenistic Wheel</span>
                <h4 className="text-sm font-bold text-slate-100">
                  Age {profectionReport.age} · {profectionReport.profectionHouse}th House Profection Year
                </h4>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-300 text-xs font-semibold">
                <span>Lord of the Year:</span>
                <strong className="text-amber-300">{profectionReport.lordOfTheYear} ({profectionReport.lordSymbol})</strong>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {profectionReport.interpretation}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {profectionReport.focusAreas.map((area, i) => (
                <div key={i} className="p-2 bg-slate-900 border border-slate-800 rounded text-center text-xs text-slate-300 font-medium">
                  {area}
                </div>
              ))}
            </div>
          </div>

          {/* 12-Year Profection Wheel Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {Array.from({ length: 12 }, (_, idx) => {
              const hNum = idx + 1;
              const isCurrent = hNum === profectionReport.profectionHouse;
              return (
                <div
                  key={hNum}
                  className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                    isCurrent
                      ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-200 shadow-md shadow-cyan-500/10"
                      : "bg-slate-950/60 border-slate-800 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>House {hNum}</span>
                    {isCurrent && <span className="text-[10px] bg-cyan-400 text-slate-950 px-1.5 py-0.2 rounded font-bold">ACTIVE</span>}
                  </div>
                  <div className="text-[11px] truncate">
                    Ages {idx}, {idx + 12}, {idx + 24}, {idx + 36}, {idx + 48}, {idx + 60}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 9: ZODIACAL RELEASING */}
      {activeSubTab === "releasing" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <ScrollText className="w-3.5 h-3.5 text-amber-400" />
              Zodiacal Releasing from the Part of Spirit (Vocation & Destiny Chapters)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {spiritReleasing.interpretation}
            </p>
          </div>

          {/* L1 Major Chapters Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Zodiac Sign</th>
                  <th className="py-2.5 px-3">Ruler</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Date Range</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {spiritReleasing.allL1Periods.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 font-sans font-semibold text-slate-200">
                      {p.sign}
                    </td>
                    <td className="py-2 px-3 font-sans text-amber-400">{p.ruler}</td>
                    <td className="py-2 px-3">{p.durationYears} Years</td>
                    <td className="py-2 px-3">{p.startDate} — {p.endDate}</td>
                    <td className="py-2 px-3 font-sans">
                      {p.isPeak ? (
                        <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                          ★ Peak Chapter
                        </span>
                      ) : (
                        <span className="text-slate-500">Standard</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 10: MEDIEVAL FIRDARIA */}
      {activeSubTab === "firdaria" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Medieval Firdaria Chronocrators (Time Lords)
              </h4>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                {firdariaReport.isDiurnal ? "Diurnal Sect (Day Chart)" : "Nocturnal Sect (Night Chart)"}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {firdariaReport.interpretation}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {firdariaReport.allPeriods.map((per) => (
              <div key={per.planet} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 flex items-center gap-1.5">
                    <span className="text-amber-400 font-mono">{per.symbol}</span>
                    {per.planet} Major
                  </span>
                  <span className="text-xs font-mono text-amber-300">{per.years} yrs</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Ages {per.startAge} to {per.endAge}
                </div>
                <div className="pt-1 border-t border-slate-800/80 flex flex-wrap gap-1">
                  {per.subPeriods.map((sub, idx) => (
                    <span key={idx} className="text-[9px] px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800/60">
                      {sub.subLord}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 11: FIXED STARS */}
      {activeSubTab === "fixedStars" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400">
            <span>Tight Aspects to Fixed Stars (&lt; 1.25° orb): <strong className="text-amber-300 font-mono">{starContacts.length} active</strong></span>
            <span>Including 4 Royal Archangel Stars &amp; Medusa Algol</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {starContacts.map((c, i) => (
              <div key={i} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <h5 className="text-xs font-bold text-slate-100">{c.starName} ({c.constellation})</h5>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    {c.nature}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{c.interpretation}</p>
                <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                  Orb: {c.orb}° · Star Longitude: {c.starLongitude.toFixed(2)}°
                </div>
              </div>
            ))}
            {starContacts.length === 0 && (
              <div className="col-span-2 p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl">
                No major planets conjunct classical fixed stars within strict 1.25° orb.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 12: ECLIPSE ANALYZER */}
      {activeSubTab === "eclipses" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-rose-400" />
              Major Solar &amp; Lunar Eclipses Impacting Your Natal Houses
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Eclipses act as cosmic wildcards, catalyzing non-negotiable course-corrections in the specific houses they touch over a 6 to 12 month cycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingEclipses.map((e, idx) => (
              <div key={idx} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-100">{e.type} Eclipse</h5>
                    <span className="text-[10px] text-slate-400 font-mono">{e.date} · {e.degreeFormatted}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono">
                    House {e.affectedHouse}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">{e.theme}</p>
                <ul className="space-y-1 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  {e.recommendations.map((rec, rIdx) => (
                    <li key={rIdx} className="flex items-center gap-1.5">
                      <span className="text-rose-400">·</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 13: MEDICAL ASTROLOGY */}
      {activeSubTab === "medical" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
              Iatromathematical Constitution &amp; Somatic Rulerships
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {medicalReport.vitalityConstitution}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
              <div>{medicalReport.sixthHouseNote}</div>
              <div>{medicalReport.twelfthHouseNote}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {medicalReport.vulnerableSystems.map((v, i) => (
              <div key={i} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-100">{v.systemName}</h5>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    v.stressLevel === "Elevated"
                      ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                      : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                  }`}>
                    {v.stressLevel} Priority
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Sign Ruler: <strong className="text-slate-300">{v.signRuler}</strong> · Anatomy: {v.governedAnatomy}
                </div>
                <p className="text-xs text-slate-300 pt-1 border-t border-slate-800/80">
                  <strong>Preventive Care:</strong> {v.preventiveAdvice}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 14: ASTROCARTOGRAPHY */}
      {activeSubTab === "astrocartography" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Astrocartography Planetary Power Lines
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Where your planetary energies project onto terrestrial meridians, creating geographic hotspots for career, love, vitality, and sanctuary.
            </p>
          </div>

          {/* Top Recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {astrocartographyReport.topDestinations.map((t, i) => (
              <div key={i} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 block">{t.purpose}</span>
                <span className="text-xs font-semibold text-slate-200">{t.planetaryLine}</span>
                <p className="text-[11px] text-slate-400">{t.suggestedRegion}</p>
              </div>
            ))}
          </div>

          {/* Detailed Planetary Lines Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Planet &amp; Angle</th>
                  <th className="py-2.5 px-3">Terrestrial Longitude</th>
                  <th className="py-2.5 px-3">Thematic Influence</th>
                  <th className="py-2.5 px-3">Best Applied For</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {astrocartographyReport.powerLines.map((line, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 font-sans font-semibold text-slate-200 flex items-center gap-1.5">
                      <span className="text-amber-400">{line.symbol}</span>
                      {line.planet} {line.lineType}
                    </td>
                    <td className="py-2 px-3 text-cyan-300 font-bold">{line.longitudeStr}</td>
                    <td className="py-2 px-3 font-sans text-slate-300 max-w-sm truncate">{line.theme}</td>
                    <td className="py-2 px-3 font-sans text-amber-300/90">{line.bestFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
