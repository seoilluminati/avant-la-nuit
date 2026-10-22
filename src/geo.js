const EARTH_RADIUS_M = 6371008.8;
const RAD = Math.PI / 180;

/** Great-circle distance in metres between two {lat, lon} points (haversine). */
export function distance(a, b) {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Bounding box [south, west, north, east] of a list of points. */
export function bbox(points) {
  let s = Infinity, w = Infinity, n = -Infinity, e = -Infinity;
  for (const p of points) {
    if (p.lat < s) s = p.lat;
    if (p.lat > n) n = p.lat;
    if (p.lon < w) w = p.lon;
    if (p.lon > e) e = p.lon;
  }
  return [s, w, n, e];
}

/**
 * Distance in metres from point p to the polyline, plus the index of the
 * closest vertex. Uses a local equirectangular projection, accurate enough
 * for the few hundred metres we care about.
 */
export function distanceToTrack(p, points) {
  const kx = Math.cos(p.lat * RAD) * 111320;
  const ky = 110540;
  let best = Infinity, bestIndex = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const ax = (points[i].lon - p.lon) * kx, ay = (points[i].lat - p.lat) * ky;
    const bx = (points[i + 1].lon - p.lon) * kx, by = (points[i + 1].lat - p.lat) * ky;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    const d = Math.hypot(ax + t * dx, ay + t * dy);
    if (d < best) {
      best = d;
      bestIndex = t < 0.5 ? i : i + 1;
    }
  }
  return { distance: best, index: bestIndex };
}
