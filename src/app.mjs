import { ACTIONS, CatBrain } from "./brain.mjs";
import { CAT_PROFILES, DEFAULT_CAT_ID, getCatProfile } from "./cats.mjs";
import { canTraverse, launchPoint, nextHopToward, reachablePlatforms } from "./navigation.mjs";
import { advanceToy, bounceToy, createToy, isToyOnSurface, kickToy, TOY_RADIUS } from "./toy-physics.mjs";
import {
  advanceBox,
  advanceFishingRig,
  createBox,
  createFishingRig,
  isBoxOnSurface,
  segmentGeometry,
  setFishingHandle,
  settleBox
} from "./toy-interactions.mjs";

const habitat = document.querySelector("#habitat");
const catElement = document.querySelector("#cat");
const catSprite = document.querySelector("#cat-sprite");
const catPortrait = document.querySelector("#cat-portrait");
const clawMark = document.querySelector(".claw-mark");
const toyElement = document.querySelector("#toy");
const laserToyElement = document.querySelector("#laser-toy");
const boxToyElement = document.querySelector("#box-toy");
const featherToyElement = document.querySelector("#feather-toy");
const fishingHandleElement = featherToyElement.querySelector(".fishing-handle");
const fishingRodElement = featherToyElement.querySelector(".fishing-rod");
const fishingLineElement = featherToyElement.querySelector(".fishing-line");
const featherLureElement = featherToyElement.querySelector(".feather-lure");
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
    this.box = null;
    this.fishingRig = null;
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
    this.lastPointerReactionCheck = 0;
    this.lastStatusCopy = "";
    this.lastCatTransform = "";
    this.lastCatClassName = "";
    this.lastBoxTransform = "";
    this.nextDebugUpdateAt = 0;
    this.nextToyDatasetAt = 0;
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
      this.updateActiveToy(dt, now);
      this.updateSprite(now);
      this.render();
      this.updateDebug(now);
      return;
    }
    const context = this.context(now);
    this.brain.tick(dt, context);

    if (this.grounded && now >= this.nextDecisionAt) {
      const action = this.brain.decide(context, now);
      this.beginAction(action, now);
      this.nextDecisionAt = this.brain.actionUntil;
    }

    this.updateActiveToy(dt, now);
    this.updateBehavior(dt, now);
    this.updatePhysics(dt, now);
    this.updateSprite(now);
    this.render();
    this.updateDebug(now);
  }

  updateActiveToy(dt, now) {
    if (this.toyType === "ball") this.updateToy(dt, now);
    else if (this.toyType === "laser") this.updateLaser();
    else if (this.toyType === "box") this.updateBox(dt);
    else if (this.toyType === "feather") this.updateFishingRod(dt, now);
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
    if (["box", "laser", "feather"].includes(this.toyType)) return this.toyTarget;
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
          if (action === ACTIONS.PLAY && this.toyType === "box" && target.platformId === this.platformId && Math.hypot(delta, target.y - this.y) < 88) {
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
    if (!this.toyTarget || !this.box || !this.box.grounded || this.inBox) return;
    const platform = this.world.get(this.box.platformId) || this.world.get("floor");
    this.x = Math.min(window.innerWidth - CAT_SIZE, Math.max(0, this.box.x + this.box.width / 2 - CAT_SIZE / 2));
    this.y = (platform?.top ?? window.innerHeight - 38) - CAT_SIZE + CAT_FOOT_OFFSET;
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;
    this.platformId = platform?.id || "floor";
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

  updateLaser() {
    if (!this.pointer.visible) return;
    const transform = `translate3d(${this.pointer.x.toFixed(1)}px, ${this.pointer.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    if (laserToyElement.style.transform !== transform) laserToyElement.style.transform = transform;
    if (!this.toyTarget) this.toyTarget = { x: this.pointer.x, y: this.pointer.y, kind: "laser" };
    else {
      this.toyTarget.x = this.pointer.x;
      this.toyTarget.y = this.pointer.y;
    }
  }

  updateBox(dt) {
    if (!this.box) return;
    if (this.drag?.kind === "box") {
      this.renderBox();
      return;
    }

    const box = this.box;
    const previousBottom = advanceBox(box, dt, window.innerWidth);
    if (box.grounded) {
      const support = this.world.get(box.platformId);
      if (!isBoxOnSurface(box, support)) {
        box.grounded = false;
        box.platformId = null;
      }
    } else if (box.vy >= 0) {
      const landing = this.world.landingCandidate(
        previousBottom,
        box.y + box.height,
        box.x + 8,
        box.x + box.width - 8,
        5
      );
      if (landing) settleBox(box, landing.top, landing.id);
    }

    if (box.y > window.innerHeight + 40) {
      const floor = this.world.get("floor");
      box.x = Math.min(window.innerWidth - box.width - 12, Math.max(12, box.x));
      settleBox(box, floor?.top ?? window.innerHeight - 38, "floor");
    }

    if (!this.toyTarget) this.toyTarget = { x: 0, y: 0, platformId: null, kind: "box" };
    this.toyTarget.x = box.x + box.width / 2;
    this.toyTarget.y = box.y + box.height;
    this.toyTarget.platformId = box.platformId;
    this.renderBox();
  }

  renderBox() {
    if (!this.box) return;
    const transform = `translate3d(${this.box.x.toFixed(1)}px, ${this.box.y.toFixed(1)}px, 0)`;
    if (transform !== this.lastBoxTransform) {
      boxToyElement.style.transform = transform;
      this.lastBoxTransform = transform;
    }
    boxToyElement.classList.toggle("box-toy--held", this.drag?.kind === "box");
    const platform = this.box.platformId || "airborne";
    const grounded = String(this.box.grounded);
    const x = this.box.x.toFixed(1);
    const y = this.box.y.toFixed(1);
    if (boxToyElement.dataset.platform !== platform) boxToyElement.dataset.platform = platform;
    if (boxToyElement.dataset.grounded !== grounded) boxToyElement.dataset.grounded = grounded;
    if (boxToyElement.dataset.x !== x) boxToyElement.dataset.x = x;
    if (boxToyElement.dataset.y !== y) boxToyElement.dataset.y = y;
  }

  updateFishingRod(dt, now) {
    if (!this.fishingRig) return;
    advanceFishingRig(this.fishingRig, dt, window.innerWidth, window.innerHeight);
    if (!this.toyTarget) this.toyTarget = { x: 0, y: 0, kind: "feather" };
    this.toyTarget.x = this.fishingRig.lureX;
    this.toyTarget.y = this.fishingRig.lureY;
    this.renderFishingRod(now);
  }

  renderFishingRod(now = performance.now()) {
    const rig = this.fishingRig;
    if (!rig) return;
    const rod = segmentGeometry(rig.handleX, rig.handleY, rig.tipX, rig.tipY);
    const line = segmentGeometry(rig.tipX, rig.tipY, rig.lureX, rig.lureY);
    const lureAngle = Math.atan2(rig.lureVy, rig.lureVx || 0.001) * 180 / Math.PI;

    fishingHandleElement.style.transform = `translate3d(${(rig.handleX - 8).toFixed(1)}px, ${(rig.handleY - 8).toFixed(1)}px, 0)`;
    fishingRodElement.style.transform = `translate3d(${rod.x.toFixed(1)}px, ${(rod.y - 2.5).toFixed(1)}px, 0) rotate(${rod.angle.toFixed(2)}deg) scaleX(${rod.length.toFixed(1)})`;
    fishingLineElement.style.transform = `translate3d(${line.x.toFixed(1)}px, ${line.y.toFixed(1)}px, 0) rotate(${line.angle.toFixed(2)}deg) scaleX(${line.length.toFixed(1)})`;
    featherLureElement.style.transform = `translate3d(${(rig.lureX - 17).toFixed(1)}px, ${(rig.lureY - 14).toFixed(1)}px, 0) rotate(${lureAngle.toFixed(1)}deg)`;
    if (now >= this.nextToyDatasetAt) {
      featherToyElement.dataset.lureX = rig.lureX.toFixed(1);
      featherToyElement.dataset.lureY = rig.lureY.toFixed(1);
      featherToyElement.dataset.lineLength = line.length.toFixed(1);
      this.nextToyDatasetAt = now + 120;
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
    const classes = ["cat", `cat--${this.renderState}`];
    if (this.drag?.kind === "cat") classes.push("cat--held");
    if (!this.grounded) classes.push("cat--airborne");
    if (now < this.landingFlashUntil) classes.push("cat--land");
    if (this.inBox) classes.push("cat--in-box");
    if (this.profile.movement.ability === "turbo-sprint" && Math.abs(this.vx) > 120) classes.push("cat--sprinting");
    if (now < this.glitchFlashUntil) classes.push("cat--glitching");
    const className = classes.join(" ");
    if (className !== this.lastCatClassName) {
      catElement.className = className;
      this.lastCatClassName = className;
    }
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
    const transform = `translate3d(${this.x.toFixed(2)}px, ${this.y.toFixed(2)}px, 0)`;
    if (transform !== this.lastCatTransform) {
      catElement.style.transform = transform;
      this.lastCatTransform = transform;
    }
    catElement.style.setProperty("--facing", this.facing);
    const platform = this.platformId || "airborne";
    const grounded = String(this.grounded);
    const x = this.x.toFixed(1);
    const y = this.y.toFixed(1);
    if (catElement.dataset.platform !== platform) catElement.dataset.platform = platform;
    if (catElement.dataset.grounded !== grounded) catElement.dataset.grounded = grounded;
    if (catElement.dataset.x !== x) catElement.dataset.x = x;
    if (catElement.dataset.y !== y) catElement.dataset.y = y;
    const activity = this.drag?.kind === "cat"
      ? "temporarily accepting relocation"
      : ["toy", "box"].includes(this.drag?.kind)
        ? "watching where you put the toy"
        : actionCopy[this.brain.currentAction] || "thinking cat thoughts";
    const nextStatus = `${this.profile.name} · ${activity}`;
    if (nextStatus !== this.lastStatusCopy) {
      statusCopy.textContent = nextStatus;
      this.lastStatusCopy = nextStatus;
    }
  }

  startDrag(kind, event) {
    if (kind === "toy" && !this.toy) return false;
    if (kind === "box" && !this.box) return false;
    const now = performance.now();
    const origin = kind === "cat"
      ? { x: this.x, y: this.y }
      : kind === "box"
        ? this.box
        : this.toy;
    const originX = origin.x;
    const originY = origin.y;
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
    } else if (kind === "toy") {
      this.toy.vx = 0;
      this.toy.vy = 0;
      this.toy.grounded = false;
      this.toy.platformId = null;
      this.renderToy();
    } else {
      this.inBox = false;
      this.box.vx = 0;
      this.box.vy = 0;
      this.box.grounded = false;
      this.box.platformId = null;
      this.renderBox();
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
    } else if (drag.kind === "toy" && this.toy) {
      this.toy.x = Math.min(window.innerWidth - this.toy.radius, Math.max(this.toy.radius, event.clientX - drag.offsetX));
      this.toy.y = Math.min(window.innerHeight - this.toy.radius, Math.max(this.toy.radius, event.clientY - drag.offsetY));
      this.renderToy();
    } else if (drag.kind === "box" && this.box) {
      this.box.x = Math.min(window.innerWidth - this.box.width, Math.max(0, event.clientX - drag.offsetX));
      this.box.y = Math.min(window.innerHeight - this.box.height, Math.max(0, event.clientY - drag.offsetY));
      if (!this.toyTarget) this.toyTarget = { x: 0, y: 0, platformId: null, kind: "box" };
      this.toyTarget.x = this.box.x + this.box.width / 2;
      this.toyTarget.y = this.box.y + this.box.height;
      this.toyTarget.platformId = null;
      this.renderBox();
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
    } else if (drag.kind === "toy" && this.toy) {
      this.toy.vx = Math.min(760, Math.max(-760, releaseVx));
      this.toy.vy = Math.min(720, Math.max(-720, releaseVy));
      this.toy.grounded = false;
      this.toy.platformId = null;
      this.toy.lastKickedAt = now;
      this.renderToy();
    } else if (drag.kind === "box" && this.box) {
      this.box.vx = Math.min(460, Math.max(-460, releaseVx));
      this.box.vy = Math.min(480, Math.max(-480, releaseVy));
      this.box.grounded = false;
      this.box.platformId = null;
      this.renderBox();
    }
    return true;
  }

  updatePointer(x, y, speed, now) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.speed = speed;
    this.pointer.movedAt = now;
    this.pointer.visible = true;
    if (this.toyType === "laser") {
      if (!this.toyTarget) this.toyTarget = { x, y, kind: "laser" };
      else { this.toyTarget.x = x; this.toyTarget.y = y; }
    } else if (this.toyType === "feather" && this.fishingRig) {
      setFishingHandle(this.fishingRig, x, y);
    }

    if (now - this.lastPointerReactionCheck < 30) return;
    this.lastPointerReactionCheck = now;
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
    this.box = null;
    this.fishingRig = null;
    this.toyType = type;
    this.toyTarget = null;
    this.inBox = false;
    toyElement.classList.remove("is-visible");
    laserToyElement.hidden = true;
    boxToyElement.hidden = true;
    featherToyElement.hidden = true;

    const now = performance.now();
    const floor = this.world.get("floor");
    if (type === "box") {
      const controlsRect = document.querySelector(".controls").getBoundingClientRect();
      const preferredX = window.innerWidth * 0.62;
      const x = Math.max(28, Math.min(preferredX, controlsRect.left - 124, window.innerWidth - 120));
      const y = (floor?.top ?? window.innerHeight - 38) - 56;
      this.box = createBox({ x, y, platformId: "floor" });
      boxToyElement.hidden = false;
      this.toyTarget = { x: x + this.box.width / 2, y: y + this.box.height, platformId: "floor", kind: "box" };
      this.renderBox();
    } else if (type === "laser") {
      const x = this.pointer.visible ? this.pointer.x : window.innerWidth * 0.72;
      const y = this.pointer.visible ? this.pointer.y : window.innerHeight * 0.46;
      laserToyElement.hidden = false;
      this.toyTarget = { x, y, kind: "laser" };
      this.pointer.x = x;
      this.pointer.y = y;
      this.pointer.visible = true;
      this.updateLaser();
    } else if (type === "feather") {
      const x = window.innerWidth * 0.58;
      const y = window.innerHeight * 0.46;
      this.fishingRig = createFishingRig({ x, y });
      featherToyElement.hidden = false;
      this.toyTarget = { x: this.fishingRig.lureX, y: this.fishingRig.lureY, kind: "feather" };
      this.renderFishingRod();
    }

    this.brain.noticeToy(now);
    this.brain.setAction(ACTIONS.PLAY, now, 7200);
    this.beginAction(ACTIONS.PLAY, now);
    this.nextDecisionAt = this.brain.actionUntil;
    this.syncToyButtons();
    const toyName = type === "feather" ? "fishing rod" : type;
    statusCopy.textContent = `${this.profile.name} noticed the ${toyName}`;
    this.lastStatusCopy = statusCopy.textContent;
  }

  dropToy() {
    this.toyType = "ball";
    this.toyTarget = null;
    this.box = null;
    this.fishingRig = null;
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

  updateDebug(now = performance.now()) {
    if (debugPanel.hidden) return;
    if (now < this.nextDebugUpdateAt) return;
    this.nextDebugUpdateAt = now + 120;
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
habitat.dataset.features = "autonomy personalities rarity-roster anger hiss claw platforms toy-physics drag-cat drag-toy drag-box fishing-rod low-latency-cursor-toys throw-ball";
window.catStudio = { cat, world, profiles: CAT_PROFILES, selectCat: (id) => cat.selectProfile(id) };
let previousTime = performance.now();
let pointerSample = { x: 0, y: 0, time: previousTime, initialized: false };

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
  const samples = event.getCoalescedEvents?.();
  const latest = samples?.length ? samples[samples.length - 1] : event;
  const now = performance.now();
  const elapsed = Math.max(16, now - pointerSample.time);
  const speed = pointerSample.initialized
    ? Math.hypot(latest.clientX - pointerSample.x, latest.clientY - pointerSample.y) / elapsed * 1000
    : 0;
  pointerSample = { x: latest.clientX, y: latest.clientY, time: now, initialized: true };
  cat.updatePointer(latest.clientX, latest.clientY, speed, now);
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

boxToyElement.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  if (cat.startDrag("box", event)) {
    try { boxToyElement.setPointerCapture?.(event.pointerId); } catch { /* Synthetic test events have no native capture target. */ }
  }
});

window.addEventListener("pointerup", (event) => cat.endDrag(event));
window.addEventListener("pointercancel", (event) => cat.endDrag(event));

window.addEventListener("resize", () => {
  world.scan();
  const platform = world.get(cat.platformId) || world.get("floor");
  cat.x = Math.min(window.innerWidth - CAT_SIZE, Math.max(0, cat.x));
  if (cat.grounded && platform) cat.y = platform.top - CAT_SIZE + CAT_FOOT_OFFSET;
  if (cat.box) {
    cat.box.x = Math.min(window.innerWidth - cat.box.width, Math.max(0, cat.box.x));
    const boxPlatform = world.get(cat.box.platformId) || world.get("floor");
    if (cat.box.grounded && boxPlatform) cat.box.y = boxPlatform.top - cat.box.height;
    cat.renderBox();
  }
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
