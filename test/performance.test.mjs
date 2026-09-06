import test from "node:test";
import assert from "node:assert/strict";
import { PerformanceGovernor, TARGET_FRAME_MS } from "../src/performance.mjs";

test("the performance governor stays at full quality during healthy frames", () => {
  const governor = new PerformanceGovernor({ enterPressure: 5 });
  for (let index = 0; index < 120; index += 1) governor.sample(TARGET_FRAME_MS, 1.2);
  assert.equal(governor.mode, "full");
  assert.equal(governor.snapshot().fps, 60);
});

test("sustained frame pressure enables lite effects automatically", () => {
  const governor = new PerformanceGovernor({ enterPressure: 5 });
  let change = null;
  for (let index = 0; index < 80 && !change; index += 1) change = governor.sample(34, 11);
  assert.equal(change, "lite");
  assert.equal(governor.mode, "lite");
});

test("lite effects recover only after a long stable period", () => {
  const governor = new PerformanceGovernor({ enterPressure: 2, recoveryFrames: 4 });
  for (let index = 0; index < 80 && governor.mode === "full"; index += 1) governor.sample(38, 12);
  assert.equal(governor.mode, "lite");
  let change = null;
  for (let index = 0; index < 220 && !change; index += 1) change = governor.sample(TARGET_FRAME_MS, 1);
  assert.equal(change, "full");
});
