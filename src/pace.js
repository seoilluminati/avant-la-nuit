// Speed models. Everything returns km/h for a given slope (rise / run).

/**
 * Built-in activity profiles.
 * - foot profiles use Tobler's hiking function, scaled by `factor`.
 * - bike profiles solve a steady-power cycling model, capped at `vmax` downhill.
 * `breaks` = default minutes of stops per hour of moving time.
 */
export const PROFILES = {
  hike: { kind: 'foot', factor: 0.9, breaks: 10 }, // a little slower than Tobler: safety first
  trail: { kind: 'foot', factor: 1.6, breaks: 3 },
  road: { kind: 'bike', power: 150, mass: 85, cda: 0.32, crr: 0.005, vmax: 55, breaks: 5 },
  gravel: { kind: 'bike', power: 140, mass: 88, cda: 0.4, crr: 0.008, vmax: 42, breaks: 5 },
  mtb: { kind: 'bike', power: 140, mass: 90, cda: 0.5, crr: 0.015, vmax: 30, breaks: 5 },
};

/** Tobler (1993): 6·e^(−3.5·|s + 0.05|) km/h; fastest on a gentle 5 % descent. */
export function toblerKmh(slope) {
  return 6 * Math.exp(-3.5 * Math.abs(slope + 0.05));
}

const G = 9.81;
const AIR_DENSITY = 1.2;
const PUSH_KMH = 3.5; // walking next to the bike on very steep ground

/** Speed at constant power on a slope: P = v·(m·g·(Crr·cosθ + sinθ) + ½·ρ·CdA·v²). */
export function bikeKmh(slope, p) {
  const theta = Math.atan(slope);
  const force = p.mass * G * (p.crr * Math.cos(theta) + Math.sin(theta));
  const k = 0.5 * AIR_DENSITY * p.cda;
  const excess = (v) => v * (force + k * v * v) - p.power;
  let hi = p.vmax / 3.6;
  if (excess(hi) <= 0) return p.vmax;
  let lo = 0;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (excess(mid) > 0) hi = mid;
    else lo = mid;
  }
  return Math.max(PUSH_KMH, lo * 3.6);
}

/** Resolve a profile name or object, applying user overrides. */
export function resolveProfile(profile = 'hike', overrides = {}) {
  const base = typeof profile === 'string' ? PROFILES[profile] : profile;
  if (!base) throw new Error(`Unknown profile "${profile}". Use one of: ${Object.keys(PROFILES).join(', ')}`);
  return { ...base, ...overrides };
}

/** Speed in km/h on a slope for a resolved profile, times a fitness factor. */
export function speedKmh(slope, profile, speedFactor = 1) {
  const v = profile.kind === 'bike' ? bikeKmh(slope, profile) : toblerKmh(slope) * (profile.factor ?? 1);
  return v * speedFactor;
}
