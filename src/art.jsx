import React from 'react'

const HUES = ['#ff8a3d', '#3b8bff', '#2fd28a', '#9b6bff', '#ff4fa3', '#22d3c5', '#f5b942', '#ff4d5e']
const hue = (s) => HUES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length]

export function AppIcon({ app, src, size = 48 }) {
  if (src) {
    return (
      <span className="grid place-items-center" style={{ width: size, height: size }}>
        <img src={src} alt="" draggable={false} className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,.35)]" />
      </span>
    )
  }
  const c = hue(app?.name || '?')
  const letters = (app?.name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className="grid place-items-center rounded-[28%] font-extrabold text-white shadow-[0_6px_12px_-4px_rgba(0,0,0,.5)]"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(145deg, ${c}, color-mix(in srgb, ${c} 55%, #000))` }}>
      {letters}
    </span>
  )
}

export function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-label="Driftdock">
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe2b8" /><stop offset="1" stopColor="var(--accent)" /></linearGradient></defs>
      <rect x="2" y="2" width="36" height="36" rx="11" fill="#12100e" stroke="url(#lg)" strokeWidth="2" />
      <path d="M9 19c4-5 8-5 11 0s7 5 11 0" stroke="url(#lg)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <rect x="10" y="26" width="20" height="5" rx="2.5" fill="url(#lg)" />
    </svg>
  )
}
