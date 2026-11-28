import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/onest/400.css'
import '@fontsource/onest/500.css'
import '@fontsource/onest/600.css'
import '@fontsource/onest/700.css'
import '@fontsource/onest/800.css'
import App from './App.jsx'
import Notch from './Notch.jsx'
import './index.css'

// Two windows load this page: "main" (the dock) and "notch". Browser preview: add #notch to the URL.
const label = window.__TAURI_INTERNALS__?.metadata?.currentWindow?.label || (location.hash === '#notch' ? 'notch' : 'main')
document.addEventListener('contextmenu', (e) => e.preventDefault())
createRoot(document.getElementById('root')).render(label === 'notch' ? <Notch /> : <App />)
