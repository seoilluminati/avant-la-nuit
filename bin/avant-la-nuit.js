#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { analyzeGpx, PROFILES } from '../src/index.js';

const USAGE = `Usage: avant-la-nuit <route.gpx> [options]

Will I be back before dark? Estimates timing along a GPX route and
compares it with sunset at the start point.

Options:
  -s, --start <time>     departure, ISO 8601 (default: now), e.g. 2026-10-25T09:30
  -p, --profile <name>   ${Object.keys(PROFILES).join(' | ')} (default: hike)
  -f, --speed <factor>   pace multiplier, 1.2 = 20 % faster than the model (default: 1)
  -b, --breaks <min>     minutes of stops per hour of moving (default: per profile)
  -d, --deadline <kind>  sunset | dusk (end of civil twilight) (default: sunset)
      --json             print the full result as JSON
  -h, --help             show this help
`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    start: { type: 'string', short: 's' },
    profile: { type: 'string', short: 'p', default: 'hike' },
    speed: { type: 'string', short: 'f', default: '1' },
    breaks: { type: 'string', short: 'b' },
    deadline: { type: 'string', short: 'd', default: 'sunset' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help || positionals.length !== 1) {
  process.stdout.write(USAGE);
  process.exit(values.help ? 0 : 1);
}

try {
  const result = analyzeGpx(readFileSync(positionals[0], 'utf8'), {
    start: values.start,
    profile: values.profile,
    speedFactor: Number(values.speed),
    breaks: values.breaks === undefined ? undefined : Number(values.breaks),
    deadline: values.deadline,
  });

  if (values.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exit(0);
  }

  const time = (ms) => (ms === null ? '—' : new Date(ms).toLocaleString(undefined, {
    weekday: 'short', hour: '2-digit', minute: '2-digit',
  }));
  const dur = (s) => `${Math.floor(Math.abs(s) / 3600)}h${String(Math.round((Math.abs(s) % 3600) / 60)).padStart(2, '0')}`;
  const km = (m) => `${(m / 1000).toFixed(1)} km`;

  const lines = [
    result.name ? `Route      ${result.name}` : null,
    `Distance   ${km(result.distance)}  +${Math.round(result.ascent)} m / -${Math.round(result.descent)} m`,
    `Duration   ${dur(result.totalSeconds)} (${values.profile}, stops included)`,
    `Start      ${time(result.start)}`,
    `Arrival    ${time(result.arrival)}`,
    `Sunset     ${time(result.sun.sunset)}   dark at ${time(result.sun.dusk)}`,
    `Start by   ${time(result.latestStart)} at the latest`,
    '',
  ];
  if (result.inTime) {
    lines.push(result.margin === null
      ? 'OK: no sunset today (polar day).'
      : `OK: back ${dur(result.margin)} before ${result.deadlineKind}.`);
  } else {
    const late = result.track[result.firstLateIndex];
    lines.push(`LATE: after ${result.deadlineKind} from ${km(late.dist)} on (${dur(-result.margin)} late).`);
    lines.push(result.turnaround
      ? `Turn back by ${km(result.turnaround.dist)} (${time(result.turnaround.time)}) to be at the start by ${time(result.turnaround.backAt)}.`
      : 'Too late to start: even turning back right away ends after the deadline.');
  }
  process.stdout.write(lines.filter((l) => l !== null).join('\n') + '\n');
  process.exit(result.inTime ? 0 : 2);
} catch (err) {
  process.stderr.write(`avant-la-nuit: ${err.message}\n`);
  process.exit(1);
}
