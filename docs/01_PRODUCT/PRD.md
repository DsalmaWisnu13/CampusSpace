# PRD — CampusSpace v1.0

## Role
| Fitur | Mahasiswa | CDC | Dosen |
|---|---|---|---|
| Pseudonym | Ubah | - | - |
| Identitas asli pemohon | Tidak | Ya, untuk approval | Tidak |
| Buat/balas diskusi | Ya | Tidak | Tidak |
| Baca diskusi | Ya | Opsional | Read-only |
| Agregat anonim | - | Ringkasan operasional | Ya |
| Ajukan booking | Ya | - | - |
| Approve/reject | - | Ya | - |
| Jadwal mengajar | - | - | Ya |

## Functional requirements
FR1 Auth: demo role login; student dapat mengatur pseudonym; tandai mock auth jika SSO belum ada.
FR2 Diskusi: feed, hashtag/course/meeting/topic/lecturer context, search, post/reply untuk student, read-only untuk dosen.
FR3 Materi: Course → Meeting → materi kuliah, arsip diskusi, sumber belajar dosen. Tampilkan hanya resource tersedia.
FR4 Ruangan: satu modul List/Map; detail menampilkan foto aktual, lokasi, fasilitas, kapasitas, jadwal jika data ada. Jangan isi data kosong dengan tebakan.
FR5 Booking: student memilih ruang/tanggal/waktu/tujuan; validasi; status PENDING; student melihat status/alasan.
FR6 CDC: antrean, identitas pemohon, approve/reject; reject wajib alasan; validasi konflik; catat actor/timestamp; notifikasi.
FR7 Timetable: mingguan per ruang/jam; bedakan jadwal akademik, approved, pending, conflict.
FR8 Dosen: jadwal hari ini, lokasi, highlight hanya jika mapping valid; insight agregat anonim; acknowledgement; tidak bisa post/reply.
FR9 Notifikasi: terpisah per role; student booking/reply, CDC request/perubahan, dosen insight/perubahan jadwal; read/unread.
FR10 Responsive dan loading/empty/error/success states.

## Prioritas
P0: role demo, student feed/search/reply, materi/arsip, room list/detail, booking, CDC approval/timetable, lecturer schedule/insights, notifications, privacy.
P1: acknowledgement, filter lanjutan, mark-all-read, import CSV jika format resmi ada.
P2: SSO nyata, API akademik, backend produksi, push/email, indoor navigation.

## Batas klaim
Mock auth bukan SSO. Seeded schedule bukan jadwal resmi. Jangan klaim denah/foto akurat jika belum dipetakan.
