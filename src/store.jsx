import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_ACCENT, FALLBACK_RATES } from './engine.js'
import { call } from './native.js'

export const DEFAULTS = {
  accent: DEFAULT_ACCENT, radius: 42, size: 100, city: 'jakarta',
  widgets: { media: true, volume: true, session: true, weather: true },
  pinned: null, // filled with sensible defaults on first run
  quick: ['dark', 'wifi', 'bluetooth', 'nightlight', 'focus', 'display', 'sound', 'battery', 'snip'],
  events: [], limits: null,
}
const DEFAULT_PINS = ['file explorer', 'google chrome', 'microsoft edge', 'visual studio code', 'spotify', 'discord', 'whatsapp', 'terminal', 'settings']

const KEY = 'driftdock.v1'
const load = () => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return DEFAULTS } }

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [s, setS] = useState(load)
  const [apps, setApps] = useState([])
  const [icons, setIcons] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY + '.icons') || '{}') } catch { return {} } })
  const [rates, setRates] = useState({ map: FALLBACK_RATES, date: null })
  const [toast, setToast] = useState(null)
  const [bounce, setBounce] = useState(null)
  const started = useRef(Date.now())
  const t = useRef()

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {} }, [s])
  useEffect(() => { document.documentElement.style.setProperty('--accent', s.accent) }, [s.accent])

  const patch = useCallback((p) => setS((o) => ({ ...o, ...(typeof p === 'function' ? p(o) : p) })), [])

  // apps + icons (icons cached across launches; extracted once in the background)
  useEffect(() => {
    let alive = true
    call('list_apps').then(async (list) => {
      if (!alive || !list) return
      setApps(list)
      setS((o) => {
        if (o.pinned) return o
        const byName = Object.fromEntries(list.map((a) => [a.name.toLowerCase(), a.path]))
        return { ...o, pinned: DEFAULT_PINS.map((n) => byName[n]).filter(Boolean).slice(0, 8) }
      })
      const cached = JSON.parse(localStorage.getItem(KEY + '.icons') || '{}')
      const missing = list.map((a) => a.path).filter((p) => !(p in cached))
      if (!missing.length) return
      const got = (await call('app_icons', { paths: missing })) || {}
      const next = { ...cached }
      for (const p of missing) next[p] = got[p] ? `data:image/png;base64,${got[p]}` : ''
      try { localStorage.setItem(KEY + '.icons', JSON.stringify(next)) } catch {}
      if (alive) setIcons(next)
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  // live exchange rates, cached 12 h
  useEffect(() => {
    const cached = (() => { try { return JSON.parse(localStorage.getItem(KEY + '.rates')) } catch { return null } })()
    if (cached && Date.now() - cached.at < 12 * 3600e3) { setRates({ map: cached.map, date: cached.date }); return }
    call('rates').then((r) => {
      if (!r?.rates) return
      const map = { USD: 1, ...r.rates }
      setRates({ map, date: r.date })
      try { localStorage.setItem(KEY + '.rates', JSON.stringify({ map, date: r.date, at: Date.now() })) } catch {}
    }).catch(() => {})
  }, [])

  const notify = useCallback((msg) => { clearTimeout(t.current); setToast(msg); t.current = setTimeout(() => setToast(null), 2200) }, [])

  const launch = useCallback(async (app) => {
    setBounce(app.path)
    setTimeout(() => setBounce(null), 1100)
    try { await call('launch', { path: app.path }) } catch (e) { notify(`Couldn't open ${app.name}`) }
  }, [notify])

  const media = useCallback(async (seq) => {
    for (let i = 0; i < seq.length; i++) {
      const key = seq[i]; const times = typeof seq[i + 1] === 'number' ? seq[++i] : 1
      try { await call('media_key', { key, times }) } catch { try { await call('media_key', { key, times }) } catch {} }
    }
  }, [])

  const togglePin = useCallback((path) => patch((o) => {
    const p = o.pinned || []
    return { pinned: p.includes(path) ? p.filter((x) => x !== path) : [...p, path] }
  }), [patch])

  const movePin = useCallback((path, dir) => patch((o) => {
    const p = [...(o.pinned || [])]; const i = p.indexOf(path); const j = i + dir
    if (i < 0 || j < 0 || j >= p.length) return {}
    ;[p[i], p[j]] = [p[j], p[i]]; return { pinned: p }
  }), [patch])

  const value = useMemo(() => ({
    s, patch, apps, icons, rates, toast, notify, launch, media, bounce, togglePin, movePin, started: started.current,
    reset: () => patch({ accent: DEFAULTS.accent, radius: DEFAULTS.radius, size: DEFAULTS.size }),
  }), [s, patch, apps, icons, rates, toast, notify, launch, media, bounce, togglePin, movePin])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const i = setInterval(() => setNow(new Date()), ms); return () => clearInterval(i) }, [ms])
  return now
}
