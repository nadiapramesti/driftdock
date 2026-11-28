// Bridge to the Rust side. In a normal browser (dev preview) it falls back to sample data,
// so the UI can be designed and tested without Windows.
import { invoke as tauriInvoke, convertFileSrc } from '@tauri-apps/api/core'

export const isNative = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__

const MOCK_APPS = [
  'File Explorer', 'Google Chrome', 'Visual Studio Code', 'Spotify', 'Discord', 'Terminal', 'Figma', 'Notion',
  'Settings', 'Microsoft Edge', 'Word', 'Excel', 'PowerPoint', 'Photos', 'Calculator', 'Notepad', 'OBS Studio', 'Steam', 'WhatsApp', 'Telegram',
].map((name) => ({ name, path: `C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\${name}.lnk` }))

const MOCK_FILES = [
  ['Holiday 2025', 'folder'], ['holiday-bali-sunset.mp4', 'video'], ['holiday-alps-hike.jpg', 'image'], ['Holiday budget.xlsx', 'doc'],
  ['holiday-tokyo-night.mp4', 'video'], ['Invoices', 'folder'], ['Resume final v3.pdf', 'doc'], ['Screenshots', 'folder'], ['project-demo.mp4', 'video'],
].map(([name, kind], i) => ({ name, kind, path: `C:\\Users\\you\\Pictures\\${name}`, size: (i + 1) * 3_200_000, modified: 1_760_000_000 - i * 86400 }))

const mock = {
  list_apps: () => MOCK_APPS,
  app_icons: () => ({}),
  search_files: ({ q }) => MOCK_FILES.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())),
  get_dark_mode: () => true,
  weather: () => ({
    hours: Array.from({ length: 8 }, (_, i) => ({
      time: new Date(Date.now() + i * 3600e3).toISOString(), temp: 27 - Math.abs(i - 2), wind: 3.2, humidity: 70,
      symbol: ['clearsky_day', 'fair_day', 'partlycloudy_day', 'cloudy', 'rain', 'lightrainshowers_day', 'cloudy', 'fair_night'][i],
    })),
  }),
  rates: () => { throw new Error('offline preview') },
  get_sys: () => ({ media: { title: 'Night Drive', artist: 'Mira Sato', app: 'Spotify.exe', playing: true, art: null }, volume: 64, muted: false, battery: 78, charging: false }),
}

export async function call(cmd, args = {}) {
  if (isNative) return tauriInvoke(cmd, args)
  const f = mock[cmd]
  if (!f) { console.info('[preview]', cmd, args); return null }
  return f(args)
}

export const fileSrc = (path) => (isNative ? convertFileSrc(path) : null)

export async function onNative(event, fn) {
  if (!isNative) return () => {}
  const { listen } = await import('@tauri-apps/api/event')
  return listen(event, fn)
}

export async function onBlur(fn) {
  if (!isNative) return () => {}
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  return getCurrentWindow().onFocusChanged(({ payload }) => { if (!payload) fn() })
}

export async function showWindow() {
  if (!isNative) return
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  await getCurrentWindow().show()
}

export async function autostart(op) {
  if (!isNative) return op === 'get' ? false : null
  const m = await import('@tauri-apps/plugin-autostart')
  if (op === 'get') return m.isEnabled()
  return op ? m.enable() : m.disable()
}
