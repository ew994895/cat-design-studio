const clampInteraction = (value, min, max) => Math.min(max, Math.max(min, value));

export const BOX_WIDTH = 92;
export const BOX_HEIGHT = 56;
export const BOX_GRAVITY = 980;
export const FISHING_LINE_LENGTH = 86;

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
    direction: facing
  };
}

export function setFishingHandle(rig, x, y) {
  rig.targetX = x;
  rig.targetY = y;
}

export function advanceFishingRig(rig, dt, width, height) {
  const seconds = clampInteraction(dt, 1 / 240, 0.035);
  const previousHandleX = rig.handleX;
  const previousHandleY = rig.handleY;

  // The handle is locked to the latest pointer sample. Only the lure trails.
  rig.handleX = rig.targetX;
  rig.handleY = rig.targetY;
  rig.handleVx = clampInteraction((rig.handleX - previousHandleX) / seconds, -2200, 2200);
  rig.handleVy = clampInteraction((rig.handleY - previousHandleY) / seconds, -2200, 2200);
  rig.direction = rig.handleX < width / 2 ? 1 : -1;

  rig.tipX = clampInteraction(rig.handleX + rig.direction * 68 + rig.handleVx * 0.006, 8, width - 8);
  rig.tipY = clampInteraction(rig.handleY - 42 + rig.handleVy * 0.004, 8, height - 8);

  // A damped spring follows the rod tip immediately but keeps enough inertia to whip.
  const restingX = rig.tipX;
  const restingY = rig.tipY + FISHING_LINE_LENGTH;
  rig.lureVx += (restingX - rig.lureX) * 118 * seconds;
  rig.lureVy += ((restingY - rig.lureY) * 118 + 70) * seconds;
  const damping = Math.exp(-7.2 * seconds);
  rig.lureVx = clampInteraction(rig.lureVx * damping, -1500, 1500);
  rig.lureVy = clampInteraction(rig.lureVy * damping, -1500, 1500);
  rig.lureX += rig.lureVx * seconds;
  rig.lureY += rig.lureVy * seconds;

  const postDx = rig.lureX - rig.tipX;
  const postDy = rig.lureY - rig.tipY;
  const postDistance = Math.max(0.001, Math.hypot(postDx, postDy));
  const maximumLength = FISHING_LINE_LENGTH * 1.24;
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
