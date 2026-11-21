# Implementation Plan

Ringkasan status per milestone. Semua item di bawah benar-benar diimplementasikan dan diverifikasi
dengan `lint`, `typecheck`, `test`, dan `build` (hasil di bagian akhir).

## M0 — Audit & setup · DONE
Repo awal hanya berisi dokumen (`src/` dan `tests/` kosong), tanpa `package.json`.
Scaffold dibuat mengikuti `ARCHITECTURE.md`: React 19 + TypeScript + Vite 6, Tailwind v4,
React Router 7, Lucide, Vitest + Testing Library. App shell, role demo login, dan guard peran selesai.

## M1 — Domain & data · DONE
`src/domain/types.ts`, `interval.ts`, `booking.ts`, `permissions.ts`.
Seed DEMO berlabel, adapter penyimpanan (`StorageAdapter`), reducer store, selector per fitur,
conflict validator, notification per user. Domain test lengkap.

## M2 — Student academic · DONE
Feed diskusi dengan filter hashtag/mata kuliah/pertemuan/topik/dosen dan pencarian;
detail + balasan; buat diskusi; Course → Meeting → materi kuliah, arsip diskusi, sumber belajar.
Empty state untuk pertemuan/materi/diskusi kosong.

## M3 — Rooms & booking · DONE
List View dan Map View (denah asli), detail ruang dengan empty state foto, form booking
dengan validasi (tujuan, interval, durasi ≤ 6 jam, masa lalu), cek benturan sebelum submit,
halaman "Booking saya" dengan status + alasan penolakan + pembatalan oleh pemilik.

## M4 — CDC · DONE
Antrean permohonan, pencarian, detail approval dengan identitas pemohon (hanya di sini),
blokir approval saat benturan akademik/booking APPROVED, reject wajib alasan,
kalender ruangan mingguan, dan halaman jadwal akademik read-only.

## M5 — Lecturer · DONE
Jadwal hari ini, peta lokasi kelas tanpa highlight (mapping belum terverifikasi),
arsip diskusi read-only, insight agregat anonim, acknowledgement `WILL_EXPLAIN`,
notification center. Tidak ada composer/reply untuk dosen.

## M6 — QA · DONE
Journey A–D, role/privacy, konflik, notifikasi, responsif, dan state empty/error/success diuji.
Lihat `DECISION_LOG.md` D-013…D-024 untuk keputusan teknis dan perbaikan bug.

---

## Hasil verifikasi (21 November 2026)

| Perintah | Hasil |
|---|---|
| `npm run typecheck` (`tsc -b`) | Lulus, 0 error |
| `npm run lint` (`eslint .`) | Lulus, 0 error dan 0 warning |
| `npm run test` (`vitest run`) | 4 file, **69 test lulus** |
| `npm run build` | Lulus (1615 modul, JS ±434 kB / gzip ±124 kB) |
| `npm run dev` | Server jalan, aset denah terlayani (HTTP 200) |

Cakupan test:
- `tests/domain.test.ts` — overlap `[start,end)`, batas tidak overlap, `end<=start` ditolak,
  benturan akademik/APPROVED diblokir, PENDING tidak memblokir, reject tanpa alasan ditolak,
  student/lecturer tidak bisa approve, validasi draft booking.
- `tests/privacy.test.ts` — matriks izin per peran, `publicName` tidak pernah nama asli,
  isolasi notifikasi per user, DTO insight dosen tanpa identifier, round-trip persistence.
- `tests/journeys.test.tsx` — journey A (pseudonym → cari → balas), B (ajukan → CDC approve),
  C (CDC reject dengan alasan), D (dosen jadwal → insight → acknowledgement), batas akses peran.
- `tests/regressions.test.tsx` — regresi kebocoran nama asli, notifikasi booking ke CDC,
  pembatalan booking oleh pemilik, dan state gagal-muat denah.

## Known limitations
- Tanpa SSO dan API akademik; jadwal berasal dari seed DEMO dan read-only bagi CDC.
- Tanpa Room ID/koordinat resmi → denah tanpa hotspot/highlight.
- Tanpa foto aktual ruangan dan tanpa data kapasitas/fasilitas.
- Otorisasi hanya di sisi klien; produksi membutuhkan backend dan server-side authorization.
- State aplikasi adalah data lokal (in-memory + `localStorage`), bukan database.