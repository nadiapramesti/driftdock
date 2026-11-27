// Windows-only: detect a fullscreen foreground window (games, videos, slideshows)
// so the dock can step aside. Plain user32 FFI, no extra crates.

use tauri::WebviewWindow;

#[repr(C)]
#[derive(Default, Clone, Copy)]
struct Rect {
    left: i32,
    top: i32,
    right: i32,
    bottom: i32,
}

#[link(name = "user32")]
extern "system" {
    fn GetForegroundWindow() -> isize;
    fn GetShellWindow() -> isize;
    fn GetDesktopWindow() -> isize;
    fn GetWindowRect(hwnd: isize, rect: *mut Rect) -> i32;
    fn GetClassNameW(hwnd: isize, buf: *mut u16, max: i32) -> i32;
}

fn class_name(h: isize) -> String {
    let mut buf = [0u16; 128];
    let n = unsafe { GetClassNameW(h, buf.as_mut_ptr(), buf.len() as i32) };
    String::from_utf16_lossy(&buf[..n.max(0) as usize])
}

pub fn foreground_is_fullscreen(win: &WebviewWindow) -> bool {
    let fg = unsafe { GetForegroundWindow() };
    if fg == 0 || fg == unsafe { GetShellWindow() } || fg == unsafe { GetDesktopWindow() } {
        return false;
    }
    if let Ok(own) = win.hwnd() {
        if own.0 as isize == fg {
            return false;
        }
    }
    let cls = class_name(fg);
    if cls == "WorkerW" || cls == "Progman" || cls == "Shell_TrayWnd" {
        return false;
    }
    let mut r = Rect::default();
    if unsafe { GetWindowRect(fg, &mut r) } == 0 {
        return false;
    }
    let Ok(Some(mon)) = win.current_monitor() else { return false };
    let (p, s) = (mon.position(), mon.size());
    r.left <= p.x && r.top <= p.y && r.right >= p.x + s.width as i32 && r.bottom >= p.y + s.height as i32
}
