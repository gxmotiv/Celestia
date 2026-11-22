import { writeFile } from "node:fs/promises";
import { parsePollinationsFreeTextModels } from "../lib/ai/pollinationsCatalog";

const apiKey = process.env.POLLINATIONS_API_KEY;
if (!apiKey) throw new Error("POLLINATIONS_API_KEY GitHub secret is not configured.");

const baseUrl = "https://gen.pollinations.ai";
const MAX_BENCHMARK_MODELS = 6;

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
  const catalogResponse = await fetch(
    `${baseUrl}/text/models?source=official&reliability=reliable&limit=500`,
    {
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(20_000),
    },
  );
  if (!catalogResponse.ok) {
    throw new Error(`Authenticated Pollinations catalogue request failed: HTTP ${catalogResponse.status}`);
  }
  const catalogPayload: unknown = await catalogResponse.json();
  const eligible = parsePollinationsFreeTextModels(catalogPayload);
  if (eligible.length === 0) {
    throw new Error("The API key can see no official, healthy, zero-priced text models.");
  }

  // Benchmark the strongest currently eligible candidates rather than stale,
  // hard-coded IDs. Keep the run bounded to avoid excessive requests.
  const ranked = [...eligible].sort((a, b) =>
    Number(b.reasoning) - Number(a.reasoning) ||
    Number(b.tools) - Number(a.tools) ||
    (b.healthSuccessRate ?? -1) - (a.healthSuccessRate ?? -1) ||
    b.healthRequests - a.healthRequests ||
    (b.contextLength ?? 0) - (a.contextLength ?? 0) ||
    a.name.localeCompare(b.name)
  );
  const candidates = ranked.slice(0, MAX_BENCHMARK_MODELS).map((model) => model.id);
  console.log(`Found ${eligible.length} eligible models for this API key; benchmarking top ${candidates.length} candidates.`);

  const results: Result[] = [];
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    for (const model of candidates) {
      for (const task of tasks) {
        const started = Date.now();
        try {
          const response = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              model,
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
            results.push({
              model, task: task.id, attempt, status: "http_error",
              httpStatus: response.status, latencyMs,
              error: raw.slice(0, 500),
            });
            console.log(`HTTP ${response.status} ${model} / ${task.id} / ${latencyMs}ms`);
            continue;
          }
          let parsed: any;
          try { parsed = JSON.parse(raw); } catch {
            results.push({
              model, task: task.id, attempt, status: "invalid_response",
              latencyMs, responseChars: raw.length, answer: raw.slice(0, 4000),
            });
            continue;
          }
          const answer = parsed?.choices?.[0]?.message?.content;
          if (typeof answer !== "string" || answer.trim().length === 0) {
            results.push({
              model, task: task.id, attempt, status: "invalid_response",
              latencyMs, responseChars: raw.length,
              error: "Missing choices[0].message.content",
            });
            continue;
          }
          results.push({
            model, task: task.id, attempt, status: "ok",
            httpStatus: response.status, latencyMs,
            responseChars: answer.length, answer: answer.slice(0, 4000),
          });
          console.log(`OK ${model} / ${task.id} / attempt ${attempt} / ${latencyMs}ms / ${answer.length} chars`);
        } catch (error) {
          const latencyMs = Date.now() - started;
          const timedOut = error instanceof Error && error.name === "TimeoutError";
          results.push({
            model, task: task.id, attempt,
            status: timedOut ? "timeout" : "http_error",
            latencyMs,
            error: error instanceof Error ? error.message : String(error),
          });
          console.log(`FAIL ${model} / ${task.id} / ${latencyMs}ms`);
        }
      }
    }
  }

  const summary = candidates.map((model) => {
    const rows = results.filter((row) => row.model === model);
    const ok = rows.filter((row) => row.status === "ok");
    const sorted = ok.map((row) => row.latencyMs).sort((a, b) => a - b);
    const medianMs = sorted.length
      ? sorted.length % 2
        ? sorted[(sorted.length - 1) / 2]
        : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
      : null;
    const catalogModel = eligible.find((entry) => entry.id === model);
    return {
      model,
      catalogueHealth: catalogModel?.health ?? "unknown",
      catalogueSuccessRate: catalogModel?.healthSuccessRate ?? null,
      catalogueRequests: catalogModel?.healthRequests ?? 0,
      reasoning: catalogModel?.reasoning ?? false,
      toolCalling: catalogModel?.tools ?? false,
      contextLength: catalogModel?.contextLength ?? null,
      eligibility: "eligible at authenticated live catalogue check (official, healthy, zero-priced)",
      successfulRequests: ok.length,
      totalRequests: rows.length,
      successRate: rows.length ? Math.round((ok.length / rows.length) * 100) : null,
      medianLatencyMs: medianMs,
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    catalogue: {
      source: "official",
      reliabilityFilter: "reliable",
      eligibleModelCount: eligible.length,
      eligibleModels: eligible.map((model) => ({
        id: model.id,
        name: model.name,
        health: model.health,
        healthSuccessRate: model.healthSuccessRate,
        healthRequests: model.healthRequests,
        reasoning: model.reasoning,
        toolCalling: model.tools,
        contextLength: model.contextLength,
      })),
    },
    benchmark: { selectedModels: candidates, attemptsPerTask: 2, taskCount: tasks.length },
    note: "Synthetic prompts only. No personal birth-chart data used. Latency and availability are a small sample, not a statistical guarantee. Human review of answer quality is still required.",
    summary,
    results,
  };
  await writeFile("pollinations-model-benchmark.json", JSON.stringify(report, null, 2), "utf8");
  console.log("\nSUMMARY");
  console.log(JSON.stringify(summary, null, 2));
  if (results.length === 0) {
    throw new Error("No benchmark requests were run.");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
