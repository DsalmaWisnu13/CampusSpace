import { addDays, atTime, localIso, pad, startOfWeek } from "../lib/datetime";
import type {
  AcademicSchedule,
  AppNotification,
  Course,
  CourseMeeting,
  DiscussionPost,
  DiscussionReply,
  Floor,
  LearningResource,
  Room,
  RoomBooking,
  TopicAcknowledgement,
  User,
} from "../domain/types";

/**
 * Seluruh isi modul ini adalah DATA DEMO.
 * Nama ruang, jadwal, kapasitas, dan foto tidak berasal dari sistem kampus.
 */

export interface DemoDataset {
  referenceDate: string;
  users: User[];
  courses: Course[];
  meetings: CourseMeeting[];
  posts: DiscussionPost[];
  replies: DiscussionReply[];
  resources: LearningResource[];
  buildings: { id: string; name: string }[];
  floors: Floor[];
  rooms: Room[];
  academicSchedules: AcademicSchedule[];
  bookings: RoomBooking[];
  notifications: AppNotification[];
  acknowledgements: TopicAcknowledgement[];
}

export const DEMO_STUDENT_ID = "u-student-1";
export const DEMO_CDC_ID = "u-cdc-1";
export const DEMO_LECTURER_ID = "u-lecturer-1";

/* Asset denah asli milik pengguna (public/floor-plans). */
const FLOOR_L_ASSET = "/floor-plans/WhatsApp%20Image%202026-11-21%20at%2011.28.52.jpeg";
const FLOOR_4_ASSET = "/floor-plans/WhatsApp%20Image%202026-11-21%20at%2011.28.52%20(1).jpeg";

const UNVERIFIED_NOTE =
  "Label ruang mengikuti posisi pada denah DEMO. Room ID dan koordinat resmi belum tersedia.";

export function buildDemoDataset(reference: Date = new Date()): DemoDataset {
  const weekStart = startOfWeek(reference);
  const day = (offset: number, hours: number, minutes = 0) =>
    localIso(atTime(addDays(weekStart, offset), hours, minutes));
  const date = (offset: number) => {
    const d = addDays(weekStart, offset);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const dayIndex = reference.getDay() === 0 ? 6 : reference.getDay() - 1;

  const users: User[] = [
    {
      id: DEMO_STUDENT_ID,
      role: "STUDENT",
      fullName: "Dimas Prakoso",
      campusSubjectId: "2210512034",
      email: "dimas.prakoso@student.demo.ac.id",
      publicPseudonym: "LontarHujan",
    },
    {
      id: "u-student-2",
      role: "STUDENT",
      fullName: "Ayu Larasati",
      campusSubjectId: "2210512078",
      email: "ayu.larasati@student.demo.ac.id",
      publicPseudonym: "KopiSenja",
    },
    {
      id: "u-student-3",
      role: "STUDENT",
      fullName: "Bagas Nugraha",
      campusSubjectId: "2310512011",
      email: "bagas.nugraha@student.demo.ac.id",
      publicPseudonym: "SketsaPagi",
    },
    {
      id: DEMO_CDC_ID,
      role: "CDC",
      fullName: "Rani Kusuma",
      email: "rani.kusuma@cdc.demo.ac.id",
      title: "Staf CDC — Layanan Ruang",
    },
    {
      id: "u-cdc-2",
      role: "CDC",
      fullName: "Hendra Wijaya",
      email: "hendra.wijaya@cdc.demo.ac.id",
      title: "Koordinator CDC — Jadwal Akademik",
    },
    {
      id: DEMO_LECTURER_ID,
      role: "LECTURER",
      fullName: "Dr. Sari Wulandari",
      email: "sari.wulandari@dosen.demo.ac.id",
      title: "Dosen — Program Studi Sistem Informasi",
    },
    {
      id: "u-lecturer-2",
      role: "LECTURER",
      fullName: "Adi Pramana, M.Kom.",
      email: "adi.pramana@dosen.demo.ac.id",
      title: "Dosen — Interaksi Manusia dan Komputer",
    },
  ];

  const courses: Course[] = [
    {
      id: "c-basisdata",
      code: "SI2103",
      name: "Sistem Basis Data",
      hashtag: "#basisdata",
      lecturerId: DEMO_LECTURER_ID,
    },
    {
      id: "c-imk",
      code: "SI2110",
      name: "Interaksi Manusia dan Komputer",
      hashtag: "#imk",
      lecturerId: "u-lecturer-2",
    },
    {
      id: "c-struktur",
      code: "SI2107",
      name: "Struktur Data",
      hashtag: "#strukturdata",
      lecturerId: DEMO_LECTURER_ID,
    },
  ];

  const meetings: CourseMeeting[] = [
    {
      id: "m-bd-07",
      courseId: "c-basisdata",
      meetingNumber: 7,
      topic: "Normalisasi lanjutan dan denormalisasi terkontrol",
      date: date(Math.max(0, dayIndex)),
      lecturerId: DEMO_LECTURER_ID,
    },
    {
      id: "m-bd-08",
      courseId: "c-basisdata",
      meetingNumber: 8,
      topic: "Indeks, query plan, dan tuning",
      date: date(Math.min(6, dayIndex + 2)),
      lecturerId: DEMO_LECTURER_ID,
    },
    {
      id: "m-bd-06",
      courseId: "c-basisdata",
      meetingNumber: 6,
      topic: "Functional dependency dan 3NF",
      date: date(Math.max(0, dayIndex - 7)),
      lecturerId: DEMO_LECTURER_ID,
    },
    {
      id: "m-imk-05",
      courseId: "c-imk",
      meetingNumber: 5,
      topic: "Usability testing dengan pengguna nyata",
      date: date(Math.min(6, dayIndex + 1)),
      lecturerId: "u-lecturer-2",
    },
    {
      id: "m-imk-04",
      courseId: "c-imk",
      meetingNumber: 4,
      topic: "Wireframe dan information architecture",
      date: date(Math.max(0, dayIndex - 6)),
      lecturerId: "u-lecturer-2",
    },
    {
      id: "m-sd-09",
      courseId: "c-struktur",
      meetingNumber: 9,
      topic: "Graph traversal: BFS dan DFS",
      date: date(Math.min(6, dayIndex + 3)),
      lecturerId: DEMO_LECTURER_ID,
    },
  ];

  const posts: DiscussionPost[] = [
    {
      id: "p-1",
      authorUserId: "u-student-2",
      courseId: "c-basisdata",
      meetingId: "m-bd-07",
      title: "Batas denormalisasi yang masih aman?",
      body:
        "Di slide pertemuan 7 disebut denormalisasi boleh untuk kebutuhan pelaporan. Bagaimana cara menentukan kapan denormalisasi berhenti jadi 'utang'? Apakah ada heuristik yang dipakai tim nyata?",
      tags: ["normalisasi", "studi-kasus"],
      createdAt: `${date(Math.max(0, dayIndex - 1))}T19:40`,
    },
    {
      id: "p-2",
      authorUserId: DEMO_STUDENT_ID,
      courseId: "c-basisdata",
      meetingId: "m-bd-08",
      title: "Latihan membaca query plan",
      body:
        "Saya coba EXPLAIN pada query JOIN 3 tabel dan muncul sequential scan. Apakah wajar untuk tabel kecil, atau harus langsung menambah indeks?",
      tags: ["indeks", "query-plan"],
      createdAt: `${date(Math.max(0, dayIndex))}T08:15`,
    },
    {
      id: "p-3",
      authorUserId: "u-student-3",
      courseId: "c-imk",
      meetingId: "m-imk-05",
      title: "Rekrutmen peserta usability testing",
      body:
        "Untuk tugas besar, kami butuh 5 peserta. Apakah boleh lintas program studi? Dan berapa lama satu sesi idealnya agar tidak melelahkan peserta?",
      tags: ["usability", "metode"],
      createdAt: `${date(Math.max(0, dayIndex - 2))}T13:05`,
    },
    {
      id: "p-4",
      authorUserId: "u-student-2",
      courseId: "c-struktur",
      meetingId: "m-sd-09",
      title: "Kapan memilih BFS dibanding DFS?",
      body:
        "Saya masih bingung Studi kasus peta jalur terpendek vs deteksi siklus. Ada ringkasan kapan masing-masing lebih tepat?",
      tags: ["graph", "bfs", "dfs"],
      createdAt: `${date(Math.max(0, dayIndex - 3))}T10:30`,
    },
    {
      id: "p-5",
      authorUserId: DEMO_STUDENT_ID,
      courseId: "c-imk",
      meetingId: "m-imk-04",
      title: "Contoh information architecture untuk aplikasi kampus",
      body:
        "Saya ingin membandingkan IA aplikasi kampus dengan aplikasi lain. Apakah ada pola navigasi yang menurut teman-teman paling membingungkan?",
      tags: ["ia", "navigasi"],
      createdAt: `${date(Math.max(0, dayIndex - 4))}T16:20`,
    },
  ];

  const replies: DiscussionReply[] = [
    {
      id: "r-1",
      postId: "p-1",
      authorUserId: DEMO_STUDENT_ID,
      body:
        "Dari yang saya pahami, denormalisasi aman kalau ada proses sinkronisasi yang jelas dan metrik pembacaan memang dominan.",
      createdAt: `${date(Math.max(0, dayIndex - 1))}T20:05`,
    },
    {
      id: "r-2",
      postId: "p-2",
      authorUserId: "u-student-3",
      body:
        "Untuk tabel kecil sequential scan sering lebih murah. Coba bandingkan setelah data bertambah, jangan langsung tambah indeks.",
      createdAt: `${date(Math.max(0, dayIndex))}T09:02`,
    },
    {
      id: "r-3",
      postId: "p-3",
      authorUserId: "u-student-3",
      body:
        "Kami kemarin pakai 30 menit per sesi plus 10 menit debrief. Lintas prodi justru bagus untuk variasi latar.",
      createdAt: `${date(Math.max(0, dayIndex - 2))}T14:10`,
    },
    {
      id: "r-4",
      postId: "p-4",
      authorUserId: "u-student-2",
      body:
        "BFS kalau butuh jarak minimum pada graph tanpa bobot; DFS lebih hemat memori untuk eksplorasi mendalam.",
      createdAt: `${date(Math.max(0, dayIndex - 3))}T11:15`,
    },
  ];

  const resources: LearningResource[] = [
    {
      id: "res-1",
      courseId: "c-basisdata",
      meetingId: "m-bd-07",
      title: "Slide Pertemuan 7 — Normalisasi Lanjutan",
      description: "Ringkasan dependensi fungsional dan contoh denormalisasi terkontrol.",
      type: "SLIDE",
      uploadedByLecturerId: DEMO_LECTURER_ID,
    },
    {
      id: "res-2",
      courseId: "c-basisdata",
      meetingId: "m-bd-07",
      title: "Studi Kasus — Skema Penjualan",
      description: "Lembar kerja latihan normalisasi (DEMO).",
      type: "PDF",
      uploadedByLecturerId: DEMO_LECTURER_ID,
    },
    {
      id: "res-3",
      courseId: "c-basisdata",
      meetingId: "m-bd-08",
      title: "Catatan Query Plan",
      description: "Cara membaca EXPLAIN dan contoh rencana eksekusi.",
      type: "PDF",
      uploadedByLecturerId: DEMO_LECTURER_ID,
    },
    {
      id: "res-4",
      courseId: "c-basisdata",
      meetingId: "m-bd-06",
      title: "Rekaman Diskusi Pertemuan 6",
      description: "Arsip ringkas pertanyaan yang dibahas di kelas.",
      type: "LINK",
      uploadedByLecturerId: DEMO_LECTURER_ID,
    },
    {
      id: "res-5",
      courseId: "c-imk",
      meetingId: "m-imk-05",
      title: "Panduan Usability Testing",
      description: "Template skenario dan lembar observasi.",
      type: "SLIDE",
      uploadedByLecturerId: "u-lecturer-2",
    },
    {
      id: "res-6",
      courseId: "c-imk",
      meetingId: "m-imk-04",
      title: "Sumber Belajar — IA Patterns",
      description: "Kumpulan referensi pola navigasi dari dosen.",
      type: "LINK",
      uploadedByLecturerId: "u-lecturer-2",
    },
    {
      id: "res-7",
      courseId: "c-struktur",
      meetingId: "m-sd-09",
      title: "Slide Graph Traversal",
      description: "BFS, DFS, kompleksitas, dan contoh penerapan.",
      type: "SLIDE",
      uploadedByLecturerId: DEMO_LECTURER_ID,
    },
  ];

  const buildings = [{ id: "b-main", name: "Gedung Utama Kampus" }];

  const floors: Floor[] = [
    {
      id: "floor-4",
      buildingId: "b-main",
      label: "Lantai 4",
      floorPlanAsset: FLOOR_4_ASSET,
      mappingStatus: "UNVERIFIED",
    },
    {
      id: "floor-l",
      buildingId: "b-main",
      label: "Lantai L",
      floorPlanAsset: FLOOR_L_ASSET,
      mappingStatus: "UNVERIFIED",
    },
  ];

  const rooms: Room[] = [
    // Lantai 4 — ruang kelas. Nama belum terverifikasi; label posisi DEMO.
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `r-4-${pad(i + 1)}`,
      name: `Ruang Kelas 4-${pad(i + 1)}`,
      floorId: "floor-4",
      kind: "CLASSROOM" as const,
      dataNote: UNVERIFIED_NOTE,
    })),
    // Lantai L — nama mengikuti legenda denah.
    {
      id: "r-l-sga",
      name: "SGA",
      floorId: "floor-l",
      kind: "ADMIN",
      dataNote: `${UNVERIFIED_NOTE} Kapasitas belum tersedia.`,
    },
    {
      id: "r-l-labrobot",
      name: "Lab Robot",
      floorId: "floor-l",
      kind: "LAB",
      dataNote: `${UNVERIFIED_NOTE} Fasilitas belum tersedia.`,
    },
    {
      id: "r-l-labroom",
      name: "Lab Room",
      floorId: "floor-l",
      kind: "LAB",
      dataNote: `${UNVERIFIED_NOTE} Fasilitas belum tersedia.`,
    },
    {
      id: "r-l-labchem",
      name: "Lab Chemistry",
      floorId: "floor-l",
      kind: "LAB",
      dataNote: `${UNVERIFIED_NOTE} Fasilitas belum tersedia.`,
    },
    {
      id: "r-l-perpus",
      name: "Perpustakaan",
      floorId: "floor-l",
      kind: "LIBRARY",
      dataNote: `${UNVERIFIED_NOTE} Kapasitas belum tersedia.`,
    },
  ];

  const academicSchedules: AcademicSchedule[] = [
    {
      id: "s-1",
      courseId: "c-basisdata",
      meetingId: "m-bd-07",
      lecturerId: DEMO_LECTURER_ID,
      roomId: "r-4-03",
      startsAt: day(dayIndex, 9, 0),
      endsAt: day(dayIndex, 11, 0),
      source: "DEMO",
    },
    {
      id: "s-2",
      courseId: "c-struktur",
      meetingId: "m-sd-09",
      lecturerId: DEMO_LECTURER_ID,
      roomId: "r-4-05",
      startsAt: day(Math.min(6, dayIndex + 2), 13, 0),
      endsAt: day(Math.min(6, dayIndex + 2), 15, 30),
      source: "DEMO",
    },
    {
      id: "s-3",
      courseId: "c-imk",
      meetingId: "m-imk-05",
      lecturerId: "u-lecturer-2",
      roomId: "r-4-01",
      startsAt: day(Math.min(6, dayIndex + 1), 10, 0),
      endsAt: day(Math.min(6, dayIndex + 1), 12, 0),
      source: "DEMO",
    },
    {
      id: "s-4",
      courseId: "c-basisdata",
      meetingId: "m-bd-08",
      lecturerId: DEMO_LECTURER_ID,
      roomId: "r-4-03",
      startsAt: day(Math.min(6, dayIndex + 2), 9, 0),
      endsAt: day(Math.min(6, dayIndex + 2), 11, 0),
      source: "DEMO",
    },
    // Jadwal petugas di lantai L
    {
      id: "s-5",
      courseId: "c-imk",
      meetingId: "m-imk-04",
      lecturerId: "u-lecturer-2",
      roomId: "r-l-labroom",
      startsAt: day(Math.min(6, dayIndex + 1), 15, 0),
      endsAt: day(Math.min(6, dayIndex + 1), 17, 0),
      source: "DEMO",
    },
  ];

  const bookings: RoomBooking[] = [
    {
      id: "bk-1",
      roomId: "r-4-02",
      requesterUserId: DEMO_STUDENT_ID,
      purpose: "Diskusi kelompok tugas besar basis data (5 orang).",
      participantCount: 5,
      startsAt: day(Math.max(0, dayIndex), 16, 0),
      endsAt: day(Math.max(0, dayIndex), 18, 0),
      status: "PENDING",
      createdAt: `${date(Math.max(0, dayIndex - 1))}T14:22`,
    },
    {
      id: "bk-2",
      roomId: "r-4-07",
      requesterUserId: "u-student-2",
      purpose: "Latihan presentasi usability testing untuk kelas IMK.",
      participantCount: 6,
      startsAt: day(Math.min(6, dayIndex + 1), 13, 0),
      endsAt: day(Math.min(6, dayIndex + 1), 15, 0),
      status: "PENDING",
      createdAt: `${date(Math.max(0, dayIndex - 1))}T09:10`,
    },
    {
      id: "bk-3",
      roomId: "r-l-labroom",
      requesterUserId: "u-student-3",
      purpose: "Sesi rekaman wawancara pengguna untuk tugas IMK.",
      participantCount: 4,
      startsAt: day(Math.min(6, dayIndex + 1), 15, 0),
      endsAt: day(Math.min(6, dayIndex + 1), 17, 0),
      status: "PENDING",
      createdAt: `${date(Math.max(0, dayIndex - 2))}T11:45`,
    },
    {
      id: "bk-4",
      roomId: "r-4-09",
      requesterUserId: "u-student-2",
      purpose: "Belajar bersama persiapan kuis struktur data.",
      participantCount: 8,
      startsAt: day(Math.min(6, dayIndex + 3), 16, 0),
      endsAt: day(Math.min(6, dayIndex + 3), 18, 0),
      status: "APPROVED",
      decidedByUserId: DEMO_CDC_ID,
      decidedAt: `${date(Math.max(0, dayIndex - 2))}T10:00`,
      createdAt: `${date(Math.max(0, dayIndex - 3))}T15:30`,
    },
    {
      id: "bk-5",
      roomId: "r-4-03",
      requesterUserId: DEMO_STUDENT_ID,
      purpose: "Rapat kepanitiaan acara jurusan.",
      participantCount: 12,
      startsAt: day(Math.max(0, dayIndex), 9, 0),
      endsAt: day(Math.max(0, dayIndex), 11, 0),
      status: "REJECTED",
      rejectionReason:
        "Waktu bertabrakan dengan jadwal akademik Sistem Basis Data di ruang yang sama. Silakan ajukan waktu lain.",
      decidedByUserId: DEMO_CDC_ID,
      decidedAt: `${date(Math.max(0, dayIndex - 1))}T08:30`,
      createdAt: `${date(Math.max(0, dayIndex - 2))}T17:10`,
    },
    {
      id: "bk-6",
      roomId: "r-l-perpus",
      requesterUserId: "u-student-3",
      purpose: "Diskusi kelompok mata kuliah IMK.",
      participantCount: 4,
      startsAt: day(Math.max(0, dayIndex - 4), 13, 0),
      endsAt: day(Math.max(0, dayIndex - 4), 15, 0),
      status: "APPROVED",
      decidedByUserId: "u-cdc-2",
      decidedAt: `${date(Math.max(0, dayIndex - 5))}T09:00`,
      createdAt: `${date(Math.max(0, dayIndex - 6))}T16:00`,
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: "n-1",
      recipientUserId: DEMO_STUDENT_ID,
      type: "BOOKING_REJECTED",
      title: "Permohonan ruang ditolak",
      body: "Ruang Kelas 4-03 pada permohonan rapat kepanitiaan ditolak: bentrok jadwal akademik.",
      targetPath: "/student/booking",
      createdAt: `${date(Math.max(0, dayIndex - 1))}T08:31`,
    },
    {
      id: "n-2",
      recipientUserId: DEMO_STUDENT_ID,
      type: "DISCUSSION_REPLY",
      title: "Balasan baru di diskusi kamu",
      body: "SketsaPagi membalas “Latihan membaca query plan”.",
      targetPath: "/student/discussions/p-2",
      createdAt: `${date(Math.max(0, dayIndex))}T09:02`,
    },
    {
      id: "n-3",
      recipientUserId: DEMO_STUDENT_ID,
      type: "BOOKING_SUBMITTED",
      title: "Permohonan terkirim",
      body: "Permohonan Ruang Kelas 4-02 menunggu keputusan Tim CDC.",
      targetPath: "/student/booking",
      createdAt: `${date(Math.max(0, dayIndex - 1))}T14:22`,
      readAt: `${date(Math.max(0, dayIndex - 1))}T14:25`,
    },
    {
      id: "n-4",
      recipientUserId: DEMO_CDC_ID,
      type: "BOOKING_SUBMITTED",
      title: "Permintaan ruang baru",
      body: "LontarHujan mengajukan Ruang Kelas 4-02 untuk diskusi kelompok.",
      targetPath: "/cdc/approval/bk-1",
      createdAt: `${date(Math.max(0, dayIndex - 1))}T14:22`,
    },
    {
      id: "n-5",
      recipientUserId: DEMO_CDC_ID,
      type: "BOOKING_SUBMITTED",
      title: "Permintaan ruang baru",
      body: "KopiSenja mengajukan Ruang Kelas 4-07 untuk latihan presentasi.",
      targetPath: "/cdc/approval/bk-2",
      createdAt: `${date(Math.max(0, dayIndex - 1))}T09:10`,
    },
    {
      id: "n-6",
      recipientUserId: "u-cdc-2",
      type: "SCHEDULE_UPDATED",
      title: "Jadwal akademik diperbarui",
      body: "Jadwal IMK dipindahkan ke Lab Room, Lantai L (DEMO).",
      targetPath: "/cdc/jadwal",
      createdAt: `${date(Math.max(0, dayIndex - 2))}T07:40`,
    },
    {
      id: "n-7",
      recipientUserId: DEMO_LECTURER_ID,
      type: "SCHEDULE_UPDATED",
      title: "Perubahan ruang kelas",
      body: "Pertemuan Struktur Data minggu ini memakai Ruang Kelas 4-05.",
      targetPath: "/lecturer/jadwal",
      createdAt: `${date(Math.max(0, dayIndex - 2))}T07:42`,
    },
    {
      id: "n-8",
      recipientUserId: DEMO_LECTURER_ID,
      type: "INSIGHT_ACKNOWLEDGED",
      title: "Topik ditandai akan dijelaskan",
      body: "Kamu menandai topik “query plan” pada Sistem Basis Data.",
      targetPath: "/lecturer/insight",
      createdAt: `${date(Math.max(0, dayIndex - 1))}T18:00`,
      readAt: `${date(Math.max(0, dayIndex - 1))}T18:05`,
    },
  ];

  const acknowledgements: TopicAcknowledgement[] = [
    {
      id: "ack-1",
      lecturerId: DEMO_LECTURER_ID,
      courseMeetingId: "m-bd-06",
      topicKey: "normalisasi",
      status: "WILL_EXPLAIN",
      createdAt: `${date(Math.max(0, dayIndex - 7))}T19:00`,
    },
  ];

  return {
    referenceDate: localIso(reference),
    users,
    courses,
    meetings,
    posts,
    replies,
    resources,
    buildings,
    floors,
    rooms,
    academicSchedules,
    bookings,
    notifications,
    acknowledgements,
  };
}

export const demoAccounts: { userId: string; role: User["role"]; label: string; detail: string }[] = [
  {
    userId: DEMO_STUDENT_ID,
    role: "STUDENT",
    label: "Mahasiswa",
    detail: "Pseudonym publik · diskusi · booking",
  },
  {
    userId: DEMO_CDC_ID,
    role: "CDC",
    label: "Tim CDC",
    detail: "Approval · identitas pemohon · kalender",
  },
  {
    userId: DEMO_LECTURER_ID,
    role: "LECTURER",
    label: "Dosen",
    detail: "Jadwal · materi read-only · insight anonim",
  },
];