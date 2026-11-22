import { getNaraRouterFreeModels } from "../lib/ai/nararouterCatalog";

async function main() {
  const apiKey = process.env.NARAROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.log("SKIP NaraRouter live catalogue check: NARAROUTER_API_KEY is not configured as a GitHub Actions secret.");
    return;
  }

  const models = await getNaraRouterFreeModels(apiKey);
  if (models.length === 0) {
    console.warn("WARN NaraRouter authenticated /v1/models returned no aliases from the current Free-plan allowlist.");
    console.warn("Check Free-plan access, Telegram linking if required, and whether the provider changed its model aliases.");
  } else {
    console.log(`PASS NaraRouter authenticated /v1/models returned ${models.length} currently allowlisted Free-plan model(s): ${models.map((model) => model.id).join(", ")}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown NaraRouter live catalogue error.";
  console.error(`FAIL NaraRouter live catalogue check: ${message}`);
  process.exitCode = 1;
});
