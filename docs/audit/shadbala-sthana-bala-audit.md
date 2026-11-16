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

BPHS 27.6 in the same Sanskrit transcription reads:

`आद्यमध्यावसानेषु द्रेष्काणेषु स्थिताः क्रमात् । पुंनपुंसकयोषाख्या दद्युरङ्घ्रिमितं बलम् ॥६॥`

The verse orders the first, middle and last Drekkana with the labels `puṃ`, `napuṃsaka`, and `yoṣā` respectively: masculine, neuter and feminine. Under the conventional planetary gender classes, this maps to:
- masculine: Sun, Mars, Jupiter — first Drekkana;
- neuter: Mercury, Saturn — middle Drekkana;
- feminine: Moon, Venus — last Drekkana.

The current engine uses this direct Sanskrit sequence. Some English summaries and modern secondary tables reorder the gender labels, and Raman's printed Drekkana article has also been reported with a different order from the BPHS verse. Celestia must keep such lineages separately named rather than blending the two orders. The new tests explicitly protect the BPHS Sanskrit sequence. The Raman alternative is not silently substituted.

## 4. Other Sthana Bala choices that remain source-labelled

- **Saptavargaja:** D1, D2, D3, D7, D9, D12 and D30 are calculated separately. The BPHS/Santhanam point scale and Raman's halving scale remain selectable; the natural/temporary relationship derivation and Moolatrikona policy are documented in the engine status and the dedicated Saptavargaja test suite.
- **Kendradi:** the current implementation counts the house from the Rāśi sign of the Ascendant (Kendra 60, Panaphara 30, Apoklima 15). Raman identifies sign-counting as the Parāśara approach and records a bhava-based alternative from Balabhadra. The current choice is therefore a declared lineage, not a universal claim.
- **Uchcha:** the current calculation folds angular distance from deep debilitation and divides by three. A complete independent multi-planet worked-chart reconciliation is still required before this component or the aggregate Shadbala can be declared fully validated.

## 5. Sources

- [BPHS Chapter 27 — Sanskrit, IAST and word-by-word translation](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-27/), especially verses 5–6 and 1–4.
- [BPHS Chapter 27, verses 1–5](https://www.siva.sh/brihat-parashara-hora-shastra/27/1-5), showing an alternative presentation/numbering of the positional-strength rules.
- [Brihat Parāśara Hora Śāstra Chapter 27 notes and translation](https://jyotishvidya.com/ch27.htm), including the 4½ Ojayugma, Kendradi and Drekkana headings.
- [Sthana Bala worked comparison of BPHS and B. V. Raman](https://www.livepanditji.com/blog/sthana-bala-saptavargaja-ojayugma-kendradi-drekkana/), used as a secondary audit aid for the Standard Horoscope; its Drekkana-order summary is not treated as stronger evidence than the Sanskrit verse itself.

## 6. Remaining validation boundary

Passing the targeted regression suite establishes that the implemented Ojayugma groups and tested BPHS Drekkana mapping follow the selected text. It does not prove the whole Sthana Bala total against every BPHS edition or Raman worked example, and it does not resolve all Saptavargaja, Kendradi or Uchcha Bala variants. The overall Shadbala implementation remains explicitly **partial / approximate** until all six components are source-complete and independently checked against end-to-end worked charts.
