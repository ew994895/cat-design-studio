import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceBox,
  advanceFishingRig,
  createBox,
  createFishingRig,
  FISHING_LINE_LENGTH,
  isBoxOnSurface,
  segmentGeometry,
  setFishingHandle,
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

test("fishing line geometry reports a stable length and angle", () => {
  const segment = segmentGeometry(10, 20, 40, 60);
  assert.equal(segment.x, 10);
  assert.equal(segment.y, 20);
  assert.equal(segment.length, 50);
  assert.ok(Math.abs(segment.angle - 53.1301) < 0.001);
});
