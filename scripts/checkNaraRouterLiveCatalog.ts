import { getNaraRouterFreeModels } from "../lib/ai/nararouterCatalog";

const apiKey = process.env.NARAROUTER_API_KEY?.trim();
if (!apiKey) {
  console.log("SKIP NaraRouter live catalogue check: NARAROUTER_API_KEY is not configured as a GitHub Actions secret.");
  process.exit(0);
}

const models = await getNaraRouterFreeModels(apiKey);
if (models.length === 0) {
  console.warn("WARN NaraRouter authenticated /v1/models returned no aliases from the current Free-plan allowlist.");
  console.warn("Check that the account has Free-plan access, has linked Telegram if required, and that the provider has not changed its model aliases.");
} else {
  console.log(`PASS NaraRouter authenticated /v1/models returned ${models.length} currently allowlisted Free-plan model(s): ${models.map((model) => model.id).join(", ")}`);
}
