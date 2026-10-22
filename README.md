# Avant la nuit · Before Dark

[![CI](https://github.com/seoilluminati/avant-la-nuit/actions/workflows/ci.yml/badge.svg)](https://github.com/seoilluminati/avant-la-nuit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen.svg)

**Will I be back before dark?** Drop a GPX hiking or cycling route, pick a start time,
and get:

- 🟢🟠🔴 **the route coloured by daylight**: where you will be in daylight, in twilight, or in the dark;
- ⛔ **the point of no return**: the last place where turning back still gets you to the start before sunset;
- ⏰ **the latest start time** that still finishes in daylight;
- 💧 optional **drinking water points** within 200 m of the route (OpenStreetMap).

**→ Try it: https://seoilluminati.github.io/avant-la-nuit/** (no account, works offline, your GPX never leaves your device)

🇫🇷 [Lire en français](README.fr.md)

## Why

Getting caught out by nightfall is one of the most common reasons hikers call
mountain rescue. It usually happens to healthy, well-equipped people who simply
started too late, or did not turn back in time. Route planners show distance and
duration, but none of them answer the one question that matters at 3 pm on a
November afternoon: *if I keep going, will I make it back before dark, and where
is the last safe place to turn around?*

`avant-la-nuit` answers it in a few milliseconds, entirely on your device.

## How it works

| Step | Method |
|------|--------|
| Read the route | Dependency-free GPX parser (tracks, falling back to routes; namespaced files OK) |
| Clean elevation | Missing values interpolated, ±60 m distance-window smoothing, 3 m hysteresis for climb totals |
| Speed on foot | [Tobler's hiking function](https://en.wikipedia.org/wiki/Tobler%27s_hiking_function), slightly conservative by default |
| Speed on a bike | Steady-power model (rolling resistance + gravity + air drag), capped on descents, never below walking-the-bike speed |
| Stops | Minutes per hour of moving time (per profile, adjustable) |
| Sun | Solar position from the Astronomical Almanac formulas (≈1 min accuracy); sunset at −0.833°, end of civil twilight at −6° |
| Point of no return | Last point *i* where `time to reach i + time to walk back from i` ≤ deadline (back time recomputed with the slopes reversed) |

Sunset is computed for a **flat horizon on purpose**: in a valley, ridges hide the sun
earlier, so crediting the hiker's altitude would make the estimate less safe.

> ⚠️ This is an estimate, not a safety guarantee. Always carry a headlamp, keep a margin,
> and check the weather and the terrain.

## Use it as a library

```bash
npm install github:seoilluminati/avant-la-nuit
```

```js
import { analyzeGpx } from 'avant-la-nuit';

const plan = analyzeGpx(gpxString, {
  start: '2026-10-25T12:30:00+01:00',
  profile: 'hike',        // hike | trail | road | gravel | mtb, or a custom profile object
  speedFactor: 1,         // 1.2 = 20 % faster than the model
  deadline: 'sunset',     // or 'dusk' (end of civil twilight)
});

plan.inTime;        // false
plan.margin;        // seconds between arrival and deadline (negative = late)
plan.latestStart;   // epoch ms
plan.turnaround;    // { index, dist, time, backAt } or null
plan.track;         // [{ lat, lon, ele, dist, time, light: 'day' | 'twilight' | 'night' }]
```

Also exported: `parseGpx`, `planRoute`, `sunTimes`, `sunAltitude`, `lightAt`,
`toblerKmh`, `bikeKmh`, `PROFILES`, `distance`, `distanceToTrack`. Zero dependencies,
plain ES modules, works in browsers, Node ≥ 18.3, Deno, Bun and workers.

## Use it from the command line

```bash
npx github:seoilluminati/avant-la-nuit examples/chamonix-synthetic.gpx --start 2026-10-25T12:30
```

```
Route      Example: out-and-back climb above Chamonix (synthetic)
Distance   23.2 km  +1510 m / -1510 m
Duration   8h43 (hike, stops included)
Start      Sun 12:30 PM
Arrival    Sun 09:12 PM
Sunset     Sun 05:31 PM   dark at Sun 06:02 PM
Start by   Sun 08:49 AM at the latest

LATE: after sunset from 12.0 km on (3h41 late).
Turn back by 6.1 km (Sun 03:21 PM) to be at the start by Sun 05:30 PM.
```

Exit code is `0` when you are back in time and `2` when you are not, so it can be used in scripts.
`--json` prints the full result.

## Run the web app locally

```bash
npm start   # http://localhost:8787
npm test
```

No build step. `web/` is the app, `src/` is the library it imports.

## Privacy

The GPX file is read and processed in your browser and is never uploaded. The only
network requests are map tiles (OpenStreetMap / OpenTopoMap) and, if you press the
water button, one Overpass API query containing the route's bounding box.

## Roadmap

Ideas welcome in [issues](https://github.com/seoilluminati/avant-la-nuit/issues):

- terrain-aware sunset (horizon from a DEM, so valleys get an earlier sunset);
- "commit point" for loops: where continuing becomes quicker than turning back;
- multi-day routes with overnight stops;
- more languages (the UI is two dictionaries in `web/app.js`).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Bug reports with a GPX file and the expected
timing are the most useful contributions.

## License

[MIT](LICENSE). Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
