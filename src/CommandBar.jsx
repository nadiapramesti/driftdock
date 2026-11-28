import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AppIcon } from './art.jsx'
import { I } from './icons.jsx'
import { CAPTIONS, EXAMPLES, run } from './engine.js'
import { useStore } from './store.jsx'
import { call, fileSrc } from './native.js'
import { panel, WeatherCard } from './Panels.jsx'
import { startTimer, stopTimer } from './timer.js'

const EX_ICON = { 'timer 10m': 'timer', pomodoro: 'focus', vsc: 'search', holiday: 'folder', '12*8.5': 'calc', '100 usd to idr': 'swap', 'time in tokyo': 'globe', weather: 'sun', 'volume 40': 'vol', next: 'next', 'dark mode': 'dark', 'make it teal': 'palette', 'corner radius 100': 'sliders', 'wifi settings': 'wifi' }
const fmtSize = (b) => (b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : b > 1e3 ? `${Math.round(b / 1e3)} KB` : b ? `${b} B` : '')

function FileThumb({ f }) {
  const [bad, setBad] = useState(false)
  const src = f.kind === 'image' && !bad ? fileSrc(f.path) : null
  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/[.06] ring-1 ring-white/10 grid place-items-center">
      {src ? <img src={src} alt="" loading="lazy" onError={() => setBad(true)} className="absolute inset-0 w-full h-full object-cover" />
        : <I n={f.kind === 'folder' ? 'folder' : f.kind} className="w-9 h-9 text-white/55" sw={1.5} />}
      {f.kind === 'video' && <span className="absolute left-1.5 top-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-black/55">Video</span>}
    </div>
  )
}

export default function CommandBar({ onClose, weather }) {
  const { s, patch, reset, apps, icons, rates, launch, media, notify } = useStore()
  const [q, setQ] = useState('')
  const [files, setFiles] = useState({ q: '', list: [] })
  const [sel, setSel] = useState(0)
  const [done, setDone] = useState(false)
  const input = useRef(null)

  useEffect(() => { input.current?.focus() }, [])
  useEffect(() => {
    setSel(0); setDone(false)
    const t = q.trim()
    if (t.length < 2) { setFiles({ q: t, list: [] }); return }
    const id = setTimeout(() => call('search_files', { q: t }).then((list) => setFiles({ q: t, list: list || [] })).catch(() => setFiles({ q: t, list: [] })), 110)
    return () => clearTimeout(id)
  }, [q])

  const res = useMemo(() => run(q, {
    apps, rates: rates.map, ratesDate: rates.date,
    files: files.q === q.trim() ? files.list : [], filesPending: files.q !== q.trim(),
  }), [q, apps, rates, files])

  const items = res.type === 'app' ? res.apps : res.type === 'files' ? res.files : res.type === 'help' ? EXAMPLES : []

  const copy = async (text) => { try { await navigator.clipboard.writeText(text); notify(`Copied ${text}`) } catch { notify(text) } }
  const openFile = (f, revealIt) => call(revealIt ? 'reveal' : 'launch', { path: f.path }).then(() => onClose()).catch(() => notify("Couldn't open that file"))

  const execute = async (r = res, i = sel, e) => {
    if (r.type === 'help') { setQ(EXAMPLES[i]); return }
    if (r.action === 'reset') { reset(); setDone(true); return }
    if (r.action) { patch(r.action); setDone(true); return }
    if (r.type === 'app') { await launch(r.apps[i] || r.apps[0]); onClose(); return }
    if (r.type === 'files') { openFile(r.files[i] || r.files[0], e?.ctrlKey); return }
    if (r.type === 'media') { await (r.media ? media(r.media) : call('set_volume', { level: r.volume })); setDone(true); return }
    if (r.type === 'timer') { r.timer ? startTimer(r.timer.minutes, r.timer.mode) : stopTimer(); setDone(true); return }
    if (r.type === 'theme') { try { await call('set_dark_mode', { dark: r.theme }); setDone(true) } catch { notify("Couldn't change the theme") } return }
    if (r.type === 'setting') { await launch({ name: r.title, path: r.uri }); onClose(); return }
    if (['calc', 'convert', 'time'].includes(r.type)) copy(r.title)
  }

  const onKey = (e) => {
    if (e.key === 'Escape') { if (q) setQ(''); else onClose() }
    else if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); setSel((v) => (v + 1) % items.length) }
    else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); setSel((v) => (v - 1 + items.length) % items.length) }
    else if (e.key === 'Enter') { e.preventDefault(); execute(res, sel, e) }
  }

  const doneLabel = { accent: 'Applied to your dock', radius: 'Applied to your dock', size: 'Applied to your dock', reset: 'Done', media: 'Sent to Windows', theme: 'Windows theme changed', timer: 'Running in the notch' }

  return (
    <div className={`${panel} w-[640px] max-w-full overflow-hidden`}>
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
        <I n="search" className="w-5 h-5 text-[var(--accent)] shrink-0" sw={2.2} />
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} spellCheck={false}
          placeholder="Type an app, a file, a sum, or a command — e.g. “100 usd to idr”"
          className="flex-1 bg-transparent outline-none text-[17px] font-medium placeholder:text-white/35 min-w-0" aria-label="Command bar" />
        <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-white/10" aria-label="Close"><I n="x" className="w-4 h-4" /></button>
      </div>

      <div className="p-3 min-h-[240px] max-h-[470px] overflow-y-auto" key={res.type}>
        {res.type === 'help' && (
          <div className="fade-up">
            <div className="px-2 pb-2 text-[12px] font-semibold text-white/45">Try</div>
            <div className="grid grid-cols-2 gap-1">
              {EXAMPLES.map((c, i) => (
                <button key={c} onClick={() => setQ(c)} onMouseEnter={() => setSel(i)}
                  className={`flex items-center gap-3 px-3 h-10 rounded-xl text-left text-[14px] ${sel === i ? 'bg-white/10' : 'hover:bg-white/[.06]'}`}>
                  <I n={EX_ICON[c]} className="w-4 h-4 text-white/60" />{c}
                </button>
              ))}
            </div>
          </div>
        )}

        {(res.action || ['media', 'theme', 'timer'].includes(res.type)) && (
          <div className="fade-up flex items-center gap-4 p-4 rounded-2xl bg-white/[.06]">
            <div className="w-16 h-16 grid place-items-center shrink-0 transition-all duration-500"
              style={{ borderRadius: res.type === 'radius' ? `${res.action.radius / 2}%` : 18, background: res.color || 'var(--accent)', transform: res.type === 'size' ? `scale(${res.action.size / 100})` : undefined }}>
              <I n={res.type === 'accent' ? 'palette' : res.type === 'media' ? 'vol' : res.type === 'theme' ? 'dark' : res.type === 'timer' ? 'timer' : 'sliders'} className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <div className="text-[23px] font-extrabold leading-tight">{res.title}</div>
              <div className={`text-[13px] mt-1 flex items-center gap-1.5 ${done ? 'text-emerald-300' : 'text-white/55'}`}>
                {done ? <><I n="check" className="w-3.5 h-3.5" sw={2.6} />{doneLabel[res.type]}</> : <><I n="enter" className="w-3.5 h-3.5" />Press Enter</>}
              </div>
            </div>
          </div>
        )}

        {res.type === 'setting' && (
          <button onClick={() => execute()} className="fade-up w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[.06] hover:bg-white/10 text-left">
            <div className="w-12 h-12 grid place-items-center rounded-2xl bg-[var(--accent)]"><I n="gear" className="w-6 h-6" /></div>
            <div className="flex-1"><div className="text-[18px] font-bold">{res.title}</div><div className="text-[12px] text-white/55">Opens in Windows Settings</div></div>
            <I n="ext" className="w-4 h-4 text-white/50" />
          </button>
        )}

        {res.type === 'app' && (
          <div className="fade-up space-y-1">
            {res.apps.map((a, i) => (
              <button key={a.path} onClick={() => execute(res, i)} onMouseEnter={() => setSel(i)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left ${sel === i ? 'bg-[color-mix(in_srgb,var(--accent)_26%,transparent)]' : 'hover:bg-white/[.06]'}`}>
                <AppIcon app={a} src={icons[a.path]} size={34} />
                <div className="flex-1 min-w-0"><div className="font-semibold text-[15px] truncate">{a.name}</div><div className="text-[12px] text-white/50">Application</div></div>
                {sel === i && <span className="text-[12px] text-white/60 flex items-center gap-1"><I n="enter" className="w-3.5 h-3.5" />Open</span>}
              </button>
            ))}
            {res.files?.length > 0 && <div className="px-3 pt-2 text-[12px] text-white/45">{res.files.length} matching files — add a letter to see them</div>}
          </div>
        )}

        {res.type === 'files' && (
          <div className="grid grid-cols-3 gap-2.5">
            {res.files.map((f, i) => (
              <button key={f.path} onClick={(e) => openFile(f, e.ctrlKey)} onMouseEnter={() => setSel(i)} title={f.path}
                className={`pop-in text-left p-2 rounded-2xl ${sel === i ? 'bg-white/10 ring-1 ring-[var(--accent)]' : 'hover:bg-white/[.06]'}`} style={{ animationDelay: `${i * 40}ms` }}>
                <FileThumb f={f} />
                <div className="mt-2 text-[13px] font-semibold truncate">{f.name}</div>
                <div className="text-[11px] text-white/50 truncate">{f.kind === 'folder' ? 'Folder' : fmtSize(f.size)} · {new Date(f.modified * 1000).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </button>
            ))}
          </div>
        )}

        {['calc', 'convert', 'time'].includes(res.type) && (
          <button onClick={() => copy(res.title)} className="fade-up w-full text-left px-3 py-6 rounded-2xl hover:bg-white/[.04]">
            <div className="text-[13px] text-white/50 font-medium flex items-center gap-2"><I n={res.type === 'calc' ? 'calc' : res.type === 'time' ? 'globe' : 'swap'} className="w-4 h-4" />{res.sub}</div>
            <div className="text-[64px] font-extrabold leading-none mt-3 tracking-tight tabular-nums">{res.title}</div>
            <div className="text-[12px] text-white/40 mt-3">Enter to copy</div>
          </button>
        )}

        {res.type === 'weather' && <div className="fade-up"><WeatherCard data={weather} /></div>}
        {res.type === 'loading' && <div className="px-3 py-10 flex gap-1.5">{[0, 1, 2].map((i) => <i key={i} className="w-2 h-2 rounded-full bg-white/50 typing-dot" style={{ animationDelay: `${i * 140}ms` }} />)}</div>}
        {res.type === 'none' && <div className="fade-up px-3 py-10 text-white/55 text-[15px]">Nothing for “{q}”. Try an app name, a file name, a sum, a city or a colour.</div>}
      </div>

      <div className="flex items-center justify-between gap-3 px-5 h-11 border-t border-white/10 text-[12px] text-white/45">
        <span className="truncate">{CAPTIONS[res.type]}</span>
        <span className="flex items-center gap-3 shrink-0"><span>↑↓ select</span><span>↵ run</span>{res.type === 'files' && <span>Ctrl ↵ show in folder</span>}<span>esc close</span></span>
      </div>
    </div>
  )
}
