# D60 Shashtiamsa: sources, conventions and validation

## Scope

This document records the selected calculation conventions for Celestia's D60 display. It distinguishes textual rules from later interpretive material and does not claim that D60 predictions are empirically validated.

## Classical sources and rule separation

- **BPHS 6.33:** each sign is divided into sixty half-degree parts. The verse contains a genuine interpretive dispute. The phrase `rāśīn vihāya` has been read as excluding the natal sign (Aries-count), while the compound `tad-rāśeḥ` is read by P. V. R. Narasimha Rao and Jagannatha Hora as counting from the occupied sign. Celestia exposes both as `from-aries` and `from-sign`; the selected default is `from-sign`, matching the published Jagannatha Hora sample vector, and is user-selectable in the D60 panel. The two readings must not be conflated. The older even-sign seventh-sign offset was removed: BPHS 6.40 reverses the **name order**, not the D60 sign count.
- **BPHS 6.34–40:** supplies the names and says their order is reversed in even signs. It does not enumerate a numbered Saumya/Krura list.
- **BPHS 6.41:** states the general distinction between benefic and malefic Shashtiamsas.
- **Phaladeepika 3.5:** separately identifies the odd-sign Krura ordinals as 1, 2, 8, 9, 10, 11, 12, 15, 16, 30, 31, 32, 33, 34, 35, 39, 40, 42, 43, 44, 48, 51, 52 and 59; the remaining parts are Saumya. It reverses that classification for even signs. The Siva.sh rendering, Wisdomlib's Sastri 1950 translation and AstroJyoti agree on 16th and 51st; one G.S. Kapoor translation scan gives 18th instead of 16th, and a damaged VedicPupil transcription omits 51st. Celestia selects the convergent 16th/51st reading and records the textual discrepancy. Celestia labels this source explicitly and does not attribute the numbered list to BPHS.

## Name sequence selected for the implementation

The deterministic 60-entry BPHS-recompiled transliteration is:

1 Ghora; 2 Rakshasa; 3 Deva; 4 Kubera; 5 Yaksha; 6 Kinnara; 7 Bhrashta; 8 Kulaghna; 9 Garala; 10 Vahni; 11 Maya; 12 Purishaka; 13 Apampati; 14 Marutvan; 15 Kala; 16 Sarpa; 17 Amrita; 18 Indu; 19 Mridu; 20 Komala; 21 Heramba; 22 Brahma; 23 Vishnu; 24 Maheshwara; 25 Deva; 26 Ardra; 27 Kalinasha; 28 Kshiteesha; 29 Kamalakara; 30 Gulika; 31 Mrityu; 32 Kala; 33 Davagni; 34 Ghora; 35 Yama; 36 Kantaka; 37 Sudha; 38 Amrita; 39 Purnachandra; 40 Vishadagdha; 41 Kulanasha; 42 Vamshakshaya; 43 Utpata; 44 Kala; 45 Saumya; 46 Komala; 47 Sheetala; 48 Karaladamshtra; 49 Chandramukhi; 50 Praveena; 51 Kalapavaka; 52 Dandayudha; 53 Nirmala; 54 Saumya; 55 Krura; 56 Atisheetala; 57 Amrita; 58 Payodhi; 59 Bhramana; 60 Chandrarekha.

Even signs reverse the 60-name sequence. This list is a selected textual profile, not a claim of universal agreement. Published editions and transliterations vary at several positions, including Kulanasa/Kulanasha and the handling of Mukhya around positions 41–42, Dandayudha/Dhannayudha, and Bhramana/Brahmana. A source-profile selector is still needed before supporting multiple recensions as separate calculation modes.

## Independent sign-mapping reference vector

A published Jagannatha Hora-method page provides a fabricated sample chart (1 January 1990, noon IST, Chennai) with six D1 longitudes and their D60 sign outputs. The birth details are explicitly described as fabricated; the fixture below uses only the published longitude-to-sign mapping, not the chart's astronomy or location.

| Body | D1 sign and degree | Published D60 sign |
|---|---|---|
| Ascendant | Pisces 16.4685° | Scorpio |
| Sun | Sagittarius 16.8657° | Virgo |
| Moon | Aquarius 6.4655° | Aquarius |
| Mars | Scorpio 16.1275° | Cancer |
| Mercury | Capricorn 2.0133° | Taurus |
| Jupiter | Gemini 11.4557° | Aries |

The six outputs are used as a deterministic independent sign-mapping regression fixture for the **from-sign** convention. This validates the arithmetic mapping only; it does not validate the ephemeris, birth-time conversion, ayanamsa or D60 name/nature transcription.

## Birth-time uncertainty

Each D60 segment spans 0.5° of the natal sign. The ascendant can change segment with small birth-time errors. The time required for a 0.5° rise varies with latitude and the rising sign; a fixed “two minutes per segment” statement is only a rough average, not a reliability guarantee. Celestia's current D60 panel displays the computed segment but does not rectify birth time or propagate a user-supplied uncertainty interval. Do not present the D60 ascendant as reliable when the recorded birth time is rounded or uncertain.

## Implementation and tests

- `calculateD60AmsaDetails` returns the degree-ordered segment, BPHS name, and separately sourced Phaladeepika nature for each planet and the ascendant.
- The D60 sign-count convention remains selectable; BPHS 6.40's name reversal is not used as a seventh-sign offset in sign placement.
- Regression fixtures cover both sign-count conventions over all 12 natal signs and 60 segments, all 720 name/nature combinations, even-sign reversal, exact half-degree boundaries, and invalid non-finite input.
- These are deterministic rule fixtures. Independent chart-output comparison against a trusted reference implementation and birth-time interval propagation remain outstanding.

## Sources

- [BPHS Chapter 6 Sanskrit text, verses 6.33–41](https://sa.wikisource.org/wiki/बृहत्पाराशरहोराशास्त्रम्/अध्यायः_६_(षोडशवर्गाध्यायः))
- [BPHS 6.31–35 translation](https://www.siva.sh/brihat-parashara-hora-shastra/6/31-35)
- [BPHS 6.36–40 translation](https://www.siva.sh/brihat-parashara-hora-shastra/6/36-40)
- [Phaladeepika 3.5 Sanskrit and translation](https://www.siva.sh/phaladeepika/3/5)
- [Phaladeepika, V. Subrahmanya Sastri 1950 edition, Chapter 3](https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621575.html)
- [BPHS Chapter 7, verses 7.6–8](https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-7)
- [Comparative discussion of D60 textual variants](https://srivarahamihira.medium.com/shashti%C4%81%C5%84%C5%9Ba-1-nature-of-the-shastiamsa-devatas-65d575940a24)
- [Cosmic Squares D60 calculator and calculation notes](https://www.cosmicsquares.com/free-horoscope/shastiamsa-chart)
- [Jagannatha Hora D60 method and published sample vector](https://jagannathahora.com/shashtiamsa)
- [BPHS 6.33 translation noting the `tad-rāśeḥ` reading](https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-6/verse-33)
- [Discussion of the BPHS 6.33 / JHora interpretation dispute](https://phpbb.lightonvedicastrology.com/viewtopic.php?t=2273)
- [Swarn Siddhi D60 calculator: birth-time sensitivity discussion](https://swarnsiddhi.com/d60-chart-calculator)


## User-entered D60 ascendant time-range sampling

The Vedic chart now accepts a user-selected uncertainty range (±1, ±2, ±5, ±10, ±15 or ±30 minutes). For D60 only, Celestia samples the ascendant every five seconds across that interval using its existing local ascendant pipeline, then reports the distinct D60 sign/name/nature placements observed.

Important boundaries:
- The interval is supplied by the user; Celestia does not infer the accuracy of a birth certificate or rectify the time.
- The output is a sampled set, not a proof that no shorter intermediate placement occurred between sample points. It currently checks the D60 ascendant only; planet D60 placements remain calculated at the recorded birth time.
- High-latitude rising motion can be unusually uneven and receives an explicit caution. The numeric timezone offset supplied with the birth data is held constant across the interval; historical DST or civil-time transitions are not inferred.
- The check reuses Celestia's existing ascendant calculation. It is not independent validation against Swiss Ephemeris or another external reference implementation.
- A single observed placement means stable across the samples, not proof that the true birth time is correct.

The sampling summary has deterministic tests for stable intervals, boundary-crossing intervals, sign-convention differences, empty inputs and invalid values.


## Independent ephemeris reference chart (Swiss Ephemeris / DE441)

An independent published check case is available from VedicBirth's methodology page:

- Input: 1 January 1990, 12:00:00 local time, UTC+05:30, New Delhi, 28.6139° N, 77.2090° E.
- Reference engine: Swiss Ephemeris 2.10.03 with compressed JPL DE441 files, sidereal Lahiri, mean node.
- Published values (nutation included): ayanamsha 23.720706°; Ascendant 343.922640°; Sun 256.859923°; Moon 306.465258°; mean Rahu 294.726414°.
- Published mean/no-nutation ayanamsha: 23.717417°. Celestia's current Lahiri formula is mean/no-nutation, so the test adjusts the published longitudes by the 0.003289° nutation difference before comparing, with a 0.02° tolerance.
- Derived D60 signs under the occupied-sign/Jagannatha Hora convention: Ascendant Gemini, Sun Virgo, Moon Aquarius, Rahu Aquarius.

Category 31 now runs this case through Celestia's own chart pipeline and checks the ayanamsha, sidereal Ascendant, Sun, Moon, mean Rahu and derived D60 signs. This is a genuine independent reference check, unlike the six synthetic D60 remapping fixtures above. It still does not turn the current `astronomy-engine`-backed `swissEphemeris` facade into native Swiss Ephemeris; differences are measured, not hidden.

Source: [VedicBirth methodology and reproducible Swiss Ephemeris check case](https://www.vedicbirth.in/methodology).
