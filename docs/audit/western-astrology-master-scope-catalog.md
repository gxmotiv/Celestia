# Western Astrology Master Scope Catalogue

**Audit baseline:** Celestia production head `0d0af1d48a07bba833c43efd7c8ef171f85d58f3`  
**Working branch:** `fix/western-master-scope-catalog-and-technique-house-policy`  
**Created:** 14 November 2026  
**Purpose:** make the scope of Western astrology explicit enough that a tab name, calculator stub or partial formula cannot be mistaken for a complete technique.

> This catalogue is deliberately broader than the existing 16 Advanced Western tabs. "All Western astrology" has no finite, universally agreed checklist: historical authors disagree, modern schools create their own variants, and some techniques are local to a particular text or practitioner. Celestia therefore needs a source-attributed, versioned catalogue. This document is a coverage baseline, not a claim that every historical variant has been enumerated or that astrology is scientifically predictive.

## Status definitions

- **Implemented (tested):** the named calculation path is present and has regression tests for its stated scope.
- **Partial:** the broad feature exists, but variants, interpretations, workflows, integration or independent fixtures remain missing.
- **Approximate:** the output uses an explicitly limited mathematical or astronomical model.
- **Symbolic / hypothetical:** the point is a tradition-specific symbol, not a confirmed physical body or ephemeris position.
- **Not implemented:** no functioning end-to-end calculation workflow is present.
- **Audit required:** code may exist, but its full scope, source tradition, correctness or reference coverage has not been established.
- **Not applicable:** the technique does not use that calculation dimension.

A feature is not "complete" merely because a UI tab, enum, label, formula or placeholder exists. A complete technique needs: a documented source/variant, defined inputs and conventions, calculation, error/edge handling, user-visible provenance, tests, independent numerical/reference fixtures where applicable, and connection to the real website workflow.

## 1. Traditions and schools that the catalogue must keep distinct

These are separate method families, not interchangeable labels. Celestia should allow an identified technique/source variant rather than blend doctrines into one generic "Western" result.

| Tradition / school family | Distinctive material to catalogue | Current Celestia position |
|---|---|---|
| Hellenistic / Greco-Roman | Whole Sign houses, seven visible planets, sect, domicile rulers, bounds/terms, triplicity, decans/faces, planetary joys, lots, antiscia, annual profections, zodiacal releasing, distributions and primary directions in their historical forms | Partial; core sect, selected dignity, profections, selected Lots, L1/L2 releasing exist; many doctrines and variants remain |
| Medieval Arabic, Persian and Latin | Inheritances and revisions of Hellenistic doctrines, planetary periods, firdaria, lots, solar revolutions, electional and interrogational methods, direction systems, reception and planetary condition | Partial; selected Parts, Firdaria and returns exist; source-by-source variants remain |
| Renaissance / early modern | Lilly-style horary and electional methods, house/rulership/reception judgements, primary directions, mundane and event techniques, fixed stars | Partial across foundations; full horary/electional workflows are not implemented |
| Modern Western / psychological | Tropical natal analysis, Placidus and other house systems, modern rulership, psychological synthesis, transits, progressions, returns, synastry and composite charts | Partial; core natal and selected predictive/relationship engines exist |
| Humanistic / transpersonal / evolutionary | Humanistic cycles, archetypal and psychological interpretation, evolutionary Pluto/node frameworks, school-specific aspects and developmental narratives | Audit required; interpretation content should be source-labelled and not presented as calculation facts |
| Uranian / Hamburg | Eight hypothetical Trans-Neptunian points, midpoint trees, planetary pictures, Aries/World Axis, 90°/360° dials, graphic ephemeris and school-specific house conventions | Partial midpoint/90° functions; eight-point and full picture/dial system not implemented |
| Cosmobiology | Ebertin-style midpoint trees, planetary pictures, 90° dial, 45° graphic ephemeris and hard-aspect families; distinct from Hamburg's use of hypothetical planets | Partial selected midpoints and 90° analysis; full method and reference catalogue not implemented |
| Harmonic astrology | Harmonic charts, harmonic aspects, harmonic families, age harmonics and source-specific interpretation | Partial selected H4/H5/H7/H8/H9 plus custom integer calculation; full harmonic-school workflow not implemented |
| Huber / API and other structured modern schools | Age-point/life clock, house/sign/planet models and school-specific chart/interpretation procedures | Audit required / not implemented as complete school workflows |
| Western sidereal and constellational variants | Ayanamsa choices, sidereal frame, precession conventions, sign versus constellation distinctions, house/aspect variants | Partial; one Fagan-Bradley comparison path exists; broader methods and independent calibration remain |

The list of schools should be treated as an extensible registry. A school may combine techniques from another family, but the result must say which rules were used.

## 2. Natal chart and astronomical foundations

| Subsystem | Current status at baseline | Remaining scope |
|---|---|---|
| Chart frame and zodiac | Partial | Explicit tropical, named sidereal/ayanamsa and constellation-based modes; epoch and coordinate frame; precession/nutation conventions; geocentric/topocentric/heliocentric choices where a technique requires them |
| Date and time | Partial / audit required | Historical IANA zone validation, second-level local offsets, local mean/apparent time traditions, UTC/UT1/TT, Delta-T, leap seconds, calendar reform and unknown birth-time uncertainty |
| Planetary ephemeris | Approximate compatibility facade | Current facade uses Astronomy Engine, not native Swiss Ephemeris/libswe. Continue JPL/INPOP frame-matched benchmarks, target/time-scale/correction provenance and acceptance thresholds |
| Sun through Pluto | Core calculated | Independently calibrate position, speed, latitude, distance and retrograde/stationary behaviour across epochs |
| Lunar nodes | Partial | Mean/true node conventions exist; validate longitude, speed, interpolation and historical model distinctions |
| Lunar apogee / Black Moon Lilith | Approximate | Distinguish mean apogee, true/osculating apogee, interpolated apogee and other apogee definitions; disclose the exact model |
| Chiron and centaurs | Approximate / placeholder | Replace Chiron placeholder with real small-body ephemerides; add named centaurs only with a documented orbit source and uncertainty |
| Major asteroids | Approximate | Ceres, Pallas, Juno and Vesta use simplified fixed-element models; upgrade to integrated/perturbed small-body positions and independent references |
| Further minor planets / TNOs | Not implemented / symbolic by school | Eris, Haumea, Makemake, Sedna, Orcus, Quaoar, Ixion, Varuna and source-specific objects; distinguish physical bodies from hypothetical points |
| Angles and local geometry | Implemented in part | ASC, MC, DSC, IC, Vertex and East Point exist; complete angle/house/prime-vertical/equatorial conventions and independent fixtures |
| House systems | Ten calculation methods merged into the deployment branch; public deployment status must be verified separately | Placidus, Equal, Whole Sign, Porphyry, Regiomontanus, Koch, Campanus, Alcabitius, Morinus and Meridian / Axial Rotation; many other named systems listed in Section 10 remain unsupported |
| Planetary phase and visibility | Partial | Heliacal rising/setting, morning/evening star phases, combustion, under-beams, cazimi, elongations, visibility criteria and sect/light condition variants |
| Fixed stars | Approximate | Current set is 20 stored J2000 tropical longitudes; need epoch precession, proper motion, nutation/aberration conventions, expanded catalogue, star identity and uncertainty |
| Lunar mansions / decans | Partial or separate tradition | Western decans/faces, Chaldean decans, bounds/terms, monomoiria, dodecatemoria, dwads and source-specific subdivisions |
| Eclipses and lunations | Partial | Global event search exists; add local contact circumstances, visibility, path, magnitude, altitude, local date/time, eclipse families and technique-specific natal/mundane overlays |

## 3. Natal interpretation, judgement and chart structure

| Method family | Coverage required | Current position |
|---|---|---|
| Planet-in-sign and planet-in-house | Every included planet/point, chosen rulership system and house model | Core placements exist; point/model limitations must be preserved |
| Essential dignities | Domicile, exaltation, triplicity, bounds/terms, face/decan, detriment and fall | Partial selected tables; historical authors and dignity scoring variants need separate profiles |
| Accidental condition | Angularity, house strength, speed, retrogradation, solar phase, visibility, sect, motion and other traditional conditions | Partial; full source-attributed condition scoring is still missing |
| Rulership | Traditional and modern domicile schemes, dispositor chains, final dispositors, mutual reception, reception by dignity/house and chart rulers | Partial / audit required |
| Sect and planetary joys | Day/night sect, sect light, in-sect planets, contrary-to-sect and joy positions | Sect exists; joys use selected Whole Sign framework; wider traditional judging incomplete |
| Aspect systems | Ptolemaic aspects, sign-based aspects, whole-sign aspects, minor/harmonic aspects, declination, antiscia/contra-antiscia and school-specific orbs | Partial; selected major/minor/declination systems exist |
| Aspect patterns | Grand trine, T-square, grand cross, yod, kite, mystic rectangle, stellium, wedge, cradle, Thor's Hammer and school-specific figures | Audit required; do not infer full pattern coverage from pairwise aspect rows |
| Chart patterns | Hemispheric emphasis, quadrants, elements/modalities, chart shape, bucket/splay/bundle/locomotive and dispositor structure | Audit required |
| Midpoints and sensitive points | Planet/angle midpoints, midpoint trees, focal planets, Aries Point/World Axis, planetary pictures | Partial selected set; no complete Uranian/Cosmobiology picture engine |
| Antiscia and related points | Solstitial antiscia, contra-antiscia, parallels of declination, zodiacal projections | Needs full source-labelled implementation and tests |
| Lots / Arabic Parts | Seven Hermetic planetary Lots and author-specific topical Lots, day/night reversal, formula provenance | Partial: seven core Hermetic Lots and selected supplementary formulas exist; no universal canonical all-Lots list |
| Almuten and chart rulers | Almuten of chart, almuten of house/degree, Lord of Geniture/figures, historical methods and dignity scoring | Partial; current Almuten is a Celestia-specific hybrid and not a full historical doctrine |
| Interpretation | Planet/sign/house/aspect synthesis, chart ruler, dignities, sect, aspects/patterns, life topics and contradictions | Core interpretation exists; full source-attributed synthesis and rule transparency remain |
| Birth-time uncertainty | Unknown time, rectification, time windows and which derived factors become unavailable | Unknown-time placeholder disclosure exists; a full rectification workflow is not implemented |

## 4. Traditional timing and predictive systems

| Technique | Status | Remaining scope |
|---|---|---|
| Transits | Partial | Exact aspect searches, direct/retrograde/direct passes, stations, ingresses, sign/house crossings, egress, orb windows, applying/separating and event timelines |
| Secondary progressions | Implemented, constrained | Broader progressed angles, progressed lunations, solar/lunar phases, progressed aspects and converse variants |
| Converse secondary progressions | Not implemented | Reverse-time chart construction with documented convention |
| Tertiary progressions | Not implemented | Tertiary I and II variants, date mapping and source-specific timing |
| Minor progressions | Not implemented | Documented method, year/day conversion and tests |
| Solar Arc | Partial | Current Naibod key; add other named keys and source variants, angle handling and midpoint activations |
| Primary directions | Not implemented | Placidian, Regiomontanus and other direction methods; mundane/oblique ascension, promissors, significators, keys, latitude treatment, converse directions, primary direction arcs and timing |
| Annual profections | Implemented, constrained | Monthly profections, house/sign variants, lord-of-year judgement, activation rules and source comparisons |
| Zodiacal Releasing | Partial | L1/L2 exist; L3/L4, Fortune/Spirit, peak periods, Loosing of the Bond variants and source reconstruction |
| Firdaria | Partial | Current day/night order and selected node variant; expand source variants, subperiod rules and date conventions |
| Decennials | Not implemented | Distinct Hellenistic planetary period system and variants |
| Distributions through bounds / terms | Not implemented | Time-lord distributions, bounds, primary directions relationship and historical source options |
| Circumambulations | Not implemented | Source-specific primary direction/time-lord variants |
| Planetary periods and minor time lords | Partial / audit required | Add source-attributed systems and distinguish from Vedic dasha systems |
| Solar returns | Implemented, constrained | Annual return chart exists; expand return-lord judgement, solar revolution techniques, profections/transits integration and source variants |
| Lunar returns | Implemented, constrained | Next lunar return exists; expand return interpretation and reference fixtures |
| Planetary returns | Partial | Mercury through outer-planet returns, nodal returns and technique-specific return traditions |
| Eclipse and lunation timing | Partial | Local visibility/contact, prenatal/postnatal lunations, eclipse cycles, return and mundane activation rules |
| Progressed/Directed lunations | Not implemented | New/full moon phases in progressed/directed charts and historical source variants |

## 5. Specialist question, election, event and mundane branches

| Branch | Required full workflow | Current position |
|---|---|---|
| Horary / interrogational | Question-time/place chart, radicality rules where used, significators, accidental/essential condition, receptions, perfection, translation/collection, prohibition, frustration, refranation, void-of-course, timing and source-specific judgement | Not implemented as a full engine |
| Electional / katarchic | Search date/time windows, hard constraints, electional significators, planetary condition, Moon rules, angles, receptions, prohibitions, scoring and reasons for each candidate | Not implemented as a full engine |
| Mundane / political / national | National foundation charts, ingress charts, lunations, eclipses, conjunction cycles, primary directions, local charts, time-zone and historical source metadata | Not implemented as a full engine |
| Aries ingress and seasonal ingress | Annual ingress charts for locations/nations, quadrant/whole-sign methods, repeating annual charts and source conventions | Not implemented as a full workflow |
| Astro-meteorology | Historical weather prediction methods, ingress/lunation/eclipse combinations, location and observation validation | Not implemented; any output must be labelled historical/experimental, not a weather forecast |
| Financial / business astrology | Market/event charts and historical rules, strictly separated from investment advice or return guarantees | Not implemented |
| Event astrology | Event charts, business openings, launches, founding charts, contract or ceremony elections | Not implemented |
| Decumbiture / medical astrology | Historical symbolic chart conventions and source texts | Not implemented as a full workflow; must never diagnose, estimate clinical risk or advise treatment |
| Astrological magic / talismanic elections | Source-specific electional rules for fixed stars, mansions, decans and planetary conditions | Not implemented; keep as a distinct historical research module |

## 6. Relationship and interpersonal astrology

| Technique | Current position | Remaining scope |
|---|---|---|
| Synastry | Partial | Full planet/point coverage, overlays for all eligible factors, source-specific aspect orbs and separate tradition profiles |
| Composite | Partial | Full midpoint convention options, angles/house policy, midpoint tie handling, method reference fixtures |
| Davison | Partial | Complete time-space midpoint conventions, house/angle method variants and independent reference fixtures |
| Relationship timing | Not implemented / partial | Composite progressions, relationship transits, Davison progressions and event dates |
| Family and group charts | Not implemented | Parent-child, family, team and group methods with clearly described interpretation |
| Relationship score | Heuristic | Current fixed-weight index is not a probability, compatibility test or measured outcome; redesign to show its exact rules or remove unsupported predictive language |

## 7. Geographic and locational astrology

| Technique | Current position | Remaining scope |
|---|---|---|
| Astrocartography | Partial | Current planetary line geometry; add local crossings, distance/orb, city ranking and independent location fixtures |
| Relocation chart | Partial / audit required | Recalculate angles/houses for destination at same UTC instant; maintain natal planets and clearly distinguish relocation from changing birth time |
| Local Space astrology | Not implemented | Azimuthal planetary directions, local-space lines and selected origin/time convention |
| Parans | Not implemented | Simultaneous angularity, rising/setting/culminating/anti-culminating pairs, latitude and epoch handling |
| Geodetic astrology | Not implemented | Explicit longitude/latitude reference meridian and school-specific mapping |
| Relocation scoring | Not implemented | Transparent line distance, angularity and school-specific criteria; no unsupported life-outcome probabilities |
| City and route comparison | Not implemented | Distance to lines, crossings, travel path and source-labelled ranking |

## 8. Uranian, Cosmobiology, harmonic and modern-school tools

| Tool family | Required scope | Current position |
|---|---|---|
| Hamburg hypothetical points | Cupido, Hades, Zeus, Kronos, Apollon, Admetos, Vulkanus and Poseidon with explicit hypothetical/symbolic status | Not implemented |
| Uranian dial charts | 90°, 45°, 360° dials, rotating dial, Aries/World Axis and school-specific house options | Partial 90° selected activation; not complete |
| Uranian midpoint trees | All point/planet/angle midpoint combinations, midpoint sorting, planetary pictures and multi-point symmetry | Partial |
| Cosmobiology | Ebertin-style 90° dial, 45° graphic ephemeris, midpoint trees, 8th-harmonic aspect family and source text/keywords | Partial |
| Harmonic astrology | H1 onward, aspect/harmonic families, chart types, age harmonics and interpretive sources | Partial |
| Psychological / humanistic | Source-attributed psychological interpretation, cycles and developmental techniques | Audit required |
| Evolutionary | Pluto, nodes, rulers and school-specific evolutionary framework | Not implemented as a separate engine |
| Huber / API | Age point, life clock and school-specific chart/interpretation rules | Not implemented as a complete engine |

## 9. Physical bodies, symbolic points and additional astronomical factors

Track every item separately; do not merge physical ephemeris objects with hypothetical or geometrical points.

- Physical planets and dwarf planets: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, and selected dwarf planets/TNOs.
- Asteroids: Ceres, Pallas, Juno, Vesta and author/school-selected minor asteroids.
- Centaurs: Chiron and further named centaurs where supported by integrated ephemerides.
- Lunar points: mean node, true node, mean apogee, osculating/true apogee, interpolated apogee, Black Moon Lilith variants and other named schools' lunar points.
- Hypothetical points: Hamburg Trans-Neptunians, White Moon/Selena, Proserpina/Proserpine, Isis/Transpluto and other school-specific constructs; label as hypothetical or symbolic.
- Geometrical factors: Ascendant/Descendant, MC/IC, Vertex, East Point, antiscia and derived Lots.
- Stars and constellations: fixed stars, stellar parans, proper motion, precession, nutation, aberration, ecliptic/coordinate frame, catalogue epoch and name identifiers.
- Lunar phase, occultations, stations, retrogrades, heliacal phenomena, eclipses and planetary visibility.

## 10. House-system catalogue and current engine boundary

Swiss Ephemeris publishes a much broader house-method list than Celestia currently implements. The presence of a name in a reference manual, a type union or a UI option is not proof that Celestia can calculate it.

| House method | Celestia calculation status |
|---|---|
| Placidus | Implemented |
| Equal (Ascendant = cusp 1) | Implemented |
| Whole Sign | Implemented |
| Porphyry | Implemented |
| Koch | Implemented; requests inside the polar circle resolve to Porphyry with the actual system disclosed |
| Regiomontanus | Implemented |
| Campanus | Implemented; independent prime-vertical great-circle calculation, polar orientation handling and Swiss Ephemeris reference tests |
| Alcabitius | Implemented; Ascendant semi-arc divisions, independently reference-tested |
| Morinus | Implemented; equatorial 30° divisions projected to the ecliptic, latitude-independent and independently checked against published Swiss Ephemeris tables |
| Meridian / Axial Rotation | Implemented and merged in commit `9e702d9f6281b5a8ace12a320c32caaf5e8f3324`; independent Swiss Ephemeris 2.10.03 `X` fixtures and CI passed; public deployment is a separate gate |
| Topocentric / Polich-Page | Not implemented; formula and official Swiss Ephemeris reference tables identified; calculation and integration tests still required |
| Horizontal / Azimuthal | Not implemented |
| Krusinski-Pisa-Goelzer | Not implemented |
| Vehlow Equal | Not implemented |
| Equal MC | Not implemented |
| Equal Aries | Not implemented |
| Gauquelin sectors | Not implemented |
| Sunshine (both documented variants) | Not implemented |
| APC | Not implemented |
| Carter Poli-Equatorial | Not implemented |
| Pullen SD | Not implemented |
| Pullen SR | Not implemented |
| Sripati | Not implemented |


### Topocentric / Polich–Page implementation gate

The Topocentric *house* system (Swiss Ephemeris house code `T`) is the Polich–Page division. It is not the same feature as topocentric planetary coordinates (the `swe_set_topo` / `-topo` observer-position option). The published Swiss Ephemeris algorithm constructs the intermediate cusps from the geographic latitude's tangent, using polar heights \(f_1=\arctan(\tan\phi/3)\) and \(f_2=\arctan(2\tan\phi/3)\), then projects the corresponding great-circle intersections onto the ecliptic. The reference implementation also applies a documented 180° orientation correction for polar-circle cases. See the [Swiss Ephemeris house-system documentation](https://www.astro.com/swisseph/swisseph.htm) and the [Swiss Ephemeris `swehouse.c` implementation](https://github.com/astrotools/SwissEphemeris/blob/master/swisseph/swehouse.c), code `T`.

Before exposing this method in natal, transit, print/PDF or Android controls, Celestia must reproduce the official [Swiss Ephemeris Topocentric tables](https://www.astro.com/swisseph/ae/hts_T_e.pdf) across both hemispheres and high latitudes, including orientation and cusp-order edge cases. A formula copied into a selector without those independent fixtures is not an implementation. The term “topocentric” must be labelled “Topocentric (Polich–Page houses)” in the UI to avoid implying that planetary positions have been switched to a topocentric observer frame.

Swiss Ephemeris documents that Placidus and Koch are not defined within the polar circle, and other house methods have their own calculation limits. Celestia's Koch calculator is independently derived from the MC semi-diurnal-arc construction and tested against Swiss Ephemeris 2.10.03 reference values. Campanus is independently derived from prime-vertical great-circle geometry and tested against Swiss Ephemeris 2.10.03 fixtures in both hemispheres, including polar orientation shifts. Alcabitius is independently derived from the Ascendant declination and its diurnal/nocturnal semi-arcs, then checked against Swiss Ephemeris 2.10.03 fixtures across both hemispheres and high latitudes. Koch requests inside the polar circle resolve to Porphyry and disclose the actual system used; Campanus and Alcabitius requests at the exact geographic poles resolve to Porphyry because their local horizon/semi-arc construction is singular there. These are disclosed calculation fallbacks, not claims that Porphyry is the historically correct choice for every chart. Morinus is independently implemented by dividing the celestial equator into 30° right-ascension arcs from ARMC and converting each declination-zero point to ecliptic longitude; it is latitude-independent and was checked against Astrodienst's published Swiss Ephemeris Morinus tables at multiple ARMC values. Morinus cusp 1 is not the astronomical Ascendant, and Morinus cusp 10 is not assumed to be the standard MC. The Morinus transformation is intentionally different from Meridian / Axial Rotation. Meridian / Axial Rotation instead divides the ecliptic into points whose right ascensions are ARMC + n × 30° and applies the inverse RA-to-ecliptic-longitude transformation; its cusp geometry is latitude-independent, while the astronomical Ascendant remains latitude-dependent. Its source method identifier is `X`, distinct from Morinus `M`.

### Technique-aware automatic house-system rules

- Modern Western natal: recommend Placidus as the current Celestia default; disclose that it is a convention, not a universal best system.
- Hellenistic natal and selected Hellenistic time-lord workflows: use Whole Sign where that framework is the declared source convention.
- Western transits and return charts: inherit the user's selected natal chart framework unless the named technique explicitly requires another method.
- Synastry: preserve each person's own natal house setting; disclose whose houses receive the overlay.
- Composite/Davison: require the named construction/house convention rather than silently inheriting a natal chart's system.
- Lilly-style horary/electional: the Regiomontanus house calculation is available as a named method. The full horary judgement and election-search workflows remain unimplemented; never infer the complete technique from house-system support alone.
- Alcabitius-school profile: the semi-arc house calculation is available as an explicit choice; it is not silently made the default for other Western schools.
- Morinus house profile: the documented equatorial-division calculation is available as an explicit choice; this does not imply that every historical Morinus doctrine or interpretive workflow is complete.
- Primary directions: direction method, key and domification are coupled; require an explicit direction profile.
- Uranian/Cosmobiology and mundane methods: require source/school-specific settings; do not invent one universal default.
- Astrocartography: no ordinary house system is required for the planet-line geometry itself.

Manual override must remain available. The UI should display the recommendation, rationale, requested system and actual system, and it must not overwrite a saved chart preference silently.

## 11. Quality gates before a technique can be marked complete

For every distinct technique/profile, maintain these gates:

1. Source trail: primary text or reputable technical reference, edition/translation, author, named variant and disagreements.
2. Mathematical specification: inputs, coordinate frame, time scale, house/zodiac convention, orb/key, day/night reversal and boundary conditions.
3. Engine implementation: deterministic pure function where possible, no fake/placeholder precision, explicit unsupported states.
4. UI integration: real user workflow, correct inputs, named settings, visible rationale, outputs and error states.
5. Tests: nominal fixtures, boundaries, reverse-order invariance where relevant, polar/high-latitude and invalid inputs.
6. Independent validation: numerical comparison to independent references for astronomical values; source-based example charts for traditional rules. Tests against the same internal formula are not independent verification.
7. Export/API parity: PDF, print, API, saved profile, mobile and web must label the same calculated result and limitations.
8. Regression and deployment: CI, production build, deploy, then live smoke test.

## 12. Initial implementation order

1. Centralize technique-aware house-system selection and accurately disclose what is actually supported.
2. Expand the Western reference suite for house systems, angles, time scales and natal placements.
3. Add and validate further house engines (next candidates include Topocentric, Horizontal, Krusinski-Pisa-Goelzer and the remaining documented systems), then extend source-specific house-method profiles.
4. Complete traditional natal judgement: dignity, reception, rulers, dispositors, sect, lots, antiscia and patterns with source profiles.
5. Build the exact transit event timeline.
6. Implement primary directions as a separate, variant-driven engine.
7. Complete progression and traditional time-lord variants.
8. Build horary, electional, mundane and event workflows as distinct engines.
9. Complete Uranian/Cosmobiology, harmonic and relationship branches.
10. Expand fixed-star/small-body astronomy, astrocartography, parans and local space.
11. Complete cross-platform parity, accuracy audits, references and live deployment checks.

## References and source policy

- [Swiss Ephemeris Programmer's Manual — house methods](https://www.astro.com/swisseph/swephprg.pdf): technical method identifiers and computation behavior.
- [Swiss Ephemeris Campanus Table of Houses](https://www.astro.com/swisseph/ae/hts_C_e.pdf): independent tabular reference for Campanus cusps.
- [Swiss Ephemeris Morinus Tables of Houses](https://www.astro.com/swisseph/ae/hts_M_e.pdf): independent tabular reference for Morinus cusps at multiple ARMC values and latitudes.
- [Campanus geometry and implementation notes](https://docs.rs/libephemeris-core/latest/libephemeris_core/houses/fn.houses_campanus.html): prime-vertical divisions and great-circle projection.
- [Swiss Ephemeris Programmer's Manual — house methods](https://www.astro.com/swisseph-download/doc/swephprg.pdf): identifies Morinus as house code `M` and distinguishes it from Meridian/Axial Rotation (`X`).
- [Swiss Ephemeris 2.10.03 house-calculation source (`swehouse.c`)](https://github.com/aloistr/swisseph/blob/v2.10.03/swehouse.c): reference for the Alcabitius (`B`) semi-arc construction, Koch and Regiomontanus methods, Morinus (`M`) equatorial transformation and method-specific limits. Celestia's Alcabitius, Koch and Morinus calculators use separate mathematical implementations.
- Martin Munkasey, “The Alcibitius Semiarc House System,” cited by the Swiss Ephemeris implementation notes; compare with the `B` branch in the versioned `swehouse.c` source.
- [Cambridge Casebooks — Regiomontanus house construction](https://casebooks-production.casebooks.lib.cam.ac.uk/data/astrology-in-the-casebooks.pdf): historical/geometrical explanation of dividing the celestial equator into 30° intervals and projecting position circles to the ecliptic.
- [Astrodienst house-system overview](https://www.astro.com/faq/fq_fh_owhouse_e.htm): descriptions of named house systems and historical context.
- [Astrodienst Astrowiki — Astrological Schools](https://www.astro.com/astrowiki/en/Astrological_Schools): overview of distinct schools and specializations.
- [Internet Encyclopedia of Philosophy — Hellenistic Astrology](https://iep.utm.edu/hellenistic-astrology/): scholarly historical context for the Hellenistic tradition.
- Each future technique entry must add the primary work / authoritative technical specification it actually uses. These general links are not a substitute for method-specific provenance.

**Production release boundary:** the earlier production commit `d21dafdbc5854f06b023e436abf976709339d8a5` contained nine calculated Western house systems through Morinus. Meridian / Axial Rotation was subsequently merged into `deploy/cloudflare-workers-free` in commit `9e702d9f6281b5a8ace12a320c32caaf5e8f3324` via PR #45. Its dedicated Swiss Ephemeris reference suite, Android offline suite, ESLint, production build, ARM32/ARM64 APK build and Cloudflare Worker dry-run all passed in verification runs `43694587079` and `43694587086`. The Cloudflare workflow's actual deployment job was skipped, and the Android prerelease publishing step was skipped; therefore this merge proves branch integration and build validation, not a new public Worker deployment or a published Android release. The broader Western astrology catalogue remains an active roadmap, not a claim that every Western technique is implemented.
