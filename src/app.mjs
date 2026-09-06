import { ACTIONS, CatBrain } from "./brain.mjs";
import { CAT_PROFILES, DEFAULT_CAT_ID, getCatProfile } from "./cats.mjs";
import { canTraverse, launchPoint, nextHopToward, platformForTarget, reachablePlatforms } from "./navigation.mjs";
import { PerformanceGovernor } from "./performance.mjs";
import { advanceToy, bounceToy, createToy, isToyOnSurface, kickToy, TOY_RADIUS } from "./toy-physics.mjs";
import {
  advanceBubble,
  advanceBox,
  advanceFishingRig,
  advanceMouse,
  createBubble,
  createBox,
  createFishingRig,
  createMouse,
  isBoxOnSurface,
  isMouseOnSurface,
  pounceMouse,
  segmentGeometry,
  setFishingHandle,
  setFishingReel,
  settleMouse,
  strikeFishingLure,
  settleBox
} from "./toy-interactions.mjs";

const habitat = document.querySelector("#habitat");
const catElement = document.querySelector("#cat");
const catSprite = document.querySelector("#cat-sprite");
const catPortrait = document.querySelector("#cat-portrait");
const catClone = document.querySelector("#cat-clone");
const clawMark = document.querySelector(".claw-mark");
const toyElement = document.querySelector("#toy");
const laserToyElement = document.querySelector("#laser-toy");
const boxToyElement = document.querySelector("#box-toy");
const featherToyElement = document.querySelector("#feather-toy");
const fishingHandleElement = featherToyElement.querySelector(".fishing-handle");
const fishingRodElement = featherToyElement.querySelector(".fishing-rod");
const fishingLineElement = featherToyElement.querySelector(".fishing-line");
const featherLureElement = featherToyElement.querySelector(".feather-lure");
const mouseToyElement = document.querySelector("#mouse-toy");
const bubbleToyElement = document.querySelector("#bubble-toy");
const bubbleMachineElement = document.querySelector("#bubble-machine");
const bubbleElements = [...bubbleToyElement.querySelectorAll("[data-bubble-slot]")];
const tunnelToyElement = document.querySelector("#tunnel-toy");
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
const debugPerformance = document.querySelector("#debug-performance");
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
const toyHint = document.querySelector("#toy-hint");

const CAT_SIZE = 84;
const CAT_FOOT_OFFSET = 3;
const GRAVITY = 980;
const fileIdleFrames = Array.from({ length: 8 }, (_, index) =>
  `./assets/animations/idle-v1/frame-${String(index + 1).padStart(2, "0")}.png`
);
const idleFrames = typeof EMBEDDED_IDLE_FRAMES === "undefined"
  ? fileIdleFrames
  : EMBEDDED_IDLE_FRAMES;
const starterCatAtlasUrl = typeof EMBEDDED_CAT_ATLAS === "undefined"
  ? "./assets/cats/starter-roster-v1.png"
  : EMBEDDED_CAT_ATLAS;
const expansionCatAtlasUrl = "./assets/cats/expansion-roster-v1.png";
const superCatAtlasUrl = "./assets/cats/super-roster-v1.png";
const iterationFourAtlasAUrl = "./assets/cats/iteration-four-roster-a-v1.png";
const iterationFourAtlasBUrl = "./assets/cats/iteration-four-roster-b-v1.png";
idleFrames.forEach((src) => { const image = new Image(); image.src = src; });
catSprite.src = idleFrames[0];
habitat.style.setProperty("--cat-atlas-starter", `url("${starterCatAtlasUrl}")`);
habitat.style.setProperty("--cat-atlas-expansion", `url("${expansionCatAtlasUrl}")`);
habitat.style.setProperty("--cat-atlas-super", `url("${superCatAtlasUrl}")`);
habitat.style.setProperty("--cat-atlas-iteration-four-a", `url("${iterationFourAtlasAUrl}")`);
habitat.style.setProperty("--cat-atlas-iteration-four-b", `url("${iterationFourAtlasBUrl}")`);

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

  canTraverse(from, to, jumpReach = 1) {
    return canTraverse(from, to, jumpReach);
  }

  reachableFrom(platform, x, jumpReach = 1) {
    return reachablePlatforms(this.platforms, platform, x, jumpReach);
  }

  nextHopToward(from, destination, jumpReach = 1) {
    return nextHopToward(this.platforms, from, destination, jumpReach);
  }

  launchPoint(from, to) {
    return launchPoint(from, to);
  }

  platformForTarget(x, y, snapDistance = 150) {
    return platformForTarget(this.platforms, x, y, snapDistance);
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
    this.mouse = null;
    this.bubbleMachine = null;
    this.bubbles = [];
    this.bubblePopCount = 0;
    this.nextBubbleAt = 0;
    this.bubbleSeed = 0;
    this.tunnel = null;
    this.tunnelUses = 0;
    this.inTunnel = false;
    this.tunnelExitAt = 0;
    this.tunnelCooldownUntil = 0;
    this.inBox = false;
    this.specialCooldownUntil = 0;
    this.lastPetAt = 0;
    this.lastFrame = -1;
    this.lastReactionAt = 0;
    this.glitchFlashUntil = 0;
    this.abilityFlashUntil = 0;
    this.doubleJumpUsed = false;
    this.nextAbilityTrailAt = 0;
    this.abilityPhaseUntil = 0;
    this.abilityTargetX = null;
    this.livesRemaining = 9;
    this.activeSpecial = "";
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
    this.lastToyTransform = "";
    this.lastBoxTransform = "";
    this.lastFishingTransforms = { handle: "", rod: "", line: "", lure: "" };
    this.lastMouseTransform = "";
    this.lastBubbleMachineTransform = "";
    this.lastTunnelTransform = "";
    this.lastLaserPoint = "";
    this.nextDebugUpdateAt = 0;
    this.nextToyDatasetAt = 0;
    this.nextToyPlatformScanAt = 0;
    this.selectProfile(this.profile.id, false);
  }

  selectProfile(id, announce = true) {
    const now = performance.now();
    this.profile = getCatProfile(id);
    this.brain = new CatBrain({ profile: this.profile });
    this.vx = 0;
    this.target = null;
    this.lastFrame = -1;
    this.lastCatTransform = "";
    this.lastCatClassName = "";
    this.renderState = "idle";
    this.specialCooldownUntil = 0;
    this.abilityFlashUntil = 0;
    this.doubleJumpUsed = false;
    this.abilityPhaseUntil = 0;
    this.abilityTargetX = null;
    this.livesRemaining = 9;
    this.activeSpecial = "";
    this.nextDecisionAt = now + 900;
    catElement.dataset.catId = this.profile.id;
    catElement.dataset.rarity = this.profile.rarity;
    catElement.dataset.ability = this.profile.movement.ability;
    catElement.dataset.personality = this.profile.personality;
    catElement.dataset.special = this.profile.special;
    catElement.dataset.specialActive = "none";
    catElement.dataset.speed = String(this.profile.movement.speed);
    catElement.dataset.jump = String(this.profile.movement.jump);
    const article = /^[aeiou]/i.test(this.profile.rarity) ? "an" : "a";
    catElement.setAttribute("aria-label", `${this.profile.name}, ${article} ${this.profile.rarity} autonomous widget cat`);
    catElement.style.setProperty("--rarity-color", rarityColor[this.profile.rarity]);
    catElement.style.setProperty("--profile-scale", String(this.profile.visualScale));
    catPortrait.style.setProperty("--cat-atlas-image", `var(--cat-atlas-${this.profile.atlasSet})`);
    catPortrait.style.setProperty("--atlas-x", `${this.profile.atlas[0] * 50}%`);
    catPortrait.style.setProperty("--atlas-y", `${this.profile.atlas[1] * 50}%`);
    catClone.style.setProperty("--cat-atlas-image", `var(--cat-atlas-${this.profile.atlasSet})`);
    catClone.style.setProperty("--atlas-x", `${this.profile.atlas[0] * 50}%`);
    catClone.style.setProperty("--atlas-y", `${this.profile.atlas[1] * 50}%`);
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
    const jumpReach = this.profile.movement.navigationJump;
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
      reachablePlatforms: this.world.reachableFrom(platform, centerX, jumpReach).length,
      canJump: this.grounded && this.world.reachableFrom(platform, centerX, jumpReach).length > 0
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
    const timeBubbleActive =
      this.profile.movement.ability === "time-bubble" &&
      this.activeSpecial === "time-bubble" &&
      now < this.abilityFlashUntil;
    const toyDt = timeBubbleActive ? dt * 0.28 : dt;
    if (this.toyType === "ball") this.updateToy(toyDt, now);
    else if (this.toyType === "laser") this.updateLaser();
    else if (this.toyType === "box") this.updateBox(dt);
    else if (this.toyType === "feather") this.updateFishingRod(toyDt, now);
    else if (this.toyType === "mouse") this.updateMouse(dt, now);
    else if (this.toyType === "bubbles") this.updateBubbles(dt, now);
    else if (this.toyType === "tunnel") this.updateTunnel(dt, now);
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

  handlePetReaction(reaction, now, headX, headY) {
    if (this.profile.movement.ability === "mood-spectrum") {
      this.brain.drives.anger = Math.max(0, this.brain.drives.anger - 0.16);
      this.activateSpecial("mood-spectrum", now, 720, "◆", "reaction--epic");
      createHeart(headX + 12, headY - 4, "♥", "reaction--rare");
    }
    if (this.profile.movement.ability === "sunbeam") {
      this.brain.drives.energy = Math.min(1, this.brain.drives.energy + 0.12);
      this.brain.drives.anger = Math.max(0, this.brain.drives.anger - 0.22);
      if (now >= this.specialCooldownUntil) {
        this.specialCooldownUntil = now + 4200;
        this.activateSpecial("sunbeam", now, 3200, "☀", "reaction--legendary");
      }
    }
    if (this.profile.movement.ability === "comfort-knead") {
      this.brain.drives.energy = Math.min(1, this.brain.drives.energy + 0.07);
      this.brain.drives.affection = Math.min(1, this.brain.drives.affection + 0.06);
      if (now >= this.specialCooldownUntil) {
        this.specialCooldownUntil = now + 3600;
        this.activateSpecial("comfort-knead", now, 1900, "♡", "reaction--rare");
      }
    }
    if (this.profile.movement.ability === "guardian-ward" && this.brain.drives.anger > 0.18) {
      this.brain.drives.anger = Math.max(0, this.brain.drives.anger - 0.32);
      this.brain.setAction(ACTIONS.PURR, now, 1900);
      this.nextDecisionAt = this.brain.actionUntil;
      this.activateSpecial("guardian-ward", now, 1700, "☥", "reaction--legendary");
    }
    if (this.profile.movement.ability === "heat-seeker") {
      this.brain.drives.energy = Math.min(1, this.brain.drives.energy + 0.08);
      this.activateSpecial("heat-seeker", now, 1900, "♨", "reaction--rare");
    }
    if (reaction === ACTIONS.PURR) createHeart(headX, headY - 10);
    else this.showAngryReaction(reaction === ACTIONS.CLAW ? "///" : "HSS!", now);
  }

  currentToyTarget() {
    if (this.toyType === "ball") return this.toy;
    if (["box", "laser", "feather", "mouse", "bubbles", "tunnel"].includes(this.toyType)) return this.toyTarget;
    return null;
  }

  activateSpecial(name, now, duration = 420, glyph = "", variant = "") {
    this.activeSpecial = name;
    this.abilityFlashUntil = Math.max(this.abilityFlashUntil, now + duration);
    if (glyph) createHeart(this.x + CAT_SIZE / 2, this.y + 8, glyph, variant);
  }

  updateBehavior(dt, now) {
    const action = this.brain.currentAction;
    const platform = this.world.get(this.platformId);
    const ability = this.profile.movement.ability;

    if (this.inTunnel) {
      if (now >= this.tunnelExitAt) this.exitTunnel(now);
      return;
    }
    if (action === ACTIONS.PLAY && this.toyType === "feather") this.strikeFishingLure(now);
    if (action === ACTIONS.PLAY && this.toyType === "bubbles") this.popNearestBubble(now);

    if (this.inBox && (this.toyType !== "box" || action !== ACTIONS.SLEEP)) this.inBox = false;
    if (ability === "comfort-knead" && this.activeSpecial === "comfort-knead" && now < this.abilityFlashUntil) {
      this.brain.drives.energy = Math.min(1, this.brain.drives.energy + 0.034 * dt);
      this.brain.drives.affection = Math.min(1, this.brain.drives.affection + 0.026 * dt);
    }
    if (
      ability === "comfort-knead" &&
      this.grounded &&
      now >= this.specialCooldownUntil &&
      [ACTIONS.SLEEP, ACTIONS.LOAF, ACTIONS.PURR].includes(action)
    ) {
      this.specialCooldownUntil = now + 5900;
      this.activateSpecial("comfort-knead", now, 2300, "♡", "reaction--rare");
    }
    if (ability === "heat-seeker" && this.activeSpecial === "heat-seeker" && now < this.abilityFlashUntil) {
      this.brain.drives.energy = Math.min(1, this.brain.drives.energy + 0.048 * dt);
      this.brain.drives.anger = Math.max(0, this.brain.drives.anger - 0.08 * dt);
    }
    if (
      ability === "heat-seeker" &&
      this.grounded &&
      now >= this.specialCooldownUntil &&
      [ACTIONS.SLEEP, ACTIONS.LOAF, ACTIONS.PURR].includes(action)
    ) {
      this.specialCooldownUntil = now + 5200;
      this.activateSpecial("heat-seeker", now, 3000, "♨", "reaction--rare");
    }
    if (
      ability === "guardian-ward" &&
      this.brain.drives.anger >= 0.3 &&
      now >= this.specialCooldownUntil
    ) {
      this.brain.drives.anger = Math.max(0, this.brain.drives.anger - 0.38);
      this.brain.drives.confidence = Math.min(1, this.brain.drives.confidence + 0.08);
      this.brain.setAction(ACTIONS.LOAF, now, 1900);
      this.setRenderState(ACTIONS.LOAF);
      this.nextDecisionAt = this.brain.actionUntil;
      this.vx = 0;
      this.specialCooldownUntil = now + 4600;
      this.activateSpecial("guardian-ward", now, 1900, "☥", "reaction--legendary");
      return;
    }
    if (
      ability === "immovable-loaf" &&
      this.grounded &&
      [ACTIONS.LOAF, ACTIONS.SLEEP].includes(action)
    ) {
      this.vx = 0;
      this.brain.drives.anger = Math.max(0, this.brain.drives.anger - 0.2 * dt);
      if (now >= this.specialCooldownUntil) {
        this.specialCooldownUntil = now + 6200;
        this.activateSpecial("immovable-loaf", now, 3600, "…", "reaction--common");
      }
      return;
    }
    if (
      ability === "royal-yowl" &&
      this.grounded &&
      now >= this.specialCooldownUntil &&
      (this.brain.drives.affection < 0.56 || now - this.pointer.movedAt > 7600) &&
      Math.random() < dt * 0.24
    ) {
      this.brain.setAction(ACTIONS.SEEK_AFFECTION, now, 2100);
      this.setRenderState(ACTIONS.INSPECT);
      this.nextDecisionAt = this.brain.actionUntil;
      this.vx = 0;
      this.specialCooldownUntil = now + 6900;
      this.activateSpecial("royal-yowl", now, 1800, "MRRROW", "reaction--common");
      return;
    }
    if (
      ability === "cursor-feint" &&
      this.grounded &&
      this.activeSpecial === "cursor-feint" &&
      now < this.abilityFlashUntil
    ) {
      const targetX = Number.isFinite(this.abilityTargetX) ? this.abilityTargetX : this.pointer.x;
      const direction = Math.sign(targetX - (this.x + CAT_SIZE / 2)) || this.facing;
      this.facing = now < this.abilityPhaseUntil ? -direction : direction;
      this.vx = this.facing * 168 * this.profile.movement.speed;
      return;
    }
    if (
      ability === "cursor-feint" &&
      this.grounded &&
      now >= this.specialCooldownUntil &&
      [ACTIONS.PLAY, ACTIONS.INSPECT].includes(action)
    ) {
      const feintTarget = action === ACTIONS.PLAY ? this.currentToyTarget() : this.pointer;
      const sameTier = !feintTarget?.platformId || feintTarget.platformId === this.platformId;
      if (sameTier && Number.isFinite(feintTarget?.x) && Math.abs(feintTarget.x - (this.x + CAT_SIZE / 2)) > 68) {
        this.abilityTargetX = feintTarget.x;
        this.abilityPhaseUntil = now + 190;
        this.specialCooldownUntil = now + 3200;
        this.activateSpecial("cursor-feint", now, 620, "?↔", "reaction--epic");
        this.facing = -Math.sign(feintTarget.x - (this.x + CAT_SIZE / 2)) || this.facing;
        this.vx = this.facing * 168 * this.profile.movement.speed;
        return;
      }
    }
    if (
      ability === "speed-lap" &&
      this.grounded &&
      platform &&
      this.activeSpecial === "speed-lap" &&
      now < this.abilityFlashUntil
    ) {
      const leftGap = this.x - platform.left;
      const rightGap = platform.right - (this.x + CAT_SIZE);
      if ((this.facing < 0 && leftGap < 12) || (this.facing > 0 && rightGap < 12)) this.facing *= -1;
      this.vx = this.facing * 248 * this.profile.movement.speed;
      if (now >= this.nextAbilityTrailAt) {
        createHeart(this.x + CAT_SIZE * (this.facing > 0 ? 0.15 : 0.85), this.y + CAT_SIZE * 0.62, "ϟ", "reaction--legendary");
        this.nextAbilityTrailAt = now + 150;
      }
      return;
    }
    if (
      ability === "speed-lap" &&
      this.grounded &&
      platform &&
      platform.width > 190 &&
      now >= this.specialCooldownUntil &&
      [ACTIONS.ROAM, ACTIONS.PLAY, ACTIONS.MISCHIEF].includes(action) &&
      Math.random() < dt * 0.32
    ) {
      const target = action === ACTIONS.PLAY ? this.currentToyTarget() : null;
      if (!target?.platformId || target.platformId === this.platformId) {
        if (Number.isFinite(target?.x)) this.facing = Math.sign(target.x - (this.x + CAT_SIZE / 2)) || this.facing;
        this.specialCooldownUntil = now + 5300;
        this.nextAbilityTrailAt = now;
        this.activateSpecial("speed-lap", now, 2100, "⚡", "reaction--legendary");
        return;
      }
    }
    if (
      ability === "prestidigitation" &&
      this.grounded &&
      now >= this.specialCooldownUntil &&
      action === ACTIONS.PLAY &&
      ["ball", "box"].includes(this.toyType) &&
      Math.random() < dt * 0.28
    ) {
      this.conjureToy(now);
    }
    if (ability === "sunbeam" && this.activeSpecial === "sunbeam" && now < this.abilityFlashUntil) {
      this.brain.drives.energy = Math.min(1, this.brain.drives.energy + 0.042 * dt);
      this.brain.drives.anger = Math.max(0, this.brain.drives.anger - 0.16 * dt);
    }
    if (
      ability === "sunbeam" &&
      this.grounded &&
      now >= this.specialCooldownUntil &&
      [ACTIONS.SLEEP, ACTIONS.LOAF, ACTIONS.PURR].includes(action)
    ) {
      this.specialCooldownUntil = now + 5600;
      this.activateSpecial("sunbeam", now, 3400, "☀", "reaction--legendary");
    }
    if (
      ability === "zero-gravity" &&
      this.activeSpecial === "zero-gravity" &&
      now < this.abilityFlashUntil
    ) {
      this.orbitToy(now);
      return;
    }
    if (
      ability === "zero-gravity" &&
      this.grounded &&
      now >= this.specialCooldownUntil &&
      action === ACTIONS.PLAY &&
      ["laser", "feather"].includes(this.toyType) &&
      this.currentToyTarget()
    ) {
      this.beginZeroGravity(now);
      this.orbitToy(now);
      return;
    }
    if (ability === "rhythm-burst" && this.grounded && [ACTIONS.ROAM, ACTIONS.PLAY, ACTIONS.MISCHIEF].includes(action)) {
      const rhythmTarget = action === ACTIONS.PLAY ? this.currentToyTarget() : null;
      const needsTierChange = rhythmTarget?.platformId && rhythmTarget.platformId !== this.platformId;
      if (!needsTierChange) {
        if (this.activeSpecial === "rhythm-burst" && now < this.abilityFlashUntil) {
          this.vx = this.facing * 184 * this.profile.movement.speed;
          return;
        }
        if (now >= this.specialCooldownUntil) {
          this.rhythmBurst(now, rhythmTarget);
          return;
        }
        this.vx *= Math.pow(0.78, dt * 60);
        return;
      }
    }
    if (
      ability === "teleport" &&
      this.grounded &&
      now >= this.specialCooldownUntil &&
      [ACTIONS.PLAY, ACTIONS.MISCHIEF].includes(action) &&
      Math.random() < dt * 0.6
    ) {
      this.glitchStep(now);
    }
    if (
      ability === "shadow-phase" &&
      this.grounded &&
      now >= this.specialCooldownUntil &&
      [ACTIONS.ROAM, ACTIONS.PLAY, ACTIONS.INSPECT, ACTIONS.MISCHIEF].includes(action) &&
      Math.random() < dt * 0.48
    ) {
      this.shadowStep(now);
    }
    if (
      ability === "star-dash" &&
      this.grounded &&
      now < this.abilityFlashUntil &&
      this.activeSpecial === "star-dash"
    ) {
      this.vx = this.facing * 282 * this.profile.movement.speed;
      if (now >= this.nextAbilityTrailAt) {
        createHeart(this.x + CAT_SIZE * (this.facing > 0 ? 0.18 : 0.82), this.y + CAT_SIZE * 0.62, "✦", "reaction--legendary");
        this.nextAbilityTrailAt = now + 110;
      }
      return;
    }
    if (
      ability === "star-dash" &&
      this.grounded &&
      now >= this.specialCooldownUntil &&
      [ACTIONS.ROAM, ACTIONS.PLAY, ACTIONS.MISCHIEF].includes(action) &&
      Math.random() < dt * 0.34
    ) {
      this.starDash(now);
      return;
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
          const jumpReach = this.profile.movement.navigationJump;
          const nextHop = this.world.nextHopToward(currentPlatform, targetPlatform, jumpReach);
          if (nextHop && currentPlatform) {
            const center = this.x + CAT_SIZE / 2;
            const reachable = this.world.reachableFrom(currentPlatform, center, jumpReach);
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
          const isAirToy = this.toyType === "laser" || this.toyType === "feather" || this.toyType === "bubbles";
          if (action === ACTIONS.PLAY && now >= this.nextJumpAt && Math.abs(target.y - (this.y + CAT_SIZE - CAT_FOOT_OFFSET)) > 42 && Math.random() < dt * (isAirToy ? 2.4 : 1.2)) {
            this.jumpForward(0.54, now);
          }
          if (action === ACTIONS.PLAY && this.toyType === "ball" && this.toy && now - this.toy.spawnedAt > 900 && this.toy.platformId === this.platformId && Math.hypot(delta, target.y - this.y) < 88) {
            this.batToy(now);
          }
          if (action === ACTIONS.PLAY && this.toyType === "box" && target.platformId === this.platformId && Math.hypot(delta, target.y - this.y) < 88) {
            this.enterBox(now);
          }
          if (action === ACTIONS.PLAY && this.toyType === "mouse" && this.mouse && this.mouse.platformId === this.platformId && Math.hypot(delta, target.y - this.y) < 82) {
            this.pounceMouse(now);
          }
          if (action === ACTIONS.PLAY && this.toyType === "tunnel" && this.tunnel && target.platformId === this.platformId && Math.hypot(delta, target.y - this.y) < 94) {
            this.enterTunnel(now);
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

  shadowStep(now = performance.now()) {
    const platform = this.world.get(this.platformId);
    if (!platform) return;
    const oldX = this.x;
    const target = this.currentToyTarget() || this.target || this.pointer;
    const targetDirection = target?.x ? Math.sign(target.x - (this.x + CAT_SIZE / 2)) : 0;
    const direction = targetDirection || this.facing;
    const distance = 74 + Math.random() * 72;
    this.x = Math.min(platform.right - CAT_SIZE, Math.max(platform.left, this.x + direction * distance));
    this.facing = Math.sign(this.x - oldX) || this.facing;
    this.specialCooldownUntil = now + 2300 + Math.random() * 1300;
    this.activateSpecial("shadow-phase", now, 560, "◐", "reaction--epic");
  }

  starDash(now = performance.now()) {
    const target = this.currentToyTarget() || this.target;
    if (target?.x) this.facing = Math.sign(target.x - (this.x + CAT_SIZE / 2)) || this.facing;
    this.vx = this.facing * 282 * this.profile.movement.speed;
    this.specialCooldownUntil = now + 3600 + Math.random() * 1700;
    this.nextAbilityTrailAt = now;
    this.activateSpecial("star-dash", now, 640, "★", "reaction--legendary");
  }

  rhythmBurst(now = performance.now(), target = null) {
    if (target?.x) this.facing = Math.sign(target.x - (this.x + CAT_SIZE / 2)) || this.facing;
    this.vx = this.facing * 184 * this.profile.movement.speed;
    this.specialCooldownUntil = now + 920;
    this.activateSpecial("rhythm-burst", now, 320, "♪", "reaction--epic");
  }

  beginZeroGravity(now = performance.now()) {
    this.grounded = false;
    this.platformId = null;
    this.departingPlatformId = null;
    this.vx = 0;
    this.vy = 0;
    this.specialCooldownUntil = now + 6900;
    this.nextAbilityTrailAt = now;
    this.activateSpecial("zero-gravity", now, 2400, "◎", "reaction--legendary");
  }

  orbitToy(now = performance.now()) {
    const target = this.currentToyTarget();
    if (!target) return;
    const angle = now / 390;
    const desiredX = Math.min(
      window.innerWidth - CAT_SIZE,
      Math.max(0, target.x - CAT_SIZE / 2 + Math.cos(angle) * 82)
    );
    const desiredY = Math.min(
      window.innerHeight - CAT_SIZE - 42,
      Math.max(4, target.y - CAT_SIZE / 2 + Math.sin(angle * 1.16) * 54)
    );
    this.vx = Math.min(260, Math.max(-260, (desiredX - this.x) * 3.4));
    this.vy = Math.min(220, Math.max(-220, (desiredY - this.y) * 3.4));
    this.facing = Math.sign(this.vx) || this.facing;
    if (now >= this.nextAbilityTrailAt) {
      createHeart(this.x + CAT_SIZE / 2, this.y + CAT_SIZE / 2, "·", "reaction--legendary");
      this.nextAbilityTrailAt = now + 210;
    }
  }

  groundPound(now, surfaceTop, impactVelocity) {
    this.activateSpecial("ground-pound", now, 620, "⬇", "reaction--legendary");
    const centerX = this.x + CAT_SIZE / 2;
    if (!this.toy) return;
    const nearLanding = Math.abs(this.toy.x - centerX) < 280 && Math.abs(this.toy.y - surfaceTop) < 150;
    if (!nearLanding) return;
    const direction = Math.sign(this.toy.x - centerX) || this.facing;
    this.toy.vx = direction * Math.min(520, 240 + impactVelocity * 0.3);
    this.toy.vy = -Math.min(460, 210 + impactVelocity * 0.42);
    this.toy.grounded = false;
    this.toy.platformId = null;
    this.toy.lastKickedAt = now;
    this.toy.hitCount += 1;
  }

  conjureToy(now = performance.now()) {
    const current = this.world.get(this.platformId) || this.world.get("floor");
    if (!current) return;
    const center = this.x + CAT_SIZE / 2;
    const reachable = this.world
      .reachableFrom(current, center, this.profile.movement.navigationJump)
      .filter((candidate) => candidate.width > 120);
    const destinations = reachable.filter((candidate) => candidate.id !== this.platformId);
    const destination = destinations[Math.floor(Math.random() * destinations.length)] || current;
    const safeLeft = destination.left + 34;
    const safeRight = destination.right - 34;
    const x = Math.min(safeRight, Math.max(safeLeft, destination.left + destination.width * (0.3 + Math.random() * 0.4)));

    if (this.toyType === "ball" && this.toy) {
      createHeart(this.toy.x, this.toy.y - 8, "✦", "reaction--legendary");
      this.toy.x = x;
      this.toy.y = destination.top - this.toy.radius - 30;
      this.toy.vx = (Math.random() - 0.5) * 54;
      this.toy.vy = 24;
      this.toy.grounded = false;
      this.toy.platformId = null;
      this.toy.lastKickedAt = now;
      this.lastToyTransform = "";
      this.renderToy();
    } else if (this.toyType === "box" && this.box) {
      createHeart(this.box.x + this.box.width / 2, this.box.y - 8, "✦", "reaction--legendary");
      this.inBox = false;
      this.box.x = Math.min(destination.right - this.box.width - 10, Math.max(destination.left + 10, x - this.box.width / 2));
      this.box.y = destination.top - this.box.height - 24;
      this.box.vx = 0;
      this.box.vy = 20;
      this.box.grounded = false;
      this.box.platformId = null;
      this.lastBoxTransform = "";
      this.renderBox();
    }
    this.specialCooldownUntil = now + 6200;
    this.activateSpecial("prestidigitation", now, 1700, "✦?", "reaction--legendary");
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
    const reachable = this.world.reachableFrom(current, center, this.profile.movement.navigationJump);
    if (!reachable.length) { this.jumpForward(0.52); return; }
    const ability = this.profile.movement.ability;
    const ranked = reachable.map((platform) => {
      const distance = Math.abs((platform.left + platform.right) / 2 - center);
      const visits = this.brain.memory.platformVisits[platform.id] || 0;
      const navigatorBonus = ability === "navigator" ? 320 / (visits + 1) + distance * 0.22 : 0;
      const warmthBonus = ability === "heat-seeker" && platform.id === "editor" ? 360 : 0;
      return {
        platform,
        score: (current.top - platform.top) * 0.7 - distance * 0.2 + navigatorBonus + warmthBonus + Math.random() * 90
      };
    }).sort((a, b) => b.score - a.score);
    if (ability === "navigator") this.activateSpecial("navigator", performance.now(), 1100, "⌖", "reaction--rare");
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
    this.doubleJumpUsed = false;
    this.platformId = null;
    this.departingPlatformId = dropping ? departureId : null;
    this.target = { x: targetX, y: target.top, platformId: target.id, kind: "platform" };
    this.nextJumpAt = now + 1350;
    if (this.profile.movement.ability === "grapple-glide" && now >= this.specialCooldownUntil) {
      this.specialCooldownUntil = now + 1800;
      this.activateSpecial("grapple-glide", now, 1100, "↗", "reaction--epic");
    }
  }

  jumpForward(power = 0.55, now = performance.now()) {
    const jumpScale = this.profile.movement.jump;
    this.vy = (-440 * power - 170) * jumpScale;
    this.vx = this.facing * (110 + power * 95) * this.profile.movement.speed;
    this.grounded = false;
    this.doubleJumpUsed = false;
    this.platformId = null;
    this.departingPlatformId = null;
    this.nextJumpAt = now + 1200;
  }

  updatePhysics(dt, now) {
    if (this.inTunnel) return;
    const previousBottom = this.y + CAT_SIZE - CAT_FOOT_OFFSET;
    const ability = this.profile.movement.ability;
    const zeroGravityActive =
      ability === "zero-gravity" &&
      this.activeSpecial === "zero-gravity" &&
      now < this.abilityFlashUntil;
    if (zeroGravityActive) {
      this.x = Math.min(window.innerWidth - CAT_SIZE, Math.max(0, this.x + this.vx * dt));
      this.y = Math.min(window.innerHeight - CAT_SIZE - 38, Math.max(0, this.y + this.vy * dt));
      this.grounded = false;
      this.platformId = null;
      return;
    }
    if (
      !this.grounded &&
      ability === "double-jump" &&
      !this.doubleJumpUsed &&
      this.vy > 42 &&
      this.target?.kind !== "platform" &&
      [ACTIONS.JUMP, ACTIONS.PLAY, ACTIONS.MISCHIEF].includes(this.brain.currentAction)
    ) {
      this.vy = -250 * this.profile.movement.jump;
      this.doubleJumpUsed = true;
      this.activateSpecial("double-jump", now, 430, "Ⅱ", "reaction--rare");
    }
    if (
      !this.grounded &&
      ability === "grapple-glide" &&
      this.target?.kind === "platform" &&
      Number.isFinite(this.target.x)
    ) {
      const horizontalError = this.target.x - (this.x + CAT_SIZE / 2);
      this.vx += Math.max(-155, Math.min(155, horizontalError * 2.2)) * dt;
      this.vx = Math.max(-430, Math.min(430, this.vx));
    }
    if (!this.grounded) {
      const gravityScale = ability === "feather-fall" && this.vy > 0
        ? 0.34
        : ability === "ground-pound" && this.vy > 0
          ? 1.48
          : 1;
      this.vy += GRAVITY * gravityScale * dt;
      if (gravityScale < 1) {
        this.activeSpecial = "feather-fall";
        this.abilityFlashUntil = now + 160;
      }
    }
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
        const impactVelocity = this.vy;
        this.y = landing.top - CAT_SIZE + CAT_FOOT_OFFSET;
        this.vy = 0;
        this.vx *= 0.62;
        this.grounded = true;
        this.doubleJumpUsed = false;
        this.platformId = landing.id;
        this.departingPlatformId = null;
        this.brain.rememberLanding(landing.id);
        this.landingFlashUntil = now + 280;
        this.nextJumpAt = Math.max(this.nextJumpAt, now + 850);
        this.target = null;
        if (ability === "ground-pound" && impactVelocity > 235) {
          this.groundPound(now, landing.top, impactVelocity);
        }
      }
    }

    if (this.x < -8) { this.x = -8; this.facing = 1; this.vx = Math.abs(this.vx); }
    if (this.x + CAT_SIZE > window.innerWidth + 8) { this.x = window.innerWidth - CAT_SIZE + 8; this.facing = -1; this.vx = -Math.abs(this.vx); }
    if (this.y > window.innerHeight + 40) {
      const floor = this.world.get("floor");
      this.x = Math.max(20, Math.min(window.innerWidth - CAT_SIZE - 20, this.x));
      this.y = (floor?.top ?? window.innerHeight - 38) - CAT_SIZE + CAT_FOOT_OFFSET;
      if (ability === "nine-lives") {
        this.livesRemaining = this.livesRemaining <= 1 ? 9 : this.livesRemaining - 1;
        this.vx = Math.max(-180, Math.min(180, this.vx * 0.48));
        this.vy = 0;
        this.specialCooldownUntil = now + 1400;
        this.activateSpecial("nine-lives", now, 1200, `♥×${this.livesRemaining}`, "reaction--rare");
      } else {
        this.vx = this.vy = 0;
      }
      this.grounded = true;
      this.doubleJumpUsed = false;
      this.platformId = "floor";
      this.departingPlatformId = null;
    }
  }

  updateLaser() {
    if (!this.pointer.visible) return;
    const point = `${this.pointer.x.toFixed(1)},${this.pointer.y.toFixed(1)}`;
    if (point === this.lastLaserPoint) return;
    this.lastLaserPoint = point;
    const transform = `translate3d(${this.pointer.x.toFixed(1)}px, ${this.pointer.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    if (laserToyElement.style.transform !== transform) laserToyElement.style.transform = transform;
    const surface = this.world.platformForTarget(this.pointer.x, this.pointer.y);
    if (!this.toyTarget) this.toyTarget = { x: this.pointer.x, y: this.pointer.y, platformId: null, kind: "laser" };
    else {
      this.toyTarget.x = this.pointer.x;
      this.toyTarget.y = this.pointer.y;
    }
    this.toyTarget.platformId = surface?.id || null;
    laserToyElement.dataset.platform = this.toyTarget.platformId || "airborne";
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
    if (!this.toyTarget) this.toyTarget = { x: 0, y: 0, platformId: null, kind: "feather" };
    this.toyTarget.x = this.fishingRig.lureX;
    this.toyTarget.y = this.fishingRig.lureY;
    if (now >= this.nextToyPlatformScanAt) {
      const surface = this.world.platformForTarget(this.fishingRig.lureX, this.fishingRig.lureY, 170)
        || this.world.platformForTarget(this.fishingRig.handleX, this.fishingRig.handleY);
      this.toyTarget.platformId = surface?.id || null;
      const platform = this.toyTarget.platformId || "airborne";
      if (featherToyElement.dataset.platform !== platform) featherToyElement.dataset.platform = platform;
      this.nextToyPlatformScanAt = now + 70;
    }
    this.renderFishingRod(now);
  }

  renderFishingRod(now = performance.now()) {
    const rig = this.fishingRig;
    if (!rig) return;
    const rod = segmentGeometry(rig.handleX, rig.handleY, rig.tipX, rig.tipY);
    const line = segmentGeometry(rig.tipX, rig.tipY, rig.lureX, rig.lureY);
    const lureAngle = Math.atan2(rig.lureVy, rig.lureVx || 0.001) * 180 / Math.PI;

    const handleTransform = `translate3d(${(rig.handleX - 8).toFixed(1)}px, ${(rig.handleY - 8).toFixed(1)}px, 0)`;
    const rodTransform = `translate3d(${rod.x.toFixed(1)}px, ${(rod.y - 2.5).toFixed(1)}px, 0) rotate(${rod.angle.toFixed(2)}deg) scaleX(${rod.length.toFixed(1)})`;
    const lineTransform = `translate3d(${line.x.toFixed(1)}px, ${line.y.toFixed(1)}px, 0) rotate(${line.angle.toFixed(2)}deg) scaleX(${line.length.toFixed(1)})`;
    const lureTransform = `translate3d(${(rig.lureX - 17).toFixed(1)}px, ${(rig.lureY - 14).toFixed(1)}px, 0) rotate(${lureAngle.toFixed(1)}deg)`;
    if (handleTransform !== this.lastFishingTransforms.handle) fishingHandleElement.style.transform = handleTransform;
    if (rodTransform !== this.lastFishingTransforms.rod) fishingRodElement.style.transform = rodTransform;
    if (lineTransform !== this.lastFishingTransforms.line) fishingLineElement.style.transform = lineTransform;
    if (lureTransform !== this.lastFishingTransforms.lure) featherLureElement.style.transform = lureTransform;
    this.lastFishingTransforms.handle = handleTransform;
    this.lastFishingTransforms.rod = rodTransform;
    this.lastFishingTransforms.line = lineTransform;
    this.lastFishingTransforms.lure = lureTransform;
    if (now >= this.nextToyDatasetAt) {
      featherToyElement.dataset.lureX = rig.lureX.toFixed(1);
      featherToyElement.dataset.lureY = rig.lureY.toFixed(1);
      featherToyElement.dataset.lineLength = line.length.toFixed(1);
      featherToyElement.dataset.direction = rig.direction > 0 ? "right" : "left";
      featherToyElement.dataset.reeling = String(rig.reeling);
      featherToyElement.dataset.hits = String(rig.hitCount);
      this.nextToyDatasetAt = now + 120;
    }
  }

  strikeFishingLure(now = performance.now()) {
    if (!this.fishingRig) return;
    const pawX = this.x + CAT_SIZE * (this.facing > 0 ? 0.72 : 0.28);
    const pawY = this.y + CAT_SIZE * 0.58;
    if (Math.hypot(this.fishingRig.lureX - pawX, this.fishingRig.lureY - pawY) > 62) return;
    const direction = Math.sign(this.fishingRig.lureX - (this.x + CAT_SIZE / 2)) || this.facing;
    if (!strikeFishingLure(this.fishingRig, direction, this.profile.movement.toyForce, now)) return;
    this.facing = direction;
    this.brain.drives.playfulness = Math.max(0, this.brain.drives.playfulness - 0.045);
    this.brain.setAction(ACTIONS.PLAY, now, 3200);
    this.nextDecisionAt = this.brain.actionUntil;
    createHeart(this.fishingRig.lureX, this.fishingRig.lureY - 8, "SNAP!", "reaction--rare");
  }

  updateMouse(dt, now) {
    if (!this.mouse) return;
    if (this.drag?.kind === "mouse") {
      this.renderMouse();
      return;
    }

    const mouse = this.mouse;
    const support = mouse.grounded ? this.world.get(mouse.platformId) : null;
    const previousBottom = advanceMouse(mouse, dt, window.innerWidth, now, support);
    if (mouse.grounded) {
      if (!isMouseOnSurface(mouse, support)) {
        mouse.grounded = false;
        mouse.platformId = null;
      }
    } else if (mouse.vy >= 0) {
      const landing = this.world.landingCandidate(
        previousBottom,
        mouse.y + mouse.height,
        mouse.x + 5,
        mouse.x + mouse.width - 5,
        5
      );
      if (landing) settleMouse(mouse, landing.top, landing.id);
    }

    if (mouse.y > window.innerHeight + 40) {
      const floor = this.world.get("floor");
      mouse.x = Math.min(window.innerWidth - mouse.width - 12, Math.max(12, mouse.x));
      settleMouse(mouse, floor?.top ?? window.innerHeight - 38, "floor");
    }

    if (!this.toyTarget) this.toyTarget = { x: 0, y: 0, platformId: null, kind: "mouse" };
    this.toyTarget.x = mouse.x + mouse.width / 2;
    this.toyTarget.y = mouse.y + mouse.height;
    this.toyTarget.platformId = mouse.platformId;
    this.renderMouse();
  }

  renderMouse() {
    if (!this.mouse) return;
    const mouse = this.mouse;
    const transform = `translate3d(${mouse.x.toFixed(1)}px, ${mouse.y.toFixed(1)}px, 0) scaleX(${mouse.direction})`;
    if (transform !== this.lastMouseTransform) {
      mouseToyElement.style.transform = transform;
      this.lastMouseTransform = transform;
    }
    mouseToyElement.classList.toggle("mouse-toy--held", this.drag?.kind === "mouse");
    mouseToyElement.dataset.direction = mouse.direction > 0 ? "right" : "left";
    mouseToyElement.dataset.scurry = String(mouse.grounded && Math.abs(mouse.vx) > 55);
    mouseToyElement.dataset.platform = mouse.platformId || "airborne";
    mouseToyElement.dataset.pounces = String(mouse.pounceCount);
  }

  pounceMouse(now = performance.now()) {
    if (!this.mouse) return;
    const catCenter = this.x + CAT_SIZE / 2;
    const mouseCenter = this.mouse.x + this.mouse.width / 2;
    const escapeDirection = Math.sign(mouseCenter - catCenter) || -this.facing;
    if (!pounceMouse(this.mouse, escapeDirection, this.profile.movement.toyForce, now)) return;
    this.facing = escapeDirection;
    this.brain.drives.playfulness = Math.max(0, this.brain.drives.playfulness - 0.035);
    this.brain.setAction(ACTIONS.PLAY, now, 3400);
    this.nextDecisionAt = this.brain.actionUntil;
    createHeart(mouseCenter, this.mouse.y - 6, "SQUEAK!", "reaction--common");
  }

  updateBubbles(dt, now) {
    if (!this.bubbleMachine) return;
    const machine = this.bubbleMachine;
    if (this.drag?.kind !== "bubble-machine") {
      const previousBottom = advanceBox(machine, dt, window.innerWidth);
      if (machine.grounded) {
        const support = this.world.get(machine.platformId);
        if (!isBoxOnSurface(machine, support)) {
          machine.grounded = false;
          machine.platformId = null;
        }
      } else if (machine.vy >= 0) {
        const landing = this.world.landingCandidate(
          previousBottom,
          machine.y + machine.height,
          machine.x + 5,
          machine.x + machine.width - 5,
          5
        );
        if (landing) settleBox(machine, landing.top, landing.id);
      }
    }

    if (machine.y > window.innerHeight + 40) {
      const floor = this.world.get("floor");
      machine.x = Math.min(window.innerWidth - machine.width - 12, Math.max(12, machine.x));
      settleBox(machine, floor?.top ?? window.innerHeight - 38, "floor");
    }

    if (now >= this.nextBubbleAt) {
      this.spawnBubble(machine.x + machine.width / 2, machine.y - 8, now);
      this.nextBubbleAt = now + (habitat.classList.contains("performance-lite") ? 1250 : 880);
    }

    this.bubbles = this.bubbles.filter((bubble) => advanceBubble(bubble, dt, window.innerWidth, window.innerHeight, now));
    const catCenterX = this.x + CAT_SIZE / 2;
    const catCenterY = this.y + CAT_SIZE / 2;
    const targetBubble = [...this.bubbles].sort((a, b) =>
      Math.hypot(a.x - catCenterX, a.y - catCenterY) - Math.hypot(b.x - catCenterX, b.y - catCenterY)
    )[0];
    if (targetBubble) {
      const surface = this.world.platformForTarget(targetBubble.x, targetBubble.y, 180);
      this.toyTarget = { x: targetBubble.x, y: targetBubble.y, platformId: surface?.id || null, kind: "bubbles", bubble: targetBubble };
    } else {
      this.toyTarget = { x: machine.x + machine.width / 2, y: machine.y, platformId: machine.platformId, kind: "bubbles" };
    }
    this.renderBubbles();
  }

  spawnBubble(x, y, now = performance.now(), excite = false) {
    if (this.toyType !== "bubbles" || !this.bubbleMachine) return;
    if (this.bubbles.length >= bubbleElements.length) this.bubbles.shift();
    this.bubbleSeed += 1;
    this.bubbles.push(createBubble({ x, y, now, seed: this.bubbleSeed }));
    this.nextBubbleAt = Math.max(this.nextBubbleAt, now + 260);
    if (excite) {
      this.brain.noticeToy(now);
      this.brain.setAction(ACTIONS.PLAY, now, 3600);
      this.beginAction(ACTIONS.PLAY, now);
      this.nextDecisionAt = this.brain.actionUntil;
    }
  }

  renderBubbles() {
    if (!this.bubbleMachine) return;
    const machineTransform = `translate3d(${this.bubbleMachine.x.toFixed(1)}px, ${this.bubbleMachine.y.toFixed(1)}px, 0)`;
    if (machineTransform !== this.lastBubbleMachineTransform) {
      bubbleMachineElement.style.transform = machineTransform;
      this.lastBubbleMachineTransform = machineTransform;
    }
    bubbleMachineElement.classList.toggle("bubble-machine--held", this.drag?.kind === "bubble-machine");
    bubbleMachineElement.dataset.platform = this.bubbleMachine.platformId || "airborne";
    bubbleElements.forEach((element, index) => {
      const bubble = this.bubbles[index];
      element.classList.toggle("is-visible", Boolean(bubble));
      if (!bubble) return;
      element.style.width = `${bubble.radius * 2}px`;
      element.style.height = `${bubble.radius * 2}px`;
      element.style.transform = `translate3d(${(bubble.x - bubble.radius).toFixed(1)}px, ${(bubble.y - bubble.radius).toFixed(1)}px, 0)`;
    });
    bubbleToyElement.dataset.count = String(this.bubbles.length);
    bubbleToyElement.dataset.pops = String(this.bubblePopCount);
  }

  popNearestBubble(now = performance.now()) {
    if (!this.bubbles.length) return;
    const pawX = this.x + CAT_SIZE * (this.facing > 0 ? 0.72 : 0.28);
    const pawY = this.y + CAT_SIZE * 0.56;
    let bestIndex = -1;
    let bestDistance = Infinity;
    this.bubbles.forEach((bubble, index) => {
      const distance = Math.hypot(bubble.x - pawX, bubble.y - pawY);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    if (bestIndex < 0 || bestDistance > 56 + this.bubbles[bestIndex].radius) return;
    const [bubble] = this.bubbles.splice(bestIndex, 1);
    bubble.popped = true;
    this.bubblePopCount += 1;
    this.brain.drives.playfulness = Math.max(0, this.brain.drives.playfulness - 0.028);
    this.brain.setAction(ACTIONS.PLAY, now, 3000);
    this.nextDecisionAt = this.brain.actionUntil;
    createHeart(bubble.x, bubble.y, "POP!", "reaction--rare");
    this.renderBubbles();
  }

  updateTunnel(dt) {
    if (!this.tunnel) return;
    if (this.drag?.kind !== "tunnel") {
      const previousBottom = advanceBox(this.tunnel, dt, window.innerWidth);
      if (this.tunnel.grounded) {
        const support = this.world.get(this.tunnel.platformId);
        if (!isBoxOnSurface(this.tunnel, support)) {
          this.tunnel.grounded = false;
          this.tunnel.platformId = null;
        }
      } else if (this.tunnel.vy >= 0) {
        const landing = this.world.landingCandidate(
          previousBottom,
          this.tunnel.y + this.tunnel.height,
          this.tunnel.x + 7,
          this.tunnel.x + this.tunnel.width - 7,
          5
        );
        if (landing) settleBox(this.tunnel, landing.top, landing.id);
      }
    }
    if (this.tunnel.y > window.innerHeight + 40) {
      const floor = this.world.get("floor");
      this.tunnel.x = Math.min(window.innerWidth - this.tunnel.width - 12, Math.max(12, this.tunnel.x));
      settleBox(this.tunnel, floor?.top ?? window.innerHeight - 38, "floor");
    }
    this.toyTarget = {
      x: this.tunnel.x + this.tunnel.width / 2,
      y: this.tunnel.y + this.tunnel.height,
      platformId: this.tunnel.platformId,
      kind: "tunnel"
    };
    this.renderTunnel();
  }

  renderTunnel() {
    if (!this.tunnel) return;
    const transform = `translate3d(${this.tunnel.x.toFixed(1)}px, ${this.tunnel.y.toFixed(1)}px, 0)`;
    if (transform !== this.lastTunnelTransform) {
      tunnelToyElement.style.transform = transform;
      this.lastTunnelTransform = transform;
    }
    tunnelToyElement.classList.toggle("tunnel-toy--held", this.drag?.kind === "tunnel");
    tunnelToyElement.dataset.platform = this.tunnel.platformId || "airborne";
    tunnelToyElement.dataset.uses = String(this.tunnelUses);
  }

  enterTunnel(now = performance.now()) {
    if (!this.tunnel?.grounded || this.inTunnel || now < this.tunnelCooldownUntil) return;
    const catCenter = this.x + CAT_SIZE / 2;
    const tunnelCenter = this.tunnel.x + this.tunnel.width / 2;
    this.inTunnelDirection = catCenter <= tunnelCenter ? 1 : -1;
    this.inTunnel = true;
    this.tunnelExitAt = now + 520;
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;
    this.platformId = this.tunnel.platformId;
    createHeart(catCenter, this.y + 8, "ZIP!", "reaction--epic");
  }

  exitTunnel(now = performance.now()) {
    if (!this.tunnel) {
      this.inTunnel = false;
      return;
    }
    const platform = this.world.get(this.tunnel.platformId) || this.world.get("floor");
    const exitX = this.inTunnelDirection > 0
      ? this.tunnel.x + this.tunnel.width - 24
      : this.tunnel.x - CAT_SIZE + 24;
    this.x = Math.min(platform.right - CAT_SIZE, Math.max(platform.left, exitX));
    this.y = platform.top - CAT_SIZE + CAT_FOOT_OFFSET;
    this.facing = this.inTunnelDirection;
    this.vx = this.facing * 188 * this.profile.movement.speed;
    this.vy = -72 * this.profile.movement.jump;
    this.grounded = false;
    this.platformId = null;
    this.departingPlatformId = null;
    this.inTunnel = false;
    this.tunnelUses += 1;
    this.tunnelCooldownUntil = now + 1600;
    this.brain.drives.playfulness = Math.max(0, this.brain.drives.playfulness - 0.04);
    this.brain.setAction(ACTIONS.PLAY, now, 3000);
    this.nextDecisionAt = this.brain.actionUntil;
    createHeart(this.x + CAT_SIZE / 2, this.y + 8, "ZOOM!", "reaction--epic");
  }

  updateToy(dt, now) {
    if (!this.toy) return;
    if (this.drag?.kind === "toy") {
      this.renderToy();
      return;
    }
    const toy = this.toy;
    if (this.profile.movement.ability === "magnet-paws" && this.brain.currentAction === ACTIONS.PLAY) {
      const pawX = this.x + CAT_SIZE * (this.facing > 0 ? 0.72 : 0.28);
      const pawY = this.y + CAT_SIZE * 0.72;
      const dx = pawX - toy.x;
      const dy = pawY - toy.y;
      const distance = Math.hypot(dx, dy);
      const sameSurface = toy.platformId && toy.platformId === this.platformId;
      if (distance > 44 && distance < 280 && (sameSurface || !toy.grounded)) {
        const pull = (1 - distance / 320) * 720;
        toy.vx += dx / distance * pull * dt;
        if (!toy.grounded) toy.vy += dy / distance * pull * 0.62 * dt;
        this.activeSpecial = "magnet-paws";
        this.abilityFlashUntil = now + 180;
        if (now >= this.nextAbilityTrailAt) {
          createHeart(toy.x, toy.y - 8, "⌁", "reaction--rare");
          this.nextAbilityTrailAt = now + 420;
        }
      }
    }
    if (
      this.profile.movement.ability === "web-sling" &&
      this.brain.currentAction === ACTIONS.PLAY &&
      now >= this.specialCooldownUntil
    ) {
      const pawX = this.x + CAT_SIZE * (this.facing > 0 ? 0.72 : 0.28);
      const pawY = this.y + CAT_SIZE * 0.7;
      const dx = pawX - toy.x;
      const dy = pawY - toy.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 82 && distance < 390) {
        toy.vx += dx / distance * 380;
        toy.vy += dy / distance * 230 - 90;
        toy.grounded = false;
        toy.platformId = null;
        toy.lastKickedAt = now;
        this.specialCooldownUntil = now + 3400;
        this.activateSpecial("web-sling", now, 980, "⌁", "reaction--epic");
      }
    }
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
    const transform = `translate3d(${(toy.x - toy.radius).toFixed(1)}px, ${(toy.y - toy.radius).toFixed(1)}px, 0)`;
    if (transform !== this.lastToyTransform) {
      toyElement.style.transform = transform;
      this.lastToyTransform = transform;
    }
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
    const ability = this.profile.movement.ability;
    if (this.drag?.kind === "cat") classes.push("cat--held");
    if (!this.grounded) classes.push("cat--airborne");
    if (now < this.landingFlashUntil) classes.push("cat--land");
    if (this.inBox) classes.push("cat--in-box");
    if (this.inTunnel) classes.push("cat--in-tunnel");
    if (ability === "tiny-scout") classes.push("cat--tiny-scout");
    if (ability === "mood-spectrum") classes.push("cat--mood-spectrum");
    if (ability === "mirror-clone") classes.push("cat--mirror-clone");
    if (ability === "feather-fall" && !this.grounded && this.vy > 0) classes.push("cat--feather-falling");
    if (ability === "turbo-sprint" && Math.abs(this.vx) > 120) classes.push("cat--sprinting");
    if (now < this.glitchFlashUntil) classes.push("cat--glitching");
    const specialActive = now < this.abilityFlashUntil ? this.activeSpecial : "none";
    if (specialActive !== "none") classes.push(`cat--special-${specialActive}`);
    if (catElement.dataset.specialActive !== specialActive) catElement.dataset.specialActive = specialActive;
    const mood = this.brain.drives.anger >= 0.55 || [ACTIONS.HISS, ACTIONS.CLAW].includes(this.brain.currentAction)
      ? "angry"
      : [ACTIONS.SLEEP, ACTIONS.LOAF].includes(this.brain.currentAction)
        ? "sleepy"
        : [ACTIONS.PLAY, ACTIONS.MISCHIEF].includes(this.brain.currentAction)
          ? "playful"
          : [ACTIONS.PURR, ACTIONS.SEEK_AFFECTION].includes(this.brain.currentAction)
            ? "affectionate"
            : "curious";
    if (catElement.dataset.mood !== mood) catElement.dataset.mood = mood;
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
    const transform = `translate3d(${this.x.toFixed(2)}px, ${this.y.toFixed(2)}px, 0) scale(${this.profile.visualScale})`;
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
      : ["toy", "box", "mouse", "bubble-machine", "tunnel"].includes(this.drag?.kind)
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
    if (kind === "mouse" && !this.mouse) return false;
    if (kind === "bubble-machine" && !this.bubbleMachine) return false;
    if (kind === "tunnel" && !this.tunnel) return false;
    const now = performance.now();
    const origin = {
      cat: { x: this.x, y: this.y },
      toy: this.toy,
      box: this.box,
      mouse: this.mouse,
      "bubble-machine": this.bubbleMachine,
      tunnel: this.tunnel
    }[kind];
    if (!origin) return false;
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
    } else if (kind === "box") {
      this.inBox = false;
      this.box.vx = 0;
      this.box.vy = 0;
      this.box.grounded = false;
      this.box.platformId = null;
      this.renderBox();
    } else {
      const prop = kind === "mouse" ? this.mouse : kind === "bubble-machine" ? this.bubbleMachine : this.tunnel;
      if (kind === "tunnel") this.inTunnel = false;
      prop.vx = 0;
      prop.vy = 0;
      prop.grounded = false;
      prop.platformId = null;
      if (kind === "mouse") this.renderMouse();
      else if (kind === "bubble-machine") this.renderBubbles();
      else this.renderTunnel();
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
    } else if (["mouse", "bubble-machine", "tunnel"].includes(drag.kind)) {
      const prop = drag.kind === "mouse" ? this.mouse : drag.kind === "bubble-machine" ? this.bubbleMachine : this.tunnel;
      if (!prop) return false;
      prop.x = Math.min(window.innerWidth - prop.width, Math.max(0, event.clientX - drag.offsetX));
      prop.y = Math.min(window.innerHeight - prop.height, Math.max(0, event.clientY - drag.offsetY));
      if (drag.kind === "mouse") this.renderMouse();
      else if (drag.kind === "bubble-machine") this.renderBubbles();
      else this.renderTunnel();
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
    } else if (["mouse", "bubble-machine", "tunnel"].includes(drag.kind)) {
      const prop = drag.kind === "mouse" ? this.mouse : drag.kind === "bubble-machine" ? this.bubbleMachine : this.tunnel;
      if (!prop) return false;
      prop.vx = Math.min(520, Math.max(-520, releaseVx));
      prop.vy = Math.min(520, Math.max(-520, releaseVy));
      prop.grounded = false;
      prop.platformId = null;
      if (drag.kind === "mouse") {
        prop.direction = Math.sign(prop.vx) || prop.direction;
        prop.dashUntil = now + 900;
        this.renderMouse();
      } else if (drag.kind === "bubble-machine") this.renderBubbles();
      else this.renderTunnel();
    }
    return true;
  }

  updatePointer(x, y, speed, now) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.speed = speed;
    this.pointer.movedAt = now;
    this.pointer.visible = true;
    const centerX = this.x + CAT_SIZE / 2;
    const centerY = this.y + CAT_SIZE / 2;
    const pointerDistance = Math.hypot(x - centerX, y - centerY);
    if (
      this.profile.movement.ability === "time-bubble" &&
      !this.drag &&
      speed > 760 &&
      pointerDistance < 240 &&
      now >= this.specialCooldownUntil
    ) {
      if (this.toy) {
        this.toy.vx *= 0.28;
        this.toy.vy *= 0.28;
      }
      if (this.fishingRig) {
        this.fishingRig.lureVx *= 0.22;
        this.fishingRig.lureVy *= 0.22;
      }
      this.brain.drives.confidence = Math.max(0, this.brain.drives.confidence - 0.04);
      this.brain.setAction(ACTIONS.INSPECT, now, 1250);
      this.nextDecisionAt = this.brain.actionUntil;
      this.specialCooldownUntil = now + 3300;
      this.activateSpecial("time-bubble", now, 1200, "◷", "reaction--epic");
    }
    if (
      this.profile.movement.ability === "shy-dash" &&
      this.grounded &&
      !this.drag &&
      speed > 820 &&
      pointerDistance < 190 &&
      now >= this.specialCooldownUntil
    ) {
      this.facing = x < centerX ? 1 : -1;
      this.vx = this.facing * 176 * this.profile.movement.speed;
      this.brain.drives.confidence = Math.max(0, this.brain.drives.confidence - 0.08);
      this.brain.setAction(ACTIONS.INSPECT, now, 1100);
      this.nextDecisionAt = this.brain.actionUntil;
      this.specialCooldownUntil = now + 2100;
      this.activateSpecial("shy-dash", now, 520, "!", "reaction--common");
    }
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
      this.handlePetReaction(reaction, now, headX, headY);
    }
  }

  batToy(now) {
    if (!this.toy) return;
    if (now - this.toy.lastKickedAt < 520) return;
    const direction = Math.sign(this.toy.x - (this.x + CAT_SIZE / 2)) || this.facing;
    this.facing = direction;
    kickToy(this.toy, direction, (0.82 + Math.random() * 0.35) * this.profile.movement.toyForce, now);
    if (this.profile.movement.ability === "toy-hoarder") {
      this.toy.vx *= 0.34;
      this.toy.vy *= 0.42;
      this.activateSpecial("toy-hoarder", now, 620, "MINE", "reaction--common");
    } else if (this.profile.movement.ability === "mirror-clone") {
      this.toy.vx += direction * 118;
      this.toy.vy -= 72;
      this.toy.hitCount += 1;
      this.activateSpecial("mirror-clone", now, 720, "Ⅱ", "reaction--epic");
    } else if (this.profile.movement.ability === "twin-tag-team") {
      this.toy.vx += direction * 148;
      this.toy.vy -= 84;
      this.toy.hitCount += 1;
      this.activateSpecial("twin-tag-team", now, 760, "×2", "reaction--epic");
    } else if (this.profile.movement.ability === "extra-toes") {
      this.toy.vx *= 1.24;
      this.toy.vy -= 64;
      this.toy.hitCount += 1;
      this.activateSpecial("extra-toes", now, 760, "×6", "reaction--rare");
    } else {
      createHeart(this.toy.x, this.toy.y - 5, "✦");
    }
    this.brain.drives.playfulness = Math.max(0, this.brain.drives.playfulness - 0.035);
    this.brain.setAction(ACTIONS.PLAY, now, 3600);
    this.nextDecisionAt = this.brain.actionUntil;
  }

  syncToyButtons() {
    for (const button of toyTray.querySelectorAll("[data-toy-type]")) {
      button.setAttribute("aria-pressed", String(button.dataset.toyType === this.toyType));
    }
  }

  syncPutAwayButton() {
    toyButton.disabled = !this.toyType;
    toyButton.classList.toggle("is-active", Boolean(this.toyType));
  }

  syncToyHint() {
    const hints = {
      ball: "Drag and toss · the cat will chase, bat, and redirect it",
      laser: "Move anywhere · pause to stalk · sweep fast for a sprint",
      box: "Drag onto any ledge · leave it nearby for hiding and sleep",
      feather: "Move to tease · hold empty space to reel · release to cast",
      mouse: "Drag or toss · it scurries, turns at edges, and escapes pounces",
      bubbles: "Tap empty space for bubbles · drag the machine · help the cat pop them",
      tunnel: "Drag onto a ledge · the cat dives in one end and rockets from the other"
    };
    toyHint.hidden = !this.toyType;
    toyHint.textContent = hints[this.toyType] || "";
  }

  putToyAway(now = performance.now()) {
    if (!this.toyType) return;
    const toyName = {
      feather: "fishing rod",
      mouse: "wind-up mouse",
      bubbles: "bubble machine",
      tunnel: "play tunnel"
    }[this.toyType] || this.toyType;
    this.toy = null;
    this.box = null;
    this.fishingRig = null;
    this.mouse = null;
    this.bubbleMachine = null;
    this.bubbles = [];
    this.bubblePopCount = 0;
    this.tunnel = null;
    this.tunnelUses = 0;
    this.toyType = null;
    this.toyTarget = null;
    this.inBox = false;
    this.inTunnel = false;
    toyElement.classList.remove("is-visible", "toy--airborne", "toy--held");
    laserToyElement.hidden = true;
    boxToyElement.hidden = true;
    featherToyElement.hidden = true;
    mouseToyElement.hidden = true;
    bubbleToyElement.hidden = true;
    tunnelToyElement.hidden = true;
    if (this.activeSpecial === "zero-gravity") {
      this.activeSpecial = "";
      this.abilityFlashUntil = now;
    }
    if (this.brain.currentAction === ACTIONS.PLAY) {
      this.brain.setAction(ACTIONS.IDLE, now, 1100);
      this.setRenderState(ACTIONS.IDLE);
      this.nextDecisionAt = this.brain.actionUntil;
      this.target = null;
      this.vx *= 0.35;
    }
    this.syncToyButtons();
    this.syncPutAwayButton();
    this.syncToyHint();
    statusCopy.textContent = `${this.profile.name} watched the ${toyName} get put away`;
    this.lastStatusCopy = statusCopy.textContent;
  }

  activateToy(type) {
    if (type === "ball") {
      this.dropToy();
      return;
    }

    this.toy = null;
    this.box = null;
    this.fishingRig = null;
    this.mouse = null;
    this.bubbleMachine = null;
    this.bubbles = [];
    this.bubblePopCount = 0;
    this.tunnel = null;
    this.tunnelUses = 0;
    this.toyType = type;
    this.toyTarget = null;
    this.inBox = false;
    this.inTunnel = false;
    toyElement.classList.remove("is-visible");
    laserToyElement.hidden = true;
    boxToyElement.hidden = true;
    featherToyElement.hidden = true;
    mouseToyElement.hidden = true;
    bubbleToyElement.hidden = true;
    tunnelToyElement.hidden = true;

    const now = performance.now();
    const floor = this.world.get("floor");
    const controlsRect = document.querySelector(".controls").getBoundingClientRect();
    const floorSpawnX = (width, preferredRatio = 0.62) => Math.max(
      24,
      Math.min(window.innerWidth * preferredRatio, controlsRect.left - width - 28, window.innerWidth - width - 24)
    );
    if (type === "box") {
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
      this.lastLaserPoint = "";
      this.updateLaser();
    } else if (type === "feather") {
      const x = window.innerWidth * 0.58;
      const y = window.innerHeight * 0.46;
      this.fishingRig = createFishingRig({ x, y, direction: x < window.innerWidth / 2 ? 1 : -1 });
      featherToyElement.hidden = false;
      this.toyTarget = { x: this.fishingRig.lureX, y: this.fishingRig.lureY, kind: "feather" };
      this.renderFishingRod();
    } else if (type === "mouse") {
      const x = floorSpawnX(42, 0.62);
      const y = (floor?.top ?? window.innerHeight - 38) - 24;
      this.mouse = createMouse({ x, y, platformId: "floor", now, direction: x < window.innerWidth / 2 ? 1 : -1 });
      mouseToyElement.hidden = false;
      this.toyTarget = { x: x + this.mouse.width / 2, y: y + this.mouse.height, platformId: "floor", kind: "mouse" };
      this.renderMouse();
    } else if (type === "bubbles") {
      const x = floorSpawnX(58, 0.64);
      const y = (floor?.top ?? window.innerHeight - 38) - 42;
      this.bubbleMachine = createBox({ x, y, platformId: "floor" });
      this.bubbleMachine.width = 58;
      this.bubbleMachine.height = 42;
      this.nextBubbleAt = now;
      bubbleToyElement.hidden = false;
      this.toyTarget = { x: x + 29, y, platformId: "floor", kind: "bubbles" };
      this.updateBubbles(0, now);
    } else if (type === "tunnel") {
      const x = floorSpawnX(116, 0.58);
      const y = (floor?.top ?? window.innerHeight - 38) - 48;
      this.tunnel = createBox({ x, y, platformId: "floor" });
      this.tunnel.width = 116;
      this.tunnel.height = 48;
      tunnelToyElement.hidden = false;
      this.toyTarget = { x: x + 58, y: y + 48, platformId: "floor", kind: "tunnel" };
      this.renderTunnel();
    }

    this.brain.noticeToy(now);
    this.brain.setAction(ACTIONS.PLAY, now, 7200);
    this.beginAction(ACTIONS.PLAY, now);
    this.nextDecisionAt = this.brain.actionUntil;
    this.syncToyButtons();
    this.syncPutAwayButton();
    this.syncToyHint();
    const toyName = {
      feather: "fishing rod",
      mouse: "wind-up mouse",
      bubbles: "bubble machine",
      tunnel: "play tunnel"
    }[type] || type;
    statusCopy.textContent = `${this.profile.name} noticed the ${toyName}`;
    this.lastStatusCopy = statusCopy.textContent;
  }

  dropToy() {
    this.toyType = "ball";
    this.toyTarget = null;
    this.box = null;
    this.fishingRig = null;
    this.mouse = null;
    this.bubbleMachine = null;
    this.bubbles = [];
    this.bubblePopCount = 0;
    this.tunnel = null;
    this.tunnelUses = 0;
    this.inBox = false;
    this.inTunnel = false;
    laserToyElement.hidden = true;
    boxToyElement.hidden = true;
    featherToyElement.hidden = true;
    mouseToyElement.hidden = true;
    bubbleToyElement.hidden = true;
    tunnelToyElement.hidden = true;
    const current = this.world.get(this.platformId) || this.world.get("floor");
    const center = this.x + CAT_SIZE / 2;
    const reachable = this.world.reachableFrom(current, center, this.profile.movement.navigationJump).filter((platform) => platform.width > 100);
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
    this.lastToyTransform = "";
    this.renderToy();
    toyElement.classList.add("is-visible");
    this.syncToyButtons();
    this.syncPutAwayButton();
    this.syncToyHint();
    this.brain.noticeToy(now);
    this.brain.setAction(ACTIONS.PLAY, now, 5200);
    this.beginAction(ACTIONS.PLAY, now);
    this.nextDecisionAt = this.brain.actionUntil;
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
    button.title = `${profile.tagline}. ${profile.special}`;
    button.innerHTML = `
      <span class="cat-option-art" aria-hidden="true"></span>
      <span class="cat-option-copy">
        <strong class="cat-option-name">${profile.name}</strong>
        <span class="cat-option-rarity">${profile.rarity}</span>
        <span class="cat-option-personality">${profile.personality}</span>
        <span class="cat-option-ability">${profile.movement.ability}</span>
      </span>`;
    const art = button.querySelector(".cat-option-art");
    art.style.setProperty("--cat-atlas-image", `var(--cat-atlas-${profile.atlasSet})`);
    art.style.setProperty("--atlas-x", `${profile.atlas[0] * 50}%`);
    art.style.setProperty("--atlas-y", `${profile.atlas[1] * 50}%`);
    catGrid.append(button);
  }
}

function createHeart(x, y, glyph = "♥", variant = "") {
  while (particleLayer.childElementCount >= 20) particleLayer.firstElementChild?.remove();
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
const performanceGovernor = new PerformanceGovernor();
habitat.dataset.features = "autonomy distinct-personalities rarity-roster anger hiss claw platforms toy-physics drag-cat drag-toy drag-box fishing-rod reel-and-cast lure-strikes inward-facing-rod cursor-toy-platform-targeting wind-up-mouse mouse-pounce bubble-machine bubble-pop play-tunnel tunnel-zoom super-bounce low-latency-cursor-toys throw-ball toy-put-away expansion-roster super-roster iteration-four-roster special-abilities rhythm-burst time-bubble mirror-clone ground-pound zero-gravity sunbeam comfort-knead cursor-feint twin-tag-team royal-yowl prestidigitation speed-lap grapple-glide web-sling guardian-ward nine-lives navigator extra-toes immovable-loaf heat-seeker pointer-coalescing transform-only-motion performance-governor";
habitat.dataset.performanceMode = performanceGovernor.mode;
window.catStudio = { cat, world, profiles: CAT_PROFILES, performance: performanceGovernor, selectCat: (id) => cat.selectProfile(id) };
let previousTime = performance.now();
let pointerSample = { x: 0, y: 0, time: previousTime, initialized: false };
let pendingPointer = null;
let pendingDrag = null;
let nextPerformanceReportAt = 0;

function flushPointerInput() {
  if (pendingDrag) {
    cat.moveDrag(pendingDrag);
    pendingDrag = null;
  }
  if (pendingPointer) {
    const pointer = pendingPointer;
    pendingPointer = null;
    cat.updatePointer(pointer.x, pointer.y, pointer.speed, pointer.time);
  }
}

function reportPerformance(now) {
  if (now < nextPerformanceReportAt) return;
  nextPerformanceReportAt = now + 500;
  const snapshot = performanceGovernor.snapshot();
  habitat.dataset.performanceMode = snapshot.mode;
  habitat.dataset.performanceFps = String(snapshot.fps);
  habitat.dataset.performanceFrameMs = snapshot.frameMs.toFixed(1);
  habitat.dataset.performanceWorkMs = snapshot.workMs.toFixed(2);
  if (debugPerformance) debugPerformance.textContent = `${snapshot.mode} · ${snapshot.fps} fps`;
}

function frame(now) {
  const frameMs = now - previousTime;
  const dt = Math.min(0.04, frameMs / 1000);
  previousTime = now;
  flushPointerInput();
  const workStartedAt = performance.now();
  cat.update(dt, now);
  const modeChange = performanceGovernor.sample(frameMs, performance.now() - workStartedAt);
  if (modeChange) habitat.classList.toggle("performance-lite", modeChange === "lite");
  reportPerformance(now);
  requestAnimationFrame(frame);
}

window.addEventListener("pointermove", (event) => {
  const samples = event.getCoalescedEvents?.();
  const latest = samples?.length ? samples[samples.length - 1] : event;
  const now = performance.now();
  const elapsed = Math.max(16, now - pointerSample.time);
  const speed = pointerSample.initialized
    ? Math.hypot(latest.clientX - pointerSample.x, latest.clientY - pointerSample.y) / elapsed * 1000
    : 0;
  pointerSample = { x: latest.clientX, y: latest.clientY, time: now, initialized: true };
  if (cat.drag?.pointerId === event.pointerId) {
    pendingDrag = { pointerId: event.pointerId, clientX: latest.clientX, clientY: latest.clientY };
    event.preventDefault();
    return;
  }
  pendingPointer = { x: latest.clientX, y: latest.clientY, speed, time: now };
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

mouseToyElement.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  if (cat.startDrag("mouse", event)) {
    try { mouseToyElement.setPointerCapture?.(event.pointerId); } catch { /* Synthetic test events have no native capture target. */ }
  }
});

bubbleMachineElement.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  if (cat.startDrag("bubble-machine", event)) {
    try { bubbleMachineElement.setPointerCapture?.(event.pointerId); } catch { /* Synthetic test events have no native capture target. */ }
  }
});

tunnelToyElement.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  if (cat.startDrag("tunnel", event)) {
    try { tunnelToyElement.setPointerCapture?.(event.pointerId); } catch { /* Synthetic test events have no native capture target. */ }
  }
});

window.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || cat.drag) return;
  if (event.target.closest?.("button, #cat, .cat-roster, .toy-tray, .debug-panel")) return;
  if (cat.toyType === "feather" && cat.fishingRig) {
    setFishingReel(cat.fishingRig, true);
    featherToyElement.dataset.reeling = "true";
  } else if (cat.toyType === "bubbles" && cat.bubbleMachine) {
    cat.spawnBubble(event.clientX, event.clientY, performance.now(), true);
  }
});

window.addEventListener("pointerup", (event) => {
  if (pendingDrag?.pointerId === event.pointerId) {
    cat.moveDrag(pendingDrag);
    pendingDrag = null;
  }
  cat.endDrag(event);
  if (cat.fishingRig?.reeling) setFishingReel(cat.fishingRig, false);
});
window.addEventListener("pointercancel", (event) => {
  pendingDrag = null;
  cat.endDrag(event);
  if (cat.fishingRig?.reeling) setFishingReel(cat.fishingRig, false);
});

window.addEventListener("resize", () => {
  world.scan();
  cat.lastLaserPoint = "";
  const platform = world.get(cat.platformId) || world.get("floor");
  cat.x = Math.min(window.innerWidth - CAT_SIZE, Math.max(0, cat.x));
  if (cat.grounded && platform) cat.y = platform.top - CAT_SIZE + CAT_FOOT_OFFSET;
  if (cat.box) {
    cat.box.x = Math.min(window.innerWidth - cat.box.width, Math.max(0, cat.box.x));
    const boxPlatform = world.get(cat.box.platformId) || world.get("floor");
    if (cat.box.grounded && boxPlatform) cat.box.y = boxPlatform.top - cat.box.height;
    cat.renderBox();
  }
  for (const [prop, render] of [
    [cat.mouse, () => cat.renderMouse()],
    [cat.bubbleMachine, () => cat.renderBubbles()],
    [cat.tunnel, () => cat.renderTunnel()]
  ]) {
    if (!prop) continue;
    prop.x = Math.min(window.innerWidth - prop.width, Math.max(0, prop.x));
    const propPlatform = world.get(prop.platformId) || world.get("floor");
    if (prop.grounded && propPlatform) prop.y = propPlatform.top - prop.height;
    render();
  }
});

document.addEventListener("visibilitychange", () => {
  previousTime = performance.now();
  pointerSample.time = previousTime;
  pendingPointer = null;
  pendingDrag = null;
  if (cat.fishingRig?.reeling) setFishingReel(cat.fishingRig, false);
});

toyButton.addEventListener("click", () => {
  cat.putToyAway();
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
  cat.handlePetReaction(reaction, now, cat.x + CAT_SIZE / 2, cat.y + CAT_SIZE * 0.34);
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
  cat.handlePetReaction(reaction, now, cat.x + CAT_SIZE / 2, cat.y + CAT_SIZE * 0.34);
});

requestAnimationFrame(frame);
