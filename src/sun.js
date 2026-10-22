// Solar position and sunrise/sunset times, after the low-precision formulas of
// the Astronomical Almanac (accurate to about a minute at mid latitudes).

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const J0 = 0.0009;
const OBLIQUITY = 23.4397 * RAD;

/** Sun altitude (degrees above horizon) giving "sunset" for a sea-level observer. */
export const SUNSET_ALTITUDE = -0.833;
/** End of civil twilight: too dark to walk without a light. */
export const CIVIL_ALTITUDE = -6;

const toDays = (ms) => ms / DAY_MS - 0.5 + J1970 - J2000;
const fromJulian = (j) => Math.round((j + 0.5 - J1970) * DAY_MS);

const meanAnomaly = (d) => (357.5291 + 0.98560028 * d) * RAD;
function eclipticLongitude(M) {
  const center = (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) * RAD;
  return M + center + 102.9372 * RAD + Math.PI;
}
const declination = (L) => Math.asin(Math.sin(L) * Math.sin(OBLIQUITY));
const rightAscension = (L) => Math.atan2(Math.sin(L) * Math.cos(OBLIQUITY), Math.cos(L));

/** Geometric altitude of the sun's centre, in degrees, at a time (ms) and place. */
export function sunAltitude(ms, lat, lon) {
  const d = toDays(ms);
  const L = eclipticLongitude(meanAnomaly(d));
  const dec = declination(L);
  const hourAngle = (280.16 + 360.9856235 * d + lon) * RAD - rightAscension(L);
  const phi = lat * RAD;
  return Math.asin(
    Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(hourAngle),
  ) / RAD;
}

/**
 * Light conditions at a time and place.
 * @returns {'day'|'twilight'|'night'}
 */
export function lightAt(ms, lat, lon) {
  const alt = sunAltitude(ms, lat, lon);
  if (alt >= SUNSET_ALTITUDE) return 'day';
  if (alt >= CIVIL_ALTITUDE) return 'twilight';
  return 'night';
}

/**
 * Sun events for the solar day nearest to `ms` at a place.
 * Elevation (metres) lowers the visible horizon, so the sun sets later on a summit.
 * Times are epoch milliseconds, or null when the event does not happen
 * (polar day / polar night): check `polarDay` / `polarNight`.
 */
export function sunTimes(ms, lat, lon, elevation = 0) {
  const n = Math.round(toDays(ms) - J0 + lon / 360);
  const ds = J0 - lon / 360 + n;
  const M = meanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L);
  const phi = lat * RAD;
  const transit = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);

  function event(altitude) {
    const cosW =
      (Math.sin(altitude * RAD) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
    if (cosW < -1) return { always: 'up' };
    if (cosW > 1) return { always: 'down' };
    const w = Math.acos(cosW);
    const set = J2000 + J0 + w / (2 * Math.PI) - lon / 360 + n +
      0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    return { rise: fromJulian(transit - (set - transit)), set: fromJulian(set) };
  }

  const dip = elevation > 0 ? (2.076 * Math.sqrt(elevation)) / 60 : 0;
  const sun = event(SUNSET_ALTITUDE - dip);
  const civil = event(CIVIL_ALTITUDE);
  return {
    solarNoon: fromJulian(transit),
    sunrise: sun.rise ?? null,
    sunset: sun.set ?? null,
    dawn: civil.rise ?? null,
    dusk: civil.set ?? null,
    polarDay: sun.always === 'up',
    polarNight: sun.always === 'down',
  };
}
