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