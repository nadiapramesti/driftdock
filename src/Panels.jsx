import React, { useEffect, useMemo, useState } from 'react'
import { I } from './icons.jsx'
import { AppIcon, Logo } from './art.jsx'
import { ACCENTS, CITIES, matchApps } from './engine.js'
import { useNow, useStore } from './store.jsx'
import { autostart, call } from './native.js'
import { WX_ICON } from './Dock.jsx'

export const panel = 'rounded-[24px] border border-white/[.12] bg-[rgba(18,16,22,.95)] text-white shadow-[0_24px_70px_-20px_rgba(0,0,0,.85)]'
const field = 'h-10 rounded-xl bg-white/[.07] border border-white/10 px-3 text-[14px] outline-none focus:border-[var(--accent)] placeholder:text-white/35'
const btn = 'h-10 px-4 rounded-xl bg-[var(--accent)] text-[#16120e] font-bold text-[14px] hover:brightness-110 active:scale-[.98] transition'
const Head = ({ title, sub }) => (
  <div className="flex items-baseline justify-between gap-3 mb-3"><div className="font-bold text-[15px]">{title}</div>{sub && <div className="text-xs text-white/50 text-right">{sub}</div>}</div>
)

/* ---------------- Weather ---------------- */
export function WeatherCard({ data }) {
  const { s } = useStore()
  const city = CITIES[s.city] || CITIES.jakarta
  const h = data?.hours || []
  const cur = h[0]
  if (!cur) return <div className="rounded-[20px] p-6 bg-white/[.05] text-white/60 text-sm">Weather for {city[0]} isn't available right now. It needs an internet connection.</div>
  const temps = h.map((x) => x.temp)
  return (
    <div className="rounded-[20px] p-5 text-white bg-gradient-to-br from-[#ff9a52] via-[#e0643a] to-[#7a2a2a] relative overflow-hidden">
      <div className="absolute -right-10 -top-12 w-44 h-44 rounded-full bg-yellow-200/30 blur-2xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold opacity-90">{city[0]}</div>
          <div className="text-[56px] leading-none font-extrabold tracking-tight mt-1 tabular-nums">{Math.round(cur.temp)}°</div>
          <div className="text-sm mt-1 opacity-90">{(cur.symbol || '').replace(/_(day|night|polartwilight)/, '').replace(/_/g, ' ') || '—'} · H {Math.round(Math.max(...temps))}° L {Math.round(Math.min(...temps))}°</div>
        </div>
        <I n={WX_ICON(cur.symbol)} className="w-14 h-14 text-yellow-100" sw={1.6} />
      </div>
      <div className="relative grid grid-cols-6 gap-1 mt-5 text-center">
        {h.slice(1, 7).map((x) => (
          <div key={x.time} className="rounded-xl bg-black/15 py-2">
            <div className="text-[11px] opacity-85">{new Date(x.time).toLocaleTimeString([], { hour: 'numeric' })}</div>
            <I n={WX_ICON(x.symbol)} className="w-5 h-5 mx-auto my-1.5" />
            <div className="text-[13px] font-semibold tabular-nums">{Math.round(x.temp)}°</div>
          </div>
        ))}
      </div>
      <div className="relative flex justify-between text-[11px] opacity-80 mt-3"><span>Wind {cur.wind} m/s · Humidity {Math.round(cur.humidity)}%</span><span>Data: MET Norway</span></div>
    </div>
  )
}
export function WeatherPanel({ data }) {
  const { s, patch } = useStore()
  const cities = useMemo(() => [...new Map(Object.entries(CITIES).map(([k, v]) => [v[0], k])).entries()].sort(), [])
  return (
    <div className={`${panel} p-3 w-[440px] space-y-3`}>
      <WeatherCard data={data} />
      <label className="flex items-center gap-3 px-1 text-[13px] text-white/70">City
        <select value={s.city} onChange={(e) => patch({ city: e.target.value })} className={`${field} flex-1`}>
          {cities.map(([name, key]) => <option key={key} value={key} className="bg-[#1a1720]">{name}</option>)}
        </select>
      </label>
    </div>
  )
}

/* ---------------- Quick actions ---------------- */
export const QUICK = {
  dark: { label: 'Dark mode', icon: 'dark', real: true },
  wifi: { label: 'Wi‑Fi', icon: 'wifi', uri: 'ms-settings:network-wifi' },
  bluetooth: { label: 'Bluetooth', icon: 'bt', uri: 'ms-settings:bluetooth' },
  nightlight: { label: 'Night light', icon: 'nightlight', uri: 'ms-settings:nightlight' },
  focus: { label: 'Notifications', icon: 'focus', uri: 'ms-settings:notifications' },
  display: { label: 'Display', icon: 'display', uri: 'ms-settings:display' },
  sound: { label: 'Sound', icon: 'sound', uri: 'ms-settings:sound' },
  battery: { label: 'Battery', icon: 'battery', uri: 'ms-settings:batterysaver' },
  snip: { label: 'Screenshot', icon: 'snip', uri: 'ms-screenclip:' },
  airplane: { label: 'Airplane', icon: 'air', uri: 'ms-settings:network-airplanemode' },
  hotspot: { label: 'Hotspot', icon: 'hotspot', uri: 'ms-settings:network-mobilehotspot' },
  taskbar: { label: 'Taskbar', icon: 'taskbar', uri: 'ms-settings:taskbar' },
}
export function QuickPanel({ onClose }) {
  const { launch, notify } = useStore()
  const [dark, setDark] = useState(null)
  useEffect(() => { call('get_dark_mode').then(setDark).catch(() => {}) }, [])
  const flipDark = async () => { try { await call('set_dark_mode', { dark: !dark }); setDark(!dark) } catch { notify("Couldn't change the theme") } }
  return (
    <div className={`${panel} p-4 w-[440px]`}>
      <Head title="Quick actions" sub="Arrows open the Windows setting" />
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(QUICK).map(([id, q]) => {
          const on = id === 'dark' && dark
          return (
            <button key={id} onClick={() => (q.real ? flipDark() : (launch({ name: q.label, path: q.uri }), onClose()))}
              className={`relative text-left rounded-2xl p-3 transition-colors duration-300 ${on ? 'bg-[var(--accent)] text-[#16120e]' : 'bg-white/[.07] hover:bg-white/[.12]'}`}>
              <I n={q.icon} className="w-5 h-5" />
              {!q.real && <I n="ext" className="absolute right-2.5 top-2.5 w-3.5 h-3.5 opacity-45" />}
              <div className="mt-3 text-[13px] font-semibold leading-tight">{q.label}</div>
              <div className={`text-[11px] mt-0.5 ${on ? 'opacity-75' : 'text-white/45'}`}>{q.real ? (dark == null ? '…' : dark ? 'On' : 'Off') : 'Settings'}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- Calendar (local agenda) ---------------- */
const KIND = { meeting: ['#60a5fa', 'Meeting'], payout: ['#34d399', 'Payout'], renewal: ['#f472b6', 'Renewal'], other: ['#fbbf24', 'Other'] }
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const occurs = (e, d) => {
  const [y, m, day] = e.date.split('-').map(Number)
  if (iso(d) === e.date) return true
  if (d < new Date(y, m - 1, day)) return false
  if (e.repeat === 'monthly') return d.getDate() === day
  if (e.repeat === 'yearly') return d.getDate() === day && d.getMonth() === m - 1
  if (e.repeat === 'weekly') return d.getDay() === new Date(y, m - 1, day).getDay()
  return false
}
export function CalendarPanel() {
  const { s, patch } = useStore()
  const today = useNow(60000)
  const [ym, setYm] = useState([today.getFullYear(), today.getMonth()])
  const [sel, setSel] = useState(today.getDate())
  const [form, setForm] = useState({ title: '', time: '', kind: 'meeting', repeat: 'none' })
  const [y, mo] = ym
  const cells = useMemo(() => {
    const first = (new Date(y, mo, 1).getDay() + 6) % 7
    const days = new Date(y, mo + 1, 0).getDate()
    return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  }, [y, mo])
  const evOn = (d) => s.events.filter((e) => occurs(e, new Date(y, mo, d))).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
  const move = (n) => { const d = new Date(y, mo + n, 1); setYm([d.getFullYear(), d.getMonth()]); setSel(1) }
  const selDate = new Date(y, mo, sel)
  const add = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    patch((o) => ({ events: [...o.events, { ...form, title: form.title.trim(), id: Date.now(), date: iso(selDate) }] }))
    setForm((f) => ({ ...f, title: '', time: '' }))
  }
  const del = (id) => patch((o) => ({ events: o.events.filter((x) => x.id !== id) }))
  const agenda = evOn(sel)
  const isToday = (d) => d === today.getDate() && mo === today.getMonth() && y === today.getFullYear()

  return (
    <div className={`${panel} p-4 w-[740px] grid grid-cols-[1.1fr_1fr] gap-4`}>
      <div>
        <div className="flex items-center justify-between">
          <div className="text-[19px] font-extrabold">{new Date(y, mo).toLocaleDateString([], { month: 'long' })} <span className="text-white/45 font-semibold">{y}</span></div>
          <div className="flex gap-1">
            <button onClick={() => { setYm([today.getFullYear(), today.getMonth()]); setSel(today.getDate()) }} className="h-9 px-3 rounded-xl bg-white/[.07] hover:bg-white/15 text-[13px] font-semibold">Today</button>
            <button onClick={() => move(-1)} className="w-9 h-9 grid place-items-center rounded-xl bg-white/[.07] hover:bg-white/15" aria-label="Previous month"><I n="chevL" className="w-4 h-4" /></button>
            <button onClick={() => move(1)} className="w-9 h-9 grid place-items-center rounded-xl bg-white/[.07] hover:bg-white/15" aria-label="Next month"><I n="chevR" className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 mt-4 text-center text-[11px] font-semibold text-white/40">{['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <div key={d} className="pb-2">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => d == null ? <div key={i} /> : (
            <button key={i} onClick={() => setSel(d)}
              className={`relative h-11 rounded-xl text-[14px] font-semibold tabular-nums transition-colors ${sel === d ? 'bg-[var(--accent)] text-[#16120e]' : isToday(d) ? 'ring-1 ring-[var(--accent)] text-white' : 'hover:bg-white/10 text-white/90'}`}>
              {d}
              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-[3px]">
                {[...new Set(evOn(d).map((e) => e.kind))].map((k) => <i key={k} className="w-[5px] h-[5px] rounded-full" style={{ background: sel === d ? '#16120e' : KIND[k][0] }} />)}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-[12px] text-white/55">{Object.entries(KIND).map(([k, [c, l]]) => <span key={k} className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full" style={{ background: c }} />{l}</span>)}</div>
      </div>

      <div className="rounded-2xl bg-white/[.05] p-3.5 flex flex-col min-h-[340px]">
        <div className="text-[13px] text-white/50 font-medium">{selDate.toLocaleDateString([], { weekday: 'long' })}</div>
        <div className="text-[21px] font-extrabold">{selDate.toLocaleDateString([], { day: 'numeric', month: 'long' })}</div>
        <div className="mt-3 space-y-2 flex-1 overflow-y-auto max-h-[180px] pr-1">
          {agenda.length ? agenda.map((e) => (
            <div key={e.id} className="group flex gap-3 rounded-xl bg-white/[.06] p-2.5">
              <span className="w-1 rounded-full shrink-0" style={{ background: KIND[e.kind][0] }} />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold" style={{ color: KIND[e.kind][0] }}>{KIND[e.kind][1]}{e.time ? ` · ${e.time}` : ''}{e.repeat !== 'none' ? ` · ${e.repeat}` : ''}</div>
                <div className="text-[14px] font-semibold truncate">{e.title}</div>
              </div>
              <button onClick={() => del(e.id)} aria-label={`Delete ${e.title}`} className="self-center w-8 h-8 grid place-items-center rounded-lg text-white/40 hover:text-white hover:bg-white/10"><I n="trash" className="w-4 h-4" /></button>
            </div>
          )) : <div className="text-sm text-white/45 pt-2">Nothing yet. Add something below.</div>}
        </div>
        <form onSubmit={add} className="mt-3 grid grid-cols-2 gap-2">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Client call, Netflix renews" className={`${field} col-span-2`} />
          <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={field} aria-label="Time (optional)" />
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className={field} aria-label="Type">
            {Object.entries(KIND).map(([k, [, l]]) => <option key={k} value={k} className="bg-[#1a1720]">{l}</option>)}
          </select>
          <select value={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.value })} className={field} aria-label="Repeat">
            {['none', 'weekly', 'monthly', 'yearly'].map((r) => <option key={r} value={r} className="bg-[#1a1720]">{r === 'none' ? 'One time' : `Every ${r.replace('ly', '').replace('dai', 'day')}`}</option>)}
          </select>
          <button className={btn}>Add</button>
        </form>
      </div>
    </div>
  )
}

/* ---------------- Limit timers ---------------- */
const nextReset = (l, now) => {
  let t = l.anchor
  const step = l.everyHours * 3600e3
  if (t <= now) t += Math.ceil((now - t) / step) * step
  return t
}
const fmtLeft = (ms) => { const d = Math.floor(ms / 86400e3), h = Math.floor(ms / 3600e3) % 24, m = Math.floor(ms / 60e3) % 60; return d ? `${d}d ${h}h` : `${h}h ${String(m).padStart(2, '0')}m` }
function Ring({ value }) {
  const R = 30, C = 2 * Math.PI * R
  return (
    <svg viewBox="0 0 72 72" className="w-[72px] h-[72px] -rotate-90 shrink-0">
      <circle cx="36" cy="36" r={R} stroke="rgba(255,255,255,.1)" strokeWidth="8" fill="none" />
      <circle cx="36" cy="36" r={R} stroke={value > 85 ? '#ff4d5e' : 'var(--accent)'} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - value / 100)} className="ring-anim" />
    </svg>
  )
}
export function LimitsPanel() {
  const { s, patch, started } = useStore()
  const now = useNow(30000)
  const [form, setForm] = useState({ name: '', every: '5' })
  const limits = s.limits || []
  const add = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    patch((o) => ({ limits: [...(o.limits || []), { id: Date.now(), name: form.name.trim(), used: 0, everyHours: +form.every, anchor: Date.now() + +form.every * 3600e3 }] }))
    setForm({ name: '', every: form.every })
  }
  const upd = (id, p) => patch((o) => ({ limits: o.limits.map((l) => (l.id === id ? { ...l, ...p } : l)) }))
  return (
    <div className={`${panel} p-4 w-[460px]`}>
      <Head title="Limit timers" sub={`Session ${fmtLeft(now - started)} · set your own usage caps`} />
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {limits.length === 0 && <div className="text-sm text-white/50 py-3">Track any capped service: an AI chat plan, a game's daily energy, a free tier. Add one below, slide in how much you've used, and see when it resets.</div>}
        {limits.map((l) => {
          const t = nextReset(l, now.getTime())
          return (
            <div key={l.id} className="flex items-center gap-3 rounded-2xl bg-white/[.06] p-3">
              <div className="relative"><Ring value={l.used} /><div className="absolute inset-0 grid place-items-center text-[15px] font-extrabold tabular-nums">{l.used}%</div></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-[14px] truncate">{l.name}</div>
                  <button onClick={() => patch((o) => ({ limits: o.limits.filter((x) => x.id !== l.id) }))} aria-label={`Delete ${l.name}`} className="w-7 h-7 grid place-items-center rounded-lg text-white/40 hover:text-white hover:bg-white/10"><I n="trash" className="w-3.5 h-3.5" /></button>
                </div>
                <div className="text-[12px] text-white/55 tabular-nums">Resets in {fmtLeft(t - now.getTime())} · every {l.everyHours >= 24 ? `${l.everyHours / 24}d` : `${l.everyHours}h`}</div>
                <input type="range" min="0" max="100" step="5" value={l.used} onChange={(e) => upd(l.id, { used: +e.target.value })} className="vol w-full mt-2" style={{ '--v': `${l.used}%` }} aria-label={`${l.name} used`} />
              </div>
            </div>
          )
        })}
      </div>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. AI chat, weekly" className={`${field} flex-1 min-w-0`} />
        <select value={form.every} onChange={(e) => setForm({ ...form, every: e.target.value })} className={field} aria-label="Resets every">
          {[['3', 'Every 3h'], ['5', 'Every 5h'], ['24', 'Daily'], ['168', 'Weekly'], ['720', 'Monthly']].map(([v, l]) => <option key={v} value={v} className="bg-[#1a1720]">{l}</option>)}
        </select>
        <button className={btn}>Add</button>
      </form>
    </div>
  )
}

/* ---------------- Apps (pin / unpin / order) ---------------- */
export function AppsPanel() {
  const { s, apps, icons, togglePin, movePin } = useStore()
  const [q, setQ] = useState('')
  const pinned = (s.pinned || []).map((p) => apps.find((a) => a.path === p)).filter(Boolean)
  const list = q ? matchApps(q, apps) : apps
  return (
    <div className={`${panel} p-4 w-[480px]`}>
      <Head title="Dock apps" sub={`${pinned.length} pinned`} />
      {pinned.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
          {pinned.map((a, i) => (
            <div key={a.path} className="shrink-0 w-[76px] rounded-2xl bg-white/[.06] p-2 flex flex-col items-center gap-1.5">
              <AppIcon app={a} src={icons[a.path]} size={34} />
              <div className="text-[11px] w-full text-center truncate">{a.name}</div>
              <div className="flex gap-1">
                <button onClick={() => movePin(a.path, -1)} disabled={i === 0} aria-label="Move left" className="w-6 h-6 grid place-items-center rounded-md bg-white/10 disabled:opacity-30"><I n="chevL" className="w-3 h-3" sw={2.4} /></button>
                <button onClick={() => movePin(a.path, 1)} disabled={i === pinned.length - 1} aria-label="Move right" className="w-6 h-6 grid place-items-center rounded-md bg-white/10 disabled:opacity-30"><I n="chevR" className="w-3 h-3" sw={2.4} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search installed apps, e.g. spotify" className={`${field} w-full`} autoFocus />
      <div className="mt-2 max-h-[300px] overflow-y-auto space-y-0.5 pr-1">
        {list.map((a) => {
          const on = s.pinned?.includes(a.path)
          return (
            <button key={a.path} onClick={() => togglePin(a.path)} className="w-full flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/[.07] text-left">
              <AppIcon app={a} src={icons[a.path]} size={28} />
              <span className="flex-1 text-[14px] truncate">{a.name}</span>
              <span className={`h-7 px-2.5 rounded-lg text-[12px] font-bold grid place-items-center ${on ? 'bg-[var(--accent)] text-[#16120e]' : 'bg-white/10'}`}>{on ? 'Pinned' : 'Pin'}</span>
            </button>
          )
        })}
        {!list.length && <div className="text-sm text-white/50 p-3">No app called “{q}”.</div>}
      </div>
    </div>
  )
}

/* ---------------- Settings ---------------- */
function Toggle({ on, set, label, sub }) {
  return (
    <button onClick={() => set(!on)} role="switch" aria-checked={on} className="w-full flex items-center gap-3 py-2 text-left">
      <div className="flex-1"><div className="text-[14px] font-semibold">{label}</div>{sub && <div className="text-[12px] text-white/50">{sub}</div>}</div>
      <span className={`w-11 h-6 rounded-full p-0.5 transition-colors ${on ? 'bg-[var(--accent)]' : 'bg-white/20'}`}><span className={`block w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} /></span>
    </button>
  )
}
export function SettingsPanel() {
  const { s, patch, reset, launch, notify } = useStore()
  const [auto, setAuto] = useState(false)
  useEffect(() => { autostart('get').then(setAuto).catch(() => {}) }, [])
  const w = (k) => (v) => patch((o) => ({ widgets: { ...o.widgets, [k]: v } }))
  return (
    <div className={`${panel} p-4 w-[460px] max-h-[640px] overflow-y-auto`}>
      <div className="flex items-center gap-3 mb-4"><Logo size={36} /><div><div className="font-extrabold text-[16px]">Driftdock</div><div className="text-[12px] text-white/50">Version 0.1.0</div></div></div>
      <div className="text-[12px] font-semibold text-white/50 mb-2">Accent</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(ACCENTS).filter(([k]) => !['violet', 'cyan', 'gold'].includes(k)).map(([k, c]) => (
          <button key={k} onClick={() => patch({ accent: c })} aria-label={k} title={k}
            className={`w-7 h-7 rounded-full ring-offset-2 ring-offset-[#121016] ${s.accent === c ? 'ring-2 ring-white' : ''}`} style={{ background: c }} />
        ))}
      </div>
      {[['radius', 'Corner radius', 0, 100], ['size', 'Dock size', 60, 140]].map(([k, l, min, max]) => (
        <label key={k} className="block mb-3">
          <div className="flex justify-between text-[13px] mb-1.5"><span className="font-semibold">{l}</span><span className="text-white/55 tabular-nums">{s[k]}%</span></div>
          <input type="range" min={min} max={max} value={s[k]} onChange={(e) => patch({ [k]: +e.target.value })} className="vol w-full" style={{ '--v': `${((s[k] - min) / (max - min)) * 100}%` }} />
        </label>
      ))}
      <div className="border-t border-white/10 mt-2 pt-2">
        <Toggle on={s.widgets.media} set={w('media')} label="Music controls" sub="Play, pause, next — works with Spotify, YouTube and most players" />
        <Toggle on={s.widgets.volume} set={w('volume')} label="Volume buttons" />
        <Toggle on={s.widgets.session} set={w('session')} label="Session time" />
        <Toggle on={s.widgets.weather} set={w('weather')} label="Weather" />
        <Toggle on={auto} set={async (v) => { try { await autostart(v); setAuto(v) } catch { notify("Couldn't change startup") } }} label="Start with Windows" />
      </div>
      <div className="border-t border-white/10 mt-2 pt-3 space-y-2">
        <button onClick={() => launch({ name: 'Taskbar settings', path: 'ms-settings:taskbar' })} className="w-full h-10 rounded-xl bg-white/[.08] hover:bg-white/[.13] text-[13px] font-semibold flex items-center justify-center gap-2">Hide the Windows taskbar <I n="ext" className="w-3.5 h-3.5" /></button>
        <div className="text-[12px] text-white/45 px-1">In Taskbar settings, turn on “Automatically hide the taskbar”. Driftdock then takes its place.</div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { call('reindex'); notify('Rescanning your files…') }} className="h-10 rounded-xl bg-white/[.08] hover:bg-white/[.13] text-[13px] font-semibold">Rescan files</button>
          <button onClick={reset} className="h-10 rounded-xl bg-white/[.08] hover:bg-white/[.13] text-[13px] font-semibold">Reset look</button>
        </div>
      </div>
    </div>
  )
}
