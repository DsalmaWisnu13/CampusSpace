/**
 * Domain types — baseline from docs/03_TECHNICAL/DATA_MODEL.md.
 * Semua data seeded di aplikasi ini adalah DEMO, bukan data akademik resmi.
 */

export type Role = "STUDENT" | "CDC" | "LECTURER";

export type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface User {
  id: string;
  role: Role;
  /** Nama lengkap. HANYA boleh dipakai di workflow booking CDC + profil sendiri. */
  fullName: string;
  /** NIM. Jangan pernah ditampilkan di area publik. */
  campusSubjectId?: string;
  email?: string;
  /** Pseudonym publik mahasiswa (FR1). */
  publicPseudonym?: string;
  /** Judul peran untuk tampilan, mis. "Dosen — Sistem Informasi". */
  title?: string;
}

export interface Course {
  id: string;
  code?: string;
  name: string;
  hashtag: string;
  lecturerId?: string;
}

export interface CourseMeeting {
  id: string;
  courseId: string;
  meetingNumber: number;
  topic: string;
  /** ISO date (YYYY-MM-DD) */
  date?: string;
  lecturerId?: string;
}

export interface DiscussionPost {
  id: string;
  authorUserId: string;
  courseId: string;
  meetingId: string;
  title?: string;
  body: string;
  /** Hashtag bebas di luar hashtag mata kuliah. */
  tags?: string[];
  createdAt: string;
}

export interface DiscussionReply {
  id: string;
  postId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export type ResourceType = "PDF" | "SLIDE" | "VIDEO" | "LINK" | "OTHER";

export interface LearningResource {
  id: string;
  courseId: string;
  meetingId?: string;
  title: string;
  description?: string;
  type: ResourceType;
  url?: string;
  uploadedByLecturerId?: string;
}

export interface Building {
  id: string;
  name: string;
}

export interface Floor {
  id: string;
  buildingId: string;
  label: string;
  floorPlanAsset?: string;
  /** Catatan kejujuran data: mapping ruang belum diverifikasi. */
  mappingStatus: "UNVERIFIED" | "VERIFIED";
}

export interface Room {
  id: string;
  name: string;
  floorId: string;
  /** Kosongkan bila data belum tersedia — jangan menebak. */
  capacity?: number;
  facilities?: string[];
  photoAsset?: string;
  /** Hanya diisi setelah Room ID + koordinat diverifikasi. */
  mapRegion?: { x: number; y: number; width: number; height: number };
  kind?: "CLASSROOM" | "LAB" | "LIBRARY" | "ADMIN" | "OTHER";
  dataNote?: string;
}

export interface AcademicSchedule {
  id: string;
  courseId: string;
  meetingId?: string;
  lecturerId: string;
  roomId: string;
  startsAt: string;
  endsAt: string;
  source: "DEMO" | "OFFICIAL_IMPORT" | "OFFICIAL_API";
  createdByUserId?: string;
}

export interface RoomBooking {
  id: string;
  roomId: string;
  requesterUserId: string;
  purpose: string;
  participantCount?: number;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  rejectionReason?: string;
  decidedByUserId?: string;
  decidedAt?: string;
  createdAt: string;
}

export type NotificationType =
  | "BOOKING_SUBMITTED"
  | "BOOKING_APPROVED"
  | "BOOKING_REJECTED"
  | "BOOKING_CANCELLED"
  | "DISCUSSION_REPLY"
  | "SCHEDULE_UPDATED"
  | "INSIGHT_ACKNOWLEDGED";

export interface AppNotification {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  body: string;
  targetPath?: string;
  createdAt: string;
  readAt?: string;
}

export interface TopicAcknowledgement {
  id: string;
  lecturerId: string;
  courseMeetingId: string;
  topicKey: string;
  status: "WILL_EXPLAIN";
  createdAt: string;
}

/** ---- View models / DTOs (privacy boundaries) ---- */

/** Identitas publik: TIDAK BOLEH membawa fullName/NIM/email. */
export interface PublicAuthor {
  userId: string;
  pseudonym: string;
}

export interface DiscussionView extends DiscussionPost {
  author: PublicAuthor;
  course: { id: string; name: string; hashtag: string };
  meeting: { id: string; meetingNumber: number; topic: string };
  lecturerName?: string;
  replyCount: number;
  lastActivityAt: string;
}

export interface DiscussionReplyView extends DiscussionReply {
  author: PublicAuthor;
}

/** Identitas pemohon untuk CDC — hanya dalam konteks booking. */
export interface RequesterIdentity {
  userId: string;
  fullName: string;
  campusSubjectId?: string;
  email?: string;
  publicPseudonym?: string;
}

export interface BookingView extends RoomBooking {
  roomName: string;
  floorLabel: string;
  studentPseudonym: string;
}

export interface CdcBookingView extends BookingView {
  requester: RequesterIdentity;
  conflicts: ConflictInfo[];
}

export interface ConflictInfo {
  kind: "ACADEMIC" | "APPROVED_BOOKING" | "PENDING_BOOKING";
  label: string;
  startsAt: string;
  endsAt: string;
}

export interface LecturerClassView {
  schedule: AcademicSchedule;
  courseName: string;
  courseCode?: string;
  meetingTopic?: string;
  room: Room;
  floor: Floor;
  /** true hanya jika room.mapRegion ada DAN floor mappingStatus VERIFIED. */
  canHighlightOnMap: boolean;
}

/** Aggregat anonim untuk dosen — TANPA identifier mahasiswa. */
export interface TopicInsight {
  topicKey: string;
  label: string;
  courseId: string;
  courseName: string;
  meetingId: string;
  meetingNumber: number;
  postCount: number;
  replyCount: number;
  lastActivityAt: string;
  acknowledged: boolean;
  acknowledgementId?: string;
}

export interface TimetableEntry {
  id: string;
  roomId: string;
  roomName: string;
  kind: "ACADEMIC" | "BOOKING";
  status: BookingStatus | "SCHEDULED";
  label: string;
  startsAt: string;
  endsAt: string;
  /** Jadwal akademik tidak bisa diubah dari UI CDC. */
  editable: boolean;
  hasConflict: boolean;
}

export interface Result<T> {
  ok: true;
  data: T;
}

export interface Failure {
  ok: false;
  code:
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "VALIDATION_ERROR"
    | "ROOM_CONFLICT"
    | "UNKNOWN";
  message: string;
}

export type Outcome<T> = Result<T> | Failure;