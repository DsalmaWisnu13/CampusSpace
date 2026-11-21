# Design Brief
## Arah
Architectural clarity untuk denah, operational precision untuk CDC, academic community warmth untuk mahasiswa, calm teaching intelligence untuk dosen.

## Tokens awal
Primary #3049D8; text #171B3A; lavender #E8E9FF; background #F5F6FA; surface #FFFFFF; status available hijau pucat, pending amber pucat, rejected/conflict merah pucat; border cool gray. Typography Inter/Plus Jakarta Sans. Radius 10–16px, border tipis, shadow ringan. Status selalu punya label teks.

## Layout role
Student mobile-first: Beranda/Diskusi, Materi, Ruangan, Notifikasi, Profil. Feed menonjolkan hashtag/konteks meeting.
CDC desktop-first: Overview, Approval, Kalender Ruangan, Data Jadwal, Notifikasi. Antrean dan timetable jadi pusat kerja.
Lecturer desktop/tablet: Dashboard, Jadwal Mengajar, Materi & Diskusi, Insight, Notifikasi. Kelas berikutnya/lokasi di-highlight; insight agregat; tanpa reply.

## Denah
Pakai gambar asli; overlay SVG/coordinate layer terpisah setelah Room ID dan koordinat diverifikasi. List View tetap tersedia. Highlight dosen hanya jika mapping valid.

## Komponen
App shell per role, role selector demo, notification center, hashtag chip/search, discussion card/thread, course/meeting header, resource row, List/Map switch, floor plan canvas, room detail, booking form, status badge, approval queue, weekly timetable, today's class card, topic insight, empty/loading/error.

## Hindari
Dashboard generik, gradient berlebihan, glassmorphism, KPI dekoratif, stock photo sebagai foto kampus, geometri denah rekaan, animasi yang tidak membantu.
