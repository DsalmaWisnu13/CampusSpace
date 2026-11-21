# Decision Log

## Keputusan produk (terkonfirmasi)
D-001 tiga role Student/CDC/Lecturer — Confirmed.
D-002 student login akun kampus, pseudonym publik — Confirmed.
D-003 CDC melihat identitas pemohon untuk approval — Confirmed.
D-004 lecturer hanya agregat anonim — Confirmed.
D-005 lecturer read-only, boleh acknowledgement — Confirmed.
D-006 room module List+Map — Confirmed.
D-007 denah pakai gambar asli — Confirmed.
D-008 notification center per role — Confirmed.
D-009 materi + arsip per meeting + sumber belajar dosen — Confirmed.
D-010 jadwal dari data akademik, diinput petugas berwenang — Confirmed.
D-011 React+TS+Vite jika repo kosong — Confirmed (repo memang kosong; scaffold dibuat).
D-012 mock repositories/DEMO data untuk MVP — Confirmed.

## Keputusan teknis implementasi
D-013 **Persistence lewat `StorageAdapter`** (`src/lib/storage.ts`), dengan adapter `localStorage`
dan `in-memory` untuk test. Komponen tidak pernah menyentuh `localStorage` langsung (sesuai
`ARCHITECTURE.md`). Adapter `localStorage` tidak tersedia (mode privat) → aplikasi tetap jalan
in-memory dan menandainya di UI.

D-014 **Denah tanpa hotspot/highlight.** `Floor.mappingStatus` selalu `UNVERIFIED` dan `Room.mapRegion`
tidak ada, sehingga `canHighlightOnMap` selalu `false` dan tidak ada data koordinat yang dikarang.
Denah ditampilkan apa adanya dengan catatan eksplisit; List View tetap lengkap.

D-015 **Nama ruang Lantai 4 adalah label posisional DEMO** (`Ruang Kelas 4-01`…`4-10`), sedangkan
Lantai L memakai nama dari legenda denah (SGA, Lab Robot, Lab Room, Lab Chemistry, Perpustakaan).
Tidak ada kapasitas, fasilitas, atau foto yang dikarang; field kosong ditampilkan "Belum tersedia".

D-016 **Layout ruang tidak menyertakan kapasitas/fasilitas palsu.** Data yang tidak tersedia
ditampilkan eksplisit agar tidak menyesatkan (sesuai larangan mengarang data).

D-017 **Token desain mengikuti Design Brief**: primary `#3049D8`, teks `#171B3A`, latar `#F5F6FA`,
lavender `#E8E9FF`. Status memakai token pale (`available`/`pending`/`danger`/`info`), bukan
palet default Tailwind, agar tidak muncul gradient/glassmorphism berlebihan.

D-018 **CDC schedule screen read-only.** Kewenangan CDC vs bagian akademik belum ditetapkan
(`Open questions`), jadi layar jadwal tidak menyediakan edit/impor dan menyatakannya di UI.

D-019 **Seed di-anchor ke minggu berjalan** agar journey selalu bisa didemokan tanpa data kedaluwarsa.

D-020 **Komposisi `App` dipisah dari `main.tsx`** (`src/app/App.tsx`) supaya test merender pohon
yang identik dengan produksi, termasuk `ToastViewport`. Sebelumnya toast hanya ada di `main.tsx`
sehingga feedback aksi tidak teruji.

D-021 **Vitest dinaikkan ke v3.** Vitest 2 membundel Vite 5 sementara proyek memakai Vite 6,
menyebabkan konflik tipe `PluginOption` pada `vite.config.ts`.

D-022 **Nama publik mahasiswa selalu lewat `publicName()`.** Fallback untuk pseudonym kosong adalah
"Mahasiswa anonim", bukan nama asli. Ini menutup kebocoran di shell dan halaman login.

D-023 **Pembatalan booking (CANCELLED) dapat dilakukan pemilik.** Status `CANCELLED` sudah ada di
model data tapi sebelumnya tidak terjangkau dari UI. `validateDecision` sekarang memeriksa
kepemilikan (`actorUserId === booking.requesterUserId`), sesuai komentar aturan yang sudah ada.

D-024 **Permohonan booking baru memberi notifikasi ke setiap user CDC** (FR9), bukan hanya
konfirmasi ke mahasiswa. Sebelumnya notification center CDC tidak pernah menerima permintaan baru
dari alur aplikasi (hanya dari seed).

## Bug yang ditemukan dan diperbaiki saat QA
1. **Kebocoran identitas**: `AppShell` memakai `publicPseudonym ?? fullName` untuk mahasiswa, dan
   halaman login menampilkan `current.fullName` pada baris "Sesi terakhir". Mahasiswa tanpa
   pseudonym akan terlihat dengan nama asli. Keduanya kini memakai `publicName()`.
2. **Pembatalan tanpa cek kepemilikan**: `validateDecision` menerima `CANCEL` dari siapa pun.
   Ditambahkan pemeriksaan pemilik dan test regresi.
3. **CDC tidak menerima notifikasi permohonan baru** dari alur aplikasi. Diperbaiki di reducer
   `CREATE_BOOKING` dan diuji.
4. **Denah tanpa state gagal-muat**: `<img>` rusak tampil tanpa penjelasan. Diganti komponen
   `FloorPlanImage` dengan state loading/error/empty.
5. **Warning lint**: `today` dibuat ulang setiap render (mematikan memoization), unused var pada
   `createInitialState`, dan dependency `rooms` yang tidak perlu.

## Open questions (belum dijawab, jangan ditebak)
Gedung dan relasi lantai; Room ID resmi; koordinat polygon; foto aktual per room; kapasitas/fasilitas;
aturan booking (jam operasional, batas harian, siapa boleh memesan); kewenangan CDC vs akademik;
format jadwal resmi; SSO (issuer/client/redirect/metadata/scopes); retensi data dan audit log.