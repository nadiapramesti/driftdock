// Shared timer / pomodoro state. Lives in localStorage so the dock, the command bar
// and the notch window (separate windows, same origin) all see the same timer.

const KEY = 'driftdock.timer'
export const FOCUS_MIN = 25
export const BREAK_MIN = 5

export function readTimer() {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}
function write(t) {
  try { t ? localStorage.setItem(KEY, JSON.stringify(t)) : localStorage.removeItem(KEY) } catch {}
  window.dispatchEvent(new Event('driftdock-timer')) // same-window listeners
}

export function startTimer(minutes, mode = 'timer', label) {
  const ms = Math.round(minutes * 60e3)
  write({ mode, label: label || (mode === 'focus' ? 'Focus' : mode === 'break' ? 'Break' : `${fmtMinutes(minutes)} timer`), total: ms, end: Date.now() + ms, paused: null })
}
export const stopTimer = () => write(null)
export function pauseTimer() {
  const t = readTimer(); if (!t || t.paused != null) return
  write({ ...t, paused: Math.max(0, t.end - Date.now()) })
}
export function resumeTimer() {
  const t = readTimer(); if (!t || t.paused == null) return
  write({ ...t, end: Date.now() + t.paused, paused: null })
}
export const remaining = (t, now = Date.now()) => (t ? (t.paused != null ? t.paused : Math.max(0, t.end - now)) : 0)

export function fmtClock(ms) {
  const s = Math.ceil(ms / 1000); const h = Math.floor(s / 3600); const m = Math.floor(s / 60) % 60; const sec = s % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
}
export function fmtMinutes(min) {
  return min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}` : min < 1 ? `${Math.round(min * 60)}s` : `${min}m`
}

export function onTimerChange(fn) {
  const h = (e) => { if (!e.key || e.key === KEY) fn(readTimer()) }
  window.addEventListener('storage', h)
  window.addEventListener('driftdock-timer', h)
  return () => { window.removeEventListener('storage', h); window.removeEventListener('driftdock-timer', h) }
}
