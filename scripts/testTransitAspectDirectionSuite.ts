import { isAngularAspectApplying } from "../lib/astronomy/ephemeris";

let passed = 0;
let failed = 0;

function assert(name: string, actual: boolean | null, expected: boolean | null) {
  const ok = actual === expected;
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}: ${name} (expected ${expected}, got ${actual})`);
}

console.log("Transit applying/separating direction regression suite");

// Conjunction: the shortest wrapped separation must be used around 0°/360°.
assert("Direct planet approaching conjunction across 0°", isAngularAspectApplying(359, 1, 0, 1), true);
assert("Direct planet moving away from conjunction", isAngularAspectApplying(1, 359, 0, 1), false);
assert("Retrograde planet approaching conjunction", isAngularAspectApplying(1, 359, 0, -1), true);

// Sextile/trine: both branches (positive and negative angular separation) matter.
assert("Direct planet approaching positive trine branch", isAngularAspectApplying(117, 0, 120, 1), true);
assert("Direct planet separating from positive trine branch", isAngularAspectApplying(123, 0, 120, 1), false);
assert("Retrograde planet approaching positive trine branch", isAngularAspectApplying(123, 0, 120, -1), true);
assert("Direct planet approaching negative sextile branch", isAngularAspectApplying(295, 0, 60, 1), true);
assert("Direct planet separating from negative sextile branch", isAngularAspectApplying(305, 0, 60, 1), false);

// Stationary and exact aspects have no inferable applying direction at this instant.
assert("Stationary planet has indeterminate phase", isAngularAspectApplying(55, 0, 60, 0), null);
assert("Exact aspect has no inferred direction", isAngularAspectApplying(60, 0, 60, 1), null);
assert("Non-finite motion is treated as unknown", isAngularAspectApplying(55, 0, 60, Number.NaN), null);

console.log(`Transit aspect direction: ${passed}/${passed + failed} passed`);
if (failed > 0) process.exit(1);
