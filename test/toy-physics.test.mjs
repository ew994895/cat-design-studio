import test from "node:test";
import assert from "node:assert/strict";

import { advanceToy, bounceToy, createToy, kickToy, TOY_RADIUS } from "../src/toy-physics.mjs";

test("a dropped toy accelerates downward and moves through the air", () => {
  const toy = createToy({ x: 100, y: 40, now: 0 });
  advanceToy(toy, 0.04, 800);
  assert.ok(toy.vy > 0);
  assert.ok(toy.y > 40);
});

test("a hard landing bounces with less energy", () => {
  const toy = createToy({ x: 100, y: 100, vy: 400, now: 0 });
  const impact = bounceToy(toy, 200, "floor");
  assert.equal(impact, 400);
  assert.ok(toy.vy < 0);
  assert.ok(Math.abs(toy.vy) < impact);
  assert.equal(toy.y, 200 - TOY_RADIUS - 0.5);
});

test("small bounces settle into rolling", () => {
  const toy = createToy({ x: 100, y: 100, vx: 80, vy: 50, now: 0 });
  bounceToy(toy, 200, "floor");
  assert.equal(toy.grounded, true);
  assert.equal(toy.vy, 0);
  const speedBefore = Math.abs(toy.vx);
  advanceToy(toy, 0.04, 800);
  assert.ok(Math.abs(toy.vx) < speedBefore);
});

test("a paw strike launches the toy forward and upward", () => {
  const toy = createToy({ x: 100, y: 100, now: 0 });
  kickToy(toy, -1, 1, 900);
  assert.ok(toy.vx < 0);
  assert.ok(toy.vy < 0);
  assert.equal(toy.hitCount, 1);
  assert.equal(toy.lastKickedAt, 900);
});
