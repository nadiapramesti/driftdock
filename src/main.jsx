import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/onest/400.css'
import '@fontsource/onest/500.css'
import '@fontsource/onest/600.css'
import '@fontsource/onest/700.css'
import '@fontsource/onest/800.css'
import App from './App.jsx'
import './index.css'
document.addEventListener('contextmenu', (e) => e.preventDefault())
createRoot(document.getElementById('root')).render(<App />)
