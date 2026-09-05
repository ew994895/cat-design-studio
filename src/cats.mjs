const profile = (definition) => Object.freeze({
  ...definition,
  atlas: Object.freeze(definition.atlas),
  drives: Object.freeze(definition.drives),
  instincts: Object.freeze(definition.instincts),
  movement: Object.freeze({ navigationJump: 1, ...definition.movement }),
  favoriteToys: Object.freeze(definition.favoriteToys)
});

export const CAT_PROFILES = Object.freeze([
  profile({
    id: "byte",
    name: "Byte",
    rarity: "common",
    tagline: "balanced little debugger",
    atlas: [0, 0],
    drives: { energy: 0.74, curiosity: 0.63, affection: 0.58, playfulness: 0.56, confidence: 0.72, anger: 0.08 },
    instincts: { sleep: 1, play: 1, roam: 1, jump: 1, mischief: 1, affection: 1, temper: 0.55, petIrritation: -0.025, calmRate: 1 },
    movement: { speed: 1, jump: 1, toyForce: 1, ability: "steady" },
    favoriteToys: ["ball", "box"]
  }),
  profile({
    id: "patches",
    name: "Patches",
    rarity: "common",
    tagline: "professional nap tester",
    atlas: [1, 0],
    drives: { energy: 0.36, curiosity: 0.34, affection: 0.76, playfulness: 0.24, confidence: 0.68, anger: 0.03 },
    instincts: { sleep: 1.78, play: 0.5, roam: 0.62, jump: 0.58, mischief: 0.42, affection: 1.35, temper: 0.22, petIrritation: -0.045, calmRate: 1.45 },
    movement: { speed: 0.56, jump: 0.68, toyForce: 0.72, ability: "deep-sleep" },
    favoriteToys: ["box"]
  }),
  profile({
    id: "marmalade",
    name: "Marmalade",
    rarity: "common",
    tagline: "toy-powered chaos",
    atlas: [2, 0],
    drives: { energy: 0.9, curiosity: 0.74, affection: 0.62, playfulness: 0.94, confidence: 0.76, anger: 0.06 },
    instincts: { sleep: 0.56, play: 1.62, roam: 1.12, jump: 1.28, mischief: 1.18, affection: 1, temper: 0.36, petIrritation: -0.01, calmRate: 1.1 },
    movement: { speed: 1.72, jump: 1.18, toyForce: 1.28, ability: "turbo-sprint" },
    favoriteToys: ["ball", "laser", "feather"]
  }),
  profile({
    id: "sudo",
    name: "Sudo",
    rarity: "rare",
    tagline: "must inspect everything",
    atlas: [0, 1],
    drives: { energy: 0.78, curiosity: 0.96, affection: 0.48, playfulness: 0.68, confidence: 0.73, anger: 0.12 },
    instincts: { sleep: 0.72, play: 1.06, roam: 1.58, jump: 1.48, mischief: 1.12, affection: 0.82, temper: 0.58, petIrritation: 0.025, calmRate: 0.92 },
    movement: { speed: 1.18, jump: 1.38, toyForce: 0.94, ability: "high-jump" },
    favoriteToys: ["laser", "feather"]
  }),
  profile({
    id: "ember",
    name: "Ember",
    rarity: "rare",
    tagline: "short fuse, sharp paws",
    atlas: [1, 1],
    drives: { energy: 0.7, curiosity: 0.54, affection: 0.25, playfulness: 0.42, confidence: 0.91, anger: 0.48 },
    instincts: { sleep: 0.82, play: 0.72, roam: 1.04, jump: 0.96, mischief: 1.32, affection: 0.48, temper: 1.58, petIrritation: 0.16, calmRate: 0.52, hissThreshold: 0.46, clawThreshold: 0.7 },
    movement: { speed: 1.08, jump: 0.94, toyForce: 1.46, ability: "power-swipe" },
    favoriteToys: ["ball"]
  }),
  profile({
    id: "glitch",
    name: "Glitch",
    rarity: "epic",
    tagline: "mischief in the machine",
    atlas: [0, 2],
    drives: { energy: 0.93, curiosity: 0.88, affection: 0.38, playfulness: 0.84, confidence: 0.87, anger: 0.24 },
    instincts: { sleep: 0.54, play: 1.3, roam: 1.3, jump: 1.46, mischief: 1.9, affection: 0.62, temper: 1.08, petIrritation: 0.07, calmRate: 0.78, hissThreshold: 0.62, clawThreshold: 0.82 },
    movement: { speed: 1.32, jump: 1.2, toyForce: 1.06, ability: "teleport" },
    favoriteToys: ["laser", "feather"]
  }),
  profile({
    id: "oracle",
    name: "Oracle",
    rarity: "epic",
    tagline: "dreams between commands",
    atlas: [1, 2],
    drives: { energy: 0.42, curiosity: 0.7, affection: 0.84, playfulness: 0.36, confidence: 0.88, anger: 0.02 },
    instincts: { sleep: 1.66, play: 0.62, roam: 0.84, jump: 0.72, mischief: 0.38, affection: 1.46, temper: 0.18, petIrritation: -0.055, calmRate: 1.72 },
    movement: { speed: 0.74, jump: 0.78, toyForce: 0.68, ability: "calming-aura" },
    favoriteToys: ["box", "feather"]
  }),
  profile({
    id: "root",
    name: "Root",
    rarity: "legendary",
    tagline: "calm until challenged",
    atlas: [2, 2],
    drives: { energy: 0.82, curiosity: 0.78, affection: 0.58, playfulness: 0.64, confidence: 0.99, anger: 0.18 },
    instincts: { sleep: 0.82, play: 1.02, roam: 1.22, jump: 1.2, mischief: 1.28, affection: 0.9, temper: 0.92, petIrritation: 0.035, calmRate: 1.08, hissThreshold: 0.7, clawThreshold: 0.9 },
    movement: { speed: 1.12, jump: 1.58, navigationJump: 1.8, toyForce: 1.52, ability: "mega-jump" },
    favoriteToys: ["ball", "feather"]
  })
]);

export const DEFAULT_CAT_ID = "byte";

export function getCatProfile(id) {
  return CAT_PROFILES.find((cat) => cat.id === id) || CAT_PROFILES[0];
}
