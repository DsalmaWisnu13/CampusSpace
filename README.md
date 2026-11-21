# CampusSpace — MVP Demo

Aplikasi demo CampusSpace: komunitas diskusi akademik, materi kuliah, pencarian ruangan,
booking, dashboard Tim CDC, dan dashboard dosen.

> **Status: prototipe DEMO.** Semua data jadwal, ruangan, diskusi, dan notifikasi adalah data
> simulasi berlabel DEMO. Ini bukan sistem kampus resmi dan bukan SSO produksi.

## Menjalankan

Butuh Node.js 20+.

```bash
npm install
npm run dev      # http://localhost:5173
```

Perintah lain:

```bash
npm run build      # tsc -b && vite build
npm run preview    # pratinjau hasil build
npm run typecheck  # tsc -b --noEmit
npm run lint       # eslint
npm run test       # vitest run
```

Pada PowerShell yang memblokir skrip, jalankan lewat `cmd /c "npm run dev"`.

## Cara mencoba (3 peran)

Buka halaman awal, lalu pilih peran. Tidak ada kata sandi — autentikasi ini mock.

| Peran | Alur yang bisa dicoba |
|---|---|
| **Mahasiswa** | Ubah pseudonym → cari diskusi `#normalisasi` → balas → buka materi → cari ruang (List/Map) → ajukan booking → lihat status |
| **Tim CDC** | Antrean approval → buka detail (identitas pemohon) → cek benturan → approve / reject dengan alasan → kalender mingguan |
| **Dosen** | Jadwal hari ini → lokasi kelas (tanpa highlight denah) → arsip diskusi read-only → insight anonim → acknowledgement |

Untuk demo alur penuh, gunakan dua jendela browser: mahasiswa mengajukan booking, lalu CDC
memutuskan, lalu kembali ke mahasiswa untuk melihat status dan alasannya.

Menu profil menyediakan **Reset data demo**. Data disimpan di `localStorage` browser.

## Stack

React 19 + TypeScript + Vite 6, Tailwind CSS v4, React Router 7, Lucide, Vitest + Testing Library.
Arsitektur: UI → selector/use case → domain murni → adapter penyimpanan.

## Struktur

```
src/
  app/         router, guards peran, komposisi App
  components/  UI primitives, AppShell, denah, toast
  domain/      types, interval, aturan booking, permission & privacy
  data/        seed DEMO (berbasis minggu berjalan)
  features/    auth, student, cdc, lecturer
  lib/         datetime, storage adapter
  store/       reducer + selectors
tests/         domain, privacy, journeys
```

## Batasan yang disengaja

Lihat `docs/04_EXECUTION/DECISION_LOG.md` (D-013…D-020) dan `docs/04_EXECUTION/IMPLEMENTATION_PLAN.md`.

- Tanpa SSO/API akademik; jadwal berasal dari seed DEMO dan read-only bagi CDC.
- Tanpa Room ID/koordinat resmi → denah tampil apa adanya, tanpa hotspot/highlight.
- Tanpa foto aktual ruangan → tampil “Foto ruangan belum tersedia” (tanpa foto stok).
- Kapasitas & fasilitas ruang belum tersedia sehingga ditampilkan apa adanya.
- Otorisasi hanya di sisi klien; produksi memerlukan backend dan server-side authorization.
