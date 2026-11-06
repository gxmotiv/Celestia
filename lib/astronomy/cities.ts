/**
 * Comprehensive Global Cities Database
 * Provides latitude, longitude, and default timezone offset (hours from UTC)
 * for instant client-side calculation without requiring external geocoding APIs.
 */

export interface CityData {
  city: string;
  country: string;
  state?: string;
  lat: number;
  lng: number;
  tz: number; // Legacy/default offset in hours; not date-specific
  ianaTimezone: string; // IANA zone used for date-specific historical resolution
}

export const GLOBAL_CITIES: CityData[] = [
  // North America
  { city: "New York", country: "United States", state: "New York", lat: 40.7128, lng: -74.006, tz: -5 },
  { city: "Los Angeles", country: "United States", state: "California", lat: 34.0522, lng: -118.2437, tz: -8 },
  { city: "Chicago", country: "United States", state: "Illinois", lat: 41.8781, lng: -87.6298, tz: -6 },
  { city: "Houston", country: "United States", state: "Texas", lat: 29.7604, lng: -95.3698, tz: -6 },
  { city: "Phoenix", country: "United States", state: "Arizona", lat: 33.4484, lng: -112.074, tz: -7 },
  { city: "Philadelphia", country: "United States", state: "Pennsylvania", lat: 39.9526, lng: -75.1652, tz: -5 },
  { city: "San Antonio", country: "United States", state: "Texas", lat: 29.4241, lng: -98.4936, tz: -6 },
  { city: "San Diego", country: "United States", state: "California", lat: 32.7157, lng: -117.1611, tz: -8 },
  { city: "Dallas", country: "United States", state: "Texas", lat: 32.7767, lng: -96.797, tz: -6 },
  { city: "San Francisco", country: "United States", state: "California", lat: 37.7749, lng: -122.4194, tz: -8 },
  { city: "Seattle", country: "United States", state: "Washington", lat: 47.6062, lng: -122.3321, tz: -8 },
  { city: "Denver", country: "United States", state: "Colorado", lat: 39.7392, lng: -104.9903, tz: -7 },
  { city: "Washington D.C.", country: "United States", state: "District of Columbia", lat: 38.9072, lng: -77.0369, tz: -5 },
  { city: "Boston", country: "United States", state: "Massachusetts", lat: 42.3601, lng: -71.0589, tz: -5 },
  { city: "Miami", country: "United States", state: "Florida", lat: 25.7617, lng: -80.1918, tz: -5 },
  { city: "Atlanta", country: "United States", state: "Georgia", lat: 33.749, lng: -84.388, tz: -5 },
  { city: "Honolulu", country: "United States", state: "Hawaii", lat: 21.3069, lng: -157.8583, tz: -10 },
  { city: "Toronto", country: "Canada", state: "Ontario", lat: 43.6532, lng: -79.3832, tz: -5 },
  { city: "Montreal", country: "Canada", state: "Quebec", lat: 45.5017, lng: -73.5673, tz: -5 },
  { city: "Vancouver", country: "Canada", state: "British Columbia", lat: 49.2827, lng: -123.1207, tz: -8 },
  { city: "Calgary", country: "Canada", state: "Alberta", lat: 51.0447, lng: -114.0719, tz: -7 },
  { city: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332, tz: -6 },
  { city: "Guadalajara", country: "Mexico", lat: 20.6597, lng: -103.3496, tz: -6 },
  { city: "Monterrey", country: "Mexico", lat: 25.6866, lng: -100.3161, tz: -6 },

  // Europe
  { city: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278, tz: 0 },
  { city: "Paris", country: "France", lat: 48.8566, lng: 2.3522, tz: 1 },
  { city: "Berlin", country: "Germany", lat: 52.52, lng: 13.405, tz: 1 },
  { city: "Munich", country: "Germany", lat: 48.1351, lng: 11.582, tz: 1 },
  { city: "Frankfurt", country: "Germany", lat: 50.1109, lng: 8.6821, tz: 1 },
  { city: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, tz: 1 },
  { city: "Milan", country: "Italy", lat: 45.4642, lng: 9.19, tz: 1 },
  { city: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038, tz: 1 },
  { city: "Barcelona", country: "Spain", lat: 41.3851, lng: 2.1734, tz: 1 },
  { city: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041, tz: 1 },
  { city: "Brussels", country: "Belgium", lat: 50.8503, lng: 4.3517, tz: 1 },
  { city: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738, tz: 1 },
  { city: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417, tz: 1 },
  { city: "Geneva", country: "Switzerland", lat: 46.2044, lng: 6.1432, tz: 1 },
  { city: "Athens", country: "Greece", lat: 37.9838, lng: 23.7275, tz: 2 },
  { city: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393, tz: 0 },
  { city: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603, tz: 0 },
  { city: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686, tz: 1 },
  { city: "Oslo", country: "Norway", lat: 59.9139, lng: 10.7522, tz: 1 },
  { city: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683, tz: 1 },
  { city: "Helsinki", country: "Finland", lat: 60.1699, lng: 24.9384, tz: 2 },
  { city: "Warsaw", country: "Poland", lat: 52.2297, lng: 21.0122, tz: 1 },
  { city: "Prague", country: "Czech Republic", lat: 50.0755, lng: 14.4378, tz: 1 },
  { city: "Budapest", country: "Hungary", lat: 47.4979, lng: 19.0402, tz: 1 },
  { city: "Bucharest", country: "Romania", lat: 44.4268, lng: 26.1025, tz: 2 },
  { city: "Kyiv", country: "Ukraine", lat: 50.4501, lng: 30.5234, tz: 2 },
  { city: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173, tz: 3 },
  { city: "Saint Petersburg", country: "Russia", lat: 59.9343, lng: 30.3351, tz: 3 },
  { city: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784, tz: 3 },

  // Asia - India & South Asia
  { city: "New Delhi", country: "India", state: "Delhi", lat: 28.6139, lng: 77.209, tz: 5.5 },
  { city: "Saharanpur", country: "India", state: "Uttar Pradesh", lat: 29.964, lng: 77.546, tz: 5.5 },
  { city: "Haridwar", country: "India", state: "Uttarakhand", lat: 29.9457, lng: 78.1642, tz: 5.5 },
  { city: "Roorkee", country: "India", state: "Uttarakhand", lat: 29.8543, lng: 77.888, tz: 5.5 },
  { city: "Dehradun", country: "India", state: "Uttarakhand", lat: 30.3165, lng: 78.0322, tz: 5.5 },
  { city: "Rishikesh", country: "India", state: "Uttarakhand", lat: 30.0869, lng: 78.2676, tz: 5.5 },
  { city: "Meerut", country: "India", state: "Uttar Pradesh", lat: 28.9845, lng: 77.7064, tz: 5.5 },
  { city: "Muzaffarnagar", country: "India", state: "Uttar Pradesh", lat: 29.4727, lng: 77.7085, tz: 5.5 },
  { city: "Noida", country: "India", state: "Uttar Pradesh", lat: 28.5355, lng: 77.391, tz: 5.5 },
  { city: "Ghaziabad", country: "India", state: "Uttar Pradesh", lat: 28.6692, lng: 77.4538, tz: 5.5 },
  { city: "Lucknow", country: "India", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, tz: 5.5 },
  { city: "Kanpur", country: "India", state: "Uttar Pradesh", lat: 26.4499, lng: 80.3319, tz: 5.5 },
  { city: "Agra", country: "India", state: "Uttar Pradesh", lat: 27.1767, lng: 78.0081, tz: 5.5 },
  { city: "Mathura", country: "India", state: "Uttar Pradesh", lat: 27.4924, lng: 77.6737, tz: 5.5 },
  { city: "Ayodhya", country: "India", state: "Uttar Pradesh", lat: 26.7922, lng: 82.1998, tz: 5.5 },
  { city: "Prayagraj (Allahabad)", country: "India", state: "Uttar Pradesh", lat: 25.4358, lng: 81.8463, tz: 5.5 },
  { city: "Varanasi", country: "India", state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739, tz: 5.5 },
  { city: "Mumbai", country: "India", state: "Maharashtra", lat: 19.076, lng: 72.8777, tz: 5.5 },
  { city: "Bengaluru", country: "India", state: "Karnataka", lat: 12.9716, lng: 77.5946, tz: 5.5 },
  { city: "Kolkata", country: "India", state: "West Bengal", lat: 22.5726, lng: 88.3639, tz: 5.5 },
  { city: "Chennai", country: "India", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, tz: 5.5 },
  { city: "Hyderabad", country: "India", state: "Telangana", lat: 17.385, lng: 78.4867, tz: 5.5 },
  { city: "Ahmedabad", country: "India", state: "Gujarat", lat: 23.0225, lng: 72.5714, tz: 5.5 },
  { city: "Pune", country: "India", state: "Maharashtra", lat: 18.5204, lng: 73.8567, tz: 5.5 },
  { city: "Jaipur", country: "India", state: "Rajasthan", lat: 26.9124, lng: 75.7873, tz: 5.5 },
  { city: "Ujjain", country: "India", state: "Madhya Pradesh", lat: 23.1765, lng: 75.7885, tz: 5.5 },
  { city: "Chandigarh", country: "India", state: "Punjab/Haryana", lat: 30.7333, lng: 76.7794, tz: 5.5 },
  { city: "Amritsar", country: "India", state: "Punjab", lat: 31.634, lng: 74.8723, tz: 5.5 },
  { city: "Ludhiana", country: "India", state: "Punjab", lat: 30.901, lng: 75.8573, tz: 5.5 },
  { city: "Kathmandu", country: "Nepal", lat: 27.7172, lng: 85.324, tz: 5.75 },
  { city: "Colombo", country: "Sri Lanka", lat: 6.9271, lng: 79.8612, tz: 5.5 },
  { city: "Dhaka", country: "Bangladesh", lat: 23.8103, lng: 90.4125, tz: 6 },
  { city: "Karachi", country: "Pakistan", lat: 24.8607, lng: 67.0011, tz: 5 },
  { city: "Lahore", country: "Pakistan", lat: 31.5204, lng: 74.3587, tz: 5 },
  { city: "Islamabad", country: "Pakistan", lat: 33.6844, lng: 73.0479, tz: 5 },

  // East & Southeast Asia
  { city: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, tz: 8 },
  { city: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737, tz: 8 },
  { city: "Guangzhou", country: "China", lat: 23.1291, lng: 113.2644, tz: 8 },
  { city: "Shenzhen", country: "China", lat: 22.5431, lng: 114.0579, tz: 8 },
  { city: "Chengdu", country: "China", lat: 30.5728, lng: 104.0668, tz: 8 },
  { city: "Hong Kong", country: "China", lat: 22.3193, lng: 114.1694, tz: 8 },
  { city: "Taipei", country: "Taiwan", lat: 25.033, lng: 121.5654, tz: 8 },
  { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, tz: 9 },
  { city: "Osaka", country: "Japan", lat: 34.6937, lng: 135.5023, tz: 9 },
  { city: "Kyoto", country: "Japan", lat: 35.0116, lng: 135.7681, tz: 9 },
  { city: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978, tz: 9 },
  { city: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, tz: 7 },
  { city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, tz: 8 },
  { city: "Kuala Lumpur", country: "Malaysia", lat: 3.139, lng: 101.6869, tz: 8 },
  { city: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456, tz: 7 },
  { city: "Bali (Denpasar)", country: "Indonesia", lat: -8.6705, lng: 115.2126, tz: 8 },
  { city: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842, tz: 8 },
  { city: "Hanoi", country: "Vietnam", lat: 21.0285, lng: 105.8542, tz: 7 },
  { city: "Ho Chi Minh City", country: "Vietnam", lat: 10.8231, lng: 106.6297, tz: 7 },

  // Middle East
  { city: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708, tz: 4 },
  { city: "Abu Dhabi", country: "United Arab Emirates", lat: 24.4539, lng: 54.3773, tz: 4 },
  { city: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753, tz: 3 },
  { city: "Jeddah", country: "Saudi Arabia", lat: 21.4858, lng: 39.1925, tz: 3 },
  { city: "Doha", country: "Qatar", lat: 25.2854, lng: 51.531, tz: 3 },
  { city: "Tel Aviv", country: "Israel", lat: 32.0853, lng: 34.7818, tz: 2 },
  { city: "Jerusalem", country: "Israel", lat: 31.7683, lng: 35.2137, tz: 2 },
  { city: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, tz: 2 },
  { city: "Tehran", country: "Iran", lat: 35.6892, lng: 51.389, tz: 3.5 },

  // South America
  { city: "Sao Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333, tz: -3 },
  { city: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729, tz: -3 },
  { city: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816, tz: -3 },
  { city: "Santiago", country: "Chile", lat: -33.4489, lng: -70.6693, tz: -4 },
  { city: "Bogota", country: "Colombia", lat: 4.711, lng: -74.0721, tz: -5 },
  { city: "Lima", country: "Peru", lat: -12.0464, lng: -77.0428, tz: -5 },

  // Africa & Oceania
  { city: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473, tz: 2 },
  { city: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241, tz: 2 },
  { city: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219, tz: 3 },
  { city: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, tz: 1 },
  { city: "Casablanca", country: "Morocco", lat: 33.5731, lng: -7.5898, tz: 1 },
  { city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, tz: 10 },
  { city: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631, tz: 10 },
  { city: "Brisbane", country: "Australia", lat: -27.4698, lng: 153.0251, tz: 10 },
  { city: "Perth", country: "Australia", lat: -31.9505, lng: 115.8605, tz: 8 },
  { city: "Auckland", country: "New Zealand", lat: -36.8485, lng: 174.7633, tz: 12 },
  { city: "Wellington", country: "New Zealand", lat: -41.2865, lng: 174.7762, tz: 12 }
];

export function searchCities(query: string, limit = 8): CityData[] {
  if (!query.trim()) return GLOBAL_CITIES.slice(0, limit);
  const q = query.toLowerCase().trim();

  return GLOBAL_CITIES.map((c) => {
    const cityName = c.city.toLowerCase();
    const countryName = c.country.toLowerCase();
    const stateName = (c.state || "").toLowerCase();
    let score = 0;

    if (cityName === q) {
      score = 1000;
    } else if (cityName.startsWith(q)) {
      score = 500 - (cityName.length - q.length);
    } else if (cityName.includes(q)) {
      score = 250;
    } else if (stateName && stateName.startsWith(q)) {
      score = 150;
    } else if (countryName.startsWith(q)) {
      score = 100;
    } else if (countryName.includes(q) || (stateName && stateName.includes(q))) {
      score = 50;
    }

    return { city: c, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.city);
}
