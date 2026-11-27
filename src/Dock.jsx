import React, { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AppIcon } from './art.jsx'
import { I } from './icons.jsx'
import { useNow, useStore } from './store.jsx'
import { CITIES } from './engine.js'
import { isNative } from './native.js'

const BASE = 44
const RANGE = 130
const MAX = 0.7

export const radiusPx = (radius, h) => Math.round((radius / 100) * (h / 2))
const fmtSession = (ms) => { const m = Math.floor(ms / 60000); const h = Math.floor(m / 60); return h ? `${h}h ${String(m % 60).padStart(2, '0')}m` : `${m}m` }

export const WX_ICON = (sym = '') => (/rain|sleet|shower|thunder/.test(sym) ? 'rain' : /cloud|fog|fair_night|partly/.test(sym) ? 'cloud' : /night/.test(sym) ? 'dark' : 'sun')

const Dock = forwardRef(function Dock({ onOpen, open, weather, onScale }, ref) {
  const { s, apps, icons, launch, bounce, media, started } = useStore()
  const [mx, setMx] = useState(null)
  const refs = useRef({})
  const now = useNow(15000)
  const H = 64
  const navRef = useRef(null)
  const [fit, setFit] = useState(1)
  const hoverRef = useRef(false)
  useLayoutEffect(() => {
    const el = navRef.current
    if (!el) return
    // the native window hugs the dock, so measure against the whole screen there
    const room = () => (isNative ? window.screen?.availWidth || 1366 : window.innerWidth) - 150
    const measure = () => { if (!hoverRef.current) setFit(Math.min(1, room() / (el.offsetWidth * (s.size / 100)))) }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    addEventListener('resize', measure)
    measure()
    return () => { ro.disconnect(); removeEventListener('resize', measure) }
  }, [s.size])
  const scale = (s.size / 100) * fit
  useEffect(() => { onScale?.(scale) }, [scale])
  const pinned = (s.pinned || []).map((p) => apps.find((a) => a.path === p)).filter(Boolean)

  // Centres come from the un-magnified layout around the icon group's fixed centre,
  // so growing icons never shift the target under the cursor.
  const appsRef = useRef(null)
  const mag = (i) => {
    const el = appsRef.current
    if (mx == null || !el) return 1
    const r = el.getBoundingClientRect()
    const c = (r.left + r.width / 2) / scale + (i - (pinned.length - 1) / 2) * (BASE + 4)
    const d = Math.abs(mx / scale - c)
    return 1 + MAX * Math.max(0, Math.cos(Math.min(d / RANGE, 1) * (Math.PI / 2)))
  }
  const chip = 'hover:bg-white/10 active:bg-white/15'
  const on = (k) => (open === k ? 'bg-white/15' : '')
  const cur = weather?.hours?.[0]

  return (
    <div ref={ref} className="w-max" style={{ transform: `scale(${scale})`, transformOrigin: '50% 100%' }}>
      <nav ref={navRef} aria-label="Dock"
        className="relative w-max flex items-end gap-1.5 px-2.5 border text-white border-white/[.12] bg-[rgba(18,16,22,.86)] shadow-[0_18px_50px_-12px_rgba(0,0,0,.75)] transition-[border-radius] duration-500"
        style={{ height: H, borderRadius: radiusPx(s.radius, H), paddingBottom: 10 }}>
        <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/[.09] to-transparent" />

        <div className="flex items-end shrink-0" onPointerMove={(e) => { hoverRef.current = e.pointerType === 'mouse'; setMx(hoverRef.current ? e.clientX : null) }} onPointerLeave={() => { hoverRef.current = false; setMx(null) }}>
          <div ref={appsRef} className="flex items-end">
          {pinned.length === 0 && <div className="self-center px-3 text-[13px] text-white/55 h-11 grid place-items-center">Pin apps with +</div>}
          {pinned.map((a, i) => {
            const m = mag(i)
            const grow = (m - 1) * BASE
            const tr = mx == null ? '.3s cubic-bezier(.2,.8,.2,1)' : '.08s linear'
            return (
              <button key={a.path} ref={(el) => (refs.current[a.path] = el)} onClick={() => launch(a)} aria-label={`Open ${a.name}`}
                className="group relative shrink-0 outline-none focus-visible:ring-2 ring-[var(--accent)] rounded-xl"
                style={{ width: BASE, height: BASE, marginInline: 2 + grow / 2, transition: `margin ${tr}` }}>
                <span className={`block origin-bottom ${bounce === a.path ? 'app-bounce' : ''}`} style={{ transform: `scale(${m})`, transition: `transform ${tr}` }}>
                  <AppIcon app={a} src={icons[a.path]} size={BASE} />
                </span>
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-[58px] whitespace-nowrap rounded-lg bg-black/80 px-2.5 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">{a.name}</span>
              </button>
            )
          })}
          </div>
          <button onClick={() => onOpen('apps')} aria-label="Add or remove apps"
            className={`self-center ml-1 w-9 h-9 grid place-items-center rounded-xl border border-dashed border-white/25 text-white/70 hover:text-white hover:border-white/50 ${on('apps')}`}>
            <I n="plus" className="w-4 h-4" sw={2.2} />
          </button>
        </div>

        <span className="self-center w-px h-8 mx-1 bg-white/15" />

        <button onClick={() => onOpen('search')} aria-label="Open command bar" title="Ctrl + Alt + Space"
          className={`self-center flex items-center gap-2.5 h-11 pl-3.5 pr-2 border bg-white/[.07] border-white/10 hover:bg-white/[.12] ${open === 'search' ? 'border-[var(--accent)]' : ''}`}
          style={{ borderRadius: Math.max(10, radiusPx(s.radius, 44)) }}>
          <I n="search" className="w-4 h-4 text-[var(--accent)]" sw={2.2} />
          <span className="text-[14px] w-28 text-left text-white/55 whitespace-nowrap">Type anything…</span>
        </button>

        <span className="self-center w-px h-8 mx-1 bg-white/15" />

        <div className="self-center flex items-center gap-0.5">
          {s.widgets.media && (
            <div className="flex items-center">
              <button onClick={() => media(['prev'])} aria-label="Previous track" className={`grid place-items-center w-8 h-9 rounded-xl ${chip}`}><I n="prev" className="w-4 h-4" fill /></button>
              <button onClick={() => media(['play'])} aria-label="Play or pause" className={`grid place-items-center w-9 h-9 rounded-xl ${chip}`}><I n="play" className="w-[18px] h-[18px]" fill /></button>
              <button onClick={() => media(['next'])} aria-label="Next track" className={`grid place-items-center w-8 h-9 rounded-xl ${chip}`}><I n="next" className="w-4 h-4" fill /></button>
            </div>
          )}
          {s.widgets.volume && (
            <div className="flex items-center">
              <button onClick={() => media(['down', 2])} aria-label="Volume down" className={`grid place-items-center w-8 h-9 rounded-xl ${chip}`}><I n="minus" className="w-4 h-4" sw={2.2} /></button>
              <button onClick={() => media(['mute'])} aria-label="Mute" className={`grid place-items-center w-9 h-9 rounded-xl ${chip}`}><I n="vol" className="w-[18px] h-[18px]" /></button>
              <button onClick={() => media(['up', 2])} aria-label="Volume up" className={`grid place-items-center w-8 h-9 rounded-xl ${chip}`}><I n="plus" className="w-4 h-4" sw={2.2} /></button>
            </div>
          )}
          <button onClick={() => onOpen('quick')} aria-label="Quick actions" className={`grid place-items-center w-9 h-9 rounded-xl ${chip} ${on('quick')}`}><I n="sliders" className="w-[18px] h-[18px]" /></button>
          {s.widgets.session && (
            <button onClick={() => onOpen('limits')} className={`flex flex-col items-start justify-center h-11 px-2.5 rounded-xl leading-tight ${chip} ${on('limits')}`} aria-label="Session time and limit timers">
              <span className="text-[10px] font-medium text-white/55">Session</span>
              <span className="text-[13px] font-semibold tabular-nums whitespace-nowrap">{fmtSession(now - started)}</span>
            </button>
          )}
          {s.widgets.weather && (
            <button onClick={() => onOpen('weather')} className={`flex items-center gap-1.5 h-11 px-2.5 rounded-xl ${chip} ${on('weather')}`} aria-label={`Weather in ${CITIES[s.city]?.[0]}`}>
              <I n={WX_ICON(cur?.symbol)} className="w-5 h-5 text-amber-300" />
              <span className="text-[14px] font-semibold tabular-nums">{cur ? `${Math.round(cur.temp)}°` : '—'}</span>
            </button>
          )}
          <button onClick={() => onOpen('calendar')} className={`flex flex-col items-end justify-center h-11 px-2.5 rounded-xl leading-tight ${chip} ${on('calendar')}`} aria-label="Open calendar">
            <span className="text-[13px] font-semibold tabular-nums whitespace-nowrap">{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
            <span className="text-[11px] text-white/55 whitespace-nowrap">{now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </button>
          <button onClick={() => onOpen('settings')} aria-label="Driftdock settings" className={`grid place-items-center w-8 h-9 rounded-xl text-white/60 hover:text-white ${chip} ${on('settings')}`}><I n="gear" className="w-4 h-4" /></button>
        </div>
      </nav>
    </div>
  )
})
export default Dock
