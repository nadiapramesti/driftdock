import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Dock from './Dock.jsx'
import CommandBar from './CommandBar.jsx'
import { AppsPanel, CalendarPanel, LimitsPanel, QuickPanel, SettingsPanel, WeatherPanel } from './Panels.jsx'
import { StoreProvider, useStore } from './store.jsx'
import { call, isNative, onBlur, onNative, showWindow } from './native.js'
import { CITIES } from './engine.js'

const DOCK_H = 64
const HEADROOM = 92 // room above the dock for magnified icons + tooltips
const PANEL_ROOM = 720

function useWeather(city) {
  const [data, setData] = useState(() => { try { const c = JSON.parse(localStorage.getItem('driftdock.wx')); return c?.city === city ? c.data : null } catch { return null } })
  useEffect(() => {
    const [, , lat, lon] = CITIES[city] || CITIES.jakarta
    const get = () => call('weather', { lat, lon }).then((d) => {
      if (!d?.hours?.length) return
      setData(d); try { localStorage.setItem('driftdock.wx', JSON.stringify({ city, data: d })) } catch {}
    }).catch(() => {})
    get()
    const i = setInterval(get, 30 * 60e3)
    return () => clearInterval(i)
  }, [city])
  return data
}

function Shell() {
  const { s, toast } = useStore()
  const [open, setOpen] = useState(null)
  const [dockW, setDockW] = useState(0)
  const dockRef = useRef(null)
  const shown = useRef(false)
  const weather = useWeather(s.city)
  const [scale, setScale] = useState(s.size / 100)

  // measure the dock (unscaled width)
  useLayoutEffect(() => {
    const el = dockRef.current?.firstElementChild
    if (!el) return
    const ro = new ResizeObserver(() => setDockW(el.offsetWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // size the native window around what is visible
  useEffect(() => {
    if (!dockW) return
    const base = { w: dockW * scale + 170, h: DOCK_H * scale + HEADROOM }
    const avail = (window.screen?.availHeight || 900) - 16
    const maxW = (window.screen?.availWidth || 1366) - 8
    const w = Math.min(open ? Math.max(base.w, 800) : base.w, maxW)
    const h = open ? Math.min(base.h + PANEL_ROOM, avail) : base.h
    const apply = () => call('set_layout', { width: Math.ceil(w), height: Math.ceil(h), gap: 6 }).then(() => {
      if (!shown.current) { shown.current = true; showWindow() }
    }).catch(() => {})
    if (open) { apply(); return }
    const t = setTimeout(apply, 140) // let the panel fade before shrinking
    return () => clearTimeout(t)
  }, [dockW, scale, open])

  const toggle = useCallback((p) => setOpen((o) => (o === p ? null : p)), [])
  const close = useCallback(() => setOpen(null), [])

  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') close() }
    addEventListener('keydown', k)
    let un1 = () => {}, un2 = () => {}
    onNative('toggle-search', () => setOpen((o) => (o === 'search' ? null : 'search'))).then((u) => (un1 = u))
    onBlur(close).then((u) => (un2 = u))
    return () => { removeEventListener('keydown', k); un1(); un2() }
  }, [close])

  const P = {
    search: <CommandBar onClose={close} weather={weather} />,
    calendar: <CalendarPanel />, quick: <QuickPanel onClose={close} />, limits: <LimitsPanel />,
    weather: <WeatherPanel data={weather} />, apps: <AppsPanel />, settings: <SettingsPanel />,
  }[open]

  return (
    <div className={`fixed inset-0 select-none ${isNative ? '' : 'preview-desk'}`} onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      {P && (
        <div className="absolute left-1/2 -translate-x-1/2 flex justify-center" style={{ bottom: DOCK_H * scale + 20, maxWidth: 'calc(100vw - 16px)' }}>
          <div key={open} className="slide-up max-w-full">{P}</div>
        </div>
      )}
      {toast && <div key={toast} className="absolute left-1/2 -translate-x-1/2 slide-up px-4 py-2 rounded-full bg-white text-[#16120e] text-[13px] font-semibold shadow-xl whitespace-nowrap" style={{ bottom: DOCK_H * scale + (P ? 8 : 20) + (P ? 0 : 0) }}>{toast}</div>}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0">
        <Dock ref={dockRef} onOpen={toggle} open={open} weather={weather} onScale={setScale} />
      </div>
    </div>
  )
}

export default function App() {
  return <StoreProvider><Shell /></StoreProvider>
}
