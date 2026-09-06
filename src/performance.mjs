export const TARGET_FRAME_MS = 1000 / 60;

const blend = (current, sample, weight) => current + (sample - current) * weight;

export class PerformanceGovernor {
  constructor({ enterPressure = 28, recoveryFrames = 300 } = {}) {
    this.mode = "full";
    this.frameMs = TARGET_FRAME_MS;
    this.workMs = 0;
    this.pressure = 0;
    this.recovery = 0;
    this.enterPressure = enterPressure;
    this.recoveryFrames = recoveryFrames;
  }

  sample(frameMs, workMs) {
    if (!(frameMs > 0) || frameMs > 120 || !(workMs >= 0)) return null;
    this.frameMs = blend(this.frameMs, frameMs, 0.06);
    this.workMs = blend(this.workMs, workMs, 0.08);
    const underPressure = this.frameMs > 21.5 || this.workMs > 7.5;

    if (underPressure) {
      this.pressure = Math.min(this.enterPressure, this.pressure + 1);
      this.recovery = 0;
    } else {
      this.pressure = Math.max(0, this.pressure - 0.5);
      if (this.mode === "lite" && this.frameMs < 18.5 && this.workMs < 5) this.recovery += 1;
    }

    if (this.mode === "full" && this.pressure >= this.enterPressure) {
      this.mode = "lite";
      this.pressure = 0;
      return this.mode;
    }
    if (this.mode === "lite" && this.recovery >= this.recoveryFrames) {
      this.mode = "full";
      this.recovery = 0;
      return this.mode;
    }
    return null;
  }

  snapshot() {
    return {
      mode: this.mode,
      frameMs: this.frameMs,
      workMs: this.workMs,
      fps: Math.min(60, Math.round(1000 / Math.max(TARGET_FRAME_MS, this.frameMs)))
    };
  }
}
