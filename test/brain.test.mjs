import test from "node:test";
import assert from "node:assert/strict";
import { ACTIONS, CatBrain } from "../src/brain.mjs";

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
