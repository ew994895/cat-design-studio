import test from "node:test";
import assert from "node:assert/strict";
import { CAT_PROFILES, DEFAULT_CAT_ID, getCatProfile } from "../src/cats.mjs";

test("the expanded roster contains every rarity tier", () => {
  assert.equal(CAT_PROFILES.length, 23);
  assert.deepEqual(
    [...new Set(CAT_PROFILES.map((cat) => cat.rarity))].sort(),
    ["common", "epic", "legendary", "rare"]
  );
});

test("each cat has a unique identity and complete instinct profile", () => {
  assert.equal(new Set(CAT_PROFILES.map((cat) => cat.id)).size, CAT_PROFILES.length);
  for (const cat of CAT_PROFILES) {
    assert.equal(typeof cat.tagline, "string");
    assert.equal(typeof cat.personality, "string");
    assert.equal(typeof cat.special, "string");
    assert.ok(["starter", "expansion", "super"].includes(cat.atlasSet));
    assert.ok(cat.visualScale > 0 && cat.visualScale <= 1.2);
    assert.ok(cat.drives.anger >= 0 && cat.drives.anger <= 1);
    assert.ok(cat.instincts.sleep > 0);
    assert.ok(cat.instincts.play > 0);
    assert.ok(cat.instincts.temper >= 0);
    assert.ok(cat.movement.speed > 0);
    assert.ok(cat.movement.jump > 0);
    assert.ok(cat.movement.navigationJump >= 1);
    assert.ok(cat.favoriteToys.length > 0);
  }
  assert.equal(new Set(CAT_PROFILES.map((cat) => cat.personality)).size, CAT_PROFILES.length);
  assert.equal(new Set(CAT_PROFILES.map((cat) => cat.movement.ability)).size, CAT_PROFILES.length);
  assert.equal(CAT_PROFILES.filter((cat) => cat.atlasSet === "starter").length, 8);
  assert.equal(CAT_PROFILES.filter((cat) => cat.atlasSet === "expansion").length, 9);
  assert.equal(CAT_PROFILES.filter((cat) => cat.atlasSet === "super").length, 6);
});

test("the super cats each introduce a different implemented mechanic", () => {
  const abilities = Object.fromEntries(
    CAT_PROFILES.filter((cat) => cat.atlasSet === "super").map((cat) => [cat.id, cat.movement.ability])
  );
  assert.deepEqual(abilities, {
    tempo: "rhythm-burst",
    blink: "time-bubble",
    mirror: "mirror-clone",
    atlas: "ground-pound",
    orbit: "zero-gravity",
    halo: "sunbeam"
  });
});

test("the expansion cats have distinct implemented ability identities", () => {
  const abilities = Object.fromEntries(
    CAT_PROFILES.filter((cat) => cat.atlasSet === "expansion").map((cat) => [cat.id, cat.movement.ability])
  );
  assert.deepEqual(abilities, {
    mochi: "shy-dash",
    biscuit: "toy-hoarder",
    dot: "tiny-scout",
    nimbus: "feather-fall",
    echo: "double-jump",
    magnet: "magnet-paws",
    vanta: "shadow-phase",
    prism: "mood-spectrum",
    nova: "star-dash"
  });
});

test("only the designated mega-jump cat gets super-bounce navigation", () => {
  const superBounceCats = CAT_PROFILES.filter((cat) => cat.movement.navigationJump > 1);
  assert.deepEqual(superBounceCats.map((cat) => cat.id), ["root"]);
  assert.equal(superBounceCats[0].rarity, "legendary");
  assert.equal(superBounceCats[0].movement.ability, "mega-jump");
});

test("unknown cats safely fall back to the default cat", () => {
  assert.equal(getCatProfile("not-a-cat").id, DEFAULT_CAT_ID);
});
