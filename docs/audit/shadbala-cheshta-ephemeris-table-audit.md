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

### 6.4 Present product behavior

The Shadbala engine leaves Yuddha Bala null and includes it in the unavailable-component list. This is intentional and protects the displayed Shadbala subtotal from presenting an unsupported result as zero. The Shadbala panel now calls out this missing evidence explicitly.