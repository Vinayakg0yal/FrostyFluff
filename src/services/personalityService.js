const { PERSONALITIES } = require("../utils/constants");
const { pickRandom } = require("../utils/helpers");

const TEMPLATES = {
  playful: {
    adopt: [
      "{name} bounces into your arms and immediately starts an imaginary snowball fight.",
      "{name} spins in a happy little circle and claims you as their best winter buddy."
    ],
    feed: [
      "{name} munches happily and tosses a crumb at you like a game.",
      "{name} wiggles with delight and asks if snacks can be part of every adventure."
    ],
    hug: [
      "{name} squeaks and squeezes back with extra pep.",
      "{name} melts into your arms, then pretends this hug is a victory dance."
    ],
    sleep: [
      "{name} yawns dramatically, then curls up like a sleepy snowball.",
      "{name} nestles down and promises to dream about sled races."
    ],
    neglected: [
      "{name} paws at your sleeve, clearly craving a little attention.",
      "{name} looks restless and keeps glancing over hopefully."
    ],
    status: [
      "{name} is humming to themself and keeping an eye on you.",
      "{name} looks ready for cuddles, snacks, or harmless chaos."
    ]
  },
  clingy: {
    adopt: [
      "{name} snuggles close instantly, as if they were always meant to be here.",
      "{name} wraps around your heart in about three seconds flat."
    ],
    feed: [
      "{name} takes the treat gently and stays tucked right beside you.",
      "{name} looks relieved that you remembered their favorite cozy moment."
    ],
    hug: [
      "{name} clings softly and clearly has no plans to let go first.",
      "{name} gives you the kind of hug that asks for one more hug after."
    ],
    sleep: [
      "{name} dozes off only after making sure you're still nearby.",
      "{name} falls asleep warm and content, little paws still curled toward you."
    ],
    neglected: [
      "{name} looks a bit lonely and keeps waiting by the door for you.",
      "{name} is trying to be brave, but their little eyes say they miss you."
    ],
    status: [
      "{name} seems happiest when they know you're checking in.",
      "{name} watches you with the softest, trust-filled gaze."
    ]
  },
  sleepy: {
    adopt: [
      "{name} gives you a tiny nod, then immediately looks ready for a nap.",
      "{name} seems delighted, though in a very drowsy and fluffy way."
    ],
    feed: [
      "{name} perks up for a moment, then savors every bite with sleepy bliss.",
      "{name} looks wonderfully cozy and just a little less ready to snooze."
    ],
    hug: [
      "{name} leans into the hug like a warm pillow with feelings.",
      "{name} makes a tiny content sound and almost falls asleep mid-snuggle."
    ],
    sleep: [
      "{name} is already half asleep before they finish curling up.",
      "{name} settles in instantly, like sleep was their true calling all along."
    ],
    neglected: [
      "{name} looks worn out and chilly, like they need a gentler day.",
      "{name} blinks slowly and seems to miss your calming care."
    ],
    status: [
      "{name} is cozy, dreamy, and only mildly aware of the passage of time.",
      "{name} looks like a nap expert and cuddle connoisseur."
    ]
  },
  dramatic: {
    adopt: [
      "{name} gasps as though destiny itself has arrived in a snowfall of sparkles.",
      "{name} throws their little heart into this moment with theatrical devotion."
    ],
    feed: [
      "{name} accepts the snack as if it were a royal offering from the snow kingdom.",
      "{name} looks deeply moved and perhaps slightly overcommitted to the emotion of snacking."
    ],
    hug: [
      "{name} swoons into your arms like this hug belongs in a winter ballad.",
      "{name} clutches you dramatically, convinced this is the peak of tenderness."
    ],
    sleep: [
      "{name} drifts to sleep like a star finishing its final graceful curtain call.",
      "{name} settles in with the dignity of a plushie who deserves silk snowflakes."
    ],
    neglected: [
      "{name} appears tragically underappreciated and would like the record to reflect that.",
      "{name} is clearly experiencing an emotional weather system of their own."
    ],
    status: [
      "{name} radiates feeling, fluff, and a hint of tasteful melodrama.",
      "{name} is bravely carrying the emotional atmosphere of the room."
    ]
  }
};

class PersonalityService {
  getRandomPersonalityKey() {
    return pickRandom(Object.keys(PERSONALITIES));
  }

  getLabel(personality) {
    return PERSONALITIES[personality]?.label || personality;
  }

  getBonuses(personality) {
    return PERSONALITIES[personality]?.bonuses || {};
  }

  buildResponse(personality, action, plushie) {
    const personalityTemplates = TEMPLATES[personality] || TEMPLATES.playful;
    const templates = personalityTemplates[action] || personalityTemplates.status;
    const template = pickRandom(templates);
    return template.replaceAll("{name}", plushie.name);
  }
}

module.exports = {
  PersonalityService
};
