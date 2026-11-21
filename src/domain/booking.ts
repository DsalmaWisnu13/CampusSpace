import { intervalsOverlap, isValidInterval } from "./interval";
import type {
  AcademicSchedule,
  BookingStatus,
  BookingView,
  ConflictInfo,
  CdcBookingView,
  Room,
  RoomBooking,
  User,
} from "./types";

/* ------------------------------------------------------------------ */
/* Booking lifecycle rules (pure, unit-tested)                         */
/* ------------------------------------------------------------------ */

export type BookingAction = "APPROVE" | "REJECT" | "CANCEL";

/** Transisi status yang legal. */
const TRANSITIONS: Record<BookingStatus, BookingAction[]> = {
  PENDING: ["APPROVE", "REJECT", "CANCEL"],
  APPROVED: ["CANCEL"],
  REJECTED: [],
  CANCELLED: [],
};

export function canTransition(status: BookingStatus, action: BookingAction): boolean {
  return TRANSITIONS[status].includes(action);
}

export interface DecisionInput {
  action: BookingAction;
  reason?: string;
  actorRole: User["role"];
  /** User yang melakukan aksi; wajib untuk CANCEL agar kepemilikan bisa dicek. */
  actorUserId?: string;
}

/**
 * Validasi aturan keputusan. Reject WAJIB alasan non-kosong.
 * Student tidak boleh approve/reject; hanya pemilik yang boleh cancel.
 */
export function validateDecision(
  booking: RoomBooking,
  input: DecisionInput,
): { ok: true } | { ok: false; message: string } {
  if (input.action === "CANCEL") {
    if (!canTransition(booking.status, "CANCEL")) {
      return { ok: false, message: `Booking berstatus ${booking.status} tidak bisa dibatalkan.` };
    }
    // Tanpa cek ini, siapa pun bisa membatalkan booking milik orang lain.
    if (!input.actorUserId || input.actorUserId !== booking.requesterUserId) {
      return { ok: false, message: "Hanya pemilik permohonan yang boleh membatalkan booking." };
    }
    return { ok: true };
  }

  if (input.actorRole !== "CDC") {
    return { ok: false, message: "Hanya Tim CDC yang boleh approve/reject booking." };
  }
  if (!canTransition(booking.status, input.action)) {
    return { ok: false, message: `Booking berstatus ${booking.status} tidak bisa di-${input.action.toLowerCase()}.` };
  }
  if (input.action === "REJECT" && !input.reason?.trim()) {
    return { ok: false, message: "Alasan penolakan wajib diisi." };
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Conflict detection                                                  */
/* ------------------------------------------------------------------ */

export function findConflicts(
  candidate: { roomId: string; startsAt: string; endsAt: string },
  academic: AcademicSchedule[],
  bookings: RoomBooking[],
  options: { ignoreBookingId?: string; labelForAcademic?: (s: AcademicSchedule) => string } = {},
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];

  for (const schedule of academic) {
    if (schedule.roomId !== candidate.roomId) continue;
    if (!intervalsOverlap(schedule, candidate)) continue;
    conflicts.push({
      kind: "ACADEMIC",
      label: options.labelForAcademic?.(schedule) ?? `Jadwal akademik ${schedule.courseId}`,
      startsAt: schedule.startsAt,
      endsAt: schedule.endsAt,
    });
  }

  for (const booking of bookings) {
    if (booking.id === options.ignoreBookingId) continue;
    if (booking.roomId !== candidate.roomId) continue;
    if (booking.status !== "APPROVED" && booking.status !== "PENDING") continue;
    if (!intervalsOverlap(booking, candidate)) continue;
    conflicts.push({
      kind: booking.status === "APPROVED" ? "APPROVED_BOOKING" : "PENDING_BOOKING",
      label: `Booking ${booking.status.toLowerCase()} · ${booking.purpose}`,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
    });
  }

  return conflicts;
}

export function hasBlockingConflict(conflicts: ConflictInfo[]): boolean {
  // Pending lain tidak memblokir approval (CDC memutuskan), tapi akademik + approved memblokir.
  return conflicts.some((c) => c.kind === "ACADEMIC" || c.kind === "APPROVED_BOOKING");
}

/* ------------------------------------------------------------------ */
/* Booking request validation                                          */
/* ------------------------------------------------------------------ */

export interface BookingDraft {
  roomId: string;
  purpose: string;
  participantCount?: number;
  startsAt: string;
  endsAt: string;
}

export type FieldErrors = Partial<Record<keyof BookingDraft, string>>;

export interface BookingValidation {
  valid: boolean;
  fieldErrors: FieldErrors;
  formError?: string;
}

export function validateBookingDraft(
  draft: BookingDraft,
  rooms: Room[],
): BookingValidation {
  const fieldErrors: FieldErrors = {};

  if (!draft.roomId) {
    fieldErrors.roomId = "Pilih ruangan terlebih dahulu.";
  } else if (!rooms.some((r) => r.id === draft.roomId)) {
    fieldErrors.roomId = "Ruangan tidak dikenal.";
  }

  const purpose = draft.purpose.trim();
  if (purpose.length < 8) {
    fieldErrors.purpose = "Tujuan minimal 8 karakter agar CDC dapat menilai permohonan.";
  } else if (purpose.length > 280) {
    fieldErrors.purpose = "Tujuan maksimal 280 karakter.";
  }

  if (!draft.startsAt) {
    fieldErrors.startsAt = "Waktu mulai wajib diisi.";
  }
  if (!draft.endsAt) {
    fieldErrors.endsAt = "Waktu selesai wajib diisi.";
  }

  if (draft.startsAt && draft.endsAt) {
    const interval = { startsAt: draft.startsAt, endsAt: draft.endsAt };
    if (!isValidInterval(interval)) {
      fieldErrors.endsAt = "Waktu selesai harus setelah waktu mulai.";
    } else {
      const durationMs = new Date(draft.endsAt).getTime() - new Date(draft.startsAt).getTime();
      if (durationMs > 6 * 60 * 60 * 1000) {
        fieldErrors.endsAt = "Durasi maksimal 6 jam per permohonan.";
      }
      if (new Date(draft.startsAt).getTime() < Date.now() - 60_000) {
        fieldErrors.startsAt = "Waktu mulai tidak boleh di masa lalu.";
      }
    }
  }

  if (
    draft.participantCount !== undefined &&
    (!Number.isInteger(draft.participantCount) || draft.participantCount < 1)
  ) {
    fieldErrors.participantCount = "Jumlah peserta minimal 1.";
  }

  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

/* ------------------------------------------------------------------ */
/* View mapping                                                        */
/* ------------------------------------------------------------------ */

export function toBookingView(
  booking: RoomBooking,
  room: Room | undefined,
  floorLabel: string,
  pseudonym: string,
): BookingView {
  return {
    ...booking,
    roomName: room?.name ?? "Ruangan tidak dikenal",
    floorLabel,
    studentPseudonym: pseudonym,
  };
}

export function toCdcBookingView(
  view: BookingView,
  identity: CdcBookingView["requester"],
  conflicts: ConflictInfo[],
): CdcBookingView {
  return { ...view, requester: identity, conflicts };
}