import { distance } from './geo.js';
import { lightAt, sunTimes } from './sun.js';
import { resolveProfile, speedKmh } from './pace.js';

const SMOOTH_WINDOW_M = 60; // GPS/DEM elevation is noisy; average over ±60 m
const MAX_SLOPE = 0.6;
const ASCENT_THRESHOLD_M = 3; // ignore wiggles smaller than this when counting D+

/** Total climb and descent with hysteresis, so sensor noise is not summed up. */
function climb(ele) {
  let ascent = 0, descent = 0, ref = ele[0];
  for (const e of ele) {
    if (e - ref >= ASCENT_THRESHOLD_M) { ascent += e - ref; ref = e; }
    else if (ref - e >= ASCENT_THRESHOLD_M) { descent += ref - e; ref = e; }
  }
  return { ascent, descent };
}

/** Fill missing elevations by linear interpolation along the track (0 if none at all). */
function fillElevation(points, dist) {
  const ele = points.map((p) => (Number.isFinite(p.ele) ? p.ele : null));
  const known = ele.flatMap((e, i) => (e === null ? [] : [i]));
  if (!known.length) return ele.map(() => 0);
  for (let i = 0; i < ele.length; i++) {
    if (ele[i] !== null) continue;
    const next = known.find((k) => k > i);
    const prev = [...known].reverse().find((k) => k < i);
    if (prev === undefined) ele[i] = ele[next];
    else if (next === undefined) ele[i] = ele[prev];
    else {
      const t = (dist[i] - dist[prev]) / (dist[next] - dist[prev] || 1);
      ele[i] = ele[prev] + t * (ele[next] - ele[prev]);
    }
  }
  return ele;
}

/** Distance-windowed moving average of elevation. */
function smooth(ele, dist, window = SMOOTH_WINDOW_M) {
  const prefix = [0];
  for (const e of ele) prefix.push(prefix[prefix.length - 1] + e);
  const out = new Array(ele.length);
  let lo = 0, hi = 0;
  for (let i = 0; i < ele.length; i++) {
    while (dist[i] - dist[lo] > window) lo++;
    while (hi + 1 < ele.length && dist[hi + 1] - dist[i] <= window) hi++;
    out[i] = (prefix[hi + 1] - prefix[lo]) / (hi - lo + 1);
  }
  return out;
}

/**
 * Plan a route: estimated time at every point, daylight at every point,
 * latest safe start and the turnaround point ("point of no return").
 *
 * @param {{lat:number, lon:number, ele?:number|null}[]} points
 * @param {object} [options]
 * @param {Date|number|string} [options.start=now] departure time
 * @param {string|object} [options.profile='hike'] hike | trail | road | gravel | mtb, or a custom profile
 * @param {number} [options.speedFactor=1] >1 faster than the model, <1 slower
 * @param {number} [options.breaks] minutes of stops per hour of moving (profile default)
 * @param {'sunset'|'dusk'} [options.deadline='sunset'] when you want to be back
 */
export function planRoute(points, options = {}) {
  if (!Array.isArray(points) || points.length < 2) throw new Error('planRoute needs at least 2 points');
  const start = options.start === undefined ? Date.now() : new Date(options.start).getTime();
  if (!Number.isFinite(start)) throw new Error('Invalid start time');
  const profile = resolveProfile(options.profile ?? 'hike');
  const speedFactor = options.speedFactor ?? 1;
  const breaks = options.breaks ?? profile.breaks ?? 0;
  const stopRatio = (60 + breaks) / 60;
  const deadlineKind = options.deadline === 'dusk' ? 'dusk' : 'sunset';

  const n = points.length;
  const dist = new Array(n).fill(0);
  for (let i = 1; i < n; i++) dist[i] = dist[i - 1] + distance(points[i - 1], points[i]);
  const ele = smooth(fillElevation(points, dist), dist);

  // Forward time to reach i, and time to walk back from i to the start.
  const forward = new Array(n).fill(0);
  const back = new Array(n).fill(0);
  const segSeconds = (d, dh) => {
    if (d <= 0) return 0;
    const slope = Math.max(-MAX_SLOPE, Math.min(MAX_SLOPE, dh / d));
    return (d / (speedKmh(slope, profile, speedFactor) / 3.6)) * stopRatio;
  };
  for (let i = 1; i < n; i++) {
    const d = dist[i] - dist[i - 1];
    const dh = ele[i] - ele[i - 1];
    forward[i] = forward[i - 1] + segSeconds(d, dh);
    back[i] = back[i - 1] + segSeconds(d, -dh);
  }

  const { ascent, descent } = climb(ele);
  const totalSeconds = forward[n - 1];
  const arrival = start + totalSeconds * 1000;
  const first = points[0];
  // Flat-horizon sunset on purpose: in a valley, ridges hide the sun earlier,
  // so crediting the observer's altitude would make the estimate less safe.
  const sun = sunTimes(start, first.lat, first.lon);
  const deadline = sun.polarNight ? start : sun[deadlineKind];

  const track = points.map((p, i) => {
    const time = start + forward[i] * 1000;
    return { lat: p.lat, lon: p.lon, ele: ele[i], dist: dist[i], time, light: lightAt(time, p.lat, p.lon) };
  });

  let turnaround = null;
  let firstLateIndex = -1;
  if (deadline !== null) {
    firstLateIndex = track.findIndex((p) => p.time > deadline);
    if (firstLateIndex !== -1) {
      // start + forward[i] + back[i] grows with i, so the last index that fits is the answer.
      let last = -1;
      for (let i = 0; i < n; i++) {
        if (start + (forward[i] + back[i]) * 1000 <= deadline) last = i;
        else break;
      }
      if (last >= 0) {
        turnaround = {
          index: last,
          dist: dist[last],
          time: track[last].time,
          backAt: start + (forward[last] + back[last]) * 1000,
        };
      }
    }
  }

  return {
    profile,
    start,
    arrival,
    totalSeconds,
    movingSeconds: totalSeconds / stopRatio,
    distance: dist[n - 1],
    ascent,
    descent,
    sun,
    deadlineKind,
    deadline,
    /** true when you finish before the deadline (always true on a polar day). */
    inTime: deadline === null || arrival <= deadline,
    /** seconds between arrival and deadline (negative = late). */
    margin: deadline === null ? null : (deadline - arrival) / 1000,
    /** latest departure that still finishes by the deadline. */
    latestStart: deadline === null ? null : deadline - totalSeconds * 1000,
    /** index of the first point reached after the deadline, -1 if none. */
    firstLateIndex,
    /** last point from which you can turn back and reach the start by the deadline. */
    turnaround,
    track,
  };
}
