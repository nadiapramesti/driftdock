// Driftdock — native side. Kept small on purpose: everything heavy runs once, in the background.

use serde::Serialize;
use std::collections::HashMap;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, State, WebviewWindow};
use tauri_plugin_autostart::ManagerExt as _;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_opener::OpenerExt;

#[cfg(windows)]
mod win;
#[cfg(windows)]
mod sys;

const UA: &str = "Driftdock/0.1 (+https://driftdock.xyz)";

// ---------------------------------------------------------------- state

#[derive(Default)]
struct Shared {
    files: Mutex<Vec<FileHit>>,
    indexing: Mutex<bool>,
    ps: Mutex<Option<(Child, ChildStdin)>>,
    user_hidden: Mutex<bool>,
    snapshot: Mutex<serde_json::Value>,
    notch_off: Mutex<bool>,
}
type S<'a> = State<'a, Arc<Shared>>;

#[derive(Serialize, Clone)]
struct AppEntry {
    name: String,
    path: String,
}

#[derive(Serialize, Clone)]
struct FileHit {
    name: String,
    path: String,
    kind: String,
    size: u64,
    modified: u64,
    #[serde(skip)]
    lower: String,
}

// ---------------------------------------------------------------- helpers

fn hidden(cmd: &mut Command) -> &mut Command {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    }
    cmd
}

fn env_path(key: &str) -> Option<PathBuf> {
    std::env::var_os(key).map(PathBuf::from)
}

fn home() -> PathBuf {
    env_path("USERPROFILE").or_else(|| env_path("HOME")).unwrap_or_else(|| PathBuf::from("."))
}

fn powershell_file(script: &str, args: &[&str]) -> Result<String, String> {
    let dir = std::env::temp_dir();
    let stamp = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0);
    let file = dir.join(format!("driftdock-{stamp}.ps1"));
    // UTF-8 BOM so Windows PowerShell 5.1 reads non-ASCII paths correctly
    std::fs::write(&file, format!("\u{feff}{script}")).map_err(|e| e.to_string())?;
    let mut cmd = Command::new("powershell");
    cmd.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File"]).arg(&file).args(args);
    let out = hidden(&mut cmd).output().map_err(|e| e.to_string());
    let _ = std::fs::remove_file(&file);
    let out = out?;
    Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
}

// ---------------------------------------------------------------- apps

fn start_menu_dirs() -> Vec<PathBuf> {
    let mut v = vec![];
    if let Some(p) = env_path("ProgramData") {
        v.push(p.join("Microsoft\\Windows\\Start Menu\\Programs"));
    }
    if let Some(p) = env_path("APPDATA") {
        v.push(p.join("Microsoft\\Windows\\Start Menu\\Programs"));
    }
    v
}

fn walk_links(dir: &Path, depth: u8, out: &mut Vec<AppEntry>) {
    if depth > 4 {
        return;
    }
    let Ok(rd) = std::fs::read_dir(dir) else { return };
    for e in rd.flatten() {
        let p = e.path();
        if p.is_dir() {
            walk_links(&p, depth + 1, out);
            continue;
        }
        let ext = p.extension().and_then(|s| s.to_str()).unwrap_or("").to_ascii_lowercase();
        if !matches!(ext.as_str(), "lnk" | "url" | "appref-ms") {
            continue;
        }
        let name = p.file_stem().and_then(|s| s.to_str()).unwrap_or("").to_string();
        let low = name.to_lowercase();
        if name.is_empty() || ["uninstall", "readme", "help", "documentation", "release notes", "website", "license"].iter().any(|w| low.contains(w)) {
            continue;
        }
        out.push(AppEntry { name, path: p.to_string_lossy().into_owned() });
    }
}

#[tauri::command]
fn list_apps() -> Vec<AppEntry> {
    let mut v = vec![];
    for d in start_menu_dirs() {
        walk_links(&d, 0, &mut v);
    }
    let windir = env_path("SystemRoot").unwrap_or_else(|| PathBuf::from("C:\\Windows"));
    v.push(AppEntry { name: "File Explorer".into(), path: windir.join("explorer.exe").to_string_lossy().into_owned() });
    v.push(AppEntry { name: "Settings".into(), path: "ms-settings:".into() });
    let mut seen = std::collections::HashSet::new();
    v.retain(|a| seen.insert(a.name.to_lowercase()));
    v.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    v
}

const ICON_PS: &str = r#"
param([string]$ListFile)
Add-Type -AssemblyName System.Drawing
$sh = New-Object -ComObject WScript.Shell
$paths = Get-Content -LiteralPath $ListFile -Encoding UTF8
$out = @{}
foreach ($p in $paths) {
  if (-not $p) { continue }
  try {
    $t = $p
    if ($p.ToLower().EndsWith('.lnk')) {
      $s = $sh.CreateShortcut($p)
      if ($s.IconLocation -and $s.IconLocation -notmatch '^,') {
        $loc = ($s.IconLocation -split ',')[0]
        $loc = [Environment]::ExpandEnvironmentVariables($loc)
        if (Test-Path -LiteralPath $loc) { $t = $loc }
      }
      if ($t -eq $p -and $s.TargetPath -and (Test-Path -LiteralPath $s.TargetPath)) { $t = $s.TargetPath }
    }
    $ic = [System.Drawing.Icon]::ExtractAssociatedIcon($t)
    $bmp = $ic.ToBitmap()
    $ms = New-Object IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $out[$p] = [Convert]::ToBase64String($ms.ToArray())
  } catch {}
}
$out | ConvertTo-Json -Compress
"#;

#[tauri::command]
async fn app_icons(paths: Vec<String>) -> HashMap<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let list = std::env::temp_dir().join("driftdock-icons.txt");
        let wanted: Vec<&String> = paths.iter().filter(|p| !p.contains(':') || p.len() > 3).collect();
        if std::fs::write(&list, wanted.iter().map(|s| s.as_str()).collect::<Vec<_>>().join("\n")).is_err() {
            return HashMap::new();
        }
        let res = powershell_file(ICON_PS, &[&list.to_string_lossy()]).unwrap_or_default();
        let _ = std::fs::remove_file(&list);
        serde_json::from_str::<HashMap<String, String>>(&res).unwrap_or_default()
    })
    .await
    .unwrap_or_default()
}

#[tauri::command]
fn launch(app: AppHandle, path: String) -> Result<(), String> {
    if path.contains(":") && !path.contains(":\\") && !path.starts_with("\\\\") {
        // URIs such as ms-settings: or https://
        return app.opener().open_url(path, None::<&str>).map_err(|e| e.to_string());
    }
    app.opener().open_path(path, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
fn reveal(app: AppHandle, path: String) -> Result<(), String> {
    app.opener().reveal_item_in_dir(path).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------- file search

const SKIP_DIRS: [&str; 10] = ["node_modules", "appdata", ".git", "$recycle.bin", "venv", ".venv", "__pycache__", "build", "dist", "target"];

fn kind_of(ext: &str) -> &'static str {
    match ext {
        "jpg" | "jpeg" | "png" | "gif" | "webp" | "bmp" | "heic" => "image",
        "mp4" | "mkv" | "mov" | "avi" | "webm" | "wmv" => "video",
        "mp3" | "wav" | "flac" | "m4a" | "ogg" => "audio",
        "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" | "txt" | "md" | "csv" => "doc",
        "zip" | "rar" | "7z" => "archive",
        _ => "file",
    }
}

fn index_dir(dir: &Path, depth: u8, out: &mut Vec<FileHit>) {
    if depth > 7 || out.len() > 80_000 {
        return;
    }
    let Ok(rd) = std::fs::read_dir(dir) else { return };
    for e in rd.flatten() {
        let name = e.file_name().to_string_lossy().into_owned();
        if name.starts_with('.') || name.starts_with('~') {
            continue;
        }
        let Ok(meta) = e.metadata() else { continue };
        let modified = meta.modified().ok().and_then(|m| m.duration_since(UNIX_EPOCH).ok()).map(|d| d.as_secs()).unwrap_or(0);
        let path = e.path();
        if meta.is_dir() {
            if SKIP_DIRS.contains(&name.to_lowercase().as_str()) {
                continue;
            }
            out.push(FileHit { lower: name.to_lowercase(), name, path: path.to_string_lossy().into_owned(), kind: "folder".into(), size: 0, modified });
            index_dir(&path, depth + 1, out);
        } else {
            let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("").to_ascii_lowercase();
            if matches!(ext.as_str(), "lnk" | "ini" | "tmp" | "dll" | "sys") {
                continue;
            }
            out.push(FileHit { lower: name.to_lowercase(), name, path: path.to_string_lossy().into_owned(), kind: kind_of(&ext).into(), size: meta.len(), modified });
        }
    }
}

fn build_index(shared: Arc<Shared>) {
    {
        let mut busy = shared.indexing.lock().unwrap();
        if *busy {
            return;
        }
        *busy = true;
    }
    std::thread::spawn(move || {
        let h = home();
        let mut roots = vec![];
        for d in ["Desktop", "Documents", "Downloads", "Pictures", "Videos", "Music"] {
            roots.push(h.join(d));
            roots.push(h.join("OneDrive").join(d));
        }
        let mut out = vec![];
        for r in roots.iter().filter(|r| r.is_dir()) {
            index_dir(r, 0, &mut out);
        }
        *shared.files.lock().unwrap() = out;
        *shared.indexing.lock().unwrap() = false;
    });
}

#[tauri::command]
fn search_files(q: String, shared: S) -> Vec<FileHit> {
    let q = q.trim().to_lowercase();
    if q.len() < 2 {
        return vec![];
    }
    let files = shared.files.lock().unwrap();
    let mut hits: Vec<&FileHit> = files.iter().filter(|f| f.lower.contains(&q)).collect();
    hits.sort_by_key(|f| (!f.lower.starts_with(&q), f.kind != "folder", std::cmp::Reverse(f.modified)));
    hits.into_iter().take(12).cloned().collect()
}

#[tauri::command]
fn reindex(shared: S) {
    build_index(shared.inner().clone());
}

// ---------------------------------------------------------------- system: media keys + theme

fn ps_send(shared: &Shared, line: &str) -> Result<(), String> {
    let mut slot = shared.ps.lock().unwrap();
    if slot.is_none() {
        let mut cmd = Command::new("powershell");
        cmd.args(["-NoProfile", "-NonInteractive", "-NoLogo", "-Command", "-"]).stdin(Stdio::piped()).stdout(Stdio::null()).stderr(Stdio::null());
        let mut child = hidden(&mut cmd).spawn().map_err(|e| e.to_string())?;
        let mut stdin = child.stdin.take().ok_or("no stdin")?;
        writeln!(stdin, "$w = New-Object -ComObject WScript.Shell").map_err(|e| e.to_string())?;
        *slot = Some((child, stdin));
    }
    let ok = slot.as_mut().map(|(_, s)| writeln!(s, "{line}").and_then(|_| s.flush()).is_ok()).unwrap_or(false);
    if !ok {
        *slot = None; // process died: restart on next call
        return Err("media helper restarted, try again".into());
    }
    Ok(())
}

#[tauri::command]
fn media_key(key: String, times: Option<u8>, shared: S) -> Result<(), String> {
    let code = match key.as_str() {
        "mute" => 173,
        "down" => 174,
        "up" => 175,
        "next" => 176,
        "prev" => 177,
        "play" => 179,
        _ => return Err("unknown key".into()),
    };
    let n = times.unwrap_or(1).clamp(1, 50);
    ps_send(&shared, &format!("1..{n} | % {{ $w.SendKeys([char]{code}) }}"))
}

const THEME_KEY: &str = r"HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize";

#[tauri::command]
fn get_dark_mode() -> bool {
    let mut cmd = Command::new("reg");
    cmd.args(["query", THEME_KEY, "/v", "AppsUseLightTheme"]);
    hidden(&mut cmd).output().map(|o| String::from_utf8_lossy(&o.stdout).contains("0x0")).unwrap_or(true)
}

#[tauri::command]
fn set_dark_mode(dark: bool) -> Result<(), String> {
    let v = if dark { "0" } else { "1" };
    for name in ["AppsUseLightTheme", "SystemUsesLightTheme"] {
        let mut cmd = Command::new("reg");
        cmd.args(["add", THEME_KEY, "/v", name, "/t", "REG_DWORD", "/d", v, "/f"]);
        hidden(&mut cmd).status().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ---------------------------------------------------------------- network (weather + rates)

#[tauri::command]
async fn weather(lat: f64, lon: f64) -> Result<serde_json::Value, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let url = format!("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat={lat:.3}&lon={lon:.3}");
        let v: serde_json::Value = ureq::get(&url).set("User-Agent", UA).timeout(Duration::from_secs(12)).call().map_err(|e| e.to_string())?.into_json().map_err(|e| e.to_string())?;
        let series = v["properties"]["timeseries"].as_array().cloned().unwrap_or_default();
        let hours: Vec<serde_json::Value> = series
            .iter()
            .take(8)
            .map(|s| {
                serde_json::json!({
                    "time": s["time"],
                    "temp": s["data"]["instant"]["details"]["air_temperature"],
                    "wind": s["data"]["instant"]["details"]["wind_speed"],
                    "humidity": s["data"]["instant"]["details"]["relative_humidity"],
                    "symbol": s["data"]["next_1_hours"]["summary"]["symbol_code"],
                })
            })
            .collect();
        Ok(serde_json::json!({ "hours": hours }))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn rates() -> Result<serde_json::Value, String> {
    tauri::async_runtime::spawn_blocking(|| {
        ureq::get("https://api.frankfurter.dev/v1/latest?base=USD")
            .set("User-Agent", UA)
            .timeout(Duration::from_secs(12))
            .call()
            .map_err(|e| e.to_string())?
            .into_json::<serde_json::Value>()
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

// ---------------------------------------------------------------- window layout

/// Width/height are CSS pixels. The window sits centred on the bottom edge of the
/// monitor's work area (so it never covers the Windows taskbar if that is still visible).
#[tauri::command]
fn set_layout(window: WebviewWindow, width: f64, height: f64, gap: Option<f64>, anchor: Option<String>) -> Result<(), String> {
    let mon = window.current_monitor().map_err(|e| e.to_string())?.or(window.primary_monitor().map_err(|e| e.to_string())?).ok_or("no monitor")?;
    let sf = mon.scale_factor();
    let area = mon.work_area();
    let w = (width * sf).round() as u32;
    let h = (height * sf).round() as u32;
    let g = (gap.unwrap_or(8.0) * sf).round() as i32;
    let (x, y) = if anchor.as_deref() == Some("top") {
        // the notch hangs from the very top edge of the screen, centred on the monitor
        let (p, sz) = (mon.position(), mon.size());
        (p.x + (sz.width as i32 - w as i32) / 2, p.y + g)
    } else {
        (area.position.x + (area.size.width as i32 - w as i32) / 2, area.position.y + area.size.height as i32 - h as i32 - g)
    };
    window.set_size(PhysicalSize::new(w, h)).map_err(|e| e.to_string())?;
    window.set_position(PhysicalPosition::new(x, y)).map_err(|e| e.to_string())?;
    Ok(())
}

// ---------------------------------------------------------------- media, volume, notch

#[tauri::command]
fn get_sys(shared: S) -> serde_json::Value {
    shared.snapshot.lock().unwrap().clone()
}

/// play | next | prev — asks the player directly, falls back to media keys.
#[tauri::command]
fn media_control(action: String, shared: S) -> Result<(), String> {
    #[cfg(windows)]
    {
        let a = action.clone();
        let ok = std::thread::spawn(move || {
            sys::init_thread();
            sys::control(&a)
        })
        .join()
        .unwrap_or(false);
        if ok {
            return Ok(());
        }
    }
    let code = match action.as_str() {
        "next" => 176,
        "prev" => 177,
        _ => 179,
    };
    ps_send(&shared, &format!("$w.SendKeys([char]{code})"))
}

/// level 0..=100, or None to toggle mute
#[tauri::command]
fn set_volume(level: Option<f32>, shared: S) -> Result<(), String> {
    #[cfg(windows)]
    {
        let ok = std::thread::spawn(move || {
            sys::init_thread();
            match level {
                Some(l) => sys::set_volume(l / 100.0),
                None => sys::toggle_mute(),
            }
        })
        .join()
        .unwrap_or(false);
        if ok {
            return Ok(());
        }
    }
    match level {
        None => ps_send(&shared, "$w.SendKeys([char]173)"),
        Some(l) => ps_send(&shared, &format!("1..50 | % {{ $w.SendKeys([char]174) }}; 1..{} | % {{ $w.SendKeys([char]175) }}", (l / 2.0).round().max(0.0) as u32)),
    }
}

#[tauri::command]
fn set_notch(app: AppHandle, enabled: bool, shared: S) {
    *shared.notch_off.lock().unwrap() = !enabled;
    if let Some(w) = app.get_webview_window("notch") {
        let _ = if enabled { w.show() } else { w.hide() };
    }
}

#[cfg(windows)]
fn watch_system(app: AppHandle, shared: Arc<Shared>) {
    use base64::Engine as _;
    std::thread::spawn(move || {
        sys::init_thread();
        let mut last_title = String::new();
        let mut art: Option<String> = None;
        let mut last = serde_json::Value::Null;
        loop {
            let media = sys::media();
            if let Some(m) = &media {
                let key = format!("{}|{}", m.title, m.artist);
                if key != last_title {
                    last_title = key;
                    art = sys::thumbnail().map(|b| {
                        let mime = if b.starts_with(&[0x89, b'P', b'N', b'G']) { "image/png" } else { "image/jpeg" };
                        format!("data:{mime};base64,{}", base64::engine::general_purpose::STANDARD.encode(b))
                    });
                }
            } else {
                last_title.clear();
                art = None;
            }
            let (vol, muted) = sys::volume().unwrap_or((0, false));
            let (battery, charging) = sys::power();
            let snap = serde_json::json!({
                "media": media.as_ref().map(|m| serde_json::json!({ "title": m.title, "artist": m.artist, "app": m.app, "playing": m.playing, "art": art })),
                "volume": vol, "muted": muted, "battery": battery, "charging": charging,
            });
            if snap != last {
                last = snap.clone();
                *shared.snapshot.lock().unwrap() = snap.clone();
                let _ = app.emit("sys", snap);
            }
            std::thread::sleep(Duration::from_millis(700));
        }
    });
}

#[tauri::command]
fn show_dock(window: WebviewWindow, shared: S) {
    *shared.user_hidden.lock().unwrap() = false;
    let _ = window.show();
}

fn toggle_search(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.set_focus();
        let _ = app.emit("toggle-search", ());
    }
}

// ---------------------------------------------------------------- app

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let shared = Arc::new(Shared::default());
    let search_key = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::Space);

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| toggle_search(app)))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--autostart"])))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, sc, ev| {
                    if sc == &search_key && ev.state() == ShortcutState::Pressed {
                        toggle_search(app);
                    }
                })
                .build(),
        )
        .manage(shared.clone())
        .setup(move |app| {
            let handle = app.handle().clone();
            let _ = app.global_shortcut().register(search_key);

            // tray
            let show = MenuItem::with_id(app, "show", "Show / hide dock", true, None::<&str>)?;
            let search = MenuItem::with_id(app, "search", "Open search  (Ctrl+Alt+Space)", true, None::<&str>)?;
            let reindex = MenuItem::with_id(app, "reindex", "Rescan files", true, None::<&str>)?;
            let auto_on = app.autolaunch().is_enabled().unwrap_or(false);
            let autostart = CheckMenuItem::with_id(app, "autostart", "Start with Windows", true, auto_on, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Driftdock", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let menu = Menu::with_items(app, &[&show, &search, &reindex, &autostart, &sep, &quit])?;
            let sh = shared.clone();
            let auto_item = autostart.clone();
            TrayIconBuilder::with_id("tray")
                .icon(app.default_window_icon().cloned().ok_or("no icon")?)
                .tooltip("Driftdock")
                .menu(&menu)
                .on_menu_event(move |app, ev| match ev.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let vis = w.is_visible().unwrap_or(true);
                            *sh.user_hidden.lock().unwrap() = vis;
                            let _ = if vis { w.hide() } else { w.show() };
                        }
                    }
                    "search" => toggle_search(app),
                    "reindex" => build_index(sh.clone()),
                    "autostart" => {
                        let al = app.autolaunch();
                        let on = al.is_enabled().unwrap_or(false);
                        let _ = if on { al.disable() } else { al.enable() };
                        let _ = auto_item.set_checked(!on);
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            // first run: start with Windows by default
            let flag = app.path().app_config_dir().map(|d| d.join(".installed")).ok();
            if let Some(f) = flag {
                if !f.exists() {
                    let _ = app.autolaunch().enable();
                    let _ = autostart.set_checked(true);
                    let _ = std::fs::create_dir_all(f.parent().unwrap_or(Path::new(".")));
                    let _ = std::fs::write(&f, "1");
                }
            }

            build_index(shared.clone());
            #[cfg(windows)]
            watch_system(app.handle().clone(), shared.clone());

            // rescan files every 30 minutes; hide the dock over fullscreen apps (Windows only)
            let sh2 = shared.clone();
            std::thread::spawn(move || {
                let mut ticks: u32 = 0;
                #[allow(unused_mut)]
                let mut hidden_for_fs = false;
                loop {
                    std::thread::sleep(Duration::from_millis(700));
                    ticks += 1;
                    if ticks % 2570 == 0 {
                        build_index(sh2.clone());
                    }
                    #[cfg(windows)]
                    if let Some(w) = handle.get_webview_window("main") {
                        let fs = win::foreground_is_fullscreen(&w);
                        if fs != hidden_for_fs {
                            hidden_for_fs = fs;
                            let notch = handle.get_webview_window("notch");
                            if fs {
                                let _ = w.hide();
                                if let Some(n) = &notch {
                                    let _ = n.hide();
                                }
                            } else {
                                if !*sh2.user_hidden.lock().unwrap() {
                                    let _ = w.show();
                                }
                                if let Some(n) = &notch {
                                    if !*sh2.notch_off.lock().unwrap() {
                                        let _ = n.show();
                                    }
                                }
                            }
                        }
                    }
                    #[cfg(not(windows))]
                    let _ = (&handle, hidden_for_fs);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_apps, app_icons, launch, reveal, search_files, reindex, media_key, get_dark_mode, set_dark_mode, weather, rates, set_layout, show_dock, get_sys, media_control, set_volume, set_notch
        ])
        .run(tauri::generate_context!())
        .expect("error while running Driftdock");
}
