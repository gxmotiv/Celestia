/**
 * Comprehensive Western Astrology Interpretation Database
 * Includes detailed psychological interpretations for:
 * 1. Asteroids: Ceres, Pallas, Juno, Vesta (in all 12 signs & 12 houses)
 * 2. Black Moon Lilith (Mean and True in all 12 signs & 12 houses, plus aspects)
 * 3. Additional Points: Vertex, White Moon Selena, East Point
 * 4. Arabian Parts in Signs and Houses
 */

export interface BodyInterpretation {
  archetype: string;
  mythology: string;
  signMeaning: string;
  houseMeaning: string;
  psychologicalGift: string;
  shadowEdge: string;
}

// -------------------------------------------------------------
// 1. ASTEROIDS INTERPRETATIONS
// -------------------------------------------------------------

export const ASTEROID_SIGN_INTERPRETATIONS: Record<
  "Ceres" | "Pallas" | "Juno" | "Vesta",
  Record<string, string>
> = {
  Ceres: {
    Aries: "Nurturing through fiery independence, physical agency, autonomy, and encouraging self-reliance.",
    Taurus: "Nurturing through grounded comfort, abundant nourishment, sensory tactile warmth, and stability.",
    Gemini: "Nurturing through stimulating dialogue, educational curiosity, sharing books, and lively mental exchange.",
    Cancer: "Nurturing through deep maternal emotional attunement, hearth-side security, and intuitive empathy.",
    Leo: "Nurturing through playful applause, celebratory joy, creative validation, and generous dramatic warmth.",
    Virgo: "Nurturing through devoted practical service, dietary wellness, detail-oriented care, and craftsmanship.",
    Libra: "Nurturing through peaceful harmony, aesthetic elegance, shared partnership balance, and gentle grace.",
    Scorpio: "Nurturing through deep psychological presence, unsparing emotional intimacy, and regenerative holding.",
    Sagittarius: "Nurturing through expansive adventures, philosophical optimism, freedom to explore, and inspiring questing.",
    Capricorn: "Nurturing through structured mentorship, practical resilience, reliable duty, and building lasting foundations.",
    Aquarius: "Nurturing through radical acceptance of uniqueness, intellectual freedom, egalitarian community, and detachment.",
    Pisces: "Nurturing through unconditional compassion, spiritual solace, poetic empathy, and mystical sanctuary.",
  },
  Pallas: {
    Aries: "Strategic intellect forged in direct, pioneering tactics, military clarity, and fast-paced decisive breakthroughs.",
    Taurus: "Strategic wisdom rooted in organic systems, patience, practical material resourcefulness, and bio-design.",
    Gemini: "Strategic genius in linguistic agility, cryptographic patterns, lateral thinking, and multi-channel diplomacy.",
    Cancer: "Strategic intuition navigating emotional undercurrents, ancestral defense, and protecting vulnerability.",
    Leo: "Creative strategy commanding charismatic theater, courageous dramatic art, and magnetic leadership presence.",
    Virgo: "Diagnostic master of precision systems, ecological perfection, granular troubleshooting, and analytical healing.",
    Libra: "Strategic diplomacy, arbitration of peace, judicial justice, aesthetic symmetry, and balancing rival factions.",
    Scorpio: "Psychological warfare, strategic espionage, deep shadow investigation, occult insight, and catalytic breakthroughs.",
    Sagittarius: "Visionary strategy synthesized through macro philosophies, jurisprudence, cross-cultural geopolitical mastery.",
    Capricorn: "Architectural strategy, institutional governance, long-range pragmatism, and structural authority.",
    Aquarius: "Futuristic pattern recognition, revolutionary technological vision, systems architecture, and paradigm shifts.",
    Pisces: "Visionary, holographic holistic intuition, dream symbolism, sacred geometry, and healing through spiritual artistry.",
  },
  Juno: {
    Aries: "Demands a fiery, independent partner; thrives when mutual autonomy and passion are fiercely preserved.",
    Taurus: "Seeks steadfast, sensual fidelity, material stability, peaceful loyalty, and enduring domestic commitments.",
    Gemini: "Needs an intellectual playmate, continuous conversational stimulation, mental parity, and witty camaraderie.",
    Cancer: "Longs for deep emotional safety, soul-family devotion, mutual tenderness, and protective domestic sanctuary.",
    Leo: "Desires a radiant, celebrated partnership; needs mutual admiration, romantic grandeur, and royal loyalty.",
    Virgo: "Values daily practical collaboration, mutual devotion to self-improvement, health routines, and sincere humility.",
    Libra: "The quintessential marriage archetype: requires exquisite equality, reciprocal courtesy, aesthetic balance, and romance.",
    Scorpio: "Craves volcanic emotional intensity, absolute spiritual merging, fierce loyalty, and erotic transformation.",
    Sagittarius: "Requires a philosophical travel companion, freedom within union, shared spiritual quests, and truthfulness.",
    Capricorn: "Seeks structured, committed partnership built on endurance, shared societal legacy, integrity, and mutual respect.",
    Aquarius: "Thrives in unconventional alliances, intellectual brotherhood, non-possessive freedom, and forward-looking shared ideals.",
    Pisces: "Longs for transcendent soul union, poetic forgiveness, mystical empathy, and selfless spiritual dedication.",
  },
  Vesta: {
    Aries: "Devoted to the sacred flame of raw self-determination, pioneering breakthroughs, and solitary heroic focus.",
    Taurus: "Consecrated to sacred earthly craftsmanship, nurturing natural sanctuaries, and tactile embodiment.",
    Gemini: "Devoted to the preservation and dissemination of sacred knowledge, truth in communication, and intellectual focus.",
    Cancer: "Consecrated to tending the ancestral hearth, guarding emotional sanctity, and cherishing familial lineages.",
    Leo: "Devoted to sacred creative expression, preserving the royal flame of the divine child, and dramatic ritual.",
    Virgo: "Sacred priestess of meticulous craft, holistic purification, healing ceremonies, and selfless service.",
    Libra: "Devoted to holding the sacred scales of peace, artistic harmony, sacred partnership covenants, and justice.",
    Scorpio: "Consecrated to the occult mystery schools, kundalini sexual transmutation, and sacred underworld alchemy.",
    Sagittarius: "Devoted to the sacred quest for absolute truth, higher spiritual wisdom, pilgrimages, and philosophical dharma.",
    Capricorn: "Consecrated to sacred work of enduring discipline, ancestral temple-building, and structural integrity.",
    Aquarius: "Devoted to the liberation of humanity, revolutionary causes, cosmic brotherhood, and visionary community.",
    Pisces: "Consecrated to universal compassion, mystical prayer, selfless sanctuary, and dissolution of the separate ego into the divine.",
  },
};

export const ASTEROID_HOUSE_INTERPRETATIONS: Record<
  "Ceres" | "Pallas" | "Juno" | "Vesta",
  Record<number, string>
> = {
  Ceres: {
    1: "Self-nurturing is vital to your vitality and identity. You radiate protective, motherly or paternal warmth to others.",
    2: "Nurturing is deeply anchored in material stability, wholesome food, financial security, and self-worth.",
    3: "Nurturing through daily conversation, writing, neighborhood kinship, and stimulating local mental connections.",
    4: "The foundational archetype of hearth and home: profound ancestral connection and making domestic spaces a sacred refuge.",
    5: "Nurturing blooms through inner-child play, artistic expression, romance, joy, and raising children or creative projects.",
    6: "Nurturing expressed through daily routines, holistic health regimens, herbal wellness, and care for pets or vulnerable beings.",
    7: "Nurturing is channeled directly into one-on-one partnerships, seeking and providing tender reciprocal care.",
    8: "Nurturing through deep psychological transformation, shared vulnerability, healing generational grief, and intimacy.",
    9: "Nurturing through philosophical teaching, foreign cultures, pilgrimages, spiritual wisdom, and higher learning.",
    10: "Nurturing manifests on the public stage: viewed by society as a natural caregiver, protector, or mentor in your vocation.",
    11: "Nurturing community collectives, humanitarian causes, social networks, and fostering chosen family among friends.",
    12: "Nurturing in solitary contemplation, spiritual prayer, hospice or retreat environments; healing unconscious maternal wounds.",
  },
  Pallas: {
    1: "A sharp, strategic presence in your very aura; viewed as a decisive problem-solver and courageous warrior-intellect.",
    2: "Strategic acumen directed toward financial systems, resource optimization, investing, and practical economic design.",
    3: "Brilliant pattern recognition in communications, writing, media strategy, and logical debate.",
    4: "Strategist of the domestic realm; organizing the home foundation and healing inherited ancestral conflict through wisdom.",
    5: "Creative and artistic brilliance; inventive gameplay, tactical theater, and finding playful solutions to complex riddles.",
    6: "Master troubleshooter in the workplace; diagnostic medicine, systems efficiency, and optimizing functional craftsmanship.",
    7: "Strategic advisor in relationships and business partnerships; skillful mediator who balances opposing interests with fairness.",
    8: "Investigative psychologist and researcher; penetrates hidden secrets, financial audits, and taboos with forensic precision.",
    9: "Philosophical jurist and visionary; excels in constitutional law, geopolitics, academia, and global cross-cultural systems.",
    10: "Public reputation as an astute strategist, high-level policy director, executive planner, and advisor to leaders.",
    11: "Strategic organizing for social reforms, activist movements, technological networks, and innovative think-tanks.",
    12: "Mystical strategist; receives solutions in dreams, intuitive flashes, and esoteric systems; dissolves mental rigidity.",
  },
  Juno: {
    1: "Partnership is essential to self-actualization; you project magnetism that invites serious, life-defining commitments.",
    2: "Commitment thrives on mutual financial equality, tangible security, shared assets, and reciprocal respect of personal values.",
    3: "Bonds are cemented through intellectual rapport, shared daily dialogues, open debate, and mental synchronization.",
    4: "Commitment is centered on building a lasting family sanctuary, home stability, and deep roots with a soul partner.",
    5: "Romantic devotion requires dramatic passion, shared creative projects, playful courting, and mutual pride in one another.",
    6: "Partnership grounded in daily teamwork, shared health habits, mutual respect for labor, and helpful domestic service.",
    7: "The classical placement of marriage and legal partnership: life flourishes when an equal, dedicated companion is honored.",
    8: "Intense soul contracts; marriage involves deep emotional and sexual vulnerability, financial merging, and psychological rebirth.",
    9: "Attracted to partners from diverse cultural or spiritual backgrounds; union is a shared philosophical journey of discovery.",
    10: "Public power couples; marriage contributes to social status, shared enterprise, and professional reputation.",
    11: "Partnership based on shared progressive vision, friendship as the foundation of love, and participating in wider community.",
    12: "Karmic and spiritual unions; soulmate connections that require overcoming idealization and honoring silent, unconditional love.",
  },
  Vesta: {
    1: "You carry a sacred, self-contained flame within your personal aura; intense personal discipline and magnetic inner focus.",
    2: "Devotion focused on cultivating inner values, ethical stewardship of finances, and respecting bodily sacredness.",
    3: "Sacred focus on studies, dedicated writing, teaching, communication craft, and purifying the spoken word.",
    4: "Tender of the home hearth; dedicated to maintaining peace, domestic privacy, and ancestral spiritual continuity.",
    5: "Total devotion to creative artistry, theater, self-expression, or the dedicated education and nurturing of youth.",
    6: "Sacred service through daily discipline, wellness regimens, meticulous craftsmanship, and healing others selflessly.",
    7: "Devotion to relationship integrity; requires periods of sacred solitude to avoid self-erasure in partnerships.",
    8: "Consecration through psychological depth, sacred sexuality, occult transformation, and holding space during crisis.",
    9: "Devotion to spiritual truth, philosophical pilgrimage, academic scholarship, and honoring sacred global traditions.",
    10: "High dedication to vocation; you view your professional work as a sacred calling, dedicating years of discipline to mastery.",
    11: "Devotion to humanitarian ideals, social justice collectives, visionary communities, and brotherhood of humanity.",
    12: "The cloistered mystic; deep sanctuary in prayer, meditation, retreat centers, and quiet devotion away from the public gaze.",
  },
};

// -------------------------------------------------------------
// 2. BLACK MOON LILITH INTERPRETATIONS
// -------------------------------------------------------------

export const LILITH_SIGN_INTERPRETATIONS: Record<string, string> = {
  Aries: "Primal, untamed autonomy; fiercely refuses subjugation. Reclaims personal anger, raw survival instinct, and instinctive power.",
  Taurus: "Sensual bodily sovereignty; challenges societal shame around physical desires, material pleasure, and unapologetic self-worth.",
  Gemini: "Subversive intellect; speaks taboo truths, rejects ideological censorship, and wields words with sharp psychological insight.",
  Cancer: "Primal protective matriarch; confronts generational family trauma, maternal rejection, and refuses conditional emotional bonding.",
  Leo: "Sovereign creative audacity; rejects false modesty, shines without seeking external permission, and reclaims raw regal power.",
  Virgo: "Wild somatic perfection; exposes hypocrisy in rigid dogma, heals through untamed nature, and resists neurotic servitude.",
  Libra: "Radical relational honesty; refuses to smile for the comfort of others, destroys shallow diplomacy, and demands authentic equality.",
  Scorpio: "High priestess of the underworld; fearless mastery over sexual taboos, occult truth, death-rebirth cycles, and psychic power.",
  Sagittarius: "Wild philosophical heresy; questions religious orthodoxies, hungers for untamed wilderness, and lives by intuitive moral truth.",
  Capricorn: "Anti-patriarchal authority; exposes corrupt institutions, reclaims cold stoic endurance, and builds sovereignty without approval.",
  Aquarius: "Radical outsider genius; defies herd conformity, champions the marginalized, and embodies unapologetic revolutionary freedom.",
  Pisces: "Mystical ecstatic oceanic shadow; dissolves spiritual illusions, confronts existential abandonment, and channels trance-like compassion.",
};

export const LILITH_HOUSE_INTERPRETATIONS: Record<number, string> = {
  1: "Lilith in the 1st House casts an unforgettable, magnetic, and fiercely independent presence. You cannot be tamed or boxed into social expectations.",
  2: "Lilith in the 2nd House confronts deep taboos regarding money, survival, and bodily autonomy; transforms material scarcity into unshakeable self-worth.",
  3: "Lilith in the 3rd House speaks uncomfortable truths that disturb small minds; gifted in psychological writing, investigative reporting, and provocative discourse.",
  4: "Lilith in the 4th House challenges family secrets and traditional maternal roles; breaks generational curses to forge an authentic personal sanctuary.",
  5: "Lilith in the 5th House creates raw, provocative art and unapologetic romantic desire; refuses to temper joyful passion for conservative onlookers.",
  6: "Lilith in the 6th House rejects micro-management and corporate subservience; discovers healing through unconventional medicine and somatic sovereignty.",
  7: "Lilith in the 7th House magnetically draws intense, boundary-pushing partners; demands absolute equality and rejects codependent compromise.",
  8: "Lilith in the 8th House dives deep into psychological alchemy, sacred sexuality, and ancestral inheritance; fears neither darkness nor transformation.",
  9: "Lilith in the 9th House rebels against dogmatic religions and academic gatekeepers; seeks authentic gnosis and wild spiritual frontiers.",
  10: "Lilith in the 10th House commands a disruptive, magnetic public reputation; refuses to bow to conventional authorities, achieving power on her own terms.",
  11: "Lilith in the 11th House feels like an outsider among standard social cliques; forms fierce alliances with rebels, visionaries, and nonconformists.",
  12: "Lilith in the 12th House holds profound mystical shadow in the subconscious; accesses ancestral intuition, dream revelations, and psychic shielding.",
};

// -------------------------------------------------------------
// 3. ADDITIONAL POINTS (VERTEX, WHITE MOON, EAST POINT)
// -------------------------------------------------------------

export const ADDITIONAL_POINTS_INTERPRETATIONS: Record<string, string> = {
  Vertex: "The Vertex acts as the 'electric axis of destiny' in the western hemisphere. Encounters, relationships, and sudden turning points occurring at this degree feel fated, irresistible, and spiritually compulsory, permanently altering your evolutionary life path.",
  AntiVertex: "The polarity point of the Vertex in the eastern hemisphere; reflects personal initiative, internal catalysts, and conscious choices that spark fated meetings.",
  WhiteMoon: "White Moon Selena represents the guardian angel and pure reservoir of karmic light in your chart. Where Selena sits, you experience divine protection, instinctive moral clarity, innocence, and blessings when you act from selfless integrity.",
  EastPoint: "The East Point (Equatorial Ascendant) acts as a secondary, mental Ascendant on the celestial equator. It highlights how you instinctively formulate ideas and how your conscious mind projects itself into immediate surroundings.",
  Proserpine: "Symbolic archetype of the soul surviving the underworld; governs deep cellular regeneration, total metamorphosis after crisis, and spiritual immortality.",
  Hypnos: "Symbolic archetype of the dream architect; connects waking consciousness to liminal states, lucid dreaming, hypnagogic inspiration, and archetypal memory.",
};
