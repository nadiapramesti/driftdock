// Driftdock command engine — plain rules, fully offline. Text in, result object out.

export const ACCENTS = {
  amber: '#ffa94d', orange: '#ff8a3d', coral: '#ff6b6b', red: '#ff4d5e', pink: '#ff4fa3', rose: '#fb7185',
  purple: '#9b6bff', violet: '#9b6bff', blue: '#3b8bff', sky: '#38bdf8', cyan: '#38d6ff', teal: '#22d3c5',
  mint: '#7cf0c5', green: '#2fd28a', lime: '#a6e635', yellow: '#ffd23f', gold: '#f5b942', white: '#f4f7ff',
}
export const DEFAULT_ACCENT = ACCENTS.amber

export const CITIES = {
  jakarta: ['Jakarta', 'Asia/Jakarta', -6.2, 106.85], bandung: ['Bandung', 'Asia/Jakarta', -6.91, 107.61],
  surabaya: ['Surabaya', 'Asia/Jakarta', -7.25, 112.75], yogyakarta: ['Yogyakarta', 'Asia/Jakarta', -7.8, 110.36],
  medan: ['Medan', 'Asia/Jakarta', 3.59, 98.67], bali: ['Denpasar', 'Asia/Makassar', -8.65, 115.22],
  denpasar: ['Denpasar', 'Asia/Makassar', -8.65, 115.22], makassar: ['Makassar', 'Asia/Makassar', -5.14, 119.43],
  jayapura: ['Jayapura', 'Asia/Jayapura', -2.53, 140.72], singapore: ['Singapore', 'Asia/Singapore', 1.29, 103.85],
  'kuala lumpur': ['Kuala Lumpur', 'Asia/Kuala_Lumpur', 3.14, 101.69], bangkok: ['Bangkok', 'Asia/Bangkok', 13.75, 100.5],
  manila: ['Manila', 'Asia/Manila', 14.6, 120.98], tokyo: ['Tokyo', 'Asia/Tokyo', 35.68, 139.69], seoul: ['Seoul', 'Asia/Seoul', 37.57, 126.98],
  'hong kong': ['Hong Kong', 'Asia/Hong_Kong', 22.3, 114.17], beijing: ['Beijing', 'Asia/Shanghai', 39.9, 116.4],
  mumbai: ['Mumbai', 'Asia/Kolkata', 19.08, 72.88], dubai: ['Dubai', 'Asia/Dubai', 25.2, 55.27], riyadh: ['Riyadh', 'Asia/Riyadh', 24.71, 46.68],
  istanbul: ['Istanbul', 'Europe/Istanbul', 41.01, 28.98], london: ['London', 'Europe/London', 51.51, -0.13], paris: ['Paris', 'Europe/Paris', 48.86, 2.35],
  berlin: ['Berlin', 'Europe/Berlin', 52.52, 13.4], amsterdam: ['Amsterdam', 'Europe/Amsterdam', 52.37, 4.9], madrid: ['Madrid', 'Europe/Madrid', 40.42, -3.7],
  'new york': ['New York', 'America/New_York', 40.71, -74.01], nyc: ['New York', 'America/New_York', 40.71, -74.01],
  toronto: ['Toronto', 'America/Toronto', 43.65, -79.38], chicago: ['Chicago', 'America/Chicago', 41.88, -87.63],
  'los angeles': ['Los Angeles', 'America/Los_Angeles', 34.05, -118.24], la: ['Los Angeles', 'America/Los_Angeles', 34.05, -118.24],
  'san francisco': ['San Francisco', 'America/Los_Angeles', 37.77, -122.42], 'sao paulo': ['São Paulo', 'America/Sao_Paulo', -23.55, -46.63],
  sydney: ['Sydney', 'Australia/Sydney', -33.87, 151.21], melbourne: ['Melbourne', 'Australia/Melbourne', -37.81, 144.96],
  auckland: ['Auckland', 'Pacific/Auckland', -36.85, 174.76], cairo: ['Cairo', 'Africa/Cairo', 30.04, 31.24], lagos: ['Lagos', 'Africa/Lagos', 6.52, 3.38],
}

// Fallback rates per 1 USD — replaced by live ECB rates when online.
export const FALLBACK_RATES = { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 151.2, IDR: 16250, SGD: 1.35, AUD: 1.53, CAD: 1.37, INR: 83.4, MYR: 4.7, CNY: 7.2, KRW: 1380, THB: 36.5, PHP: 57, CHF: 0.88 }
const SYM = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', IDR: 'Rp', SGD: 'S$', AUD: 'A$', CAD: 'C$', INR: '₹', MYR: 'RM', CNY: '¥', KRW: '₩', THB: '฿', PHP: '₱', CHF: 'CHF ' }
const UNITS = {
  km: ['mi', 0.621371], mi: ['km', 1.609344], kg: ['lb', 2.20462], lb: ['kg', 0.453592], g: ['oz', 0.035274], oz: ['g', 28.3495],
  m: ['ft', 3.28084], ft: ['m', 0.3048], cm: ['in', 0.393701], in: ['cm', 2.54], l: ['gal', 0.264172], gal: ['l', 3.78541],
}

export const SETTINGS_URIS = {
  wifi: ['Wi‑Fi settings', 'ms-settings:network-wifi'], bluetooth: ['Bluetooth settings', 'ms-settings:bluetooth'],
  display: ['Display settings', 'ms-settings:display'], sound: ['Sound settings', 'ms-settings:sound'],
  battery: ['Battery settings', 'ms-settings:batterysaver'], taskbar: ['Taskbar settings', 'ms-settings:taskbar'],
  wallpaper: ['Background settings', 'ms-settings:personalization-background'], update: ['Windows Update', 'ms-settings:windowsupdate'],
  apps: ['Installed apps', 'ms-settings:appsfeatures'], network: ['Network settings', 'ms-settings:network'],
  'night light': ['Night light', 'ms-settings:nightlight'], airplane: ['Airplane mode', 'ms-settings:network-airplanemode'],
  focus: ['Notifications & focus', 'ms-settings:notifications'], storage: ['Storage', 'ms-settings:storagesense'],
}

export const CAPTIONS = {
  accent: 'Restyled in plain words.', radius: 'Restyled in plain words.', size: 'Restyled in plain words.', reset: 'Back to the original look.',
  app: 'Any app, from a few letters.', files: 'Your files, with previews.', calc: 'Answers while you type.',
  convert: 'Money and units, converted.', time: 'Any city, right now.', weather: 'Live weather, in the bar.',
  media: 'Music and volume, by command.', setting: 'Windows settings, one jump away.', theme: 'Light or dark, system‑wide.',
  help: 'Type an app, a file, a sum, or a command.', none: 'Nothing matched. Try one of the examples.', loading: 'Looking…',
}

// ---- tiny safe math parser (no eval) ----
function calc(src) {
  const s = src.replace(/×|x(?=\s*\d)/g, '*').replace(/÷/g, '/').replace(/,/g, '.').replace(/\s+/g, '')
  if (!/^[\d.+\-*/()%^]+$/.test(s) || !/\d/.test(s) || !/[+\-*/^%]/.test(s.replace(/^-/, ''))) return null
  let i = 0
  const peek = () => s[i]
  const num = () => {
    if (peek() === '(') { i++; const v = expr(); if (s[i++] !== ')') throw 0; return v }
    if (peek() === '-') { i++; return -factor() }
    const m = /^\d*\.?\d+/.exec(s.slice(i)); if (!m) throw 0
    i += m[0].length; let v = parseFloat(m[0])
    if (peek() === '%') { i++; v /= 100 }
    return v
  }
  const factor = () => { let b = num(); if (peek() === '^') { i++; b = Math.pow(b, factor()) } return b }
  const term = () => { let v = factor(); while (peek() === '*' || peek() === '/') { const o = s[i++]; const r = factor(); v = o === '*' ? v * r : v / r } return v }
  const expr = () => { let v = term(); while (peek() === '+' || peek() === '-') { const o = s[i++]; const r = term(); v = o === '+' ? v + r : v - r } return v }
  try { const v = expr(); if (i !== s.length || !isFinite(v)) return null; return v } catch { return null }
}

const fmtNum = (n, max = 6) => (Math.round(n * 10 ** max) / 10 ** max).toLocaleString('en-US', { maximumFractionDigits: max })

export function cityTime(tz) {
  return new Date().toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).toLowerCase()
}

// ---- app matching ----
const ALIASES = {
  vsc: 'visual studio code', vscode: 'visual studio code', code: 'visual studio code', chrome: 'google chrome', gc: 'google chrome',
  edge: 'microsoft edge', ppt: 'powerpoint', wa: 'whatsapp', tg: 'telegram', dc: 'discord', cmd: 'command prompt', ps: 'powershell',
  files: 'file explorer', explorer: 'file explorer', calc: 'calculator', yt: 'youtube',
}
function fuzzy(q, t) { let ti = 0; for (const ch of q) { ti = t.indexOf(ch, ti); if (ti < 0) return false; ti++ } return true }
const initials = (n) => n.split(/[\s\-_.]+/).filter(Boolean).map((w) => w[0]).join('').toLowerCase()

export function matchApps(q, apps) {
  const t = q.trim().toLowerCase()
  if (!t) return []
  const alias = ALIASES[t]
  return apps.map((a) => {
    const n = a.name.toLowerCase()
    let score = 0
    if (alias && n === alias) score = 120
    else if (n === t) score = 110
    else if (n.startsWith(t)) score = 100
    else if (alias && n.includes(alias)) score = 95
    else if (n.split(/\s+/).some((w) => w.startsWith(t))) score = 85
    else if (initials(a.name).startsWith(t) && t.length > 1) score = 80
    else if (t.length > 2 && fuzzy(t, n.replace(/\s/g, ''))) score = 40
    return { ...a, score }
  }).filter((a) => a.score > 0).sort((a, b) => b.score - a.score || a.name.length - b.name.length)
}

// ---- main ----
export function run(input, ctx = {}) {
  const raw = input.trim()
  const q = raw.toLowerCase()
  if (!q) return { type: 'help' }
  const rates = ctx.rates || FALLBACK_RATES

  if (q === 'reset' || q === 'reset dock' || q === 'reset look') return { type: 'reset', title: 'Dock reset to default', action: 'reset' }
  let m = q.match(/^(?:make it|accent(?: colou?r)?|colou?r|theme)\s+(\w+)$/) || (ACCENTS[q] ? [q, q] : null)
  if (m && ACCENTS[m[1]]) {
    return { type: 'accent', action: { accent: ACCENTS[m[1]] }, title: `Accent colour: ${m[1][0].toUpperCase()}${m[1].slice(1)}`, color: ACCENTS[m[1]] }
  }
  m = q.match(/^(?:corner )?(?:radius|corners?|round(?:ness)?)\s+(\d{1,3})%?$/)
  if (m) { const v = Math.min(100, +m[1]); return { type: 'radius', action: { radius: v }, title: `Corner radius ${v}%` } }
  m = q.match(/^(?:dock )?(?:size|scale)\s+(\d{2,3})%?$/)
  if (m) { const v = Math.max(60, Math.min(140, +m[1])); return { type: 'size', action: { size: v }, title: `Dock size ${v}%` } }

  // theme
  m = q.match(/^(dark|light)(?: mode| theme)?(?: (on|off))?$/)
  if (m) {
    const dark = m[1] === 'dark' ? m[2] !== 'off' : m[2] === 'off'
    return { type: 'theme', title: dark ? 'Windows: dark mode' : 'Windows: light mode', theme: dark }
  }
  // media + volume
  if (/^(play|pause|play\/pause|resume)$/.test(q)) return { type: 'media', title: 'Play / pause', media: ['play'] }
  if (/^(next|skip|next (song|track))$/.test(q)) return { type: 'media', title: 'Next track', media: ['next'] }
  if (/^(prev|previous|back)( (song|track))?$/.test(q)) return { type: 'media', title: 'Previous track', media: ['prev'] }
  if (/^(mute|unmute)$/.test(q)) return { type: 'media', title: 'Mute toggled', media: ['mute'] }
  m = q.match(/^(?:volume|vol)\s+(\d{1,3})%?$/)
  if (m) { const v = Math.min(100, +m[1]); return { type: 'media', title: `Volume ${v}%`, media: ['down', 50, 'up', Math.round(v / 2)] } }
  m = q.match(/^(?:volume|vol)\s+(up|down)$/)
  if (m) return { type: 'media', title: `Volume ${m[1]}`, media: [m[1], 5] }

  // windows settings
  m = q.match(/^(?:open )?(.+?)(?: settings)?$/)
  if (m && SETTINGS_URIS[m[1]] && (q.includes('settings') || q.startsWith('open ') || ['wifi', 'wi-fi', 'bluetooth'].includes(q))) {
    const [title, uri] = SETTINGS_URIS[m[1]]
    return { type: 'setting', title, uri }
  }
  if (q === 'wi-fi') return { type: 'setting', title: SETTINGS_URIS.wifi[0], uri: SETTINGS_URIS.wifi[1] }

  // currency
  m = q.match(/^([\d.,]+)\s*([a-z]{3})\s+(?:to|in|=|ke)\s+([a-z]{3})$/)
  if (m) {
    const from = m[2].toUpperCase(), to = m[3].toUpperCase()
    if (rates[from] && rates[to]) {
      const amt = parseFloat(m[1].replace(/,/g, ''))
      const out = (amt / rates[from]) * rates[to]
      const dec = ['IDR', 'JPY', 'KRW'].includes(to) ? 0 : 2
      const s = SYM[to] || `${to} `
      return {
        type: 'convert', title: `${s}${out.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`,
        sub: `${(SYM[from] || from + ' ')}${amt.toLocaleString('en-US')} → ${to} · ${ctx.ratesDate ? `ECB rate ${ctx.ratesDate}` : 'offline estimate'}`,
      }
    }
  }
  // units
  m = q.match(/^([\d.]+)\s*(km|mi|kg|lb|g|oz|m|ft|cm|in|l|gal)(?:\s+(?:to|in|ke)\s+(km|mi|kg|lb|g|oz|m|ft|cm|in|l|gal))?$/)
  if (m && UNITS[m[2]] && (!m[3] || UNITS[m[2]][0] === m[3])) {
    const [to, f] = UNITS[m[2]]
    return { type: 'convert', title: `${fmtNum(+m[1] * f, 2)} ${to}`, sub: `${m[1]} ${m[2]} → ${to}` }
  }
  m = q.match(/^(-?[\d.]+)\s*°?\s*(c|f)\s+(?:to|in|ke)\s+°?(c|f)$/)
  if (m && m[2] !== m[3]) {
    const v = +m[1]; const out = m[2] === 'c' ? v * 9 / 5 + 32 : (v - 32) * 5 / 9
    return { type: 'convert', title: `${fmtNum(out, 1)}°${m[3].toUpperCase()}`, sub: `${v}°${m[2].toUpperCase()} → °${m[3].toUpperCase()}` }
  }
  // time
  m = q.match(/^(?:time|what time is it|clock|jam)(?: in| at| di)?\s+(.+)$/) || q.match(/^(.+?)\s+time$/)
  if (m && CITIES[m[1].trim()]) {
    const [city, tz] = CITIES[m[1].trim()]
    const day = new Date().toLocaleDateString('en-US', { timeZone: tz, weekday: 'long', month: 'short', day: 'numeric' })
    return { type: 'time', title: cityTime(tz), sub: `${city} · ${day}` }
  }
  if (/^(weather|forecast|cuaca)/.test(q)) return { type: 'weather' }

  const v = calc(raw)
  if (v !== null) return { type: 'calc', title: fmtNum(v), sub: raw }

  const apps = matchApps(q, ctx.apps || []).slice(0, 5)
  const files = ctx.files || []
  if (apps.length && (apps[0].score >= 80 || !files.length)) return { type: 'app', apps, files }
  if (files.length) return { type: 'files', files, apps }
  if (ctx.filesPending && q.length >= 2) return { type: 'loading' }
  return { type: 'none' }
}

export const EXAMPLES = ['vsc', 'holiday', '12*8.5', '100 usd to idr', 'time in tokyo', 'weather', 'volume 40', 'next', 'dark mode', 'make it teal', 'corner radius 100', 'wifi settings']
