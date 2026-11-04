"use client";

import React, { useState, useMemo } from "react";
import { VedicChartData } from "@/lib/astronomy/vedic";
import { WesternChartData } from "@/lib/astronomy/ephemeris";
import { NumerologyProfile } from "@/lib/astronomy/numerology";
import { BaZiProfile } from "@/lib/astronomy/chinese";
import { CompleteDashaOrchestrator, AllDashaSystems } from "@/lib/vedic/completeDashaSystems";
import {
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Compass,
  Calendar,
  Layers,
  Send,
  HelpCircle,
  Copy,
  Check,
  FileDown,
  RefreshCw,
  Gem,
  Flame,
  Award,
  Clock,
  Heart,
  TrendingUp,
  BookOpen,
} from "lucide-react";

interface MasterAIAstrologerCockpitProps {
  vedicData: VedicChartData;
  westernData?: WesternChartData;
  numerologyData?: NumerologyProfile;
  baziData?: BaZiProfile;
  birthDate: string;
  birthTime: string;
  cityName?: string;
  country?: string;
  fullName?: string;
  seekerName?: string;
  compactMode?: boolean;
  activeDashas?: any[];
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "oracle";
  text: string;
  timestamp: string;
  isAiGenerated?: boolean;
}

const PLANETARY_REMEDIES: Record<
  string,
  {
    gem: string;
    subGem: string;
    metal: string;
    finger: string;
    beejaMantra: string;
    sanskritMantra: string;
    recitations: number;
    charity: string;
    fastingDay: string;
    rudraksha: string;
    deity: string;
  }
> = {
  Sun: {
    gem: "Natural Ruby (Manikya)",
    subGem: "Red Garnet / Sunstone",
    metal: "Copper / Gold",
    finger: "Ring Finger",
    beejaMantra: "Om Hram Hrim Hraum Sah Suryaya Namah",
    sanskritMantra: "ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः",
    recitations: 7000,
    charity: "Wheat, jaggery, copper vessel, red cloth on Sunday morning",
    fastingDay: "Sunday",
    rudraksha: "1-Mukhi or 12-Mukhi Rudraksha",
    deity: "Lord Shiva / Surya Narayana",
  },
  Moon: {
    gem: "Natural Pearl (Mukta)",
    subGem: "Moonstone",
    metal: "Silver",
    finger: "Little Finger",
    beejaMantra: "Om Shram Shrim Shraum Sah Chandraya Namah",
    sanskritMantra: "ॐ श्रां श्रीं श्रौं सः चन्द्राय नमः",
    recitations: 11000,
    charity: "White rice, milk, silver, camphor, white cloth on Monday evening",
    fastingDay: "Monday",
    rudraksha: "2-Mukhi Rudraksha",
    deity: "Goddess Parvati / Chandra Deva",
  },
  Mars: {
    gem: "Red Coral (Moonga)",
    subGem: "Carnelian",
    metal: "Copper / Gold",
    finger: "Ring Finger",
    beejaMantra: "Om Kram Krim Kraum Sah Bhaumaya Namah",
    sanskritMantra: "ॐ क्रां क्रीं क्रौं सः भौमाय नमः",
    recitations: 10000,
    charity: "Red lentils (masoor dal), copper, jaggery, red sweets on Tuesday",
    fastingDay: "Tuesday",
    rudraksha: "3-Mukhi Rudraksha",
    deity: "Lord Kartikeya / Lord Hanuman",
  },
  Mercury: {
    gem: "Emerald (Panna)",
    subGem: "Peridot / Green Tourmaline",
    metal: "Bronze / Gold",
    finger: "Little Finger",
    beejaMantra: "Om Bram Brim Braum Sah Budhaya Namah",
    sanskritMantra: "ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः",
    recitations: 9000,
    charity: "Whole moong dal, green clothes, emerald-colored items, books to students on Wednesday",
    fastingDay: "Wednesday",
    rudraksha: "4-Mukhi or 10-Mukhi Rudraksha",
    deity: "Lord Vishnu / Mahavishnu",
  },
  Jupiter: {
    gem: "Yellow Sapphire (Pukhraj)",
    subGem: "Yellow Topaz / Citrine",
    metal: "Gold / Brass",
    finger: "Index Finger",
    beejaMantra: "Om Gram Grim Graum Sah Guruve Namah",
    sanskritMantra: "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः",
    recitations: 19000,
    charity: "Chana dal, turmeric, yellow flowers, bananas, saffron to priests or teachers on Thursday",
    fastingDay: "Thursday",
    rudraksha: "5-Mukhi Rudraksha",
    deity: "Lord Brihaspati / Lord Shiva",
  },
  Venus: {
    gem: "Diamond (Heera)",
    subGem: "White Zircon / White Sapphire",
    metal: "Platinum / White Gold / Silver",
    finger: "Middle or Little Finger",
    beejaMantra: "Om Dram Drim Draum Sah Shukraya Namah",
    sanskritMantra: "ॐ द्रां द्रीं द्रौं सः शुक्राय नमः",
    recitations: 16000,
    charity: "Curd, white rice, ghee, silk clothes, perfumes, cosmetics on Friday morning",
    fastingDay: "Friday",
    rudraksha: "6-Mukhi Rudraksha",
    deity: "Goddess Lakshmi / Shukracharya",
  },
  Saturn: {
    gem: "Blue Sapphire (Neelam)",
    subGem: "Amethyst / Iolite",
    metal: "Iron / Lead / Panchadhatu",
    finger: "Middle Finger",
    beejaMantra: "Om Pram Prim Praum Sah Shanaischaraya Namah",
    sanskritMantra: "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः",
    recitations: 23000,
    charity: "Black sesame seeds, mustard oil, iron nails, black blankets, shoes to laborers on Saturday",
    fastingDay: "Saturday",
    rudraksha: "7-Mukhi or 14-Mukhi Rudraksha",
    deity: "Lord Shani / Lord Hanuman",
  },
  Rahu: {
    gem: "Hessonite Garnet (Gomed)",
    subGem: "Honey-colored Amber",
    metal: "Silver / Lead",
    finger: "Middle Finger",
    beejaMantra: "Om Bhram Bhrim Bhraum Sah Rahave Namah",
    sanskritMantra: "ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः",
    recitations: 18000,
    charity: "Black mustard, coconuts, lead, blue clothes, feeding street dogs or crows on Saturday sunset",
    fastingDay: "Saturday",
    rudraksha: "8-Mukhi Rudraksha",
    deity: "Goddess Durga / Bhairava",
  },
  Ketu: {
    gem: "Cat's Eye (Chrysoberyl Vaidurya)",
    subGem: "Tiger Eye",
    metal: "Silver / Panchadhatu",
    finger: "Ring or Little Finger",
    beejaMantra: "Om Stram Strim Straum Sah Ketave Namah",
    sanskritMantra: "ॐ स्रां स्रीं स्रौं सः केतवे नमः",
    recitations: 17000,
    charity: "Black and white sesame, blankets, seven grains (satnaja), feeding multi-colored dogs on Tuesday",
    fastingDay: "Tuesday",
    rudraksha: "9-Mukhi Rudraksha",
    deity: "Lord Ganesha / Matsya Avatar",
  },
};

export function MasterAIAstrologerCockpit({
  vedicData,
  westernData,
  numerologyData,
  baziData,
  birthDate,
  birthTime,
  cityName = "City of Birth",
  country = "Earth",
  fullName,
  seekerName,
  compactMode = false,
  activeDashas,
  onClose,
}: MasterAIAstrologerCockpitProps) {
  const effectiveName = fullName || seekerName || "Seeker";
  // Master Orchestrator for real-time 10-Dasha convergence
  const orchestrator = useMemo(() => new CompleteDashaOrchestrator(), []);

  const dashaSystems = useMemo<AllDashaSystems>(() => {
    const [yStr, mStr, dStr] = birthDate.split("-");
    const [hStr, minStr] = birthTime.split(":");
    const birthDateObj = new Date(
      Date.UTC(
        parseInt(yStr, 10) || 1990,
        (parseInt(mStr, 10) || 1) - 1,
        parseInt(dStr, 10) || 1,
        parseInt(hStr, 10) || 12,
        parseInt(minStr, 10) || 0
      )
    );

    const moonPlanet = vedicData.planets.find((p) => p.name === "Moon") || {
      siderealLongitude: 180,
      nakshatraIndex: 13,
      rasiName: "Libra",
      rasiDegree: 10,
    };

    const planetsInSigns: Record<string, string> = {};
    vedicData.planets.forEach((p) => {
      planetsInSigns[p.rasiName] = p.name;
    });

    const currentMD =
      vedicData.vimshottariDashas.find((d) => d.isCurrent) ||
      vedicData.vimshottariDashas[0];
    const currentAD =
      currentMD?.subPeriods?.find((s) => s.isCurrent) ||
      currentMD?.subPeriods?.[0];

    const moonNakshatra1Indexed = (moonPlanet.nakshatraIndex ?? 13) + 1;
    const moonDegreeInNakshatra = (moonPlanet.siderealLongitude || 180) % (360 / 27);

    return orchestrator.generateAllDashas({
      birthDate: birthDateObj,
      referenceDate: new Date(),
      moonLongitude: moonPlanet.siderealLongitude || 180,
      moonNakshatra1Indexed,
      moonDegreeInNakshatra,
      ascendantSign: vedicData.lagna.rasiName,
      planetsInSigns,
    });
  }, [vedicData, birthDate, birthTime, orchestrator]);

  // Active Mahadasha and Antardasha
  const currentMD = useMemo(() => {
    return (
      vedicData.vimshottariDashas.find((d) => d.isCurrent) ||
      vedicData.vimshottariDashas[0]
    );
  }, [vedicData]);

  const currentAD = useMemo(() => {
    return (
      currentMD?.subPeriods?.find((s) => s.isCurrent) ||
      currentMD?.subPeriods?.[0]
    );
  }, [currentMD]);

  // Active remedy profile based on Mahadasha lord
  const activeRemedyLord = currentMD?.planet || "Jupiter";
  const activeRemedy = PLANETARY_REMEDIES[activeRemedyLord] || PLANETARY_REMEDIES["Jupiter"];

  // Chat consultation state
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "initial-welcome",
      sender: "oracle",
      text: `Namaste, revered ${effectiveName}. I am **Acharya Celestia**, your Master Esoteric Astrologer and Celestial Synthesizer. 

I am currently reading your **10-System Classical Dasha convergence** synchronized with your **${vedicData.lagna.rasiName} Ascendant**, **${vedicData.birthNakshatra} Nakshatra** (Lord: **${vedicData.birthNakshatraLord}**), and the active **${currentMD?.planet || "Jupiter"} Mahadasha** / **${currentAD?.planet || "Saturn"} Antardasha**.

Ask me any specific inquiry regarding your predictive timing, career milestones, relationship fruition, or sacred Vedic remedies.`,
      timestamp: "Live Oracle Synchronized",
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isConsulting, setIsConsulting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"consultation" | "timingConvergence" | "classicalRemedies" | "yogas">("consultation");

  // Sample Master Queries
  const masterInquiries = [
    "What does the convergence of my 10 Dasha systems indicate for the next 12 months?",
    "What specific Vedic remedies (Upayas) should I perform for my current Antardasha?",
    "Synthesize my Western Sun & Midheaven with my Vedic Nakshatra and BaZi Day Master.",
    "When is my next auspicious astrological window for major financial or career breakthroughs?",
    "What is the deepest karmic lesson (Atmakaraka) encoded in my birth chart?",
  ];

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isConsulting) return;

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsConsulting(true);

    try {
      const sun = westernData?.planets.find((p) => p.name === "Sun");
      const moon = westernData?.planets.find((p) => p.name === "Moon");

      const payload = {
        seekerName: effectiveName,
        birthDate,
        birthTime,
        location: `${cityName}, ${country}`,
        query: textToSend,
        conversationHistory: messages.slice(-4).map((m) => ({
          sender: m.sender,
          text: m.text,
        })),
        context: {
          western: {
            sunSign: sun?.sign || "Aries",
            moonSign: moon?.sign || "Taurus",
            ascendantSign: westernData?.ascendant.sign || "Aries",
            midheavenSign: westernData?.midheaven.sign || "Capricorn",
            majorAspects: westernData?.aspects.slice(0, 5).map((a) => `${a.planet1} ${a.aspectName} ${a.planet2}`),
          },
          vedic: {
            moonRasi: vedicData.moonSignRasi,
            lagnaRasi: vedicData.lagna.rasiName,
            nakshatra: vedicData.birthNakshatra,
            pada: vedicData.birthPada,
            nakshatraLord: vedicData.birthNakshatraLord,
            activeMahadasha: currentMD?.planet || "Jupiter",
            activeAntardasha: currentAD?.planet || "Saturn",
            yogas: vedicData.yogas.map((y) => y.name),
            sadeSatiStatus: "Standard Transit",
          },
          dashaConvergence: {
            activeSystemsCount: dashaSystems.convergence.length,
            dominantTone: dashaSystems.convergence[0]?.tone || "positive",
            systemSummaries: dashaSystems.convergence.map((p) => ({
              system: p.system,
              lord: p.lordOrSign,
              tone: p.tone,
            })),
          },
          numerology: {
            lifePath: numerologyData?.lifePathNumber || 1,
            expression: numerologyData?.expressionNumber || 1,
            personalYear: numerologyData?.personalYearNumber || 1,
          },
          bazi: {
            zodiacAnimal: baziData?.zodiacAnimal || "Dragon",
            dayMaster: baziData?.dayMaster.symbol || "Jia",
            dominantElement: baziData?.dayMaster.stem?.element || "Wood",
          },
        },
      };

      const res = await fetch("/api/astrology/master-oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const reply = data.reply || "The stars illuminate your path. Focus on grounding your current planetary energies.";

      const oracleMsg: ChatMessage = {
        id: "oracle-" + Date.now(),
        sender: "oracle",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isAiGenerated: data.isAiGenerated,
      };

      setMessages((prev) => [...prev, oracleMsg]);
    } catch (err) {
      console.error("Master Oracle consultation failed:", err);
      const fallbackMsg: ChatMessage = {
        id: "oracle-" + Date.now(),
        sender: "oracle",
        text: `### Guidance from Acharya Celestia
In reviewing your chart, your active **${currentMD?.planet || "Jupiter"} Mahadasha** and **${currentAD?.planet || "Saturn"} Antardasha** demand mindful discipline. Propitiate your active Dasha lord by chanting **${activeRemedy.beejaMantra}** 108 times daily and offering charitable daan of **${activeRemedy.charity}** on ${activeRemedy.fastingDay}s.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isAiGenerated: false,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsConsulting(false);
    }
  };

  const handleCopyTranscript = () => {
    const transcript = messages
      .map((m) => `[${m.sender === "user" ? effectiveName : "Acharya Celestia"}]:\n${m.text}\n`)
      .join("\n---\n\n");
    navigator.clipboard.writeText(transcript);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadTranscript = () => {
    const transcript = messages
      .map((m) => `### ${m.sender === "user" ? effectiveName : "Acharya Celestia"} (${m.timestamp})\n\n${m.text}\n`)
      .join("\n---\n\n");
    const blob = new Blob([transcript], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${effectiveName.replace(/\s+/g, "_")}_Master_Astrologer_Consultation.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* 1. Grand Master Oracle Banner */}
      <div className="p-5 md:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border border-amber-500/40 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                  Master Astrologer & Celestial Oracle
                </span>
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live 10-Dasha Engine Active
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-serif-celestial font-bold text-slate-100 mt-1">
                Acharya Celestia · Master Multi-System Oracle
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
                Unified synthesis of 10 Classical Vedic Dashas, Parashari Yogas, Western Natal Geometry, BaZi Four Pillars & authentic Vedic Upayas (remedies).
              </p>
            </div>
          </div>

          {/* Quick Active Sovereign Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-amber-500/30">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Active Sovereign</span>
              <span className="text-amber-300 font-bold font-serif-celestial">
                {currentMD?.planet} Mahadasha
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Immediate Fruition</span>
              <span className="text-slate-200 font-bold font-serif-celestial">
                {currentAD?.planet} Antardasha
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-emerald-500/30">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Convergence Tone</span>
              <span className="text-emerald-300 font-bold font-serif-celestial capitalize">
                {dashaSystems.convergence[0]?.tone || "Auspicious"}
              </span>
            </div>
          </div>
        </div>

        {/* Cockpit Sub-Tab Navigation */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSubTab("consultation")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "consultation"
                ? "bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Consultation</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono ml-0.5">
              Q&A
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("classicalRemedies")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "classicalRemedies"
                ? "bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Classical Remedies (Upayas)</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono ml-0.5">
              Gem & Mantra
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("timingConvergence")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "timingConvergence"
                ? "bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>10-Dasha Timing Convergence</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono ml-0.5">
              10 Systems
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("yogas")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "yogas"
                ? "bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Planetary Yogas & Power</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono ml-0.5">
              {vedicData.yogas.length} Yogas
            </span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TAB CONTENT: INTERACTIVE CONSULTATION */}
      {activeSubTab === "consultation" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Chat Stream (Col 1 & 2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col h-[520px]">
              {/* Chat Header Actions */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-semibold text-slate-200">
                    Live Oracle Chamber · {effectiveName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyTranscript}
                    className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition-colors cursor-pointer"
                    title="Copy dialogue transcript"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTranscript}
                    className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition-colors cursor-pointer"
                    title="Download Consultation Markdown"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Dialogue Scroll Container */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1.5">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-slate-400">
                      <span>{m.sender === "user" ? effectiveName : "Acharya Celestia"}</span>
                      <span>·</span>
                      <span>{m.timestamp}</span>
                      {m.isAiGenerated && (
                        <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px]">
                          Gemini 3.8
                        </span>
                      )}
                    </div>

                    <div
                      className={`p-4 rounded-2xl max-w-[92%] sm:max-w-[85%] text-xs md:text-sm leading-relaxed space-y-2 ${
                        m.sender === "user"
                          ? "bg-amber-500/20 text-amber-100 border border-amber-500/30 rounded-tr-none"
                          : "bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-md font-sans"
                      }`}
                    >
                      {m.text.split("\n\n").map((para, idx) => {
                        if (para.startsWith("### ")) {
                          return (
                            <h4 key={idx} className="font-serif-celestial font-bold text-amber-300 text-sm md:text-base pt-1">
                              {para.replace("### ", "")}
                            </h4>
                          );
                        } else if (para.startsWith("#### ")) {
                          return (
                            <h5 key={idx} className="font-bold text-amber-400/90 text-xs md:text-sm pt-1">
                              {para.replace("#### ", "")}
                            </h5>
                          );
                        } else {
                          return <p key={idx}>{para}</p>;
                        }
                      })}
                    </div>
                  </div>
                ))}

                {isConsulting && (
                  <div className="flex items-start gap-3 p-4 bg-slate-900/70 border border-slate-800 rounded-2xl rounded-tl-none max-w-[85%] animate-pulse">
                    <div className="w-5 h-5 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin shrink-0" />
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-amber-300">
                        Acharya Celestia is consulting the 10-Dasha ephemeris...
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Calculating active house activations, planetary aspects, and classical remedial alignment.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendQuery()}
                  placeholder="Ask Acharya Celestia anything about your chart, dasha timing, or remedies..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleSendQuery()}
                  disabled={isConsulting || !inputQuery.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Consultation Sidebar (Col 3) */}
          <div className="space-y-4">
            {/* Exemplary Master Inquiries */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                Master Consultation Prompts
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Click any prompt to instantly query Acharya Celestia with full astrological context:
              </p>
              <div className="space-y-1.5">
                {masterInquiries.map((inquiry, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendQuery(inquiry)}
                    disabled={isConsulting}
                    className="w-full text-left p-2.5 bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-amber-200 rounded-xl border border-slate-800 hover:border-amber-500/30 text-xs transition-all leading-snug cursor-pointer disabled:opacity-50"
                  >
                    &ldquo;{inquiry}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Active Remedy Summary Card */}
            <div className="p-4 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Gem className="w-3.5 h-3.5 text-amber-400" />
                  Primary Upaya (Remedy)
                </span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                  {activeRemedyLord} Dasha
                </span>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Prescribed Gemstone</span>
                  <span className="text-slate-100 font-semibold">{activeRemedy.gem}</span>
                  <span className="text-[10px] text-slate-400 block">in {activeRemedy.metal} on {activeRemedy.finger}</span>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Sacred Beeja Mantra</span>
                  <span className="text-amber-300 font-mono text-[11px] font-bold block">{activeRemedy.beejaMantra}</span>
                  <span className="text-[10px] text-slate-400">{activeRemedy.recitations.toLocaleString()} recitations on {activeRemedy.fastingDay}s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB-TAB CONTENT: CLASSICAL REMEDIES (UPAYAS) */}
      {activeSubTab === "classicalRemedies" && (
        <div className="space-y-5">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Classical Vedic Upayas (Planetary Remediation Suite)
              </h3>
              <p className="text-xs text-slate-400">
                Prescriptions aligned with your active <strong>{currentMD?.planet} Mahadasha</strong> and <strong>{currentAD?.planet} Antardasha</strong> to harmonize malefic influences and magnify benefic grace.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
              Parashari Canonical Upayas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Gemstone (Ratna) */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Gem className="w-4 h-4 text-amber-400" />
                <span>Ratna (Gemstone Therapy)</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Primary Gemstone</span>
                  <p className="text-sm font-bold text-slate-100">{activeRemedy.gem}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Substitute (Uparatna)</span>
                  <p className="text-slate-300">{activeRemedy.subGem}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Auspicious Metal</span>
                    <span className="text-amber-200 font-semibold">{activeRemedy.metal}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Consecrated Finger</span>
                    <span className="text-amber-200 font-semibold">{activeRemedy.finger}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Mantra (Japa) */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Mantra (Vibrational Japa)</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Sanskrit Script</span>
                  <p className="text-sm font-serif-celestial font-bold text-amber-300">{activeRemedy.sanskritMantra}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Phonetic Beeja Mantra</span>
                  <p className="font-mono text-xs text-amber-200">{activeRemedy.beejaMantra}</p>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Total Canonical Japa:</span>
                  <span className="font-mono font-bold text-amber-300">{activeRemedy.recitations.toLocaleString()} counts</span>
                </div>
              </div>
            </div>

            {/* Card 3: Daan & Charity */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Daan (Charitable Offering)</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Items for Donation</span>
                  <p className="text-xs text-slate-200 leading-relaxed">{activeRemedy.charity}</p>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Optimal Day</span>
                  <p className="text-amber-200 font-semibold">{activeRemedy.fastingDay} mornings</p>
                </div>
              </div>
            </div>

            {/* Card 4: Vrata & Fasting */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Vrata (Fasting Protocol)</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Weekly Fasting Day</span>
                  <p className="text-sm font-bold text-purple-200">{activeRemedy.fastingDay}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Presiding Divinity</span>
                  <p className="text-xs text-slate-200">{activeRemedy.deity}</p>
                </div>
              </div>
            </div>

            {/* Card 5: Sacred Rudraksha Bead */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Rudraksha Shield</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Prescribed Mukhi</span>
                  <p className="text-sm font-bold text-amber-200">{activeRemedy.rudraksha}</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Consecrated with authentic Beeja Mantra prior to donning on a sacred Monday or {activeRemedy.fastingDay}.
                </p>
              </div>
            </div>

            {/* Card 6: Secondary Antardasha Remedy */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Antardasha Support ({currentAD?.planet})</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                {currentAD?.planet && PLANETARY_REMEDIES[currentAD.planet] ? (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Secondary Mantra</span>
                      <p className="font-mono text-xs text-blue-200">{PLANETARY_REMEDIES[currentAD.planet].beejaMantra}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Secondary Daan</span>
                      <p className="text-[11px] text-slate-300">{PLANETARY_REMEDIES[currentAD.planet].charity}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-400 text-xs">Antardasha lord harmonizes with Mahadasha discipline.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB CONTENT: 10-DASHA TIMING CONVERGENCE */}
      {activeSubTab === "timingConvergence" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                10-Dasha System Simultaneous Synthesis
              </h3>
              <p className="text-xs text-slate-400">
                Evaluation across all 10 Classical Vedic Dasha traditions running simultaneously for {effectiveName}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                10 Engines Synchronized
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dashaSystems.convergence.map((period, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-2 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{period.system}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize ${
                      period.tone === "positive"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : period.tone === "challenging"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {period.tone}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Active Lord / Sign:</span>
                    <span className="font-semibold text-amber-300">{period.lordOrSign}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Remaining Duration:</span>
                    <span className="font-mono text-slate-300 text-[11px]">{period.durationRemaining}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  {period.coreTheme}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SUB-TAB CONTENT: PLANETARY YOGAS */}
      {activeSubTab === "yogas" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Vedic Planetary Yogas ({vedicData.yogas.length} Formations Detected)
              </h3>
              <p className="text-xs text-slate-400">
                Classical Parashari and Jaimini special combinations shaping worldly status, intelligence, and fortune.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vedicData.yogas.map((yoga, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {yoga.name}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    Classical Yoga
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  {yoga.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
