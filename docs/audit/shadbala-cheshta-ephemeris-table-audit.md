# Raman Cheshta mean-longitude and Seeghrocha table audit

**Review date:** 16 November 2026  
**Source edition:** B. V. Raman, *Graha and Bhava Balas*, 13th edition, UBS Publishers, 1 February 1992 (digitized scan linked below).  
**Purpose:** determine whether Raman's reproduced *Book of Fate* Tables IV–IX can safely be turned into an automatic live ephemeris provider for Cheshta Kendra.

## 1. What is established

Raman explicitly states in the first-edition preface that the mean-position and Seeghrocha tables needed for Cheshta Bala are reproduced from Kedarnath Dutt's *Book of Fate*. The book defines Madhya as a uniform-rate mean longitude, distinct from the true longitude, and gives these rules:

- Articles 88–92: tables use 1 January 1900, midnight at 76° E (Ujjain mean time); convert the birth moment to Ujjain mean time and add that time since Ujjain midnight to the day interval.
- Article 94 / Table IV: mean Sun.
- Article 95: mean Mercury and Venus equal the mean Sun.
- Article 96 / Table V: mean Mars.
- Article 97 / Table VI: mean Jupiter, with correction −(3.33 + 0.0067t).
- Article 98 / Table VII: mean Saturn, with correction +(5 + 0.001t).
- Article 100–101: Seeghrocha of Mars, Jupiter and Saturn equals the mean Sun.
- Article 102 / Table VIII: Mercury apogee starts at 164° and uses +(6.67 − 0.00133t).
- Article 103 / Table IX: Venus apogee starts at 328°51′ and has a correction described as a subtraction.
- Article 105–107: Cheshta Kendra is the Seeghrocha minus the midpoint of mean and true longitudes; if the Kendra exceeds 180°, reduce it from 360°; divide the reduced Kendra by three for Cheshta Bala.

The source-defined Cheshta Kendra formula is already implemented in lib/vedic/shadbalaEngine.ts. It has an independent regression suite against Raman's five-planet Standard Horoscope examples (Examples 49–51): scripts/testShadbalaCheshtaKendraSuite.ts. The suite also verifies superior/inferior planet input routing, the 0°/360° midpoint wrap, and explicit unavailability when mean/apogee data is missing.

## 2. Why a live table provider is not yet safe

The scanned 1992 edition itself contains conflicts between a table entry, a worked example, or an article and its table heading. These are not merely differences between modern software implementations.

| Source location | Conflict visible in the scan | Consequence |
|---|---|---|
| Table IV, p.113 | The 10,000-day solar product for row 1 appears as 146.0265, while the 6,000-day example and the other solar products imply a different modulo-360 progression. | Do not infer a single daily coefficient from the table without comparing the original Book of Fate table or a verified erratum. |
| Table VI, p.114 vs Example 44, p.74 | Row 6 / Hundreds is printed as 42.86 in the table, while the worked example uses 49.86 for 600 days. | This changes the computed Jupiter mean longitude by 7° for intervals containing 600 days. |
| Table VII, pp.115–116 vs Article 98 | The main table and Article 98 give the epoch as 236°.74, while one retyped secondary table gives 236°.14. The original scan and Example 45 use 236°.74. | Preserve the primary scan's reading; do not import the secondary transcription. |
| Table IX, p.117 vs Article 103 / Example 48, pp.76–77 | The table heading appears to say subtract 5 + 0.0001t, Article 103 gives 5 + 0.001t, and Example 48 uses a correction of 5.01 for t=18. | The article/example and table heading do not agree on the coefficient. The result differs over long intervals. |
| Example 41 / Example 43 vs Example 39 | The examples report slightly different total intervals/fractional days for the same Standard Horoscope, and the fractional product is inconsistent with a simple multiplication of the printed unit-column value. | A modern UTC-to-Ujjain conversion must not be tuned to one rounded example without preserving the printed convention and its rounding. |

The source itself says the tables were copied from Book of Fate; the 1992 edition does not reproduce that underlying work's derivation. The first-edition preface further notes that its worked examples reject fractions below 30 seconds of arc or time. This rounding rule must be reproduced, not replaced by modern floating-point precision and then described as identical.

## 3. Current product behavior

The Vedic chart adapter currently has true sidereal longitudes and daily motion, but does not generate the historical mean longitudes or Mercury/Venus apogee values required by Raman's method. The engine therefore returns non-luminary Cheshta Bala as unavailable, rather than using daily speed as a substitute.

That is intentional. A user-visible unavailable state is preferable to a confident but source-inconsistent result.

## 4. Acceptance requirements before the table provider is enabled

1. Obtain and compare Kedarnath Dutt's original Book of Fate table pages or a verified erratum for Tables IV–IX.
2. Resolve every discrepancy above and preserve the selected reading in a method/version identifier.
3. Encode the printed product tables as versioned source data, with the original epoch, timezone basis, integer/fractional interval policy, rounding and correction coefficients.
4. Reproduce Raman Examples 41, 43, 44, 45, 47 and 48, not only the final mean positions listed in Article 99/104. Every intermediate row product must agree within the source's stated rounding.
5. Convert all true positions into the same zodiac frame as the historical table positions; do not mix tropical true positions with sidereal mean longitudes.
6. Keep the source-table calculation selectable and disclose its historical model. Only after all reference cases pass should the live chart pass generated mean/apogee inputs to the Cheshta Kendra engine.

## 5. Source

[B. V. Raman, *Graha and Bhava Balas*, 13th edition (1992), scanned PDF](https://dn790000.ca.archive.org/0/items/1050-jyotish-books-with-siderial-zodiac/Bhava%20and%20Graha%20Balas_B.V.Raman%201996.pdf), especially pp. 68–81 (Chapter VI, Articles 86–107 and Examples 36–51) and pp. 112–117 (Tables IV–IX).

This is a primary source for Raman's exposition and the tables he reproduces, but it is not the original Book of Fate source. That distinction is material to the unresolved table conflicts.
## 6. Graha Yuddha / Yuddha Bala source-fidelity audit

**Review date:** 16 November 2026  
**Decision:** keep Yuddha Bala unavailable in live chart totals until event detection, winner and transfer conventions are explicit and testable. Do not silently substitute a one-degree ecliptic-longitude conjunction test.

### 6.1 What the sources establish

- **BPHS 27.20** gives the Shadbala adjustment after a war has been established: the strength difference between the two participating stellar planets is added to the victor and subtracted from the defeated planet. It does not, by itself, define the astronomical event-detection algorithm or fully specify how to avoid circularly including Yuddha Bala in the pre-transfer Shadbala difference.
- **BPHS 79.9** names Venus as victorious regardless of its north/south course; another planet is victorious when it is *saumyagata* in mutual conjunction. The Sanskrit phrase and its English rendering must be preserved with the selected edition. It must not be silently rewritten as higher zodiacal longitude. See the [Sanskrit text and transliteration](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-79/verse-9/).
- The Sanskrit of BPHS 79.9 itself says *parasparayutau* (mutually joined/connected); it does not print a numeric one-degree threshold in that verse. Some modern translations/teaching resources gloss the conjunction as within one degree. Celestia therefore treats that cutoff as an explicit editorial or lineage convention, not as a literal numeric statement in the verse.
- **Surya Siddhanta, chapter 7**, treats close planetary conjunctions using astronomical separation, latitude and apparent disc size. The modern scholarly paper by B. S. Shylaja and B. S. Shubha, *Conjunction of planets: procedures and examples from Indian astronomy texts* (Journal of Astrophysics and Astronomy 44, 80; DOI [10.1007/s12036-023-09967-3](https://doi.org/10.1007/s12036-023-09967-3)), explains the historical workflow: iterate to the conjunction, calculate the north–south separation, and compare it with the sum of apparent diameters to classify the event. This is a distinct astronomical lineage, not simply a synonym for the popular one-degree ecliptic-longitude rule.
- Some modern teaching/software implementations use a one-degree ecliptic-longitude threshold. Other technical teaching material proposes apparent-longitude separation. These are not interchangeable inputs; Celestia must label and expose each adopted algorithm rather than imply that all sources prescribe the same one-degree test.
- Winner conventions also differ in modern implementations: Venus/north-south position, apparent brightness/diameter, lower or higher longitude, or pre-war strength. A code implementation that chooses by greatest existing Kala/Shadbala total is a modern convention, not the direct wording of BPHS 79.9.

### 6.2 Specific implementation hazards

1. **Coordinate confusion:** zodiacal ecliptic longitude, apparent/equatorial position, ecliptic latitude and declination are different quantities. A higher zodiacal degree does not prove a planet is north of another.
2. **Boundary and wrap errors:** the pair separation must be circular (0° and 360° are adjacent); cross-sign pairs can qualify in a longitude-based profile. The source variant determines whether the criterion is ecliptic longitude or an apparent-sky conjunction.
3. **Winner ambiguity:** if the chosen source rule requires a north/south comparison, missing or nearly equal latitude/declination must yield an unresolved winner, not a guessed result.
4. **Three-planet clusters:** pairwise wars need deterministic pair enumeration and must not apply the same strength transfer repeatedly in an order-dependent way without a declared multi-body convention.
5. **Circular strength transfer:** BPHS 27.20 refers to the Shadbala difference, while Yuddha Bala itself is included in Kala Bala. The base strength used to calculate the transfer must be defined so the calculation does not solve itself by repeatedly feeding its own adjustment back into the difference.
6. **Conservation and sign:** a matched positive adjustment to the victor and negative adjustment to the defeated planet conserves the pair's combined subtotal. Missing inputs must not be represented by a fabricated zero.

### 6.3 Required profiles and acceptance tests before activation

- Add a named event profile for the conventional one-degree ecliptic-longitude method only if it is explicitly described as that convention, with the threshold's inclusive/exclusive boundary documented.
- Add a separate Surya Siddhanta astronomical-conjunction profile only after apparent geocentric positions, latitude, apparent angular diameters and the source's conjunction-time iteration are supplied by a validated ephemeris. Do not approximate it by comparing natal chart longitudes alone.
- Add an explicitly named BPHS victor profile for the Venus exception and the selected interpretation of *saumyagata*; preserve alternative translations/interpretations as separate options pending source review.
- Define whether the transfer uses pre-Yuddha total Shadbala or another source-attested base. Do not select an implementation merely because its output looks plausible.
- Tests must cover exact threshold boundaries, 0°/360° wrap, adjacent-sign pairs, excluded luminaries/nodes, Venus victory, missing latitude, unresolved near-ties, multi-body clusters, conservation of pairwise adjustment, and prevention of circular reapplication.

### 6.4 Position-provider and adapter audit

- `lib/astronomy/swissEphemeris.ts` already exposes `getApparentGeocentricEclipticPosition()`. It uses Astronomy Engine's geocentric vector with light-time and aberration corrections and transforms it to the true ecliptic of date. It returns unrounded tropical ecliptic longitude and latitude; it does **not** return right ascension or declination.
- `SwissPlanetPosition` also carries geocentric ecliptic latitude and distance, but its public result is rounded to 0.0001° for longitude/latitude and 0.00001 AU for distance. Display rounding must not be mistaken for physical ephemeris accuracy.
- `components/ShadbalaPanel.tsx` currently builds each engine planet input from `vedicData.planets[].siderealLongitude`, retrograde state and western daily speed. It reads the matching `westernData.planets` record for speed but currently discards its apparent geocentric longitude and latitude. Thus the Shadbala engine presently receives neither apparent geocentric coordinate as a dedicated field.
- This is an adapter gap, not proof that every required Yuddha coordinate is already solved. Before implementation, decide whether the selected source profile needs apparent ecliptic longitude/latitude, equatorial right ascension/declination, topocentric or geocentric positions, and apparent disc diameter. The present helper's coordinate frame must not be relabelled as declination or topocentric position.
- The safer next adapter is to compute the unrounded apparent geocentric ecliptic coordinates at the exact UTC birth instant, attach them under an explicitly named coordinate-frame object, and validate the time conversion against the chart's resolved UTC instant. The Yuddha engine should remain unavailable until its selected historical source profile's full input requirements are met.

### 6.5 Present product behavior
The Shadbala engine leaves Yuddha Bala null and includes it in the unavailable-component list. This is intentional and protects the displayed Shadbala subtotal from presenting an unsupported result as zero. The Shadbala panel now calls out this missing evidence explicitly.

### 6.6 Source-level distinction confirmed from the primary text

The source check adds an important distinction to the profile design:

- **BPHS 79.9 wording is not a fully specified coordinate API.** The verse reads *kujādiṣu jayī śukraḥ saumyago yāmyago'pi vā | jayī saumyagataścānyaḥ parasparayutau bhavet*. One Sanskrit-aware translation glosses *saumyaga / saumyagata* as moving in the northern course (*Uttarāyaṇa*) and *yāmyaga* as the southern course (*Dakṣiṇāyana*); other English renderings say simply “in the north / south.” The verse does not name a modern coordinate such as ecliptic latitude, declination, right ascension or zodiacal longitude. Until a named edition/commentary is selected and reconciled, a BPHS winner profile must preserve this ambiguity and must not silently map *saumyagata* to a higher zodiacal longitude or to one unqualified ephemeris field. Compare the [Sanskrit text, transliteration and word gloss](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-79/verse-9/) with the [alternate plain translation](https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-79/verse-9).
- **Sūryasiddhānta does contain a one-degree boundary, but not as a naked natal-longitude shortcut.** Chapter 7 first works toward the instant of longitude conjunction (7.2–7.6), then applies latitude / observer-geometry corrections to find the interval of the apparent positions (7.7–7.12), and gives apparent-diameter rules (7.13–7.14). Only in that chapter-specific context do 7.19–7.20 distinguish an *apasavya yuddha* interval below one degree from *samāgama* above one degree when both planets are strong. Verse 7.21 describes the victor as north-placed, brilliant and large, while also allowing a southern planet to win if powerful. See the [Burgess 1860 translation with Sanskrit and commentary](https://www.swaveda.com/texts/surya-siddhanta/7/) and the [Sanskrit/translation passage for 7.16–7.20](https://www.siva.sh/surya-siddhanta/7/16-20).
- **The modern scholarly reconstruction supports retaining the complete geometry.** Shylaja and Shubha (2023) describe the Sūryasiddhānta categories using the interval (d), the sum of apparent diameters (s), and a one-degree reference for *apasavya*. Their explanation distinguishes grazing / occultation, close conjunction and ordinary conjunction; it also describes calculation of conjunction time, north–south separation (*vikṣepa*) and comparison with apparent disc sizes. The paper explicitly discusses uncertainties in historical diameter and node estimates. [Journal of Astrophysics and Astronomy 44, article 80 (2023), DOI 10.1007/s12036-023-09967-3](https://doi.org/10.1007/s12036-023-09967-3).
- **Coordinate names must remain literal.** Sūryasiddhānta's *vikṣepa* in this procedure is a north–south / latitude quantity in the text's own construction; the chapter also derives apparent place using observer geometry. It must not be replaced with equatorial declination, topocentric altitude, or the app's rounded chart latitude without a derivation proving equivalence for the selected step. Similarly, a modern ecliptic latitude comparison is not by itself a reconstruction of all the chapter's apparent-position and disc-size operations.
- **Implication for Celestia:** keep at least three separately named decisions: (a) an explicitly conventional one-degree ecliptic-longitude event detector; (b) a BPHS winner interpretation with its selected translation of *saumyagata* and separate Venus exception; and (c) a Sūryasiddhānta apparent-conjunction / disc-geometry profile. They may share validated ephemeris primitives, but they must not share an undocumented event detector or winner function.

Additional acceptance tests for the Sūryasiddhānta profile: verify longitude-conjunction iteration for direct/direct, retrograde/retrograde and mixed-motion pairs; apparent-position correction across the relevant latitude signs; apparent interval immediately below, at and above the one-degree boundary; same-sign versus opposite-sign latitude; grazing/contact/overlap versus close-conjunction classification using source-derived apparent diameters; and the 7.21 brightness/size/north/south winner cases. A missing apparent diameter, observer geometry input or unresolved source interpretation must return unavailable, not fall back to a one-degree zodiac-longitude result.

The existing Astronomy Engine helper returns apparent geocentric ecliptic longitude/latitude of date, with light-time and aberration correction. That helper is a useful input primitive, but it does not alone reproduce Sūryasiddhānta's historical *drikkarman*, observer-geometry correction, angular-diameter model, or the complete conjunction-time iteration. The adapter audit above therefore remains open; the helper must not be promoted as a completed classical Graha Yuddha calculator.


## 7. Sthana Bala source reconciliation and fail-closed inputs

This section records the primary-source checks behind the current five-part Sthana Bala implementation. It deliberately separates a Sanskrit verse's wording, an editor/translator's rendering, Raman's worked method, and Celestia's current selectable profiles.

### 7.1 Source hierarchy and rulings

- **Saptavargaja scoring scale:** BPHS Chapter 27, verses 2–4, as translated by R. Santhanam, gives the dignity values 45 (Moolatrikona), 30 (own), 20 (great friend), 15 (friend), 10 (neutral), 4 (enemy), and 2 (great enemy), then directs that the remaining six varga occupations are also evaluated and added. Celestia exposes these as the `bphs-santhanam` scale. Raman's *Graha and Bhava Balas*, Chapter III, Article 30, instead prints 45 / 30 / 22.5 / 15 / 7.5 / 3.75 / 1.875. The `raman-halving` scale is separate; the two tables must not be averaged or silently mixed.
- **Moolatrikona scope:** Raman, Article 30, explicitly says the 45-Shashtiamsa Moolatrikona award is given only when the planet occupies its Moolatrikona *Rasi*, not when one of the other six vargas is merely owned by that planet. The current D1-only scope follows that explicit Raman rule. BPHS 27.2–4 and its translations have been interpreted differently on this point, so Celestia must describe D1-only as a selected source lineage, not as a universally undisputed reading of the Sanskrit.
- **Ojayugma:** BPHS 27.5 states that Venus and the Moon receive the quarter-strength in even signs and the other planets in odd signs; the same rule applies to the corresponding Navamsa. One quarter of a Rupa (60 Virupas) is 15 Virupas, independently for Rasi and Navamsa. Celestia therefore tests both divisional signs independently, including Mercury and Saturn among “the others.”
- **Kendradi:** BPHS 27.5 names Kendra, Panaphara and Apoklima and assigns full, half and quarter strength (60 / 30 / 15 Virupas). Raman, Articles 32–35, explicitly counts these from the Rasi/sign chart: he records disagreement between counting Rasis and Bhavas, says Parashara inclines toward Rasi counting, notes the Sripati commentator and Balabhadra favor Bhava counting, and chooses the Rasi view for his own calculation. Celestia's present `calculateSthanaBala` is this named sign-based profile. It does not claim to implement the alternative Bhava-cusp profile.
- **Drekkana:** BPHS 27.6 Sanskrit reads `ādyamadhyāvasāneṣu dreṣkāṇeṣu sthitāḥ kramāt puṁnapuṁsakayoṣā-ākhyāḥ`: in sequence, first / middle / last decanate and masculine / neuter / feminine. The verse therefore supports male planets in the first, neuter planets in the middle, and female planets in the last decanate. The seven-planet gender groups are Sun/Mars/Jupiter (male), Mercury/Saturn (neuter), and Moon/Venus (female). The R. Santhanam English translation/notes are preserved as a separately named alternate order in the code rather than overwriting the Sanskrit sequence. Raman's Articles 36–40 and his worked example support the Sanskrit/Raman sequence in the current default profile.

### 7.2 Implementation safeguards added

- `calculateSthanaBala` now rejects a target outside the seven classical grahas instead of substituting an exaltation point of 0° and attempting to compute a false positional score.
- A missing, non-finite, negative, or 360°-and-above Ascendant no longer falls through to the default 15-Virupa Apoklima value. `kendradiBala` is `null`, the component is listed as unavailable, and the displayed Sthana subtotal excludes it. Other independently computable components remain visible as a partial subtotal.
- Regression coverage now exercises `NaN`, positive infinity, a negative longitude, and 360°; checks the null/availability/unavailable-component contract; verifies the subtotal excludes the missing Kendradi value; and asserts non-classical targets are rejected.
- The branch's current sign-based Kendradi method still requires a valid normalized Ascendant longitude in `[0°, 360°)`. No Bhava house is inferred from a Rasi sign and no 15-Virupa default is inserted for invalid input.

### 7.3 Remaining source-profile work

A genuine Bhava-based Kendradi alternative requires an explicit, validated set of twelve Bhava middles/cusps from the selected house system and a documented rule for deriving the Bhava interval containing a planet. The present Shadbala caller supplies the sidereal Ascendant and planetary longitudes, but does not yet select and pass a Bhava-cusp array for this purpose. Do not turn the current sign-based score into a purported Bhava score by reusing Western house cusps or by assuming that a Bhava cusp list is self-describing. Add the alternate profile only after the Vedic house system, cusp semantics, cyclic boundary policy, and source lineage are made explicit and independently tested.

### 7.4 References

- BPHS Chapter 27, verse 5, Sanskrit and translation: [Enjoy Learning Sanskrit](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-27/verse-5/) and [Siva.sh](https://www.siva.sh/brihat-parashara-hora-shastra/27/5).
- BPHS Chapter 27, verse 6, Sanskrit, IAST, and word-by-word morphology: [Enjoy Learning Sanskrit](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-27/verse-6/).
- R. Santhanam (translator, commentator, editor), *Brihat Parashara Hora Sastra*, Volume I, Chapter 27, especially pp. 263–267: [Internet Archive full-text transcription](https://archive.org/stream/BPHSEnglish/BPHS%20-%201%20RSanthanam_djvu.txt).
- B. V. Raman, *Graha and Bhava Balas*, Chapter III, Articles 30–40 (Saptavargaja scope/scale, Ojayugma, Kendradi sign-versus-Bhava discussion, Drekkana and worked examples): [scanned edition](https://dn790000.ca.archive.org/0/items/1050-jyotish-books-with-siderial-zodiac/Bhava%20and%20Graha%20Balas_B.V.Raman%201996.pdf).

The current Shadbala feature remains partial overall. This Sthana Bala work improves source traceability and input integrity; it does not complete the six-fold Shadbala or resolve Yuddha Bala, Cheshta source tables, and independent full-chart reconciliation.


## 8. Dig Bala source audit and directional-input integrity

### 8.1 BPHS rule and Raman's geometric explanation

BPHS Chapter 27, verses 7–8, defines Dig Bala from the powerless cardinal point. The stated subtraction pairs are: the 4th/Nadir for Sun and Mars; the 7th/Descendant for Jupiter and Mercury; the 10th/Meridian for Moon and Venus; and the Ascendant for Saturn. If the directed difference exceeds 180°, it is folded back from 360°, then divided by 3 to obtain Virupas.

Raman, *Graha and Bhava Balas*, Chapter IV, Articles 41–45, spells out the directions and interpolation: Ascendant = east; 10th/Meridian = south; Descendant/7th = west; Nadir/4th = north. Peak assignments are Jupiter/Mercury at the Ascendant, Sun/Mars at the 10th/Meridian, Saturn at the Descendant, and Moon/Venus at the 4th/Nadir. The opposite point is powerless; the adjusted ecliptic arc from that powerless point divided by 3 gives Dig Bala, with a maximum 60 and minimum 0.

The present code computes distance to the *powerful* point and uses `(180° − distanceToPeak) / 3`. This is algebraically equivalent because Raman describes the powerless point as exactly 180° from the peak. It is not a different scoring formula.

### 8.2 Chart angle versus approximation

- Sun and Mars require the chart-derived sidereal meridian (MC) for the exact south/10th peak; Moon and Venus require its exact opposite (IC/Nadir) for the north/4th peak.
- Jupiter and Mercury need only the sidereal Ascendant for the east/1st peak. Saturn needs only its exact opposite, the Descendant/west/7th peak. These three do **not** depend on the MC.
- If MC is genuinely absent, the compatibility fallback remains `Ascendant + 270°` for Sun/Mars and `Ascendant + 90°` for Moon/Venus. Neither is guaranteed to equal the actual MC/IC; the component is now marked estimated and its description says so. Jupiter, Mercury and Saturn remain exact from the Ascendant even when MC is absent.
- An explicitly supplied but invalid MC is not treated as “missing”; the affected MC/IC-dependent component is unavailable. A missing/invalid target longitude is unavailable, and a non-classical target is rejected. Jupiter/Mercury/Saturn also require a normalized Ascendant. A valid MC can still determine Sun/Mars/Moon/Venus Dig Bala if Ascendant metadata is unavailable; in that case the diagnostic whole-sign `actualHouse` is null, not fabricated.
- `calculateShadbala` treats an unavailable Dig Bala as a missing component, excludes it from the available subtotal, and adds a method-estimate note only when the four MC/IC-dependent planets actually use the fallback. The panel differentiates “Unavailable” from “approximate”.

### 8.3 Raman Standard Horoscope benchmark and printed arithmetic

Raman's Standard Horoscope gives the sidereal Ascendant 298°27′ and angular midpoints around the chart. Example 14 (printed p. 32) lists the powerless-point arcs: Sun 144°18′, Moon 94°41′, Mars 167°05′, Mercury 63°05′, Jupiter 34°26′, Venus 45°26′, Saturn 174°04′. Example 15 (printed p. 33) divides these by three.

The new independent regression rebuilds the chart from Raman's printed planetary longitudes and the 1st/4th/7th/10th angular midpoints. It checks the resulting values (rounded to two decimals) as Sun 48.10, Moon 31.56, Mars 55.70, Mercury 21.03, Jupiter 11.48, Venus 15.14, Saturn 58.02. This deliberately follows the printed arcs and the printed divide-by-three rule: the Example 15 final-value column contains small arithmetic/rounding discrepancies for Mercury and Jupiter (63°05′ / 3 = 21.03, not the printed 21.09; 34°26′ / 3 = 11.48, not the printed 11.50). The engine does not hard-code the inconsistent final-value cells.

### 8.4 Regression coverage added

- All seven grahas receive 60 Virupas at their source-defined directional peaks.
- The Raman Standard Horoscope is recomputed independently from the source chart positions and angle midpoints.
- No-MC cases prove that only Sun/Mars/Moon/Venus are estimated; Jupiter/Mercury/Saturn remain exact.
- Invalid explicit MC values, invalid Ascendants for Ascendant-dependent peaks, missing/non-normalized target longitudes, and non-classical targets cannot produce a numeric Dig Bala.
- The suite checks linear interpolation at 90° and 180° and wraparound across 0°/360°.
- The UI now shows unavailable and estimated components distinctly, rather than exposing an invalid numeric score.

### 8.5 References

- BPHS Chapter 27, verse 7 (Sanskrit, transliteration and English Dig Bala rule): [Siva.sh](https://www.siva.sh/brihat-parashara-hora-shastra/27/7).
- BPHS Chapter 27, verses 7–8 (text and translation context): [Jyotish Vidya, Chapter 27](https://jyotishvidya.com/ch27.htm).
- B. V. Raman, *Graha and Bhava Balas*, 13th edition (1992), Chapter IV, Articles 41–45 and Examples 14–15, printed pp. 30–33: [scanned edition](https://dn790000.ca.archive.org/0/items/1050-jyotish-books-with-siderial-zodiac/Bhava%20and%20Graha%20Balas_B.V.Raman%201996.pdf). The directional assignments and arc rule appear on PDF pages 34–35; the worked arcs and values appear on PDF pages 36–37.

This audit verifies the direction/arc formula and hardens input integrity. It does not make the overall Shadbala complete: the six-fold status stays partial, and remaining Kala/Cheshta/Yuddha and full-chart independent reconciliation gaps remain open.


## 9. Unknown-birth-time angle guard

The natal Ascendant, Descendant, Midheaven and Nadir depend on the actual birth instant and location. A chart UI may still populate finite angle values from a noon placeholder when time is unknown; numeric validity alone must not turn those values into natal angles.

Celestia now treats `birthTimeKnown === false` as a hard stop for angle-dependent strength:
- Sthana Bala keeps its independently computable terms, but Kendradi Bala is null, listed as unavailable, and excluded from the partial subtotal.
- Dig Bala is unavailable for all seven grahas because each classical directional peak requires a reliable Ascendant/Descendant or MC/IC. A supplied finite placeholder MC does not override the unknown-time flag.
- This does not invalidate longitude-only Sthana components by itself, nor does it make the whole Shadbala complete. Other planetary positions in an unknown-time chart still need their own precision/status audit.

Regression tests now use finite Raman-chart angles with `birthTimeKnown: false` and verify that neither Kendradi nor Dig Bala treats them as exact. The behavior is fail-closed rather than silently using noon-derived cardinal points.

The Shadbala result now also carries a visible estimate note for unknown-time charts: longitude-derived values use the chart's representative instant, and the engine does not yet evaluate an intraday ephemeris range to prove that signs, vargas, paksha relationships, and aspect classes remain unchanged. The detail panel lists the actual estimate/validation reasons rather than showing only their count.


## 9. Shadbala minimum-strength thresholds: BPHS versus Raman

This audit found that the current engine's single threshold table was valid for the BPHS chapter 27 rule, but it was not universal across the two primary source traditions already represented in the Shadbala panel.

### 9.1 BPHS Chapter 27, verses 32–33

The Sanskrit number-verse (27.32) gives the sequence for the Sun and the planets that follow it: thirty-nine, thirty-six, thirty, forty-two, thirty-nine, thirty-three and thirty, each multiplied by ten. Verse 27.33 says that when the total of the Sun and the others reaches the respective figure they are considered *subalin* (strong); when it exceeds the figure, the strength is complete/full.

The resulting BPHS table, in the seven-graha order Sun / Moon / Mars / Mercury / Jupiter / Venus / Saturn, is:

| Graha | Virupas | Rupas |
|---|---:|---:|
| Sun | 390 | 6.5 |
| Moon | 360 | 6.0 |
| Mars | 300 | 5.0 |
| Mercury | 420 | 7.0 |
| Jupiter | 390 | 6.5 |
| Venus | 330 | 5.5 |
| Saturn | 300 | 5.0 |

The engine's existing `REQUIRED_RUPAS` table matches this sequence exactly. The threshold is a total Shadbala minimum; it is not a component-by-component guarantee and does not convert an incomplete component subtotal into a complete classification.

### 9.2 B. V. Raman, *Graha and Bhava Balas*, Article 122

Raman's Article 122, "Powerful Planets", gives his separate minimums in Rupas: Sun 5, Moon 6, Mars 5, Mercury 7, Jupiter 6.5, Venus 5.5 and Saturn 5. In Virupas this is 300 / 360 / 300 / 420 / 390 / 330 / 300.

Only the Sun differs from the BPHS 27.32–33 table: 300 Virupas (5 Rupas) in Raman Article 122, versus 390 Virupas (6.5 Rupas) in BPHS. A single unnamed `REQUIRED_RUPAS` selector would therefore make a source-specific difference invisible to the user. The engine now exposes two explicit profiles:

- `bphs-27-32-33` — default; the seven BPHS totals above.
- `raman-article-122` — Raman's seven Article 122 minimums.

The Shadbala panel includes a visible "Required Shadbala threshold source" selector. Switching it changes only `requiredRupas`, `requiredVirupas`, and the corresponding ratio/threshold comparison. It must not change any of the six component scores or the available Virupa subtotal.

### 9.3 Guardrails and regression tests

- The engine defaults to BPHS to preserve existing behavior, but reports the selected threshold method in every `ShadbalaResult`.
- Unknown threshold method identifiers throw rather than falling back to BPHS or to an arbitrary 5-Rupa default.
- The test suite checks all seven entries in both tables, verifies the expected default, verifies the Raman alternative, and proves that switching profiles leaves the available subtotal unchanged.
- Partial Shadbala remains partial: a selected minimum cannot bypass missing Yuddha Bala, incomplete Cheshta data, unavailable birth-angle input, unverified component methods or the global implementation status. Strong/weak classification remains withheld until completeness conditions are met.
- The result does not imply that reaching a numerical minimum makes a planet benefic. Strength and functional benefic/malefic nature remain separate judgements.

### 9.4 Primary references

- **BPHS Chapter 27, verses 32–33:** [Sanskrit verse 32 and translation](https://www.siva.sh/brihat-parashara-hora-shastra/27/32); [verse 33 and translation](https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-27/verse-33). R. Santhanam's full-text edition is also available at [Internet Archive](https://archive.org/stream/brihatparasarahorashastrabyr.santhanam/Brihat%20Par%C4%81%C5%9Bara%20Hor%C4%81%20%C5%9Ah%C4%81stra%20By%20R.%20Santhanam_djvu.txt).
- **B. V. Raman, *Graha and Bhava Balas*, Chapter VIII, Article 122 and Example 57:** [scanned edition](https://dn790000.ca.archive.org/0/items/1050-jyotish-books-with-siderial-zodiac/Bhava%20and%20Graha%20Balas_B.V.Raman%201996.pdf). Article 122 expressly gives Sun 5, Moon 6, Mars 5, Mercury 7, Jupiter 6.5, Venus 5.5 and Saturn 5 Rupas.

The distinction is now visible and testable. Neither table is treated as an error or silently substituted for the other. The current Shadbala engine is still marked partial overall; this threshold correction does not complete the underlying six Bala calculations.


## 10. Naisargika Bala precision: BPHS 27.14 versus Raman Article 108

A cross-check of the fixed natural-strength table found that the former engine values were a mixed precision convention: Venus and Jupiter used Raman's truncated decimals, while Mercury used the rounded BPHS-style value. The mixed table was not a faithful representation of either source.

### 10.1 BPHS Sanskrit formula

BPHS Chapter 27, verse 14, gives a single exact construction: one Rupa (60 Virupas) divided by seven, multiplied successively by 1 through 7 for the planets ordered from Saturn up to the Sun. Reading the sequence upward gives:

| Graha | Exact construction | BPHS Virupas (rounded to 2 dp) |
|---|---:|---:|
| Saturn | 60 × 1/7 | 8.57 |
| Mars | 60 × 2/7 | 17.14 |
| Mercury | 60 × 3/7 | 25.71 |
| Jupiter | 60 × 4/7 | 34.29 |
| Venus | 60 × 5/7 | 42.86 |
| Moon | 60 × 6/7 | 51.43 |
| Sun | 60 × 7/7 | 60.00 |

The engine's default `bphs-sevenths-rounded` method follows this formula and rounds the exact fractions to two decimal places. For the component result, it uses the two-decimal value as the Virupa contribution, just as the rest of the displayed Shadbala table is reported at two decimals.

### 10.2 Raman's printed decimal convention

Raman, *Graha and Bhava Balas*, Chapter VII, Article 108 and Example 52, says the decimal values are expressed for convenience and prints: Sun 60.00, Moon 51.43, Venus 42.85, Jupiter 34.28, Mercury 25.70, Mars 17.14 and Saturn 8.57. That table truncates rather than rounds the recurring sevenths at three positions: Venus, Jupiter and Mercury. The engine now preserves those printed values under the distinct `raman-article-108` choice.

The selected method is passed into the Shadbala engine and exposed in the panel as "Naisargika Bala source". The two choices are not blended. The result's Naisargika subcomponent reports which method was used.

### 10.3 Integrity checks

- The static default `NAISARGIKA_POINTS` now matches the BPHS exact-sevenths-rounded table.
- A separate `RAMAN_NAISARGIKA_POINTS` table preserves Raman Article 108's literal printed decimals, including Mercury 25.70.
- The regression tests verify all seven planets under both methods and the three differing values independently.
- Integration tests verify that the selected natural-strength value is recorded in the result and that an unknown method identifier throws rather than silently falling back.
- The benchmark case now cites BPHS Chapter 27, verse 14, not an unrelated Shadbala/Drik passage; its expected values match the selected BPHS formula.

### 10.4 Primary references

- BPHS Chapter 27, verse 14, Sanskrit, transliteration and word-by-word explanation: [Enjoy Learning Sanskrit](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-27/verse-14/) and [Siva.sh](https://www.siva.sh/brihat-parashara-hora-shastra/27/14).
- B. V. Raman, *Graha and Bhava Balas*, Chapter VII, Article 108 and Example 52: [scanned edition](https://dn790000.ca.archive.org/0/items/1050-jyotish-books-with-siderial-zodiac/Bhava%20and%20Graha%20Balas_B.V.Raman%201996.pdf).

This refinement changes only the Naisargika Bala contribution by the source's rounding/truncation difference. It does not make the overall six-fold Shadbala implementation complete; source-specific Cheshta/Yuddha coverage and whole-chart reconciliation remain outstanding.


## 11. Uchcha Bala deep-exaltation reference points

A source-anchored boundary suite has been added for the seven exaltation points used by the Sthana Bala Uchcha calculation.

BPHS Chapter 3, verses 49–50, identifies the exaltation signs and their deep-exaltation degrees; verse 50 uses the traditional numerical-word encoding for the degrees. In absolute zodiac longitudes (Aries 0°), the seven points are Sun 10°, Moon 33° (3° Taurus), Mars 298° (28° Capricorn), Mercury 165° (15° Virgo), Jupiter 95° (5° Cancer), Venus 357° (27° Pisces), and Saturn 200° (20° Libra). The opposite point is the deep-debilitation point.

BPHS Chapter 27, verses 1–2, defines Uchcha Bala as the shorter arc from deep debilitation, converted to degrees and divided by three. Equivalently, the score is the distance from deep exaltation divided by three, with the shortest circular distance capped at 180°: maximum 60 Virupas at deep exaltation, zero at deep debilitation, and 30 at a 90° offset.

The Sthana Bala regression now verifies, for all seven grahas, all three invariants: exact 60 at the deep-exaltation point, exact 0 at the opposite deep-fall point, and exact 30 at the halfway point. This covers points in multiple signs, including the 0°/360° wraparound risk for Venus at 27° Pisces. The constant is explicitly documented as normalized ecliptic longitudes rather than degrees within each sign.

References: [BPHS Chapter 3, verse 50 (Sanskrit / IAST / translation)](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-3/verse-50/); [BPHS Chapter 27, verses 1–2](https://www.siva.sh/brihat-parashara-hora-shastra/27/1-2).

## 7. Runtime validation of source ephemeris inputs

**Review date:** 17 November 2026  
**Decision:** reject malformed finite longitudes at the chart-facing boundary; retain the strict low-level Chesta Kendra primitive and the unavailable status for missing or invalid source data.

The source formula and source-table decision are unchanged. BPHS 27.24–25 describes the mean/true-longitude midpoint relative to the planet's own movable apogee and divides the reduced Kendra by three. The Sanskrit verse and modern translations differ in how explicitly they render the six-sign reduction; Raman's Chapter VI Articles 105–107 and Examples 49–51 provide a directly reproducible worked convention. The existing benchmark reproduces all five planets in Raman's Standard Horoscope from the published inputs.

A review of the calling boundary exposed an error-handling gap: a finite mean longitude or Seeghrocha outside the normalized zodiac interval could pass the "missing value" check and then throw inside the strict primitive. The chart now checks each source longitude before calling that primitive:

- Superior planets (Mars, Jupiter and Saturn): the planet's own mean longitude and the mean-Sun longitude used as its Seeghrocha.
- Inferior planets (Mercury and Venus): the mean-Sun longitude used as their mean position and the planet-specific Seeghrocha/apogee.
- Every supplied mean/true/Seeghrocha longitude must be finite and normalized to [0°, 360°). A finite value outside that interval now yields an explicit unavailable result with zero *available contribution*, rather than throwing or manufacturing a score.
- The low-level `calculateCheshtaKendra` primitive remains strict and continues to throw on invalid direct calls. This separates developer misuse of the mathematical primitive from malformed data arriving through the chart adapter.
- The five-planet regression suite now covers out-of-range mean-Sun, superior-planet mean, and Mercury/Venus apogee values, and verifies that full chart calculation remains incomplete without throwing.

**Coordinate-frame limitation:** range checks cannot identify whether an input is tropical or sidereal. The caller must supply the mean longitude, true longitude and Seeghrocha in one declared zodiac frame. The engine now states that requirement in its input contract and returns an unavailable result only for detectable numeric violations; it does not guess an ayanamsa or silently transform one source table into another frame.

**Scope explicitly not completed:** no automatic mean-motion or Mercury/Venus apogee provider has been enabled. Raman's Tables IV–IX still have the discrepancies documented in Sections 2 and 4, and the original Kedarnath Dutt *Book of Fate* tables or a verified erratum are still needed before a historical table implementation can be advertised as source-faithful. Daily apparent speed remains diagnostic only, not a substitute for the missing mean and apogee values.

### References

- BPHS Chapter 27, verses 21–25: [Sanskrit and translation](https://www.siva.sh/brihat-parashara-hora-shastra/27/21-25); [verse 24 Sanskrit, transliteration, and word analysis](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-27/verse-24/); [verse 25](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-27/verse-25/).
- B. V. Raman, *Graha and Bhava Balas*, Chapter VI, Articles 86–107 and Examples 49–51: [scanned 13th edition](https://dn790000.ca.archive.org/0/items/1050-jyotish-books-with-siderial-zodiac/Bhava%20and%20Graha%20Balas_B.V.Raman%201996.pdf).
