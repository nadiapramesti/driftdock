# Driftdock

A light, floating dock for Windows 10 and 11. Pin your apps, type to launch anything, find files with previews, do quick sums and conversions, control music, and keep a small agenda, all from one bar at the bottom of the screen.

## Features

- **Floating dock** with Mac-style magnification. Pin any installed app (real icons, read from the Start Menu).
- **Command bar** (`Ctrl + Alt + Space` from anywhere):
  - apps from a few letters (`vsc`, `chrome`, `wa`)
  - files and folders in Desktop, Documents, Downloads, Pictures, Videos and Music, with image previews (`Enter` to open, `Ctrl + Enter` to show in folder)
  - calculator (`12*8.5`), currency with daily ECB rates (`100 usd to idr`), units (`5 km`, `30 c to f`)
  - time in 40+ cities (`time in tokyo`), live weather (`weather`)
  - music and volume (`next`, `play`, `mute`, `volume 40`)
  - timers (`timer 5m`, `pomodoro`, `stop timer`)
  - Windows dark/light mode (`dark mode`, `light mode`)
  - jump to settings (`wifi settings`, `bluetooth`, `open display`)
  - restyle the dock (`make it teal`, `corner radius 100`, `dock size 80`, `reset`)
- **Notch** at the top of the screen, like a phone's island:
  - now playing from any app that uses Windows media controls (Spotify, YouTube in the browser, VLC…) with cover art, play/pause/next and a real volume slider
  - timers and Pomodoro (`timer 10m`, `pomodoro`, `stop timer`), counting down live
  - your next agenda item, with a reminder 10 minutes before
  - quick alerts when volume, charger, low battery or internet changes
  - turn it off in Settings if you don't want it
- **Quick actions**: real dark-mode switch plus one-click jumps to Wi‑Fi, Bluetooth, Night light, Display, Sound, Battery, Screenshot and more.
- **Calendar**: a local agenda for meetings, payouts and renewals, with weekly, monthly and yearly repeats.
- **Limit timers**: track any capped plan or quota and see when it resets.
- **Weather** for the city you choose (data: MET Norway).
- Hides itself over fullscreen apps and games. Starts with Windows (can be turned off). Tray icon for show/hide, rescan files, and quit.

Everything runs locally. The only network calls are weather (api.met.no) and exchange rates (api.frankfurter.dev). No account, no tracking.

## Requirements

Windows 10 (version 1803 or later) or Windows 11, 64-bit. The installer adds Microsoft WebView2 automatically if it is missing (Windows 11 already has it).

## Build

The easy way is GitHub Actions: push this folder to a GitHub repository, and the **Build Windows installer** workflow produces `Driftdock_0.1.0_x64-setup.exe` under the run's *Artifacts*. Push a tag such as `v0.1.0` to also get a draft release with the installer attached.

Building on your own Windows PC:

```powershell
# one-time: Node.js 20+, Rust (https://rustup.rs) and "Desktop development with C++" from Visual Studio Build Tools
npm install
npx tauri dev      # run with hot reload
npx tauri build    # installer in src-tauri\target\release\bundle\nsis\
```

`npm run dev` alone opens a browser preview with sample data, which is handy for UI work on any OS.

## Project layout

```
src/            React + Tailwind UI (dock, command bar, panels)
src/engine.js   the command rules (offline, no AI model)
src/native.js   bridge to Rust, with browser fallbacks
src-tauri/      Rust side: app list + icons, file index, launching, media keys, theme, weather, rates, window placement
```

## Before you sell it

- Change `UA` in `src-tauri/src/lib.rs` to include your own website or email. MET Norway asks every app to identify itself.
- Keep the "Data: MET Norway" credit in the weather card (their data is CC BY 4.0).
- Sign the installer with a code-signing certificate, or Windows SmartScreen will warn buyers the first time they run it.
- Driftdock is built on open-source parts (Tauri, React, Tailwind, the Onest font) whose licences allow commercial use. Keep their licence notices with the app.

## Credits

Built by Nadia Pramesti, with Claude (Anthropic) as AI pair-programmer.
