import { describe, expect, it } from "vitest";
import { intervalsOverlap, isValidInterval } from "../src/domain/interval";
import { hasBlockingConflict, findConflicts, validateDecision, validateBookingDraft } from "../src/domain/booking";
import type { AcademicSchedule, Room, RoomBooking } from "../src/domain/types";

const base = "2026-11-23T09:00";
const t = (hhmm: string) => `2026-11-23T${hhmm}`;

describe("interval overlap [start, end)", () => {
  it("mendeteksi overlap yang nyata", () => {
    expect(
      intervalsOverlap({ startsAt: t("09:00"), endsAt: t("11:00") }, { startsAt: t("10:00"), endsAt: t("12:00") }),
    ).toBe(true);
  });

  it("batas yang hanya bersentuhan TIDAK dianggap overlap", () => {
    expect(
      intervalsOverlap({ startsAt: t("09:00"), endsAt: t("11:00") }, { startsAt: t("11:00"), endsAt: t("13:00") }),
    ).toBe(false);
  });

  it("interval terpisah penuh tidak overlap", () => {
    expect(
      intervalsOverlap({ startsAt: t("09:00"), endsAt: t("10:00") }, { startsAt: t("13:00"), endsAt: t("14:00") }),
    ).toBe(false);
  });

  it("end <= start ditolak", () => {
    expect(isValidInterval({ startsAt: base, endsAt: base })).toBe(false);
    expect(isValidInterval({ startsAt: t("11:00"), endsAt: t("09:00") })).toBe(false);
    expect(isValidInterval({ startsAt: t("09:00"), endsAt: t("10:00") })).toBe(true);
  });

  it("waktu tidak valid melempar error, bukan diam-diam lolos", () => {
    expect(() => intervalsOverlap({ startsAt: "bukan-tanggal", endsAt: base }, { startsAt: base, endsAt: t("10:00") })).toThrow();
  });
});

const room: Room = { id: "r-4-03", name: "Ruang Kelas 4-03", floorId: "floor-4" };

const academic: AcademicSchedule[] = [
  {
    id: "s-1",
    courseId: "c-basisdata",
    lecturerId: "u-lecturer-1",
    roomId: "r-4-03",
    startsAt: t("09:00"),
    endsAt: t("11:00"),
    source: "DEMO",
  },
  {
    id: "s-2",
    courseId: "c-imk",
    lecturerId: "u-lecturer-2",
    roomId: "r-4-09",
    startsAt: t("09:00"),
    endsAt: t("11:00"),
    source: "DEMO",
  },
];

const booking = (over: Partial<RoomBooking>): RoomBooking => ({
  id: "bk-1",
  roomId: "r-4-03",
  requesterUserId: "u-student-1",
  purpose: "Diskusi kelompok tugas besar",
  startsAt: t("10:00"),
  endsAt: t("12:00"),
  status: "PENDING",
  createdAt: t("07:00"),
  ...over,
});

describe("findConflicts", () => {
  it("menemukan benturan dengan jadwal akademik pada ruang yang sama", () => {
    const conflicts = findConflicts(
      { roomId: "r-4-03", startsAt: t("10:00"), endsAt: t("12:00") },
      academic,
      [],
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].kind).toBe("ACADEMIC");
    expect(hasBlockingConflict(conflicts)).toBe(true);
  });

  it("mengabaikan jadwal akademik di ruang berbeda", () => {
    const conflicts = findConflicts(
      { roomId: "r-4-09", startsAt: t("10:00"), endsAt: t("12:00") },
      academic,
      [],
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].kind).toBe("ACADEMIC");
    // r-4-09 memang punya jadwal sendiri; ruang tanpa jadwal harus bersih:
    const clean = findConflicts(
      { roomId: "r-4-01", startsAt: t("10:00"), endsAt: t("12:00") },
      academic,
      [],
    );
    expect(clean).toHaveLength(0);
  });

  it("menemukan benturan dengan booking APPROVED", () => {
    const conflicts = findConflicts(
      { roomId: "r-4-07", startsAt: t("13:00"), endsAt: t("15:00") },
      [],
      [booking({ id: "bk-approved", roomId: "r-4-07", status: "APPROVED", startsAt: t("14:00"), endsAt: t("16:00") })],
    );
    expect(conflicts.some((c) => c.kind === "APPROVED_BOOKING")).toBe(true);
    expect(hasBlockingConflict(conflicts)).toBe(true);
  });

  it("booking REJECTED/CANCELLED tidak memblokir", () => {
    const conflicts = findConflicts(
      { roomId: "r-4-07", startsAt: t("13:00"), endsAt: t("15:00") },
      [],
      [
        booking({ id: "bk-rej", roomId: "r-4-07", status: "REJECTED", startsAt: t("13:00"), endsAt: t("15:00") }),
        booking({ id: "bk-can", roomId: "r-4-07", status: "CANCELLED", startsAt: t("13:00"), endsAt: t("15:00") }),
      ],
    );
    expect(conflicts).toHaveLength(0);
  });

  it("pending lain tercatat tetapi tidak memblokir approval", () => {
    const conflicts = findConflicts(
      { roomId: "r-4-07", startsAt: t("13:00"), endsAt: t("15:00") },
      [],
      [booking({ id: "bk-pending", roomId: "r-4-07", status: "PENDING", startsAt: t("13:00"), endsAt: t("15:00") })],
    );
    expect(conflicts).toHaveLength(1);
    expect(hasBlockingConflict(conflicts)).toBe(false);
  });

  it("mengabaikan booking yang sedang diputuskan sendiri", () => {
    const self = booking({ id: "bk-self", roomId: "r-4-07", status: "APPROVED" });
    const conflicts = findConflicts(
      { roomId: "r-4-07", startsAt: t("13:00"), endsAt: t("15:00") },
      [],
      [self],
      { ignoreBookingId: "bk-self" },
    );
    expect(conflicts).toHaveLength(0);
  });
});

describe("validateDecision", () => {
  it("menolak reject tanpa alasan", () => {
    const result = validateDecision(booking({ status: "PENDING" }), {
      action: "REJECT",
      reason: "   ",
      actorRole: "CDC",
    });
    expect(result.ok).toBe(false);
  });

  it("menerima reject dengan alasan", () => {
    const result = validateDecision(booking({ status: "PENDING" }), {
      action: "REJECT",
      reason: "Bentrok jadwal akademik.",
      actorRole: "CDC",
    });
    expect(result.ok).toBe(true);
  });

  it("student tidak boleh approve", () => {
    const result = validateDecision(booking({ status: "PENDING" }), {
      action: "APPROVE",
      actorRole: "STUDENT",
    });
    expect(result.ok).toBe(false);
  });

  it("lecturer tidak boleh approve", () => {
    const result = validateDecision(booking({ status: "PENDING" }), {
      action: "APPROVE",
      actorRole: "LECTURER",
    });
    expect(result.ok).toBe(false);
  });

  it("booking yang sudah diputuskan tidak bisa diputuskan ulang", () => {
    expect(
      validateDecision(booking({ status: "APPROVED" }), { action: "APPROVE", actorRole: "CDC" }).ok,
    ).toBe(false);
    expect(
      validateDecision(booking({ status: "REJECTED" }), {
        action: "REJECT",
        reason: "x",
        actorRole: "CDC",
      }).ok,
    ).toBe(false);
  });
});

describe("validateBookingDraft", () => {
  const rooms = [room];
  const valid = {
    roomId: room.id,
    purpose: "Diskusi kelompok tugas besar basis data",
    startsAt: "2099-01-05T09:00",
    endsAt: "2099-01-05T11:00",
  };

  it("menerima draft yang sah", () => {
    expect(validateBookingDraft(valid, rooms).valid).toBe(true);
  });

  it("menolak tujuan terlalu pendek", () => {
    const result = validateBookingDraft({ ...valid, purpose: "rapat" }, rooms);
    expect(result.valid).toBe(false);
    expect(result.fieldErrors.purpose).toBeTruthy();
  });

  it("menolak waktu selesai sebelum mulai", () => {
    const result = validateBookingDraft({ ...valid, endsAt: "2099-01-05T08:00" }, rooms);
    expect(result.valid).toBe(false);
    expect(result.fieldErrors.endsAt).toBeTruthy();
  });

  it("menolak ruangan yang tidak dikenal", () => {
    const result = validateBookingDraft({ ...valid, roomId: "r-tidak-ada" }, rooms);
    expect(result.valid).toBe(false);
  });

  it("menolak waktu mulai di masa lalu", () => {
    const result = validateBookingDraft(
      { ...valid, startsAt: "2020-01-05T09:00", endsAt: "2020-01-05T11:00" },
      rooms,
    );
    expect(result.valid).toBe(false);
  });

  it("menolak durasi lebih dari 6 jam", () => {
    const result = validateBookingDraft({ ...valid, endsAt: "2099-01-05T20:00" }, rooms);
    expect(result.valid).toBe(false);
  });
});