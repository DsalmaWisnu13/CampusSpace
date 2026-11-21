# Problem Analysis
Informasi diskusi, materi, lokasi ruang, jadwal, dan izin berpotensi tersebar. Mahasiswa sulit mencari diskusi sesuai pertemuan; CDC memerlukan approval dan timetable; dosen memerlukan jadwal/lokasi dan insight tanpa identitas mahasiswa.

## Tujuan
1. Diskusi terstruktur per course/meeting/hashtag.
2. Materi, arsip diskusi, dan sumber belajar per pertemuan.
3. Room discovery melalui List/Map.
4. Booking transparan dari request sampai keputusan.
5. CDC memantau pemakaian mingguan.
6. Dosen melihat jadwal dan insight agregat anonim.

## Non-goals MVP
SSO produksi, API akademik, indoor navigation, sensor okupansi, chat privat, analitik individual, pembayaran.

## Risiko
Privasi mahasiswa → DTO agregat; booking bentrok → validator; data demo dianggap nyata → label DEMO; denah salah → aset asli dan mapping terverifikasi; foto tidak sesuai → empty state; SSO/API belum tersedia → adapter mock.
