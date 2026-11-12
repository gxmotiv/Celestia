"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  WesternChartData,
  calculateWesternChart,
} from "@/lib/astronomy/ephemeris";
import {
  SynastryEngine,
  CompositeChartEngine,
  DavisonChartEngine,
  SynastryReport,
  CompositeChart,
  DavisonChartResult,
  RelationshipCategory,
  GenderType,
} from "@/lib/astronomy/relationshipEngine";
import { calculateVedicChart, VedicChartData } from "@/lib/astronomy/vedic";
import { KundliMilanEngine, KundliMilanReport } from "@/lib/vedic/kundliMilanEngine";
import { MasterKundliMilanOrchestrator, MasterKundliReport } from "@/lib/vedic/masterKundliMilan";
import { VedicKundliMilanDashboard } from "@/components/VedicKundliMilanDashboard";
import { searchCities } from "@/lib/astronomy/cities";
import { parseBirthClockTime } from "@/lib/astronomy/timeInput";
import { resolveLocalDateTime } from "@/lib/astronomy/historicalTimezone";
import { swissEphemeris } from "@/lib/astronomy/swissEphemeris";
import {
  Heart,
  Users,
  Compass,
  Sparkles,
  Layers,
  Calendar,
  Flame,
  Shield,
  Zap,
  Info,
  ChevronRight,
  TrendingUp,
  Search,
  MapPin,
  Check,
  User,
  Clock,
  Briefcase,
  Smile,
  BookOpen,
  Eye,
  SlidersHorizontal,
  X,
  Shuffle,
} from "lucide-react";

interface RelationshipAstrologyViewProps {
  person1Chart: WesternChartData;
  person1Name: string;
  person1Date: string;
  person1Time: string;
  person1Lat: number;
  person1Lon: number;
  person1CityName?: string;
  person1Gender?: GenderType;
  person1TimezoneOffset?: number;
  person1UtcInstant?: string;
}

interface CityOption {
  city: string;
  country: string;
  state?: string;
  formatted: string;
  lat: number;
  lng: number;
  tz?: number;
  ianaTimezone?: string;
}

const RELATIONSHIP_CATEGORIES: {
  id: RelationshipCategory;
  label: string;
  shortLabel: string;
  icon: string;
  badgeColor: string;
  description: string;
}[] = [
  {
    id: "romantic",
    label: "Romantic Partner / Spouse",
    shortLabel: "Romantic",
    icon: "❤️",
    badgeColor: "border-rose-500/40 text-rose-300 bg-rose-500/10",
    description: "Chemistry, emotional intimacy, passion, and marriage longevity",
  },
  {
    id: "parent",
    label: "Parent (Mother / Father)",
    shortLabel: "Parent",
    icon: "👨‍👩‍👧",
    badgeColor: "border-amber-500/40 text-amber-300 bg-amber-500/10",
    description: "Maternal warmth, paternal guidance, generational roots, and ancestral lineage",
  },
  {
    id: "stepparent",
    label: "Step-Parent (Stepfather / Stepmother)",
    shortLabel: "Step-Parent",
    icon: "🌱",
    badgeColor: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
    description: "Blended family dynamics, earned mutual respect, household safety, and adult ally support",
  },
  {
    id: "child",
    label: "Child / Stepchild (Son / Daughter)",
    shortLabel: "Child",
    icon: "🐣",
    badgeColor: "border-teal-500/40 text-teal-300 bg-teal-500/10",
    description: "Parental holding, nurturing talent development, and encouraging authentic individuation",
  },
  {
    id: "sibling",
    label: "Sibling / Stepsibling (Brother / Sister)",
    shortLabel: "Sibling",
    icon: "👫",
    badgeColor: "border-sky-500/40 text-sky-300 bg-sky-500/10",
    description: "Shared childhood hearth, energetic banter, mutual defense, and lifelong camaraderie",
  },
  {
    id: "cousin",
    label: "Cousin / Extended Kinship",
    shortLabel: "Cousin",
    icon: "🌿",
    badgeColor: "border-indigo-500/40 text-indigo-300 bg-indigo-500/10",
    description: "Shared generational memories, kinship ties, and mutual encouragement",
  },
  {
    id: "relative",
    label: "Family Relative (Grandparent / Aunt / Uncle)",
    shortLabel: "Relative",
    icon: "🏡",
    badgeColor: "border-blue-500/40 text-blue-300 bg-blue-500/10",
    description: "Ancestral roots, domestic security, kinship duty, and family loyalty",
  },
  {
    id: "friend",
    label: "Friend / Best Friend / Companion",
    shortLabel: "Friend",
    icon: "🤝",
    badgeColor: "border-yellow-500/40 text-yellow-300 bg-yellow-500/10",
    description: "Intellectual rapport, mutual trust, laughter, and lifelong camaraderie",
  },
  {
    id: "colleague",
    label: "Colleague / Business Partner",
    shortLabel: "Colleague",
    icon: "💼",
    badgeColor: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
    description: "Strategic collaboration, fiduciary trust, execution drive, and ethics",
  },
  {
    id: "mentor",
    label: "Mentor / Teacher / Guide / Student",
    shortLabel: "Mentor",
    icon: "📚",
    badgeColor: "border-violet-500/40 text-violet-300 bg-violet-500/10",
    description: "Wisdom transmission, intellectual elevation, guidance, and legacy",
  },
  {
    id: "karmic",
    label: "Karmic-theme symbolism",
    shortLabel: "Karmic",
    icon: "🔮",
    badgeColor: "border-purple-500/40 text-purple-300 bg-purple-500/10",
    description: "Modern astrological symbolism around nodal contacts and themes of meaning; not evidence of past lives or destiny",
  },
  {
    id: "stranger",
    label: "Stranger / Random Encounter / Acquaintance",
    shortLabel: "Stranger / Random",
    icon: "⚡",
    badgeColor: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10",
    description: "Symbolic reflection on brief encounters and curiosity; not evidence that an encounter was fated",
  },
];

const GENDER_OPTIONS: { id: GenderType; label: string; icon: string }[] = [
  { id: "unspecified", label: "Unspecified", icon: "👤" },
  { id: "male", label: "Male (♂)", icon: "♂" },
  { id: "female", label: "Female (♀)", icon: "♀" },
  { id: "nonbinary", label: "Non-Binary (⚧)", icon: "⚧" },
];

const POPULAR_QUICK_CITIES: CityOption[] = [
  {
    city: "Saharanpur",
    state: "Uttar Pradesh",
    country: "India",
    formatted: "Saharanpur, Uttar Pradesh, India",
    lat: 29.964,
    lng: 77.546,
    tz: 5.5,
    ianaTimezone: "Asia/Kolkata",
  },
  {
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    formatted: "New Delhi, Delhi, India",
    lat: 28.6139,
    lng: 77.209,
    tz: 5.5,
    ianaTimezone: "Asia/Kolkata",
  },
  {
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    formatted: "Mumbai, Maharashtra, India",
    lat: 19.076,
    lng: 72.8777,
    tz: 5.5,
    ianaTimezone: "Asia/Kolkata",
  },
  {
    city: "London",
    country: "United Kingdom",
    formatted: "London, United Kingdom",
    lat: 51.5074,
    lng: -0.1278,
    tz: 0,
    ianaTimezone: "Europe/London",
  },
  {
    city: "New York",
    country: "United States",
    formatted: "New York, United States",
    lat: 40.7128,
    lng: -74.006,
    tz: -5,
    ianaTimezone: "America/New_York",
  },
  {
    city: "Tokyo",
    country: "Japan",
    formatted: "Tokyo, Japan",
    lat: 35.6762,
    lng: 139.6503,
    tz: 9,
    ianaTimezone: "Asia/Tokyo",
  },
  {
    city: "Florence",
    country: "Italy",
    formatted: "Florence, Italy",
    lat: 43.7696,
    lng: 11.2558,
    tz: 1,
    ianaTimezone: "Europe/Rome",
  },
];

export function RelationshipAstrologyView({
  person1Chart,
  person1Name,
  person1Date,
  person1Time,
  person1Lat,
  person1Lon,
  person1CityName = "Birth Location",
  person1Gender: initialP1Gender = "unspecified",
  person1TimezoneOffset = 0,
  person1UtcInstant,
}: RelationshipAstrologyViewProps) {
  // Person 1 State
  const [person1Gender, setPerson1Gender] = useState<GenderType>(initialP1Gender);

  // Relationship Type
  const [relationshipType, setRelationshipType] = useState<RelationshipCategory>("romantic");

  // Partner / Person 2 Configuration
  const [partnerProfile, setPartnerProfile] = useState<{
    name: string;
    gender: GenderType;
    birthDate: string;
    birthTime: string;
    cityName: string;
    latitude: number;
    longitude: number;
    timezoneOffset: number;
    ianaTimezone?: string;
    timezoneMode: "automatic" | "manual";
    manualOffsetConfirmed: boolean;
    selectedUtcInstant?: string;
  }>({
    name: "Partner / Relative / Friend",
    gender: "female",
    birthDate: "1994-06-15",
    birthTime: "10:30",
    cityName: "Saharanpur, Uttar Pradesh, India",
    latitude: 29.964,
    longitude: 77.546,
    timezoneOffset: 5.5,
    ianaTimezone: "Asia/Kolkata",
    timezoneMode: "automatic",
    manualOffsetConfirmed: false,
  });

  // UI States
  const [activeRelTab, setActiveRelTab] = useState<"synastry" | "composite" | "davison" | "vedic">("synastry");
  const [aspectFilter, setAspectFilter] = useState<string>("all");
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(true);
  const [showManualCoords, setShowManualCoords] = useState<boolean>(false);

  // City Search State
  const [cityQuery, setCityQuery] = useState<string>("");
  const [cityResults, setCityResults] = useState<CityOption[]>([]);
  const [isCitySearching, setIsCitySearching] = useState<boolean>(false);
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const partnerTimeResolution = useMemo(() => {
    if (partnerProfile.timezoneMode !== "automatic" || !partnerProfile.ianaTimezone) return null;
    const [year, month, day] = partnerProfile.birthDate.split("-").map(Number);
    if (![year, month, day].every(Number.isInteger)) return null;
    const { hour, minute } = parseBirthClockTime(partnerProfile.birthTime);
    return resolveLocalDateTime({ year, month, day, hour, minute }, partnerProfile.ianaTimezone);
  }, [partnerProfile.birthDate, partnerProfile.birthTime, partnerProfile.ianaTimezone, partnerProfile.timezoneMode]);

  const partnerResolvedCandidate = useMemo(() => {
    if (partnerTimeResolution?.status === "resolved") return partnerTimeResolution.candidates[0];
    if (partnerTimeResolution?.status === "ambiguous") {
      return partnerTimeResolution.candidates.find((candidate) => candidate.instant.toISOString() === partnerProfile.selectedUtcInstant);
    }
    return undefined;
  }, [partnerTimeResolution, partnerProfile.selectedUtcInstant]);

  const partnerUtcInstant = useMemo(() => {
    const [year, month, day] = partnerProfile.birthDate.split("-").map(Number);
    const { hour, minute } = parseBirthClockTime(partnerProfile.birthTime);
    if (partnerResolvedCandidate) return partnerResolvedCandidate.instant;
    return swissEphemeris.createUTCDate(year || 1994, month || 1, day || 1, hour, minute, 0,
      Number.isFinite(partnerProfile.timezoneOffset) ? partnerProfile.timezoneOffset : 0);
  }, [partnerProfile.birthDate, partnerProfile.birthTime, partnerProfile.timezoneOffset, partnerResolvedCandidate]);

  const partnerResolvedOffsetHours = partnerResolvedCandidate
    ? partnerResolvedCandidate.offsetSeconds / 3600
    : partnerProfile.timezoneOffset;

  const partnerTimezoneWarning = partnerProfile.timezoneMode === "automatic"
    ? partnerTimeResolution?.status === "nonexistent"
      ? "This local birth time did not occur in the selected IANA timezone. The partner chart currently falls back to the saved numeric offset."
      : partnerTimeResolution?.status === "ambiguous" && !partnerResolvedCandidate
        ? "This local time occurs twice. Select the intended UTC instant; until then the chart uses the saved numeric offset."
        : partnerTimeResolution?.status === "unsupported"
          ? (partnerTimeResolution.reason + " The partner chart uses the saved numeric offset until corrected.")
          : !partnerTimeResolution
            ? "Select a supported IANA timezone to resolve this local time."
            : "IANA/ICU database-resolved; historical rules still require independent verification."
    : partnerProfile.manualOffsetConfirmed
      ? "Using an explicitly user-confirmed manual UTC offset; not independently historically verified."
      : "Manual offset is not confirmed. The current partner chart is provisional.";

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle City Input & Search
  const handleCityInput = (val: string) => {
    setCityQuery(val);
    setShowCityDropdown(true);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!val.trim()) {
      setCityResults(POPULAR_QUICK_CITIES.slice(0, 5));
      setIsCitySearching(false);
      return;
    }

    // 1. Instant synchronous matching using built-in high-precision database
    const instantLocal: CityOption[] = searchCities(val, 6).map((c) => ({
      city: c.city,
      state: c.state,
      country: c.country,
      formatted: c.state ? `${c.city}, ${c.state}, ${c.country}` : `${c.city}, ${c.country}`,
      lat: c.lat,
      lng: c.lng,
      tz: c.tz,
      ianaTimezone: c.ianaTimezone,
    }));
    setCityResults(instantLocal);

    // 2. Debounced API fetch to geocode endpoint
    setIsCitySearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(val.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            const apiOpts: CityOption[] = data.results.map((r: any) => ({
              city: r.city,
              state: r.state,
              country: r.country,
              formatted: r.formatted || `${r.city}, ${r.country}`,
              lat: r.lat,
              lng: r.lng,
              tz: r.tz,
              ianaTimezone: r.ianaTimezone,
            }));

            // Merge avoiding duplicates
            const combined = [...apiOpts];
            for (const loc of instantLocal) {
              if (!combined.some((c) => c.city.toLowerCase() === loc.city.toLowerCase())) {
                combined.push(loc);
              }
            }
            setCityResults(combined);
          }
        }
      } catch (err) {
        // Fallback already populated
      } finally {
        setIsCitySearching(false);
      }
    }, 250);
  };

  // Select a city option
  const handleSelectCity = (opt: CityOption) => {
    setPartnerProfile((prev) => ({
      ...prev,
      cityName: opt.formatted,
      latitude: opt.lat,
      longitude: opt.lng,
      timezoneOffset: opt.tz ?? prev.timezoneOffset,
      ianaTimezone: opt.ianaTimezone,
      timezoneMode: opt.ianaTimezone ? "automatic" : "manual",
      manualOffsetConfirmed: false,
      selectedUtcInstant: undefined,
    }));
    setCityQuery("");
    setShowCityDropdown(false);
  };

  // Calculate Partner's Western Chart
  const partnerChart: WesternChartData = useMemo(() => {
    const [y, m, d] = partnerProfile.birthDate.split("-").map(Number);
    const { hour, minute } = parseBirthClockTime(partnerProfile.birthTime);
    return calculateWesternChart(
      y || 1994, m || 1, d || 1, hour, minute,
      partnerProfile.latitude, partnerProfile.longitude,
      partnerResolvedOffsetHours, "Placidus"
    );
  }, [partnerProfile, partnerResolvedOffsetHours]);

  // Synastry Engine
  const synastryReport: SynastryReport = useMemo(() => {
    const engine = new SynastryEngine(
      person1Chart,
      partnerChart,
      person1Name,
      partnerProfile.name,
      person1Gender,
      partnerProfile.gender,
      relationshipType
    );
    return engine.calculateCompleteSynastry();
  }, [
    person1Chart,
    partnerChart,
    person1Name,
    partnerProfile.name,
    person1Gender,
    partnerProfile.gender,
    relationshipType,
  ]);

  // Composite Chart Engine
  const compositeChart: CompositeChart = useMemo(() => {
    const engine = new CompositeChartEngine();
    return engine.calculateComposite(person1Chart, partnerChart, relationshipType);
  }, [person1Chart, partnerChart, relationshipType]);

  // Davison Relationship Chart Engine
  const davisonResult: DavisonChartResult = useMemo(() => {
    const engine = new DavisonChartEngine();
    return engine.calculateDavison(
      {
        birthDate: person1Date,
        birthTime: person1Time,
        latitude: person1Lat,
        longitude: person1Lon,
        timezoneOffset: person1TimezoneOffset,
      },
      {
        birthDate: partnerProfile.birthDate,
        birthTime: partnerProfile.birthTime,
        latitude: partnerProfile.latitude,
        longitude: partnerProfile.longitude,
        timezoneOffset: partnerResolvedOffsetHours,
      }
    );
  }, [person1Date, person1Time, person1Lat, person1Lon, person1TimezoneOffset, partnerProfile, partnerResolvedOffsetHours]);

  // Vedic Jyotish Charts & Kundli Milan Engine
  const person1VedicChart = useMemo(() => {
    try {
      const [p1Year, p1Month, p1Day] = person1Date.split("-").map(Number);
      const { hour: p1Hour, minute: p1Minute } = parseBirthClockTime(person1Time);
      const bDate = person1UtcInstant
        ? new Date(person1UtcInstant)
        : swissEphemeris.createUTCDate(p1Year, p1Month, p1Day, p1Hour, p1Minute, 0, person1TimezoneOffset);
      return calculateVedicChart(person1Chart, bDate);
    } catch (e) {
      console.error("Person 1 Vedic Chart Error", e);
      return null;
    }
  }, [person1Chart, person1Date, person1Time, person1UtcInstant, person1TimezoneOffset]);

  const partnerVedicChart = useMemo(() => {
    try {
      const bDate = partnerUtcInstant;
      return calculateVedicChart(partnerChart, bDate);
    } catch (e) {
      console.error("Partner Vedic Chart Error", e);
      return null;
    }
  }, [partnerChart, partnerUtcInstant]);

  const kundliMilanReport: KundliMilanReport | null = useMemo(() => {
    if (relationshipType !== "romantic" || !person1VedicChart || !partnerVedicChart) return null;
    try {
      return KundliMilanEngine.calculateMilan(
        person1VedicChart,
        partnerVedicChart,
        person1Name,
        partnerProfile.name,
        person1Gender,
        partnerProfile.gender
      );
    } catch (e) {
      console.error("Kundli Milan Error", e);
      return null;
    }
  }, [
    person1VedicChart,
    partnerVedicChart,
    person1Name,
    partnerProfile.name,
    person1Gender,
    partnerProfile.gender,
    relationshipType,
  ]);

  const masterKundliReport: MasterKundliReport | null = useMemo(() => {
    if (relationshipType !== "romantic" || !person1VedicChart || !partnerVedicChart) return null;
    try {
      return MasterKundliMilanOrchestrator.evaluateMaster(
        person1VedicChart,
        partnerVedicChart,
        person1Name,
        partnerProfile.name,
        person1Gender,
        partnerProfile.gender
      );
    } catch (e) {
      console.error("Master Kundli Milan Error", e);
      return null;
    }
  }, [
    person1VedicChart,
    partnerVedicChart,
    person1Name,
    partnerProfile.name,
    person1Gender,
    partnerProfile.gender,
    relationshipType,
  ]);

  // Filtered synastry aspects
  const filteredAspects = useMemo(() => {
    if (aspectFilter === "all") return synastryReport.interAspects;
    return synastryReport.interAspects.filter((a) => a.category === aspectFilter);
  }, [synastryReport.interAspects, aspectFilter]);

  // Current relationship info metadata
  const currentRelMeta = useMemo(() => {
    return (
      RELATIONSHIP_CATEGORIES.find((r) => r.id === relationshipType) ||
      RELATIONSHIP_CATEGORIES[0]
    );
  }, [relationshipType]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-xl space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentRelMeta.icon}</span>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Relationship &amp; Synastry Astrology Suite
            </h3>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${currentRelMeta.badgeColor}`}
            >
              {currentRelMeta.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing cross-chart celestial dynamics between{" "}
            <strong className="text-amber-300">
              {person1Name} ({person1Gender})
            </strong>{" "}
            and{" "}
            <strong className="text-rose-300">
              {partnerProfile.name} ({partnerProfile.gender})
            </strong>
          </p>
        </div>

        <p className="text-[11px] text-slate-400 bg-slate-950/50 border border-slate-800 rounded-lg p-3">Synastry, composite and Davison charts are astrological interpretation frameworks. Their labels, heuristic scores and karmic/soulmate themes are not scientific measures of compatibility, probability of success, destiny or past-life connection. Vedic Milan points are also tradition-specific rules, not a measured probability. Use these systems as prompts for reflection and communication, not as decision rules for relationships.</p>

      {/* View Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "synastry", label: "Synastry & Affinity", icon: "⚯" },
            { id: "vedic", label: "Master Vedic Kundli Milan", icon: "🕉️" },
            { id: "composite", label: "Composite Midpoint Chart", icon: "⊕" },
            { id: "davison", label: "Davison Time-Space Chart", icon: "⏳" },
          ].filter((tab) => tab.id !== "vedic" || relationshipType === "romantic").map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveRelTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRelTab === tab.id
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                  : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <span className="font-mono text-rose-400">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}

          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 cursor-pointer transition-colors ${
              showConfigDrawer
                ? "bg-slate-800 text-slate-200 border-slate-700"
                : "bg-slate-950/80 text-slate-400 hover:text-slate-200 border-slate-800"
            }`}
            title="Toggle Partner & Relationship Settings"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* RELATIONSHIP & PARTNER CONFIGURATION DRAWER */}
      {showConfigDrawer && (
        <div className="p-4 sm:p-5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-4 shadow-inner">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Relationship Context &amp; Persona Profiles
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Customize connection type, genders, and birth details for tailored readings
            </span>
          </div>

          {/* 1. Relationship Category Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
              <span>Select Relationship Nature:</span>
              <span className="text-[10px] text-slate-400 italic">
                {currentRelMeta.description}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {RELATIONSHIP_CATEGORIES.map((cat) => {
                const isSelected = relationshipType === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setRelationshipType(cat.id);
                      if (cat.id !== "romantic" && activeRelTab === "vedic") setActiveRelTab("synastry");
                    }}
                    className={`p-2 rounded-lg text-left transition-all flex flex-col justify-between border cursor-pointer ${
                      isSelected
                        ? "bg-rose-500/20 border-rose-500/50 shadow-sm"
                        : "bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span
                      className={`text-xs font-semibold mt-1 leading-tight ${
                        isSelected ? "text-rose-200" : "text-slate-300"
                      }`}
                    >
                      {cat.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Person 1 & Partner Profiles Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            {/* Person 1 Box */}
            <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Person 1: {person1Name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {person1Date} · {person1Time}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] text-slate-400">Gender Identity:</label>
                <div className="flex items-center gap-1">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setPerson1Gender(g.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                        person1Gender === g.id
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                <MapPin className="w-3 h-3 text-amber-400/80" />
                <span>
                  {person1CityName} ({person1Lat.toFixed(2)}°, {person1Lon.toFixed(2)}°)
                </span>
              </div>
            </div>

            {/* Partner / Person 2 Input Box */}
            <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  Person 2 ({currentRelMeta.shortLabel}) Profile
                </span>
                <span className="text-[10px] text-slate-400">
                  Target of comparison
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Name / Label</label>
                  <input
                    type="text"
                    value={partnerProfile.name}
                    onChange={(e) =>
                      setPartnerProfile({ ...partnerProfile, name: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-rose-500/50"
                    placeholder="Partner, Cousin, Friend name..."
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Gender</label>
                  <select
                    value={partnerProfile.gender}
                    onChange={(e) =>
                      setPartnerProfile({
                        ...partnerProfile,
                        gender: e.target.value as GenderType,
                      })
                    }
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-rose-500/50 cursor-pointer"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Birth Date</label>
                  <input
                    type="date"
                    value={partnerProfile.birthDate}
                    onChange={(e) =>
                      setPartnerProfile({ ...partnerProfile, birthDate: e.target.value, selectedUtcInstant: undefined })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-rose-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Birth Time</label>
                  <input
                    type="time"
                    value={partnerProfile.birthTime}
                    onChange={(e) =>
                      setPartnerProfile({ ...partnerProfile, birthTime: e.target.value, selectedUtcInstant: undefined })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-rose-500/50"
                  />
                </div>
              </div>

              {/* Place of Birth with Search & Autocomplete */}
              <div className="space-y-1.5 relative" ref={dropdownRef}>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    Place of Birth (City Search):
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManualCoords(!showManualCoords)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                  >
                    {showManualCoords ? "Hide Coordinates" : "Edit Coordinates / TZ"}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={cityQuery || partnerProfile.cityName}
                    onFocus={() => {
                      if (!cityQuery) {
                        setCityResults(POPULAR_QUICK_CITIES);
                        setShowCityDropdown(true);
                      }
                    }}
                    onChange={(e) => handleCityInput(e.target.value)}
                    placeholder="Search city (e.g., Saharanpur, New Delhi, London, New York)..."
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 text-xs focus:outline-none focus:border-rose-500/50"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  {isCitySearching && (
                    <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin absolute right-2.5 top-2.5" />
                  )}
                  {cityQuery && !isCitySearching && (
                    <button
                      type="button"
                      onClick={() => {
                        setCityQuery("");
                        setShowCityDropdown(false);
                      }}
                      className="absolute right-2 top-2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {showCityDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700/80 rounded-lg shadow-2xl z-50 max-h-56 overflow-y-auto">
                    <div className="p-1.5 text-[10px] font-semibold text-slate-400 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                      <span>Select Location Match</span>
                      <span>Verified Ephemeris Coordinates</span>
                    </div>

                    {cityResults.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">
                        No matches found. Try typing another city or enter coordinates manually below.
                      </div>
                    ) : (
                      cityResults.map((opt, i) => (
                        <button
                          key={`${opt.city}-${opt.country}-${i}`}
                          type="button"
                          onClick={() => handleSelectCity(opt)}
                          className="w-full px-3 py-2 text-left hover:bg-rose-500/15 border-b border-slate-800/60 last:border-0 flex items-center justify-between text-xs text-slate-200 cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="font-semibold text-slate-100 group-hover:text-rose-200">
                                {opt.city}
                                {opt.state ? `, ${opt.state}` : ""}
                              </div>
                              <div className="text-[10px] text-slate-400">{opt.country}</div>
                            </div>
                          </div>
                          <div className="text-right font-mono text-[10px] text-slate-400">
                            <div>
                              {opt.lat > 0 ? `${opt.lat.toFixed(2)}°N` : `${Math.abs(opt.lat).toFixed(2)}°S`},{" "}
                              {opt.lng > 0 ? `${opt.lng.toFixed(2)}°E` : `${Math.abs(opt.lng).toFixed(2)}°W`}
                            </div>
                            <div className="text-amber-400/90">
                              {typeof opt.tz === "number" ? `UTC ${opt.tz >= 0 ? "+" : ""}${opt.tz}h` : "Timezone unavailable"}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Quick City Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-slate-500">Quick:</span>
                  {POPULAR_QUICK_CITIES.map((qc) => (
                    <button
                      key={qc.city}
                      type="button"
                      onClick={() => handleSelectCity(qc)}
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-rose-300 hover:border-rose-500/40 cursor-pointer transition-colors"
                    >
                      {qc.city}
                    </button>
                  ))}
                </div>

                {/* Manual Coordinates Drawer (Optional) */}
                {showManualCoords && (
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg grid grid-cols-3 gap-2 text-[11px] mt-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Latitude (°)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={partnerProfile.latitude}
                        onChange={(e) =>
                          setPartnerProfile({
                            ...partnerProfile,
                            latitude: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Longitude (°)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={partnerProfile.longitude}
                        onChange={(e) =>
                          setPartnerProfile({
                            ...partnerProfile,
                            longitude: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Manual UTC Offset (h)</label>
                      <input
                        type="number"
                        step="any"
                        min="-14"
                        max="14"
                        value={partnerProfile.timezoneOffset}
                        onChange={(e) =>
                          setPartnerProfile({
                            ...partnerProfile,
                            timezoneMode: "manual",
                            timezoneOffset: Number(e.target.value),
                            manualOffsetConfirmed: false,
                          })
                        }
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-slate-300">Historical timezone handling</span>
                    <select
                      value={partnerProfile.timezoneMode}
                      onChange={(e) => setPartnerProfile({
                        ...partnerProfile,
                        timezoneMode: e.target.value as "automatic" | "manual",
                        manualOffsetConfirmed: false,
                        selectedUtcInstant: undefined,
                      })}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-200"
                    >
                      <option value="automatic" disabled={!partnerProfile.ianaTimezone}>Automatic IANA zone</option>
                      <option value="manual">Manual UTC offset</option>
                    </select>
                  </div>
                  {partnerProfile.timezoneMode === "automatic" ? (
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400">IANA zone: <span className="font-mono text-amber-300">{partnerProfile.ianaTimezone || "Unavailable"}</span></p>
                      {partnerTimeResolution?.status === "resolved" && partnerTimeResolution.candidates[0] && (
                        <p className="text-[10px] text-emerald-300">Resolved: {partnerTimeResolution.candidates[0].instant.toISOString()} · {partnerTimeResolution.candidates[0].offsetLabel}</p>
                      )}
                      {partnerTimeResolution?.status === "ambiguous" && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-amber-300">This local time occurs twice. Select the intended UTC instant:</p>
                          <select
                            value={partnerProfile.selectedUtcInstant ?? ""}
                            onChange={(e) => setPartnerProfile({ ...partnerProfile, selectedUtcInstant: e.target.value || undefined })}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-200"
                          >
                            <option value="">Choose UTC instant</option>
                            {partnerTimeResolution.candidates.map((candidate) => (
                              <option key={candidate.instant.toISOString()} value={candidate.instant.toISOString()}>
                                {candidate.instant.toISOString()} · {candidate.offsetLabel}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {partnerTimeResolution?.status === "nonexistent" && <p className="text-[10px] text-rose-300">This local clock time did not exist in this timezone.</p>}
                      {partnerTimeResolution?.status === "unsupported" && <p className="text-[10px] text-amber-300">{partnerTimeResolution.reason}</p>}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400">The manual offset is user-supplied, not historically verified.</p>
                      <label className="flex items-center gap-2 text-[10px] text-slate-300">
                        <input
                          type="checkbox"
                          checked={partnerProfile.manualOffsetConfirmed}
                          onChange={(e) => setPartnerProfile({ ...partnerProfile, manualOffsetConfirmed: e.target.checked })}
                        />
                        Confirm manual offset lock
                      </label>
                    </div>
                  )}
                  <p className="text-[10px] text-amber-300">{partnerTimezoneWarning}</p>
                </div>

                {/* Active Selected Location Confirmation Pill */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-950/40 px-2 py-1 rounded border border-slate-800/60 font-mono">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Check className="w-3 h-3 text-emerald-400" />
                    {partnerProfile.cityName}
                  </span>
                  <span>
                    {partnerProfile.latitude.toFixed(2)}°N, {partnerProfile.longitude.toFixed(2)}°E · UTC
                    {partnerResolvedOffsetHours >= 0
                      ? `+${partnerResolvedOffsetHours}`
                      : partnerResolvedOffsetHours}
                    h
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RELATIONSHIP CONTEXT INTRO BANNER */}
      <div className="p-4 bg-gradient-to-r from-rose-950/30 via-slate-950/60 to-purple-950/30 border border-rose-500/20 rounded-xl flex items-start gap-3">
        <span className="text-2xl pt-0.5">{currentRelMeta.icon}</span>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              {currentRelMeta.label} Astrological Matrix
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 font-semibold">
              {synastryReport.scores.verdict}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {synastryReport.scores.relationshipContextSummary}
          </p>
        </div>
      </div>

      {/* 1. SYNASTRY VIEW */}
      {activeRelTab === "synastry" && (
        <div className="space-y-6">
          {/* Quick Vedic Milan Compatibility Callout Banner */}
          {kundliMilanReport && (
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border border-amber-500/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🕉️</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-amber-300">
                      Vedic Ashtakoota Milan: {kundliMilanReport.totalGunas} / 36 Gunas ({kundliMilanReport.percentage}%)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-200 border border-amber-500/40">
                      Grade: {kundliMilanReport.verdictGrade} • {kundliMilanReport.verdict.split(" ")[0]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Manglik: {kundliMilanReport.manglikAnalysis.mutualCancellation ? "Cancelled (Mutual)" : kundliMilanReport.manglikAnalysis.person1.isCancelled || kundliMilanReport.manglikAnalysis.person2.isCancelled ? "Cancelled" : kundliMilanReport.manglikAnalysis.person1.isManglik || kundliMilanReport.manglikAnalysis.person2.isManglik ? "Active (Remedies Advised)" : "Non-Manglik"} • Navamsa D9: {kundliMilanReport.navamsaSynergy.soulConnectionLevel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveRelTab("vedic")}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/50 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <span>Open Vedic Milan (36 Gunas)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <p className="text-[11px] text-slate-400 bg-slate-950/50 border border-slate-800 rounded-lg p-3">These values are a hand-designed astrology index, not a compatibility probability, psychometric test or measured relationship outcome. Each dimension starts at 70 and is adjusted by selected planetary aspects, aspect type and orb using fixed heuristic weights. They are symbolic prompts only, not a basis for deciding whether a relationship is suitable.</p>

          {/* Compatibility Radar Scores */}
          <div className="p-4 sm:p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest block">
                  Tailored {currentRelMeta.shortLabel} Affinity Dimensions
                </span>
                <h4 className="text-sm font-bold text-slate-100">{synastryReport.scores.verdict}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold font-mono text-rose-400">
                  {synastryReport.scores.overall}
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  Weighted astrology index<br />(25–99 heuristic points)
                </span>
              </div>
            </div>

            {/* Dynamic Dimensions Tailored to Relationship Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
              {synastryReport.scores.dimensions.map((dim) => (
                <div
                  key={dim.key}
                  className="p-3 bg-slate-900 border border-slate-800/80 rounded-lg space-y-1.5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-medium truncate" title={dim.label}>
                      {dim.label}
                    </span>
                    <span className="font-mono font-bold text-slate-100">{dim.val}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${dim.color}`} style={{ width: `${(dim.val / 99) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                    {dim.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Karmic & Soulmate Indicators */}
          {(synastryReport.karmicConnections.length > 0 || synastryReport.soulmateIndicators.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2">
                <h5 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Traditional karmic-theme markers ({synastryReport.karmicConnections.length})
                </h5>
                <div className="space-y-1.5">
                  {synastryReport.karmicConnections.map((k, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-purple-400 font-bold">·</span>
                      <div>
                        <strong>[{k.intensity}]</strong> {k.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-2">
                <h5 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  Selected synastry markers ({synastryReport.soulmateIndicators.length})
                </h5>
                <div className="space-y-1.5">
                  {synastryReport.soulmateIndicators.map((s, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">✦</span>
                      <span>{s}</span>
                    </div>
                  ))}
                  {synastryReport.soulmateIndicators.length === 0 && (
                    <p className="text-xs text-slate-400">
                      No entries for the currently selected nodal and Sun–Moon marker rules.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Inter-Chart Aspects Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h5 className="text-xs font-bold text-slate-200">
                Inter-Chart Planetary Aspects ({synastryReport.interAspects.length} total)
              </h5>

              {/* Filter pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[11px]">
                {[
                  { id: "all", label: "All Aspects" },
                  { id: "Romance & Chemistry", label: "Chemistry & Spark" },
                  { id: "Emotional & Safety", label: "Emotional Safety" },
                  { id: "Commitment & Longevity", label: "Commitment & Duty" },
                  { id: "Growth & Purpose", label: "Growth & Purpose" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setAspectFilter(f.id)}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      aspectFilter === f.id
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold"
                        : "text-slate-400 hover:text-slate-200 bg-slate-950/40"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredAspects.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-950/40 rounded-lg">
                  No aspects found under this specific filter. Switch to &quot;All Aspects&quot; to view complete contacts.
                </div>
              ) : (
                filteredAspects.map((asp, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-rose-400">
                          {asp.symbol1} {asp.symbol} {asp.symbol2}
                        </span>
                        <h6 className="text-xs font-bold text-slate-100">
                          {person1Name}&apos;s {asp.planet1} {asp.aspectName} {partnerProfile.name}&apos;s {asp.planet2}
                        </h6>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {asp.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-slate-400">Orb: {asp.orb}°</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            asp.nature === "Harmonious"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : asp.nature === "Challenging"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                          }`}
                        >
                          {asp.nature} · interpretive weight {asp.score}/10
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pt-0.5">{asp.description}</p>
                    <div className="text-[11px] text-amber-300/90 pt-1 border-t border-slate-800/80">
                      <strong>Dynamic Insight:</strong> {asp.advice}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* House Overlays Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <h5 className="text-xs font-bold text-amber-300">
                {person1Name}&apos;s Planets in {partnerProfile.name}&apos;s Houses
              </h5>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {synastryReport.p1InP2Houses.map((h, i) => (
                  <div key={i} className="text-xs text-slate-300 p-2 bg-slate-900/60 rounded border border-slate-800/60">
                    {h.interpretation}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <h5 className="text-xs font-bold text-rose-300">
                {partnerProfile.name}&apos;s Planets in {person1Name}&apos;s Houses
              </h5>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {synastryReport.p2InP1Houses.map((h, i) => (
                  <div key={i} className="text-xs text-slate-300 p-2 bg-slate-900/60 rounded border border-slate-800/60">
                    {h.interpretation}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. COMPOSITE CHART VIEW */}
      {activeRelTab === "composite" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                The Composite Third Entity (Planetary Midpoints)
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Context: {currentRelMeta.label}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {compositeChart.relationshipPurpose}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {compositeChart.planets.map((p) => (
              <div key={p.name} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="text-amber-400 font-mono">{p.symbol}</span>
                    Composite {p.name}
                  </span>
                  <span className="text-xs font-mono text-amber-300">{p.signDegreeFormatted}</span>
                </div>
                <div className="text-[10px] text-slate-400">House {p.house} ({p.sign})</div>
                <p className="text-[11px] text-slate-300 leading-relaxed pt-1">{p.interpretation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. DAVISON CHART VIEW */}
      {activeRelTab === "davison" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-400" />
                Davison Time-Space Midpoint Incarnation
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-slate-300">
                  UTC: <strong className="text-rose-300">{davisonResult.midpointDate}</strong>
                </span>
                {davisonResult.midpointLmt && (
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-slate-300">
                    LMT: <strong className="text-amber-300">{davisonResult.midpointLmt}</strong>
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {davisonResult.interpretation}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800/80">
              <span>
                Terrestrial Geographic Node: <strong className="text-slate-200">{davisonResult.midpointLocation.label}</strong> ({davisonResult.midpointLocation.latitude.toFixed(2)}°, {davisonResult.midpointLocation.longitude.toFixed(2)}°)
              </span>
              <span className="text-[10px] text-slate-400">
                Shortest-Arc Longitude Midpoint • Standard Mean Latitude
              </span>
            </div>
          </div>

          {/* Davison Planets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {davisonResult.chartData.planets.map((p) => (
              <div key={p.name} className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <span className="text-rose-400 font-mono">{p.symbol}</span>
                  {p.name}
                </span>
                <span className="font-mono text-slate-300 text-[11px]">{p.signDegreeFormatted}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MASTER VEDIC KUNDLI MILAN VIEW */}
      {relationshipType === "romantic" && activeRelTab === "vedic" && (
        <VedicKundliMilanDashboard
          masterReport={masterKundliReport}
          milanReport={kundliMilanReport}
        />
      )}
    </div>
  );
}
