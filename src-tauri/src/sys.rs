// Windows system bridge: now playing (System Media Transport Controls), master volume, power.
// Compiled only on Windows inside the app; type-checked standalone during development.

use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSessionManager as Manager,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus as Status,
};
use windows::core::Interface;
use windows::Foundation::IAsyncOperation;
use windows::Storage::Streams::DataReader;
use windows::Win32::Foundation::BOOL;
use windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume;
use windows::Win32::Media::Audio::{eConsole, eRender, IMMDeviceEnumerator, MMDeviceEnumerator};
use windows::Win32::System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED};
use windows::Win32::System::Power::{GetSystemPowerStatus, SYSTEM_POWER_STATUS};

pub fn init_thread() {
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
    }
}

#[derive(Clone, Default, PartialEq)]
pub struct Media {
    pub title: String,
    pub artist: String,
    pub app: String,
    pub playing: bool,
}

pub fn media() -> Option<Media> {
    let mgr = Manager::RequestAsync().ok()?.get().ok()?;
    let s = mgr.GetCurrentSession().ok()?;
    let props = s.TryGetMediaPropertiesAsync().ok()?.get().ok()?;
    let playing = s.GetPlaybackInfo().ok().and_then(|i| i.PlaybackStatus().ok()).map(|p| p == Status::Playing).unwrap_or(false);
    let title = props.Title().map(|h| h.to_string()).unwrap_or_default();
    if title.is_empty() {
        return None;
    }
    Some(Media {
        title,
        artist: props.Artist().map(|h| h.to_string()).unwrap_or_default(),
        app: s.SourceAppUserModelId().map(|h| h.to_string()).unwrap_or_default(),
        playing,
    })
}

/// Cover art as raw image bytes (usually PNG/JPEG), if the player provides one.
pub fn thumbnail() -> Option<Vec<u8>> {
    let mgr = Manager::RequestAsync().ok()?.get().ok()?;
    let s = mgr.GetCurrentSession().ok()?;
    let props = s.TryGetMediaPropertiesAsync().ok()?.get().ok()?;
    let stream = props.Thumbnail().ok()?.OpenReadAsync().ok()?.get().ok()?;
    let size = stream.Size().ok()? as u32;
    if size == 0 || size > 4_000_000 {
        return None;
    }
    let reader = DataReader::CreateDataReader(&stream).ok()?;
    let load: IAsyncOperation<u32> = reader.LoadAsync(size).ok()?.cast().ok()?;
    load.get().ok()?;
    let mut buf = vec![0u8; size as usize];
    reader.ReadBytes(&mut buf).ok()?;
    Some(buf)
}

/// play | next | prev. Returns false when no player answered (caller falls back to media keys).
pub fn control(action: &str) -> bool {
    let run = || -> windows::core::Result<bool> {
        let mgr = Manager::RequestAsync()?.get()?;
        let s = mgr.GetCurrentSession()?;
        let op = match action {
            "next" => s.TrySkipNextAsync()?,
            "prev" => s.TrySkipPreviousAsync()?,
            _ => s.TryTogglePlayPauseAsync()?,
        };
        op.get()
    };
    run().unwrap_or(false)
}

fn endpoint() -> windows::core::Result<IAudioEndpointVolume> {
    unsafe {
        let en: IMMDeviceEnumerator = CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)?;
        let dev = en.GetDefaultAudioEndpoint(eRender, eConsole)?;
        dev.Activate::<IAudioEndpointVolume>(CLSCTX_ALL, None)
    }
}

/// (level 0..=100, muted)
pub fn volume() -> Option<(u8, bool)> {
    let ep = endpoint().ok()?;
    unsafe {
        let v = ep.GetMasterVolumeLevelScalar().ok()?;
        let m = ep.GetMute().ok()?.as_bool();
        Some(((v * 100.0).round() as u8, m))
    }
}

pub fn set_volume(level: f32) -> bool {
    let Ok(ep) = endpoint() else { return false };
    unsafe {
        let _ = ep.SetMute(BOOL::from(false), std::ptr::null());
        ep.SetMasterVolumeLevelScalar(level.clamp(0.0, 1.0), std::ptr::null()).is_ok()
    }
}

pub fn toggle_mute() -> bool {
    let Ok(ep) = endpoint() else { return false };
    unsafe {
        let m = ep.GetMute().map(|b| b.as_bool()).unwrap_or(false);
        ep.SetMute(BOOL::from(!m), std::ptr::null()).is_ok()
    }
}

/// (battery percent if any, charging/plugged in)
pub fn power() -> (Option<u8>, bool) {
    let mut st = SYSTEM_POWER_STATUS::default();
    if unsafe { GetSystemPowerStatus(&mut st) }.is_err() {
        return (None, true);
    }
    let pct = if st.BatteryFlag & 128 != 0 || st.BatteryLifePercent == 255 { None } else { Some(st.BatteryLifePercent) };
    (pct, st.ACLineStatus == 1)
}
