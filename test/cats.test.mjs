import test from "node:test";
import assert from "node:assert/strict";
import { CAT_PROFILES, DEFAULT_CAT_ID, getCatProfile } from "../src/cats.mjs";

test("the starter roster contains every rarity tier", () => {
  assert.equal(CAT_PROFILES.length, 8);
  assert.deepEqual(
    [...new Set(CAT_PROFILES.map((cat) => cat.rarity))].sort(),
    ["common", "epic", "legendary", "rare"]
  );
});

test("each cat has a unique identity and complete instinct profile", () => {
  assert.equal(new Set(CAT_PROFILES.map((cat) => cat.id)).size, CAT_PROFILES.length);
  for (const cat of CAT_PROFILES) {
    assert.equal(typeof cat.tagline, "string");
    assert.ok(cat.drives.anger >= 0 && cat.drives.anger <= 1);
    assert.ok(cat.instincts.sleep > 0);
    assert.ok(cat.instincts.play > 0);
    assert.ok(cat.instincts.temper >= 0);
    assert.ok(cat.movement.speed > 0);
    assert.ok(cat.movement.jump > 0);
    assert.ok(cat.favoriteToys.length > 0);
  }
});

test("unknown cats safely fall back to the default cat", () => {
  assert.equal(getCatProfile("not-a-cat").id, DEFAULT_CAT_ID);
});
