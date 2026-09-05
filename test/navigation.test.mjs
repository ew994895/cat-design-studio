import test from "node:test";
import assert from "node:assert/strict";

import { canTraverse, nextHopToward, platformForTarget, reachablePlatforms } from "../src/navigation.mjs";

const platforms = [
  { id: "intro", left: 38, right: 398, top: 50, bottom: 336, width: 360 },
  { id: "browser", left: 404, right: 737, top: 134, bottom: 379, width: 333 },
  { id: "editor", left: 30, right: 363, top: 427, bottom: 637, width: 333 },
  { id: "shelf", left: 412, right: 692, top: 519, bottom: 545, width: 280 },
  { id: "floor", left: 0, right: 760, top: 799, bottom: 837, width: 760 }
];

const byId = (id) => platforms.find((platform) => platform.id === id);

test("the floor connects upward through the intermediate tiers", () => {
  assert.equal(nextHopToward(platforms, byId("floor"), byId("intro")).id, "shelf");
  assert.equal(nextHopToward(platforms, byId("shelf"), byId("intro")).id, "editor");
  assert.equal(nextHopToward(platforms, byId("editor"), byId("intro")).id, "browser");
  assert.equal(nextHopToward(platforms, byId("browser"), byId("intro")).id, "intro");
});

test("a high platform can always route back down to the floor", () => {
  assert.equal(nextHopToward(platforms, byId("intro"), byId("floor")).id, "floor");
  assert.equal(canTraverse(byId("intro"), byId("floor")), true);
});

test("a nested lower panel routes through a clear edge instead of trapping the cat in place", () => {
  assert.equal(canTraverse(byId("intro"), byId("editor")), false);
  assert.equal(nextHopToward(platforms, byId("intro"), byId("editor")).id, "browser");
});

test("the shelf becomes jumpable from the floor at the launch area", () => {
  const reachable = reachablePlatforms(platforms, byId("floor"), 470).map(({ id }) => id);
  assert.ok(reachable.includes("shelf"));
});

test("cursor toys map to the webpage surface they are hovering over", () => {
  assert.equal(platformForTarget(platforms, 180, 210).id, "intro");
  assert.equal(platformForTarget(platforms, 560, 485).id, "shelf");
  assert.equal(platformForTarget(platforms, 700, 760).id, "floor");
});

test("ordinary cats climb one tier at a time while a super-bounce cat can skip a tier", () => {
  assert.equal(nextHopToward(platforms, byId("floor"), byId("intro"), 1).id, "shelf");
  assert.equal(nextHopToward(platforms, byId("floor"), byId("intro"), 1.8).id, "editor");
});
