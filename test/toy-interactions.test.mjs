import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceBubble,
  advanceBox,
  advanceFishingRig,
  advanceMouse,
  createBubble,
  createBox,
  createFishingRig,
  createMouse,
  FISHING_LINE_LENGTH,
  FISHING_REELED_LENGTH,
  isBoxOnSurface,
  isMouseOnSurface,
  pounceMouse,
  segmentGeometry,
  setFishingHandle,
  setFishingReel,
  settleMouse,
  strikeFishingLure,
  settleBox
} from "../src/toy-interactions.mjs";

test("a released box falls and settles flush on a platform", () => {
  const box = createBox({ x: 120, y: 40 });
  advanceBox(box, 0.04, 800);
  assert.ok(box.vy > 0);
  assert.ok(box.y > 40);

  settleBox(box, 300, "floor");
  assert.equal(box.grounded, true);
  assert.equal(box.platformId, "floor");
  assert.equal(box.y + box.height, 300);
  assert.equal(isBoxOnSurface(box, { left: 0, right: 800, top: 300 }), true);
});

test("the fishing rod handle tracks immediately while the lure trails within its tether", () => {
  const rig = createFishingRig({ x: 100, y: 180 });
  setFishingHandle(rig, 520, 240);
  advanceFishingRig(rig, 1 / 60, 900, 700);

  assert.equal(rig.handleX, 520);
  assert.equal(rig.handleY, 240);
  assert.equal(rig.direction, -1);
  assert.ok(rig.tipX < rig.handleX);
  assert.notEqual(rig.lureX, rig.handleX);
  const line = segmentGeometry(rig.tipX, rig.tipY, rig.lureX, rig.lureY);
  assert.ok(line.length <= FISHING_LINE_LENGTH * 1.24 + 0.001);
});

test("the fishing rod always points inward when it crosses the screen center", () => {
  const rig = createFishingRig({ x: 700, y: 240, direction: -1 });
  advanceFishingRig(rig, 1 / 60, 900, 700);
  assert.equal(rig.direction, -1);
  assert.ok(rig.tipX < rig.handleX);

  setFishingHandle(rig, 200, 240);
  advanceFishingRig(rig, 1 / 60, 900, 700);
  assert.equal(rig.direction, 1);
  assert.ok(rig.tipX > rig.handleX);
});

test("the fishing rod keeps its direction inside the center dead zone", () => {
  const rig = createFishingRig({ x: 200, y: 240, direction: 1 });
  setFishingHandle(rig, 442, 240);
  advanceFishingRig(rig, 1 / 60, 900, 700);
  assert.equal(rig.direction, 1);

  setFishingHandle(rig, 458, 240);
  advanceFishingRig(rig, 1 / 60, 900, 700);
  assert.equal(rig.direction, 1);

  setFishingHandle(rig, 480, 240);
  advanceFishingRig(rig, 1 / 60, 900, 700);
  assert.equal(rig.direction, -1);
});

test("holding reels the lure in and releasing creates a cast", () => {
  const rig = createFishingRig({ x: 240, y: 220 });
  setFishingReel(rig, true);
  for (let index = 0; index < 40; index += 1) advanceFishingRig(rig, 1 / 60, 900, 700);
  assert.ok(rig.lineLength < FISHING_LINE_LENGTH);
  assert.ok(rig.lineLength > FISHING_REELED_LENGTH - 1);

  const previousVx = rig.lureVx;
  setFishingReel(rig, false);
  assert.ok(rig.lureVx > previousVx);
  assert.ok(rig.lureVy < 0);
});

test("a cat can strike the fishing lure only once per cooldown", () => {
  const rig = createFishingRig({ x: 240, y: 220 });
  assert.equal(strikeFishingLure(rig, -1, 1.2, 1000), true);
  assert.ok(rig.lureVx < 0);
  assert.ok(rig.lureVy < 0);
  assert.equal(rig.hitCount, 1);
  assert.equal(strikeFishingLure(rig, 1, 1.2, 1300), false);
  assert.equal(rig.hitCount, 1);
});

test("fishing line geometry reports a stable length and angle", () => {
  const segment = segmentGeometry(10, 20, 40, 60);
  assert.equal(segment.x, 10);
  assert.equal(segment.y, 20);
  assert.equal(segment.length, 50);
  assert.ok(Math.abs(segment.angle - 53.1301) < 0.001);
});

test("the wind-up mouse scurries, reverses at ledge edges, and can be pounced", () => {
  const platform = { left: 100, right: 360, top: 300 };
  const mouse = createMouse({ x: 315, y: 276, platformId: "shelf", now: 0, direction: 1 });
  advanceMouse(mouse, 1 / 30, 800, 100, platform);
  assert.equal(mouse.direction, -1);

  settleMouse(mouse, platform.top, "shelf");
  assert.equal(isMouseOnSurface(mouse, platform), true);
  assert.equal(pounceMouse(mouse, 1, 1.1, 1000), true);
  assert.equal(mouse.grounded, false);
  assert.ok(mouse.vx > 0);
  assert.ok(mouse.vy < 0);
  assert.equal(mouse.pounceCount, 1);
});

test("bubbles drift upward and expire without accumulating forever", () => {
  const bubble = createBubble({ x: 220, y: 400, now: 0, seed: 3 });
  const startY = bubble.y;
  assert.equal(advanceBubble(bubble, 0.04, 800, 700, 40), true);
  assert.ok(bubble.y < startY);
  assert.equal(advanceBubble(bubble, 0.04, 800, 700, 7300), false);
});
