/**
 * Comprehensive Astrological & Cosmological Interpretations Repository
 * Provides rich, erudite, and psychologically nuanced interpretations for
 * Western planetary placements, houses, aspects, Vedic Nakshatras, and cross-system synthesis.
 */

export interface PlacementInterpretation {
  essence: string;
  strengths: string[];
  growthEdges: string[];
  archetype: string;
}

export const SUN_SIGN_INTERPRETATIONS: Record<string, PlacementInterpretation> = {
  Aries: {
    essence: "The primordial spark of conscious existence. The Sun in Aries burns with an unyielding impulse to initiate, pioneer, and conquer territory through sheer will and raw vitality.",
    strengths: ["Unyielding courage", "Spontaneous initiative", "Direct honesty", "Fierce autonomy"],
    growthEdges: ["Impulsive anger", "Difficulty with follow-through", "Combative impatience"],
    archetype: "The Solar Hero & Sovereign Pioneer",
  },
  Taurus: {
    essence: "The sacred architect of material sanctuary. Taurus stabilizes solar radiance into tangible luxury, organic beauty, sensory delight, and unshakeable steadfastness.",
    strengths: ["Unwavering loyalty", "Patience", "Sensory refinement", "Material acumen"],
    growthEdges: ["Possessive rigidity", "Resistance to inevitable change", "Complacency"],
    archetype: "The Master Artisan & Earth Warden",
  },
  Gemini: {
    essence: "The alchemical weaver of intellect and language. Gemini sparkles with kaleidoscopic curiosity, linking disparate concepts and bridging human worlds through conversational wit.",
    strengths: ["Mental agility", "Eloquent articulation", "Playful versatility", "Rapid perception"],
    growthEdges: ["Scattered focus", "Nervous anxiety", "Superficial detachment"],
    archetype: "The Cosmic Messenger & Polymath",
  },
  Cancer: {
    essence: "The guardian of the ancestral hearth and emotional oceanic depths. Cancer illuminates the sacred power of memory, tender protection, and intuitive empathy.",
    strengths: ["Unconditional devotion", "Profound psychic empathy", "Protective loyalty", "Nourishing warmth"],
    growthEdges: ["Defensive emotional withdrawal", "Clinging to the past", "Mood fluctuations"],
    archetype: "The High Priestess of Memory & Hearth Guardian",
  },
  Leo: {
    essence: "The radiant monarch of creative self-expression. In its home sign, the Sun commands the cosmic center stage, dispensing generosity, dramatic royalty, and heart-centered warmth.",
    strengths: ["Regal magnanimity", "Charismatic warmth", "Artistic bravery", "Inspiring leadership"],
    growthEdges: ["Craving constant praise", "Ego pride", "Dramatic self-absorption"],
    archetype: "The Golden Sovereign & Creative Luminary",
  },
  Virgo: {
    essence: "The consecrated alchemist of devotion and sacred craft. Virgo transmutes raw earthly material into pristine utility through rigorous discernment and healing service.",
    strengths: ["Analytical precision", "Dedicated craftsmanship", "Practical humility", "Holistic diagnostic care"],
    growthEdges: ["Hyper-critical perfectionism", "Chronic worry", "Inability to rest"],
    archetype: "The Sacred Craftsman & Healer",
  },
  Libra: {
    essence: "The sacred mirror of divine equilibrium and aesthetic grace. Libra seeks sublime symmetry, elevated diplomacy, and justice through reciprocal harmony with the Other.",
    strengths: ["Exquisite diplomacy", "Aesthetic refinement", "Impartial fairness", "Social grace"],
    growthEdges: ["Paralyzing indecision", "Conflict avoidance", "Over-compromising boundaries"],
    archetype: "The Cosmic Peacemaker & Architect of Beauty",
  },
  Scorpio: {
    essence: "The alchemical crucible of death, rebirth, and psychological depth. Scorpio dives fearlessly into the oceanic underworld, transmuting shadow into indestructible spiritual power.",
    strengths: ["Psychic penetration", "Indomitable resilience", "Fierce loyalty", "Transformative regeneration"],
    growthEdges: ["Vindictive brooding", "Paranoid control", "Emotional obsessiveness"],
    archetype: "The Alchemist & Phoenix of Rebirth",
  },
  Sagittarius: {
    essence: "The celestial archer seeking truth across infinite horizons. Sagittarius gallops beyond orthodoxy with philosophical optimism, expansive laughter, and spiritual hunger.",
    strengths: ["Philosophical vision", "Generous optimism", "Love of truth and freedom", "Cultural adaptability"],
    growthEdges: ["Dogmatic righteousness", "Blunt tactlessness", "Restless escapism"],
    archetype: "The Philosophical Pilgrim & Visionary Sage",
  },
  Capricorn: {
    essence: "The master builder ascending the mountain of time. Capricorn embodies patient discipline, institutional mastery, and sober stewardship of enduring legacies.",
    strengths: ["Ironclad integrity", "Strategic patience", "Unshakable self-reliance", "Executive competence"],
    growthEdges: ["Emotional austerity", "Pessimistic cynicism", "Workaholism"],
    archetype: "The Elder Sovereign & Master Architect",
  },
  Aquarius: {
    essence: "The cosmic water-bearer pouring lightning from the future. Aquarius breaks archaic dogma to architect egalitarian communities and awaken collective consciousness.",
    strengths: ["Visionary originality", "Humanitarian ideals", "Intellectual objectivity", "Radical authenticity"],
    growthEdges: ["Emotional aloofness", "Rebelliousness for its own sake", "Ideological dogmatism"],
    archetype: "The Revolutionary Innovator & Cosmic Stargazer",
  },
  Pisces: {
    essence: "The mystical ocean where all boundaries dissolve into oneness. Pisces channels divine compassion, poetic transcendence, and communion with the eternal source.",
    strengths: ["Boundless compassion", "Poetic imagination", "Spiritual devotion", "Mystical receptivity"],
    growthEdges: ["Spiritual escapism", "Lack of boundaries", "Martyrdom"],
    archetype: "The Mystic Dreamer & Universal Healer",
  },
};

export const MOON_SIGN_INTERPRETATIONS: Record<string, string> = {
  Aries: "Emotionally instinctual, fiery, and immediate. You process life through direct physical confrontation and passion; you require emotional autonomy and brave challenges to feel secure.",
  Taurus: "Exalted in this earthy sign. Your emotional center is tranquil, sensuous, grounded, and slow to anger. You find sanctuary in tactile beauty, comforting rituals, and unshakeable loyalty.",
  Gemini: "Emotionally processed through language, mental agility, and social exchange. When stressed, you converse, write, or dissect feelings intellectually rather than brooding.",
  Cancer: "In its celestial domicile. Your soul swims in oceanic intuition and protective care. Deeply bonded to sanctuary and home, your moods mirror the tidal phases with profound empathy.",
  Leo: "Your inner heart requires warmth, creative applause, and generous dramatic play. You protect loved ones with fierce regal devotion and process feelings with proud magnanimity.",
  Virgo: "You process emotions through practical organization, helpful service, and mental order. Feeling useful, wholesome, and disciplined gives your soul lasting peace.",
  Libra: "Deep psychological need for aesthetic harmony and relational peace. You process feelings by consulting trusted confidants and restore calm through beauty and polite grace.",
  Scorpio: "Intense, psychic, and deeply private. You experience emotions as fathomless tides and demand absolute vulnerability and unwavering truth from intimate companions.",
  Sagittarius: "Emotionally expansive, candid, and philosophical. You process sadness by seeking higher meaning, changing geography, or finding humor in the grand cosmic comedy.",
  Capricorn: "Emotionally sober, self-contained, and patient. You guard your tender vulnerabilities beneath an armor of competence, offering steadfast support to those you cherish.",
  Aquarius: "Intuitive yet intellectually objective. You require emotional space and freedom from claustrophobic drama; you find sanctuary in chosen tribes, causes, and abstract ideals.",
  Pisces: "Psychically porous, empathic, and poetic. You absorb the emotional climate of any room like a spiritual sponge and heal your spirit through music, water, dreams, and prayer.",
};

export const ASCENDANT_INTERPRETATIONS: Record<string, string> = {
  Aries: "You enter the world as a dynamic, bold pioneer. Your physical posture exudes direct action, courage, and an instinct to lead without waiting for permission.",
  Taurus: "You project an aura of grounded calm, tactile presence, and serene beauty. Others perceive you as a stabilizing anchor who moves with deliberate, patient grace.",
  Gemini: "You meet reality with sparkling curiosity, youthful agility, and quick-witted speech. You present as an articulate conversationalist with alert, expressive eyes.",
  Cancer: "You present a gentle, receptive, and protective demeanor. People intuitively feel safe around your nurturing aura, though you keep a guarded shell until trust is earned.",
  Leo: "You enter rooms with natural royal dignity, radiant warmth, and magnetic poise. Your presence is luminous, generous, and impossible to overlook.",
  Virgo: "You project refined discernment, immaculate composure, and quiet competence. People notice your observant gaze, neat demeanor, and attentive listening.",
  Libra: "You walk into the world with natural elegance, charming smile, and peaceful symmetry. You instinctively harmonize social friction and project refined taste.",
  Scorpio: "You project an intense, magnetic, and enigmatic gaze that sees straight into people's souls. People sense your formidable inner power and emotional gravity.",
  Sagittarius: "You enter with an open smile, adventurous stride, and philosophical twinkle in the eye. You project boundless optimism, humor, and worldly sophistication.",
  Capricorn: "You project commanding maturity, reserved dignity, and quiet authority. Others intuitively respect your gravitas and trust you with serious responsibility.",
  Aquarius: "You present as an eccentric, progressive, and intellectually intriguing free spirit. Unmoved by peer pressure, you carry an aura of unique originality.",
  Pisces: "You meet the world with dreamy, gentle eyes and an ethereal, poetic presence. You project tender empathy and an otherworldly, enchanting charm.",
};

export const HOUSE_INTERPRETATIONS: Record<number, { title: string; area: string; meaning: string }> = {
  1: {
    title: "1st House (Lagna / Ascendant)",
    area: "Self, Physical Constitution, Vitality & Emergence",
    meaning: "The gateway of incarnation. Governs how you project your persona into the world, your physical vitality, your primary survival instincts, and your direct approach to new horizons.",
  },
  2: {
    title: "2nd House (Dhana Bhava)",
    area: "Wealth, Material Values, Voice & Self-Worth",
    meaning: "The sanctum of resources. Governs tangible assets, liquid capital, your inherent value system, speech, diet, and what you gather to cultivate physical security.",
  },
  3: {
    title: "3rd House (Sahaja Bhava)",
    area: "Mind, Courage, Siblings, Writing & Local Environment",
    meaning: "The arena of connection. Governs daily intellect, communication, manual skills, short-distance journeys, siblings, neighbors, and brave personal initiative.",
  },
  4: {
    title: "4th House (Sukha Bhava / Imum Coeli)",
    area: "Home, Ancestral Roots, Inner Peace & Mother",
    meaning: "The psychological foundation. Governs your private sanctuary, family lineage, real estate, emotional baseline, and the sanctuary you retreat to when night falls.",
  },
  5: {
    title: "5th House (Putra Bhava)",
    area: "Creativity, Romance, Children, Speculation & Joy",
    meaning: "The fountain of divine play (Lila). Governs passionate romance, artistic creations, progeny, hobbies, joyful risks, and past-life merits (Purva Punya).",
  },
  6: {
    title: "6th House (Ripu / Ari Bhava)",
    area: "Daily Work, Health, Discipline & Overcoming Obstacles",
    meaning: "The forge of refinement. Governs daily work habits, bodily hygiene, medicine, service to others, overcoming disputes, and transmuting friction into mastery.",
  },
  7: {
    title: "7th House (Kalatra Bhava / Descendant)",
    area: "Sacred Partnerships, Marriage, Contracts & The Other",
    meaning: "The mirror of relationship. Governs significant one-on-one commitments, marital unions, contractual business alliances, and qualities you project onto partners.",
  },
  8: {
    title: "8th House (Ayu / Randhra Bhava)",
    area: "Transformation, Shared Wealth, Occult & Rebirth",
    meaning: "The alchemical crucible. Governs deep psychological shadow, joint finances, inheritance, sexuality, metaphysics, crises that yield spiritual rebirth, and longevity.",
  },
  9: {
    title: "9th House (Dharma Bhava)",
    area: "Higher Wisdom, Philosophy, Long Journeys & Guru",
    meaning: "The temple of truth. Governs higher academia, spiritual dharma, foreign pilgrimages, legal ethics, luck, and guidance received from enlightened teachers.",
  },
  10: {
    title: "10th House (Karma Bhava / Midheaven)",
    area: "Public Legacy, Career, Sovereignty & Honors",
    meaning: "The zenith of worldly ambition. Governs your highest social contribution, professional mastery, reputation before society, executive authority, and historical imprint.",
  },
  11: {
    title: "11th House (Labha Bhava)",
    area: "Aspirations, Tribes, Humanitarian Alliances & Gains",
    meaning: "The circle of fellowship. Governs major life dreams, financial windfalls from career, progressive networks, friendships, and collective humanitarian movements.",
  },
  12: {
    title: "12th House (Moksha / Vyaya Bhava)",
    area: "Spiritual Liberation, Solitude, Subconscious & Dreams",
    meaning: "The oceanic threshold of transcendence. Governs meditation, foreign lands, sleep, dreamscapes, release of ego attachments, and final spiritual enlightenment.",
  },
};

export const ASPECT_INTERPRETATIONS: Record<string, string> = {
  Conjunction: "A potent alchemical fusion where two planetary energies merge into a singular, unified force of expression.",
  Sextile: "A gentle, harmonious opening that brings intellectual flow, creative opportunities, and supportive circumstances when actively cultivated.",
  Trine: "A blessed river of natural grace, effortless talent, and harmonic alignment that operates without friction.",
  Square: "A dynamic, high-voltage crucible of creative friction that forces maturity, action, and undeniable breakthrough through perseverance.",
  Opposition: "A polarizing tug-of-war across the zodiac axis demanding integration, conscious awareness, and dialectical synthesis of opposing needs.",
  Quincunx: "An enigmatic blind spot requiring subtle mental adjustment, humility, and ongoing rebalancing between incompatible urges.",
  Semisextile: "A subtle developmental stepping stone linking adjacent signs, fostering quiet incremental learning and adaptability.",
};
