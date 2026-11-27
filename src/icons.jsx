import React from 'react'

const P = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  cloud: <path d="M7 18a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 9a4.5 4.5 0 0 1 .5 9z" />,
  rain: <><path d="M7 15a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 6a4.5 4.5 0 0 1 .5 9z" /><path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5" /></>,
  vol: <><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
  mute: <><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M16 9.5l5 5M21 9.5l-5 5" /></>,
  timer: <><circle cx="12" cy="13" r="7.5" /><path d="M12 9v4l2.5 2M9.5 2.5h5" /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />,
  wifi: <><path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0" /><circle cx="12" cy="19" r="1" /></>,
  bt: <path d="M7 7l10 10-5 4V3l5 4L7 17" />,
  dark: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  dnd: <><circle cx="12" cy="12" r="8.5" /><path d="M8 12h8" /></>,
  air: <path d="M10.5 3.5c0-1 .7-1.5 1.5-1.5s1.5.5 1.5 1.5V9l8 4.5v2l-8-2.5v5l2.5 2v1.5L12 20.5 8 21.5V20l2.5-2v-5l-8 2.5v-2l8-4.5z" />,
  night: <><path d="M12 3v2M12 19v2M4.5 12h-2M21.5 12h-2" /><path d="M8 12a4 4 0 0 0 8 0" /><path d="M6 18h12" /></>,
  saver: <><rect x="3" y="7" width="16" height="10" rx="2.5" /><path d="M21 10.5v3M7 10v4M10 10v4" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M3 3l18 18" /></>,
  hotspot: <><circle cx="12" cy="12" r="2" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" /></>,
  pin: <path d="M15 3l6 6-3 1-4 4 .5 4.5L13 20l-3.5-3.5L4 22l-.5-.5L9 16l-3.5-3.5L7 11l4.5.5 4-4z" />,
  chevL: <path d="M15 5l-7 7 7 7" />,
  chevR: <path d="M9 5l7 7-7 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  enter: <path d="M20 5v7a3 3 0 0 1-3 3H5m0 0l4-4m-4 4l4 4" />,
  calc: <><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M8.5 7.5h7M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17" /></>,
  swap: <path d="M4 8h14l-3-3M20 16H6l3 3" />,
  palette: <><path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.8 0-1.4-1.3-1.7-1.3-3 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></>,
  play: <path d="M8 5.5v13l10-6.5z" />,
  next: <><path d="M6 6l8 6-8 6z" /><path d="M17 6v12" /></>,
  prev: <><path d="M18 6l-8 6 8 6z" /><path d="M7 6v12" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></>,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></>,
  ext: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  trash: <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="M20 16l-5-5-8 8" /></>,
  video: <><rect x="3" y="5.5" width="13" height="13" rx="2.5" /><path d="M16 10l5-3v10l-5-3" /></>,
  doc: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>,
  file: <path d="M6 3h8l4 4v14H6zM14 3v4h4" />,
  audio: <><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>,
  archive: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M12 4v8M10.5 6h3M10.5 9h3" /></>,
  snip: <><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /><path d="M8.5 16L19 4M15.5 16L5 4" /></>,
  display: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M9 20h6M12 16v4" /></>,
  nightlight: <><path d="M12 3v2M12 19v2M4.5 12h-2M21.5 12h-2" /><path d="M8 12a4 4 0 0 0 8 0" /><path d="M6 18h12" /></>,
  focus: <><circle cx="12" cy="12" r="8.5" /><path d="M8 12h8" /></>,
  sound: <><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M15.5 9a4 4 0 0 1 0 6" /></>,
  battery: <><rect x="3" y="7" width="16" height="10" rx="2.5" /><path d="M21 10.5v3M7 10v4M10 10v4" /></>,
  taskbar: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 16h18M7 18h2" /></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
}

export function I({ n, className = 'w-5 h-5', fill = false, sw = 1.8 }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {P[n]}
    </svg>
  )
}
