/**
 * Complete Chaldean Numerology Engine
 * Incorporates:
 * 1. Chaldean Alphabet numerical mapping (1-8, no 9 in alphabet)
 * 2. Compound numbers & Single root numbers for Full Name, First Name, Last Name
 * 3. Complete classical database of Compound Numbers 10 through 52
 * 4. Classical Cheiro occult interpretations, warnings, and guidance
 */

import {
  ChaldeanCompoundMeaning,
  ChaldeanNameComponent,
  ChaldeanProfile,
} from "./types";

export const CHALDEAN_ALPHABET_MAP: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

export const CHALDEAN_COMPOUND_DATABASE: Record<number, ChaldeanCompoundMeaning> = {
  10: {
    number: 10,
    title: "The Wheel of Fortune",
    nature: "Self-confident, radiant, triumphant, and magnetic.",
    occultSignificance: "Symbolized by the Sphinx rising above the wheel. It signifies honor, faith, confidence, rise in life, and fulfillment of plans.",
    warning: "Beware of sudden unexpected twists of the wheel if arrogance blinds your humility.",
    advice: "Stay adaptable, act decisively, and trust your sovereign creative momentum.",
    fortuneCategory: "Extremely Fortunate",
  },
  11: {
    number: 11,
    title: "The Lion Muzzled / Spiritual Messenger",
    nature: "Highly intuitive, spiritually charged, sensitive, and visionary.",
    occultSignificance: "Symbolized by a clenched fist or a lion muzzled. Represents intense trials of fortitude, hidden perils, nervous tension, and deceptive allies.",
    warning: "Vulnerability to betrayal, anxiety, and trusting people who do not have your highest good at heart.",
    advice: "Develop unwavering emotional patience, ground your psychic antennae, and verify alliances before committing.",
    fortuneCategory: "Karmic Trial / Warning",
  },
  12: {
    number: 12,
    title: "The Sacrifice / The Victim",
    nature: "Selfless, deeply empathetic, visionary, yet easily taken advantage of.",
    occultSignificance: "Symbolized by one who is sacrificed for the welfare of others or suffers for an ideal. Represents yielding personal interest for communal benefit.",
    warning: "Victim mentality, passive-aggressive self-pity, or allowing others to exploit your good nature.",
    advice: "Learn the sacred power of saying 'No'. True spiritual service never requires destroying your own wellbeing.",
    fortuneCategory: "Caution Required",
  },
  13: {
    number: 13,
    title: "Transformation & Regeneration",
    nature: "Cataclysmic, powerful, revolutionary, and deeply metamorphic.",
    occultSignificance: "Symbolized by the skeleton reaper with scythe. It is NOT an unlucky number, but a symbol of power which if rightly used brings monumental breakthrough.",
    warning: "Abuse of power, catastrophic sudden changes, or clinging stubbornly to dying structures.",
    advice: "Embrace voluntary death of outworn habits. Like the Phoenix, rise with clean intent from your ashes.",
    fortuneCategory: "Mystic / Dual",
  },
  14: {
    number: 14,
    title: "Movement & The Temperance",
    nature: "Adventurous, versatile, quicksilver, energetic, and magnetic.",
    occultSignificance: "Symbolized by two urns exchanging liquid. Represents movement of goods, people, speculative ventures, travel, and financial volatility.",
    warning: "Overindulgence, gambling with vital assets, reckless impulsivity, and sudden accidents through haste.",
    advice: "Exercise moderate temperance in all affairs. Anchor your dynamic momentum in solid risk management.",
    fortuneCategory: "Fortunate",
  },
  15: {
    number: 15,
    title: "The Magician / The Occultist",
    nature: "Hypnotic, charismatic, artistically gifted, and persuasive.",
    occultSignificance: "Associated with mystery, magic, eloquence, and drawing money or devotion effortlessly through magnetic charm and dramatic speech.",
    warning: "Using personal charm for selfish manipulation, dark sensual indulgence, or dishonest gain.",
    advice: "Direct your profound magnetic gifts toward noble upliftment, artistic beauty, and ethical leadership.",
    fortuneCategory: "Extremely Fortunate",
  },
  16: {
    number: 16,
    title: "The Shattered Citadel / The Fallen Tower",
    nature: "Proud, philosophical, ambitious, yet prone to dramatic upheavals.",
    occultSignificance: "Symbolized by a citadel struck by lightning from which a crowned king falls. Represents pride preceding an inevitable collapse.",
    warning: "Catastrophic collapses of ego, ruined plans, false friends, and unexpected accidents if living deceitfully.",
    advice: "Build your life on solid, unassailable ethical foundations. Humble honesty disarms the lightning strike.",
    fortuneCategory: "Karmic Trial / Warning",
  },
  17: {
    number: 17,
    title: "The Star of the Magi / Crown of Immortality",
    nature: "Radiant, celestial, spiritually elevated, and profoundly blessed.",
    occultSignificance: "Symbolized by the eight-pointed Star of Venus. Represents hope, eternal life, rising above earthly tribulations, and enduring renown.",
    warning: "Complacency or material disillusionment if you forget your higher spiritual calling.",
    advice: "Balance spiritual vision with practical grace. Your name and deeds have the power to live on long after you.",
    fortuneCategory: "Extremely Fortunate",
  },
  18: {
    number: 18,
    title: "Spiritual-Material Conflict / Deception",
    nature: "Complex, secretive, turbulent, battle-hardened, and perceptive.",
    occultSignificance: "Symbolized by a rayed moon dripping blood while a dog and wolf howl below. Signifies deception, inner conflicts between material gain and spirit.",
    warning: "Family feuds, lawsuits, treachery from associates, and peril through water or natural elements.",
    advice: "Practice unyielding transparency. Never engage in underhanded schemes; clarity is your only armor.",
    fortuneCategory: "Caution Required",
  },
  19: {
    number: 19,
    title: "The Prince of Heaven / Royal Radiance",
    nature: "Brilliant, victorious, sovereign, joyful, and honorable.",
    occultSignificance: "Symbolized by the glorious Sun shining upon radiant children. One of the most fortunate vibrations in the entire Chaldean system.",
    warning: "Hubris, blind egotism, or ignoring the humble needs of followers.",
    advice: "Step fully into leadership. Radiant generosity and warmth ensure continuous prosperity and widespread esteem.",
    fortuneCategory: "Extremely Fortunate",
  },
  20: {
    number: 20,
    title: "The Awakening / The Call to Judgment",
    nature: "Visionary, awakening, conscientious, and duty-bound.",
    occultSignificance: "Symbolized by a winged angel blowing a trumpet across the waters. Represents new spiritual purpose, awakening of sleeping gifts, and judgment.",
    warning: "Procrastination, hesitation, and self-doubt delaying the inevitable answer to your soul calling.",
    advice: "Answer the trumpet call of your higher conscience. Let go of past inertia and embrace renewal.",
    fortuneCategory: "Fortunate",
  },
  21: {
    number: 21,
    title: "The Crown of the Magi / Advancement",
    nature: "Accomplished, globally revered, victorious, and wise.",
    occultSignificance: "Symbolized by the garland of victory and universal triumph. Represents highest advancement, honors, and ultimate worldly and spiritual victory.",
    warning: "Isolation at the summit; forgetting the companions who helped you ascend.",
    advice: "Continue forward with dignified perseverance. Your long struggle leads to unquestioned mastery.",
    fortuneCategory: "Extremely Fortunate",
  },
  22: {
    number: 22,
    title: "Good Man Blinded / Foolish Trust",
    nature: "Kind, trusting, utopian, yet vulnerable to exploitation.",
    occultSignificance: "Symbolized by a pure man walking blissfully with a sack on his shoulder while a dog bites his heels near a precipice. Signifies foolish trust in false friends.",
    warning: "Living in a bubble of ungrounded optimism; falling victim to deceitful flatterers and sudden financial traps.",
    advice: "Open your eyes to harsh earthly realities. Pair your saintly compassion with razor-sharp analytical verification.",
    fortuneCategory: "Caution Required",
  },
  23: {
    number: 23,
    title: "The Royal Star of the Lion",
    nature: "Favored by destiny, authoritative, protected, and noble.",
    occultSignificance: "Symbolized by the Lion of Judah. It promises assistance from superiors, protection in high-stakes ventures, and steady elevation to honor.",
    warning: "Complacency; expecting effortless success without maintaining professional excellence.",
    advice: "Accept noble patronage with gracious gratitude and lead with generous compassion.",
    fortuneCategory: "Extremely Fortunate",
  },
  24: {
    number: 24,
    title: "Love, Money & Assistance",
    nature: "Affectionate, prosperous, harmonious, and supported by allies.",
    occultSignificance: "Promises financial prosperity, happy romantic partnerships, and unconditional support from powerful mentors and elders.",
    warning: "Becoming emotionally or financially dependent on others' generosity; losing individual initiative.",
    advice: "Cultivate inner independence while delighting in the abundance and love that naturally flows to you.",
    fortuneCategory: "Extremely Fortunate",
  },
  25: {
    number: 25,
    title: "Strength Through Experience / Discernment",
    nature: "Wise, resilient, philosophical, and observant.",
    occultSignificance: "Represents gaining profound wisdom, analytical power, and moral strength through early struggles and trials.",
    warning: "Bitterness, cynicism, or holding onto old grudges and regrets.",
    advice: "Transform your scars into sacred teachings. Your hard-earned discernment is your greatest asset.",
    fortuneCategory: "Fortunate",
  },
  26: {
    number: 26,
    title: "Partnership Warnings / The Disputed Harvest",
    nature: "Capable, hardworking, executive, yet prone to difficult alliances.",
    occultSignificance: "Warns of grave dangers through bad partnerships, deceptive business ventures, ruinous litigation, and broken agreements.",
    warning: "Legal disputes, betrayal in business collaborations, and devastating financial contracts.",
    advice: "Never sign contracts without rigorous legal scrutiny. Maintain sole ownership wherever feasible.",
    fortuneCategory: "Caution Required",
  },
  27: {
    number: 27,
    title: "The Sceptre / Supreme Command",
    nature: "Authoritative, intellectually dominant, commanding, and righteous.",
    occultSignificance: "Symbolized by the imperial sceptre. Confers high mental power, authority in executive management, and successful administration of large enterprises.",
    warning: "Tyrannical arrogance, excessive pride, or crushing the initiative of subordinates.",
    advice: "Lead with enlightened magnanimity. When power is married to compassion, your rule is beloved and everlasting.",
    fortuneCategory: "Extremely Fortunate",
  },
  28: {
    number: 28,
    title: "Trust Betrayed / Caution in Contracts",
    nature: "Promising, industrious, yet constantly tested by human treachery.",
    occultSignificance: "A number of tragic contradictions. It promises early success, but warns of loss through misplaced trust, deceitful partners, and legal entanglements.",
    warning: "Total financial or emotional loss through blind trust in partners, lovers, or financial advisers.",
    advice: "Demand proof in every transaction. Do not lend money to friends or sign personal guarantees.",
    fortuneCategory: "Caution Required",
  },
  29: {
    number: 29,
    title: "Grace Under Pressure / Crucible of the Soul",
    nature: "Intense, resilient, charismatic, undergoing severe trials.",
    occultSignificance: "Represents severe emotional trials, deception from the opposite sex, unexpected tribulations, and testing of character.",
    warning: "Emotional burnout, falling prey to toxic romantic illusions, and sudden reversals.",
    advice: "Anchor your heart in spiritual detachment. When you pass through the fire, pure gold remains.",
    fortuneCategory: "Karmic Trial / Warning",
  },
  30: {
    number: 30,
    title: "Thoughtful Deduction / Mental Superiority",
    nature: "Intellectual, contemplative, strategic, and philosophical.",
    occultSignificance: "Signifies mental supremacy, high deduction, philosophical writing, and mastery of intellectual sciences.",
    warning: "Overthinking leading to paralysis by analysis; emotional coldness or intellectual aloofness.",
    advice: "Bridge high intellectual brilliance with compassionate real-world action.",
    fortuneCategory: "Fortunate",
  },
  31: {
    number: 31,
    title: "The Recluse / The Solitary Thinker",
    nature: "Introspective, independent, self-contained, and original.",
    occultSignificance: "Similar to 30, but more detached and isolated. Represents profound self-reliance, philosophy, and disdain for superficial society.",
    warning: "Extreme isolation, social estrangement, or losing touch with practical worldly needs.",
    advice: "Keep a warm bridge to community. Share your solitary insights with the world.",
    fortuneCategory: "Mystic / Dual",
  },
  32: {
    number: 32,
    title: "Communication / The Sovereign Word",
    nature: "Magical in speech, socially magnetic, and commercially brilliant.",
    occultSignificance: "Possesses a magical power over words, writing, speech, and public communication. Highly fortunate for deals and diplomacy.",
    warning: "Gossip, exaggeration, double-dealing, or wasting verbal power on trivialities.",
    advice: "Use your sovereign eloquence to inspire, unite, and negotiate fair agreements for all.",
    fortuneCategory: "Extremely Fortunate",
  },
  33: {
    number: 33,
    title: "Sacred Compassion / Love and Devotion",
    nature: "Selfless, noble, inspiring, and universally revered.",
    occultSignificance: "Carries the double vibration of Jupiter (3). Highly fortunate for teaching, humanitarian philanthropy, mentorship, and selfless service.",
    warning: "Sacrificing your health and resources to the point of personal ruin.",
    advice: "Maintain wise boundaries while radiating universal benevolence.",
    fortuneCategory: "Extremely Fortunate",
  },
  34: {
    number: 34,
    title: "Strength Through Enterprise (Echo of 25)",
    nature: "Hardworking, disciplined, persistent, and grounded.",
    occultSignificance: "Promises steady success gained through personal effort, solid craftsmanship, and enduring perseverance.",
    warning: "Getting bogged down in repetitive manual toil without delegating.",
    advice: "Build systems that can scale beyond your solitary labor.",
    fortuneCategory: "Fortunate",
  },
  35: {
    number: 35,
    title: "Financial & Partnership Discernment (Echo of 26)",
    nature: "Prudent, commercially astute, cautious, and calculating.",
    occultSignificance: "Warns of financial speculation and volatile commercial partners; demands utmost prudence in investments.",
    warning: "Loss of capital through sudden joint-venture defaults.",
    advice: "Keep reserves in secure, liquid assets and insist on binding oversight in business.",
    fortuneCategory: "Caution Required",
  },
  36: {
    number: 36,
    title: "Authority & Creative Accomplishment (Echo of 27)",
    nature: "Creative, commanding, artistically authoritative, and productive.",
    occultSignificance: "Combines creative genius (3) with community leadership (6). Promises honor in artistic, literary, and public works.",
    warning: "Excessive expenditure on luxury or artistic vanity.",
    advice: "Channel creative power into structured, enduring public masterworks.",
    fortuneCategory: "Extremely Fortunate",
  },
  37: {
    number: 37,
    title: "Harmonious Partnerships & Good Friendships",
    nature: "Charming, fortunate, mutually beneficial, and honorable.",
    occultSignificance: "Promises splendid friendships, fortunate partnerships in romance and business, and elevation through cooperative endeavors.",
    warning: "Over-reliance on friends to fight your battles.",
    advice: "Cherish your true allies and reciprocate their loyalty tenfold.",
    fortuneCategory: "Extremely Fortunate",
  },
  38: {
    number: 38,
    title: "Spiritual Strength & Peril of Illusion (Echo of 29)",
    nature: "Intuitive, artistic, tested by relational turmoil.",
    occultSignificance: "Warns of deceitful flatterers and emotional betrayal, while offering deep spiritual intuition to those who remain humble.",
    warning: "Vulnerability to emotional manipulation and romantic delusions.",
    advice: "Look past charming facades; judge people solely by their consistent actions.",
    fortuneCategory: "Karmic Trial / Warning",
  },
  39: {
    number: 39,
    title: "Intellectual Power & Self-Restraint (Echo of 30)",
    nature: "Analytical, erudite, critical, and articulate.",
    occultSignificance: "High intellectual agility and philosophical clarity. Gives authority in debate, literature, and academia.",
    warning: "Sharp verbal sarcasm that wounds and alienates loved ones.",
    advice: "Temper your razor intellect with gentle emotional empathy.",
    fortuneCategory: "Fortunate",
  },
  40: {
    number: 40,
    title: "Guarding the Inner Sanctorum (Echo of 31)",
    nature: "Prudent, silent, steadfast, and deeply grounded.",
    occultSignificance: "Represents a fortified sanctuary; enduring stability achieved through quiet, unshakeable discipline and modesty.",
    warning: "Emotional withdrawal and resistance to modern progress.",
    advice: "Maintain your quiet integrity while staying engaged with worldly advancements.",
    fortuneCategory: "Fortunate",
  },
  41: {
    number: 41,
    title: "Inspirational Leadership & Eloquence (Echo of 32)",
    nature: "Magnetic, persuasive, commanding, and commercially sharp.",
    occultSignificance: "Combines the builder (4) with the pioneer (1). Promises commercial triumph, persuasive marketing, and executive victory.",
    warning: "Overconfidence leading to reckless commitments.",
    advice: "Honor every promise you make in writing and business.",
    fortuneCategory: "Extremely Fortunate",
  },
  42: {
    number: 42,
    title: "Diplomatic Fortune & Harmonious Alliances (Echo of 24)",
    nature: "Diplomatic, charming, affectionate, and supported by grace.",
    occultSignificance: "Brings universal good will, prosperous partnerships, artistic refinement, and protection from open enemies.",
    warning: "Complacency in comfort; avoiding difficult confrontations.",
    advice: "Preserve peace through proactive diplomacy rather than passive avoidance.",
    fortuneCategory: "Extremely Fortunate",
  },
  43: {
    number: 43,
    title: "The Upheaval & Caution (Unfortunate Symbol)",
    nature: "Turbulent, unpredictable, revolutionary, and testing.",
    occultSignificance: "Ancient symbol of sudden upheavals, failure of plans through unforeseen accidents, and friction with authorities.",
    warning: "Impulsive rebelliousness, legal confrontations, and sudden structural failures.",
    advice: "Exercise double vigilance in travel, contracts, and public statements. Seek calm counsel.",
    fortuneCategory: "Caution Required",
  },
  44: {
    number: 44,
    title: "Material Mastery vs. Rigidity (Echo of 26)",
    nature: "Formidable, executive, powerhouse, yet burdened by heavy duty.",
    occultSignificance: "Double number of Saturn (4+4). Conveys immense capacity for relentless labor, construction, and managing heavy enterprise.",
    warning: "Crushing stress, physical exhaustion, and ruthless inflexibility.",
    advice: "Delegate responsibilities. Allow joy and leisure into your busy schedule.",
    fortuneCategory: "Fortunate",
  },
  45: {
    number: 45,
    title: "Great Intellectual Mastery & Authority (Echo of 27)",
    nature: "Commanding, strategic, philosophically profound, and victorious.",
    occultSignificance: "Combines 4 and 5 yielding 9 (Mars). Represents military strategy, corporate conquest, and decisive executive victory.",
    warning: "Excessive aggression in negotiations.",
    advice: "Win hearts, not merely battles. True victory leaves both parties empowered.",
    fortuneCategory: "Extremely Fortunate",
  },
  46: {
    number: 46,
    title: "Prosperity Through Noble Collaborations (Echo of 37)",
    nature: "Harmonious, philanthropic, commercially blessed, and respected.",
    occultSignificance: "Promises wealth and community standing through joint ventures, family harmony, and moral enterprise.",
    warning: "Extravagant social spending.",
    advice: "Reinvest your profits into durable community and family legacies.",
    fortuneCategory: "Extremely Fortunate",
  },
  47: {
    number: 47,
    title: "Mystic Vision & Overcoming Trials (Echo of 29)",
    nature: "Spiritual, clairvoyant, sensitive, and emotionally deep.",
    occultSignificance: "Deep spiritual revelations following periods of sorrow or emotional betrayal. Awakeness through the heart.",
    warning: "Escapism into fantasy when facing mundane problems.",
    advice: "Use your profound intuitive depth to heal and counsel others.",
    fortuneCategory: "Mystic / Dual",
  },
  48: {
    number: 48,
    title: "Analytical Depth & Strategic Realism (Echo of 30)",
    nature: "Meticulous, observant, scientific, and realistic.",
    occultSignificance: "Gives unmatched competence in complex finance, engineering, coding, and mathematical systems.",
    warning: "Cynical disbelief in miracles or spontaneous love.",
    advice: "Remember that the highest logic includes intuition and wonder.",
    fortuneCategory: "Fortunate",
  },
  49: {
    number: 49,
    title: "Spiritual Solitude & High Ideals (Echo of 31)",
    nature: "Visionary, solitary, principled, and uncompromising.",
    occultSignificance: "A cycle of spiritual completion (7 squared). Demands deep contemplation, scientific discovery, and detachment from worldly noise.",
    warning: "Extreme stubbornness and feeling alien to normal society.",
    advice: "Find your tribe of kindred souls; do not dwell in self-imposed exile.",
    fortuneCategory: "Mystic / Dual",
  },
  50: {
    number: 50,
    title: "Expressive Genius & Commercial Dexterity (Echo of 32)",
    nature: "Brilliant, persuasive, quick-witted, and internationally adaptable.",
    occultSignificance: "Conveys mastery over language, global trade, high finance, and inspiring millions through the spoken or written word.",
    warning: "Superficial promises or spreading your focus across too many ventures.",
    advice: "Commit your multifaceted genius to one transformative cause.",
    fortuneCategory: "Extremely Fortunate",
  },
  51: {
    number: 51,
    title: "High Military & Executive Power",
    nature: "Fierce, triumphant, invincible in crisis, and highly favored.",
    occultSignificance: "Promises sudden rise to high command, military victory, executive honors, and courage that vanquishes all adversaries.",
    warning: "Creating enemies through ruthless competitiveness.",
    advice: "Be generous in victory. Protect the defenseless with your formidable might.",
    fortuneCategory: "Extremely Fortunate",
  },
  52: {
    number: 52,
    title: "Testing of Alliances & Prudence (Echo of 43)",
    nature: "Strategic, cautious, watchful, and tested by trials.",
    occultSignificance: "Warns of sudden unforeseen obstacles, legal surprises, and the necessity of verifying all agreements with ironclad security.",
    warning: "Blind reliance on verbal commitments; sudden disputes.",
    advice: "Secure your flank. Move slowly and verify all credentials before proceeding.",
    fortuneCategory: "Caution Required",
  },
};

/**
 * Reduce to single digit 1-9 strictly
 */
function reduceTo9(num: number): number {
  let cur = Math.abs(num);
  while (cur > 9) {
    cur = cur
      .toString()
      .split("")
      .reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return cur || 9;
}

/**
 * Calculate Chaldean Name Component
 */
export function calculateChaldeanComponent(name: string): ChaldeanNameComponent {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
  let compoundNumber = 0;
  for (const ch of clean) {
    compoundNumber += CHALDEAN_ALPHABET_MAP[ch] || 0;
  }

  const singleRoot = reduceTo9(compoundNumber || 1);

  // Cheiro's compound-number chapter ends at 52. Do not fold an out-of-range
  // raw name total into an unrelated 10-52 entry; retain the total and its root.
  const compoundMeaning =
    compoundNumber >= 10 && compoundNumber <= 52
      ? CHALDEAN_COMPOUND_DATABASE[compoundNumber]
      : undefined;
  const noCompoundReason = compoundNumber > 52
    ? "Cheiro's compound-number reference ends at 52; no Cheiro compound entry is assigned above that range."
    : "This name total is a single-digit value or does not resolve to a compound number in the 10-52 reference table.";
  const meaning = compoundMeaning || {
    number: compoundNumber,
    title: "No compound-number interpretation",
    nature: noCompoundReason,
    occultSignificance: "Only the single-root value is available for this name total in this implementation.",
    warning: "Do not attach a compound-number meaning to a single-digit total or an out-of-range number.",
    advice: "Use the single-root calculation only; no compound interpretation is assigned.",
    fortuneCategory: "Neutral" as const,
  };

  return {
    name,
    compoundNumber,
    singleRoot,
    compoundMeaning: {
      ...meaning,
      number: compoundNumber, // preserve the actual summed total
    },
  };
}

/**
 * Master Chaldean Profile Calculator
 */
export function calculateCompleteChaldeanProfile(fullName: string): ChaldeanProfile {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstNameStr = parts[0] || fullName;
  const lastNameStr = parts.length > 1 ? parts[parts.length - 1] : parts[0] || fullName;

  const fullComp = calculateChaldeanComponent(fullName);
  const firstComp = calculateChaldeanComponent(firstNameStr);
  const lastComp = calculateChaldeanComponent(lastNameStr);

  let vibrationalCompatibility = "";
  if (firstComp.singleRoot === lastComp.singleRoot) {
    vibrationalCompatibility = "Harmonious Internal Resonance: Your first name and surname resonate on the exact same root frequency, giving you high internal alignment and consistency of identity.";
  } else {
    vibrationalCompatibility = `Dynamic Dual Vibration: Your personal self (${firstComp.singleRoot}) and family ancestral heritage (${lastComp.singleRoot}) combine to forge your compound destination (${fullComp.compoundNumber} / ${fullComp.singleRoot}).`;
  }

  const cheiroGuidance = `Chaldean Master Insight: While your single digit (${fullComp.singleRoot}) reveals your outward physical personality and planetary ruler, your occult compound number (${fullComp.compoundNumber}: ${fullComp.compoundMeaning.title}) governs the hidden spiritual forces and destiny that shape your life trajectory.`;

  return {
    fullName: fullComp,
    firstName: firstComp,
    lastName: lastComp,
    vibrationalCompatibility,
    cheiroGuidance,
  };
}
