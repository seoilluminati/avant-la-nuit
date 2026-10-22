import { parseGpx, planRoute, bbox, distanceToTrack } from './src/index.js';

const I18N = {
  fr: {
    title: 'Avant la nuit',
    tagline: 'Serai-je rentré avant la nuit ?',
    settings: 'Réglages',
    dropTitle: 'Déposez une trace GPX',
    dropHint: "ou touchez pour choisir un fichier. Rien n'est envoyé : tout est calculé sur votre appareil.",
    sample: 'Essayer avec un exemple',
    start: 'Départ', profile: 'Activité', pace: 'Rythme', deadline: 'Rentré pour',
    p_hike: 'Randonnée', p_trail: 'Trail', p_road: 'Vélo de route', p_gravel: 'Gravel', p_mtb: 'VTT',
    s_075: 'Tranquille (−25 %)', s_09: 'Prudent (−10 %)', s_1: 'Normal', s_115: 'Sportif (+15 %)', s_13: 'Très sportif (+30 %)',
    d_sunset: 'le coucher du soleil', d_dusk: 'la fin du crépuscule',
    tzHint: 'Heures dans le fuseau horaire de votre appareil.',
    l_day: 'De jour', l_twilight: 'Crépuscule', l_night: 'De nuit', l_pnr: 'Point de non-retour',
    water: "💧 Chercher les points d'eau (OpenStreetMap)",
    waterHint: "Envoie seulement le rectangle de la zone à l'API Overpass, jamais votre trace.",
    waterLoading: 'Recherche des points d’eau…',
    waterNone: 'Aucun point d’eau connu à moins de 200 m de la trace.',
    waterError: 'Impossible de joindre Overpass pour le moment. Réessayez plus tard.',
    waterFound: (n) => `${n} point${n > 1 ? 's' : ''} d’eau à moins de 200 m de la trace :`,
    waterItem: (km, m, name) => `km ${km}${name ? ` — ${name}` : ''} (à ${m} m)`,
    howTitle: "Comment c'est calculé",
    how: 'La vitesse dépend de la pente : <a href="https://fr.wikipedia.org/wiki/Fonction_de_randonn%C3%A9e_de_Tobler">fonction de Tobler</a> pour la marche, modèle à puissance constante pour le vélo, pauses incluses. Le coucher du soleil est calculé pour un horizon plat : en montagne, les crêtes cachent le soleil plus tôt. Le <strong>point de non-retour</strong> est le dernier endroit d’où un demi-tour vous ramène au départ avant l’heure choisie.',
    disclaimer: 'Une estimation, pas une garantie. Prenez toujours une frontale, de la marge, et renseignez-vous sur la météo et le terrain.',
    source: 'Code source (MIT)', credits: 'Cartes © contributeurs OpenStreetMap',
    sunset: 'coucher du soleil', dusk: 'fin du crépuscule',
    okTitle: (dur, kind) => `Rentré ${dur} avant le ${kind}`,
    okBody: (arr) => `Arrivée estimée à ${arr}.`,
    polarDay: 'Pas de coucher du soleil aujourd’hui (jour polaire).',
    lateTitle: (dur, kind) => `${dur} après le ${kind}`,
    lateBody: (km, t) => `La nuit vous rattrape vers le km ${km} (${t}).`,
    turnBody: (km, t, back) => `Point de non-retour : faites demi-tour au plus tard au km ${km}, vers ${t}, pour être au départ à ${back}.`,
    tooLate: 'Même en faisant demi-tour tout de suite, vous rentrez après l’heure choisie.',
    startBy: (t) => `Ou partez avant ${t}.`,
    st_distance: 'Distance', st_climb: 'Dénivelé', st_duration: 'Durée (pauses incl.)', st_arrival: 'Arrivée',
    st_sunset: 'Coucher du soleil', st_dusk: 'Fin du crépuscule', st_latest: 'Départ au plus tard', st_pnr: 'Point de non-retour',
    profileCap: (name) => `${name ? name + ' — ' : ''}profil coloré selon la lumière au moment du passage.`,
    errGpx: 'Ce fichier ne contient pas de trace GPX lisible.',
    map: 'Carte', none: '—',
  },
  en: {
    title: 'Before Dark',
    tagline: 'Will I be back before dark?',
    settings: 'Settings',
    dropTitle: 'Drop a GPX route',
    dropHint: 'or tap to pick a file. Nothing is uploaded: everything runs on your device.',
    sample: 'Try an example',
    start: 'Start', profile: 'Activity', pace: 'Pace', deadline: 'Back by',
    p_hike: 'Hiking', p_trail: 'Trail running', p_road: 'Road cycling', p_gravel: 'Gravel', p_mtb: 'Mountain bike',
    s_075: 'Relaxed (−25%)', s_09: 'Careful (−10%)', s_1: 'Normal', s_115: 'Fit (+15%)', s_13: 'Very fit (+30%)',
    d_sunset: 'sunset', d_dusk: 'end of twilight',
    tzHint: "Times are in your device's time zone.",
    l_day: 'Daylight', l_twilight: 'Twilight', l_night: 'Dark', l_pnr: 'Point of no return',
    water: '💧 Find drinking water (OpenStreetMap)',
    waterHint: 'Only sends the area rectangle to the Overpass API, never your route.',
    waterLoading: 'Looking for drinking water…',
    waterNone: 'No known drinking water within 200 m of the route.',
    waterError: 'Could not reach Overpass right now. Try again later.',
    waterFound: (n) => `${n} drinking water point${n > 1 ? 's' : ''} within 200 m:`,
    waterItem: (km, m, name) => `km ${km}${name ? ` — ${name}` : ''} (${m} m off route)`,
    howTitle: 'How it works',
    how: 'Speed depends on slope: <a href="https://en.wikipedia.org/wiki/Tobler%27s_hiking_function">Tobler’s hiking function</a> on foot, a constant-power model on a bike, stops included. Sunset assumes a flat horizon: in the mountains, ridges hide the sun earlier. The <strong>point of no return</strong> is the last place where turning back still gets you to the start in time.',
    disclaimer: 'An estimate, not a guarantee. Always carry a headlamp, keep a margin and check weather and terrain.',
    source: 'Source code (MIT)', credits: 'Maps © OpenStreetMap contributors',
    sunset: 'sunset', dusk: 'end of twilight',
    okTitle: (dur, kind) => `Back ${dur} before ${kind}`,
    okBody: (arr) => `Estimated arrival ${arr}.`,
    polarDay: 'No sunset today (polar day).',
    lateTitle: (dur, kind) => `${dur} after ${kind}`,
    lateBody: (km, t) => `Darkness catches you around km ${km} (${t}).`,
    turnBody: (km, t, back) => `Point of no return: turn back by km ${km}, around ${t}, to be at the start by ${back}.`,
    tooLate: 'Even turning back right now, you would be back after your deadline.',
    startBy: (t) => `Or start before ${t}.`,
    st_distance: 'Distance', st_climb: 'Climb', st_duration: 'Time (with stops)', st_arrival: 'Arrival',
    st_sunset: 'Sunset', st_dusk: 'End of twilight', st_latest: 'Latest start', st_pnr: 'Point of no return',
    profileCap: (name) => `${name ? name + ' — ' : ''}profile coloured by daylight when you get there.`,
    errGpx: 'This file does not contain a readable GPX track.',
    map: 'Map', none: '—',
  },
};

const $ = (id) => document.getElementById(id);
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

let lang = store.get('lang') || (navigator.language || 'fr').slice(0, 2);
if (!I18N[lang]) lang = 'en';
const t = (key, ...args) => {
  const v = I18N[lang][key] ?? I18N.en[key];
  return typeof v === 'function' ? v(...args) : v;
};

let route = null; // { name, points }
let map, layers;

function applyLang() {
  document.documentElement.lang = lang;
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  $('lang').textContent = lang === 'fr' ? 'EN' : 'FR';
  if (route) render();
}

const fmtTime = (ms) => (ms === null ? t('none') : new Intl.DateTimeFormat(lang, {
  hour: '2-digit', minute: '2-digit',
}).format(ms));
const fmtDur = (s) => {
  const m = Math.round(Math.abs(s) / 60);
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
};
const fmtKm = (m) => (m / 1000).toLocaleString(lang, { maximumFractionDigits: 1 });

function defaultStart() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}
const toLocalInput = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function loadGpx(text) {
  try {
    route = parseGpx(text);
  } catch {
    alert(t('errGpx'));
    return;
  }
  $('waterList').innerHTML = '';
  $('waterInfo').textContent = t('waterHint');
  render();
  $('result').hidden = false;
  setTimeout(() => { map.invalidateSize(); fitMap(); }, 0);
  $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function currentPlan() {
  return planRoute(route.points, {
    start: new Date($('start').value || defaultStart()),
    profile: $('profile').value,
    speedFactor: Number($('speed').value),
    deadline: $('deadline').value,
  });
}

function render() {
  const plan = currentPlan();
  const kind = t(plan.deadlineKind);

  // Verdict
  const v = $('verdict');
  if (plan.inTime) {
    v.className = 'verdict ok';
    v.innerHTML = plan.margin === null
      ? `<strong>${t('polarDay')}</strong>`
      : `<strong>${t('okTitle', fmtDur(plan.margin), kind)}</strong>${t('okBody', fmtTime(plan.arrival))}`;
  } else {
    const late = plan.track[plan.firstLateIndex];
    const lines = [
      `<strong>${t('lateTitle', fmtDur(-plan.margin), kind)}</strong>`,
      t('lateBody', fmtKm(late.dist), fmtTime(late.time)),
      plan.turnaround
        ? t('turnBody', fmtKm(plan.turnaround.dist), fmtTime(plan.turnaround.time), fmtTime(plan.turnaround.backAt))
        : t('tooLate'),
    ];
    if (plan.latestStart !== null) lines.push(t('startBy', fmtTime(plan.latestStart)));
    v.className = 'verdict late';
    v.innerHTML = lines.join('<br>');
  }

  // Stats
  const stats = [
    ['st_distance', `${fmtKm(plan.distance)} km`],
    ['st_climb', `+${Math.round(plan.ascent)} m / −${Math.round(plan.descent)} m`],
    ['st_duration', fmtDur(plan.totalSeconds)],
    ['st_arrival', fmtTime(plan.arrival)],
    ['st_sunset', fmtTime(plan.sun.sunset)],
    ['st_dusk', fmtTime(plan.sun.dusk)],
    ['st_latest', fmtTime(plan.latestStart)],
  ];
  if (plan.turnaround) stats.push(['st_pnr', `km ${fmtKm(plan.turnaround.dist)} · ${fmtTime(plan.turnaround.time)}`, true]);
  $('stats').innerHTML = stats
    .map(([k, val, key]) => `<div${key ? ' class="key"' : ''}><dt>${t(k)}</dt><dd>${val}</dd></div>`)
    .join('');

  drawMap(plan);
  drawProfile(plan);
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Split the track into runs of identical light so each run gets one colour. */
function runs(track) {
  const out = [];
  let cur = null;
  track.forEach((p, i) => {
    if (!cur || cur.light !== p.light) {
      cur = { light: p.light, pts: cur ? [cur.pts[cur.pts.length - 1]] : [] };
      out.push(cur);
    }
    cur.pts.push(i);
  });
  return out;
}

function initMap() {
  map = L.map('map', { zoomControl: true, attributionControl: true });
  const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  });
  const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
  });
  topo.addTo(map);
  L.control.layers({ OpenTopoMap: topo, OpenStreetMap: osm }).addTo(map);
  layers = L.layerGroup().addTo(map);
  map.setView([45.9, 6.87], 11);
}

function fitMap() {
  if (!route) return;
  const [s, w, n, e] = bbox(route.points);
  map.fitBounds([[s, w], [n, e]], { padding: [20, 20] });
}

function drawMap(plan) {
  layers.clearLayers();
  const colors = { day: cssVar('--day'), twilight: cssVar('--twilight'), night: cssVar('--night') };
  for (const r of runs(plan.track)) {
    L.polyline(r.pts.map((i) => [plan.track[i].lat, plan.track[i].lon]), {
      color: colors[r.light], weight: 5, opacity: 0.9,
    }).addTo(layers);
  }
  const first = plan.track[0];
  L.circleMarker([first.lat, first.lon], { radius: 7, color: '#fff', weight: 2, fillColor: colors.day, fillOpacity: 1 })
    .bindTooltip(`${t('start')} · ${fmtTime(plan.start)}`).addTo(layers);
  if (plan.turnaround) {
    const p = plan.track[plan.turnaround.index];
    L.marker([p.lat, p.lon], {
      icon: L.divIcon({ className: 'pnr-icon', html: '⛔', iconSize: [24, 24], iconAnchor: [12, 12] }),
      title: t('l_pnr'),
    }).bindPopup(`<b>${t('l_pnr')}</b><br>km ${fmtKm(p.dist)} · ${fmtTime(p.time)}`).addTo(layers);
  }
}

function drawProfile(plan) {
  const svg = $('profileSvg');
  const W = 1000, H = 130, pad = 4;
  const tr = plan.track;
  const maxD = tr[tr.length - 1].dist || 1;
  const eles = tr.map((p) => p.ele);
  const lo = Math.min(...eles), hi = Math.max(...eles);
  const span = Math.max(hi - lo, 50);
  const x = (d) => (d / maxD) * W;
  const y = (e) => H - pad - ((e - lo) / span) * (H - 2 * pad - 10);
  const colors = { day: cssVar('--day'), twilight: cssVar('--twilight'), night: cssVar('--night') };

  // Downsample to ~1 point per pixel column.
  const step = Math.max(1, Math.floor(tr.length / W));
  const parts = [];
  for (const r of runs(tr)) {
    const idx = r.pts.filter((_, k) => k % step === 0 || k === r.pts.length - 1);
    const d = idx.map((i, k) => `${k ? 'L' : 'M'}${x(tr[i].dist).toFixed(1)},${y(tr[i].ele).toFixed(1)}`).join('');
    const area = `${d}L${x(tr[idx[idx.length - 1]].dist).toFixed(1)},${H}L${x(tr[idx[0]].dist).toFixed(1)},${H}Z`;
    parts.push(`<path d="${area}" fill="${colors[r.light]}" opacity=".18"/>`);
    parts.push(`<path d="${d}" fill="none" stroke="${colors[r.light]}" stroke-width="3" vector-effect="non-scaling-stroke"/>`);
  }
  if (plan.turnaround) {
    const px = x(plan.turnaround.dist).toFixed(1);
    parts.push(`<line x1="${px}" x2="${px}" y1="0" y2="${H}" stroke="${colors.night}" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>`);
  }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = parts.join('');
  $('profileCap').textContent = `${t('profileCap', route.name)} ${Math.round(lo)}–${Math.round(hi)} m`;
}

// Public Overpass servers are often busy: try a few, each with a time limit.
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
async function overpass(query) {
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) return await res.json();
    } catch { /* try the next server */ }
  }
  throw new Error('All Overpass servers failed');
}

async function findWater() {
  if (!route) return;
  const info = $('waterInfo');
  const list = $('waterList');
  const btn = $('waterBtn');
  if (btn.disabled) return;
  btn.disabled = true;
  info.textContent = t('waterLoading');
  list.innerHTML = '';
  const [s, w, n, e] = bbox(route.points);
  const m = 0.003; // ~300 m margin
  const box = [s - m, w - m, n + m, e + m].map((v) => v.toFixed(5)).join(',');
  const query = `[out:json][timeout:25];(node["amenity"="drinking_water"](${box});node["amenity"="fountain"]["drinking_water"="yes"](${box});node["natural"="spring"]["drinking_water"="yes"](${box}););out;`;
  try {
    const { elements } = await overpass(query);
    const plan = currentPlan();
    const found = elements
      .map((el) => ({ el, ...distanceToTrack({ lat: el.lat, lon: el.lon }, route.points) }))
      .filter((f) => f.distance <= 200)
      .sort((a, b) => plan.track[a.index].dist - plan.track[b.index].dist);
    if (!found.length) { info.textContent = t('waterNone'); return; }
    info.textContent = t('waterFound', found.length);
    for (const f of found) {
      const km = fmtKm(plan.track[f.index].dist);
      const li = document.createElement('li');
      li.textContent = t('waterItem', km, Math.round(f.distance), f.el.tags?.name);
      list.append(li);
      L.marker([f.el.lat, f.el.lon], {
        icon: L.divIcon({ className: 'water-icon', html: '💧', iconSize: [18, 18], iconAnchor: [9, 9] }),
      }).bindTooltip(escapeHtml(li.textContent)).addTo(layers);
    }
  } catch {
    info.textContent = t('waterError');
  } finally {
    btn.disabled = false;
  }
}

function readFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => loadGpx(String(reader.result));
  reader.readAsText(file);
}

function init() {
  initMap();
  $('start').value = toLocalInput(defaultStart());
  applyLang();

  $('lang').addEventListener('click', () => {
    lang = lang === 'fr' ? 'en' : 'fr';
    store.set('lang', lang);
    applyLang();
  });
  $('file').addEventListener('change', (e) => readFile(e.target.files[0]));
  const drop = $('drop');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    readFile(e.dataTransfer.files[0]);
  });
  $('sample').addEventListener('click', async () => {
    // The example shows a late start on purpose, so the point of no return appears.
    const d = new Date();
    d.setHours(12, 30, 0, 0);
    $('start').value = toLocalInput(d);
    $('profile').value = 'hike';
    const res = await fetch('examples/chamonix-synthetic.gpx');
    loadGpx(await res.text());
  });
  for (const id of ['start', 'profile', 'speed', 'deadline']) {
    $(id).addEventListener('change', () => route && render());
  }
  $('waterBtn').addEventListener('click', findWater);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => route && render());

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();
