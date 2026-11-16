# Shadbala Sthana Bala source and implementation audit

**Review date:** 16 November 2026  
**Scope:** BPHS Chapter 27 positional strength (Sthana Bala), with emphasis on Ojayugma and Drekkana rules.  
**Status:** Ojayugma implementation corrected and covered by a dedicated CI regression suite. This does not certify the whole Shadbala module as complete.

## 1. Primary-text rule: Ojayugma Rāśi and Aṃśa

The Sanskrit of BPHS Chapter 27, verse 5 in the Enjoy Learning Sanskrit transcription reads:

`शुक्रेन्दू समभांशेऽन्ये विषमेऽङ्घ्रिमितं बलम् । केन्द्रादिषुस्थिताः खेटाः पूर्णाऽर्धाऽङ्घ्रिमितं क्रमात् ॥५॥`

The operative wording is `śukra-indū samabhāṃśe anye viṣame`: Venus and Moon receive a quarter-unit in even signs; the “others” receive it in odd signs. The following Kendradi clause in the same verse gives full, half and quarter strength for the angular, succedent and cadent groups. A separate numbering/transliteration at Jyotish Vidya labels Ojayugma as 4½ and Kendradi as verse 5; therefore Celestia records source numbering and verse content rather than treating chapter verse labels as universal across editions.

BPHS applies the sign condition to the Rāśi and to the Navāṃśa. The rule is not based on the planet's gender. In particular:
- Sun, Mars, Jupiter, Mercury and Saturn: 15 Virupas for an odd Rāśi and another 15 for an odd Navāṃśa.
- Moon and Venus: 15 Virupas for an even Rāśi and another 15 for an even Navāṃśa.

The previous engine code used a male-versus-everyone-else branch. That incorrectly placed neuter Mercury and Saturn in the Moon/Venus even-sign group. This was a correctness bug, not a stylistic choice.

## 2. Correction made in Celestia

`lib/vedic/shadbalaEngine.ts` now applies the two explicit groups:
- `Moon` and `Venus` are checked for even Rāśi and even Navāṃśa.
- Every other classical graha is checked for odd Rāśi and odd Navāṃśa.

Each qualifying placement adds 15 Virupas, so the combined Ojayugma component ranges from 0 to 30. Navāṃśa is now obtained through the shared `calculateDivisionalSignIndex(longitude, "D9")` function. This removes a duplicate D9 formula and inherits the canonical half-open boundary handling at exact 3°20′ segment boundaries.

The new `scripts/testShadbalaSthanaBalaSuite.ts` regression suite covers:
- all seven grahas receiving 30 when both sign and Navāṃśa match their BPHS 27.5 group;
- all seven receiving zero when neither placement matches;
- isolated 15-point Rāśi-only and Navāṃśa-only cases;
- exact and immediately-before 3°20′ Navāṃśa boundary behavior;
- the decanate/class sequence in BPHS 27.6;
- the suite is registered in `.github/workflows/verify.yml`.

## 3. Drekkana Bala source reading

BPHS 27.6 in the Sanskrit transcription reads:

`आद्यमध्यावसानेषु द्रेष्काणेषु स्थिताः क्रमात् । पुंनपुंसकयोषाख्या दद्युरङ्घ्रिमितं बलम् ॥६॥`

The wording orders the first, middle and last Drekkana with the labels `puṃ`, `napuṃsaka`, and `yoṣā` respectively: masculine, neuter and feminine. This is also the rule stated in B. V. Raman's primary book, *Graha and Bhava Balas*, Chapter III, Article 36, and confirmed by its Standard Horoscope Example 12 (printed pp. 27–28; PDF pages 31–32). Under this profile:
- masculine: Sun, Mars, Jupiter — first Drekkana;
- neuter: Mercury, Saturn — middle Drekkana;
- feminine: Moon, Venus — last Drekkana.

A second, materially different reading appears in R. Santhanam's *Brihat Parasara Hora Sastra*, Vol. I, Chapter 27, printed pp. 266–267. Its English translation and explanatory notes explicitly give masculine / feminine / eunuch in the first / second / third Drekkana. The Sanskrit line printed in that edition also differs from the fuller `puṃ-napuṃsaka-yoṣā` wording preserved in the Sanskrit transcription above. Celestia records this as a distinct **Santhanam Vol. I edition/translation profile**, rather than silently rewriting it as the wording of every BPHS Sanskrit witness.

Celestia now exposes both choices:
- `bphs-sanskrit-raman` (default): masculine / neuter / feminine in first / middle / last, matching the cited Sanskrit transcription and Raman Article 36 / Example 12.
- `santhanam-english-translation`: masculine / feminine / eunuch in first / second / third, matching Santhanam Vol. I's printed English explanation and notes.

The regression suite tests both profiles on individual decanates and uses the exact planetary longitudes from Raman's primary Standard Horoscope to reproduce Example 12: Sun and Venus receive 15 Virupas under the Sanskrit/Raman profile, while the other five receive zero. It separately checks the Santhanam ordering, where the Moon in the second decanate and Mercury/Saturn in the third qualify. This keeps a real edition discrepancy visible rather than choosing one silently.

## 4. Raman Standard Horoscope: primary Saptavargaja reconciliation

The prior regression fixture had used a secondary web article's altered chart transcription and recalculated varga cells. Direct inspection of Raman's book scan shows that those values do not faithfully reproduce his printed Standard Horoscope. Celestia's test now uses the actual nirayana longitudes printed on p. 2 and the D1/D2/D3/D7/D9/D12/D30 dignity grid in Example 6 (printed p. 20).

Recomputing the values from the primary dignity cells gives the following expected seven-varga totals:

| Graha | Raman halving scale | BPHS / Santhanam scale |
| --- | ---: | ---: |
| Sun | 90.00 | 100 |
| Moon | 48.75 | 57 |
| Mars | 90.00 | 100 |
| Mercury | 135.00 | 125 |
| Jupiter | 71.25 | 79 |
| Venus | 116.25 | 114 |
| Saturn | 97.50 | 100 |

This table is independently supported by Raman's Example 6 dignity grid (printed p. 20) and Example 9 worked score table (printed pp. 23–24). There is one source arithmetic discrepancy: Example 9 prints the Moon total as 49.750, while its seven visible cells (3.750 + 7.500 + 7.500 + 15.000 + 3.750 + 7.500 + 3.750) sum to **48.750**. Celestia's regression uses the itemized cell sum and documents the printed mismatch; it does not hard-code a result that contradicts the source's own addends.

The code's D2, D3, D7, D9, D12 and D30 mappings reproduce the individual dignity placements in Raman's table for these longitudes. This is a narrow but meaningful worked-chart verification; it does not validate every possible varga boundary, alternate D30 tradition or every edition of BPHS. The source-specific regression lives in `scripts/testShadbalaRamanReferenceSuite.ts`.

## 5. Other Sthana Bala choices that remain source-labelled

- **Saptavargaja:** D1, D2, D3, D7, D9, D12 and D30 are calculated separately. The BPHS/Santhanam point scale and Raman's halving scale remain selectable; the natural/temporary relationship derivation and Moolatrikona policy are documented in the engine status and dedicated tests. Raman Article 30 (printed p. 23) explicitly states that 45 Virupas for Moolatrikona is awarded only in the Rāśi, not when a planet occupies its Moolatrikona sign in any of the other six vargas. The code follows this D1-only rule. A new regression puts the Sun in Leo in D3 and D9 while its D1 longitude is Aries; it verifies that those varga placements score as own-sign 30, not 45, under both scoring scales.
- **Kendradi:** the current implementation counts the house from the Rāśi sign of the Ascendant (Kendra 60, Panaphara 30, Apoklima 15). Raman identifies sign-counting as the Parāśara approach and records a bhava-based alternative from Balabhadra. The current choice is therefore a declared lineage, not a universal claim.
- **Uchcha:** the current calculation folds angular distance from deep debilitation and divides by three. A complete independent multi-planet worked-chart reconciliation is still required before this component or the aggregate Shadbala can be declared fully validated.

## 6. Raman Example 13: all five Sthana Bala components together

The regression suite now reconstructs all five components on the same primary-source Standard Horoscope using the Raman halving Saptavargaja scale and the BPHS Sanskrit/Raman Drekkana order. Raman's Example 13 (printed pp. 23–24) provides the worked comparison:

| Graha | Uchcha (source rounded) | Saptavargaja | Ojayugma | Kendradi | Drekkana | Sthana total (source) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Sun | 3.00 | 90.00 | 30 | 60 | 15 | 198.00 |
| Moon | 32.75 | 48.75 | 15 | 30 | 0 | 126.50 |
| Mars | 37.06 | 90.00 | 15 | 30 | 0 | 172.06 |
| Mercury | 54.50 | 135.00 | 30 | 60 | 0 | 279.50 |
| Jupiter | 56.33 | 71.25 | 15 | 15 | 0 | 157.58 |
| Venus | 1.95 | 116.25 | 30 | 15 | 15 | 178.20 |
| Saturn | 34.80 | 97.50 | 15 | 30 | 0 | 177.30 |

The exact-value tests require Saptavargaja, Ojayugma, Kendradi and Drekkana to agree with the itemized source table. Uchcha and the resulting total are compared within 0.15 Virupa because Raman prints rounded/truncated component values; this tolerance is explicit and does not relabel his rounded presentation as exact. The full five-part comparison is in `scripts/testShadbalaSthanaBalaSuite.ts`.

## 7. Sources

- [BPHS Chapter 27, verse 6 — Sanskrit, IAST and grammatical word meanings](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-27/verse-6/), supporting the masculine / neuter / feminine wording.
- [R. Santhanam, Brihat Parasara Hora Sastra, Vol. I](https://storage.yandexcloud.net/j108/library/hr6fkynz/Maharishi_Parashara_-_Brihat_Parasara_Hora_Sastra_%28Vol._1%29.pdf), Chapter 27, printed pp. 266–267: its English translation and explanatory notes specify masculine / feminine / eunuch in the first / second / third decanates.
- [B. V. Raman, Graha and Bhava Balas, 13th ed. scan](https://dn790000.ca.archive.org/0/items/1050-jyotish-books-with-siderial-zodiac/Bhava%20and%20Graha%20Balas_B.V.Raman%201996.pdf), Article 30 for D1-only Moolatrikona (printed p. 23; PDF page 26), Examples 6/9/13 for Saptavargaja and total Sthana Bala (printed pp. 20, 23–24; PDF pages 23, 26–28), and Article 36 / Example 12 for Drekkana (printed pp. 27–28; PDF pages 31–32).
- [BPHS Chapter 27, verses 1–5](https://www.siva.sh/brihat-parashara-hora-shastra/27/1-5), showing an alternative presentation/numbering of positional-strength rules.
- [Sthana Bala worked comparison of BPHS and B. V. Raman](https://www.livepanditji.com/blog/sthana-bala-saptavargaja-ojayugma-kendradi-drekkana/), a secondary audit aid only; its Drekkana labels misattribute the Raman order and its Standard Horoscope longitudes differ from Raman's primary scan. Celestia's regression fixture now uses Raman's printed source positions.

## 8. Validation boundary

Passing the targeted regression suite establishes that the Ojayugma groups and both selected Drekkana profiles follow their declared source methods. It does not prove the whole Sthana Bala total against every BPHS edition or Raman worked example, and it does not resolve all Saptavargaja, Kendradi or Uchcha Bala variants. The overall Shadbala implementation remains explicitly **partial / approximate** until all six components are source-complete and independently checked against end-to-end worked charts.
