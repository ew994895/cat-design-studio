const clampInteraction = (value, min, max) => Math.min(max, Math.max(min, value));

export const BOX_WIDTH = 92;
export const BOX_HEIGHT = 56;
export const BOX_GRAVITY = 980;
export const FISHING_LINE_LENGTH = 104;
export const FISHING_REELED_LENGTH = 34;
export const MOUSE_WIDTH = 42;
export const MOUSE_HEIGHT = 24;
export const MOUSE_GRAVITY = 980;

export function createBox({ x, y, vx = 0, vy = 0, platformId = null }) {
  return {
    x,
    y,
    vx,
    vy,
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    platformId,
    grounded: Boolean(platformId)
  };
}

export function advanceBox(box, dt, width) {
  const seconds = clampInteraction(dt, 0, 0.04);
  const previousBottom = box.y + box.height;

  if (box.grounded) {
    box.vy = 0;
    box.vx *= Math.pow(0.9, seconds * 60);
    if (Math.abs(box.vx) < 2) box.vx = 0;
  } else {
    box.vy += BOX_GRAVITY * seconds;
  }

  box.x += box.vx * seconds;
  box.y += box.vy * seconds;

  if (box.x < 0) {
    box.x = 0;
    box.vx = Math.abs(box.vx) * 0.24;
  } else if (box.x + box.width > width) {
    box.x = width - box.width;
    box.vx = -Math.abs(box.vx) * 0.24;
  }

  return previousBottom;
}

export function settleBox(box, surfaceTop, platformId) {
  box.y = surfaceTop - box.height;
  box.vy = 0;
  box.vx *= 0.35;
  box.grounded = true;
  box.platformId = platformId;
}

export function isBoxOnSurface(box, platform) {
  if (!platform) return false;
  const overlaps = box.x + box.width - 8 > platform.left && box.x + 8 < platform.right;
  const flush = Math.abs(box.y + box.height - platform.top) < 4;
  return overlaps && flush;
}

export function createFishingRig({ x, y, direction = 1 }) {
  const facing = direction < 0 ? -1 : 1;
  const tipX = x + facing * 68;
  const tipY = y - 42;
  return {
    targetX: x,
    targetY: y,
    handleX: x,
    handleY: y,
    tipX,
    tipY,
    lureX: tipX,
    lureY: tipY + FISHING_LINE_LENGTH,
    lureVx: 0,
    lureVy: 0,
    handleVx: 0,
    handleVy: 0,
    direction: facing,
    lineLength: FISHING_LINE_LENGTH,
    reeling: false,
    castBoost: 0,
    lastHitAt: -Infinity,
    hitCount: 0
  };
}

export function setFishingHandle(rig, x, y) {
  rig.targetX = x;
  rig.targetY = y;
}

export function setFishingReel(rig, reeling) {
  if (!rig) return;
  const wasReeling = rig.reeling;
  rig.reeling = Boolean(reeling);
  if (wasReeling && !rig.reeling) {
    rig.castBoost = Math.min(1, Math.hypot(rig.handleVx, rig.handleVy) / 1100 + 0.24);
    rig.lureVx += rig.direction * (110 + rig.castBoost * 250) + rig.handleVx * 0.12;
    rig.lureVy += -80 - rig.castBoost * 190 + rig.handleVy * 0.08;
  }
}

export function advanceFishingRig(rig, dt, width, height) {
  const seconds = clampInteraction(dt, 1 / 240, 0.035);
  const previousHandleX = rig.handleX;
  const previousHandleY = rig.handleY;

  // The handle is locked to the latest pointer sample. Only the lure trails.
  rig.handleX = rig.targetX;
  rig.handleY = rig.targetY;
  const rawHandleVx = (rig.handleX - previousHandleX) / seconds;
  const rawHandleVy = (rig.handleY - previousHandleY) / seconds;
  rig.handleVx = clampInteraction(rig.handleVx * 0.18 + rawHandleVx * 0.82, -2400, 2400);
  rig.handleVy = clampInteraction(rig.handleVy * 0.18 + rawHandleVy * 0.82, -2400, 2400);

  // A small dead zone stops the rod from flickering when the cursor crosses center.
  const center = width / 2;
  if (rig.handleX < center - 18) rig.direction = 1;
  else if (rig.handleX > center + 18) rig.direction = -1;

  rig.tipX = clampInteraction(rig.handleX + rig.direction * 76 + rig.handleVx * 0.0045, 8, width - 8);
  rig.tipY = clampInteraction(rig.handleY - 46 + rig.handleVy * 0.003, 8, height - 8);

  const targetLength = rig.reeling ? FISHING_REELED_LENGTH : FISHING_LINE_LENGTH;
  const reelEase = 1 - Math.exp(-(rig.reeling ? 15 : 8) * seconds);
  rig.lineLength += (targetLength - rig.lineLength) * reelEase;

  // Two tiny spring steps are more stable during a violent whip while remaining cheap.
  const steps = seconds > 0.018 ? 2 : 1;
  const step = seconds / steps;
  for (let index = 0; index < steps; index += 1) {
    const speedLift = Math.min(24, Math.hypot(rig.handleVx, rig.handleVy) * 0.012);
    const restingX = rig.tipX - rig.handleVx * 0.018;
    const restingY = rig.tipY + rig.lineLength - speedLift;
    const stiffness = rig.reeling ? 176 : 104;
    rig.lureVx += (restingX - rig.lureX) * stiffness * step;
    rig.lureVy += ((restingY - rig.lureY) * stiffness + 74) * step;
    const damping = Math.exp(-(rig.reeling ? 10.8 : 6.6) * step);
    rig.lureVx = clampInteraction(rig.lureVx * damping, -1750, 1750);
    rig.lureVy = clampInteraction(rig.lureVy * damping, -1750, 1750);
    rig.lureX += rig.lureVx * step;
    rig.lureY += rig.lureVy * step;
  }
  rig.castBoost = Math.max(0, rig.castBoost - seconds * 1.8);

  const postDx = rig.lureX - rig.tipX;
  const postDy = rig.lureY - rig.tipY;
  const postDistance = Math.max(0.001, Math.hypot(postDx, postDy));
  const maximumLength = rig.lineLength * 1.16;
  if (postDistance > maximumLength) {
    rig.lureX = rig.tipX + postDx / postDistance * maximumLength;
    rig.lureY = rig.tipY + postDy / postDistance * maximumLength;
    rig.lureVx *= 0.72;
    rig.lureVy *= 0.72;
  }

  if (rig.lureX < 12 || rig.lureX > width - 12) {
    rig.lureX = clampInteraction(rig.lureX, 12, width - 12);
    rig.lureVx *= -0.35;
  }
  if (rig.lureY < 12 || rig.lureY > height - 44) {
    rig.lureY = clampInteraction(rig.lureY, 12, height - 44);
    rig.lureVy *= -0.3;
  }

  return rig;
}

export function strikeFishingLure(rig, direction, force = 1, now = 0) {
  if (!rig || now - rig.lastHitAt < 520) return false;
  const side = Math.sign(direction) || 1;
  const strength = clampInteraction(force, 0.65, 1.5);
  rig.lureVx = side * (240 + 150 * strength);
  rig.lureVy = -(210 + 90 * strength);
  rig.lastHitAt = now;
  rig.hitCount += 1;
  rig.castBoost = 1;
  return true;
}

export function createMouse({ x, y, vx = 0, vy = 0, platformId = null, now = 0, direction = 1 }) {
  return {
    x,
    y,
    vx,
    vy,
    width: MOUSE_WIDTH,
    height: MOUSE_HEIGHT,
    direction: direction < 0 ? -1 : 1,
    platformId,
    grounded: Boolean(platformId),
    spawnedAt: now,
    dashUntil: now + 900,
    nextTurnAt: now + 1700,
    lastPouncedAt: -Infinity,
    pounceCount: 0
  };
}

export function advanceMouse(mouse, dt, width, now = 0, platform = null) {
  const seconds = clampInteraction(dt, 0, 0.04);
  const previousBottom = mouse.y + mouse.height;

  if (mouse.grounded) {
    const fast = now < mouse.dashUntil;
    const targetSpeed = mouse.direction * (fast ? 188 : 82);
    mouse.vx += (targetSpeed - mouse.vx) * (1 - Math.exp(-10 * seconds));
    mouse.vy = 0;

    if (platform) {
      const left = platform.left + 5;
      const right = platform.right - mouse.width - 5;
      if (mouse.x <= left && mouse.direction < 0) {
        mouse.x = left;
        mouse.direction = 1;
        mouse.dashUntil = now + 520;
      } else if (mouse.x >= right && mouse.direction > 0) {
        mouse.x = right;
        mouse.direction = -1;
        mouse.dashUntil = now + 520;
      }
    }

    if (now >= mouse.nextTurnAt) {
      mouse.direction *= -1;
      mouse.dashUntil = now + 620;
      mouse.nextTurnAt = now + 1700;
    }
  } else {
    mouse.vy += MOUSE_GRAVITY * seconds;
  }

  mouse.x += mouse.vx * seconds;
  mouse.y += mouse.vy * seconds;

  if (mouse.x < 0) {
    mouse.x = 0;
    mouse.direction = 1;
    mouse.vx = Math.abs(mouse.vx) * 0.32;
  } else if (mouse.x + mouse.width > width) {
    mouse.x = width - mouse.width;
    mouse.direction = -1;
    mouse.vx = -Math.abs(mouse.vx) * 0.32;
  }

  return previousBottom;
}

export function settleMouse(mouse, surfaceTop, platformId) {
  mouse.y = surfaceTop - mouse.height;
  mouse.vy = 0;
  mouse.grounded = true;
  mouse.platformId = platformId;
}

export function isMouseOnSurface(mouse, platform) {
  if (!platform) return false;
  const overlaps = mouse.x + mouse.width - 5 > platform.left && mouse.x + 5 < platform.right;
  const flush = Math.abs(mouse.y + mouse.height - platform.top) < 4;
  return overlaps && flush;
}

export function pounceMouse(mouse, catDirection, force = 1, now = 0) {
  if (!mouse || now - mouse.lastPouncedAt < 640) return false;
  const side = Math.sign(catDirection) || 1;
  const strength = clampInteraction(force, 0.65, 1.5);
  mouse.direction = side;
  mouse.vx = side * (205 + strength * 90);
  mouse.vy = -(70 + strength * 42);
  mouse.grounded = false;
  mouse.platformId = null;
  mouse.dashUntil = now + 1150;
  mouse.nextTurnAt = now + 2100;
  mouse.lastPouncedAt = now;
  mouse.pounceCount += 1;
  return true;
}

export function createBubble({ x, y, now = 0, seed = 0 }) {
  return {
    x,
    y,
    radius: 9 + seed % 5,
    vx: -12 + seed % 25,
    vy: -34 - seed % 22,
    bornAt: now,
    phase: seed * 0.73,
    popped: false
  };
}

export function advanceBubble(bubble, dt, width, height, now = 0) {
  const seconds = clampInteraction(dt, 0, 0.04);
  bubble.phase += seconds * 2.8;
  bubble.vx += Math.sin(bubble.phase) * 5.5 * seconds;
  bubble.vx = clampInteraction(bubble.vx, -32, 32);
  bubble.x += bubble.vx * seconds;
  bubble.y += bubble.vy * seconds;
  bubble.x = clampInteraction(bubble.x, bubble.radius + 4, width - bubble.radius - 4);
  return !bubble.popped && bubble.y + bubble.radius > 4 && bubble.y < height + bubble.radius && now - bubble.bornAt < 7200;
}

export function segmentGeometry(fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  return {
    x: fromX,
    y: fromY,
    length: Math.hypot(dx, dy),
    angle: Math.atan2(dy, dx) * 180 / Math.PI
  };
}
