import test from "node:test";
import assert from "node:assert/strict";
import { ACTIONS, CatBrain } from "../src/brain.mjs";
import { CAT_PROFILES, getCatProfile } from "../src/cats.mjs";

test("an exhausted cat chooses sleep in a quiet safe place", () => {
  const brain = new CatBrain({ random: () => 0 });
  brain.drives.energy = 0.03;
  brain.drives.curiosity = 0.1;
  brain.drives.playfulness = 0.1;
  const action = brain.decide({ quiet: true, onHighPlatform: true, canJump: true }, 10_000);
  assert.equal(action, ACTIONS.SLEEP);
});

test("a playful cat strongly prefers an available toy", () => {
  const brain = new CatBrain({ random: () => 0 });
  brain.drives.energy = 0.9;
  brain.drives.curiosity = 0.35;
  brain.drives.playfulness = 1;
  const action = brain.decide({ toyAvailable: true, canJump: false }, 10_000);
  assert.equal(action, ACTIONS.PLAY);
});

test("petting creates a purr response and strengthens the bond", () => {
  const brain = new CatBrain({ random: () => 0 });
  const before = brain.drives.affection;
  brain.pet(1.4, 2_000);
  assert.equal(brain.currentAction, ACTIONS.PURR);
  assert.ok(brain.drives.affection > before);
  assert.equal(brain.memory.petCount, 1);
});

test("an easily irritated cat hisses and then claws when over-petted", () => {
  const brain = new CatBrain({
    random: () => 0,
    profile: {
      id: "testy",
      drives: { anger: 0.6 },
      instincts: { temper: 1.6, petIrritation: 0.14, hissThreshold: 0.65, clawThreshold: 0.82 }
    }
  });
  brain.pet(1, 2_000);
  assert.equal(brain.currentAction, ACTIONS.HISS);
  brain.pet(1.2, 2_200);
  assert.equal(brain.currentAction, ACTIONS.CLAW);
  assert.ok(brain.drives.anger >= 0.82);
});

test("drive values stay bounded during long updates", () => {
  const brain = new CatBrain({ random: () => 0.5 });
  for (let i = 0; i < 20_000; i += 1) brain.tick(0.1, { pointerMoved: i % 2 === 0 });
  for (const value of Object.values(brain.drives)) {
    assert.ok(value >= 0 && value <= 1);
  }
});

test("the brain remembers frequently visited platforms", () => {
  const brain = new CatBrain({ random: () => 0 });
  brain.rememberLanding("shelf");
  brain.rememberLanding("shelf");
  assert.equal(brain.memory.favoritePlatformId, "shelf");
  assert.equal(brain.memory.jumpsLanded, 2);
});

test("the expansion personalities make different choices in the same room", () => {
  const context = {
    quiet: true,
    pointerVisible: false,
    pointerNear: false,
    pointerMoved: false,
    toyAvailable: false,
    onHighPlatform: false,
    reachablePlatforms: 3,
    canJump: true
  };
  const expansionCats = CAT_PROFILES.filter((cat) => cat.atlasSet === "expansion");
  const scoreSignatures = expansionCats.map((cat) => {
    const scores = new CatBrain({ profile: cat, random: () => 0 }).scoreActions(context);
    return Object.values(scores).map((score) => score.toFixed(4)).join("|");
  });
  assert.equal(new Set(scoreSignatures).size, expansionCats.length);
  assert.equal(new CatBrain({ profile: getCatProfile("mochi"), random: () => 0 }).decide(context, 10_000), ACTIONS.SLEEP);
  assert.equal(new CatBrain({ profile: getCatProfile("dot"), random: () => 0 }).decide(context, 10_000), ACTIONS.ROAM);
  assert.equal(new CatBrain({ profile: getCatProfile("echo"), random: () => 0 }).decide(context, 10_000), ACTIONS.JUMP);
});
