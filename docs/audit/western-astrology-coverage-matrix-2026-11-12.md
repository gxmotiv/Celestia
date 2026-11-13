# Western Astrology Coverage and Accuracy Matrix

**Audit date:** 13 November 2026  
**Repository branch:** `research/jpl-western-ephemeris-benchmarks`  
**Purpose:** distinguish implemented calculations, approximate models, symbolic-only points, and methods that are not implemented. A feature name in the UI is not proof of a complete traditional technique.

## How to read this matrix

- **Implemented:** a calculation path exists and has regression tests for the stated behavior.
- **Partial:** a constrained version exists; important techniques, variants, precision, or workflows are missing.
- **Approximate:** a result is deliberately modelled with approximations and must not be described as ephemeris-grade.
- **Symbolic:** a value is a convention or hypothetical point, not a measured physical body or causal effect.
- **Not implemented:** no complete calculation workflow is currently present.

Passing software tests validates code against specified numerical fixtures and invariants. It does not establish the predictive or causal validity of astrology.

## 1. Natal chart foundations

| Area | Status | Current coverage and limits |
|---|---|---|
| Tropical geocentric planetary chart | Implemented | Uses Celestia's Astronomy Engine compatibility facade. It is not linked to the native Swiss Ephemeris library. |
| Independent planetary ephemeris comparison | Reference fixtures captured; calibration pending | 60 JPL Horizons quantity-31 observations across ten bodies and six UTC epochs are committed with raw-response SHA-256 digests. Descriptive residual maximum is 12.14″ longitude / 18.72″ latitude; no acceptance threshold has been calibrated because the frame/correction pipelines differ and the 2035 sample is beyond current EOP prediction coverage. See `docs/audit/western-ephemeris-benchmark-methodology.md`. |
| House systems | Partial | Placidus, Equal, Whole Sign and Porphyry are supported. Placidus falls back to Porphyry when its geometry/solver cannot be used; the actual resolved system is surfaced. |
| Other house systems | Not implemented | Koch, Campanus, Regiomontanus, Alcabitius, Morinus, Meridian and Topocentric are not selectable calculation engines. |
| Angles | Implemented with reference fixtures | Ascendant, Midheaven, Descendant, IC, Vertex and ecliptic East Point. The East Point is distinguished from the equatorial point on the eastern horizon. |
| Planetary dignity | Partial | Selected dignity and rulership calculations exist; this is not a complete cross-author traditional dignity/decan/term/bounds implementation. |
| Aspects | Partial | Major Ptolemaic aspects and selected minor aspects are available. Orbs are configured rules, not universal standards. Some natal planet-to-angle and stationary relative-motion applying/separating states are correctly reported as indeterminate. |
| Declination | Implemented | Parallel/contra-parallel geometry is calculated from the available positions; this does not add missing physical ephemeris precision. |

## 2. Hellenistic and traditional timing

| Method | Status | Current coverage and limits |
|---|---|---|
| Sect | Implemented | Day/night is derived from the Sun's geometric altitude, not inferred from a house number. |
| Planetary joys | Partial | Uses a Whole Sign framework independent of the selected modern Western house system; other source-specific variants are not exhaustively represented. |
| Annual profections | Implemented | One sign/house per completed year, with a traditional ruler-of-year lookup. Full interpretive judging still depends on the chart and chosen tradition. |
| Zodiacal Releasing | Partial | L1 and L2 with a 360-day releasing year, 30-day L2 month convention, angularity judged from Fortune and a 211-month Loosing-of-the-Bond rule. L3/L4 are not implemented. Other reconstructions differ. |
| Firdaria | Partial | Day and night major periods, Chaldean planetary sub-periods, undivided node majors and a 75-year cycle are supported. A selectable alternative nocturnal order places the nodes after Mars. Historical manuscripts/editions differ; this is not every Firdaria variant. |
| Planetary hours | Approximate | Unequal day/night hours and Chaldean rulers use an NOAA-style approximate sunrise/sunset model with a supplied fixed UTC offset. It is not a precision rise/set ephemeris; polar-day/night conditions are explicitly identified. |

## 3. Arabic Lots / Hermetic Lots

The calculator includes the seven planetary Hermetic Lots associated with Paulus of Alexandria: Fortune, Spirit/Daimon, Eros, Necessity, Courage, Victory and Nemesis. The selected traditional formulas are sect-aware where the source specifies reversal. A set of supplementary medieval/topic formulas is also included, but this is not a universal canonical list of “twelve major Parts.”

- The Foreign Travel Lot attributed in Abū Maʿshar/al-Qabīṣī material is calculated from the 9th-house ruler to the degree of the 9th in both day and night charts, projected from the Ascendant.
- Marriage, family, career, death and other topical Lots vary by author and source. Their formula variants are labelled as such.
- Health/sickness and Mars–Saturn separation Lots are historical/experimental symbolism only. They do not diagnose, predict disease, surgery, injury, death or lifespan.
- Lots are sensitive mathematical points, not physical bodies. A valid chart sect must be supplied from the actual solar-horizon calculation.

Primary historical/research references:
- [Greenbaum & Jones, P.Berl. 9825: documentary evidence and Paulus' seven planetary Lots](https://archive.nyu.edu/bitstream/2451/49543/4/Greenbaum%20and%20Jones%202017%20PBerl%209825%20ISAW%20Papers.pdf)
- [Abū Maʿshar / al-Qabīṣī, Book VI: Lot of Foreign Travel](https://agriculturaceleste.com/wp-content/uploads/2025/06/Introductions-to-Traditional-Astrology-Abu-Ma-Shar-Al-Qabisi-B-Dykes-Ed.pdf)

## 4. Modern predictive techniques

| Method | Status | Current coverage and limits |
|---|---|---|
| Transits | Partial | Current transit positions and configured aspects are calculated. The engine does not yet solve every exact pass, retrograde repeat, ingress, station and egress as a complete event timeline. It avoids inventing durations or future exact peaks when unsolved. |
| Secondary progressions | Implemented, constrained | One day after birth equals one tropical year; progressed chart and Moon sign-change life-year labels are calculated. This is a secondary-progression convention, not tertiary or converse progressions. |
| Solar Arc Directions | Partial | Naibod key only: elapsed tropical age × 0.98564733° applied to natal planets and four angles, with directed-to-natal aspect contacts. Other keys and primary directions are not included. |
| Solar Return | Implemented, constrained | Finds the geocentric tropical Sun return within the selected calendar year and calculates a return chart for editable coordinates. The exact global return instant is unchanged by relocation; local houses/angles change. |
| Lunar Return | Implemented, constrained | Finds the next geocentric tropical Moon return after the reference instant and calculates a relocated chart. |
| Tertiary progressions | Not implemented | No complete tertiary progression workflow. |
| Primary directions | Not implemented | No complete mundane/oblique ascension, promissor/significator, key, or direction-arc engine. |
| Horary astrology | Not implemented | No complete question-time chart judgement workflow. |
| Electional astrology | Not implemented | No complete election-search, constraint scoring, or timing workflow. |
| Mundane astrology | Not implemented | No complete ingress, national chart, lunation, eclipse-country or mundane direction system. |

## 5. Cosmobiology, harmonics and relationship charts

| Area | Status | Current coverage and limits |
|---|---|---|
| Midpoints / 90° dial | Partial | Midpoints and selected hard-aspect activations are calculated. This is not a full Uranian/Hamburg 8-point hypothetical-planet and dial system. |
| Harmonic charts | Partial | Selected harmonics H4, H5, H7, H8 and H9 are mathematical longitude transformations. This is not a measured frequency, resonance or neurological property. |
| Synastry | Partial | Cross-chart aspects, house overlays and interpretation labels exist. Aspect scores are heuristic interpretation weights. |
| Composite chart | Partial | Midpoint composite placements are available; this is not a scientifically validated relationship model. |
| Davison chart | Partial | Time-space midpoint chart workflow exists; it still needs broader independent numerical reference fixtures. |
| Relationship index | Heuristic | Starts six dimensions at 70 and adjusts them using fixed, hand-designed aspect/orb weights. It is not a compatibility probability, psychometric test or measured outcome. Karmic/soulmate labels are interpretive symbolism, not proof of fate or past lives. |

## 6. Points, stars, asteroids and eclipses

| Feature | Status | Current coverage and limits |
|---|---|---|
| Ceres, Pallas, Juno and Vesta | Approximate | Simplified Keplerian model with fixed J2000 orbital elements; not high-precision current small-body ephemerides. |
| Chiron | Approximate | Rough illustrative model; not a precision Chiron ephemeris. |
| Mean/True Lilith | Approximate | Compact mean/periodic models; True Lilith is not a complete osculating lunar-apogee solution. |
| White Moon/Selena | Symbolic | Hypothetical and tradition-dependent; no standardized physical body/orbit. |
| Proserpine and Hypnos | Symbolic | Hypothetical points; no verified physical orbit or standardized astronomical ephemeris represented. |
| Vertex and East Point | Geometric | Mathematical chart angles/intersections, not physical bodies. |
| Fixed stars | Approximate | 20 stored J2000 tropical longitudes; no epoch precession, proper motion, nutation or aberration. |
| Eclipses | Partial | Global solar/lunar events are searched with Astronomy Engine. Local visibility/path for the user's coordinates is not implied by a natal-house overlay. |
| Astrocartography | Partial | Planetary line geometry is calculated. Nearest-city ranking, distance-to-line scoring and route/locality recommendations are not implemented. |

## 7. Medical and scientific-use boundary

Medical astrology output is limited to historical body-correspondence symbolism. It does not infer symptoms, diagnose illness, estimate clinical risk, recommend screening, suggest treatment or predict surgery/death. Use qualified clinical care for medical questions.

No astrology output in Celestia should be presented as a scientifically established cause, guaranteed forecast, probability of a life event, or substitute for medical, legal, financial or relationship judgement.

## 8. Next high-value engineering priorities

1. Build independent reference fixtures for synastry/composite/Davison and broader house-angle/house-system cases.
2. Add exact transit pass search for direct/retrograde/direct cycles, ingresses and stations, with explicit time-zone handling.
3. Implement full primary directions as a distinct engine with documented key, latitude treatment, promissors/significators and source-specific method variants.
4. Add tertiary/converse progression variants only after independent numerical validation.
5. Implement horary and electional as distinct workflows with transparent rules, not as generic natal-chart interpretation tabs.
6. Expand epoch-aware fixed-star and high-precision asteroid/centaur ephemerides if the chosen free astronomy library and licensing permit it.
7. Expand Zodiacal Releasing L3/L4 and add source/variant selection.

**Release status:** this matrix describes the current PR branch. The changes remain under review until PR #16 is merged; pull-request builds and Worker dry-runs do not deploy to production.
