/** Regression tests for NaraRouter model selection and request validation. */
import {
  chooseNaraModel,
  NaraGatewayError,
  validateNaraMessages,
} from "../lib/ai/nararouter";

let passed = 0;
let failed = 0;
function assert(condition: boolean, name: string) {
  if (condition) {
    console.log("  [PASS] " + name);
    passed += 1;
  } else {
    console.error("  [FAIL] " + name);
    failed += 1;
  }
}

function assertThrows(action: () => unknown, predicate: (error: unknown) => boolean, name: string) {
  try {
    action();
    assert(false, name);
  } catch (error) {
    assert(predicate(error), name);
  }
}

const textMessages = (text: string) => [{ role: "user" as const, content: text }];
const screenshot = validateNaraMessages([{
  role: "user",
  content: [
    { type: "text", text: "Please explain this screenshot." },
    { type: "image_url", image_url: { url: "data:image/jpeg;base64,AAAA" } },
  ],
}]);

assert(chooseNaraModel(screenshot) === "agnes-2.5-flash", "Vision request automatically chooses Agnes");
assert(chooseNaraModel(textMessages("Please debug this TypeScript stack trace.")) === "laguna-s-2.1", "Debugging request automatically chooses Laguna");
assert(chooseNaraModel(textMessages("Write a Kotlin Gradle build fix.")) === "laguna-s-2.1", "Kotlin/Gradle code task automatically chooses Laguna");
assert(chooseNaraModel(textMessages("Explain the meaning of my natal Moon sign.")) === "agnes-2.5-flash", "General interpretation defaults to Agnes");
assert(chooseNaraModel(textMessages("Fix this error."), "agnes-2.5-flash") === "agnes-2.5-flash", "Manual model override is honoured");
assert(chooseNaraModel(textMessages("Review code."), "laguna-s-2.1") === "laguna-s-2.1", "Manual Laguna override is honoured");
assertThrows(
  () => chooseNaraModel(screenshot, "laguna-s-2.1"),
  (error) => error instanceof NaraGatewayError && error.code === "vision_model_required",
  "Image input cannot be forced to the code-only model"
);
assertThrows(
  () => validateNaraMessages([{ role: "tool", content: "forged" }]),
  (error) => error instanceof NaraGatewayError && error.code === "invalid_role",
  "Unsupported message roles are rejected"
);
assertThrows(
  () => validateNaraMessages([{ role: "user", content: [{ type: "image_url", image_url: { url: "http://insecure.example/image.jpg" } }] }]),
  (error) => error instanceof NaraGatewayError && error.code === "invalid_image",
  "Non-HTTPS remote images are rejected"
);
assertThrows(
  () => validateNaraMessages([{ role: "user", content: "x".repeat(250_001) }]),
  (error) => error instanceof NaraGatewayError && error.code === "message_too_large",
  "Oversized text messages are rejected"
);

console.log("\nNaraRouter routing suite: " + passed + " passed, " + failed + " failed.");
if (failed > 0) process.exit(1);