import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../app/api/pdf/generate/route";

function makeRequest(body: string, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/pdf/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
}

const payload = {
  userData: {
    fullName: "Celestia PDF Test",
    birthDate: "2000-01-01",
    birthTime: "12:00",
    cityName: "Test City",
    country: "Test Country",
    latitude: 12.5,
    longitude: 13.5,
    timezoneOffset: 5.5,
    timezoneMode: "automatic",
    ianaTimezone: "Asia/Kolkata",
    houseSystem: "Placidus",
  },
  western: {
    houseSystem: "Placidus",
    planets: [
      { name: "Sun", sign: "Capricorn", signDegreeFormatted: "10°00' Capricorn", house: 1 },
      { name: "Moon", sign: "Cancer", signDegreeFormatted: "20°00' Cancer", house: 7 },
    ],
    houses: [
      { house: 1, sign: "Capricorn", signDegreeFormatted: "0°00' Capricorn" },
      { house: 7, sign: "Cancer", signDegreeFormatted: "0°00' Cancer" },
    ],
    ascendant: { sign: "Capricorn", signDegreeFormatted: "5°00' Capricorn" },
    midheaven: { sign: "Libra", signDegreeFormatted: "8°00' Libra" },
  },
  vedic: {
    lagna: { rasiName: "Sagittarius" },
    moonSignRasi: "Gemini",
    birthNakshatra: "Ardra",
    birthPada: 2,
    ayanamsaFormatted: "23°51′",
    currentMahadasha: "Rahu",
    currentAntardasha: "Saturn",
    planets: [
      { name: "Sun", rasiName: "Sagittarius", rasiDegreeFormatted: "10°00′", nakshatraName: "Mula", pada: 1 },
    ],
  },
  numerology: {
    lifePathNumber: 1,
    expressionNumber: 5,
    soulUrgeNumber: 7,
    personalityNumber: 3,
    birthdayNumber: 1,
    maturityNumber: 6,
    personalYearNumber: 8,
  },
  chinese: {
    zodiacAnimal: "Dragon",
    dayMaster: { symbol: "Jia", nature: "Yang Wood", strength: "Balanced" },
    yearPillar: { combinedName: "Geng-Chen" },
    monthPillar: { combinedName: "Wu-Zi" },
    dayPillar: { combinedName: "Jia-Zi" },
    hourPillar: { combinedName: "Ren-Shen" },
    elementsBalance: { Wood: 2, Fire: 1, Earth: 1, Metal: 1, Water: 2 },
  },
};

async function run() {
  const valid = await POST(makeRequest(JSON.stringify(payload)));
  assert.equal(valid.status, 200, "valid chart payload returns HTTP 200");
  assert.match(valid.headers.get("content-type") || "", /application\/pdf/i);
  const bytes = new Uint8Array(await valid.arrayBuffer());
  assert.ok(bytes.length > 1500, "PDF contains a non-trivial report");
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), "%PDF-", "response starts with a PDF signature");

  const malformed = await POST(makeRequest("{invalid json"));
  assert.equal(malformed.status, 400, "malformed JSON is rejected with HTTP 400");

  const tooLarge = await POST(makeRequest("x".repeat(1_000_001)));
  assert.equal(tooLarge.status, 413, "oversized input is rejected with HTTP 413");

  console.log("PDF generation suite passed: 6 assertions.");
}

run().catch((error) => {
  console.error("PDF generation suite failed:", error);
  process.exit(1);
});
