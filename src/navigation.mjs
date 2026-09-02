export const CAT_MAX_RISE = 320;

export function horizontalGap(a, b) {
  if (a.right < b.left) return b.left - a.right;
  if (b.right < a.left) return a.left - b.right;
  return 0;
}

export function canTraverse(from, to) {
  if (!from || !to || from.id === to.id) return false;
  const rise = from.top - to.top;
  const gap = horizontalGap(from, to);
  if (rise > 0) return rise <= CAT_MAX_RISE && gap < 370;
  const hasDropExit = gap > 0 || to.left < from.left - 30 || to.right > from.right + 30;
  return gap < 440 && hasDropExit;
}

export function reachablePlatforms(platforms, from, x) {
  if (!from) return [];
  return platforms.filter((candidate) => {
    if (!canTraverse(from, candidate)) return false;
    const safeLeft = candidate.left + Math.min(42, candidate.width * 0.25);
    const safeRight = candidate.right - Math.min(42, candidate.width * 0.25);
    const nearestLanding = Math.min(safeRight, Math.max(safeLeft, x));
    return Math.abs(nearestLanding - x) < 470;
  });
}

export function nextHopToward(platforms, from, destination) {
  if (!from || !destination || from.id === destination.id) return null;
  const queue = [{ platform: from, firstHop: null }];
  const visited = new Set([from.id]);

  while (queue.length) {
    const current = queue.shift();
    for (const candidate of platforms) {
      if (visited.has(candidate.id) || !canTraverse(current.platform, candidate)) continue;
      const firstHop = current.firstHop || candidate;
      if (candidate.id === destination.id) return firstHop;
      visited.add(candidate.id);
      queue.push({ platform: candidate, firstHop });
    }
  }
  return null;
}

export function launchPoint(from, to) {
  const inset = Math.min(44, from.width * 0.25);
  if (to.right < from.left) return from.left + inset;
  if (to.left > from.right) return from.right - inset;
  const targetCenter = (to.left + to.right) / 2;
  return Math.min(from.right - inset, Math.max(from.left + inset, targetCenter));
}
