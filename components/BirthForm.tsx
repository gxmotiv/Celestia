"use client";

import React, { useState, useEffect, useRef } from "react";
import { GLOBAL_CITIES, CityData, searchCities } from "@/lib/astronomy/cities";
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
  timezoneOffset: number; // hours from UTC
  houseSystem: "Placidus" | "Equal" | "WholeSign";
}

interface LocationOption {
  city: string;
  country: string;
  formatted: string;
  lat: number;
  lng: number;
  tz: number;
  tzName?: string;
  source?: "geoapify" | "built-in";
}

interface BirthFormProps {
  initialData: BirthFormData;
  onSubmit: (data: BirthFormData) => void;
  isLoading?: boolean;
}

export function BirthForm({ initialData, onSubmit, isLoading = false }: BirthFormProps) {
  const [formData, setFormData] = useState<BirthFormData>(initialData);
  const [citySearchQuery, setCitySearchQuery] = useState(
    initialData.cityName ? `${initialData.cityName}, ${initialData.country}` : ""
  );
  const [cityResults, setCityResults] = useState<LocationOption[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [showCustomCoords, setShowCustomCoords] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      timezoneOffset: c.tz,
    }));
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
        let detectedTz = -new Date().getTimezoneOffset() / 60;
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
          timezoneOffset: detectedTz,
        }));
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
        houseSystem: "Placidus",
      };
      setFormData(sample);
      setCitySearchQuery("Woolsthorpe, Lincolnshire, UK");
      onSubmit(sample);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
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
                      UTC{c.tz >= 0 ? `+${Math.floor(c.tz)}:${((c.tz % 1) * 60).toString().padStart(2, "0")}` : `${Math.floor(c.tz)}:${(Math.abs(c.tz % 1) * 60).toString().padStart(2, "0")}`}
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
              <label className="text-[11px] font-medium text-slate-400 block mb-1">UTC Offset (Hours)</label>
              <input
                type="number"
                step="0.25"
                value={formData.timezoneOffset}
                onChange={(e) => setFormData({ ...formData, timezoneOffset: parseFloat(e.target.value) || 0 })}
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
