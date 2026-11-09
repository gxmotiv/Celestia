import { NextRequest, NextResponse } from "next/server";
import { searchCities, GLOBAL_CITIES, CityData } from "@/lib/astronomy/cities";

export interface GeocodeResult {
  city: string;
  country: string;
  formatted: string;
  lat: number;
  lng: number;
  tz?: number; // Provider standard offset only; not date-specific
  tzName?: string;
  ianaTimezone?: string;
  source: "geoapify" | "built-in";
}

function parseCoordinate(value: string | null): number | null {
  if (value === null) return null;
  const trimmed = value.trim();
  // Permit ordinary decimal/scientific notation, but not hex, suffixes, or blank values.
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\\d+)?$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Calculates great-circle distance between two coordinates in kilometers (Haversine formula).
 */
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest city in the offline dataset if within proximityThresholdKm.
 * Returns null if no offline city is sufficiently close.
 */
function findNearestOfflineCity(lat: number, lon: number, proximityThresholdKm = 50): CityData | null {
  let nearest: CityData | null = null;
  let minDistance = Infinity;

  for (const city of GLOBAL_CITIES) {
    const dist = haversineDistanceKm(lat, lon, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = city;
    }
  }

  if (nearest && minDistance <= proximityThresholdKm) {
    return nearest;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");

  // Read Geoapify key exclusively from environment variable with NO literal fallback
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim() || "";

  // Reverse geocoding requires both coordinates; a partial pair is never
  // reinterpreted as a forward city search.
  if ((latStr === null) !== (lonStr === null)) {
    return NextResponse.json({ error: "Both latitude and longitude are required" }, { status: 400 });
  }

  // Reverse Geocoding (e.g. from GPS)
  if (latStr !== null && lonStr !== null) {
    const lat = parseCoordinate(latStr);
    const lon = parseCoordinate(lonStr);

    if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    // 1. If API key is configured, query Geoapify reverse geocoding
    if (apiKey) {
      try {
        const geoUrl = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        let res: Response;
        try {
          res = await fetch(geoUrl, {
            signal: controller.signal,
            next: { revalidate: 3600 },
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (res.ok) {
          const data = await res.json();
          if (data?.features && Array.isArray(data.features) && data.features.length > 0) {
            const props = data.features[0].properties;
            if (props) {
              const city =
                props.city ||
                props.town ||
                props.village ||
                props.county ||
                props.name ||
                "Detected Location";
              const country = props.country || "";
              const formatted = props.formatted || `${city}, ${country}`;

              let tzOffsetHours: number | undefined;
              const tzName = typeof props.timezone?.name === "string" ? props.timezone.name : "";
              if (typeof props.timezone?.offset_STD_seconds === "number") {
                tzOffsetHours = props.timezone.offset_STD_seconds / 3600;
              }

              const result: GeocodeResult = {
                city,
                country,
                formatted,
                lat: Math.round(lat * 10000) / 10000,
                lng: Math.round(lon * 10000) / 10000,
                ...(tzOffsetHours !== undefined ? { tz: tzOffsetHours } : {}),
                tzName,
                ianaTimezone: tzName || undefined,
                source: "geoapify",
              };
              return NextResponse.json({ results: [result] });
            }
          }
        } else {
          console.warn(`Geoapify reverse geocode HTTP status: ${res.status}`);
        }
      } catch (e) {
        console.warn("Geoapify reverse geocode failed or timed out:", e instanceof Error ? e.message : "Network error");
      }
    }

    // 2. Offline fallback: genuinely resolve if coordinates are near a known city in the offline dataset (<= 50km)
    const matchedCity = findNearestOfflineCity(lat, lon, 50);
    if (matchedCity) {
      const result: GeocodeResult = {
        city: matchedCity.city,
        country: matchedCity.country,
        formatted: matchedCity.state
          ? `${matchedCity.city}, ${matchedCity.state}, ${matchedCity.country}`
          : `${matchedCity.city}, ${matchedCity.country}`,
        lat: matchedCity.lat,
        lng: matchedCity.lng,
        tz: matchedCity.tz,
        ianaTimezone: matchedCity.ianaTimezone,
        source: "built-in",
      };
      return NextResponse.json({ results: [result] });
    }

    // 3. When offline data cannot resolve coordinates and external lookup is unavailable/failed,
    // return empty results list consistent with API contract. Do not fabricate locations or claim success.
    return NextResponse.json({ results: [] });
  }

  // Forward Autocomplete Geocoding
  if (!q || !q.trim()) {
    // Return top built-in major cities if query is blank
    const fallbackList = searchCities("", 6).map((c) => ({
      city: c.city,
      country: c.country,
      formatted: `${c.city}, ${c.country}`,
      lat: c.lat,
      lng: c.lng,
      tz: c.tz,
      ianaTimezone: c.ianaTimezone,
      source: "built-in" as const,
    }));
    return NextResponse.json({ results: fallbackList });
  }

  const queryTrimmed = q.trim();
  if (queryTrimmed.length > 160) {
    return NextResponse.json({ error: "Query is too long (maximum 160 characters)." }, { status: 400 });
  }
  const lowerQ = queryTrimmed.toLowerCase();

  // 1. Get high-relevance built-in matches first
  const builtInMatches: GeocodeResult[] = searchCities(queryTrimmed, 6).map((c) => ({
    city: c.city,
    country: c.country,
    formatted: c.state ? `${c.city}, ${c.state}, ${c.country}` : `${c.city}, ${c.country}`,
    lat: c.lat,
    lng: c.lng,
    tz: c.tz,
    ianaTimezone: c.ianaTimezone,
    source: "built-in",
  }));

  // If there's an exact or direct prefix match on city name, prioritize it
  const exactOrPrefixBuiltIn = builtInMatches.filter(
    (b) => b.city.toLowerCase() === lowerQ || b.city.toLowerCase().startsWith(lowerQ)
  );

  let externalResults: GeocodeResult[] = [];

  // Only query external provider if an API key is configured
  if (apiKey) {
    try {
      const geoUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        queryTrimmed
      )}&apiKey=${apiKey}&limit=8`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      let res: Response;
      try {
        res = await fetch(geoUrl, {
          signal: controller.signal,
          next: { revalidate: 3600 },
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (res.ok) {
        const data = await res.json();
        if (data?.features && Array.isArray(data.features) && data.features.length > 0) {
          // Reject incomplete or out-of-range provider coordinates. Never replace
          // missing coordinates with 0,0: that would fabricate a valid-looking location.
          externalResults = data.features.flatMap((f: any): GeocodeResult[] => {
            const props = f?.properties;
            if (!props) return [];
            const lat = props.lat;
            const lng = props.lon;
            if (
              typeof lat !== "number" ||
              typeof lng !== "number" ||
              !Number.isFinite(lat) ||
              !Number.isFinite(lng) ||
              lat < -90 || lat > 90 ||
              lng < -180 || lng > 180
            ) {
              return [];
            }

            const city =
              props.city ||
              props.name ||
              props.town ||
              props.village ||
              props.county ||
              queryTrimmed;
            const country = props.country || "";
            const state = props.state ? `, ${props.state}` : "";
            const formatted =
              props.formatted || `${city}${state}, ${country}`;

            let tzOffset: number | undefined;
            const tzName = typeof props.timezone?.name === "string" ? props.timezone.name : "";
            if (typeof props.timezone?.offset_STD_seconds === "number") {
              tzOffset = props.timezone.offset_STD_seconds / 3600;
            }

            return [{
              city,
              country,
              formatted,
              lat: Math.round(lat * 10000) / 10000,
              lng: Math.round(lng * 10000) / 10000,
              ...(tzOffset !== undefined ? { tz: tzOffset } : {}),
              tzName,
              ianaTimezone: tzName || undefined,
              source: "geoapify" as const,
            }];
          });
        }
      } else {
        console.warn(`Geoapify autocomplete HTTP status: ${res.status}`);
      }
    } catch (err) {
      console.warn("Geoapify forward geocode error or timeout, falling back:", err instanceof Error ? err.message : "Network error");
    }
  }

  // Deduplicate and merge results (putting exact/prefix matches first)
  const combined: GeocodeResult[] = [];
  const seen = new Set<string>();

  const addResult = (item: GeocodeResult) => {
    const key = `${item.city.toLowerCase()}_${item.lat.toFixed(2)}_${item.lng.toFixed(2)}`;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  };

  // Add exact/prefix built-in matches first
  exactOrPrefixBuiltIn.forEach(addResult);
  // Add external results
  externalResults.forEach(addResult);
  // Add remaining built-in matches
  builtInMatches.forEach(addResult);

  return NextResponse.json({ results: combined.slice(0, 10) });
}
