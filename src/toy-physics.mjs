export const TOY_RADIUS = 10;
export const TOY_GRAVITY = 1180;

const clampToyValue = (value, min, max) => Math.min(max, Math.max(min, value));

export function createToy({ x, y, vx = 0, vy = 0, platformId = null, now = 0 }) {
  return {
    x,
    y,
    vx,
    vy,
    radius: TOY_RADIUS,
    platformId,
    grounded: false,
    spawnedAt: now,
    lastKickedAt: -Infinity,
    bounceCount: 0,
    hitCount: 0
  };
}

export function advanceToy(toy, dt, width) {
  const seconds = clampToyValue(dt, 0, 0.04);
  const previousBottom = toy.y + toy.radius;

  if (toy.grounded) {
    toy.vy = 0;
    toy.vx *= Math.pow(0.965, seconds * 60);
    if (Math.abs(toy.vx) < 3) toy.vx = 0;
  } else {
    toy.vy += TOY_GRAVITY * seconds;
  }

  toy.x += toy.vx * seconds;
  toy.y += toy.vy * seconds;

  if (toy.x - toy.radius < 0) {
    toy.x = toy.radius;
    toy.vx = Math.abs(toy.vx) * 0.76;
  } else if (toy.x + toy.radius > width) {
    toy.x = width - toy.radius;
    toy.vx = -Math.abs(toy.vx) * 0.76;
  }

  return previousBottom;
}

export function bounceToy(toy, surfaceTop, platformId) {
  const impactSpeed = Math.abs(toy.vy);
  toy.y = surfaceTop - toy.radius - 0.5;
  toy.platformId = platformId;
  toy.bounceCount += 1;
  toy.vx *= 0.91;

  if (impactSpeed < 72) {
    toy.vy = 0;
    toy.grounded = true;
  } else {
    toy.vy = -impactSpeed * 0.57;
    toy.grounded = false;
  }
  return impactSpeed;
}

export function kickToy(toy, direction, strength = 1, now = 0) {
  const force = clampToyValue(strength, 0.65, 1.35);
  const side = Math.sign(direction) || 1;
  toy.vx = side * (210 + 80 * force);
  toy.vy = -(235 + 115 * force);
  toy.grounded = false;
  toy.lastKickedAt = now;
  toy.hitCount += 1;
}

export function isToyOnSurface(toy, platform) {
  if (!platform) return false;
  const overlaps = toy.x + toy.radius > platform.left + 1 && toy.x - toy.radius < platform.right - 1;
  const closeToTop = Math.abs(toy.y + toy.radius - platform.top) < 4;
  return overlaps && closeToTop;
}
