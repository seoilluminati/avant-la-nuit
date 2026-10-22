import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseGpx, planRoute, analyzeGpx, sunTimes, lightAt, toblerKmh, bikeKmh, PROFILES, distance,
} from '../src/index.js';

const MIN = 60_000;
const near = (actual, expectedIso, toleranceMin, label) => {
  const diff = Math.abs(actual - Date.parse(expectedIso)) / MIN;
  assert.ok(diff <= toleranceMin, `${label}: ${new Date(actual).toISOString()} vs ${expectedIso} (${diff.toFixed(1)} min)`);
};

// Reference times from the US Naval Observatory / timeanddate.com.
test('sunTimes matches published sunrise/sunset within 2 minutes', () => {
  const paris = sunTimes(Date.parse('2026-06-21T12:00:00Z'), 48.8566, 2.3522);
  near(paris.sunrise, '2026-06-21T03:47:00Z', 2, 'Paris sunrise');
  near(paris.sunset, '2026-06-21T19:58:00Z', 2, 'Paris sunset');

  const parisWinter = sunTimes(Date.parse('2026-12-21T12:00:00Z'), 48.8566, 2.3522);
  near(parisWinter.sunset, '2026-12-21T15:56:00Z', 2, 'Paris winter sunset');

  const sf = sunTimes(Date.parse('2026-06-21T20:00:00Z'), 37.7749, -122.4194);
  near(sf.sunset, '2026-06-22T03:35:00Z', 2, 'San Francisco sunset');

  const sydney = sunTimes(Date.parse('2026-03-20T02:00:00Z'), -33.8688, 151.2093);
  near(sydney.sunset, '2026-03-20T08:09:00Z', 2, 'Sydney sunset');
});

test('dusk comes after sunset, dawn before sunrise', () => {
  const s = sunTimes(Date.parse('2026-10-25T12:00:00Z'), 45.92, 6.87);
  assert.ok(s.dawn < s.sunrise && s.sunrise < s.solarNoon && s.solarNoon < s.sunset && s.sunset < s.dusk);
});

test('polar day and polar night are reported, not invented', () => {
  const summer = sunTimes(Date.parse('2026-06-21T12:00:00Z'), 69.65, 18.96);
  assert.equal(summer.polarDay, true);
  assert.equal(summer.sunset, null);
  const winter = sunTimes(Date.parse('2026-12-21T12:00:00Z'), 69.65, 18.96);
  assert.equal(winter.polarNight, true);
  assert.equal(winter.sunrise, null);
});

test('lightAt classifies day, twilight and night', () => {
  const s = sunTimes(Date.parse('2026-10-25T12:00:00Z'), 45.92, 6.87);
  assert.equal(lightAt(s.solarNoon, 45.92, 6.87), 'day');
  assert.equal(lightAt((s.sunset + s.dusk) / 2, 45.92, 6.87), 'twilight');
  assert.equal(lightAt(s.dusk + 60 * MIN, 45.92, 6.87), 'night');
});

test('Tobler: about 5 km/h on the flat, fastest on a gentle descent, slow when steep', () => {
  assert.ok(Math.abs(toblerKmh(0) - 5.04) < 0.01);
  assert.ok(toblerKmh(-0.05) > toblerKmh(0));
  assert.ok(toblerKmh(0.3) < 2.5);
});

test('bike model: plausible flat speed, slower uphill, capped downhill', () => {
  const flat = bikeKmh(0, PROFILES.road);
  assert.ok(flat > 25 && flat < 35, `road flat ${flat}`);
  assert.ok(bikeKmh(0.08, PROFILES.road) < 15);
  assert.equal(bikeKmh(-0.15, PROFILES.road), PROFILES.road.vmax);
  assert.ok(bikeKmh(0, PROFILES.mtb) < flat);
  assert.ok(bikeKmh(0.6, PROFILES.mtb) >= 3.5, 'never slower than pushing the bike');
});

test('parseGpx reads trkpt in any attribute order, rtept fallback, missing ele, names', () => {
  const trk = parseGpx(`<gpx><trk><name>A &amp; B</name><trkseg>
    <trkpt lon="2.0" lat="48.0"><ele>100</ele></trkpt>
    <trkpt lat='48.001' lon='2.001'/>
  </trkseg></trk></gpx>`);
  assert.equal(trk.name, 'A & B');
  assert.deepEqual(trk.points, [
    { lat: 48, lon: 2, ele: 100 },
    { lat: 48.001, lon: 2.001, ele: null },
  ]);

  const rte = parseGpx(`<gpx:gpx><gpx:rte><gpx:rtept lat="1" lon="1"/><gpx:rtept lat="1.01" lon="1"/></gpx:rte></gpx:gpx>`);
  assert.equal(rte.points.length, 2);

  assert.throws(() => parseGpx('<gpx></gpx>'), /No track/);
});

test('distance: one degree of latitude is about 111 km', () => {
  const d = distance({ lat: 45, lon: 6 }, { lat: 46, lon: 6 });
  assert.ok(Math.abs(d - 111_195) < 200);
});

const line = (km, n = 200, climb = 0) =>
  Array.from({ length: n + 1 }, (_, i) => ({
    lat: 45 + (km / 111.195) * (i / n), lon: 6, ele: 500 + climb * (i / n),
  }));

test('planRoute: flat 10 km hike takes about 2h30 with stops', () => {
  const plan = planRoute(line(10), { start: '2026-06-21T06:00:00Z', profile: 'hike' });
  assert.ok(Math.abs(plan.distance - 10_000) < 20);
  const hours = plan.totalSeconds / 3600;
  assert.ok(hours > 2.2 && hours < 2.8, `${hours} h`);
  assert.equal(plan.inTime, true);
  assert.equal(plan.turnaround, null);
});

test('planRoute: climbing costs time and is counted in ascent', () => {
  const flat = planRoute(line(8), { start: '2026-06-21T06:00:00Z' });
  const steep = planRoute(line(8, 200, 1000), { start: '2026-06-21T06:00:00Z' });
  assert.ok(steep.totalSeconds > flat.totalSeconds * 1.5);
  assert.ok(Math.abs(steep.ascent - 1000) < 30);
});

test('planRoute: late start gives a turnaround point that really is back by the deadline', () => {
  const gpx = readFileSync(new URL('../examples/chamonix-synthetic.gpx', import.meta.url), 'utf8');
  const plan = analyzeGpx(gpx, { start: '2026-10-25T12:30:00+01:00', profile: 'hike' });
  assert.equal(plan.inTime, false);
  assert.ok(plan.margin < 0);
  assert.ok(plan.firstLateIndex > 0);
  const t = plan.turnaround;
  assert.ok(t && t.index > 0 && t.index < plan.firstLateIndex);
  assert.ok(t.backAt <= plan.deadline);
  assert.ok(plan.latestStart < plan.start);

  // Starting at the latest start time finishes exactly at the deadline.
  const onTime = analyzeGpx(gpx, { start: plan.latestStart, profile: 'hike' });
  assert.ok(Math.abs(onTime.arrival - plan.deadline) < 1000);
  assert.equal(onTime.inTime, true);
});

test('planRoute: dusk deadline is later than sunset deadline', () => {
  const pts = line(10);
  const a = planRoute(pts, { start: '2026-10-25T10:00:00Z', deadline: 'sunset' });
  const b = planRoute(pts, { start: '2026-10-25T10:00:00Z', deadline: 'dusk' });
  assert.ok(b.deadline > a.deadline);
  assert.ok(b.latestStart > a.latestStart);
});

test('planRoute: faster factor shortens the trip, unknown profile throws', () => {
  const pts = line(10);
  const slow = planRoute(pts, { start: 0, speedFactor: 0.8 });
  const fast = planRoute(pts, { start: 0, speedFactor: 1.2 });
  assert.ok(fast.totalSeconds < slow.totalSeconds);
  assert.throws(() => planRoute(pts, { profile: 'jetpack' }), /Unknown profile/);
});

test('planRoute: elevation noise does not inflate ascent on a flat route', () => {
  const pts = line(5, 500).map((p, i) => ({ ...p, ele: 500 + (i % 2 ? 4 : -4) }));
  const plan = planRoute(pts, { start: 0 });
  assert.ok(plan.ascent < 40, `ascent ${plan.ascent}`);
});
