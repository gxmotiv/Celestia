"use client";

import React, { useState } from "react";
import { WesternChartData } from "@/lib/astronomy/ephemeris";
import { VedicChartData } from "@/lib/astronomy/vedic";
import { NumerologyProfile } from "@/lib/astronomy/numerology";
import { BaZiProfile } from "@/lib/astronomy/chinese";
import {
  Sparkles,
  Printer,
  Copy,
  Check,
  RefreshCw,
  Compass,
  Briefcase,
  Heart,
  Calendar,
  MessageSquare,
  FileDown,
  Layers,
  HelpCircle,
  Award,
  ShieldCheck,
} from "lucide-react";
import { MasterAIAstrologerCockpit } from "@/components/MasterAIAstrologerCockpit";

interface AIReadingViewProps {
  fullName: string;
  birthDate: string;
  birthTime: string;
  cityName: string;
  country: string;
  western: WesternChartData;
  vedic: VedicChartData;
  numerology: NumerologyProfile;
  chinese: BaZiProfile;
}

type ReadingMode = "holistic" | "dharma" | "career" | "relationships" | "forecast" | "question";

export function AIReadingView({
  fullName,
  birthDate,
  birthTime,
  cityName,
  country,
  western,
  vedic,
  numerology,
  chinese,
}: AIReadingViewProps) {
  const [aiViewMode, setAiViewMode] = useState<"oracle" | "reading">("oracle");
  const [readingText, setReadingText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean | null>(null);

  const [activeMode, setActiveMode] = useState<ReadingMode>("holistic");
  const [readingLength, setReadingLength] = useState<"detailed" | "concise">("detailed");
  const [userQuestion, setUserQuestion] = useState("");

  const sampleQuestions = [
    "What is the single greatest karmic blind spot holding back my evolution?",
    "Should I launch a new independent venture or seek strategic alliances this year?",
    "How does my Western Moon placement interact with my Vedic Nakshatra in intimacy?",
    "What are my highest-leverage career arenas according to my BaZi Day Master?",
  ];

  const generateReading = async (overrideMode?: ReadingMode) => {
    const modeToUse = overrideMode || activeMode;
    setIsLoading(true);

    try {
      const sun = western.planets.find((p) => p.name === "Sun");
      const moon = western.planets.find((p) => p.name === "Moon");

      // Build planets dictionary for western
      const westernPlanetsMap: Record<string, { sign: string; degree: string; house: number; isRetrograde: boolean }> = {};
      western.planets.forEach((p) => {
        westernPlanetsMap[p.name] = {
          sign: p.sign,
          degree: p.signDegreeFormatted,
          house: p.house,
          isRetrograde: p.isRetrograde,
        };
      });

      // Construct payload adhering strictly to the required interpretation schema
      const payload = {
        name: fullName || "Seeker",
        birthData: {
          date: birthDate,
          time: birthTime,
          place: `${cityName}, ${country}`,
          latitude: western.ascendant.longitude || 0,
          longitude: western.midheaven.longitude || 0,
          timezone: `UTC${cityName ? "" : "+0"}`,
        },
        western: {
          sun: {
            sign: sun?.sign || "Taurus",
            degree: Math.round((sun?.signDegree || 0) * 10) / 10,
            house: sun?.house || 1,
          },
          moon: {
            sign: moon?.sign || "Scorpio",
            degree: Math.round((moon?.signDegree || 0) * 10) / 10,
            house: moon?.house || 2,
          },
          ascendant: western.ascendant.sign,
          midheaven: western.midheaven.sign,
          planets: westernPlanetsMap,
          aspects: western.aspects.slice(0, 8).map((a) => ({
            planet1: a.planet1,
            planet2: a.planet2,
            aspectName: a.aspectName,
            orb: a.orb,
            nature: a.nature,
          })),
        },
        vedic: {
          moonSign: vedic.moonSignRasi,
          lagna: vedic.lagna.rasiName,
          nakshatra: vedic.birthNakshatra,
          pada: vedic.birthPada,
          nakshatraLord: vedic.birthNakshatraLord,
          currentDasha: {
            planet: vedic.currentMahadasha,
            subPlanet: vedic.currentAntardasha,
            yearsRemaining: "Active cycle",
          },
          navamsa: {
            lagna: vedic.lagna.navamsaRasiName,
            moonNavamsa: vedic.planets.find((p) => p.name === "Moon")?.navamsaRasiName || "",
          },
          yogas: vedic.yogas.map((y) => y.name),
        },
        numerology: {
          lifePath: numerology.lifePathNumber,
          expression: numerology.expressionNumber,
          soulUrge: numerology.soulUrgeNumber,
          personality: numerology.personalityNumber,
          birthday: numerology.birthdayNumber,
          maturity: numerology.maturityNumber,
          personalYear: numerology.personalYearNumber,
        },
        chinese: {
          animal: chinese.zodiacAnimal,
          element: chinese.yearPillar.stem.element,
          yinYang: chinese.yearPillar.stem.polarity,
          dayMaster: chinese.dayMaster.symbol,
          dayMasterStrength: chinese.dayMaster.strength,
          bazi: {
            year: chinese.yearPillar.combinedName,
            month: chinese.monthPillar.combinedName,
            day: chinese.dayPillar.combinedName,
            hour: chinese.hourPillar.combinedName,
          },
          elementsBalance: chinese.elementsBalance,
        },
        readingMode: modeToUse,
        readingLength,
        userQuestion: modeToUse === "question" ? userQuestion : undefined,
      };

      const res = await fetch("/api/astrology/ai-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.reading) {
        setReadingText(data.reading);
        setIsAiGenerated(data.isAiGenerated);
      }
    } catch (err) {
      console.error("Failed to generate AI reading:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!readingText) return;
    navigator.clipboard.writeText(readingText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!readingText) return;
    const blob = new Blob([readingText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fullName.replace(/\s+/g, "_")}_Cosmic_Reading.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const modes: { id: ReadingMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: "holistic",
      label: "Master Blueprint",
      icon: <Layers className="w-3.5 h-3.5" />,
      desc: "Complete 5-chapter synthesis across Western, Vedic, Numerology & BaZi",
    },
    {
      id: "dharma",
      label: "Soul Dharma",
      icon: <Compass className="w-3.5 h-3.5" />,
      desc: "Life Path, ancestral karma, soul purpose, and spiritual gifts",
    },
    {
      id: "career",
      label: "Career & Wealth",
      icon: <Briefcase className="w-3.5 h-3.5" />,
      desc: "Vocational authority, Dhana wealth yogas, and Day Master strength",
    },
    {
      id: "relationships",
      label: "Love & Union",
      icon: <Heart className="w-3.5 h-3.5" />,
      desc: "Relational needs, Soul Urge resonance, and BaZi Spouse Palace",
    },
    {
      id: "forecast",
      label: "Active Forecast",
      icon: <Calendar className="w-3.5 h-3.5" />,
      desc: "Current Vedic Dasha timing, Personal Year cycle, and 12-month outlook",
    },
    {
      id: "question",
      label: "Ask Question",
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      desc: "Ask any specific life question for grounded multi-system counsel",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Architecture Toggle: Master Oracle Cockpit vs Magnum Opus Reading */}
      <div className="flex items-center justify-between p-1.5 bg-slate-950/90 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setAiViewMode("oracle")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              aiViewMode === "oracle"
                ? "bg-gradient-to-r from-amber-500/30 via-amber-500/20 to-amber-600/30 text-amber-200 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-serif-celestial font-bold">✨ Acharya Celestia Oracle Cockpit</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
              Live Consult & Remedies
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAiViewMode("reading")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              aiViewMode === "reading"
                ? "bg-slate-800 text-slate-100 border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Deep Blueprint Report (Magnum Opus)</span>
          </button>
        </div>
      </div>

      {aiViewMode === "oracle" && (
        <MasterAIAstrologerCockpit
          vedicData={vedic}
          westernData={western}
          numerologyData={numerology}
          baziData={chinese}
          birthDate={birthDate}
          birthTime={birthTime}
          cityName={cityName}
          country={country}
          fullName={fullName}
        />
      )}

      {aiViewMode === "reading" && (
        <div className="space-y-6">
          {/* Interpretation Mode Selector */}
          <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  AI Interpretation Engine (Gemini 3.8 Flash Synthesis)
                </h3>
                <p className="text-xs text-slate-400">
                  Select an interpretive focus area or interrogate the multi-system matrix directly.
                </p>
              </div>

          {/* Length Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setReadingLength("detailed")}
              className={`px-2.5 py-1 rounded transition-colors ${
                readingLength === "detailed"
                  ? "bg-amber-500/20 text-amber-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Comprehensive
            </button>
            <button
              type="button"
              onClick={() => setReadingLength("concise")}
              className={`px-2.5 py-1 rounded transition-colors ${
                readingLength === "concise"
                  ? "bg-amber-500/20 text-amber-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Executive Brief
            </button>
          </div>
        </div>

        {/* Focus Mode Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {modes.map((m) => {
            const isActive = activeMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setActiveMode(m.id);
                  if (readingText) {
                    generateReading(m.id);
                  }
                }}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? "bg-amber-500/15 border-amber-500/50 shadow-md text-amber-300"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold">
                  {m.icon}
                  <span className="truncate">{m.label}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Custom Question Area (when question mode is active) */}
        {activeMode === "question" && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 animate-in fade-in duration-150">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              What would you like to ask the Celestial Oracle?
            </label>
            <input
              type="text"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder="e.g. Is this year favorable for career expansion, and what is my greatest blind spot?"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
            {/* Quick Suggestions */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-medium">Or choose an exemplary inquiry:</span>
              <div className="flex flex-wrap gap-1.5">
                {sampleQuestions.map((sq, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setUserQuestion(sq)}
                    className="text-[11px] px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-left transition-colors truncate max-w-md"
                  >
                    &ldquo;{sq}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Primary Generate Trigger */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Engineered with Gemini 3.8 Flash & Grounded Mathematical Ephemeris
          </span>

          <button
            type="button"
            onClick={() => generateReading()}
            disabled={isLoading || (activeMode === "question" && !userQuestion.trim())}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs rounded-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading
              ? "Synthesizing Astrological Blueprint..."
              : activeMode === "question"
              ? "Consult the Matrix"
              : `Generate ${modes.find((m) => m.id === activeMode)?.label}`}
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-12 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-200">
              Integrating Western, Vedic, Numerological & BaZi Matrices...
            </h4>
            <p className="text-xs text-slate-400 max-w-md">
              Evaluating Sun/Moon polarities, Lahiri Nakshatra lords, Pythagorean Life Path vibrations, and Day Master Five Elements equilibrium.
            </p>
          </div>
        </div>
      )}

      {/* Empty State Prompt */}
      {!readingText && !isLoading && (
        <div className="p-8 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl text-center space-y-3">
          <Sparkles className="w-8 h-8 text-amber-400/80 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-200">
            Awaiting Interpretation Request
          </h4>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            Select an interpretation focus above (Holistic Blueprint, Soul Dharma, Career & Wealth, Love, or Ask a Question) and click &ldquo;Generate&rdquo; to produce an authoritative, multi-layered cosmic synthesis.
          </p>
        </div>
      )}

      {/* Output Document Display */}
      {readingText && !isLoading && (
        <div className="p-6 md:p-8 bg-slate-950/90 border border-slate-800/80 rounded-xl space-y-6 print-card shadow-2xl">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[11px] font-mono text-amber-400/90 uppercase tracking-widest block">
                {modes.find((m) => m.id === activeMode)?.label} · Astrological Synthesis
              </span>
              <h2 className="text-lg md:text-xl font-serif-celestial font-bold text-slate-100">
                {fullName || "Seeker"} · Sacred Incarnation Analysis
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Born {birthDate} at {birthTime} in {cityName}, {country}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-md border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Copy markdown text"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? "Copied" : "Copy"}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-md border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download Markdown file"
              >
                <FileDown className="w-3.5 h-3.5" />
                Download
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-md border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer no-print"
                title="Print report or export PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / PDF
              </button>

              <button
                type="button"
                onClick={() => generateReading()}
                disabled={isLoading}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Regenerate
              </button>
            </div>
          </div>

          {/* Formatted Content */}
          <div className="space-y-6 text-sm text-slate-200 leading-relaxed font-sans">
            {readingText.split("\n\n").map((paragraph, index) => {
              if (paragraph.startsWith("### ")) {
                return (
                  <h3
                    key={index}
                    className="text-base font-serif-celestial font-bold text-amber-300 pt-4 border-t border-slate-800/60 first:border-0 first:pt-0"
                  >
                    {paragraph.replace("### ", "")}
                  </h3>
                );
              } else if (paragraph.startsWith("#### ")) {
                return (
                  <h4
                    key={index}
                    className="text-sm font-bold text-amber-400/90 pt-2"
                  >
                    {paragraph.replace("#### ", "")}
                  </h4>
                );
              } else if (paragraph.startsWith("---")) {
                return <hr key={index} className="border-slate-800/80 my-4" />;
              } else {
                return (
                  <p key={index} className="text-slate-300 leading-relaxed">
                    {paragraph}
                  </p>
                );
              }
            })}
          </div>

          {/* Footer Metadata */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-amber-400/90">
                {isAiGenerated ? "Generated via Gemini 3.8 Intelligence" : "Calculated via Astronomical Synthesizer"}
              </span>
              <span aria-hidden="true">·</span>
              <span>{readingLength === "detailed" ? "Comprehensive Dossier" : "Executive Brief"}</span>
            </div>

            <span className="font-mono text-[11px]">
              Western VSOP87 · Lahiri Nirayana · Pythagorean Cipher · BaZi Four Pillars
            </span>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
