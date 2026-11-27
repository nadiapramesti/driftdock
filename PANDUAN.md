# Panduan Driftdock (buat Nadia)

## 1. Bikin file installer `.exe` (tanpa install apa-apa di laptop)

1. Buka github.com, bikin repo baru, misalnya `driftdock`. Pilih **Private** biar kodenya nggak dicontek.
2. Upload semua isi folder ini ke repo itu. Bisa lewat tombol **Add file → Upload files**, atau pakai git:
   ```bash
   cd driftdock-app
   git init
   git add .
   git commit -m "Driftdock v0.1.0"
   git branch -M main
   git remote add origin https://github.com/USERNAME/driftdock.git
   git push -u origin main
   ```
3. Buka tab **Actions** di repo, nanti ada job **Build Windows installer** yang jalan sendiri (±10–15 menit pertama kali).
4. Kalau udah ✅, klik job-nya, scroll ke **Artifacts**, download **Driftdock-setup**. Di dalamnya ada `Driftdock_0.1.0_x64-setup.exe`.
5. Jalanin `.exe` itu di laptop. Kalau muncul "Windows protected your PC", klik **More info → Run anyway** (itu karena installernya belum ditandatangani, lihat bagian 4).

Kalau job-nya ❌ merah, buka log yang merah, copy error-nya, kirim ke Claude.

## 2. Biar dock-nya gantiin taskbar

Klik ikon ⚙ di dock → **Hide the Windows taskbar** → nyalain "Automatically hide the taskbar".

## 3. Tes sebelum dijual

- Coba di Windows 10 **dan** Windows 11 kalau bisa (laptop temen juga boleh).
- Cek: ikon app muncul, `Ctrl+Alt+Space` buka command bar, ketik nama file ketemu, tombol musik jalan pas Spotify/YouTube nyala, dock ngilang pas nonton video fullscreen.
- Cek pemakaian RAM di Task Manager. Target: di bawah ±80 MB.

## 4. Siap-siap jualan

- **Nama & merek**: "Driftdock" aman dari pencarian awal, tapi cek juga di pdki-indonesia.dgip.go.id sebelum daftar merek.
- **Domain**: README nyebut driftdock.xyz, itu cuma contoh. Beli domain sendiri atau ganti tulisannya.
- **User-Agent cuaca**: ganti `UA` di `src-tauri/src/lib.rs` pakai website/email lu.
- **Tanda tangan installer (code signing)**: biar nggak muncul peringatan SmartScreen. Ada biaya per tahun, bisa nyusul setelah ada pembeli.
- **Tempat jual**: Gumroad, Lemon Squeezy, atau Microsoft Store. Kalau mau pakai license key, bilang aja, nanti ditambahin.
- **Jangan klaim "AI"**: command bar-nya pakai aturan sendiri (offline), bukan model AI. Jualnya sebagai "smart command bar" aja.

## 5. Ganti versi

Naikin `version` di `package.json` dan `src-tauri/tauri.conf.json` (misal 0.1.1), commit, push, terus bikin tag:
```bash
git tag v0.1.1
git push origin v0.1.1
```
Actions bikin draft Release lengkap dengan `.exe`-nya.
