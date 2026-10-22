// Minimal, dependency-free GPX reader. Works in browsers, Node and workers
// (no DOMParser needed). Reads track points, falling back to route points.

const POINT_RE = (tag) =>
  new RegExp(`<((?:[\\w-]+:)?${tag})\\b([^>]*?)(?:\\/>|>([\\s\\S]*?)<\\/\\1\\s*>)`, 'g');
const ATTR_RE = (name) => new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`);
const ELE_RE = /<(?:[\w-]+:)?ele>\s*([-+0-9.eE]+)\s*</;
const TIME_RE = /<(?:[\w-]+:)?time>\s*([^<\s]+)\s*</;
const NAME_RE = /<(?:[\w-]+:)?name>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/(?:[\w-]+:)?name>/;

function decode(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&amp;/g, '&');
}

function readPoints(xml, tag) {
  const out = [];
  for (const m of xml.matchAll(POINT_RE(tag))) {
    const lat = parseFloat(m[2].match(ATTR_RE('lat'))?.[1]);
    const lon = parseFloat(m[2].match(ATTR_RE('lon'))?.[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const body = m[3] || '';
    const ele = parseFloat(body.match(ELE_RE)?.[1]);
    const time = body.match(TIME_RE)?.[1];
    out.push({ lat, lon, ele: Number.isFinite(ele) ? ele : null, ...(time ? { time } : {}) });
  }
  return out;
}

/**
 * Parse a GPX document.
 * @param {string} xml
 * @returns {{ name: string|null, points: {lat:number, lon:number, ele:number|null}[] }}
 */
export function parseGpx(xml) {
  if (typeof xml !== 'string') throw new TypeError('parseGpx expects a string');
  let points = readPoints(xml, 'trkpt');
  if (points.length < 2) points = readPoints(xml, 'rtept');
  if (points.length < 2) throw new Error('No track or route with at least 2 points found in GPX');

  const trk = xml.search(/<(?:[\w-]+:)?(trk|rte)\b/);
  const nameMatch = (trk >= 0 ? xml.slice(trk) : xml).match(NAME_RE) || xml.match(NAME_RE);
  const name = nameMatch ? decode(nameMatch[1]).trim() || null : null;
  return { name, points };
}
