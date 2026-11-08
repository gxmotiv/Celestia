"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { VedicChartData, VedicPlanet, DashaPeriod } from "@/lib/astronomy/vedic";
import {
  Sparkles,
  Calendar,
  Award,
  ShieldCheck,
  Flame,
  Compass,
  Layers,
  Heart,
  Star,
  Users,
  Eye,
  Info,
  ChevronRight,
  Grid3X3,
  Shield,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { ExtendedDashaTimelineDisplay } from "@/components/ExtendedDashaTimelineDisplay";
import { ExtendedDashaCalculator } from "@/lib/vedic/extendedDashaLevels";
import { MultiDashaDashboard } from "@/components/MultiDashaDashboard";
import { D9ChartEngine, D9Chart, NavamsaPosition, D9Yoga } from "@/lib/vedic/d9NavamsaEngine";
import { VedicKundliChart } from "@/components/VedicKundliChart";
import { AshtakavargaPanel } from "@/components/AshtakavargaPanel";
import { ShadbalaPanel } from "@/components/ShadbalaPanel";
import { AvasthaPanel } from "@/components/AvasthaPanel";
import { VedicBenchmarkPanel } from "@/components/VedicBenchmarkPanel";
import { ClassicalVedicPanel } from "@/components/ClassicalVedicPanel";
import { MasterAIAstrologerCockpit } from "@/components/MasterAIAstrologerCockpit";
import { DevotionalVargaPanel } from "@/components/DevotionalVargaPanel";
import { DrishtiMatrixPanel } from "@/components/DrishtiMatrixPanel";
import { MasterYogasPanel } from "@/components/MasterYogasPanel";
import { WesternChartData } from "@/lib/astronomy/ephemeris";
import { NumerologyProfile } from "@/lib/astronomy/numerology";
import { BaZiProfile } from "@/lib/astronomy/chinese";
import { DIVISIONAL_CHARTS_CONFIG } from "@/lib/vedic/divisionalCalc";

interface VedicChartProps {
  vedicData: VedicChartData;
  birthDate?: string;
  birthTime?: string;
  birthUtcInstant?: string;
  westernData?: WesternChartData;
  numerologyData?: NumerologyProfile;
  baziData?: BaZiProfile;
  fullName?: string;
  cityName?: string;
  country?: string;
}

export function VedicChart({
  vedicData,
  birthDate = "1990-01-01",
  birthTime = "12:00",
  birthUtcInstant,
  westernData,
  numerologyData,
  baziData,
  fullName = "Seeker",
  cityName = "City of Birth",
  country = "Earth",
}: VedicChartProps) {
  const [vedicMasterView, setVedicMasterView] = useState<
    | "charts"
    | "devotionalVargas"
    | "drishti"
    | "yogas"
    | "ashtakavarga"
    | "shadbala"
    | "avasthas"
    | "classical"
    | "dashas"
    | "verification"
  >("charts");
  const [chartStyle, setChartStyle] = useState<"NorthIndian" | "SouthIndian">("NorthIndian");
  const [activeDivision, setActiveDivision] = useState<string>("D1");
  const [chartDivision, setChartDivision] = useState<"D1_Rasi" | "D9_Navamsa" | "Shodashavarga">("D1_Rasi");
  const [d9SubTab, setD9SubTab] = useState<"wheel" | "marriage" | "spiritual" | "strengths">("wheel");
  const [expandedDasha, setExpandedDasha] = useState<string | null>(vedicData.currentMahadasha);
  const [dashaTab, setDashaTab] = useState<"multi" | "oracle">("multi");

  // Calculate complete D9 Navamsa Chart & Analysis
  const d9Engine = useMemo(() => new D9ChartEngine(), []);
  const d9Chart: D9Chart = useMemo(() => {
    return vedicData.d9Chart || d9Engine.calculateCompleteD9Chart(vedicData);
  }, [vedicData, d9Engine]);

  const isD9 = chartDivision === "D9_Navamsa";
  const d9Moon = d9Chart.planets["Moon"];

  // Ordered list of D9 planets
  const d9PlanetsList = useMemo(() => {
    const preferredOrder = [
      "Sun",
      "Moon",
      "Mars",
      "Mercury",
      "Jupiter",
      "Venus",
      "Saturn",
      "Rahu",
      "Ketu",
      "Uranus",
      "Neptune",
      "Pluto",
    ];
    const list: NavamsaPosition[] = [];
    preferredOrder.forEach((name) => {
      if (d9Chart.planets[name]) {
        list.push(d9Chart.planets[name]);
      }
    });
    // Add any remaining
    Object.values(d9Chart.planets).forEach((p) => {
      if (!list.some((item) => item.planetName === p.planetName)) {
        list.push(p);
      }
    });
    return list;
  }, [d9Chart]);

  // Extract all Antardashas for deep-dive navigation
  const allAntardashas = useMemo(() => {
    const list: {
      mahadasha: string;
      antardasha: string;
      startDate: Date;
      years: number;
    }[] = [];

    vedicData.vimshottariDashas.forEach((md) => {
      md.subPeriods?.forEach((ad) => {
        const start = new Date(ad.startDate);
        const mdYears = ExtendedDashaCalculator.DASHA_YEARS[md.planet] || 10;
        const adYears = ExtendedDashaCalculator.DASHA_YEARS[ad.planet] || 10;
        const yrs = Math.round(((mdYears * adYears) / 120) * 1000) / 1000;
        list.push({
          mahadasha: md.planet,
          antardasha: ad.planet,
          startDate: start,
          years: yrs,
        });
      });
    });

    return list;
  }, [vedicData]);

  // Determine active Antardasha
  const activeAntarInfo = useMemo(() => {
    const currentMD = vedicData.vimshottariDashas.find((d) => d.isCurrent) || vedicData.vimshottariDashas[0];
    const currentAD = currentMD.subPeriods?.find((s) => s.isCurrent) || currentMD.subPeriods?.[0];
    const mdPlanet = currentMD.planet;
    const adPlanet = currentAD?.planet || mdPlanet;
    const mdYears = ExtendedDashaCalculator.DASHA_YEARS[mdPlanet] || 10;
    const adYears = ExtendedDashaCalculator.DASHA_YEARS[adPlanet] || 10;
    const yrs = Math.round(((mdYears * adYears) / 120) * 1000) / 1000;
    const start = currentAD ? new Date(currentAD.startDate) : new Date();

    return {
      mahadasha: mdPlanet,
      antardasha: adPlanet,
      startDate: start,
      years: yrs,
    };
  }, [vedicData]);

  const [selectedExtendedAntar, setSelectedExtendedAntar] = useState(activeAntarInfo);

  // Dignity badge styling for D1 Rasi
  const getDignityBadge = (dignity: VedicPlanet["dignity"]) => {
    switch (dignity) {
      case "Exalted":
        return <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">Uchha (Exalted)</span>;
      case "Moolatrikona":
        return <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">Moolatrikona</span>;
      case "Own Sign":
        return <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded border border-cyan-500/30">Swakshetra (Own)</span>;
      case "Friendly":
        return <span className="text-[10px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">Mitra (Friendly)</span>;
      case "Debilitated":
        return <span className="text-[10px] font-bold text-rose-300 bg-rose-500/15 px-1.5 py-0.5 rounded border border-rose-500/30">Neecha (Debilitated)</span>;
      default:
        return <span className="text-[10px] text-slate-400">Sama (Neutral)</span>;
    }
  };

  // Dignity badge styling for D9 Navamsa
  const getD9DignityBadge = (p: NavamsaPosition) => {
    switch (p.dignity) {
      case "Exalted":
        return <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">Uchha (Exalted)</span>;
      case "Own Sign":
        return <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded border border-cyan-500/30">Swakshetra (Own)</span>;
      case "Friendly":
        return <span className="text-[10px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">Mitra (Friendly)</span>;
      case "Debilitated":
        return <span className="text-[10px] font-bold text-rose-300 bg-rose-500/15 px-1.5 py-0.5 rounded border border-rose-500/30">Neecha (Debilitated)</span>;
      default:
        return <span className="text-[10px] text-slate-400">Sama (Neutral)</span>;
    }
  };

  // Helper for North Indian Diamond Chart: gets planets situated in house 1-12
  const getHousePlanets = (houseNum: number): string[] => {
    if (!isD9) {
      const h = vedicData.houses.find((item) => item.house === houseNum);
      return h ? h.planetsInHouse : [];
    } else {
      const d9H = d9Chart.houses[houseNum];
      if (!d9H) return [];
      return d9H.planets.map((p) => `${p.symbol}${p.planetName.slice(0, 2)}`);
    }
  };

  // Helper for North Indian Diamond Chart: gets sign name of house 1-12
  const getHouseRasi = (houseNum: number): string => {
    if (!isD9) {
      const h = vedicData.houses.find((item) => item.house === houseNum);
      return h ? h.rasiName : "";
    } else {
      return d9Chart.houses[houseNum]?.signName || "";
    }
  };

  // Helper for South Indian Square Chart: gets planets situated in a fixed sign
  const getSignPlanets = (signName: string): string => {
    if (!isD9) {
      const h = vedicData.houses.find((item) => item.rasiName === signName);
      return h ? h.planetsInHouse.join(" ") : "";
    } else {
      const planetsInSign = Object.values(d9Chart.planets).filter((p) => p.sign === signName);
      return planetsInSign.map((p) => `${p.symbol}${p.planetName.slice(0, 2)}`).join(" ");
    }
  };

  // Helper for South Indian Square Chart: checks if sign is Lagna (Ascendant)
  const getSignIsLagna = (signName: string): boolean => {
    if (!isD9) {
      return vedicData.lagna.rasiName === signName;
    } else {
      return d9Chart.ascendant.sign === signName;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. HERO VISUAL KUNDLI CHART (Front and Center at Top) */}
      <VedicKundliChart
        vedicData={vedicData}
        initialDivision={activeDivision}
        initialStyle={chartStyle}
        onDivisionChange={(div) => {
          setActiveDivision(div);
          if (div === "D9") {
            setChartDivision("D9_Navamsa");
          } else if (div === "D1") {
            setChartDivision("D1_Rasi");
          } else {
            setChartDivision("Shodashavarga");
          }
        }}
      />

      {/* Vedic Systems Master Navigation Strip */}
      <div className="relative flex items-center gap-1.5 p-1 bg-slate-950/90 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar shadow-inner">
        {[
          { id: "charts", label: "Kundli Charts & Placements", icon: Compass, badge: "D1/D9" },
          { id: "devotionalVargas", label: "Devotional & 16 Vargas", icon: Flame, badge: "D20 Upasana" },
          { id: "drishti", label: "Drishti (Aspects) Matrix", icon: Eye, badge: "Graha & Rashi" },
          { id: "yogas", label: "Classical Yogas (60+)", icon: Award, badge: "Raja/Dhana" },
          { id: "ashtakavarga", label: "Ashtakavarga (अष्टकवर्ग)", icon: Grid3X3, badge: "337 Pts" },
          { id: "shadbala", label: "Shadbala (षड्बल)", icon: Shield, badge: "6 Balas" },
          { id: "avasthas", label: "Planetary Avasthas (अवस्था)", icon: Activity, badge: "4 States" },
          { id: "classical", label: "Jaimini, Tara & Vedha", icon: Star, badge: "Classical" },
          { id: "dashas", label: "Vimshottari & Multi-Dasha", icon: Calendar, badge: "Lifecycle" },
          { id: "verification", label: "Engine Verification (परीक्षण)", icon: CheckCircle2, badge: "Unit Tests" },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = vedicMasterView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setVedicMasterView(tab.id as any)}
              className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer z-10 ${
                active
                  ? "text-amber-200"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="activeVedicSubViewIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-amber-500/10 border border-amber-500/40 rounded-lg shadow-sm -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className={`w-3.5 h-3.5 ${active ? "text-amber-400" : "text-slate-500"}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${
                  active
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-slate-900 text-slate-500 border border-slate-800"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={vedicMasterView}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="w-full"
        >

      {/* DEVOTIONAL & DIVISIONAL VARGAS VIEW */}
      {vedicMasterView === "devotionalVargas" && (
        <DevotionalVargaPanel vedicData={vedicData} fullName={fullName} />
      )}

      {/* DRISHTI & ASPECTS MATRIX VIEW */}
      {vedicMasterView === "drishti" && (
        <DrishtiMatrixPanel vedicData={vedicData} fullName={fullName} />
      )}

      {/* 60+ CLASSICAL YOGAS VIEW */}
      {vedicMasterView === "yogas" && (
        <MasterYogasPanel vedicData={vedicData} fullName={fullName} />
      )}

      {/* 2. ENGINE BENCHMARK & VERIFICATION VIEW */}
      {vedicMasterView === "verification" && (
        <VedicBenchmarkPanel
          vedicData={vedicData}
          birthDate={birthDate}
          birthTime={birthTime}
        />
      )}

      {/* CLASSICAL JAIMINI, TARA BALA & GOCHAR VEDHA VIEW */}
      {vedicMasterView === "classical" && (
        <ClassicalVedicPanel vedicData={vedicData} />
      )}

      {/* 3. ASHTAKAVARGA VIEW */}
      {vedicMasterView === "ashtakavarga" && (
        <AshtakavargaPanel vedicData={vedicData} />
      )}

      {/* 4. SHADBALA VIEW */}
      {vedicMasterView === "shadbala" && (
        <ShadbalaPanel
          vedicData={vedicData}
          birthDate={birthDate}
          birthTime={birthTime}
        />
      )}

      {/* 5. AVASTHAS VIEW */}
      {vedicMasterView === "avasthas" && (
        <AvasthaPanel vedicData={vedicData} />
      )}

      {/* 5. CHARTS & PLACEMENTS VIEW (D1 Rasi / D9 Navamsa / Vargas) */}
      {vedicMasterView === "charts" && (
        <div className="space-y-4">
          {/* Active Chart Selection Bar */}
          <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200">
                Active Chart Harmonic:
              </span>
              <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                {activeDivision} · {DIVISIONAL_CHARTS_CONFIG[activeDivision]?.name || activeDivision}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { code: "D1", label: "D1 Rasi" },
                { code: "D9", label: "D9 Navamsa" },
                { code: "D10", label: "D10 Dasamsa" },
                { code: "D20", label: "D20 Vimsamsa" },
                { code: "D7", label: "D7 Saptamsa" },
                { code: "D2", label: "D2 Hora" },
                { code: "D60", label: "D60 Shashtiamsa" },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setActiveDivision(item.code);
                    if (item.code === "D9") setChartDivision("D9_Navamsa");
                    else if (item.code === "D1") setChartDivision("D1_Rasi");
                    else setChartDivision("Shodashavarga");
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    activeDivision === item.code
                      ? "bg-amber-500/25 text-amber-200 border border-amber-500/40 font-bold shadow-sm"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <select
                aria-label="Select Divisional Chart"
                value={activeDivision}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveDivision(val);
                  if (val === "D9") setChartDivision("D9_Navamsa");
                  else if (val === "D1") setChartDivision("D1_Rasi");
                  else setChartDivision("Shodashavarga");
                }}
                className="bg-slate-900 border border-slate-700 hover:border-amber-500/50 rounded-lg px-2 py-1 text-xs text-amber-200 font-medium focus:outline-none cursor-pointer"
              >
                {Object.entries(DIVISIONAL_CHARTS_CONFIG).map(([code, cfg]) => (
                  <option key={code} value={code} className="bg-slate-900 text-slate-200">
                    {code} · {cfg.name} ({cfg.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Top Banner: Lahiri Ayanamsa & Core Vedic Pillars (Dynamically changes with D1 vs D9) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {!isD9 ? (
          /* D1 Rasi Banner Cards */
          <>
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Lagna (Ascendant - D1)</span>
              <span className="text-sm font-semibold text-slate-100 block">{vedicData.lagna.rasiName}</span>
              <span className="text-[11px] text-amber-400/90">
                {vedicData.lagna.nakshatraName} (Pada {vedicData.lagna.pada})
              </span>
            </div>

            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Janma Rasi (Moon Sign - D1)</span>
              <span className="text-sm font-semibold text-slate-100 block">{vedicData.moonSignRasi}</span>
              <span className="text-[11px] text-blue-300">{vedicData.moonSignSanskrit}</span>
            </div>

            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Janma Nakshatra (D1)</span>
              <span className="text-sm font-semibold text-slate-100 block">{vedicData.birthNakshatra}</span>
              <span className="text-[11px] text-emerald-400">
                Pada {vedicData.birthPada} · {vedicData.birthNakshatraLord} Lord
              </span>
            </div>

            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Current Dasha & Ayanamsa</span>
              <span className="text-sm font-semibold text-amber-400 block">
                {vedicData.currentMahadasha} / {vedicData.currentAntardasha}
              </span>
              <span className="text-[11px] text-slate-400">Lahiri: {vedicData.ayanamsaFormatted}</span>
            </div>
          </>
        ) : (
          /* D9 Navamsa Banner Cards */
          <>
            <div className="p-3.5 bg-purple-950/40 border border-purple-500/30 rounded-lg">
              <span className="text-[11px] font-medium text-purple-300 block mb-0.5">Navamsa Lagna (D9 Ascendant)</span>
              <span className="text-sm font-bold text-slate-100 block">{d9Chart.ascendant.sign}</span>
              <span className="text-[11px] text-amber-300">
                Lord: {d9Chart.ascendant.ruler} ({d9Chart.ascendant.degreeFormatted})
              </span>
            </div>

            <div className="p-3.5 bg-purple-950/40 border border-purple-500/30 rounded-lg">
              <span className="text-[11px] font-medium text-purple-300 block mb-0.5">Navamsa Moon (D9 Mind)</span>
              <span className="text-sm font-bold text-slate-100 block">{d9Moon?.sign || "Moon"}</span>
              <span className="text-[11px] text-blue-300">
                House {d9Moon?.house} in D9 ({d9Moon?.degreeFormatted || ""})
              </span>
            </div>

            <div className="p-3.5 bg-purple-950/40 border border-purple-500/30 rounded-lg">
              <span className="text-[11px] font-medium text-purple-300 block mb-0.5">Vargottama & Pushkara</span>
              <span className="text-sm font-bold text-amber-300 block">
                {d9Chart.analysis.vargottamaPlanets.length} Vargottama · {d9Chart.analysis.pushkaraPlanets.length} Pushkara
              </span>
              <span className="text-[11px] text-emerald-400">
                D9 Soul Score: {d9Chart.analysis.overallStrengthScore}/100
              </span>
            </div>

            <div className="p-3.5 bg-purple-950/40 border border-purple-500/30 rounded-lg">
              <span className="text-[11px] font-medium text-purple-300 block mb-0.5">Karakamsha & Atmakaraka</span>
              <span className="text-sm font-bold text-purple-200 block truncate">
                {d9Chart.spiritualPath.karakamshaLagna.atmakarakaPlanet} in {d9Chart.spiritualPath.karakamshaLagna.sign}
              </span>
              <span className="text-[11px] text-rose-300">
                Ishta: {d9Chart.spiritualPath.ishtaDevata.deityName}
              </span>
            </div>
          </>
        )}
      </div>


      {/* D9 Sub-View Navigation Tabs */}
          {/* D9 Sub-View Navigation Tabs (Only shown when D9 is active) */}
          {isD9 && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-x-auto no-scrollbar text-xs">
              {[
                { id: "wheel", label: "D9 Wheel & Placements", icon: Compass },
                { id: "marriage", label: "Marriage & 7th House Analysis", icon: Heart },
                { id: "spiritual", label: "Spiritual Path & Karakamsha (Ishta)", icon: Award },
                { id: "strengths", label: "Vargottama & Planetary Strengths", icon: Star },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = d9SubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setD9SubTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? "bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? "text-purple-300" : "text-slate-500"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

      {(!isD9 || d9SubTab === "wheel") && (
        <div className="space-y-6">
          {/* Planetary Placements Table - Fully synchronized with D1 vs D9 */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className={`w-4 h-4 ${!isD9 ? "text-amber-400" : "text-purple-400"}`} />
                    {!isD9
                      ? "Nirayana (Sidereal) Rasi Placements"
                      : "Navamsa (D9) Planetary Placements"}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    {!isD9 ? "D1 Chart" : "D9 Soul Fruits"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px]">
                      {!isD9 ? (
                        /* D1 Table Headers */
                        <tr>
                          <th className="py-2 px-2.5">Graha</th>
                          <th className="py-2 px-2.5">Rasi (Sign)</th>
                          <th className="py-2 px-2.5">Nakshatra</th>
                          <th className="py-2 px-2.5">Dignity</th>
                        </tr>
                      ) : (
                        /* D9 Table Headers */
                        <tr>
                          <th className="py-2 px-2.5">Graha</th>
                          <th className="py-2 px-2.5">D9 Sign</th>
                          <th className="py-2 px-2.5">D9 House</th>
                          <th className="py-2 px-2.5">Status & Dignity</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {!isD9
                        ? /* D1 Planetary Rows */
                          vedicData.planets.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-2 px-2.5 font-medium text-slate-100">
                                {p.name}{" "}
                                {p.isRetrograde && (
                                  <span className="text-[10px] text-rose-400 font-mono">(R)</span>
                                )}
                              </td>
                              <td className="py-2 px-2.5">
                                <span className="block font-medium">{p.rasiName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {p.rasiDegreeFormatted}
                                </span>
                              </td>
                              <td className="py-2 px-2.5">
                                <span className="block">{p.nakshatraName}</span>
                                <span className="text-[10px] text-slate-400">
                                  Pada {p.pada} ({p.nakshatraLord})
                                </span>
                              </td>
                              <td className="py-2 px-2.5">{getDignityBadge(p.dignity)}</td>
                            </tr>
                          ))
                        : /* D9 Navamsa Planetary Rows */
                          d9PlanetsList.map((p) => (
                            <tr key={p.planetName} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-2 px-2.5 font-medium text-slate-100 flex items-center gap-1.5">
                                <span className="text-amber-400 font-bold">{p.symbol}</span>
                                <span>{p.planetName}</span>
                              </td>
                              <td className="py-2 px-2.5">
                                <span className="block font-medium text-slate-200">{p.sign}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {p.degreeFormatted}
                                </span>
                              </td>
                              <td className="py-2 px-2.5">
                                <span className="block font-medium text-amber-300/90">
                                  House {p.house}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  from {p.originalSign}
                                </span>
                              </td>
                              <td className="py-2 px-2.5">
                                <div className="flex flex-col gap-1 items-start">
                                  {p.vargottama && (
                                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40 flex items-center gap-1">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Vargottama
                                    </span>
                                  )}
                                  {p.isPushkara && (
                                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1">
                                      <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> Pushkara
                                    </span>
                                  )}
                                  {getD9DignityBadge(p)}
                                </div>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          {/* Auspicious Vedic Yogas Section (Fully Synchronized with D1 vs D9) */}
          {!isD9 ? (
            /* D1 RASI YOGAS */
            vedicData.yogas.length > 0 && (
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-slate-100">
                      Auspicious Vedic Yogas Active in Rasi Chart (D1) ({vedicData.yogas.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Physical Life Formations</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {vedicData.yogas.map((yoga, i) => (
                    <div key={i} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300">{yoga.name}</span>
                        <span className="text-[10px] text-amber-400 font-mono">{yoga.sanskritName}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{yoga.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            /* D9 NAVAMSA YOGAS */
            <div className="p-5 bg-slate-900/60 border border-purple-500/30 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-slate-100">
                    Navamsa (D9) Sacred Yogas & Auspicious Formations ({d9Chart.yogas?.length || 0})
                  </h3>
                </div>
                <span className="text-[11px] text-purple-300/80">
                  Vargottama Mahayoga, Pushkara Grace, Raja Yogas & Soul Purpose
                </span>
              </div>

              {(!d9Chart.yogas || d9Chart.yogas.length === 0) ? (
                <p className="text-xs text-slate-400 py-2">
                  Planetary strengths in D9 are primarily expressed through divisional dignities and house alignments.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {d9Chart.yogas.map((yoga, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-slate-950/80 border border-purple-500/20 hover:border-purple-500/40 rounded-lg space-y-1.5 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-purple-200">{yoga.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">
                            {yoga.category}
                          </span>
                          <span className="text-[10px] text-amber-300 font-mono hidden sm:inline">
                            {yoga.sanskritName}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{yoga.description}</p>
                      {yoga.planetsInvolved.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                          <span className="text-slate-500">Planets:</span>
                          <span className="text-purple-300 font-medium">{yoga.planetsInvolved.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: D9 MARRIAGE & 7TH HOUSE ANALYSIS */}
      {isD9 && d9SubTab === "marriage" && (
        <div className="space-y-6">
          <div className="p-5 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                D9 Marriage, Partnerships & Relationship Karma
              </span>
              <span className="px-3 py-1 bg-rose-500/20 text-rose-200 border border-rose-500/30 rounded-full font-mono text-xs font-bold">
                Compatibility Index: {d9Chart.marriageIndicators.relationshipCompatibilityScore}%
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In classical Vedic Jyotish, the Rasi chart (D1) represents the tree, but the Navamsa (D9) reveals the actual fruit. The 7th house and Venus in D9 describe the emotional reality, temperament, and mutual destiny of your committed partnerships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Venus Condition Card */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Venus (Shukra) Condition in Navamsa
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {d9Chart.marriageIndicators.venusStrength}
              </p>
            </div>

            {/* Jupiter Blessing Card */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Jupiter (Guru) Grace & Moral Counsel
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {d9Chart.marriageIndicators.jupiterBlessing}
              </p>
            </div>

            {/* Partner Characteristics */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Spouse & Life Partner Archetype
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {d9Chart.marriageIndicators.partnerCharacteristics}
              </p>
            </div>

            {/* 7th House Dynamics */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                7th House Condition & Karmic Checkpoints
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {d9Chart.marriageIndicators.seventhHouseCondition}
              </p>
            </div>
          </div>

          {/* Timing & Karmic Lessons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Marriage Timing Insights
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {d9Chart.marriageIndicators.marriageTiming}
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Karmic Lessons & Growth Directives
              </h4>
              <ul className="space-y-1 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                {d9Chart.marriageIndicators.karmicLessons.map((lesson, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{lesson}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: D9 SPIRITUAL PATH & KARAKAMSHA */}
      {isD9 && d9SubTab === "spiritual" && (
        <div className="space-y-6">
          <div className="p-5 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                D9 Spiritual Path, Karakamsha Lagna & Ishta Devata
              </span>
              <span className="text-xs font-mono text-amber-300">
                Soul Atmakaraka: {d9Chart.spiritualPath.karakamshaLagna.atmakarakaPlanet}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Karakamsha Lagna is the Navamsa sign occupied by the planet with the highest longitude in your birth chart (Atmakaraka - the Soul King). The 12th house from Karakamsha reveals your Ishta Devata (Chosen Divine Form) and the sacred path toward spiritual liberation (Moksha).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Karakamsha Card */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                Karakamsha Lagna in {d9Chart.spiritualPath.karakamshaLagna.sign}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {d9Chart.spiritualPath.karakamshaLagna.meaning}
              </p>
            </div>

            {/* Ishta Devata Card */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Ishta Devata: {d9Chart.spiritualPath.ishtaDevata.deityName}
              </h4>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                <p className="text-slate-300">{d9Chart.spiritualPath.ishtaDevata.guidance}</p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-amber-400 font-mono font-bold">
                    Mantra: {d9Chart.spiritualPath.ishtaDevata.mantra}
                  </span>
                  <span className="text-[10px] text-slate-500">108 Repetitions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Spiritual Remedies */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Prescribed Vedic Spiritual Remedies (Upayas)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {d9Chart.spiritualPath.spiritualRemedies.map((remedy, i) => (
                <div key={i} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-300">
                  <span className="text-emerald-400 font-bold block mb-1">Step {i + 1}</span>
                  <p>{remedy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: D9 VARGOTTAMA & PLANETARY STRENGTH AUDIT */}
      {isD9 && d9SubTab === "strengths" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vargottama Planets Banner */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  Vargottama Planets (Superior Unshakeable Power)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
                  {d9Chart.analysis.vargottamaPlanets.length}
                </span>
              </div>

              {d9Chart.analysis.vargottamaPlanets.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No planets occupy identical signs in both D1 and D9. Planetary strength is expressed through dignities and divisional padas.
                </p>
              ) : (
                <div className="space-y-2">
                  {d9Chart.analysis.vargottamaPlanets.map((p) => (
                    <div
                      key={p.planetName}
                      className="p-2.5 bg-slate-950/70 rounded-lg border border-amber-500/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold text-sm">{p.symbol}</span>
                        <span className="text-xs font-semibold text-slate-200">{p.planetName}</span>
                        <span className="text-[11px] text-amber-300/80">in {p.sign} (House {p.house})</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {p.strength.score}/100 Power
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pushkara Navamsas Banner */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Pushkara Navamsas (Sacred Rejuvenation)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                  {d9Chart.analysis.pushkaraPlanets.length}
                </span>
              </div>

              {d9Chart.analysis.pushkaraPlanets.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No planets occupy sacred Pushkara degree divisions in this chart.
                </p>
              ) : (
                <div className="space-y-2">
                  {d9Chart.analysis.pushkaraPlanets.map((p) => (
                    <div
                      key={p.planetName}
                      className="p-2.5 bg-slate-950/70 rounded-lg border border-emerald-500/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold text-sm">{p.symbol}</span>
                        <span className="text-xs font-semibold text-slate-200">{p.planetName}</span>
                        <span className="text-[11px] text-emerald-300/80">in {p.sign} (House {p.house})</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-300">
                        {p.strength.score}/100 Power
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Complete 12 Navamsa House Placements Matrix */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                12 Navamsa House Placements (Whole Sign Framework)
              </h4>
              <span className="text-[11px] text-slate-400">
                1st House = {d9Chart.ascendant.sign} ({d9Chart.ascendant.signSanskrit})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
              {Object.values(d9Chart.houses).map((h) => (
                <div
                  key={h.house}
                  className={`p-3 rounded-lg border flex flex-col justify-between space-y-1.5 transition-all ${
                    h.condition === "Fortified"
                      ? "bg-amber-500/10 border-amber-500/40"
                      : h.condition === "Harmonious"
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : h.condition === "Challenged"
                      ? "bg-rose-500/10 border-rose-500/30"
                      : "bg-slate-950/70 border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">House {h.house}</span>
                    <span className="text-[10px] font-mono text-slate-400">{h.signName}</span>
                  </div>

                  <div className="min-h-[22px] flex items-center gap-1 font-bold text-sm text-purple-300">
                    {h.planets.length > 0 ? (
                      h.planets.map((p) => (
                        <span key={p.planetName} title={p.planetName}>
                          {p.symbol}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-600 font-normal">Empty</span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 truncate">
                    Lord: {h.lord}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
      )}

      {/* Vimshottari Dasha Explorer & Multi-Dasha Timeline */}
      {(vedicMasterView === "charts" || vedicMasterView === "dashas") && (
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              Vimshottari Dasha Lifecycle & Predictive Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Classical Parashari 4-tier planetary influence: Mahadasha, Antardasha, Pratyantardasha & Sookshma
            </p>
          </div>

          {/* Sub-Tabs: Unified 10-Dasha Multi-Matrix vs Master AI Astrologer Oracle */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto no-scrollbar shadow-inner">
            <button
              type="button"
              onClick={() => setDashaTab("multi")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                dashaTab === "multi"
                  ? "bg-gradient-to-r from-amber-500/25 to-amber-600/25 text-amber-200 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>10-Dasha Multi-Matrix & Prana</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>

            <button
              type="button"
              onClick={() => setDashaTab("oracle")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                dashaTab === "oracle"
                  ? "bg-gradient-to-r from-amber-500/30 via-amber-500/20 to-amber-600/30 text-amber-200 border border-amber-500/50 shadow-md shadow-amber-500/10"
                  : "text-slate-300 hover:text-amber-200 hover:bg-slate-900/60 border border-transparent"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-serif-celestial font-bold">✨ Master AI Astrologer Oracle</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                10x AI
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: 10-SYSTEM MULTI-MATRIX (VIMSHOTTARI PRANA, YOGINI, CHARA, KALACHAKRA, ASHTOTTARI, SHODASHOTTARI, ETC.) */}
        {dashaTab === "multi" && (
          <MultiDashaDashboard
            vedicData={vedicData}
            birthDate={birthDate}
            birthTime={birthTime}
            birthUtcInstant={birthUtcInstant}
          />
        )}

        {/* TAB 2: MASTER AI ASTROLOGER & ORACLE COCKPIT (LIVE TIMING, REMEDIES, YOGAS & CONSULTATION) */}
        {dashaTab === "oracle" && (
          <MasterAIAstrologerCockpit
            vedicData={vedicData}
            westernData={westernData}
            numerologyData={numerologyData}
            baziData={baziData}
            birthDate={birthDate}
            birthTime={birthTime}
            cityName={cityName}
            country={country}
            fullName={fullName}
          />
        )}
      </div>
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
