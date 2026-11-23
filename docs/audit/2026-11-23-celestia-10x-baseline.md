# Celestia — 10× engineering baseline and triage

**Audit date:** 2026-11-23  
**Repository:** [gxmotiv/Celestia](https://github.com/gxmotiv/Celestia)  
**Baseline inspected:** `main` at `2c7f4ca80651d56c186b55f689ad9a0b5e3261bf`  
**Scope:** first-pass repository, PR, CI, provider-safety, and calculation-provenance review. This is a triage baseline, not a claim that every source file or feature has been fully audited.

## Executive diagnosis

Celestia already contains a broad set of astrology engines, report surfaces, provider adapters, and research tooling. Its next quality jump should come from **closing correctness and trust gaps before adding more feature breadth**.

The strongest verified priorities from this pass are:

1. Keep the existing ephemeris-provenance correction in [PR #68](https://github.com/gxmotiv/Celestia/pull/68) in the review/merge queue; do not create a duplicate fix. The current main branch still contains misleading native Swiss Ephemeris / fixed-accuracy wording, while PR #68 contains the correction and supporting policy document.
2. Preserve strict zero-cost provider gates. Pollinations' live smoke test found no eligible official model with explicitly zero input and output prices. It therefore made no inference request and failed its isolated smoke job. Do not relax the gate to turn CI green.
3. Keep NaraRouter fail-closed. The read-only account catalogue authenticated and returned 44 model IDs, but did not return the one model in the current public Free-plan allowlist. Celestia correctly exposed no NaraRouter model instead of choosing a PAYG alias.
4. Work through the method-specific accuracy gates already recorded in issues #65, #67, #71, #73, and #64, with explicit dependency order and independent reference fixtures.
5. Improve the testing entry point and evidence reporting so one green build cannot be mistaken for full astronomical accuracy or full product validation.

## 1. Repository and open-work state

The repository is public, uses `main` as its default branch, and the connected GitHub account has repository write permissions.

| Work item | State observed | Why it matters |
|---|---|---|
| [PR #68 — ephemeris provenance](https://github.com/gxmotiv/Celestia/pull/68) | Open, not reported merged | Contains a focused correction for inaccurate Swiss Ephemeris and 0.001° claims across source, UI, reports, and PDF output. |
| [PR #106 — Pollinations catalogue/cost guard](https://github.com/gxmotiv/Celestia/pull/106) | Open | Establishes strict live-catalogue and zero-price semantics. PRs #107 and #108 are based on this branch. |
| [PR #107 — NaraRouter live Free-plan catalogue](https://github.com/gxmotiv/Celestia/pull/107) | Open draft | Adds server-side catalogue discovery and a strict provider-published Free-plan allowlist. |
| [PR #108 — visible Pollinations smoke status](https://github.com/gxmotiv/Celestia/pull/108) | Open draft | Separates the live smoke test from build validation so the real provider eligibility failure is visible. |
| [PR #100 → #101](https://github.com/gxmotiv/Celestia/pull/100) | Open; #101 is stacked on #100 | Western progression civil-time and historical IANA timezone work must be reviewed in dependency order. |
| [PR #70 → #72](https://github.com/gxmotiv/Celestia/pull/70) | Open; #72 is described as depending on the JPL vector benchmark branch | Lunar-node state-vector work depends on a consistent reference frame and benchmark fixtures. |

**Branch discipline:** do not merge a stacked PR before its parent. Re-check current PR heads, base branches, required status checks, and mergeability immediately before any merge decision. This baseline does not authorize a merge or deployment.

## 2. Verified CI and provider observations

### 2.1 PR #108 — build and smoke test are different outcomes

Workflow run [45023425244](https://github.com/gxmotiv/Celestia/actions/runs/45023425244) was inspected.

- OpenNext build and Worker dry-run job: **success**.
- Pollinations live free-model inference smoke job: **failure**.
- Benchmark job: **skipped**.
- Cloudflare deployment job: **skipped**.
- The failed smoke step reported that no official, healthy model with explicitly zero input and output prices was currently available.
- The script checks the authenticated provider catalogue before inference. With no eligible candidate it exits before sending a chat-completion request.

Interpretation: this is a provider-eligibility failure, not a failed application build. It is correct for the workflow to surface the unavailable free model rather than silently select a paid or unknown-price model. Do not disable the failure or loosen the price check.

### 2.2 PR #107 — NaraRouter account catalogue mismatch

The read-only NaraRouter diagnostic in [workflow run 44995547738](https://github.com/gxmotiv/Celestia/actions/runs/44995547738) reported:

- NaraRouter Free-plan parser tests: 12 assertions passed.
- Authenticated `GET /v1/models`: HTTP 200, 44 model IDs returned.
- The account catalogue did not include `agnes-2.5-flash`, the ID currently used by Celestia's strict Free-plan allowlist.
- The documented MCP `list_models` request returned HTTP 200, but Celestia's parser extracted zero model IDs. The logged output does not establish whether the provider returned an empty result or whether the response shape is not yet handled.
- The public `/api/plans` response showed a Free plan with a 7,000,000-token daily cap and 15 RPM; the public plan metadata had an empty `models` array, so it did not provide a model-ID mapping.

The provider's public pricing page currently lists Agnes 2.5 Flash for its Free plan, while the authenticated model API is account-scoped. These are not equivalent sources of entitlement proof. See the [NaraRouter API documentation](https://router.bynara.id/docs) and [pricing page](https://router.bynara.id/pricing).

**Safe conclusion:** the key authenticates, but the account-scoped catalogue currently does not verify an allowlisted Free model. Keep NaraRouter unavailable in the selector until the discrepancy is resolved. Do not add all 44 aliases, assume a model is free because the plan is free, or test an unknown-cost model by generating text.

### 2.3 PR #107 CI SHA caveat

The successful run above was associated with an earlier PR head SHA (`5aa1ef7d9c155f21eb3a7b4c9373c5dc01e4cea7`). The PR metadata later reported a newer head SHA (`e7aa42a4b01b29727ad36d21be9a19b8ff0266ab`), for which this pass did not find a matching workflow run. Therefore the earlier green run is evidence for that earlier commit only; re-check CI on the current PR head before approval.

### 2.4 Bundler warnings

The successful #107 Worker dry-run log also displayed a duplicate object key warning (`axisIndex`) and an unreachable duplicate `case` warning. This pass did not trace those generated bundle warnings to a specific live source location. Classify them as **observed, source not yet established**. Do not edit unrelated code or assume they are harmless until the responsible module is identified.

## 3. Ten-dimension baseline

| Dimension | Baseline finding | Priority / next evidence |
|---|---|---|
| 1. Astronomy and mathematics | Main still has misleading ephemeris naming/precision wording. PR #68 has a focused provenance correction. Lunar-node formulas and outputs have separate accuracy gates. | **P1:** review #68; then complete independent per-body and per-node fixtures. |
| 2. Tradition and method integrity | A large range of methods exists, but the repository roadmap explicitly requires distinguishing implemented, partial, and planned techniques and naming school variants. | **P1–P2:** method inventory by system; do not infer completeness from a UI panel. |
| 3. Birth time, timezone, and geography | Civil-time and historical-IANA timezone PRs are stacked. BaZi has distinct clock/day-boundary conventions and known solar-term validation gaps. | **P1:** review #100 before #101; address issue #64 with multi-year solar-term fixtures. |
| 4. Architecture and code quality | Many calculation modules and UI panels coexist. A shared calculation trace and a single source of truth for conventions are important. | **P2:** map calculation call paths, consumers, legacy aliases, duplicated engines, and storage boundaries. |
| 5. AI/provider governance | Strict Pollinations and NaraRouter guardrails exist in open PRs; live account state can legitimately result in no usable free model. | **P1:** finish #106 → #107/#108 in order; verify current heads and do not weaken free eligibility. |
| 6. Security and privacy | Provider secrets are server-side in the inspected PR changes. User birth/chart data is sensitive personal data and must not be sent to benchmark prompts. | **P1–P2:** audit all API routes, provider transmission/consent, client bundles, logs, exports, and profile storage. |
| 7. Testing and research | CI invokes standalone TypeScript suites; `package.json` has no top-level `test` script. Passing internal assertions does not establish ephemeris accuracy. | **P2:** create a documented, reproducible test entry point with explicit tools and separate test classes. |
| 8. UX and accessibility | The app has many specialist panels; this pass did not complete browser/device usability or accessibility testing. | **P2:** audit main question flow, mobile viewport, keyboard/screen reader, loading/error/offline states. |
| 9. Performance and release | Current workflow supports Next build, OpenNext packaging, Worker dry-run, optional benchmark, and opt-in deploy. PR #108's build is independent from its live provider smoke test. | **P2:** measure bundle/hydration/calculation costs and verify modest Android performance; keep deployment opt-in. |
| 10. Documentation and provenance | Issue #65 already provides a staged accuracy-first roadmap; #67 documents important ephemeris truthfulness gaps. | **P1–P2:** synchronize docs, UI, PDF, reports, tests, and provider setup guidance. |

## 4. Prioritized 10× programme

### P0 — Protect trust, cost, and user data
- Keep unknown-price models blocked.
- Keep provider credentials server-side.
- Keep the default benchmark zero-cost guarded and deployment disabled.
- Verify no personal chart data enters provider benchmarks.
- Treat missing or conflicting birth inputs as uncertainty, not as an invented exact chart.

### P1 — Finish the current correctness and provider gates
1. Review and integrate the existing ephemeris provenance correction in PR #68; do not duplicate it.
2. Review PR #106 before its dependent provider PRs.
3. Resolve NaraRouter's authenticated Free-model discrepancy using provider/account evidence, not a broader allowlist.
4. Preserve the visible Pollinations smoke outcome and investigate only if a genuinely eligible official zero-price model is published.
5. Review Western civil-time PR #100 before historical timezone PR #101.
6. Keep mean and true lunar-node algorithms distinct until the true-node validation gates are met.

### P2 — Build the reliable calculation foundation
- Versioned calculation settings and reproducible chart snapshots.
- One clearly named algorithm/provenance record per planetary body and derived point.
- Explicit mean/true node selection propagated consistently to Western, Vedic, KP, relationship, transit, and PDF paths.
- Multi-year, independently sourced BaZi solar-term fixtures with boundary tests.
- A method inventory for each system with status: implemented, partial, experimental, planned, or unsupported.
- A unified test command and documented test taxonomy.

### P3 — Deepen system-specific coverage
Audit separately rather than blending systems:
- Western: houses, aspects, dignities, sect, profections, progressions, returns, lots, fixed stars, asteroids, and event timing.
- Vedic: ayanamsa, bhava/rashi policy, Panchanga, D1–D60, strengths, dashas, Jaimini, yogas, and transits.
- KP: cusp/sub-lord divisions, significators, traceable event rules, and uncertainty.
- BaZi: solar-term instant solving, clock convention, Zi-hour day boundary, pillars, hidden stems, luck pillars, and unknown-time policy.
- Numerology: formula lineage, transliteration, alphabet mapping, reduction/master-number variants, and system separation.
- Relationships: synastry/composite/Davison separation, birth-time uncertainty, and Vedic matching rule variants.

### P4 — Make the product easier to use and inspect
- Lead with the user's question and route to relevant specialist desk(s).
- Explain why each method was selected.
- Show concise findings first, with expandable calculations, conventions, sources, and uncertainty.
- Improve keyboard/touch access, small-screen chart readability, loading/error states, and PDF consistency.
- Verify offline claims against real app paths; do not advertise unsupported offline behavior.

### P5 — Establish a real prediction-research platform
- Pre-register rules and hypotheses before evaluation.
- Timestamp predictions and freeze the data cutoff.
- Include baseline comparisons, held-out periods, scoring definitions, calibration, missing-data policy, and reproducible raw outputs.
- Keep model evaluations synthetic and separate from deterministic chart calculations.
- Never present small-sample model scores or astrology outputs as scientific validation.

## 5. Open questions that must remain open until evidence exists

1. What is the measured angular error for each supported planet and each lunar-node model across the supported date range?
2. Which coordinate and time-scale conventions does each engine path actually implement?
3. Is the true lunar node a fully validated osculating state-vector node, or still provisional?
4. Which BaZi solar-term calculation path is canonical, and how are disagreements between legacy paths resolved?
5. Which AI providers can be proven free for this exact account and exact model today?
6. Which specialist desk capabilities are fully implemented and covered by tests, versus partial UI or research specifications?
7. Can the full app be used comfortably on the target low-memory Android device under slow or intermittent connectivity?

Do not answer these with guesses. Create a reproducible test, inspect exact source, or request owner-side evidence that does not disclose secrets.

## 6. Work performed for this baseline

- Inspected repository metadata, main tree, current main commit, relevant open PR metadata, and selected source files.
- Inspected #106–#108, #68, #100–#101, selected workflow runs, selected job summaries, and the #108 smoke-test log.
- Inspected the NaraRouter read-only CI diagnostic output and current provider plan/model evidence.
- Identified that PR #68 already covers the ephemeris-provenance correction; no duplicate code patch was created.
- Added the reusable [Celestia Master Engineering Prompt](../engineering/CELESTIA_MASTER_ENGINEERING_PROMPT.md) on a documentation branch.

**Not performed:** no PR merge, production deployment, paid inference, paid benchmark, provider generation request, secret readout, full mobile/browser accessibility audit, full source-tree audit, or independent ephemeris validation.

## 7. Recommended next action

Review the existing PR dependency graph and complete the highest-priority already-open correctness work in order. In particular, do not duplicate PR #68, do not merge #107/#108 ahead of #106, and do not enable a paid benchmark or deployment as a shortcut to a green status.
