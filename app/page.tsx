"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BirthForm, BirthFormData } from "@/components/BirthForm";
import { WesternChart } from "@/components/WesternChart";
import { VedicChart } from "@/components/VedicChart";
import { NumerologyView } from "@/components/NumerologyView";
import { ChineseView } from "@/components/ChineseView";
import { AIReadingView } from "@/components/AIReadingView";
import { TransitView } from "@/components/TransitView";
import { DeploymentModal } from "@/components/DeploymentModal";
import { ProfilesManager } from "@/components/ProfilesManager";
import { PrintModal } from "@/components/PrintModal";
import { PrintDossier } from "@/components/PrintDossier";
import { KPSystemPanel } from "@/components/KPSystemPanel";
import { RelationshipAstrologyView } from "@/components/RelationshipAstrologyView";
import { MultiSystemVerificationPanel } from "@/components/MultiSystemVerificationPanel";
import { useIsMounted } from "@/lib/hooks/useIsMounted";

import { swissEphemeris } from "@/lib/astronomy/swissEphemeris";
import { calculateWesternChart } from "@/lib/astronomy/ephemeris";
import { calculateVedicChart } from "@/lib/astronomy/vedic";
import { calculateNumerologyProfile } from "@/lib/astronomy/numerology";
import { calculateBaZiProfileFromInstant } from "@/lib/astronomy/baziProfileAdapter";
import { resolveLocalDateTime } from "@/lib/astronomy/historicalTimezone";
import { parseBirthClockTime } from "@/lib/astronomy/timeInput";

import {
  Compass,
  Sparkles,
  Orbit,
  Moon,
  Hash,
  Globe,
  Share2,
  ChevronDown,
  Zap,
  Download,
  Target,
  Heart,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";

const SYSTEM_TABS = [
  { id: "western", label: "Western Natal Wheel", icon: Orbit, badge: "Wheel" },
  { id: "relationship", label: "Relationship & Compatibility", icon: Heart, badge: "Synastry & Vedic 36 Gunas" },
  { id: "vedic", label: "Vedic Kundli & Shastras", icon: Moon, badge: "Kundli" },
  { id: "kp", label: "KP System & Sub-Lords", icon: Target, badge: "CSL" },
  { id: "transits", label: "Transits & Bi-Wheel", icon: Zap, badge: "Timing" },
  { id: "numerology", label: "Universal Numerology", icon: Hash, badge: "6 Systems" },
  { id: "chinese", label: "Chinese BaZi", icon: Compass, badge: "Four Pillars" },
  { id: "verification", label: "Verification Center", icon: CheckCircle2, badge: "108 Tests" },
  { id: "aiSynthesis", label: "AI Cosmic Synthesis", icon: Sparkles, badge: "Synthesis" },
] as const;

type SystemTabId = (typeof SYSTEM_TABS)[number]["id"];

export default function HomePage() {
  // Default Initial Birth Profile: Leonardo da Vinci (April 15, 1452 at 22:00, Vinci Italy)
  const [formData, setFormData] = useState<BirthFormData>({
    fullName: "Leonardo da Vinci",
    birthDate: "1452-04-15",
    birthTime: "22:00",
    isTimeUnknown: false,
    cityName: "Vinci (Florence)",
    country: "Italy",
    latitude: 43.7844,
    longitude: 10.9253,
    timezoneOffset: 1,
    ianaTimezone: "Europe/Rome",
    timezoneMode: "manual",
    manualOffsetConfirmed: true,
    baziTimeBasis: "local-mean-solar",
    baziDayBoundaryPolicy: "pure-zi",
    houseSystem: "Placidus",
  });

  const [activeTab, setActiveTab] = useState<SystemTabId>("western");
  const [isFormCollapsed, setIsFormCollapsed] = useState(true);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCopiedShare, setIsCopiedShare] = useState(false);
  const isMounted = useIsMounted();

  // All chart systems share one resolved UTC birth instant.
  const { westernData, vedicData, numerologyData, baziData, birthTimeContext } = useMemo(() => {
    const [year, month, day] = formData.birthDate.split("-").map(Number);
    if (![year, month, day].every(Number.isInteger) || year < 1 || month < 1 || month > 12 || day < 1 || day > 31) {
      throw new RangeError("Birth date must be a valid Gregorian date.");
    }
    const calendarCheck = new Date(Date.UTC(year, month - 1, day));
    if (calendarCheck.getUTCFullYear() !== year || calendarCheck.getUTCMonth() !== month - 1 || calendarCheck.getUTCDate() !== day) {
      throw new RangeError("Birth date is not a valid Gregorian calendar date.");
    }
    const { hour, minute } = parseBirthClockTime(formData.birthTime);

    let birthDateObj: Date;
    let offsetSeconds: number;
    let resolutionLabel = "Manual/legacy UTC offset";
    let resolutionWarning = "";

    const timezoneMode = formData.timezoneMode ?? (formData.ianaTimezone ? "automatic" : "manual");
    if (timezoneMode === "automatic" && formData.ianaTimezone) {
      const resolution = resolveLocalDateTime({
        year, month, day, hour, minute,
      }, formData.ianaTimezone);
      const selectedCandidate =
        resolution.status === "resolved"
          ? resolution.candidates[0]
          : resolution.status === "ambiguous"
            ? resolution.candidates.find((candidate) => candidate.instant.toISOString() === formData.selectedUtcInstant)
            : undefined;

      if (selectedCandidate) {
        birthDateObj = selectedCandidate.instant;
        offsetSeconds = selectedCandidate.offsetSeconds;
        resolutionLabel = "IANA database-resolved";
        resolutionWarning = "The instant and offset come from the runtime IANA/ICU database. Historical civil-time details still require source verification.";
      } else {
        offsetSeconds = Number.isFinite(formData.timezoneOffset) ? formData.timezoneOffset * 3600 : 0;
        birthDateObj = swissEphemeris.createUTCDate(year, month, day, hour, minute, 0, offsetSeconds / 3600);
        resolutionLabel = "Automatic resolution unavailable; legacy offset fallback";
        resolutionWarning = resolution.status === "nonexistent"
          ? "The entered local time did not exist in this IANA timezone. The displayed charts are using the saved numeric offset only; correct the time or explicitly confirm a manual offset."
          : resolution.status === "ambiguous"
            ? "This local time occurs twice and no candidate was selected. The displayed charts are using the saved numeric offset only; select the intended UTC instant."
            : resolution.reason + " The displayed charts are using the saved numeric offset only.";
      }
    } else {
      offsetSeconds = Number.isFinite(formData.timezoneOffset) ? formData.timezoneOffset * 3600 : 0;
      birthDateObj = swissEphemeris.createUTCDate(year, month, day, hour, minute, 0, offsetSeconds / 3600);
      resolutionLabel = formData.manualOffsetConfirmed ? "User-confirmed manual offset" : "Legacy numeric offset";
      resolutionWarning = formData.manualOffsetConfirmed
        ? "The UTC offset is manually supplied; it is not independently verified as historical civil time."
        : "This saved profile has no verified IANA timezone. Its legacy numeric offset is retained for compatibility and should be reviewed.";
    }

    const offsetHours = offsetSeconds / 3600;

    // 1. Western Astrology — same UTC instant/offset as the other systems.
    const wData = calculateWesternChart(
      year, month, day, hour, minute,
      formData.latitude, formData.longitude,
      offsetHours, formData.houseSystem
    );

    // 2. Vedic Astrology (Lahiri Ayanamsa)
    const vData = calculateVedicChart(wData, birthDateObj);

    // 3. Pythagorean Numerology
    const nData = calculateNumerologyProfile(formData.fullName, year, month, day);

    // 4. Chinese BaZi — explicit solar clock and day-boundary convention.
    const bData = calculateBaZiProfileFromInstant(
      birthDateObj,
      {
        clock: {
          timeBasis: formData.baziTimeBasis ?? "local-mean-solar",
          longitudeDegrees: formData.longitude,
          civilUtcOffsetSeconds: offsetSeconds,
        },
        dayBoundaryPolicy: formData.baziDayBoundaryPolicy ?? "pure-zi",
      }
    );

    return {
      westernData: wData,
      vedicData: vData,
      numerologyData: nData,
      baziData: bData,
      birthTimeContext: {
        label: resolutionLabel,
        warning: resolutionWarning,
        ianaTimezone: formData.ianaTimezone ?? null,
        offsetSeconds,
        utcInstant: birthDateObj.toISOString(),
      },
    };
  }, [formData]);

  const handleFormSubmit = (data: BirthFormData) => {
    setFormData(data);
    setIsFormCollapsed(true);
  };

  const handleShareSummary = () => {
    const sun = westernData.planets.find((p) => p.name === "Sun");
    const summary = `✨ Celestia Cosmic Matrix for ${formData.fullName}:
• Western: Sun in ${sun?.sign}, Moon in ${westernData.planets.find((p) => p.name === "Moon")?.sign}, ${westernData.ascendant.sign} Rising
• Vedic: ${vedicData.moonSignRasi} Rasi · ${vedicData.birthNakshatra} Nakshatra
• Numerology: Life Path ${numerologyData.lifePathNumber} (${numerologyData.detailedInterpretations.lifePath.archetype})
• BaZi: ${baziData.zodiacAnimal} · ${baziData.dayMaster.symbol}`;

    navigator.clipboard.writeText(summary);
    setIsCopiedShare(true);
    setTimeout(() => setIsCopiedShare(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-amber-500/20 selection:text-amber-200">
      {/* 1. Top Observatory Navigation Bar (Strict 1-Row, 3-Zone Contract) */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-serif-celestial font-bold tracking-widest text-slate-100 flex items-center gap-1.5">
                CELESTIA
                <span className="text-[10px] font-sans font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Matrix
                </span>
              </span>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Western · Vedic · Numerology · BaZi
              </p>
            </div>
          </div>

          {/* Zone 2: Active Profile Presence (Single-Line Text with Separators) */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/70 border border-slate-800 rounded-lg text-xs text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <strong className="font-medium text-slate-200">{formData.fullName}</strong>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-slate-400 text-[11px]">{formData.birthDate} ({formData.birthTime})</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">{formData.cityName}</span>
          </div>

          {/* Zone 3: Functional Affordances */}
          <div className="flex items-center gap-2 shrink-0">
            <ProfilesManager currentData={formData} onSelectProfile={setFormData} />

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Download or print complete multi-system astrological dossier as PDF"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            <button
              onClick={handleShareSummary}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copy chart summary text"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isCopiedShare ? "Copied!" : "Share"}</span>
            </button>

            <button
              onClick={() => setIsDeployModalOpen(true)}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Deploy</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6 no-print">
        {birthTimeContext.warning && (
          <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-amber-300">{birthTimeContext.label}</p>
            <p className="text-[11px] text-slate-300">{birthTimeContext.warning}</p>
            <p className="text-[10px] text-slate-500">UTC instant used by the current charts: {birthTimeContext.utcInstant} · Offset: {birthTimeContext.offsetSeconds} seconds</p>
          </div>
        )}
        {/* 2. Compact Spacetime Inception Strip & Smooth Accordion Drawer */}
        <section className="bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md">
          {/* Collapsed Horizontal Quick-Summary Bar */}
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 flex-wrap text-slate-300">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Natal Inception:</span>
              </span>
              <strong className="text-slate-100">{formData.fullName}</strong>
              <span className="text-slate-600">·</span>
              <span>{formData.birthDate} at {formData.birthTime}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{formData.cityName}, {formData.country}</span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-[11px] text-slate-400">
                {Math.abs(formData.latitude).toFixed(2)}°{formData.latitude >= 0 ? "N" : "S"},{" "}
                {Math.abs(formData.longitude).toFixed(2)}°{formData.longitude >= 0 ? "E" : "W"}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-300/80 font-mono text-[11px]">{formData.houseSystem} Houses</span>
            </div>

            <button
              type="button"
              onClick={() => setIsFormCollapsed(!isFormCollapsed)}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>{isFormCollapsed ? "Adjust Coordinates" : "Close Coordinates"}</span>
              <motion.span
                animate={{ rotate: isFormCollapsed ? 0 : 180 }}
                transition={{ duration: 0.2 }}
                className="inline-flex"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.span>
            </button>
          </div>

          {/* Smooth Expanding Drawer via AnimatePresence */}
          <AnimatePresence>
            {!isFormCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden border-t border-slate-800/80 p-5 bg-slate-950/90"
              >
                <BirthForm initialData={formData} onSubmit={handleFormSubmit} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 3. Single-Tier Unified System Navigation Hub with Animated Spring Slider */}
        <nav
          aria-label="Astrological Tradition Navigator"
          className="relative flex items-center gap-1 p-1.5 bg-slate-950/90 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar shadow-inner"
        >
          {SYSTEM_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer z-10 ${
                  isActive ? "text-amber-200" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                {/* Active Tab Spring Slider Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeMasterTabIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-amber-500/10 border border-amber-500/40 rounded-lg shadow-sm -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-slate-900 text-slate-500 border border-slate-800"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 4. Tab Viewport Stage with Smooth Physical Crossfade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full"
          >
            {activeTab === "transits" && (
              <TransitView
                westernChart={westernData}
                vedicChart={vedicData}
                fullName={formData.fullName}
                birthDate={formData.birthDate}
                cityName={formData.cityName}
              />
            )}

            {activeTab === "western" && (
              <WesternChart
                chartData={westernData}
                fullName={formData.fullName}
                birthDate={formData.birthDate}
                birthTime={formData.birthTime}
                latitude={formData.latitude}
                longitude={formData.longitude}
                timezoneOffset={formData.timezoneOffset}
              />
            )}

            {activeTab === "relationship" && (
              <RelationshipAstrologyView
                person1Chart={westernData}
                person1Name={formData.fullName}
                person1Date={formData.birthDate}
                person1Time={formData.birthTime}
                person1Lat={formData.latitude}
                person1Lon={formData.longitude}
                person1CityName={formData.cityName}
                person1TimezoneOffset={formData.timezoneOffset}
                person1UtcInstant={birthTimeContext.utcInstant}
              />
            )}

            {activeTab === "vedic" && (
              <VedicChart
                vedicData={vedicData}
                birthDate={formData.birthDate}
                birthTime={formData.birthTime}
                westernData={westernData}
                numerologyData={numerologyData}
                baziData={baziData}
                fullName={formData.fullName}
                cityName={formData.cityName}
                country={formData.country}
              />
            )}

            {activeTab === "kp" && (
              <KPSystemPanel
                westernData={westernData}
                vedicData={vedicData}
                fullName={formData.fullName}
                birthDateStr={formData.birthDate}
              />
            )}

            {activeTab === "numerology" && (
              <NumerologyView
                numerologyData={numerologyData}
                fullName={formData.fullName}
              />
            )}

            {activeTab === "chinese" && <ChineseView baziData={baziData} />}

            {activeTab === "verification" && (
              <MultiSystemVerificationPanel
                westernData={westernData}
                vedicData={vedicData}
                baziData={baziData}
                numerologyData={numerologyData}
              />
            )}

            {activeTab === "aiSynthesis" && (
              <AIReadingView
                fullName={formData.fullName}
                birthDate={formData.birthDate}
                birthTime={formData.birthTime}
                cityName={formData.cityName}
                country={formData.country}
                western={westernData}
                vedic={vedicData}
                numerology={numerologyData}
                chinese={baziData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 5. Grounded Universal Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 mt-12 text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif-celestial font-semibold text-slate-300">
              Celestia Multi-System Matrix
            </span>
            <span aria-hidden="true">·</span>
            <span>Client-Side Astronomical Ephemeris</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>VSOP87 Planetary Coordinates</span>
            <span aria-hidden="true">·</span>
            <span>Chitra Paksha (Lahiri) Ayanamsa</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsDeployModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer"
            >
              Deploy Free (GitHub / Vercel)
            </button>
          </div>
        </div>
      </footer>

      {/* Complete Astrological Dossier (Print-Only Container) */}
      {isMounted && (
        <div className="print-only">
          <PrintDossier
            western={westernData}
            vedic={vedicData}
            numerology={numerologyData}
            chinese={baziData}
            formData={formData}
            printMode="complete"
            activeTab={activeTab}
          />
        </div>
      )}

      {/* Free Deployment Guide Modal */}
      <DeploymentModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
      />

      {/* Print to PDF / Export Dossier Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        western={westernData}
        vedic={vedicData}
        numerology={numerologyData}
        chinese={baziData}
        formData={formData}
        activeTab={activeTab}
      />
    </div>
  );
}
