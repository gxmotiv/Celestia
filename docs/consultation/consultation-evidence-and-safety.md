# Consultation Desks: Evidence, Safety and AI Orchestration

Status: research-backed design requirements; not a claim that every desk is implemented.

This document turns the research review into engineering requirements for Celestia's personal consultation product. Celestia is a consultation and practical-guidance platform, not primarily a learning academy.

## 1. Product principles

1. Route a question to the smallest useful set of specialist desks.
2. Treat a desk's registry status as a hard capability boundary. Planned or partial methods must not be described as operational.
3. Keep symbolic traditions (astrology and numerology) separate from evidence-based psychology and practical planning.
4. Make AI the coordinator and explainer, not the source of deterministic chart facts.
5. Prefer useful, testable next steps over dramatic personality labels or deterministic predictions.
6. Give users control over which desks, personal details and saved context are used.

## 2. Psychology and human behaviour scope

The Psychology & Behaviour desk should eventually cover the following domains. These are content areas, not diagnoses.

| Domain | Useful consultation tasks | Guardrail |
|---|---|---|
| Cognition and thinking | Assumptions, attention, memory, interpretations, cognitive biases, reframing | Do not tell a user that one bias or distortion explains everything |
| Emotion and self-regulation | Naming emotions, triggers, coping options, emotional regulation and reflection | Do not claim to provide psychotherapy or crisis treatment |
| Motivation and habits | Procrastination, avoidance, routines, reinforcement, barriers, habit design | Make plans collaborative, realistic and user-selected |
| Personality and individual differences | Trait frameworks, values, preferences, strengths and limitations | Explain measurement limits; never diagnose from chat or astrology |
| Attachment and relationships | Attachment concepts, trust, communication, boundaries and recurring patterns | Use as hypotheses for reflection, not labels or certainty about motives |
| Social psychology | Group dynamics, conformity, social identity, influence, conflict and bystander effects | Include context and alternative explanations |
| Learning and performance | Study habits, memory strategies, feedback, exam pressure and goal pursuit | Educational support, not medical or learning-disability assessment |
| Work and life behaviour | Motivation at work, decision-making, negotiation, feedback and role conflict | Avoid unsupported claims about colleagues' intentions |
| Stress and coping | Stressors, support systems, coping choices and when to seek professional help | Do not assess clinical severity as a substitute for professionals |

Evidence-informed starting points include NICE individual behaviour-change recommendations (goals and planning, coping plans, feedback and monitoring, social support, tailoring to user needs and evaluation) and research reviewing CBT mechanisms and skills. These sources support carefully scoped self-reflection and behaviour-support features; they do not establish that an AI chatbot is a therapist or that every technique works for every person.

## 3. Dark psychology, influence and personal safety

“Dark psychology” is a popular umbrella phrase, not a single validated clinical discipline. Celestia may use this label as an accessible entry point, but its internal taxonomy and sources should use precise terms:

- Coercive control and patterns of domination.
- Emotional and psychological abuse.
- Gaslighting indicators and reality-undermining behaviour.
- Isolation, intimidation, threats, surveillance and stalking.
- Financial and economic abuse.
- Sexual coercion and boundary violations.
- Deception, impersonation, fraud and social engineering.
- Persuasion, social influence, conformity, group pressure and power imbalance.
- Misinformation and manipulation of attention or emotion.
- Healthy assertiveness, consent, boundaries, documentation and support-seeking.

### Defensive-only rule

Permitted: explaining warning signs, helping a user distinguish observable behaviour from interpretation, checking alternative explanations, planning safer boundaries, identifying scams, preserving evidence safely and finding appropriate support.

Not permitted: scripts to gaslight, groom, threaten, isolate, blackmail, coerce, deceive or psychologically exploit another person; instructions to bypass consent; or advice for evading detection while harming someone.

### Avoid amateur diagnosis

Do not label the user or a third party as a narcissist, psychopath, sociopath, abuser or member of a personality category from a short story, a quiz, a chart or a one-sided account. Research critiques of Dark Triad measurement identify construct overlap, multidimensionality and methodological limitations. The system should describe behaviours and their effects, not diagnose identities or claim to know motives.

### Safety routing

Potential immediate danger, self-harm or threats must bypass astrology and ordinary life-strategy processing. A safety-first response should:
- Establish whether the person is in immediate danger using one concise question when needed.
- Encourage local emergency or qualified human support.
- Avoid confrontational advice that could increase danger.
- Consider whether the user's device or account may be monitored before suggesting searches, apps or saved notes.
- Use a verified, region-aware resource directory with last-checked dates.

India resource candidates to verify and maintain:
- Emergency Response Support System: 112 (https://112.gov.in/).
- Women Helpline: 181, Ministry of Women and Child Development (https://www.wcd.gov.in/women/help).
- Tele-MANAS: 14416 or 1-800-891-4416, Ministry of Health and Family Welfare (https://telemanas.mohfw.gov.in/).
- Financial cyber fraud: 1930 and https://cybercrime.gov.in/ (https://i4c.mha.gov.in/ncrp.aspx).

These resources have different purposes and eligibility; do not present them as interchangeable. The app must verify operational status and regional availability before surfacing them.

## 4. Life & Personal Strategy desk

The desk should support career, education and study planning; decisions with multiple options and trade-offs; values and priorities clarification; strengths, constraints and resources based on user-provided evidence; goals, routines, habits and follow-through; conflict preparation, difficult conversations and negotiation; and progress review, barriers, setbacks and plan adjustment.

A useful consultation structure:
1. Clarify the real decision or problem.
2. Separate facts, assumptions, feelings and unknowns.
3. Identify values, constraints and available options.
4. Compare benefits, costs, risks and reversibility.
5. Let the user choose a realistic next step.
6. Create an if-then coping plan and a review point.
7. Revisit the result rather than claiming the first plan is certain to work.

Behaviour-change guidance supports agreed goals, action and coping plans, monitoring, feedback, social support, individual tailoring and evaluation. Celestia should be autonomy-supportive: offer options and let the user decide, rather than pressure or manipulate them.

## 4A. Initial implementation status (PR #76)

Typed, offline content foundations now exist:
- Psychology & Human Behaviour: eight topic domains, response structure, limits and source metadata.
- Influence & Safety: seven protective pattern groups, observable-behaviour framing, device-monitoring cautions and defensive-only rules.
- Life & Personal Strategy: seven-step decision/action-planning framework and study, career and routine modes.

These are **partial foundations**, not complete specialist services. Their registry status remains `partial`, which prevents the astrology-only Oracle from answering them. No generated psychological advice or live provider call is enabled by these modules. Source URLs are provenance references; future retrieval must fetch only relevant passages and attach claim-level citations.

## 5. Specialist-desk capability contract

Every method exposed to the AI must have a machine-readable capability record:

- deskId, methodId, display name and intended question types.
- Status: implemented, partial, planned or disabled.
- Required and optional inputs, including provenance and precision.
- Calculator/tool identifier and version, if deterministic calculations are needed.
- Source references, licence/provenance, publication/update date and evidence class.
- School, tradition or calculation convention where multiple variants exist.
- Output schema and allowed interpretation.
- Known error modes, limitations and test fixtures.
- Safety restrictions and escalation rules.

The model must not infer that a method exists merely because it appears in a desk description. If a method is planned, the system should say it is not yet available.

## 6. AI consultation pipeline

Recommended staged orchestration:

1. Input boundary: validate message size and shape; treat user text, profiles, retrieved documents and conversation history as untrusted data, never as executable instructions.
2. Safety triage: detect urgent risk before normal desk selection. This is a conservative routing signal, not a diagnosis or a complete crisis detector.
3. Intent and scope: identify domain, question goal, time horizon, requested answer mode and missing context.
4. Uncertainty-aware routing: choose the smallest relevant desk set; if confidence is low or the question is outside scope, ask one clarifying question or say the router cannot classify it.
5. Capability gate: confirm every selected method is implemented, permitted and has the required inputs.
6. Deterministic tools: obtain chart positions, timing, scores and other reproducible facts from tested calculators, not from model-generated arithmetic.
7. Desk-specific retrieval: fetch only relevant, licensed/usable source material and method rules; retain citation metadata.
8. Synthesis: separate facts, evidence-based psychology, symbolic interpretation, hypotheses and practical options.
9. Output verification: check source support, method availability, contradictions, prohibited diagnoses, certainty language, safety and missing limitations.
10. User-facing trace: show selected desks, why they were selected, which data/methods were actually used, what was unavailable and how to disable or revise the scope.

## 7. Answer contract

A standard answer should include only the sections relevant to the question:
- Direct answer.
- What is known from the user's stated facts or verified calculations.
- What is an evidence-based explanation versus a symbolic interpretation.
- Alternative plausible explanations where motives or causes are uncertain.
- Practical options and one realistic next step.
- Confidence/limitations and what information would materially change the answer.
- Sources for external factual claims.
- A compact “Why these desks?” routing trace.

For urgent safety conversations, the safety response replaces the ordinary synthesis structure.

## 8. AI quality, privacy and budget gates

- No automatic use of all desks for every question.
- No silent memory creation; personal context must be opt-in, inspectable, editable and deletable.
- Minimise collection and retention of birth data, relationship details and sensitive personal content.
- Keep an explicit provider allowlist, per-provider model allowlist and output-token ceiling.
- Do not silently cascade from one AI provider to another. A provider failure must not create surprise requests or unexpected cost.
- Default tests must be deterministic and offline. Do not spend API credits to test routing.
- For external model calls, show which provider/model is selected and obtain an explicit user-approved policy before enabling paid or quota-consuming use.
- Keep evaluation traces privacy-minimised; redact names, birth data and sensitive content from routine logs.
- Track incident types: hallucinated chart facts, unsupported psychological claims, false abuse labels, missed urgency, bad routing, citation mismatch and privacy leakage.

This is consistent with NIST's Generative AI Risk Management Profile (confabulation, privacy, harmful bias, provenance, pre-deployment testing and human-AI configuration risks) and WHO's guidance emphasising autonomy, safety, transparency, accountability, inclusiveness and human oversight for AI in health contexts.

## 9. Evaluation plan

Build offline fixture sets before wiring live providers:
- Intent routing: single-desk, multi-desk, ambiguous and out-of-scope questions.
- Safety: false positives, subtle coercion indicators, immediate-danger phrases, self-harm language and adversarial euphemisms.
- Psychology: no diagnosis, no mind-reading, distinguish observed behaviour from interpretation, give balanced alternatives.
- Dark-psychology misuse: refuse coercive instructions while remaining helpful for defensive awareness.
- Astrology: use only available calculator outputs and named traditions; never invent missing data.
- Retrieval: correct source, date, provenance, licence and citation-to-claim matching.
- Synthesis: preserve disagreement between systems; do not fabricate agreement.
- Privacy: no unnecessary sensitive logging and no cross-profile leakage.
- Cost: exactly one explicitly authorised provider call per request; no hidden retries or fallback cascade unless the user has explicitly enabled that policy.

A successful routing test does not mean the advice, sources, calculations or safety response are clinically validated. Each requires a separate evaluation gate.

## 10. Source register

1. NICE, Behaviour change: individual approaches (PH49), published 2 January 2014; guideline page includes recommendations and updates: https://www.nice.org.uk/guidance/ph49
2. Southward et al., A Review of Transdiagnostic Mechanisms in Cognitive-Behavior Therapy, 2024: https://pmc.ncbi.nlm.nih.gov/articles/PMC11090413/
3. Miller, Vize, Crowe & Lynam, A Critical Appraisal of the Dark-Triad Literature and Suggestions for Moving Forward, 2019: https://journals.sagepub.com/doi/10.1177/0963721419838233
4. UK Government, Domestic abuse: how to get help: https://www.gov.uk/guidance/domestic-abuse-how-to-get-help
5. NIST, Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile, NIST AI 600-1, July 2024: https://doi.org/10.6028/NIST.AI.600-1
6. Zaera et al., Efficient Out-of-Scope Detection in Dialogue Systems via Uncertainty-Driven LLM Routing, ACL Industry 2025: https://aclanthology.org/2025.acl-industry.25/
7. Arora, Jain & Merugu, Intent Detection in the Age of LLMs, EMNLP Industry 2024: https://aclanthology.org/2024.emnlp-industry.114/
8. WHO, Ethics and governance of artificial intelligence for health: Guidance on large multi-modal models, 25 March 2025: https://www.who.int/publications/i/item/9789240084759
9. Government of India, Emergency Response Support System 112: https://112.gov.in/
10. Ministry of Women and Child Development, Women Helpline 181: https://www.wcd.gov.in/women/help
11. Ministry of Health and Family Welfare, Tele-MANAS: https://telemanas.mohfw.gov.in/
12. Indian Cyber Crime Coordination Centre, National Cybercrime Reporting Portal and 1930 financial fraud helpline: https://i4c.mha.gov.in/ncrp.aspx
13. US National Institute of Mental Health, Psychotherapies: https://www.nimh.nih.gov/health/topics/psychotherapies
14. US National Institute of Mental Health, Caring for Your Mental Health: https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health
15. American Psychological Association, Policy Statement on Evidence-Based Practice in Psychology: https://www.apa.org/practice/guidelines/evidence-based-statement
16. American Psychological Association, Healthy Ways to Handle Life's Stressors: https://www.apa.org/topics/stress/tips
17. Bailey, Goal Setting and Action Planning for Health Behavior Change, 2017: https://pmc.ncbi.nlm.nih.gov/articles/PMC6796229/
18. UK Government, Domestic abuse: how to get help: https://www.gov.uk/guidance/domestic-abuse-how-to-get-help
19. UK National Health Service, Getting help for domestic violence and abuse: https://www.nhs.uk/live-well/getting-help-for-domestic-violence/
20. Fraley, Attachment in Adulthood: Recent Developments, Emerging Debates, and Future Directions, Annual Review of Psychology, 2019: https://www.annualreviews.org/content/journals/10.1146/annurev-psych-010418-102813
21. Justo-Núñez et al., Self-report measures of secure attachment in adulthood: A systematic review, 2022: https://onlinelibrary.wiley.com/doi/10.1002/cpp.2756
22. He et al., Challenges to capture the big five personality traits in non-WEIRD populations, Science Advances: https://www.science.org/doi/full/10.1126/sciadv.aaw5226
23. Fan et al., How well can an AI chatbot infer personality? Examining psychometric properties of machine-inferred personality scores, Journal of Applied Psychology, 2023: https://doi.org/10.1037/apl0001082


24. B. Suryanarain Rao, *Jaimini Sutras*, English translation with notes and original Sanskrit, revised and annotated by B.V. Raman, fifth edition, 1955; Internet Archive transcription: https://archive.org/stream/Jaiminisutras1955EditionByBSRao/Jaiminisutras%201955%20Edition%20by%20B%20S%20Rao_djvu.txt
25. Jatakaveda, *Parashara and Jaimini classical corpus*: cross-referenced notes on BPHS chapter 32 and Jaimini Sutras, with explicit discussion of seven/eight-karaka variants and Rahu: https://jatakaveda.com/library/parashara-jaimini/
26. Shanmukha, *Real Jaimini Navamsa Revealed – 1*, Saptarishis Astrology, 15 November 2024; discusses the common Parashari Navamsa calculation and a distinct Krishna Mishra / Prakriti Chakra variant: https://saptarishisshop.com/real-jaimini-navamsa-revealed-1-north-indian-charts-by-shanmukha/
27. Chris Brennan, *Annual Profections* lecture slides, 2018: https://theastrologypodcast.com/wp-content/uploads/2018/04/annual-profections-slides.pdf
28. Skyscript Astrology Forum, *Calculating Profections in Hellenistic Astrology*, discussion of historical starting-point and annual-profection variants: https://skyscript.co.uk/forums/viewtopic.php?t=10387

### Astrology method provenance and non-uniform traditions

These sources document historical texts, translations and practitioner interpretations. They are not scientific evidence that astrological interpretations or predictions are valid.

- Chara Karaka schemes are not interchangeable. BPHS Chapter 32, verses 1–2, explicitly presents seven grahas from Sun through Saturn or eight ending with Rahu; verses 13–17 list the descending role chain and note a Matru/Putra merger variant. Celestia therefore labels the two implemented options by graha count and does not call either the sole valid Jaimini lineage.
- The current seven-graha option uses Sun through Saturn and the role order AK, AmK, BK, merged MK/PK, PiK, GK, DK. The eight-graha option uses those seven plus Rahu (North Node), computes Rahu's ranking degree as 30° minus its degree within the sign, and assigns the eight roles separately through DK. Exact ranking ties are surfaced as warnings; the display sort order is not a traditional tie-resolution rule. The interpretation of which source-school uses which option remains a declared lineage choice, not a universal consensus.
- Karakamsa is currently derived from the Atmakaraka's Navamsa sign through the shared movable/fixed/dual Parashari Navamsa calculator. A separately discussed Krishna Mishra / Prakriti Chakra Navamsa variant is not implemented and must not be silently mixed into the result.
- Annual profections currently use a birthday-to-birthday completed-calendar-age convention, whole-sign counting from the natal Ascendant sign and traditional domicile rulers. The exact solar-return instant, monthly profections, and other historical starting points (Sun, Moon, Lot of Fortune or other places in certain texts) are not implemented. The calculator returns the arithmetic only; it does not claim predictive validity.


29. Wan Min-ying, *San Ming Tong Hui* (三命通會), Volume 2, “Lun Da Yun” (論大運), Ming dynasty text; primary Chinese text with translation: https://www.shidianguji.com/book/SK1610/chapter/1kf5v6ol1vhnp
30. *San Ming Tong Hui*, Volume 2, “Lun Da Yun”, alternate transcription and edition notes: https://www.chenshupaipan.com/books/2/337.html
31. KP method reference: Krishnamurti Paddhati uses sidereal Placidus cusps and the cusp degree's sign/star/sub-lord chain; technical explanation and references to Krishnamurti's Readers: https://udaya.app/method/
32. KP cusp convention cross-check: Placidus cusps are retained as calculated and each cusp starts its house; no 26°40' snap-to-next-sign rule is documented: https://desiutils.in/astrology/kp-astrology-calculator

33. Astrodienst Swiss Ephemeris, *Swiss Ephemeris Documentation*, section 2.8.6 “Krishnamurti ayanamshas”; distinguishes KP Old table-derived ayanamsha from the separate Krishnamurti/Senthilathiban VP291 ayanamsha and documents uncertainty in Krishnamurti's original definition: https://www.astro.com/swisseph/swisseph.htm
34. Swiss Ephemeris documentation PDF, KP Old table-derived reference epoch 22.363889° at 1 Jan 1900 and discussion of irregularities in the printed table: https://www.astro.com/swisseph-download/doc/swisseph.pdf

### Calculation audit updates (2026-11-19)

- **BaZi Da Yun:** the previous engine hard-coded a five-year start age. That was not a valid general calculation. It now finds the previous or next Jie boundary from the tropical geocentric Sun longitude, according to the year-stem polarity / gender direction rule, and solves the crossing numerically. It applies the classical proportional conversion (3 days = 1 year; 1 day = 4 months; 2 hours = 10 days), retains the fractional start age, and exposes start/end instants for each ten-year pillar. This follows the arithmetic described in *San Ming Tong Hui*, Volume 2, “Lun Da Yun”. This is a declared UTC-instant calculation: callers must resolve the recorded local birth time and any historical time-zone / local-mean-time / true-solar-time policy before passing the Date. Those clock policies are not inferred by this function.
- **KP cusps:** removed an earlier custom rule that snapped a sidereal Placidus cusp in the final 3°20′ of a sign to the next sign boundary. The rule altered the actual Placidus cusp longitude and therefore could change the cusp's star/sub-lord. The engine now preserves the actual tropical Placidus cusp minus the selected KP ayanamsa. The former 26°40′ correction is treated as unsupported and is not applied.
- **KP ayanamsa:** corrected the KP Old table-derived anchor from the unsupported 22°22′14″ to 22°21′50″ at 1900-01-01, with exact day-of-year fraction and Newcomb's 50.2388475″/year rate. The 1 Jan 2000 result is regression-checked against the published KP Old table value within 5 arcseconds. This remains a linear table-derived approximation, not native Swiss Ephemeris; KP New / VP291 is a distinct method and is not silently substituted. Swiss Ephemeris itself warns that the historical table is irregular and that the VP291 definition differs.
- **Numerology synthesis:** removed the forced 65% minimum. The displayed value is now a transparent 0–100 rule-match index from the app's selected cross-system comparisons. It is not a measure of truth, predictive accuracy, scientific validity, or a person's value. Zero agreement is a valid result.
- **BaZi benchmark honesty:** removed eight placeholder assertions that unconditionally returned a passing result for Yong Shen, stem/branch transformations, monthly timing and other advanced methods. These methods remain unverified until they have independent fixtures and calculations; they are not green tests merely because the data structure exists.


### Western advanced-engine audit (2026-11-19)

- **Fixed stars:** the catalogue stores J2000 ecliptic longitudes but previously compared them directly with date-of-birth tropical positions. It does not yet precess the star coordinates or include proper motion. Every emitted contact is now explicitly labelled as an unprecessed J2000 reference and the UI warns that the contact is exploratory, not a verified conjunction.
- **Eclipses:** the embedded event list is static and ends in August 2026. It is no longer allowed to show past events as upcoming; the analyzer filters against an explicit as-of date. When the sample list has no future events, the UI states that a live astronomical eclipse solver and refreshed catalogue are missing.
- **Astrocartography:** the previous shortcut used direct ecliptic-longitude offsets as AC/DC/MC/IC terrestrial lines. That does not solve the required equatorial coordinates, local sidereal time, latitude-dependent horizon intersections or meridian crossings. The output is now fail-closed: no lines or destination recommendations are returned until the real geometry and reference-chart tests exist.
- **Medical astrology:** this remains a symbolic historical astrology panel only. The UI now explicitly states that it is not a medical assessment, diagnosis, risk screen or preventive-care recommendation and must not guide health decisions.
- **Product naming:** the Western advanced panel is labelled a technique directory / exploratory modules, not a complete architecture. A panel's presence does not establish calculation or interpretation readiness.


### Western calculation provenance and readiness audit (2026-11-19)

- The file historically named `swissEphemeris.ts` is a compatibility adapter over `astronomy-engine`, not the Swiss Ephemeris library. The header and position comments have been corrected so display rounding is not presented as physical accuracy. Existing JPL comparison fixtures cover selected epochs only; they do not prove universal sub-arcsecond accuracy.
- `calculateAllPlanets` now returns Rahu and Ketu as an exact opposing pair, with mean node as the default and an explicit optional true-node mode. A true ascending node is not itself Ketu; Ketu is the descending node 180° opposite. Regression tests cover both conventions, opposition, latitude symmetry and shared motion.
- Planetary hours previously assumed solar noon at 12:00 for every longitude and timezone. It now uses longitude, the timezone meridian and a low-order equation-of-time correction. Sunrise/sunset remain approximate because the declination and horizon solution are low-order; this is not an ephemeris-grade sunrise calculation and polar day/night handling still needs a dedicated design.
- The Western chart still includes a rough Chiron longitude shortcut rather than a validated Chiron ephemeris. Major asteroid positions use simplified orbital-element calculations, not the same validated planetary-vector pipeline. Fixed-star contacts are explicitly J2000 and unprecessed. Eclipse items are static sample data filtered by as-of date, not a complete computed eclipse catalogue. Astrocartography remains fail-closed / not implemented.
- These points must remain visibly labelled as estimates, reference-epoch data or unavailable until independently validated. The natal chart's existing foundation must not be interpreted as proof that every optional object or advanced technique is calculation-ready.

### Vedic Jaimini and divisional-chart readiness audit (2026-11-19)

#### D9 / Navamsa
- The core D9 segmentation rule follows the BPHS Chapter 6 Navamsa rule: nine 3°20′ divisions per sign; movable signs begin from themselves, fixed signs from the ninth, and dual signs from the fifth. The new regression suite enumerates all 108 sign/segment combinations and checks the 3°20′ boundary plus non-finite input rejection. These checks are pending the next CI result.
- The current Pushkara Navamsa lookup is a tradition-specific mapping and has not yet been validated against a primary critical edition or a clearly identified commentary. Pushkara Navamsa must also be kept distinct from Pushkara Bhaga (a specific sensitive degree); do not imply the two are interchangeable.
- D9 dignity currently uses incomplete friendship classifications. Exaltation, debilitation and own-sign checks are easier to verify; friendly/enemy labels need a complete declared natural/temporary/compound friendship convention. Rahu/Ketu exaltation and own-sign assignments are school-dependent and must be selectable or shown as disputed, not universal.
- Planetary strength scores are heuristic inventions, not classical Shadbala or a validated D9 strength measure. The base score, Vargottama/Pushkara bonuses and Navamsa-number bonus have no independently validated weighting. Overall D9 strength and relationship compatibility percentages must not be presented as objective strength, compatibility, or probability.
- Several D9 yoga labels are exploratory rather than established standalone classical yogas. In particular, Pancha Mahapurusha yogas are classically judged from the Rasi chart under specific dignity and kendra conditions; applying those same names as independent D9 yogas is not validated. D9-only Gajakesari, Budhaditya, Dharma-Karmadhipati and benefic-7th-house labels need method-specific textual rules and independent fixtures before being treated as classical yoga detections.
- Marriage timing text is generic and does not calculate a date/window from a complete D1/D9, dasha and transit method. Partner-character descriptions derived from one D9 sign are generic symbolic prompts, not evidence about a future person's actual personality. Remove certainty language and do not publish the current percentage as compatibility.
- The spiritual-path routine currently chooses Atmakaraka from seven visible grahas only, then selects a deity from the sign lord 12th from Karakamsa. This is not a complete, selectable Jaimini Ishta-devata procedure. Classical/commentarial approaches examine the relevant 12th-from-Karakamsa factors and differ in interpretation; the deity map and mantras need sourced school-specific rules and must be labelled devotional/traditional, not calculated fact. The D9 engine must accept the selected 7/8 Chara Karaka convention and use the same Atmakaraka consistently.

#### Jaimini source cross-check (2026-11-19)
- Exa located a full-text scan of *Jaimini Sutras*, translated by Bangalore Suryanarain Rao and revised/annotated by B. V. Raman (1955). Its notes describe the seven-graha and eight-graha Atmakaraka options, reverse-counting Rahu within its sign, and the 4th/2nd/11th Argala positions with 10th/12th/3rd obstruction. It also explicitly notes that extending the Ketu reversal rule to Rahu is a commentator's opinion rather than an unambiguous statement in that cited sutra. This supports keeping the software's Rahu handling and Argala direction as named conventions, not universal facts.
- The same translation gives Arudha/Pada Lagna as counting from the lord by the same number of signs as the lord is from the reference sign, with special-case sutras for a lord in the 4th or 7th. These exceptions must be tested before an Arudha engine is considered complete. This single 1955 translation/commentary is not sufficient to settle all school differences; compare Sanskrit editions and other commentaries before promoting a disputed rule.
- Source located: [Jaimini Sutras, B. Suryanarain Rao, revised and annotated by B. V. Raman (1955), full-text scan](https://archive.org/stream/Astrology_Books_by_B_Suryanarayana_Row/Jaimini%20Sutras%20-%20B%20Suryanarain%20Rao%201955_djvu.txt). Also located a Sanskrit/Hindi edition catalogued by Sampurnanand Sanskrit University (2005): [CiNii bibliographic record](https://ci.nii.ac.jp/ncid/BA88097962). These are research leads, not a critical textual collation.

#### Jaimini Chara Karakas
- The engine now separates a seven-graha option from an eight-graha option and applies reverse degree (30° minus Rahu's in-sign degree) only when Rahu is included. The eight-role sequence and reverse-count arithmetic are documented in the Jaimini Upadesha Sutras tradition, but translations/commentaries differ on seven/eight selection, Rahu inclusion and the middle-role assignments.
- The current seven-graha role table explicitly merges Matru/Putra but retains a separate Pitru role. This is one declared software convention, not a universal seven-karaka table. It must not be silently compared with a seven-role school that omits Pitru and shifts Putra/Gnati/Dara roles differently.
- Exact degree ties are warned about, not resolved. Near-ties, rounding precision, Rahu at sign boundaries, and the source chart's ayanamsa/longitude precision need dedicated fixtures. Do not silently break a tie by planet name.
- Karakamsa sign arithmetic is a deterministic Navamsa calculation; the broader Jaimini reading is incomplete. Arudha Padas, Upapada Lagna, Rashi Drishti, Argala, Chara Dasha, longevity methods and their exceptions are not established merely because Karakas and Karakamsa are present.

#### Divisional-chart roadmap and gates
- The classical Shodashavarga set in BPHS Chapter 6 is D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45 and D60. D9 is not a substitute for the other vargas. Each varga needs its own odd/even or movable/fixed/dual starting rules, boundary fixtures, dignity rules, house/lagna treatment, source attribution and independent test corpus.
- Priority sequence for validation: D2 Hora; D3 Drekkana; D4 Chaturthamsa; D7 Saptamsa; D9 Navamsa; D10 Dasamsa; D12 Dvadasamsa; D16 Shodasamsa; D20 Vimsamsa; D24 Chaturvimsamsa; D27 Saptavimsamsa; D30 Trimsamsa; D40 Khavedamsa; D45 Akshavedamsa; D60 Shashtiamsa. D30 is especially important because its unequal odd/even divisions differ from a simple equal-arc formula. D60 is highly birth-time sensitive and must expose time uncertainty.
- No divisional chart should be marked complete based only on a chart image or a formula copied from another varga. Required gates include exact segment boundaries, sign-start convention, degree within varga, varga ascendant, house mapping, planetary dignity, varga-specific interpretation and independent reference fixtures.
- Source basis located in this audit: *Brihat Parashara Hora Shastra*, Chapter 6, especially verses 6.2–6.12 for the sixteen-varga list and Navamsa rule. The consulted online renderings are secondary translations; a primary Sanskrit edition and more than one reputable commentary remain necessary for disputed details.

### Implementation note

This document is a product and engineering specification, not a clinical protocol. Any mental-health, domestic-abuse or crisis-support content must be reviewed by qualified domain professionals before the application presents it as authoritative guidance.


### D60 source cross-check and audit (2026-11-20)

**Textual evidence and exact calculation.** The Sanskrit BPHS Chapter 6 transcription places the Shashtiamsa rule at 6.33, lists the sixty names in 6.34–39, and states the even-sign reversal rule at 6.40. Verse 6.33 describes doubling the planet's degrees within the sign and reducing by twelve; the sign origin is not unambiguously settled by the wording and its translations. The current implementation therefore retains two explicit, non-interchangeable conventions rather than claiming a universal answer:

- Let `d` be the sidereal longitude within the natal sign, in degrees, and `p = floor(2 × d)`, giving segment indices 0–59.
- **Occupied-sign convention (current default):** `D60Sign = (natalSignIndex + (p mod 12)) mod 12`.
- **Aries-origin alternative:** `D60Sign = p mod 12`.
- BPHS 6.40's even-sign reversal applies to the ordered Shashtiamsa name/lord sequence, not to sign placement. The current calculator returns the selected 60-entry BPHS-derived amsa name and a separately sourced Saumya/Krura nature classification from Phaladeepika 3.5; `nameSource` and `natureSource` keep those lineages distinct. Textual spellings and recension variants remain unresolved, and there is no source-profile selector.

**Audit findings and limitations.** The D60 sign branch in `lib/vedic/divisionalCalc.ts` implements both named conventions and defaults to occupied-sign. That default is a declared software/lineage choice, not a textual consensus. The configuration's current D60 significance string ("Past life karma, root cause & micro-destiny") is stronger than the classical domain statement: BPHS Chapter 7 groups D45 and D60 under general indications rather than assigning D60 a unique topic. Past-life/karma readings should be labelled as later interpretive practice, not as the explicit wording of the cited chapter. D60 remains **partial**: it returns sign, whole-sign house, named amsa and the selected Phaladeepika-derived nature; it does not provide a source-profile selector, birth-time uncertainty propagation, rectification, or independent reference-chart certification. Its half-degree segments also make input-time and longitude uncertainty material; a valid segment mapping does not validate the recorded birth time.

**Offline fixtures.** Category 27.1 checks both conventions over all 12 natal signs and all 60 half-degree segments, with midpoint, exact-start and just-before-boundary cases (2,148 checks per convention). Category 27.2 confirms that the default occupied-sign convention maps Taurus at 0° to Taurus. Category 27.3 checks ULP-close half-degree boundary consistency between sign placement and named-amsa metadata under both conventions, while preserving a 1e-7° pre-boundary case. These are deterministic mapping fixtures, not independent reference-chart validation.

**CI evidence at the audited head.** Workflow run 1281 for head `0398e9894630e0a63a84561617325ef3d4de7ff7` ran the astrology regression suite successfully: 150 passed, 0 failed. The subsequent Next.js build failed during TypeScript checking because `scripts/testAstrologySuite.ts` called the exported `calculateDivisionalChart` helper without importing it. OpenNext packaging and Worker dry-run were skipped after that build failure; the deployment job was skipped. This change adds the missing named import only. Follow-up verification: workflow [#1282](https://github.com/gxmotiv/Celestia/actions/runs/44662719519) on commit `e8790bbdbc7cb93f37885edec89ea1114ae31265` passed the astrology suite (150 passed, 0 failed), Next.js production build, OpenNext Cloudflare packaging, and Wrangler Worker dry-run. The deployment job was skipped; no deployment occurred. This confirms the missing-import correction on that commit only. The docs-only follow-up commit `c58e995bdc293ad4dd640828577f42dbb875c148` also passed workflow [#1283](https://github.com/gxmotiv/Celestia/actions/runs/44663100455): 150/150 tests, Next.js build, OpenNext packaging and Wrangler dry-run; deployment was skipped.

**Sources consulted (20 November 2026).**
- [BPHS Chapter 6 Sanskrit text, Wikisource](https://sa.wikisource.org/wiki/बृहत्पाराशरहोराशास्त्रम्/अध्यायः_६_(षोडशवर्गाध्यायः)) — verses 6.33–41; primary-text transcription, not a critical-edition collation.
- [BPHS 6.33 Sanskrit, transliteration and word-level rendering](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-6/verse-33/) — supports the half-degree arithmetic and exposes the translation issue around sign origin.
- [BPHS 6.40 Sanskrit, transliteration and word-level rendering](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-6/verse-40/) — even-sign reversal wording; the page notes a probable textual/OCR correction in the final compound, so its grammatical analysis is not treated as definitive.
- [BPHS Chapter 6, verses 31–35 translation](https://www.siva.sh/brihat-parashara-hora-shastra/6/31-35) — independent English rendering of the half-degree calculation.
- [R. Santhanam, BPHS English translation and commentary, scanned volume](https://ia903205.us.archive.org/30/items/brihatparasarahorashastrabyr.santhanam/Brihat%20Par%C4%81%C5%9Bara%20Hor%C4%81%20%C5%9Ah%C4%81stra%20By%20R.%20Santhanam.pdf) — another translation lineage; still a translation/commentary rather than a critical Sanskrit edition.
- [Parashari and Jaimini classical-corpus research notes](https://jatakaveda.com/library/parashara-jaimini/) — secondary cross-reference explicitly records the sign-independent reading of 6.33 and the 6.40 name-order rule; use as a research aid, not as primary authority.
- [DesiUtils D60 method disclosure](https://desiutils.in/astrology/shashtiamsa-d60) — documents the occupied-sign default and the alternative literal reading; a contemporary implementation disclosure, not classical authority.
- [BPHS Chapter 7, verses 6–10 translation](https://www.siva.sh/brihat-parashara-hora-shastra/7/6-10) — supports the statement that D45 and D60 are consulted for all indications, rather than giving D60 a unique topic.

No provider was called. No secrets, deployment, merge, or main-branch changes were involved.


### D60 boundary numerical policy and textual source cross-check (2026-11-21)

- The D60 sign calculator now shares the existing equal-division ULP tolerance with `calculateD60AmsaDetails`. This removes an internal edge case where the sign part and the named amsa could disagree if an exact half-degree boundary arrived a few floating-point steps low.
- The tolerance is an implementation-level numerical policy, not a classical rule. Category 27.3 tests one ULP below a Taurus 0°30′ boundary under both `from-sign` and `from-aries`, then verifies that a point 1e-7° before the boundary remains in the prior segment.
- The textual convention remains deliberately selectable: BPHS 6.33 provides the half-degree arithmetic; the occupied-sign rendering is supported by a word-level VedicPupil translation (“from that planet's sign”), while an Aries-origin reading is also reported in software/lineage documentation. VedicPupil itself warns its translation may be wrong. The Sanskrit e-text is not a critical-edition collation, so this run does not resolve the philological disagreement or change the default.
- The even-sign reversal in BPHS 6.40 remains limited to the name/lord sequence. The implementation's name sequence is attributed to BPHS 6.34–40; its Saumya/Krura classification is separately attributed to Phaladeepika 3.5. Neither source should be misattributed to the other.
- D60 still lacks uncertainty propagation over a recorded birth-time interval, a recension/source-profile selector, rectification, and independent reference-chart certification.

Sources:
- [BPHS Chapter 6 Sanskrit text, verses 6.33–41](https://sa.wikisource.org/wiki/बृहत्पाराशरहोराशास्त्रम्/अध्यायः_६_(षोडशवर्गाध्यायः)) — primary-text transcription, not a critical-edition collation.
- [BPHS 6.33 Sanskrit and word-level rendering (VedicPupil)](https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-6/verse-33) — occupied-sign wording; the page explicitly cautions that its translation may be wrong.
- [BPHS Chapter 7, verses 6–10](https://www.siva.sh/brihat-parashara-hora-shastra/7/6-10) — D45/D60 “all indications” scope.
- [Jagannatha Hora D60 calculation discussion](https://jagannathahora.com/shashtiamsa) — contemporary software/lineage discussion of occupied-sign and Aries-origin readings, not primary authority.


### BaZi solar-month boundary and user-facing wiring audit (2026-11-22)

**Tradition and terminology.** The 24 solar terms divide the ecliptic into 24 points 15° apart. For the BaZi solar-month convention implemented here, the month branch changes at the 12 Jie (節氣/sectional) boundaries: Li Chun 315° (Yin/Tiger), Jing Zhe 345° (Mao/Rabbit), Qing Ming 15° (Chen/Dragon), then every 30° through Xiao Han 285° (Chou/Ox). The month stem is derived from the resolved year stem using the Five Tigers (五虎遁) sequence. Yuan Hai Zi Ping, Juan 1, “論年上起月例” gives the verse “甲己之年丙作首，乙庚之歲戊為頭，丙辛之歲尋庚上，丁壬壬位順行流，若言戊癸何方發，甲寅之上好追求,” then says to begin the first month at Bing-Yin for Jia/Ji years and advance one stem per month. San Ming Tong Hui, Juan 2, “論遁月時,” independently gives the same month-stem rule.

Do not conflate this with Chinese lunisolar calendar month numbering. Liu and Stephenson (1998) distinguish odd-numbered Jieqi from even-numbered Zhongqi and state that Zhongqi govern lunar-month numbering/intercalation. The Hong Kong Observatory's English table calls Zhongqi “major solar terms” and Jie “minor solar terms”; that English “major” label is not the BaZi month-boundary selector. The engine's ambiguous isMajor field has therefore been renamed isJie, and the 12 Jie longitudes are regression-tested explicitly.

**Verified implementation gap.** The main user-facing flow in app/page.tsx previously called calculateBaZiProfile(year, month, day, hour) without the already-created local-to-UTC birth instant. lib/astronomy/chinese.ts then selected year/month pillars using fixed Gregorian day-of-month cutoffs. This can misclassify a birth on the same civil date but before the actual Jie instant. The more precise SolarTermCalculator already existed in lib/astronomy/baziEngine.ts, but the primary Chinese tab was not using it. The app now passes its UTC birth instant to calculateBaZiProfile; when present, year and month pillars use the apparent geocentric tropical solar longitude and the exact LiChun/Jie interval. The old date-only path remains for compatibility and is explicitly an approximate fallback. The hour parser was also corrected so 00:xx is not coerced to noon by JavaScript's || operator.

**Exact method and convention.**
- Resolve the supplied local birth date/time with the profile's configured numeric UTC offset to a UTC instant.
- Determine the solar year by the 315° LiChun crossing.
- Determine the month branch from the 12 Jie intervals, one 30° interval per month, beginning with Yin at 315°.
- Determine the month stem from the resolved year stem using the Five Tigers sequence: Jia/Ji→Bing, Yi/Geng→Wu, Bing/Xin→Geng, Ding/Ren→Ren, Wu/Gui→Jia for the Yin month; increment one stem for each following month.
- The solar-term model now labels Jie explicitly (isJie); it does not use the ambiguous English “major” label.

**Offline regression fixtures.** Category 29 adds six assertions: exactly 12 Jie longitudes; before/after LiChun 2024 (315° at 2024-02-04 16:27:07 HKT / 08:27:07 UTC) resolving Gui-Mao/Yi-Chou then Jia-Chen/Bing-Yin; before/after Jingzhe 2024 (345° at 2024-03-05 10:22:45 HKT / 02:22:45 UTC) resolving Bing-Yin then Ding-Mao; and rejection of an invalid Date rather than silently falling back. The Jingzhe pair deliberately uses the same local civil date on either side of the actual event, which exposes the previous day-of-month cutoff error. The benchmark harness's former “15° solar longitude sector” assertion was corrected: it was only a structural presence check, not a calculation-accuracy test.

**Limitations and readiness.** This improves the basic year/month pillar path used by the main Chinese tab; it does not make the BaZi subsystem complete. The current input uses a numeric fixed UTC offset, not a historical IANA timezone database, so historical daylight-saving and jurisdictional offset changes must be supplied correctly by the user/profile. The form's “time unknown” state is not yet propagated as an uncertainty interval; a default/estimated time can still select the wrong side of a Jie for a birth near the boundary. The astronomy adapter rounds displayed solar longitude to 0.0001°, so this is not a second-level certified solar-term solver. Day/hour pillar conventions, local civil-day versus Zi-hour rollover, historical day-count anchors, hidden-stem weighting, Ten Gods, Yong Shen, transformations and Da Yun rules need separate audits and independent fixtures. Callers that omit birthInstant still receive the legacy approximate year/month result.

**Sources consulted (22 November 2026).**
- [Yuan Hai Zi Ping, Juan 1, “論年上起月例”](https://lifeklines.com/library/bazi/yuan-hai-zi-ping/018/) — transmitted Five Tigers month-stem verse and sequential month rule; the hosted text/translation is not a critical-edition collation.
- [San Ming Tong Hui, Juan 2, “論遁月時”](https://zh.wikisource.org/zh-hans/三命通會/卷二) — independent classical rendering of “遁月從年” and the same Five Tigers verse.
- [Hong Kong Observatory, Heavenly Stems and Earthly Branches](https://www.hko.gov.hk/en/gts/time/stemsandbranches.htm) — official month-stem/year-stem table and branch ordering.
- [Hong Kong Observatory, The 24 Solar Terms](https://www.hko.gov.hk/en/gts/time/24solarterms.htm) — 15° solar-longitude spacing and the HKO major/minor terminology; its major terms are Zhongqi, not the BaZi Jie selector.
- [Liu, Baolin and F. Richard Stephenson, “The Chinese calendar and its operational rules,” Orion 56 (1998)](https://www.e-periodica.ch/cntmng?pid=ori-001%3A1998%3A56%3A%3A377) — scholarly distinction between Jieqi and Zhongqi and the Zhongqi rule for lunar-month numbering.
- [Hong Kong Observatory, Date and Time of the 24 Solar Terms](https://www.hko.gov.hk/en/gts/astronomy/Solar_Term.htm) — states that astronomical data are based on HM Nautical Almanac Office and US Naval Observatory data and that displayed times are HKT (UTC+8).
- [Yuk Tung Liu, Calculation of Moon Phases and 24 Solar Terms](https://ytliu0.github.io/ChineseCalendar/docs/sunMoon.pdf) — reproducible technical treatment of apparent geocentric solar longitude, ephemeris time scales and root-finding for solar-term instants.
- [2024 solar-term table](https://almanark.com/jieqi/2024/) and [2024 UTC/HKT CSV](https://koyomidays.com/data/solar-terms-2024.csv) — independent secondary computational cross-checks for the LiChun and Jingzhe fixture instants; not classical authority.

CI evidence for this commit is pending until the PR workflow completes. No provider was called; no secrets, deployment, merge, release, or main-branch changes were involved.
