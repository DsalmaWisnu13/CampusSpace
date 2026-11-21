# Test Plan
Domain: interval overlap; boundary [start,end) tidak overlap; end<=start ditolak; approval conflict academic/approved booking diblokir; reject tanpa reason ditolak; student tidak approve; lecturer tidak post/reply; lecturer DTO tidak punya identity; CDC identity hanya booking.
Components: hashtag search; discussion context; lecturer no composer; List/Map; photo/empty state; CDC queue/timetable status; lecturer today's schedule; notification read/unread.
Journeys: (A) Student pseudonym→search→reply→notification. (B) Student request→CDC approve→notification→timetable. (C) CDC reject reason→student sees reason. (D) Lecturer schedule→location→aggregate insights→no identity/reply→acknowledge.
Responsive: student 360px; CDC 1280px/tablet; lecturer desktop/tablet. Jalankan hanya scripts yang tersedia di package.json dan catat hasil.
