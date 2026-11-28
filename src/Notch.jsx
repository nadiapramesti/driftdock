import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { I } from './icons.jsx'
import { call, isNative, onNative, showWindow } from './native.js'
import { BREAK_MIN, FOCUS_MIN, fmtClock, onTimerChange, pauseTimer, readTimer, remaining, resumeTimer, startTimer, stopTimer } from './timer.js'
import { KIND, occurs } from './Panels.jsx'

// Sizes are CSS px of the black pill; the window adds room for the shadow.
const SIZE = { idle: [200, 34], flash: [340, 54], open: [440, 236] }
const PAD = [44, 26]

const readSettings = () => { try { return JSON.parse(localStorage.getItem('driftdock.v1') || '{}') } catch { return {} } }

function beep() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)()
    ;[0, 0.22].forEach((t) => {
      const o = ac.createOscillator(); const g = ac.createGain()
      o.frequency.value = 880; o.connect(g); g.connect(ac.destination)
      g.gain.setValueAtTime(0.0001, ac.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + 0.18)
      o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.2)
    })
  } catch {}
}

// next event within the coming 24 h, from the dock's local agenda
function nextEvent(events, now) {
  const list = []
  for (let day = 0; day < 2; day++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day)
    for (const e of events || []) {
      if (!e.time || !occurs(e, d)) continue
      const [h, m] = e.time.split(':').map(Number)
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)
      if (at - now > -5 * 60e3 && at - now < 24 * 3600e3) list.push({ ...e, at })
    }
  }
  return list.sort((a, b) => a.at - b.at)[0] || null
}
const inWords = (ms) => {
  const m = Math.round(ms / 60e3)
  if (m <= 0) return 'now'
  return m < 60 ? `in ${m} min` : `in ${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}`
}

function Art({ src, size }) {
  return src
    ? <img src={src} alt="" className="rounded-[28%] object-cover shrink-0" style={{ width: size, height: size }} />
    : <span className="rounded-[28%] grid place-items-center shrink-0 bg-gradient-to-br from-[var(--accent)] to-[#3a1f45]" style={{ width: size, height: size }}><I n="audio" className="w-1/2 h-1/2" /></span>
}
const Bars = ({ on }) => (
  <span className="flex items-end gap-[2px] h-3.5" aria-hidden>
    {[0, 1, 2, 3].map((i) => <i key={i} className={`w-[3px] rounded-full bg-[var(--accent)] ${on ? 'eq' : ''}`} style={{ height: on ? undefined : 4, animationDelay: `${i * 0.13}s` }} />)}
  </span>
)

export default function Notch() {
  const [settings, setSettings] = useState(readSettings)
  const [sys, setSys] = useState(null)
  const [timer, setTimer] = useState(readTimer)
  const [now, setNow] = useState(() => new Date())
  const [hover, setHover] = useState(false)
  const [flash, setFlash] = useState(null)
  const prev = useRef(null)
  const flashT = useRef(); const leaveT = useRef(); const volT = useRef()
  const fired = useRef(new Set())
  const shown = useRef(false)

  const pop = useCallback((f, ms = 2600) => { clearTimeout(flashT.current); setFlash(f); flashT.current = setTimeout(() => setFlash(null), ms) }, [])

  // settings, accent and agenda come from the dock window through localStorage
  useEffect(() => {
    const on = (e) => { if (!e.key || e.key === 'driftdock.v1') setSettings(readSettings()) }
    addEventListener('storage', on); return () => removeEventListener('storage', on)
  }, [])
  useEffect(() => { document.documentElement.style.setProperty('--accent', settings.accent || '#ffa94d') }, [settings.accent])
  useEffect(() => onTimerChange(setTimer), [])

  // system snapshot: now playing, volume, battery
  useEffect(() => {
    call('get_sys').then((v) => v && setSys(v)).catch(() => {})
    let un = () => {}
    onNative('sys', (e) => setSys(e.payload)).then((u) => (un = u))
    return () => un()
  }, [])

  // status flashes when something changes
  useEffect(() => {
    if (!sys) return
    const p = prev.current; prev.current = sys
    if (!p) return
    if (sys.volume !== p.volume || sys.muted !== p.muted) pop({ icon: sys.muted ? 'mute' : 'vol', text: sys.muted ? 'Muted' : 'Volume', bar: sys.muted ? 0 : sys.volume, value: sys.muted ? '' : `${sys.volume}%` }, 1600)
    else if (sys.charging !== p.charging && sys.battery != null) pop({ icon: 'battery', text: sys.charging ? 'Charging' : 'On battery', bar: sys.battery, value: `${sys.battery}%`, good: sys.charging })
    else if (sys.battery != null && p.battery != null && !sys.charging && sys.battery <= 20 && p.battery > 20) pop({ icon: 'battery', text: 'Battery low', bar: sys.battery, value: `${sys.battery}%`, warn: true }, 4000)
    else if (sys.media && sys.media.playing && sys.media.title !== p.media?.title) pop({ art: sys.media.art, text: sys.media.title, sub: sys.media.artist || 'Now playing' }, 3200)
  }, [sys, pop])
  useEffect(() => {
    const off = () => pop({ icon: 'wifi', text: 'Offline', sub: 'No internet connection', warn: true }, 3000)
    const on = () => pop({ icon: 'wifi', text: 'Back online', good: true }, 2000)
    addEventListener('offline', off); addEventListener('online', on)
    return () => { removeEventListener('offline', off); removeEventListener('online', on) }
  }, [pop])

  // clock: every second while a timer runs, otherwise every 15 s
  useEffect(() => {
    const live = timer && timer.paused == null
    const i = setInterval(() => setNow(new Date()), live ? 500 : 15000)
    return () => clearInterval(i)
  }, [timer])

  // timer finishing; focus rolls into a break
  useEffect(() => {
    if (!timer || timer.paused != null || remaining(timer, now.getTime()) > 0) return
    beep()
    if (timer.mode === 'focus') { pop({ icon: 'check', text: 'Focus done', sub: `${BREAK_MIN} min break started`, good: true }, 5000); startTimer(BREAK_MIN, 'break') }
    else if (timer.mode === 'break') { pop({ icon: 'focus', text: "Break's over", sub: 'Ready for the next round?' }, 5000); stopTimer() }
    else { pop({ icon: 'timer', text: "Time's up", sub: timer.label }, 6000); stopTimer() }
  }, [timer, now, pop])

  // agenda reminders: 10 minutes before, and at the start
  const ev = useMemo(() => nextEvent(settings.events, now), [settings.events, now])
  useEffect(() => {
    if (!ev) return
    const left = ev.at - now
    const k10 = `${ev.id}@${ev.at.getTime()}:10`; const k0 = `${ev.id}@${ev.at.getTime()}:0`
    if (left <= 0 && left > -60e3 && !fired.current.has(k0)) { fired.current.add(k0); beep(); pop({ dot: KIND[ev.kind]?.[0], text: ev.title, sub: 'Starting now' }, 6000) }
    else if (left > 0 && left <= 10 * 60e3 && !fired.current.has(k10)) { fired.current.add(k10); pop({ dot: KIND[ev.kind]?.[0], text: ev.title, sub: inWords(left) }, 5000) }
  }, [ev, now, pop])

  const mode = hover ? 'open' : flash ? 'flash' : 'idle'
  const [w, h] = SIZE[mode]

  // keep the native window hugging the pill (grow first, shrink after the animation)
  useEffect(() => {
    const apply = () => call('set_layout', { width: w + PAD[0], height: h + PAD[1], gap: 0, anchor: 'top' }).then(() => {
      if (!shown.current) { shown.current = true; if (readSettings().notch !== false) showWindow() }
    }).catch(() => {})
    if (mode !== 'idle' || !shown.current) { apply(); return }
    const t = setTimeout(apply, 320)
    return () => clearTimeout(t)
  }, [mode, w, h])

  const enter = () => { clearTimeout(leaveT.current); setHover(true) }
  const leave = () => { clearTimeout(leaveT.current); leaveT.current = setTimeout(() => setHover(false), 280) }
  const setVol = (v) => { setSys((s) => (s ? { ...s, volume: v, muted: false } : s)); clearTimeout(volT.current); volT.current = setTimeout(() => call('set_volume', { level: v }).catch(() => {}), 60) }
  const media = sys?.media
  const tLeft = remaining(timer, now.getTime())
  const btn = 'grid place-items-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors'

  return (
    <div className={`fixed inset-0 flex justify-center items-start ${isNative ? '' : 'preview-desk'}`}>
      <div onMouseEnter={enter} onMouseLeave={leave}
        className="notch relative overflow-hidden bg-black text-white shadow-[0_10px_30px_-6px_rgba(0,0,0,.7)] ring-1 ring-white/[.07]"
        style={{ width: w, height: h, borderRadius: mode === 'open' ? 30 : h / 2, borderTopLeftRadius: mode === 'open' ? 18 : h / 2, borderTopRightRadius: mode === 'open' ? 18 : h / 2 }}>

        {mode === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-between px-3.5 fade-in">
            {timer ? (
              <>
                <span className={`flex items-center gap-1.5 text-[12px] font-semibold ${timer.mode === 'break' ? 'text-emerald-300' : 'text-[var(--accent)]'}`}><I n={timer.mode === 'timer' ? 'timer' : 'focus'} className="w-3.5 h-3.5" />{timer.label}</span>
                <span className="text-[14px] font-bold tabular-nums">{timer.paused != null && '⏸ '}{fmtClock(tLeft)}</span>
              </>
            ) : media ? (
              <><Art src={media.art} size={22} /><span className="flex-1 mx-2.5 text-[12px] text-white/70 truncate">{media.title}</span><Bars on={media.playing} /></>
            ) : ev && ev.at - now < 60 * 60e3 ? (
              <><span className="flex items-center gap-2 text-[12px] truncate"><i className="w-2 h-2 rounded-full shrink-0" style={{ background: KIND[ev.kind]?.[0] }} /><span className="truncate">{ev.title}</span></span><span className="text-[12px] font-semibold text-white/70 shrink-0 ml-2">{inWords(ev.at - now)}</span></>
            ) : (
              <span className="mx-auto text-[12px] font-semibold text-white/55 tabular-nums">{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
            )}
          </div>
        )}

        {mode === 'flash' && (
          <div className="absolute inset-0 flex items-center gap-3 px-4 fade-in">
            {flash.art !== undefined ? <Art src={flash.art} size={34} />
              : flash.dot ? <i className="w-3 h-3 rounded-full shrink-0 ml-1" style={{ background: flash.dot }} />
                : <span className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${flash.warn ? 'bg-[#ff4d5e]' : flash.good ? 'bg-emerald-500' : 'bg-white/10'}`}><I n={flash.icon} className="w-4 h-4" /></span>}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold truncate">{flash.text}</div>
              {flash.bar != null ? <div className="h-1.5 mt-1.5 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300" style={{ width: `${flash.bar}%`, background: flash.warn ? '#ff4d5e' : undefined }} /></div>
                : flash.sub && <div className="text-[12px] text-white/60 truncate">{flash.sub}</div>}
            </div>
            {flash.value && <span className="text-[13px] font-bold tabular-nums">{flash.value}</span>}
          </div>
        )}

        {mode === 'open' && (
          <div className="absolute inset-0 p-4 pt-3 flex flex-col gap-3 fade-in">
            <div className="flex items-center justify-between text-[11px] text-white/55 font-semibold px-1">
              <span className="tabular-nums">{now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}</span>
              {sys?.battery != null && <span className={`flex items-center gap-1 ${!sys.charging && sys.battery <= 20 ? 'text-[#ff6b6b]' : ''}`}><I n="battery" className="w-4 h-4" />{sys.battery}%{sys.charging ? ' · charging' : ''}</span>}
            </div>

            <div className="flex items-center gap-3">
              <Art src={media?.art} size={60} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold truncate">{media?.title || 'Nothing playing'}</div>
                <div className="text-[12.5px] text-white/55 truncate">{media ? media.artist || media.app.replace(/\.exe$/i, '') : 'Play something in Spotify, YouTube or any player'}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <button onClick={() => (sys?.muted ? setVol(sys.volume || 30) : call('set_volume', { level: null }))} className={`${btn} w-7 h-7`} aria-label="Mute"><I n={sys?.muted ? 'mute' : 'vol'} className="w-4 h-4" /></button>
                  <input type="range" min="0" max="100" value={sys?.muted ? 0 : sys?.volume ?? 50} onChange={(e) => setVol(+e.target.value)} className="vol flex-1" style={{ '--v': `${sys?.muted ? 0 : sys?.volume ?? 50}%` }} aria-label="Volume" />
                  <span className="w-8 text-right text-[11px] text-white/55 tabular-nums">{sys?.muted ? '0' : sys?.volume ?? '–'}%</span>
                </div>
              </div>
              <div className="flex items-center">
                <button onClick={() => call('media_control', { action: 'prev' })} className={`${btn} w-9 h-9`} aria-label="Previous"><I n="prev" className="w-4 h-4" fill /></button>
                <button onClick={() => call('media_control', { action: 'play' })} className={`${btn} w-11 h-11 bg-white text-black hover:bg-white/85`} aria-label="Play or pause"><I n="play" className="w-5 h-5" fill /></button>
                <button onClick={() => call('media_control', { action: 'next' })} className={`${btn} w-9 h-9`} aria-label="Next"><I n="next" className="w-4 h-4" fill /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 flex-1">
              <div className="rounded-2xl bg-white/[.07] p-3 flex flex-col justify-between">
                {timer ? (
                  <>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-white/55"><span>{timer.label}</span><span>{timer.mode === 'focus' ? `then ${BREAK_MIN}m break` : ''}</span></div>
                    <div className="text-[26px] font-extrabold tabular-nums leading-none">{fmtClock(tLeft)}</div>
                    <div className="flex gap-1.5">
                      <button onClick={timer.paused != null ? resumeTimer : pauseTimer} className="flex-1 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-[12px] font-bold">{timer.paused != null ? 'Resume' : 'Pause'}</button>
                      <button onClick={stopTimer} className="flex-1 h-7 rounded-lg bg-white/10 hover:bg-[#ff4d5e] text-[12px] font-bold">Stop</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[11px] font-semibold text-white/55">Timer</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[5, 10, 15].map((m) => <button key={m} onClick={() => startTimer(m)} className="h-7 rounded-lg bg-white/10 hover:bg-white/20 text-[12px] font-bold">{m}m</button>)}
                    </div>
                    <button onClick={() => startTimer(FOCUS_MIN, 'focus')} className="h-7 rounded-lg bg-[var(--accent)] text-[#16120e] text-[12px] font-bold hover:brightness-110">Focus {FOCUS_MIN}m</button>
                  </>
                )}
              </div>
              <div className="rounded-2xl bg-white/[.07] p-3 flex flex-col justify-between min-w-0">
                <div className="text-[11px] font-semibold text-white/55">Next up</div>
                {ev ? (
                  <>
                    <div className="flex items-center gap-2 min-w-0"><i className="w-2 h-2 rounded-full shrink-0" style={{ background: KIND[ev.kind]?.[0] }} /><span className="text-[14px] font-bold truncate">{ev.title}</span></div>
                    <div className="text-[12px] text-white/60">{ev.time} · {inWords(ev.at - now)}</div>
                  </>
                ) : <div className="text-[12.5px] text-white/50 leading-snug">Nothing with a time in the next 24 hours. Add it in the dock's calendar.</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
