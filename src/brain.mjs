const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const ACTIONS = Object.freeze({
  IDLE: "idle",
  ROAM: "roam",
  INSPECT: "inspect",
  PLAY: "play",
  JUMP: "jump",
  LOAF: "loaf",
  SLEEP: "sleep",
  GROOM: "groom",
  SEEK_AFFECTION: "seek-affection",
  MISCHIEF: "mischief",
  PURR: "purr",
  HISS: "hiss",
  CLAW: "claw"
});

const DURATIONS = Object.freeze({
  [ACTIONS.IDLE]: [1800, 4200],
  [ACTIONS.ROAM]: [2800, 6500],
  [ACTIONS.INSPECT]: [1800, 4200],
  [ACTIONS.PLAY]: [3200, 6800],
  [ACTIONS.JUMP]: [1300, 2600],
  [ACTIONS.LOAF]: [5000, 11000],
  [ACTIONS.SLEEP]: [9000, 18000],
  [ACTIONS.GROOM]: [3600, 7200],
  [ACTIONS.SEEK_AFFECTION]: [2600, 5200],
  [ACTIONS.MISCHIEF]: [2400, 5600],
  [ACTIONS.PURR]: [1600, 3200],
  [ACTIONS.HISS]: [1100, 2100],
  [ACTIONS.CLAW]: [700, 1400]
});

const DEFAULT_DRIVES = Object.freeze({
  energy: 0.76,
  curiosity: 0.62,
  affection: 0.58,
  playfulness: 0.56,
  confidence: 0.72,
  anger: 0.08
});

const DEFAULT_INSTINCTS = Object.freeze({
  sleep: 1,
  play: 1,
  roam: 1,
  jump: 1,
  mischief: 1,
  affection: 1,
  temper: 0.55,
  petIrritation: -0.025,
  calmRate: 1,
  hissThreshold: 0.66,
  clawThreshold: 0.86
});

export class CatBrain {
  constructor({ random = Math.random, profile = null } = {}) {
    this.random = random;
    this.profileId = profile?.id || "byte";
    this.favoriteToys = [...(profile?.favoriteToys || [])];
    this.drives = { ...DEFAULT_DRIVES, ...profile?.drives };
    this.instincts = { ...DEFAULT_INSTINCTS, ...profile?.instincts };
    this.currentAction = ACTIONS.IDLE;
    this.actionUntil = 0;
    this.memory = {
      petCount: 0,
      jumpsLanded: 0,
      favoritePlatformId: "floor",
      platformVisits: { floor: 1 },
      lastPetAt: 0,
      lastToyAt: 0
    };
  }

  tick(dt, context = {}) {
    const seconds = clamp(dt, 0, 0.25);
    const sleeping = this.currentAction === ACTIONS.SLEEP;
    const loafing = this.currentAction === ACTIONS.LOAF;

    if (sleeping) {
      this.drives.energy += 0.034 * seconds;
      this.drives.curiosity += 0.004 * seconds;
      this.drives.playfulness += 0.006 * seconds;
      this.drives.anger -= 0.026 * this.instincts.calmRate * seconds;
    } else {
      this.drives.energy -= (loafing ? 0.001 : 0.0038) * seconds;
      this.drives.curiosity += (context.pointerMoved ? 0.012 : 0.006) * seconds;
      this.drives.playfulness += (context.toyAvailable ? 0.012 : 0.004) * seconds;
      this.drives.affection -= 0.0014 * seconds;
      this.drives.anger -= 0.009 * this.instincts.calmRate * seconds;
    }

    if (context.pointerNear) this.drives.confidence += 0.003 * seconds;
    if (context.loudMotion) {
      this.drives.confidence -= 0.008 * seconds;
      this.drives.anger += 0.052 * this.instincts.temper * seconds;
    }
    if (this.currentAction === ACTIONS.HISS || this.currentAction === ACTIONS.CLAW) {
      this.drives.anger -= 0.018 * seconds;
    }

    for (const key of Object.keys(this.drives)) {
      this.drives[key] = clamp(this.drives[key]);
    }
  }

  pet(strength = 1, now = Date.now()) {
    const amount = clamp(strength, 0.1, 2);
    const repeatPet = now - this.memory.lastPetAt < 650;
    this.drives.affection = clamp(this.drives.affection + 0.055 * amount * this.instincts.affection);
    this.drives.confidence = clamp(this.drives.confidence + 0.018 * amount);
    this.drives.playfulness = clamp(this.drives.playfulness + 0.012 * amount);
    this.drives.anger = clamp(
      this.drives.anger + this.instincts.petIrritation * amount + (repeatPet ? 0.055 * this.instincts.temper : 0)
    );
    this.memory.petCount += 1;
    this.memory.lastPetAt = now;
    if (this.drives.anger >= this.instincts.clawThreshold && repeatPet) {
      this.setAction(ACTIONS.CLAW, now, 900 + amount * 180);
    } else if (this.drives.anger >= this.instincts.hissThreshold) {
      this.setAction(ACTIONS.HISS, now, 1250 + amount * 220);
    } else {
      this.setAction(ACTIONS.PURR, now, 1500 + amount * 450);
    }
    return this.currentAction;
  }

  noticeToy(now = Date.now()) {
    this.drives.playfulness = clamp(this.drives.playfulness + 0.16);
    this.drives.curiosity = clamp(this.drives.curiosity + 0.12);
    this.memory.lastToyAt = now;
    this.actionUntil = 0;
  }

  rememberLanding(platformId) {
    if (!platformId) return;
    this.memory.jumpsLanded += 1;
    this.memory.platformVisits[platformId] = (this.memory.platformVisits[platformId] || 0) + 1;
    const currentFavorite = this.memory.platformVisits[this.memory.favoritePlatformId] || 0;
    if (this.memory.platformVisits[platformId] > currentFavorite) {
      this.memory.favoritePlatformId = platformId;
    }
  }

  scoreActions(context = {}) {
    const d = this.drives;
    const quiet = context.quiet ? 1 : 0;
    const pointerNear = context.pointerNear ? 1 : 0;
    const toy = context.toyAvailable ? 1 : 0;
    const favoriteToy = context.toyType && this.favoriteToys.includes(context.toyType) ? 1 : 0;
    const highPlatform = context.onHighPlatform ? 1 : 0;
    const reachable = Math.min(1, (context.reachablePlatforms || 0) / 3);

    const scores = {
      [ACTIONS.IDLE]: 0.36 + d.confidence * 0.26 + (1 - d.curiosity) * 0.18,
      [ACTIONS.ROAM]: d.curiosity * 1.08 + d.energy * 0.34,
      [ACTIONS.INSPECT]: d.curiosity * 0.78 + pointerNear * 0.42,
      [ACTIONS.PLAY]: d.playfulness * 1.18 + toy * 0.78 + favoriteToy * 0.44 + d.energy * 0.22,
      [ACTIONS.JUMP]: d.curiosity * 0.62 + d.playfulness * 0.36 + reachable * 0.48,
      [ACTIONS.LOAF]: (1 - d.energy) * 0.82 + d.confidence * 0.5 + quiet * 0.18,
      [ACTIONS.SLEEP]: (1 - d.energy) * 1.82 + quiet * 0.48 + highPlatform * 0.14,
      [ACTIONS.GROOM]: d.confidence * 0.54 + (1 - d.curiosity) * 0.26 + quiet * 0.1,
      [ACTIONS.SEEK_AFFECTION]: (1 - d.affection) * 1.08 + pointerNear * 0.38,
      [ACTIONS.MISCHIEF]: d.playfulness * 0.72 + d.curiosity * 0.52 + d.confidence * 0.16,
      [ACTIONS.HISS]: d.anger * 1.48 + pointerNear * 0.24 + this.instincts.temper * 0.08,
      [ACTIONS.CLAW]: d.anger * 1.68 + pointerNear * 0.46 + this.instincts.temper * 0.12
    };

    scores[ACTIONS.SLEEP] *= this.instincts.sleep;
    scores[ACTIONS.PLAY] *= this.instincts.play;
    scores[ACTIONS.ROAM] *= this.instincts.roam;
    scores[ACTIONS.JUMP] *= this.instincts.jump;
    scores[ACTIONS.MISCHIEF] *= this.instincts.mischief;
    scores[ACTIONS.SEEK_AFFECTION] *= this.instincts.affection;

    if (!context.pointerVisible) {
      scores[ACTIONS.INSPECT] *= 0.4;
      scores[ACTIONS.SEEK_AFFECTION] *= 0.55;
    }
    if (!context.toyAvailable) scores[ACTIONS.PLAY] *= 0.62;
    if (!context.canJump) scores[ACTIONS.JUMP] = -1;
    if (d.anger < this.instincts.hissThreshold) scores[ACTIONS.HISS] = -1;
    if (!context.pointerNear || d.anger < this.instincts.clawThreshold) scores[ACTIONS.CLAW] = -1;
    if (d.energy < 0.2) scores[ACTIONS.SLEEP] += 1.2;
    if (d.energy < 0.12) scores[ACTIONS.ROAM] *= 0.25;

    for (const action of Object.keys(scores)) {
      scores[action] += this.random() * 0.16;
    }
    return scores;
  }

  decide(context = {}, now = Date.now()) {
    if (now < this.actionUntil && this.currentAction !== ACTIONS.IDLE) {
      return this.currentAction;
    }

    const scores = this.scoreActions(context);
    const [action] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    this.setAction(action, now);

    if (action === ACTIONS.PLAY) {
      this.drives.playfulness = clamp(this.drives.playfulness - 0.2);
    } else if (action === ACTIONS.ROAM || action === ACTIONS.JUMP) {
      this.drives.curiosity = clamp(this.drives.curiosity - 0.12);
    } else if (action === ACTIONS.SEEK_AFFECTION) {
      this.drives.affection = clamp(this.drives.affection + 0.025);
    } else if (action === ACTIONS.HISS) {
      this.drives.anger = clamp(this.drives.anger - 0.08);
    } else if (action === ACTIONS.CLAW) {
      this.drives.anger = clamp(this.drives.anger - 0.14);
    }
    return action;
  }

  setAction(action, now = Date.now(), durationOverride = null) {
    this.currentAction = action;
    const [min, max] = DURATIONS[action] || DURATIONS[ACTIONS.IDLE];
    const duration = durationOverride ?? min + this.random() * (max - min);
    this.actionUntil = now + duration;
  }

  snapshot() {
    return {
      action: this.currentAction,
      actionUntil: this.actionUntil,
      drives: { ...this.drives },
      memory: {
        ...this.memory,
        platformVisits: { ...this.memory.platformVisits }
      }
    };
  }
}
