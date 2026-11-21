# Architecture
Audit repository dahulu dan pertahankan stack existing. Jika repo kosong, rekomendasi React + TypeScript + Vite, Tailwind, React Router, Lucide, Vitest/RTL jika cocok. Jangan menambah dependency besar tanpa alasan.

UI → feature service/use case → repository interface → mock adapter. Seeded data berlabel DEMO. Komponen tidak boleh akses localStorage langsung; gunakan adapter.

Struktur usulan:
src/app, src/components, src/features/{auth,discussions,courses,materials,rooms,bookings,cdc,lecturer,notifications}, src/domain, src/data, src/hooks, src/lib, src/styles, src/tests.

AuthAdapter: MockAuthAdapter untuk demo; SSO sungguhan menunggu issuer/client/redirect/metadata/scopes/dokumentasi.
AcademicScheduleRepository: seeded demo; import/API menunggu format resmi.
Booking interval [start,end); overlap jika A.start < B.end && B.start < A.end.
MVP lokal bukan production-ready. Produksi butuh backend, DB, SSO, server-side authorization, audit log, secure storage, rate limit, privacy review, backup, monitoring.
