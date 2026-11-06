"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { searchCities } from "@/lib/astronomy/cities";
import { resolveLocalDateTime } from "@/lib/astronomy/historicalTimezone";
import { parseBirthClockTime } from "@/lib/astronomy/timeInput";
import {
  Compass,
  MapPin,
  Clock,
  Calendar,
  Sparkles,
  Search,
  Crosshair,
  SlidersHorizontal,
  Globe,
  Loader2,
} from "lucide-react";

export interface BirthFormData {
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm
  isTimeUnknown: boolean;
  cityName: string;
  country: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number; // legacy/manual hours from UTC; automatic mode resolves date-specific offset
  ianaTimezone?: string;
  timezoneMode?: "automatic" | "manual";
  manualOffsetConfirmed?: boolean;
  selectedUtcInstant?: string;
  selectedUtcOffsetSeconds?: number;
  baziTimeBasis?: "civil-clock" | "local-mean-solar" | "local-apparent-solar";
  baziDayBoundaryPolicy?: "pure-zi" | "early-late-zi";
  houseSystem: "Placidus" | "Equal" | "WholeSign";
}

interface LocationOption {
  city: string;
  country: string;
  formatted: string;
  lat: number;
  lng: number;
  tz?: number;
  tzName?: string;
  ianaTimezone?: string;
  source?: "geoapify" | "built-in";
}

interface BirthFormProps {
  initialData: BirthFormData;
  onSubmit: (data: BirthFormData) => void;
  isLoading?: boolean;
}

export function BirthForm({ initialData, onSubmit, isLoading = false }: BirthFormProps) {
  const [formData, setFormData] = useState<BirthFormData>(() => ({
    ...initialData,
    timezoneMode: initialData.timezoneMode ?? (initialData.ianaTimezone ? "automatic" : "manual"),
    manualOffsetConfirmed: initialData.manualOffsetConfirmed ?? !initialData.ianaTimezone,
  }));
  const [citySearchQuery, setCitySearchQuery] = useState(
    initialData.cityName ? `${initialData.cityName}, ${initialData.country}` : ""
  );
  const [cityResults, setCityResults] = useState<LocationOption[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [showCustomCoords, setShowCustomCoords] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [timezoneError, setTimezoneError] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const timezoneResolution = useMemo(() => {
    if (formData.timezoneMode !== "automatic" || !formData.ianaTimezone) return null;
    const dateParts = formData.birthDate.split("-").map(Number);
    if (dateParts.length !== 3 || dateParts.some((value) => !Number.isInteger(value))) return null;
    const { hour, minute } = parseBirthClockTime(formData.birthTime);
    return resolveLocalDateTime({
      year: dateParts[0],
      month: dateParts[1],
      day: dateParts[2],
      hour,
      minute,
    }, formData.ianaTimezone);
  }, [formData.birthDate, formData.birthTime, formData.ianaTimezone, formData.timezoneMode, formData.isTimeUnknown]);

  useEffect(() => {
    if (timezoneResolution?.status !== "resolved") return;
    const candidate = timezoneResolution.candidates[0];
    if (!candidate) return;
    setFormData((previous) => {
      if (previous.timezoneMode !== "automatic" || previous.selectedUtcInstant === candidate.instant.toISOString()) return previous;
      return {
        ...previous,
        selectedUtcInstant: candidate.instant.toISOString(),
        selectedUtcOffsetSeconds: candidate.offsetSeconds,
        timezoneOffset: candidate.offsetSeconds / 3600,
      };
    });
  }, [timezoneResolution]);

  // Debounced search that queries Geoapify with fallback to built-in list
  const handleCitySearch = (query: string) => {
    setCitySearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setCityResults([]);
      setShowCityDropdown(false);
      setIsSearchingCity(false);
      return;
    }

    setIsSearchingCity(true);
    setShowCityDropdown(true);

    // Instant local match so typing e.g. "Saharanpur" shows immediately without waiting
    const immediateMatches: LocationOption[] = searchCities(query, 6).map((c) => ({
      city: c.city,
      country: c.country,
      formatted: c.state ? `${c.city}, ${c.state}, ${c.country}` : `${c.city}, ${c.country}`,
      lat: c.lat,
      lng: c.lng,
      tz: c.tz,
      ianaTimezone: c.ianaTimezone,
      source: "built-in",
    }));
    if (immediateMatches.length > 0) {
      setCityResults(immediateMatches);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setCityResults(data.results);
            setIsSearchingCity(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Geocode query failed, using built-in:", e);
      }

      // Built-in fallback
      const fallbacks: LocationOption[] = searchCities(query, 6).map((c) => ({
        city: c.city,
        country: c.country,
        formatted: `${c.city}, ${c.country}`,
        lat: c.lat,
        lng: c.lng,
        tz: c.tz,
        ianaTimezone: c.ianaTimezone,
        source: "built-in",
      }));
      setCityResults(fallbacks);
      setIsSearchingCity(false);
    }, 250);
  };

  const handleSelectCity = (c: LocationOption) => {
    setFormData((prev) => ({
      ...prev,
      cityName: c.city,
      country: c.country,
      latitude: c.lat,
      longitude: c.lng,
      timezoneOffset: c.tz ?? prev.timezoneOffset,
      ianaTimezone: c.ianaTimezone,
      timezoneMode: c.ianaTimezone ? "automatic" : "manual",
      manualOffsetConfirmed: false,
      selectedUtcInstant: undefined,
      selectedUtcOffsetSeconds: undefined,
    }));
    setTimezoneError("");
    setCitySearchQuery(c.formatted || `${c.city}, ${c.country}`);
    setShowCityDropdown(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setGpsLoading(true);
    setGpsError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Math.round(position.coords.latitude * 10000) / 10000;
        const lng = Math.round(position.coords.longitude * 10000) / 10000;
        let detectedCity = "Current Location";
        let detectedCountry = "GPS";
        let detectedTz: number | undefined;
        let detectedIanaTimezone: string | undefined;
        let formattedLabel = `GPS (${lat}°, ${lng}°)`;

        try {
          // Reverse geocode via Geoapify proxy
          const res = await fetch(`/api/geocode?lat=${lat}&lon=${lng}`);
          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              const r = data.results[0];
              detectedCity = r.city;
              detectedCountry = r.country;
              detectedTz = r.tz;
              detectedIanaTimezone = r.ianaTimezone;
              formattedLabel = r.formatted || `${r.city}, ${r.country}`;
            }
          }
        } catch (e) {
          console.warn("GPS reverse geocode error:", e);
        }

        setFormData((prev) => ({
          ...prev,
          cityName: detectedCity,
          country: detectedCountry,
          latitude: lat,
          longitude: lng,
          timezoneOffset: detectedTz ?? prev.timezoneOffset,
          ianaTimezone: detectedIanaTimezone,
          timezoneMode: detectedIanaTimezone ? "automatic" : "manual",
          manualOffsetConfirmed: false,
          selectedUtcInstant: undefined,
          selectedUtcOffsetSeconds: undefined,
        }));
        setTimezoneError("");
        setCitySearchQuery(formattedLabel);
        setGpsLoading(false);
        setShowCustomCoords(true);
      },
      (err) => {
        setGpsError(err.message || "Failed to retrieve location");
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const handleLoadSample = (sampleType: "einstein" | "daVinci" | "jung" | "newton") => {
    if (sampleType === "einstein") {
      const sample: BirthFormData = {
        fullName: "Albert Einstein",
        birthDate: "1879-03-14",
        birthTime: "11:30",
        isTimeUnknown: false,
        cityName: "Ulm",
        country: "Germany",
        latitude: 48.4011,
        longitude: 9.9876,
        timezoneOffset: 0.6658,
        ianaTimezone: "Europe/Berlin",
        timezoneMode: "manual",
        manualOffsetConfirmed: true,
        houseSystem: "Placidus",
      };
      setFormData(sample);
      setCitySearchQuery("Ulm, Baden-Württemberg, Germany");
      onSubmit(sample);
    } else if (sampleType === "daVinci") {
      const sample: BirthFormData = {
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
        houseSystem: "Placidus",
      };
      setFormData(sample);
      setCitySearchQuery("Vinci, Tuscany, Italy");
      onSubmit(sample);
    } else if (sampleType === "jung") {
      const sample: BirthFormData = {
        fullName: "Carl Gustav Jung",
        birthDate: "1875-07-26",
        birthTime: "19:32",
        isTimeUnknown: false,
        cityName: "Kesswil",
        country: "Switzerland",
        latitude: 47.6006,
        longitude: 9.3174,
        timezoneOffset: 1,
        ianaTimezone: "Europe/Zurich",
        timezoneMode: "manual",
        manualOffsetConfirmed: true,
        houseSystem: "Placidus",
      };
      setFormData(sample);
      setCitySearchQuery("Kesswil, Thurgau, Switzerland");
      onSubmit(sample);
    } else {
      const sample: BirthFormData = {
        fullName: "Isaac Newton",
        birthDate: "1643-01-04",
        birthTime: "01:30",
        isTimeUnknown: false,
        cityName: "Woolsthorpe",
        country: "United Kingdom",
        latitude: 52.8089,
        longitude: -0.6293,
        timezoneOffset: 0,
        ianaTimezone: "Europe/London",
        timezoneMode: "manual",
        manualOffsetConfirmed: true,
        houseSystem: "Placidus",
      };
      setFormData(sample);
      setCitySearchQuery("Woolsthorpe, Lincolnshire, UK");
      onSubmit(sample);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimezoneError("");
    if (formData.timezoneMode === "automatic") {
      if (!formData.ianaTimezone || !timezoneResolution) {
        setTimezoneError("An IANA timezone is required for automatic historical-time resolution. Select a supported city or use a confirmed manual offset.");
        return;
      }
      if (timezoneResolution.status === "nonexistent") {
        setTimezoneError("This local birth time did not occur in the selected timezone because the clock changed. Correct the time or explicitly use a manual offset.");
        return;
      }
      if (timezoneResolution.status === "unsupported") {
        setTimezoneError(timezoneResolution.reason || "This date/time cannot be reliably resolved by the current timezone database. Use a confirmed manual offset.");
        return;
      }
      if (timezoneResolution.status === "ambiguous") {
        const selected = timezoneResolution.candidates.find((candidate) => candidate.instant.toISOString() === formData.selectedUtcInstant);
        if (!selected) {
          setTimezoneError("This local time occurs twice. Select which UTC instant you mean before generating the chart.");
          return;
        }
        onSubmit({
          ...formData,
          selectedUtcInstant: selected.instant.toISOString(),
          selectedUtcOffsetSeconds: selected.offsetSeconds,
          timezoneOffset: selected.offsetSeconds / 3600,
        });
        return;
      }
      const resolved = timezoneResolution.candidates[0];
      if (!resolved) {
        setTimezoneError("The timezone resolver did not return a valid UTC candidate.");
        return;
      }
      onSubmit({
        ...formData,
        selectedUtcInstant: resolved.instant.toISOString(),
        selectedUtcOffsetSeconds: resolved.offsetSeconds,
        timezoneOffset: resolved.offsetSeconds / 3600,
      });
      return;
    }

    if (!formData.manualOffsetConfirmed) {
      setTimezoneError("Confirm that you are manually locking this UTC offset. It will not be labelled as historically verified.");
      return;
    }
    if (!Number.isFinite(formData.timezoneOffset) || formData.timezoneOffset < -14 || formData.timezoneOffset > 14) {
      setTimezoneError("Manual UTC offset must be between -14 and +14 hours.");
      return;
    }
    onSubmit({
      ...formData,
      selectedUtcInstant: undefined,
      selectedUtcOffsetSeconds: formData.timezoneOffset * 3600,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Full Birth Name
          </label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="e.g. Leonardo da Vinci"
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 transition-colors"
          />
          <p className="text-[11px] text-slate-400">Used for Pythagorean Destiny & Soul Urge cipher</p>
        </div>

        {/* Date of Birth */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Date of Birth
          </label>
          <input
            type="date"
            required
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value, selectedUtcInstant: undefined, selectedUtcOffsetSeconds: undefined })}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 transition-colors"
          />
          <p className="text-[11px] text-slate-400">Gregorian or Historical Date (1800-2100)</p>
        </div>

        {/* Time of Birth */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Time of Birth
            </label>
            <label className="text-[11px] text-slate-400 flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isTimeUnknown}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isTimeUnknown: e.target.checked,
                    birthTime: e.target.checked ? "12:00" : formData.birthTime,
                  })
                }
                className="w-3.5 h-3.5 rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-900"
              />
              Unknown
            </label>
          </div>
          <input
            type="time"
            disabled={formData.isTimeUnknown}
            value={formData.birthTime}
            onChange={(e) => setFormData({ ...formData, birthTime: e.target.value, selectedUtcInstant: undefined, selectedUtcOffsetSeconds: undefined })}
            className={`w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 transition-colors ${
              formData.isTimeUnknown ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
          <p className="text-[11px] text-slate-400">
            {formData.isTimeUnknown ? "Using Solar Noon standard" : "24-hour local standard time"}
          </p>
        </div>

        {/* Place of Birth / City Search */}
        <div className="space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Place of Birth
            </label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={gpsLoading}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              title="Detect coordinates via browser GPS"
            >
              <Crosshair className="w-3 h-3" />
              {gpsLoading ? "Locating..." : "Use GPS"}
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              required
              value={citySearchQuery}
              onChange={(e) => handleCitySearch(e.target.value)}
              onFocus={() => {
                if (citySearchQuery.trim() && cityResults.length > 0) {
                  setShowCityDropdown(true);
                }
              }}
              placeholder="Search any city, town or village (e.g. Mumbai, Vinci, Chicago)"
              className="w-full pl-9 pr-8 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            {isSearchingCity && (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin absolute right-3 top-3 pointer-events-none" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showCityDropdown && cityResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-slate-800 max-h-64 overflow-y-auto">
              {cityResults.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectCity(c)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-amber-500/10 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <span className="text-xs font-medium text-slate-200 block truncate">
                      {c.formatted || `${c.city}, ${c.country}`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {c.source === "geoapify" ? "Geoapify Verified" : "Built-in Ephemeris"}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-amber-400 font-mono block tabular-nums">
                      {c.lat > 0 ? `${c.lat.toFixed(2)}°N` : `${Math.abs(c.lat).toFixed(2)}°S`}, {c.lng > 0 ? `${c.lng.toFixed(2)}°E` : `${Math.abs(c.lng).toFixed(2)}°W`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {typeof c.tz === "number" ? `UTC${c.tz >= 0 ? "+" : ""}${c.tz}` : "Offset unavailable"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {gpsError && <p className="text-[11px] text-rose-400">{gpsError}</p>}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {formData.cityName
                ? `${formData.cityName} (${formData.latitude.toFixed(2)}°, ${formData.longitude.toFixed(2)}°) · UTC${formData.timezoneOffset >= 0 ? `+${formData.timezoneOffset}` : formData.timezoneOffset}`
                : "Worldwide town & village search"}
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Globe className="w-3 h-3" /> Geoapify Powered
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Coordinates & House System Drawer */}
      <div className="pt-1">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowCustomCoords(!showCustomCoords)}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            {showCustomCoords ? "Hide Coordinates & House System" : "Fine-tune Coordinates, Timezone & House System"}
          </button>

          {/* Example Profiles */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:inline">Historical Presets:</span>
            <button
              type="button"
              onClick={() => handleLoadSample("einstein")}
              className="text-amber-400/90 hover:text-amber-300 underline underline-offset-2 transition-colors font-medium"
              title="Albert Einstein (March 14, 1879, Ulm) - Swiss Ephemeris Accuracy Test"
            >
              Einstein
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleLoadSample("daVinci")}
              className="text-amber-400/90 hover:text-amber-300 underline underline-offset-2 transition-colors"
            >
              Da Vinci
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleLoadSample("jung")}
              className="text-amber-400/90 hover:text-amber-300 underline underline-offset-2 transition-colors"
            >
              C.G. Jung
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleLoadSample("newton")}
              className="text-amber-400/90 hover:text-amber-300 underline underline-offset-2 transition-colors"
            >
              Newton
            </button>
          </div>
        </div>

        <div className="mt-3 p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-200">Historical timezone resolution</p>
              <p className="text-[11px] text-slate-400">IANA timezone rules are applied to the selected birth date, not today's standard offset.</p>
            </div>
            <select
              aria-label="Timezone resolution mode"
              value={formData.timezoneMode ?? "manual"}
              onChange={(e) => {
                const mode = e.target.value as "automatic" | "manual";
                setFormData({
                  ...formData,
                  timezoneMode: mode,
                  manualOffsetConfirmed: mode === "manual" ? false : formData.manualOffsetConfirmed,
                  selectedUtcInstant: undefined,
                  selectedUtcOffsetSeconds: undefined,
                });
                setTimezoneError("");
              }}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-100"
            >
              <option value="automatic" disabled={!formData.ianaTimezone}>Automatic (IANA timezone)</option>
              <option value="manual">Manual UTC offset lock</option>
            </select>
          </div>
          {formData.timezoneMode === "automatic" ? (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-300">IANA zone: <span className="font-mono text-amber-300">{formData.ianaTimezone || "Not available"}</span></p>
              {timezoneResolution?.status === "resolved" && timezoneResolution.candidates[0] && (
                <p className="text-[11px] text-emerald-300">One database-resolved instant: {timezoneResolution.candidates[0].instant.toISOString()} · {timezoneResolution.candidates[0].offsetLabel}</p>
              )}
              {timezoneResolution?.status === "ambiguous" && (
                <div className="space-y-1">
                  <p className="text-[11px] text-amber-300">This local time occurs more than once. Choose the intended instant:</p>
                  <select
                    value={formData.selectedUtcInstant ?? ""}
                    onChange={(e) => {
                      const candidate = timezoneResolution.candidates.find((item) => item.instant.toISOString() === e.target.value);
                      setFormData({
                        ...formData,
                        selectedUtcInstant: candidate?.instant.toISOString(),
                        selectedUtcOffsetSeconds: candidate?.offsetSeconds,
                        timezoneOffset: candidate ? candidate.offsetSeconds / 3600 : formData.timezoneOffset,
                      });
                    }}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-100"
                  >
                    <option value="">Select UTC instant</option>
                    {timezoneResolution.candidates.map((candidate) => (
                      <option key={candidate.instant.toISOString()} value={candidate.instant.toISOString()}>
                        {candidate.instant.toISOString()} · {candidate.offsetLabel}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {timezoneResolution?.status === "nonexistent" && <p className="text-[11px] text-rose-300">This local clock time did not exist in this timezone. Change the time or choose a confirmed manual offset.</p>}
              {timezoneResolution?.status === "unsupported" && <p className="text-[11px] text-amber-300">{timezoneResolution.reason} Automatic resolution is unavailable.</p>}
              {!timezoneResolution && <p className="text-[11px] text-amber-300">Select a city with an IANA timezone and a valid birth date/time to resolve automatically.</p>}
              <p className="text-[10px] text-slate-500">“Database-resolved” means the current runtime's IANA/ICU database supplied the rule; it is not independent proof of every historical legal time.</p>
              {formData.isTimeUnknown && <p className="text-[11px] text-amber-300">Birth time is marked unknown; 12:00 is only a placeholder, not an observed birth time.</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-slate-300 block">Manual UTC offset (hours, east-positive)</label>
              <input
                type="number"
                step="any"
                min="-14"
                max="14"
                value={formData.timezoneOffset}
                onChange={(e) => setFormData({ ...formData, timezoneOffset: Number(e.target.value), manualOffsetConfirmed: false })}
                className="w-full max-w-xs px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-100 tabular-nums"
              />
              <label className="flex items-start gap-2 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={!!formData.manualOffsetConfirmed}
                  onChange={(e) => setFormData({ ...formData, manualOffsetConfirmed: e.target.checked })}
                  className="mt-0.5"
                />
                I am explicitly locking this numeric UTC offset. I understand it is user-supplied and not independently historically verified.
              </label>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">BaZi clock convention</label>
              <select
                value={formData.baziTimeBasis ?? "local-mean-solar"}
                onChange={(e) => setFormData({ ...formData, baziTimeBasis: e.target.value as BirthFormData["baziTimeBasis"] })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-100"
              >
                <option value="civil-clock">Civil clock time</option>
                <option value="local-mean-solar">Local mean solar time (LMST)</option>
                <option value="local-apparent-solar">Local apparent solar time (LAST)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Zi-hour day rollover</label>
              <select
                value={formData.baziDayBoundaryPolicy ?? "pure-zi"}
                onChange={(e) => setFormData({ ...formData, baziDayBoundaryPolicy: e.target.value as BirthFormData["baziDayBoundaryPolicy"] })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-100"
              >
                <option value="pure-zi">Pure Zi: day changes at 23:00</option>
                <option value="early-late-zi">Early/Late Zi: day changes at 00:00</option>
              </select>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">These are selectable calculation conventions, not a claim that one BaZi school is universally authoritative.</p>
          {timezoneError && <p role="alert" className="text-[11px] text-rose-300">{timezoneError}</p>}
        </div>

        {showCustomCoords && (
          <div className="mt-3 p-4 bg-slate-900/60 border border-slate-800 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-200">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Latitude (° Decimal)</label>
              <input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-100 tabular-nums focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Longitude (° Decimal)</label>
              <input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-100 tabular-nums focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">House System</label>
              <select
                value={formData.houseSystem}
                onChange={(e) => setFormData({ ...formData, houseSystem: e.target.value as BirthFormData["houseSystem"] })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="Placidus">Placidus (Time-Proportional)</option>
                <option value="WholeSign">Whole Sign (Classical Hellenistic)</option>
                <option value="Equal">Equal House (30° from Asc)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Submit Action */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm rounded-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Compass className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Calculating Planetary Coordinates..." : "Generate Multi-System Matrix"}
        </button>
      </div>
    </form>
  );
}
