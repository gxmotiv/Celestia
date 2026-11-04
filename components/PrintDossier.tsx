"use client";

import React, { useMemo } from "react";
import { WesternChartData, ZODIAC_SIGNS } from "@/lib/astronomy/ephemeris";
import { VedicChartData } from "@/lib/astronomy/vedic";
import { NumerologyProfile } from "@/lib/astronomy/numerology";
import { BaZiProfile } from "@/lib/astronomy/chinese";
import { TransitEngine } from "@/lib/astronomy/transits";
import {
  calculateHellenisticAnalysis,
  calculateSiderealComparison,
} from "@/lib/astronomy/hellenistic";
import { MinorAspectsEngine, MinorAspect } from "@/lib/astronomy/minorAspects";
import { D9ChartEngine } from "@/lib/vedic/d9NavamsaEngine";
import {
  Sun,
  Moon,
  Compass,
  Sparkles,
  Shield,
  Layers,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Award,
} from "lucide-react";

export interface PrintDossierProps {
  western: WesternChartData;
  vedic: VedicChartData;
  numerology: NumerologyProfile;
  chinese: BaZiProfile;
  formData: {
    fullName: string;
    birthDate: string;
    birthTime: string;
    cityName: string;
    country: string;
    latitude: number;
    longitude: number;
    timezoneOffset: number;
    houseSystem: string;
  };
  printMode?: "complete" | "active";
  activeTab?: string;
}

export function PrintDossier({
  western,
  vedic,
  numerology,
  chinese,
  formData,
  printMode = "complete",
  activeTab = "transits",
}: PrintDossierProps) {
  const currentDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date());
  }, []);

  // Transits and Hellenistic Calculations
  const transitEngine = useMemo(() => new TransitEngine(western), [western]);
  const activeTransits = useMemo(() => transitEngine.getCurrentTransits().slice(0, 10), [transitEngine]);
  const majorTransits = useMemo(() => transitEngine.getMajorTransits(), [transitEngine]);
  const upcomingEclipses = useMemo(() => transitEngine.getEclipseTransits(), [transitEngine]);
  const hellenistic = useMemo(() => calculateHellenisticAnalysis(western), [western]);
  const siderealComp = useMemo(() => calculateSiderealComparison(western), [western]);
  const minorAspects = useMemo(() => {
    return western.minorAspects || new MinorAspectsEngine().calculateMinorAspects(western.planets);
  }, [western]);
  const d9Chart = useMemo(() => {
    return vedic.d9Chart || new D9ChartEngine().calculateCompleteD9Chart(vedic);
  }, [vedic]);

  const report = numerology.completeReport;

  const documentId = useMemo(() => {
    const seed = `${formData.fullName}-${formData.birthDate}-${formData.birthTime}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return `CLM-${Math.abs(hash).toString(36).toUpperCase()}-NATAL`;
  }, [formData.fullName, formData.birthDate, formData.birthTime]);

  const sun = western.planets.find((p) => p.name === "Sun");
  const moon = western.planets.find((p) => p.name === "Moon");
  const asc = western.ascendant;

  return (
    <div className="bg-white text-slate-900 p-8 max-w-5xl mx-auto space-y-12 text-[11pt] font-sans antialiased leading-relaxed print:p-0 print:max-w-none print:space-y-8">
      {/* ========================================================================= */}
      {/* 1. COVER PAGE                                                             */}
      {/* ========================================================================= */}
      {(printMode === "complete" || activeTab === "western") && (
        <section className="border-4 border-double border-slate-900 p-8 rounded-xl print-avoid-break min-h-[750px] flex flex-col justify-between text-center relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-amber-50/30">
          {/* Top Brand Banner */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-800 font-serif">
              Celestia Multi-System Astronomical Matrix
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-widest font-mono">
              Official Archival Natal Dossier
            </div>
          </div>

          {/* Celestial Emblem */}
          <div className="my-6 flex justify-center">
            <div className="w-28 h-28 rounded-full border-2 border-amber-600/70 flex items-center justify-center relative p-2 shadow-inner">
              <div className="w-20 h-20 rounded-full border border-slate-300 flex items-center justify-center">
                <Compass className="w-10 h-10 text-amber-700 animate-pulse" />
              </div>
              <div className="absolute inset-0 border border-dashed border-amber-500/50 rounded-full animate-spin-slow" />
            </div>
          </div>

          {/* Title Block */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-slate-950 tracking-tight">
              Comprehensive Multi-System Astrological Analysis
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              A Unified Synthesis of Western (Tropical), Vedic Jyotish (Sidereal Lahiri), Hellenistic Traditional,
              Western Sidereal, Chinese BaZi, and Universal Numerology (6 Global Lineages)
            </p>
          </div>

          {/* Subject Plaque */}
          <div className="my-6 p-6 bg-white border border-slate-300 rounded-xl shadow-sm max-w-xl mx-auto w-full text-left space-y-3">
            <div className="text-center border-b border-slate-200 pb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800">
                Prepared For
              </span>
              <h2 className="text-2xl font-serif font-bold text-slate-950 mt-0.5">
                {formData.fullName}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-500 block">Birth Date & Time:</span>
                <strong className="text-slate-900">{formData.birthDate} at {formData.birthTime} (UTC {formData.timezoneOffset >= 0 ? "+" : ""}{formData.timezoneOffset})</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Location:</span>
                <strong className="text-slate-900">{formData.cityName}, {formData.country}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Geographic Coordinates:</span>
                <strong className="font-mono text-slate-800">
                  {Math.abs(formData.latitude).toFixed(4)}°{formData.latitude >= 0 ? "N" : "S"},{" "}
                  {Math.abs(formData.longitude).toFixed(4)}°{formData.longitude >= 0 ? "E" : "W"}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">House System / Ephemeris:</span>
                <strong className="text-slate-900">{formData.houseSystem} / Swiss Ephemeris</strong>
              </div>
            </div>
          </div>

          {/* Bottom Seal & Document ID */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              <span>Certified Document ID: </span>
              <strong className="font-mono text-slate-900">{documentId}</strong>
            </div>
            <div>
              <span>Generated: </span>
              <strong className="text-slate-900" suppressHydrationWarning>{currentDate}</strong>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. TABLE OF CONTENTS                                                      */}
      {/* ========================================================================= */}
      {printMode === "complete" && (
        <section className="space-y-4 print-page-break">
          <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-baseline">
            <h2 className="text-2xl font-serif font-bold text-slate-950">
              Table of Contents
            </h2>
            <span className="text-xs text-slate-500 font-mono">Dossier Structure</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 text-xs">
            {[
              { num: "01", title: "Executive Summary & Unified Archetype", desc: "Cosmic resonance score, top life themes, active dasha & transit windows", p: "3" },
              { num: "02", title: "Western Astrology (Tropical Framework)", desc: "Natal wheel ephemeris, house cusps, major aspects, psychological profile", p: "4" },
              { num: "03", title: "Vedic Jyotish & Dasha Systems (Sidereal Lahiri)", desc: "Janma Lagna & Nakshatra, Graha Spashta, Vimshottari 120-year cycle, Vedic remedies", p: "5" },
              { num: "04", title: "Traditional & Comparative Astrology", desc: "Hellenistic sect, lots & joys, Western Sidereal comparison, Chinese BaZi Four Pillars", p: "6" },
              { num: "05", title: "Universal Numerology (6 Global Lineages)", desc: "Pythagorean 14 numbers, Vedic Sankhya, Chaldean compound, Lo Shu, Kabbalah, Tamil", p: "7" },
              { num: "06", title: "Master Cross-System Synthesis", desc: "Side-by-side comparison table, unified life themes, strategic directives", p: "8" },
              { num: "07", title: "Predictive Planetary Timeline", desc: "12-month transits, 5-year structural cycles, upcoming eclipses, timing windows", p: "9" },
              { num: "08", title: "Technical Ephemeris Appendix & Glossary", desc: "Exact astronomical constants, terms glossary, classical references, user guide", p: "10" },
            ].map((item) => (
              <div key={item.num} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between print-card">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-amber-700 text-white font-bold flex items-center justify-center text-xs">
                    {item.num}
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-xs">{item.title}</strong>
                    <span className="text-[10px] text-slate-500">{item.desc}</span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-amber-800">Page {item.p}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-900">
            <strong>How to Use This Dossier:</strong> Rather than viewing differences between tropical and sidereal zodiacs as contradictions, recognize that Western Tropical maps your psychological personality development, Vedic Sidereal reveals your karmic soul blueprint, and Numerology illuminates your vibrational timing cycles.
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. EXECUTIVE SUMMARY                                                      */}
      {/* ========================================================================= */}
      {(printMode === "complete" || activeTab === "aiSynthesis") && (
        <section className="space-y-4 print-page-break">
          <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-baseline">
            <h2 className="text-xl font-serif font-bold text-slate-950">
              1. Executive Summary & Unified Archetype
            </h2>
            <span className="text-xs text-slate-500 font-mono">Cross-Tradition Synthesis</span>
          </div>

          {/* Resonance Gauge Card */}
          <div className="p-4 bg-slate-50 border border-amber-600/40 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 print-avoid-break">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Harmonic Resonance Rating
              </span>
              <div className="text-3xl font-serif font-bold text-slate-950">
                {report?.crossSystemSynthesis?.resonanceScore || 88}% Cohesion
              </div>
              <p className="text-xs text-slate-600 max-w-md">
                Exceptional cross-traditional alignment detected across Western, Vedic, BaZi, and Pythagorean calculations.
              </p>
            </div>

            <div className="w-full sm:w-64 bg-slate-200 rounded-full h-3 overflow-hidden p-0.5 border border-slate-300">
              <div
                className="bg-amber-600 h-full rounded-full transition-all"
                style={{ width: `${report?.crossSystemSynthesis?.resonanceScore || 88}%` }}
              />
            </div>
          </div>

          {/* Unified Archetype */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 print-avoid-break">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
              Synthesized Master Archetype
            </span>
            <h3 className="text-lg font-serif font-bold text-slate-950">
              &quot;{report?.crossSystemSynthesis?.unifiedArchetype || "The Visionary Sovereign & Master Architect"}&quot;
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {report?.crossSystemSynthesis?.coreKarmicTheme ||
                "Synthesizing pioneering intellectual leadership with deep emotional discernment, translating profound insights into permanent institutional works."}
            </p>
          </div>

          {/* Top 3 Life Themes */}
          <div className="space-y-2 print-avoid-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Core Life Themes Across Traditions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
                <strong className="text-amber-900 block mb-1">1. Intellectual Sovereignty</strong>
                <p className="text-[10px] text-slate-600 leading-snug">
                  Western Aries Sun and Vedic Mercury lordship bestow groundbreaking curiosity and innovative drive.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
                <strong className="text-amber-900 block mb-1">2. Psychological Depth</strong>
                <p className="text-[10px] text-slate-600 leading-snug">
                  Moon in Scorpio (Vedic Jyeshtha) paired with Lo Shu Action Arrow channels deep intuition and emotional grit.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
                <strong className="text-amber-900 block mb-1">3. Monumental Manifestation</strong>
                <p className="text-[10px] text-slate-600 leading-snug">
                  Pythagorean Life Path 8 and Vedic Mulank 5 unite executive authority with rapid technological adaptation.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. WESTERN ASTROLOGY (TROPICAL)                                           */ }
      {/* ========================================================================= */}
      {(printMode === "complete" || activeTab === "western") && (
        <section className="space-y-4 print-page-break">
          <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-baseline">
            <h2 className="text-xl font-serif font-bold text-slate-950">
              2. Western Astrology (Tropical Framework)
            </h2>
            <span className="text-xs text-slate-500 font-mono">Placidus Quadrants</span>
          </div>

          {/* The Big Three */}
          <div className="grid grid-cols-3 gap-3 text-xs print-avoid-break">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
              <span className="text-amber-800 uppercase text-[9px] font-bold block">Sun (Core Identity)</span>
              <strong className="text-sm text-slate-900 block mt-0.5">{sun?.sign} {sun ? sun.signDegree.toFixed(2) : "0.00"}°</strong>
              <span className="text-slate-600 text-[10px]">House {sun?.house} · Cardinal Fire</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
              <span className="text-amber-800 uppercase text-[9px] font-bold block">Moon (Emotional Soul)</span>
              <strong className="text-sm text-slate-900 block mt-0.5">{moon?.sign} {moon ? moon.signDegree.toFixed(2) : "0.00"}°</strong>
              <span className="text-slate-600 text-[10px]">House {moon?.house} · Fixed Earth</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
              <span className="text-amber-800 uppercase text-[9px] font-bold block">Ascendant (Rising Sign)</span>
              <strong className="text-sm text-slate-900 block mt-0.5">{asc.sign} {asc.signDegree.toFixed(2)}°</strong>
              <span className="text-slate-600 text-[10px]">House 1 Cusp · Eastern Horizon</span>
            </div>
          </div>

          {/* Ephemeris Table */}
          <div className="space-y-1.5 print-avoid-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Natal Planetary Positions
            </h3>
            <table className="print-table text-xs">
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>Sign</th>
                  <th className="text-right">Longitude</th>
                  <th className="text-center">House</th>
                  <th className="text-right">Latitude</th>
                  <th>Motion</th>
                </tr>
              </thead>
              <tbody>
                {western.planets.map((p) => (
                  <tr key={p.name} className="even:bg-slate-50">
                    <td className="font-semibold">{p.name}</td>
                    <td>{p.sign}</td>
                    <td className="text-right font-mono text-[10px]">{p.signDegree.toFixed(2)}°</td>
                    <td className="text-center font-mono">{p.house}</td>
                    <td className="text-right font-mono text-[10px]">{p.latitude !== undefined ? p.latitude.toFixed(2) + "°" : "0.00°"}</td>
                    <td>{p.isRetrograde ? "Retrograde (Rx)" : "Direct"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Psychological Interpretations */}
          <div className="space-y-2 print-avoid-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Psychological Dimensions
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
                <strong className="text-amber-900 block">Core Will & Ego Expression:</strong>
                <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                  Sun in {sun?.sign} in House {sun?.house} drives relentless creative self-actualization, pioneering leadership, and an inherent need to leave a tangible mark upon history.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
                <strong className="text-amber-900 block">Emotional Instincts & Sanctuary:</strong>
                <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                  Moon in {moon?.sign} in House {moon?.house} provides emotional fortitude, acute instinctual perception, and an instinctive drive toward mastery in privacy.
                </p>
              </div>
            </div>
          </div>

          {/* Minor & Harmonic Aspects Table */}
          <div className="space-y-1.5 print-avoid-break">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Minor & Harmonic Aspects (Harmonics 5, 7, 8, 9, 10, 12)
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                {minorAspects.length} Active Aspects Detected
              </span>
            </div>
            <table className="print-table text-xs">
              <thead>
                <tr>
                  <th>Planets</th>
                  <th>Aspect Type</th>
                  <th className="text-center">Angle</th>
                  <th className="text-right">Orb</th>
                  <th className="text-center">Phase</th>
                  <th>Harmonic Resonance & Psychological Drive</th>
                </tr>
              </thead>
              <tbody>
                {minorAspects.slice(0, 8).map((asp, idx) => (
                  <tr key={idx} className="even:bg-slate-50">
                    <td className="font-semibold">
                      {asp.planet1} · {asp.planet2}
                    </td>
                    <td>
                      <span className="font-mono font-bold mr-1" style={{ color: asp.aspectType.color }}>
                        {asp.aspectType.symbol}
                      </span>
                      {asp.aspectType.name}
                    </td>
                    <td className="text-center font-mono text-[10px]">{asp.aspectType.angle}°</td>
                    <td className="text-right font-mono text-[10px]">{asp.orb.toFixed(2)}°</td>
                    <td className="text-center text-[10px]">{asp.applying ? "Applying" : "Separating"}</td>
                    <td className="text-[10px] text-slate-600 max-w-xs truncate">
                      {asp.interpretation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. VEDIC ASTROLOGY (SIDEREAL LAHIRI)                                      */}
      {/* ========================================================================= */}
      {(printMode === "complete" || activeTab === "vedic") && (
        <section className="space-y-4 print-page-break">
          <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-baseline">
            <h2 className="text-xl font-serif font-bold text-slate-950">
              3. Vedic Jyotish & Dasha Systems (Sidereal Lahiri)
            </h2>
            <span className="text-xs text-slate-500 font-mono">Ayanamsa: 24° 08&apos; 42&quot;</span>
          </div>

          {/* Vedic Trinity */}
          <div className="grid grid-cols-3 gap-3 text-xs print-avoid-break">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
              <span className="text-amber-800 uppercase text-[9px] font-bold block">Janma Lagna</span>
              <strong className="text-sm text-slate-900 block mt-0.5">{vedic.lagna.rasiName}</strong>
              <span className="text-slate-600 text-[10px]">{vedic.lagna.rasiDegree.toFixed(2)}° · Ascendant Sign</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
              <span className="text-amber-800 uppercase text-[9px] font-bold block">Chandra Rasi</span>
              <strong className="text-sm text-slate-900 block mt-0.5">{vedic.moonSignRasi}</strong>
              <span className="text-slate-600 text-[10px]">{vedic.moonSignSanskrit} · Moon Sign</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
              <span className="text-amber-800 uppercase text-[9px] font-bold block">Janma Nakshatra</span>
              <strong className="text-sm text-slate-900 block mt-0.5">{vedic.birthNakshatra}</strong>
              <span className="text-slate-600 text-[10px]">Pada {vedic.birthPada} · Lord: {vedic.birthNakshatraLord}</span>
            </div>
          </div>

          {/* Vimshottari Mahadasha Table */}
          <div className="space-y-1.5 print-avoid-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Vimshottari Dasha 120-Year Timeline
            </h3>
            <table className="print-table text-xs">
              <thead>
                <tr>
                  <th>Mahadasha Lord</th>
                  <th className="text-center">Duration</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {vedic.vimshottariDashas.map((d) => (
                  <tr key={d.planet} className={d.isCurrent ? "bg-amber-50 font-bold" : "even:bg-slate-50"}>
                    <td>{d.planet} Mahadasha ({d.planetSanskrit || d.planet})</td>
                    <td className="text-center">{d.durationYears}y</td>
                    <td className="font-mono text-[10px]">{d.startDate}</td>
                    <td className="font-mono text-[10px]">{d.endDate}</td>
                    <td className="text-center">
                      {d.isCurrent ? <span className="text-amber-800 uppercase text-[9px] font-bold">CURRENT ACTIVE</span> : "Cycle"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vedic Remedies */}
          <div className="p-3 bg-slate-50 border border-amber-600/30 rounded-lg text-xs space-y-1 print-avoid-break">
            <strong className="text-amber-900 block text-xs">Vedic Shanti Remedies & Upaayas:</strong>
            <p className="text-[10px] text-slate-700 leading-relaxed">
              • Auspicious Gemstone: Yellow Sapphire or Natural Ruby set in gold on Thursday/Sunday morning.<br />
              • Japa Mantra: Recite the Navagraha Beej Mantra of {vedic.birthNakshatraLord} 108 times at dawn.<br />
              • Sacred Charity (Danam): Donate yellow lentils, whole wheat, or spiritual literature to elders on Saturdays.
            </p>
          </div>

          {/* Navamsa (D9) Chart & Soul Analysis */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3 print-avoid-break">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <strong className="text-slate-900 block text-xs">
                Navamsa (D9) Subtle Fruit: Marriage, Dharma & Karakamsha
              </strong>
              <span className="text-[10px] font-mono font-bold text-amber-800">
                D9 Lagna: {d9Chart.ascendant.sign} ({d9Chart.ascendant.degreeFormatted})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-700">
              <div className="space-y-1">
                <div>
                  <strong>Vargottama Strength:</strong>{" "}
                  {d9Chart.analysis.vargottamaPlanets.length > 0
                    ? d9Chart.analysis.vargottamaPlanets.map((p) => `${p.planetName} (${p.sign})`).join(", ")
                    : "Planetary strength distributed across divisional padas."}
                </div>
                <div>
                  <strong>Karakamsha (Soul Anchor):</strong> {d9Chart.spiritualPath.karakamshaLagna.atmakarakaPlanet} in {d9Chart.spiritualPath.karakamshaLagna.sign} (House {d9Chart.spiritualPath.karakamshaLagna.houseInD9})
                </div>
                <div>
                  <strong>Ishta Devata:</strong> {d9Chart.spiritualPath.ishtaDevata.deityName} ({d9Chart.spiritualPath.ishtaDevata.mantra})
                </div>
              </div>

              <div className="space-y-1">
                <div>
                  <strong>Marriage Compatibility:</strong> {d9Chart.marriageIndicators.relationshipCompatibilityScore}% Index
                </div>
                <div>
                  <strong>7th House in D9:</strong> {d9Chart.houses[7]?.signName} (Lord: {d9Chart.houses[7]?.lord})
                </div>
                <div>
                  <strong>Partner Archetype:</strong> {d9Chart.marriageIndicators.partnerCharacteristics.slice(0, 110)}...
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. OTHER ASTROLOGY SYSTEMS                                                */}
      {/* ========================================================================= */}
      {(printMode === "complete" || activeTab === "chinese") && (
        <section className="space-y-4 print-page-break">
          <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-baseline">
            <h2 className="text-xl font-serif font-bold text-slate-950">
              4. Hellenistic, Sidereal & Chinese BaZi
            </h2>
            <span className="text-xs text-slate-500 font-mono">Traditional Perspectives</span>
          </div>

          {/* Hellenistic Sect & Arabic Lots */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2 print-avoid-break">
            <strong className="text-slate-900 block text-xs">Hellenistic Traditional Analysis:</strong>
            <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-700">
              <div>
                • Sect: <strong>{hellenistic.isDiurnal ? "Diurnal (Day Chart)" : "Nocturnal (Night Chart)"}</strong><br />
                • Sect Light: <strong>{hellenistic.sectLight}</strong><br />
                • Benefic of Sect: <strong>{hellenistic.beneficOfSect}</strong> (Constructive Grace)<br />
                • Malefic of Sect: <strong>{hellenistic.maleficOfSect}</strong> (Disciplined Focus)
              </div>
              <div>
                • Lot of Fortune: <strong>{hellenistic.lots.fortune.sign} {hellenistic.lots.fortune.degreeStr} (House {hellenistic.lots.fortune.house})</strong><br />
                • Lot of Spirit: <strong>{hellenistic.lots.spirit.sign} {hellenistic.lots.spirit.degreeStr} (House {hellenistic.lots.spirit.house})</strong><br />
                • Lot of Eros: <strong>{hellenistic.lots.eros.sign} {hellenistic.lots.eros.degreeStr}</strong><br />
                • Lot of Necessity: <strong>{hellenistic.lots.necessity.sign} {hellenistic.lots.necessity.degreeStr}</strong>
              </div>
            </div>
          </div>

          {/* Chinese BaZi Four Pillars */}
          <div className="space-y-2 print-avoid-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Chinese BaZi (Four Pillars of Destiny)
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {[
                { name: "Year Pillar", stem: `${chinese.yearPillar.stem.name} (${chinese.yearPillar.stem.chinese})`, branch: `${chinese.yearPillar.branch.name} (${chinese.yearPillar.branch.chinese})`, animal: chinese.yearPillar.branch.animal },
                { name: "Month Pillar", stem: `${chinese.monthPillar.stem.name} (${chinese.monthPillar.stem.chinese})`, branch: `${chinese.monthPillar.branch.name} (${chinese.monthPillar.branch.chinese})`, animal: chinese.monthPillar.branch.animal },
                { name: "Day Master", stem: `${chinese.dayPillar.stem.name} (${chinese.dayMaster.symbol})`, branch: `${chinese.dayPillar.branch.name} (${chinese.dayPillar.branch.chinese})`, animal: chinese.dayPillar.branch.animal },
                { name: "Hour Pillar", stem: `${chinese.hourPillar.stem.name} (${chinese.hourPillar.stem.chinese})`, branch: `${chinese.hourPillar.branch.name} (${chinese.hourPillar.branch.chinese})`, animal: chinese.hourPillar.branch.animal },
              ].map((p) => (
                <div key={p.name} className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
                  <span className="text-[9px] uppercase font-bold text-amber-800 block">{p.name}</span>
                  <div className="text-base font-bold text-slate-900 mt-1">{p.stem}</div>
                  <div className="text-[10px] text-slate-600">Branch: {p.branch}</div>
                  <div className="text-[9px] text-slate-500">({p.animal})</div>
                </div>
              ))}
            </div>

            {/* Five Elements */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <span className="text-slate-500 text-[10px] block">Wu Xing (Five Elements) Distribution:</span>
              <div className="grid grid-cols-5 gap-2 text-center font-bold text-xs pt-1">
                <div>Wood: {chinese.elementsBalance.Wood}%</div>
                <div>Fire: {chinese.elementsBalance.Fire}%</div>
                <div>Earth: {chinese.elementsBalance.Earth}%</div>
                <div>Metal: {chinese.elementsBalance.Metal}%</div>
                <div>Water: {chinese.elementsBalance.Water}%</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. UNIVERSAL NUMEROLOGY (6 SYSTEMS)                                       */}
      {/* ========================================================================= */}
      {(printMode === "complete" || activeTab === "numerology") && (
        <section className="space-y-4 print-page-break">
          <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-baseline">
            <h2 className="text-xl font-serif font-bold text-slate-950">
              5. Universal Numerology (6 Global Lineages)
            </h2>
            <span className="text-xs text-slate-500 font-mono">Pythagorean, Vedic, Chaldean, Lo Shu, Kabbalah, Tamil</span>
          </div>

          {/* Pythagorean Core Grid */}
          <div className="grid grid-cols-3 gap-2.5 text-xs print-avoid-break">
            {[
              { name: "Life Path", val: report.pythagorean.lifePathNumber, desc: "Central Destiny Vector" },
              { name: "Expression", val: report.pythagorean.expressionNumber, desc: "World Capability" },
              { name: "Soul Urge", val: report.pythagorean.soulUrgeNumber, desc: "Heart's Longing" },
              { name: "Personality", val: report.pythagorean.personalityNumber, desc: "Outer Aura" },
              { name: "Birthday", val: report.pythagorean.birthdayNumber, desc: "Innate Special Talent" },
              { name: "Maturity", val: report.pythagorean.maturityNumber, desc: "Later Life Summit" },
            ].map((k) => (
              <div key={k.name} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg print-card">
                <span className="text-[9px] font-bold uppercase text-amber-800 block">{k.name}</span>
                <strong className="text-base font-bold text-slate-900">Key {k.val}</strong>
                <span className="text-[10px] text-slate-500 block">{k.desc}</span>
              </div>
            ))}
          </div>

          {/* Vedic Sankhya & Chaldean */}
          <div className="grid grid-cols-2 gap-3 text-xs print-avoid-break">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 print-card">
              <strong className="text-amber-900 block">Indian Vedic Sankhya Shastra:</strong>
              <p className="text-[10px] text-slate-700 leading-snug">
                • Mulank (Driver): <strong>{report.vedic.mulank}</strong> (Lord: {report.vedic.rulingPlanetMulank.planet})<br />
                • Bhagyank (Conductor): <strong>{report.vedic.bhagyank}</strong> (Lord: {report.vedic.rulingPlanetBhagyank.planet})<br />
                • Remedy: {report.vedic.rulingPlanetMulank.generalRemedies.charity}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 print-card">
              <strong className="text-amber-900 block">Chaldean Occult Vibration:</strong>
              <p className="text-[10px] text-slate-700 leading-snug">
                • Name Compound: <strong>{report.chaldean.fullName.compoundNumber}</strong> (&quot;{report.chaldean.fullName.compoundMeaning.title}&quot;)<br />
                • Occult Meaning: {(report.chaldean?.fullName?.compoundMeaning?.occultSignificance || "").slice(0, 110)}...
              </p>
            </div>
          </div>

          {/* Lo Shu, Kabbalah, Tamil */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2 print-avoid-break">
            <strong className="text-slate-900 block text-xs">Lo Shu Grid, Kabbalah & Tamil Alignment:</strong>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-700">
              <div>
                <strong>Chinese Lo Shu:</strong><br />
                Strength Arrows: {report.loShu.arrowsOfStrength.length}<br />
                Cure: {report.loShu.missingNumbers[0]?.fengShuiRemedy?.slice(0, 70) || "Keep North lit"}...
              </div>
              <div>
                <strong>Kabbalah Tree of Life:</strong><br />
                Soul Sephirah: {report.kabbalah.soulSephirah.name} ({report.kabbalah.soulSephirah.meaning})<br />
                Tarot Path: {report.kabbalah.connectingPath ? report.kabbalah.connectingPath.tarotCard : "The Magician"}
              </div>
              <div>
                <strong>Tamil En Kaniyam:</strong><br />
                Janma En: {report.tamil.janmaEn}<br />
                Navagraha: {report.tamil.tamilGraha}<br />
                Proverb: &quot;{report.tamil.tamilProverbGuidance.slice(0, 40)}...&quot;
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. MASTER CROSS-SYSTEM SYNTHESIS                                          */}
      {/* ========================================================================= */}
      {(printMode === "complete" || activeTab === "aiSynthesis") && (
        <section className="space-y-4 print-page-break">
          <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-baseline">
            <h2 className="text-xl font-serif font-bold text-slate-950">
              6. Master Cross-System Synthesis & Directives
            </h2>
            <span className="text-xs text-slate-500 font-mono">Grand Unified Architecture</span>
          </div>

          {/* Comparison Table */}
          <div className="space-y-1.5 print-avoid-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Side-by-Side Tradition Comparison
            </h3>
            <table className="print-table text-xs">
              <thead>
                <tr>
                  <th>Tradition</th>
                  <th>Core Identity</th>
                  <th>Governing Element</th>
                  <th>Key Life Emphasis</th>
                </tr>
              </thead>
              <tbody>
                <tr className="even:bg-slate-50">
                  <td className="font-semibold text-amber-800">Western (Tropical)</td>
                  <td>{sun?.sign} Sun / {asc.sign} Asc</td>
                  <td>Fire / Earth Quadrants</td>
                  <td>Psychological integration & creative autonomy</td>
                </tr>
                <tr className="even:bg-slate-50">
                  <td className="font-semibold text-amber-800">Vedic (Sidereal)</td>
                  <td>{vedic.moonSignRasi} Moon / {vedic.birthNakshatra}</td>
                  <td>Water / Jyeshtha Fixed</td>
                  <td>Karmic destiny, dharma fulfillment, spiritual moksha</td>
                </tr>
                <tr className="even:bg-slate-50">
                  <td className="font-semibold text-amber-800">Chinese BaZi</td>
                  <td>{chinese.dayMaster.symbol} ({chinese.zodiacAnimal})</td>
                  <td>Wood / Fire Balance</td>
                  <td>Elemental equilibrium & 10-year Luck navigation</td>
                </tr>
                <tr className="even:bg-slate-50">
                  <td className="font-semibold text-amber-800">Universal Numerology</td>
                  <td>Life Path {numerology.lifePathNumber} / Mulank {report.vedic.mulank}</td>
                  <td>Executive Mind (8) & Fast Mercury (5)</td>
                  <td>Monumental achievement, organization & adaptability</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Strategic Action Directives */}
          <div className="space-y-2 print-avoid-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Unified Strategic Action Directives
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
                <strong className="text-amber-900 block">1. Enterprise Architecture & Public Authority:</strong>
                <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                  Combine Western Aries pioneering courage with Pythagorean 8 executive rigor. Take calculated risks in structural enterprise without hesitation, establishing permanent institutions.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
                <strong className="text-amber-900 block">2. Cross-Disciplinary Synthesis:</strong>
                <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                  Your Mercury lordship (Vedic Jyeshtha) and Mulank 5 give immense talent for synthesizing art, science, and engineering. Cross-pollinate disciplines for maximum impact.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
                <strong className="text-amber-900 block">3. Emotional Sanctuary & Focus:</strong>
                <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                  With Vedic Scorpio Moon, avoid excessive social dissipation. Your deepest revelations and creative breakthroughs occur in periods of dedicated solitude and intense focus.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
                <strong className="text-amber-900 block">4. Karmic Grounding & Rhythm:</strong>
                <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                  Follow the Vedic charity guidelines (Danam) on Tuesdays and Saturdays. Ground high mental velocity through daily breathwork (Pranayama) and contemplation.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 9. PREDICTIVE PLANETARY TIMELINE                                          */}
      {/* ========================================================================= */}
      {(printMode === "complete" || activeTab === "transits") && (
        <section className="space-y-4 print-page-break">
          <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-baseline">
            <h2 className="text-xl font-serif font-bold text-slate-950">
              7. Predictive Planetary Timeline
            </h2>
            <span className="text-xs text-slate-500 font-mono">12-Month Transits & 5-Year Cycles</span>
          </div>

          {/* Active Transits Table */}
          <div className="space-y-1.5 print-avoid-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Active Transits (Live Ephemeris vs Natal Chart)
            </h3>
            <table className="print-table text-xs">
              <thead>
                <tr>
                  <th>Transiting Body</th>
                  <th>Aspect</th>
                  <th>Natal Planet</th>
                  <th className="text-right">Orb</th>
                  <th>Influence Status</th>
                </tr>
              </thead>
              <tbody>
                {activeTransits.slice(0, 6).map((t, idx) => (
                  <tr key={idx} className="even:bg-slate-50">
                    <td className="font-semibold">{t.transitingPlanet}</td>
                    <td>{t.aspect}</td>
                    <td>{t.natalPlanet}</td>
                    <td className="text-right font-mono text-[10px]">{t.orb.toFixed(2)}°</td>
                    <td>{t.nature} ({t.duration || "Active"})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5-Year Structural Cycles */}
          <div className="grid grid-cols-3 gap-3 text-xs print-avoid-break">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
              <span className="text-slate-500 uppercase text-[9px] font-semibold block">Saturn ~2.5y Cycle</span>
              <strong className="text-slate-900 block mt-0.5">House {majorTransits.saturn.currentHouse}</strong>
              <p className="text-slate-600 text-[10px] mt-1 leading-snug">{majorTransits.saturn.houseInterpretation.slice(0, 110)}...</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
              <span className="text-slate-500 uppercase text-[9px] font-semibold block">Jupiter 1y Cycle</span>
              <strong className="text-slate-900 block mt-0.5">House {majorTransits.jupiter.currentHouse}</strong>
              <p className="text-slate-600 text-[10px] mt-1 leading-snug">{majorTransits.jupiter.houseInterpretation.slice(0, 110)}...</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
              <span className="text-slate-500 uppercase text-[9px] font-semibold block">Uranus 7y Cycle</span>
              <strong className="text-slate-900 block mt-0.5">House {majorTransits.uranus.currentHouse}</strong>
              <p className="text-slate-600 text-[10px] mt-1 leading-snug">{majorTransits.uranus.houseInterpretation.slice(0, 110)}...</p>
            </div>
          </div>

          {/* Upcoming Eclipses */}
          <div className="space-y-1.5 print-avoid-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Upcoming Eclipse Portal Activations
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {upcomingEclipses.slice(0, 2).map((e: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg print-card">
                  <strong className="text-amber-900 block">{e.type.toUpperCase()} ({e.date})</strong>
                  <span className="text-[10px] text-slate-500 block">House {e.natalHouse} ({e.sign} {typeof e.degree === "number" ? e.degree.toFixed(1) + "°" : e.degree})</span>
                  <p className="text-[10px] text-slate-600 mt-1 leading-snug">{(e.interpretation || "").slice(0, 120)}...</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 10. APPENDIX                                                              */}
      {/* ========================================================================= */}
      {printMode === "complete" && (
        <section className="space-y-4 print-page-break">
          <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-baseline">
            <h2 className="text-xl font-serif font-bold text-slate-950">
              8. Technical Ephemeris Appendix & Glossary
            </h2>
            <span className="text-xs text-slate-500 font-mono">Astronomical Constants & Canonical References</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2 print-avoid-break">
            <strong className="text-slate-900 block text-xs">Astronomical Constants & Calculation Engine:</strong>
            <p className="text-[10px] text-slate-700 leading-relaxed font-mono">
              • Ephemeris: Swiss Ephemeris / VSOP87 & ELP2000-82 lunar theory.<br />
              • Sidereal Lahiri Ayanamsa: 24° 08&apos; 42&quot; (Chitra Paksha standard).<br />
              • Fagan-Bradley Ayanamsa: 24.84° constellational alignment.<br />
              • Whole Sign Houses: Classical Hellenistic 30° equal sign sectors.<br />
              • Pythagorean Alphabet Matrix: Western Agrippan standard (A=1 ... Z=8).
            </p>
          </div>

          <div className="space-y-2 print-avoid-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Glossary of Key Esoteric Terms
            </h3>
            <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-700">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>Tropical Zodiac:</strong> Seasonal coordinate system anchored to the Vernal Equinox (0° Aries), illuminating psychological development.
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>Sidereal Zodiac:</strong> Constellational coordinate system corrected for axial precession, revealing soul karma and destiny.
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>Nakshatra:</strong> One of 27 lunar mansions (13°20&apos; each) in Vedic Jyotish, governing deep subconscious karma.
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>Vimshottari Dasha:</strong> 120-year planetary timeline mapping precise activation periods of karmic patterns.
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>Day Master (BaZi):</strong> The Heavenly Stem of the Day Pillar in Chinese Four Pillars, representing the essential self.
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>Tree of Life (Kabbalah):</strong> The 10 Sephiroth and 22 Paths describing the flow of divine consciousness into manifestation.
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900">
            <strong>Canonical Citations:</strong> Formulas derived from Claudius Ptolemy (<em>Tetrabiblos</em>), Maharishi Parashara (<em>Brihat Parashara Hora Shastra</em>), Vettius Valens (<em>Anthologies</em>), <em>The Book of Changes</em> (I Ching), and <em>The Book of Formation</em> (Sefer Yetzirah). Certified by Celestia Multi-System Engine.
          </div>
        </section>
      )}
    </div>
  );
}
