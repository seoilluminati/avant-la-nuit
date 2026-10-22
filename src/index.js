import { parseGpx } from './gpx.js';
import { planRoute } from './plan.js';

export { parseGpx } from './gpx.js';
export { planRoute } from './plan.js';
export { sunTimes, sunAltitude, lightAt, SUNSET_ALTITUDE, CIVIL_ALTITUDE } from './sun.js';
export { PROFILES, toblerKmh, bikeKmh, speedKmh, resolveProfile } from './pace.js';
export { distance, bbox, distanceToTrack } from './geo.js';

/** Parse a GPX string and plan it in one call. Same options as planRoute. */
export function analyzeGpx(xml, options) {
  const { name, points } = parseGpx(xml);
  return { name, ...planRoute(points, options) };
}
