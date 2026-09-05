import { ACTIONS, CatBrain } from "./brain.mjs";
import { CAT_PROFILES, DEFAULT_CAT_ID, getCatProfile } from "./cats.mjs";
import { canTraverse, launchPoint, nextHopToward, reachablePlatforms } from "./navigation.mjs";
import { advanceToy, bounceToy, createToy, isToyOnSurface, kickToy, TOY_RADIUS } from "./toy-physics.mjs";

const habitat = document.querySelector("#habitat");
const catElement = document.querySelector("#cat");
const catSprite = document.querySelector("#cat-sprite");
const catPortrait = document.querySelector("#cat-portrait");
const clawMark = document.querySelector(".claw-mark");
const toyElement = document.querySelector("#toy");
const laserToyElement = document.querySelector("#laser-toy");
const boxToyElement = document.querySelector("#box-toy");
const featherToyElement = document.querySelector("#feather-toy");
const particleLayer = document.querySelector("#particles");
const statusCopy = document.querySelector("#status-copy");
const debugPanel = document.querySelector("#debug-panel");
const debugAction = document.querySelector("#debug-action");
const debugName = document.querySelector("#debug-name");
const debugRarity = document.querySelector("#debug-rarity");
const debugAbility = document.querySelector("#debug-ability");
const debugPlatform = document.querySelector("#debug-platform");
const debugPets = document.querySelector("#debug-pets");
const debugJumps = document.querySelector("#debug-jumps");
const driveList = document.querySelector("#drive-list");
const debugButton = document.querySelector("#debug-button");
const toyButton = document.querySelector("#toy-button");
const toyMenuButton = document.querySelector("#toy-menu-button");
const pauseButton = document.querySelector("#pause-button");
const petButton = document.querySelector("#pet-button");
const rosterPanel = document.querySelector("#cat-roster");
const rosterButton = document.querySelector("#roster-button");
const rosterClose = document.querySelector("#roster-close");
const catGrid = document.querySelector("#cat-grid");
const toyTray = document.querySelector("#toy-tray");

const CAT_SIZE = 84;
const CAT_FOOT_OFFSET = 3;
const GRAVITY = 980;
const fileIdleFrames = Array.from({ length: 8 }, (_, index) =>
  `./assets/animations/idle-v1/frame-${String(index + 1).padStart(2, "0")}.png`
);
const idleFrames = typeof EMBEDDED_IDLE_FRAMES === "undefined"
  ? fileIdleFrames
  : EMBEDDED_IDLE_FRAMES;
const catAtlasUrl = typeof EMBEDDED_CAT_ATLAS === "undefined"
  ? "./assets/cats/starter-roster-v1.png"
  : EMBEDDED_CAT_ATLAS;
idleFrames.forEach((src) => { const image = new Image(); image.src = src; });
catSprite.src = idleFrames[0];
habitat.style.setProperty("--cat-atlas", `url("${catAtlasUrl}")`);

const actionCopy = {
  [ACTIONS.IDLE]: "listening to the room",
  [ACTIONS.ROAM]: "going somewhere important",
  [ACTIONS.INSPECT]: "watching your cursor",
  [ACTIONS.PLAY]: "hunting the toy",
  [ACTIONS.JUMP]: "testing the next edge",
  [ACTIONS.LOAF]: "becoming geometrically comfortable",
  [ACTIONS.SLEEP]: "sleeping on the computer",
  [ACTIONS.GROOM]: "performing maintenance",
  [ACTIONS.SEEK_AFFECTION]: "pretending not to want attention",
  [ACTIONS.MISCHIEF]: "considering a bad idea",
  [ACTIONS.PURR]: "purring quietly",
  [ACTIONS.HISS]: "hissing: personal space requested",
  [ACTIONS.CLAW]: "deploying the emergency claws"
};

const rarityColor = {
  common: "#aeb4bd",
  rare: "#65b9ff",
  epic: "#c993ff",
  legendary: "#ffd25e"
};

class CatWorld {
  constructor(root) {
    this.root = root;
    this.platforms = [];
    this.scan();
  }

  scan() {
    this.platforms = [...document.querySelectorAll("[data-cat-platform]")].map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        id: element.dataset.catPlatform,
        element,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width
      };
    }).filter((platform) => platform.width > 40);
    this.platforms.sort((a, b) => a.top - b.top);
  }

  get(id) { return this.platforms.find((platform) => platform.id === id); }

  canTraverse(from, to) {
    return canTraverse(from, to);
  }

  reachableFrom(platform, x) {
    return reachablePlatforms(this.platforms, platform, x);
  }

  nextHopToward(from, destination) {
    return nextHopToward(this.platforms, from, destination);
  }

  launchPoint(from, to) {
    return launchPoint(from, to);
  }

  landingCandidate(previousBottom, nextBottom, left, right, tolerance = 5, ignoredPlatformId = null) {
    if (nextBottom < previousBottom) return null;
    return this.platforms
      .filter((platform) =>
        platform.id !== ignoredPlatformId &&
        previousBottom <= platform.top + tolerance &&
        nextBottom >= platform.top &&
        right > platform.left + 8 &&
        left < platform.right - 8
      )
      .sort((a, b) => a.top - b.top)[0] || null;
  }
}

class LivingCat {
  constructor(world) {
    this.world = world;
    this.profile = getCatProfile(DEFAULT_CAT_ID);
    this.brain = new CatBrain({ profile: this.profile });
    this.x = Math.max(60, window.innerWidth * 0.56);
    this.y = window.innerHeight - 38 - CAT_SIZE + CAT_FOOT_OFFSET;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
    this.grounded = true;
    this.platformId = "floor";
    this.renderState = "idle";
    this.actionStartedAt = performance.now();
    this.nextDecisionAt = performance.now() + 900;
    this.target = null;
    this.pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, visible: false, movedAt: 0, speed: 0 };
    this.toy = null;
    this.toyType = null;
    this.toyTarget = null;
    this.inBox = false;
    this.specialCooldownUntil = 0;
    this.lastPetAt = 0;
    this.lastFrame = -1;
    this.lastReactionAt = 0;
    this.glitchFlashUntil = 0;
    this.landingFlashUntil = 0;
    this.nextJumpAt = 0;
    this.paused = false;
    this.drag = null;
    this.departingPlatformId = null;
    this.ignoreCatClickUntil = 0;
    this.selectProfile(this.profile.id, false);
  }

  selectProfile(id, announce = true) {
    const now = performance.now();
    this.profile = getCatProfile(id);
    this.brain = new CatBrain({ profile: this.profile });
    this.vx = 0;
    this.target = null;
    this.lastFrame = -1;
    this.renderState = "idle";
    this.nextDecisionAt = now + 900;
    catElement.dataset.catId = this.profile.id;
    catElement.dataset.rarity = this.profile.rarity;
    catElement.dataset.ability = this.profile.movement.ability;
    catElement.dataset.speed = String(this.profile.movement.speed);
    catElement.dataset.jump = String(this.profile.movement.jump);
    const article = /^[aeiou]/i.test(this.profile.rarity) ? "an" : "a";
    catElement.setAttribute("aria-label", `${this.profile.name}, ${article} ${this.profile.rarity} autonomous widget cat`);
    catElement.style.setProperty("--rarity-color", rarityColor[this.profile.rarity]);
    catPortrait.style.setProperty("--atlas-x", `${this.profile.atlas[0] * 50}%`);
    catPortrait.style.setProperty("--atlas-y", `${this.profile.atlas[1] * 50}%`);
    catSprite.hidden = this.profile.id !== DEFAULT_CAT_ID;
    catPortrait.hidden = this.profile.id === DEFAULT_CAT_ID;
    for (const button of catGrid.querySelectorAll("[data-cat-id]")) {
      button.setAttribute("aria-pressed", String(button.dataset.catId === this.profile.id));
    }
    debugName.textContent = this.profile.name;
    debugRarity.textContent = this.profile.rarity;
    debugAbility.textContent = this.profile.movement.ability;
    if (announce) {
      statusCopy.textContent = `${this.profile.name} moved in · ${this.profile.rarity} · ${this.profile.tagline}`;
      createHeart(this.x + CAT_SIZE / 2, this.y + 6, "✦", `reaction--${this.profile.rarity}`);
    }
    this.updateSprite(now);
    this.render();
  }

  context(now) {
    const platform = this.world.get(this.platformId);
    const centerX = this.x + CAT_SIZE / 2;
    const centerY = this.y + CAT_SIZE / 2;
    const pointerDistance = Math.hypot(this.pointer.x - centerX, this.pointer.y - centerY);
    return {
      quiet: now - this.pointer.movedAt > 5500,
      pointerVisible: this.pointer.visible,
      pointerNear: this.pointer.visible && pointerDistance < 240,
      pointerMoved: now - this.pointer.movedAt < 180,
      loudMotion: this.pointer.speed > 1300 && pointerDistance < 170,
      toyAvailable: Boolean(this.toyType),
      toyType: this.toyType,
      onHighPlatform: platform && platform.top < window.innerHeight * 0.55,
      reachablePlatforms: this.world.reachableFrom(platform, centerX).length,
      canJump: this.grounded && this.world.reachableFrom(platform, centerX).length > 0
    };
  }

  update(dt, now) {
    if (this.paused) return;
    if (this.drag?.kind === "cat") {
      this.updateToy(dt, now);
      this.updateSprite(now);
      this.render();
      this.updateDebug();
      return;
    }
    const context = this.context(now);
    this.brain.tick(dt, context);

    if (this.grounded && now >= this.nextDecisionAt) {
      const action = this.brain.decide(context, now);
      this.beginAction(action, now);
      this.nextDecisionAt = this.brain.actionUntil;
    }

    this.updateToy(dt, now);
    this.updateBehavior(dt, now);
    this.updatePhysics(dt, now);
    this.updateSprite(now);
    this.render();
    this.updateDebug();
  }

  beginAction(action, now) {
    this.actionStartedAt = now;
    this.vx = 0;
    this.target = null;
    this.setRenderState(action);

    const platform = this.world.get(this.platformId);
    if (action === ACTIONS.ROAM) {
      if (platform) {
        const roomRight = platform.right - (this.x + CAT_SIZE);
        const roomLeft = this.x - platform.left;
        if (Math.max(roomLeft, roomRight) < 42) this.facing *= -1;
        else if (roomRight < 80) this.facing = -1;
        else if (roomLeft < 80) this.facing = 1;
      }
      this.vx = this.facing * (42 + Math.random() * 26) * this.profile.movement.speed;
    } else if (action === ACTIONS.JUMP) {
      this.jumpToInterestingPlatform();
    } else if (action === ACTIONS.PLAY) {
      this.target = this.currentToyTarget() || { x: this.pointer.x, y: this.pointer.y, kind: "cursor" };
    } else if (action === ACTIONS.INSPECT || action === ACTIONS.SEEK_AFFECTION) {
      this.target = { x: this.pointer.x, y: this.pointer.y, kind: "cursor" };
    } else if (action === ACTIONS.MISCHIEF) {
      if (Math.random() > 0.46) this.jumpForward(0.72);
      else this.vx = this.facing * 82 * this.profile.movement.speed;
    } else if (action === ACTIONS.HISS) {
      this.vx = 0;
      this.showAngryReaction("HSS!", now);
    } else if (action === ACTIONS.CLAW) {
      const delta = this.pointer.x - (this.x + CAT_SIZE / 2);
      this.facing = Math.sign(delta) || this.facing;
      this.vx = this.grounded ? this.facing * 118 : this.vx;
      this.showAngryReaction("///", now);
    }
  }

  showAngryReaction(glyph, now = performance.now()) {
    if (now - this.lastReactionAt < 480) return;
    this.lastReactionAt = now;
    const x = this.x + CAT_SIZE * (this.facing > 0 ? 0.72 : 0.28);
    const y = this.y + CAT_SIZE * 0.18;
    createHeart(x, y, glyph, "reaction--anger");
  }

  currentToyTarget() {
    if (this.toyType === "ball") return this.toy;
    if (this.toyType === "box") return this.toyTarget;
    if (this.toyType === "laser" || this.toyType === "feather") {
      return this.pointer.visible ? this.pointer : this.toyTarget;
    }
    return null;
  }

  updateBehavior(dt, now) {
    const action = this.brain.currentAction;
    const platform = this.world.get(this.platformId);

    if (this.inBox && (this.toyType !== "box" || action !== ACTIONS.SLEEP)) this.inBox = false;
    if (
      this.profile.movement.ability === "teleport" &&
      this.grounded &&
      now >= this.specialCooldownUntil &&
      [ACTIONS.PLAY, ACTIONS.MISCHIEF].includes(action) &&
      Math.random() < dt * 0.6
    ) {
      this.glitchStep(now);
    }

    if (action === ACTIONS.ROAM && this.grounded && platform) {
      const leftGap = this.x - platform.left;
      const rightGap = platform.right - (this.x + CAT_SIZE);
      if ((this.facing < 0 && leftGap < 8) || (this.facing > 0 && rightGap < 8)) {
        if (Math.random() < 0.3) this.jumpForward(0.55);
        else { this.facing *= -1; this.vx = this.facing * (42 + Math.random() * 22) * this.profile.movement.speed; }
      }
    }

    if ((action === ACTIONS.PLAY || action === ACTIONS.INSPECT || action === ACTIONS.SEEK_AFFECTION) && this.grounded) {
      const target = action === ACTIONS.PLAY ? this.currentToyTarget() : this.pointer;
      if (target) {
        if (action === ACTIONS.PLAY && target.platformId && target.platformId !== this.platformId) {
          const targetPlatform = this.world.get(target.platformId);
          const currentPlatform = this.world.get(this.platformId);
          const nextHop = this.world.nextHopToward(currentPlatform, targetPlatform);
          if (nextHop && currentPlatform) {
            const center = this.x + CAT_SIZE / 2;
            const reachable = this.world.reachableFrom(currentPlatform, center);
            if (now >= this.nextJumpAt && reachable.some((candidate) => candidate.id === nextHop.id)) {
              this.jumpToPlatform(nextHop, now);
              return;
            }
            const launchX = this.world.launchPoint(currentPlatform, nextHop);
            const launchDelta = launchX - center;
            if (Math.abs(launchDelta) > 18) {
              this.facing = Math.sign(launchDelta) || this.facing;
              this.vx = this.facing * 88;
            } else {
              this.vx *= 0.72;
            }
            return;
          }
        }
        const delta = target.x - (this.x + CAT_SIZE / 2);
        if (Math.abs(delta) > 38) {
          this.facing = Math.sign(delta) || this.facing;
          const playSpeed = 92 * this.profile.movement.speed * (this.toyType === "laser" ? 1.12 : 1);
          this.vx = this.facing * (action === ACTIONS.PLAY ? playSpeed : 46);
        } else {
          this.vx *= 0.78;
          const isAirToy = this.toyType === "laser" || this.toyType === "feather";
          if (action === ACTIONS.PLAY && now >= this.nextJumpAt && Math.abs(target.y - (this.y + CAT_SIZE - CAT_FOOT_OFFSET)) > 42 && Math.random() < dt * (isAirToy ? 2.4 : 1.2)) {
            this.jumpForward(0.54, now);
          }
          if (action === ACTIONS.PLAY && this.toyType === "ball" && this.toy && now - this.toy.spawnedAt > 900 && this.toy.platformId === this.platformId && Math.hypot(delta, target.y - this.y) < 88) {
            this.batToy(now);
          }
          if (action === ACTIONS.PLAY && this.toyType === "box" && this.platformId === "floor" && Math.hypot(delta, target.y - this.y) < 88) {
            this.enterBox(now);
          }
        }
      }
    }

    if (action === ACTIONS.MISCHIEF && this.grounded && Math.abs(this.vx) < 10) {
      this.vx = this.facing * 75 * this.profile.movement.speed;
    }
  }

  glitchStep(now = performance.now()) {
    const platform = this.world.get(this.platformId);
    if (!platform) return;
    const oldX = this.x;
    const direction = Math.random() < 0.5 ? -1 : 1;
    const distance = 62 + Math.random() * 96;
    this.x = Math.min(platform.right - CAT_SIZE, Math.max(platform.left, this.x + direction * distance));
    this.facing = Math.sign(this.x - oldX) || this.facing;
    this.specialCooldownUntil = now + 1900 + Math.random() * 1600;
    this.glitchFlashUntil = now + 420;
    createHeart(oldX + CAT_SIZE / 2, this.y + CAT_SIZE / 2, "▥", "reaction--epic");
    createHeart(this.x + CAT_SIZE / 2, this.y + 12, "⌁", "reaction--epic");
  }

  enterBox(now = performance.now()) {
    if (!this.toyTarget || this.inBox) return;
    const floor = this.world.get("floor");
    this.x = Math.min(window.innerWidth - CAT_SIZE, Math.max(0, this.toyTarget.x - CAT_SIZE / 2));
    this.y = (floor?.top ?? window.innerHeight - 38) - CAT_SIZE + CAT_FOOT_OFFSET;
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;
    this.platformId = "floor";
    this.inBox = true;
    this.brain.drives.anger = Math.max(0, this.brain.drives.anger - 0.12);
    this.brain.setAction(ACTIONS.SLEEP, now, 7200 + Math.random() * 5200);
    this.setRenderState(ACTIONS.SLEEP);
    this.nextDecisionAt = this.brain.actionUntil;
    createHeart(this.toyTarget.x, this.toyTarget.y - 34, "z", "reaction--common");
  }

  jumpToInterestingPlatform() {
    const current = this.world.get(this.platformId);
    const center = this.x + CAT_SIZE / 2;
    const reachable = this.world.reachableFrom(current, center);
    if (!reachable.length) { this.jumpForward(0.52); return; }
    const ranked = reachable.map((platform) => ({
      platform,
      score: (current.top - platform.top) * 0.7 - Math.abs((platform.left + platform.right) / 2 - center) * 0.2 + Math.random() * 90
    })).sort((a, b) => b.score - a.score);
    this.jumpToPlatform(ranked[0].platform, performance.now());
  }

  jumpToPlatform(target, now = performance.now()) {
    const departureId = this.platformId;
    const center = this.x + CAT_SIZE / 2;
    const startY = this.y + CAT_SIZE - CAT_FOOT_OFFSET;
    const endY = target.top;
    const safeLeft = target.left + Math.min(42, target.width * 0.25);
    const safeRight = target.right - Math.min(42, target.width * 0.25);
    const dropping = endY > startY + 24;
    let targetX = dropping
      ? Math.min(safeRight, Math.max(safeLeft, center))
      : Math.min(safeRight, Math.max(safeLeft, (target.left + target.right) / 2));
    const currentPlatform = this.world.get(this.platformId);
    if (dropping && currentPlatform) {
      const exitCandidates = [currentPlatform.left - 120, currentPlatform.right + 120]
        .filter((x) => x >= safeLeft && x <= safeRight)
        .sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
      if (exitCandidates.length) targetX = exitCandidates[0];
    }
    const apexClearance = (dropping ? 48 : 80) * Math.max(0.9, this.profile.movement.jump);
    const apexY = Math.min(startY, endY) - apexClearance;
    this.vy = -Math.sqrt(Math.max(1, 2 * GRAVITY * (startY - apexY)));
    this.vy = Math.max(-940, Math.min(-250, this.vy));
    const verticalDelta = endY - startY;
    const discriminant = Math.max(1, this.vy * this.vy + 2 * GRAVITY * verticalDelta);
    const seconds = Math.max(0.5, (-this.vy + Math.sqrt(discriminant)) / GRAVITY);
    this.facing = Math.sign(targetX - center) || this.facing;
    this.vx = Math.max(-430, Math.min(430, (targetX - center) / seconds));
    this.grounded = false;
    this.platformId = null;
    this.departingPlatformId = dropping ? departureId : null;
    this.target = { x: targetX, y: target.top, platformId: target.id, kind: "platform" };
    this.nextJumpAt = now + 1350;
  }

  jumpForward(power = 0.55, now = performance.now()) {
    const jumpScale = this.profile.movement.jump;
    this.vy = (-440 * power - 170) * jumpScale;
    this.vx = this.facing * (110 + power * 95) * this.profile.movement.speed;
    this.grounded = false;
    this.platformId = null;
    this.departingPlatformId = null;
    this.nextJumpAt = now + 1200;
  }

  updatePhysics(dt, now) {
    const previousBottom = this.y + CAT_SIZE - CAT_FOOT_OFFSET;
    if (!this.grounded) this.vy += GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.grounded) {
      this.vx *= Math.pow(0.93, dt * 60);
      const support = this.world.get(this.platformId);
      const feetOverlap = support && this.x + CAT_SIZE - 14 > support.left && this.x + 14 < support.right;
      if (!feetOverlap) {
        this.grounded = false;
        this.departingPlatformId = support?.id || null;
        this.platformId = null;
        this.vy = Math.max(24, this.vy);
      }
    }

    const nextBottom = this.y + CAT_SIZE - CAT_FOOT_OFFSET;
    if (!this.grounded && this.vy >= 0) {
      const landing = this.world.landingCandidate(previousBottom, nextBottom, this.x + 14, this.x + CAT_SIZE - 14, 5, this.departingPlatformId);
      if (landing) {
        this.y = landing.top - CAT_SIZE + CAT_FOOT_OFFSET;
        this.vy = 0;
        this.vx *= 0.62;
        this.grounded = true;
        this.platformId = landing.id;
        this.departingPlatformId = null;
        this.brain.rememberLanding(landing.id);
        this.landingFlashUntil = now + 280;
        this.nextJumpAt = Math.max(this.nextJumpAt, now + 850);
        this.target = null;
      }
    }

    if (this.x < -8) { this.x = -8; this.facing = 1; this.vx = Math.abs(this.vx); }
    if (this.x + CAT_SIZE > window.innerWidth + 8) { this.x = window.innerWidth - CAT_SIZE + 8; this.facing = -1; this.vx = -Math.abs(this.vx); }
    if (this.y > window.innerHeight + 40) {
      const floor = this.world.get("floor");
      this.x = Math.max(20, Math.min(window.innerWidth - CAT_SIZE - 20, this.x));
      this.y = (floor?.top ?? window.innerHeight - 38) - CAT_SIZE + CAT_FOOT_OFFSET;
      this.vx = this.vy = 0;
      this.grounded = true;
      this.platformId = "floor";
      this.departingPlatformId = null;
    }
  }

  updateToy(dt, now) {
    if (!this.toy) return;
    if (this.drag?.kind === "toy") {
      this.renderToy();
      return;
    }
    const toy = this.toy;
    const previousBottom = advanceToy(toy, dt, window.innerWidth);
    const nextBottom = toy.y + toy.radius;

    if (toy.grounded) {
      const support = this.world.get(toy.platformId);
      if (!isToyOnSurface(toy, support)) {
        toy.grounded = false;
        toy.platformId = null;
      }
    } else if (toy.vy >= 0) {
      const landing = this.world.landingCandidate(
        previousBottom,
        nextBottom,
        toy.x - toy.radius,
        toy.x + toy.radius,
        3
      );
      if (landing) {
        const impact = bounceToy(toy, landing.top, landing.id);
        if (impact > 190) createHeart(toy.x, landing.top - 8, "·");
      }
    }

    if (toy.y - toy.radius > window.innerHeight + 30) {
      const floor = this.world.get("floor");
      toy.x = Math.min(window.innerWidth - toy.radius, Math.max(toy.radius, toy.x));
      toy.y = (floor?.top ?? window.innerHeight - 38) - toy.radius;
      toy.vx *= 0.45;
      toy.vy = -160;
      toy.grounded = false;
      toy.platformId = "floor";
    }

    this.renderToy();

    if (now - toy.lastKickedAt > 650 && toy.platformId === this.platformId) {
      const pawX = this.x + CAT_SIZE * (this.facing > 0 ? 0.72 : 0.28);
      const pawY = this.y + CAT_SIZE * 0.78;
      if (Math.hypot(toy.x - pawX, toy.y - pawY) < 38) this.batToy(now);
    }
  }

  renderToy() {
    if (!this.toy) return;
    const toy = this.toy;
    toyElement.style.left = `${toy.x - toy.radius}px`;
    toyElement.style.top = `${toy.y - toy.radius}px`;
    toyElement.classList.toggle("toy--airborne", !toy.grounded);
    toyElement.classList.toggle("toy--held", this.drag?.kind === "toy");
    toyElement.style.setProperty("--toy-speed", String(Math.min(1, Math.abs(toy.vx) / 320)));
    toyElement.dataset.bounces = String(toy.bounceCount);
    toyElement.dataset.hits = String(toy.hitCount);
    toyElement.dataset.platform = toy.platformId || "airborne";
  }

  setRenderState(action) {
    const state = {
      [ACTIONS.LOAF]: "loaf",
      [ACTIONS.SLEEP]: "sleep",
      [ACTIONS.GROOM]: "groom",
      [ACTIONS.PURR]: "purr",
      [ACTIONS.INSPECT]: "alert",
      [ACTIONS.SEEK_AFFECTION]: "alert",
      [ACTIONS.HISS]: "hiss",
      [ACTIONS.CLAW]: "claw"
    }[action] || "idle";
    this.renderState = state;
  }

  updateSprite(now) {
    catElement.className = `cat cat--${this.renderState}`;
    if (this.drag?.kind === "cat") catElement.classList.add("cat--held");
    if (!this.grounded) catElement.classList.add("cat--airborne");
    if (now < this.landingFlashUntil) catElement.classList.add("cat--land");
    if (this.inBox) catElement.classList.add("cat--in-box");
    if (this.profile.movement.ability === "turbo-sprint" && Math.abs(this.vx) > 120) catElement.classList.add("cat--sprinting");
    if (now < this.glitchFlashUntil) catElement.classList.add("cat--glitching");
    clawMark.style.left = this.facing > 0 ? "62%" : "12%";

    let frameIndex = 0;
    if (this.brain.currentAction === ACTIONS.SLEEP) frameIndex = 4;
    else if (this.brain.currentAction === ACTIONS.PURR) frameIndex = 5;
    else if (this.grounded && [ACTIONS.IDLE, ACTIONS.LOAF].includes(this.brain.currentAction)) {
      frameIndex = Math.floor(now / 190) % idleFrames.length;
    } else if (this.brain.currentAction === ACTIONS.GROOM) {
      frameIndex = Math.floor(now / 330) % 2 ? 3 : 5;
    } else if (this.brain.currentAction === ACTIONS.INSPECT) frameIndex = 1;
    if (this.profile.id === DEFAULT_CAT_ID && frameIndex !== this.lastFrame) {
      catSprite.src = idleFrames[frameIndex];
      this.lastFrame = frameIndex;
    }
  }

  render() {
    catElement.style.transform = `translate3d(${this.x.toFixed(2)}px, ${this.y.toFixed(2)}px, 0)`;
    catElement.style.setProperty("--facing", this.facing);
    catElement.dataset.platform = this.platformId || "airborne";
    catElement.dataset.grounded = String(this.grounded);
    catElement.dataset.x = this.x.toFixed(1);
    catElement.dataset.y = this.y.toFixed(1);
    const activity = this.drag?.kind === "cat"
      ? "temporarily accepting relocation"
      : this.drag?.kind === "toy"
        ? "watching where you put the toy"
        : actionCopy[this.brain.currentAction] || "thinking cat thoughts";
    statusCopy.textContent = `${this.profile.name} · ${activity}`;
  }

  startDrag(kind, event) {
    if (kind === "toy" && !this.toy) return false;
    const now = performance.now();
    const originX = kind === "cat" ? this.x : this.toy.x;
    const originY = kind === "cat" ? this.y : this.toy.y;
    this.drag = {
      kind,
      pointerId: event.pointerId,
      offsetX: event.clientX - originX,
      offsetY: event.clientY - originY,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastAt: now,
      vx: 0,
      vy: 0,
      distance: 0
    };

    if (kind === "cat") {
      this.vx = 0;
      this.vy = 0;
      this.grounded = false;
      this.platformId = null;
      this.departingPlatformId = null;
      this.setRenderState(ACTIONS.INSPECT);
      this.updateSprite(now);
    } else {
      this.toy.vx = 0;
      this.toy.vy = 0;
      this.toy.grounded = false;
      this.toy.platformId = null;
      this.renderToy();
    }
    return true;
  }

  moveDrag(event) {
    const drag = this.drag;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    const now = performance.now();
    const elapsed = Math.max(8, now - drag.lastAt) / 1000;
    const sampleVx = (event.clientX - drag.lastX) / elapsed;
    const sampleVy = (event.clientY - drag.lastY) / elapsed;
    drag.vx = drag.vx * 0.42 + sampleVx * 0.58;
    drag.vy = drag.vy * 0.42 + sampleVy * 0.58;
    drag.distance = Math.max(drag.distance, Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY));
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastAt = now;

    if (drag.kind === "cat") {
      this.x = Math.min(window.innerWidth - CAT_SIZE, Math.max(0, event.clientX - drag.offsetX));
      this.y = Math.min(window.innerHeight - CAT_SIZE + CAT_FOOT_OFFSET, Math.max(0, event.clientY - drag.offsetY));
      this.render();
    } else if (this.toy) {
      this.toy.x = Math.min(window.innerWidth - this.toy.radius, Math.max(this.toy.radius, event.clientX - drag.offsetX));
      this.toy.y = Math.min(window.innerHeight - this.toy.radius, Math.max(this.toy.radius, event.clientY - drag.offsetY));
      this.renderToy();
    }
    return true;
  }

  endDrag(event) {
    const drag = this.drag;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    const now = performance.now();
    const stale = now - drag.lastAt > 90;
    const releaseVx = stale ? drag.vx * 0.12 : drag.vx;
    const releaseVy = stale ? drag.vy * 0.12 : drag.vy;
    this.drag = null;

    if (drag.kind === "cat") {
      this.vx = Math.min(520, Math.max(-520, releaseVx));
      this.vy = Math.min(500, Math.max(-500, releaseVy));
      this.grounded = false;
      this.platformId = null;
      this.departingPlatformId = null;
      const bottom = this.y + CAT_SIZE - CAT_FOOT_OFFSET;
      const landing = this.world.platforms
        .filter((platform) =>
          this.x + CAT_SIZE - 12 > platform.left &&
          this.x + 12 < platform.right &&
          Math.abs(bottom - platform.top) < 22 &&
          this.vy > -60
        )
        .sort((a, b) => a.top - b.top)[0];
      if (landing) {
        this.y = landing.top - CAT_SIZE + CAT_FOOT_OFFSET;
        this.vy = 0;
        this.vx *= 0.35;
        this.grounded = true;
        this.platformId = landing.id;
      }
      this.brain.setAction(ACTIONS.INSPECT, now, 1300);
      this.nextDecisionAt = this.brain.actionUntil;
      if (drag.distance > 6) this.ignoreCatClickUntil = now + 350;
      this.updateSprite(now);
      this.render();
    } else if (this.toy) {
      this.toy.vx = Math.min(760, Math.max(-760, releaseVx));
      this.toy.vy = Math.min(720, Math.max(-720, releaseVy));
      this.toy.grounded = false;
      this.toy.platformId = null;
      this.toy.lastKickedAt = now;
      this.renderToy();
    }
    return true;
  }

  updatePointer(x, y, speed, now) {
    this.pointer = { x, y, speed, movedAt: now, visible: true };
    if (this.toyType === "laser" || this.toyType === "feather") {
      const element = this.toyType === "laser" ? laserToyElement : featherToyElement;
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      this.toyTarget = { x, y, kind: this.toyType };
    }
    const headX = this.x + CAT_SIZE * 0.5;
    const headY = this.y + CAT_SIZE * 0.34;
    const closeToHead = Math.hypot(x - headX, y - headY) < 54;
    if (closeToHead && speed > 35 && speed < 950 && now - this.lastPetAt > 140) {
      this.lastPetAt = now;
      const reaction = this.brain.pet(Math.min(1.7, 0.65 + speed / 700), now);
      this.setRenderState(reaction);
      this.nextDecisionAt = this.brain.actionUntil;
      this.vx *= 0.35;
      if (reaction === ACTIONS.PURR) createHeart(headX, headY - 10);
      else this.showAngryReaction(reaction === ACTIONS.CLAW ? "///" : "HSS!", now);
    }
  }

  batToy(now) {
    if (!this.toy) return;
    if (now - this.toy.lastKickedAt < 520) return;
    const direction = Math.sign(this.toy.x - (this.x + CAT_SIZE / 2)) || this.facing;
    this.facing = direction;
    kickToy(this.toy, direction, (0.82 + Math.random() * 0.35) * this.profile.movement.toyForce, now);
    createHeart(this.toy.x, this.toy.y - 5, "✦");
    this.brain.drives.playfulness = Math.max(0, this.brain.drives.playfulness - 0.035);
    this.brain.setAction(ACTIONS.PLAY, now, 3600);
    this.nextDecisionAt = this.brain.actionUntil;
  }

  syncToyButtons() {
    for (const button of toyTray.querySelectorAll("[data-toy-type]")) {
      button.setAttribute("aria-pressed", String(button.dataset.toyType === this.toyType));
    }
  }

  activateToy(type) {
    if (type === "ball") {
      this.dropToy();
      return;
    }

    this.toy = null;
    this.toyType = type;
    this.inBox = false;
    toyElement.classList.remove("is-visible");
    laserToyElement.hidden = true;
    boxToyElement.hidden = true;
    featherToyElement.hidden = true;

    const now = performance.now();
    const floor = this.world.get("floor");
    if (type === "box") {
      const x = Math.min(window.innerWidth - 118, Math.max(28, window.innerWidth * 0.68));
      const y = (floor?.top ?? window.innerHeight - 38) - 54;
      boxToyElement.style.left = `${x}px`;
      boxToyElement.style.top = `${y}px`;
      boxToyElement.hidden = false;
      this.toyTarget = { x: x + 44, y: y + 30, platformId: "floor", kind: "box" };
    } else {
      const x = this.pointer.visible ? this.pointer.x : window.innerWidth * 0.72;
      const y = this.pointer.visible ? this.pointer.y : window.innerHeight * 0.46;
      const element = type === "laser" ? laserToyElement : featherToyElement;
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.hidden = false;
      this.toyTarget = { x, y, kind: type };
    }

    this.brain.noticeToy(now);
    this.brain.setAction(ACTIONS.PLAY, now, 7200);
    this.beginAction(ACTIONS.PLAY, now);
    this.nextDecisionAt = this.brain.actionUntil;
    this.syncToyButtons();
    statusCopy.textContent = `${this.profile.name} noticed the ${type}`;
  }

  dropToy() {
    this.toyType = "ball";
    this.toyTarget = null;
    this.inBox = false;
    laserToyElement.hidden = true;
    boxToyElement.hidden = true;
    featherToyElement.hidden = true;
    const current = this.world.get(this.platformId) || this.world.get("floor");
    const center = this.x + CAT_SIZE / 2;
    const reachable = this.world.reachableFrom(current, center).filter((platform) => platform.width > 100);
    const sameSurface = current?.width > 150 ? current : null;
    const platform = reachable[Math.floor(Math.random() * reachable.length)] || sameSurface || this.world.get("floor");
    let leftBound = platform.left + 25;
    let rightBound = platform.right - 25;
    if (platform.id === "floor") {
      const controlsRect = document.querySelector(".controls").getBoundingClientRect();
      leftBound = debugPanel.hidden ? leftBound : Math.max(leftBound, debugPanel.getBoundingClientRect().right + 40);
      rightBound = Math.min(rightBound, controlsRect.left - 40);
    }
    if (rightBound < leftBound) [leftBound, rightBound] = [platform.left + 25, platform.right - 25];
    let x = leftBound + Math.random() * Math.max(10, rightBound - leftBound);
    if (platform.id === current?.id && Math.abs(x - center) < 150) {
      const roomOnRight = rightBound - center;
      x = roomOnRight > 210
        ? Math.min(rightBound, center + 180)
        : Math.max(leftBound, center - 180);
    }
    const y = Math.max(TOY_RADIUS + 12, platform.top - 58);
    const now = performance.now();
    this.toy = createToy({
      x,
      y,
      vx: (Math.random() - 0.5) * 110,
      vy: 35,
      platformId: platform.id,
      now
    });
    toyElement.style.left = `${x - TOY_RADIUS}px`;
    toyElement.style.top = `${y - TOY_RADIUS}px`;
    toyElement.classList.add("is-visible");
    this.syncToyButtons();
    this.brain.noticeToy(now);
    this.brain.setAction(ACTIONS.PLAY, now, 5200);
    this.beginAction(ACTIONS.PLAY, now);
    this.nextDecisionAt = this.brain.actionUntil;
    toyButton.classList.add("is-active");
    toyButton.innerHTML = '<span aria-hidden="true">●</span> Toy dropped!';
    clearTimeout(this.toyButtonTimer);
    this.toyButtonTimer = setTimeout(() => {
      toyButton.classList.remove("is-active");
      toyButton.innerHTML = '<span aria-hidden="true">●</span> Drop ball';
    }, 1000);
  }

  updateDebug() {
    if (debugPanel.hidden) return;
    debugAction.textContent = this.brain.currentAction;
    debugPlatform.textContent = this.platformId || "airborne";
    debugPets.textContent = String(this.brain.memory.petCount);
    debugJumps.textContent = String(this.brain.memory.jumpsLanded);
    for (const [name, value] of Object.entries(this.brain.drives)) {
      const bar = driveList.querySelector(`[data-drive="${name}"]`);
      if (!bar) continue;
      bar.querySelector("span").style.width = `${Math.round(value * 100)}%`;
      bar.querySelector("output").textContent = String(Math.round(value * 100));
    }
  }
}

function setupDriveList() {
  for (const name of ["energy", "curiosity", "affection", "playfulness", "confidence", "anger"]) {
    const row = document.createElement("div");
    row.className = "drive";
    row.dataset.drive = name;
    row.innerHTML = `<label>${name}</label><div class="drive-meter"><span></span></div><output>0</output>`;
    driveList.append(row);
  }
}

function setupRoster() {
  for (const profile of CAT_PROFILES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `cat-option cat-option--${profile.rarity}`;
    button.dataset.catId = profile.id;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", `Choose ${profile.name}, ${profile.rarity}: ${profile.tagline}`);
    button.innerHTML = `
      <span class="cat-option-art" aria-hidden="true"></span>
      <span class="cat-option-copy">
        <strong class="cat-option-name">${profile.name}</strong>
        <span class="cat-option-rarity">${profile.rarity}</span>
        <span class="cat-option-tagline">${profile.tagline}</span>
        <span class="cat-option-ability">${profile.movement.ability}</span>
      </span>`;
    const art = button.querySelector(".cat-option-art");
    art.style.setProperty("--atlas-x", `${profile.atlas[0] * 50}%`);
    art.style.setProperty("--atlas-y", `${profile.atlas[1] * 50}%`);
    catGrid.append(button);
  }
}

function createHeart(x, y, glyph = "♥", variant = "") {
  const heart = document.createElement("span");
  heart.className = `heart ${variant}`.trim();
  heart.textContent = glyph;
  heart.style.left = `${x}px`;
  heart.style.top = `${y}px`;
  heart.style.setProperty("--drift", `${-14 + Math.random() * 28}px`);
  particleLayer.append(heart);
  heart.addEventListener("animationend", () => heart.remove(), { once: true });
}

setupDriveList();
setupRoster();
const world = new CatWorld(habitat);
const cat = new LivingCat(world);
habitat.dataset.features = "autonomy personalities rarity-roster anger hiss claw platforms toy-physics drag-cat drag-toy throw-ball";
window.catStudio = { cat, world, profiles: CAT_PROFILES, selectCat: (id) => cat.selectProfile(id) };
let previousTime = performance.now();
let pointerSample = { x: 0, y: 0, time: previousTime };

function frame(now) {
  const dt = Math.min(0.04, (now - previousTime) / 1000);
  previousTime = now;
  cat.update(dt, now);
  requestAnimationFrame(frame);
}

window.addEventListener("pointermove", (event) => {
  if (cat.moveDrag(event)) {
    event.preventDefault();
    return;
  }
  const now = performance.now();
  const elapsed = Math.max(16, now - pointerSample.time);
  const speed = Math.hypot(event.clientX - pointerSample.x, event.clientY - pointerSample.y) / elapsed * 1000;
  pointerSample = { x: event.clientX, y: event.clientY, time: now };
  cat.updatePointer(event.clientX, event.clientY, speed, now);
}, { passive: false });

catElement.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  if (cat.startDrag("cat", event)) {
    try { catElement.setPointerCapture?.(event.pointerId); } catch { /* Synthetic test events have no native capture target. */ }
  }
});

toyElement.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  if (cat.startDrag("toy", event)) {
    try { toyElement.setPointerCapture?.(event.pointerId); } catch { /* Synthetic test events have no native capture target. */ }
  }
});

window.addEventListener("pointerup", (event) => cat.endDrag(event));
window.addEventListener("pointercancel", (event) => cat.endDrag(event));

window.addEventListener("resize", () => {
  world.scan();
  const platform = world.get(cat.platformId) || world.get("floor");
  cat.x = Math.min(window.innerWidth - CAT_SIZE, Math.max(0, cat.x));
  if (cat.grounded && platform) cat.y = platform.top - CAT_SIZE + CAT_FOOT_OFFSET;
});

document.addEventListener("visibilitychange", () => {
  previousTime = performance.now();
});

toyButton.addEventListener("click", () => {
  cat.dropToy();
  toyTray.hidden = true;
  toyMenuButton.setAttribute("aria-pressed", "false");
});
function setRosterVisible(visible) {
  rosterPanel.hidden = !visible;
  rosterButton.setAttribute("aria-pressed", String(visible));
  if (visible) {
    toyTray.hidden = true;
    toyMenuButton.setAttribute("aria-pressed", "false");
  }
}

function setToyTrayVisible(visible) {
  toyTray.hidden = !visible;
  toyMenuButton.setAttribute("aria-pressed", String(visible));
  if (visible) {
    rosterPanel.hidden = true;
    rosterButton.setAttribute("aria-pressed", "false");
  }
}

rosterButton.addEventListener("click", () => setRosterVisible(rosterPanel.hidden));
rosterClose.addEventListener("click", () => setRosterVisible(false));
catGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cat-id]");
  if (!button) return;
  cat.selectProfile(button.dataset.catId);
  setRosterVisible(false);
});
toyMenuButton.addEventListener("click", () => setToyTrayVisible(toyTray.hidden));
toyTray.addEventListener("click", (event) => {
  const button = event.target.closest("[data-toy-type]");
  if (!button) return;
  cat.activateToy(button.dataset.toyType);
  setToyTrayVisible(false);
});
petButton.addEventListener("click", () => {
  const now = performance.now();
  const reaction = cat.brain.pet(1.2, now);
  cat.setRenderState(reaction);
  cat.nextDecisionAt = cat.brain.actionUntil;
  if (reaction === ACTIONS.PURR) createHeart(cat.x + CAT_SIZE / 2, cat.y + 10);
  else cat.showAngryReaction(reaction === ACTIONS.CLAW ? "///" : "HSS!", now);
});
debugButton.addEventListener("click", () => {
  debugPanel.hidden = !debugPanel.hidden;
  debugButton.setAttribute("aria-pressed", String(!debugPanel.hidden));
  debugButton.textContent = debugPanel.hidden ? "Show brain" : "Hide brain";
  cat.updateDebug();
});
pauseButton.addEventListener("click", () => {
  cat.paused = !cat.paused;
  habitat.classList.toggle("paused", cat.paused);
  pauseButton.setAttribute("aria-pressed", String(cat.paused));
  pauseButton.textContent = cat.paused ? "Resume" : "Pause";
  previousTime = performance.now();
});

catElement.addEventListener("click", () => {
  const now = performance.now();
  if (now < cat.ignoreCatClickUntil) return;
  const reaction = cat.brain.pet(1.2, now);
  cat.setRenderState(reaction);
  cat.nextDecisionAt = cat.brain.actionUntil;
  if (reaction === ACTIONS.PURR) createHeart(cat.x + CAT_SIZE / 2, cat.y + 10);
  else cat.showAngryReaction(reaction === ACTIONS.CLAW ? "///" : "HSS!", now);
});

requestAnimationFrame(frame);
