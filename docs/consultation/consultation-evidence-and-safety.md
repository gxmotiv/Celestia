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

### Implementation note

This document is a product and engineering specification, not a clinical protocol. Any mental-health, domestic-abuse or crisis-support content must be reviewed by qualified domain professionals before the application presents it as authoritative guidance.
