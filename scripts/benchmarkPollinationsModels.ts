import { writeFile } from "node:fs/promises";
import { parsePollinationsFreeTextModels } from "../lib/ai/pollinationsCatalog";

const apiKey = process.env.POLLINATIONS_API_KEY;
if (!apiKey) throw new Error("POLLINATIONS_API_KEY GitHub secret is not configured.");

const baseUrl = "https://gen.pollinations.ai";
const MAX_MODELS = 8;
const tasks = [
  {
    id: "angular-reasoning",
    prompt: "A planet is at 15 degrees Aries and another is at 15 degrees Libra. Calculate their smallest angular separation, name the major aspect, and explain the calculation briefly. Do not add other assumptions.",
  },
  {
    id: "structured-extraction",
    prompt: 'Extract the following facts and return ONLY valid JSON with keys "date", "time", "location", and "unknowns": "Birth date: 14 February 1995. Birth time: 9:30 AM IST. Birthplace: Jaipur, India. Exact house system: not specified."',
  },
  {
    id: "astrology-caution",
    prompt: "A fictional chart has Mars in the 10th house. Give a short traditional-astrology interpretation, then list two things that cannot be concluded from this placement alone. Clearly distinguish symbolic interpretation from verified fact.",
  },
];

type Result = {
  model: string;
  task: string;
  attempt: number;
  status: "ok" | "http_error" | "timeout" | "invalid_response";
  httpStatus?: number;
  latencyMs: number;
  responseChars?: number;
  answer?: string;
  error?: string;
};

async function main() {
  const headers = { Accept: "application/json", Authorization: `Bearer ${apiKey}` };
  const sources = ["official", "community"] as const;
  const responses = await Promise.all(sources.map((source) => fetch(
    `${baseUrl}/text/models?source=${source}&reliability=reliable&limit=500`,
    { headers, signal: AbortSignal.timeout(20_000) },
  )));
  const failed = responses.find((response) => !response.ok);
  if (failed) throw new Error(`Authenticated Pollinations catalogue request failed: HTTP ${failed.status}`);
  const payloads: unknown[] = await Promise.all(responses.map((response) => response.json()));

  const official = parsePollinationsFreeTextModels(payloads[0]);
  const community = parsePollinationsFreeTextModels(payloads[1], { includeManualOnly: true })
    .filter((model) => model.community && !model.privacyRisk);
  const allAvailable = [...official, ...community];
  const ranked = allAvailable.sort((a, b) =>
    Number(b.reasoning) - Number(a.reasoning) ||
    Number(b.tools) - Number(a.tools) ||
    (b.healthSuccessRate ?? -1) - (a.healthSuccessRate ?? -1) ||
    b.healthRequests - a.healthRequests ||
    (b.contextLength ?? 0) - (a.contextLength ?? 0) ||
    a.name.localeCompare(b.name)
  );
  const candidates = ranked.slice(0, MAX_MODELS);
  if (candidates.length === 0) {
    throw new Error("The live reliable catalogue returned no healthy, non-paid-only text models for this API key.");
  }

  console.log(`Live catalogue: ${official.length} eligible official + ${community.length} eligible community models.`);
  console.log(`Benchmarking ${candidates.length} highest-ranked candidates; each request may consume Pollen according to its listed token prices.`);
  for (const model of candidates) {
    console.log(`CANDIDATE ${model.id} | ${model.community ? "community" : "official"} | health=${model.healthSuccessRate ?? "n/a"}% over ${model.healthRequests} requests | input=${model.inputPrice ?? "unlisted"} / output=${model.outputPrice ?? "unlisted"} Pollen per token`);
  }

  const results: Result[] = [];
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    for (const model of candidates) {
      for (const task of tasks) {
        const started = Date.now();
        try {
          const response = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: model.id,
              messages: [{ role: "user", content: task.prompt }],
              temperature: 0.2,
              max_tokens: 500,
              stream: false,
            }),
            signal: AbortSignal.timeout(60_000),
          });
          const latencyMs = Date.now() - started;
          const raw = await response.text();
          if (!response.ok) {
            results.push({ model: model.id, task: task.id, attempt, status: "http_error", httpStatus: response.status, latencyMs, error: raw.slice(0, 500) });
            console.log(`HTTP ${response.status} ${model.id} / ${task.id} / ${latencyMs}ms`);
            continue;
          }
          let parsed: any;
          try { parsed = JSON.parse(raw); } catch {
            results.push({ model: model.id, task: task.id, attempt, status: "invalid_response", latencyMs, responseChars: raw.length, answer: raw.slice(0, 4000) });
            continue;
          }
          const answer = parsed?.choices?.[0]?.message?.content;
          if (typeof answer !== "string" || answer.trim().length === 0) {
            results.push({ model: model.id, task: task.id, attempt, status: "invalid_response", latencyMs, responseChars: raw.length, error: "Missing choices[0].message.content" });
            continue;
          }
          results.push({ model: model.id, task: task.id, attempt, status: "ok", httpStatus: response.status, latencyMs, responseChars: answer.length, answer: answer.slice(0, 4000) });
          console.log(`OK ${model.id} / ${task.id} / attempt ${attempt} / ${latencyMs}ms`);
        } catch (error) {
          const latencyMs = Date.now() - started;
          const timedOut = error instanceof Error && error.name === "TimeoutError";
          results.push({ model: model.id, task: task.id, attempt, status: timedOut ? "timeout" : "http_error", latencyMs, error: error instanceof Error ? error.message : String(error) });
          console.log(`FAIL ${model.id} / ${task.id} / ${latencyMs}ms`);
        }
      }
    }
  }

  const summary = candidates.map((model) => {
    const rows = results.filter((row) => row.model === model.id);
    const ok = rows.filter((row) => row.status === "ok");
    const latencies = ok.map((row) => row.latencyMs).sort((a, b) => a - b);
    const medianLatencyMs = latencies.length
      ? latencies.length % 2
        ? latencies[(latencies.length - 1) / 2]
        : Math.round((latencies[latencies.length / 2 - 1] + latencies[latencies.length / 2]) / 2)
      : null;
    return {
      model: model.id,
      title: model.name,
      publisher: model.publisher,
      source: model.community ? "community" : "official",
      eligibility: "listed by authenticated reliable catalogue; healthy; paid_only=false; text chat-completions capable",
      catalogueHealth: model.health,
      catalogueSuccessRate: model.healthSuccessRate,
      catalogueRequests: model.healthRequests,
      inputPricePerTokenPollen: model.inputPrice,
      outputPricePerTokenPollen: model.outputPrice,
      contextLength: model.contextLength,
      reasoning: model.reasoning,
      toolCalling: model.tools,
      successfulRequests: ok.length,
      totalRequests: rows.length,
      successRate: rows.length ? Math.round((ok.length / rows.length) * 100) : null,
      medianLatencyMs,
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    catalogue: {
      reliabilityFilter: "reliable",
      eligibleOfficialCount: official.length,
      eligibleCommunityCount: community.length,
      eligibleModels: allAvailable.map((model) => ({
        id: model.id, title: model.name, publisher: model.publisher,
        source: model.community ? "community" : "official",
        health: model.health, successRate: model.healthSuccessRate,
        requests: model.healthRequests, inputPricePerTokenPollen: model.inputPrice,
        outputPricePerTokenPollen: model.outputPrice, contextLength: model.contextLength,
        reasoning: model.reasoning, toolCalling: model.tools,
      })),
    },
    benchmark: { selectedModels: candidates.map((model) => model.id), attemptsPerTask: 2, taskCount: tasks.length },
    note: "paid_only=false means not restricted to paid-only keys; it does NOT mean zero-cost. Pollen charges may apply at the listed token rates. Synthetic prompts only; no personal birth-chart data. Small-sample availability/latency does not prove answer quality.",
    summary,
    results,
  };
  await writeFile("pollinations-model-benchmark.json", JSON.stringify(report, null, 2), "utf8");
  console.log("\nSUMMARY");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
