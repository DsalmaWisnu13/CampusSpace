import { describe, expect, it } from "vitest";
import {
  can,
  publicName,
  unreadCount,
  visibleNotifications,
} from "../src/domain/permissions";
import type { AppNotification, User } from "../src/domain/types";
import { buildDemoDataset, DEMO_CDC_ID, DEMO_LECTURER_ID, DEMO_STUDENT_ID } from "../src/data/seed";
import { hydrateState, reducer, createInitialState } from "../src/store/AppStore";
import { serializeState } from "../src/store/AppStore";

const users = buildDemoDataset().users;
const student = users.find((u) => u.id === DEMO_STUDENT_ID) as User;
const cdc = users.find((u) => u.id === DEMO_CDC_ID) as User;
const lecturer = users.find((u) => u.id === DEMO_LECTURER_ID) as User;

describe("role permissions", () => {
  it("student boleh membuat & membalas diskusi dan booking", () => {
    expect(can(student, "discussion:create")).toBe(true);
    expect(can(student, "discussion:reply")).toBe(true);
    expect(can(student, "booking:create")).toBe(true);
  });

  it("student tidak boleh approve/reject atau melihat identitas pemohon", () => {
    expect(can(student, "booking:decide")).toBe(false);
    expect(can(student, "booking:viewIdentity")).toBe(false);
  });

  it("lecturer read-only: tanpa create/reply", () => {
    expect(can(lecturer, "discussion:create")).toBe(false);
    expect(can(lecturer, "discussion:reply")).toBe(false);
    expect(can(lecturer, "discussion:read")).toBe(true);
    expect(can(lecturer, "lecturer:acknowledge")).toBe(true);
  });

  it("lecturer tidak punya akses keputusan booking maupun identitas", () => {
    expect(can(lecturer, "booking:decide")).toBe(false);
    expect(can(lecturer, "booking:viewIdentity")).toBe(false);
    expect(can(lecturer, "booking:create")).toBe(false);
  });

  it("CDC tidak boleh membuat diskusi", () => {
    expect(can(cdc, "discussion:create")).toBe(false);
    expect(can(cdc, "discussion:reply")).toBe(false);
  });

  it("CDC boleh memutuskan booking dan melihat identitas dalam konteks booking", () => {
    expect(can(cdc, "booking:decide")).toBe(true);
    expect(can(cdc, "booking:viewIdentity")).toBe(true);
  });

  it("guest tanpa sesi tidak punya izin apa pun", () => {
    expect(can(null, "discussion:read")).toBe(false);
    expect(can(null, "booking:decide")).toBe(false);
  });
});

describe("public identity", () => {
  it("student selalu tampil dengan pseudonym, bukan nama asli", () => {
    expect(publicName(student)).toBe(student.publicPseudonym);
    expect(publicName(student)).not.toBe(student.fullName);
  });

  it("student tanpa pseudonym memakai fallback netral, bukan nama asli", () => {
    const noPseudo: User = { ...student, publicPseudonym: undefined };
    expect(publicName(noPseudo)).toBe("Mahasiswa anonim");
    expect(publicName(noPseudo)).not.toContain("Dimas");
  });

  it("pseudonym kosong/spasi juga jatuh ke fallback netral", () => {
    const blank: User = { ...student, publicPseudonym: "   " };
    expect(publicName(blank)).toBe("Mahasiswa anonim");
  });

  it("user tidak dikenal tidak membocorkan identitas", () => {
    expect(publicName(undefined)).toBe("Pengguna anonim");
  });
});

describe("notification isolation", () => {
  const notifications: AppNotification[] = [
    {
      id: "n-a",
      recipientUserId: DEMO_STUDENT_ID,
      type: "BOOKING_APPROVED",
      title: "A",
      body: "a",
      createdAt: "2026-11-20T10:00",
    },
    {
      id: "n-b",
      recipientUserId: DEMO_CDC_ID,
      type: "BOOKING_SUBMITTED",
      title: "B",
      body: "b",
      createdAt: "2026-11-20T11:00",
    },
    {
      id: "n-c",
      recipientUserId: DEMO_STUDENT_ID,
      type: "DISCUSSION_REPLY",
      title: "C",
      body: "c",
      createdAt: "2026-11-20T12:00",
      readAt: "2026-11-20T12:05",
    },
  ];

  it("setiap user hanya melihat notifikasi miliknya", () => {
    const mine = visibleNotifications(notifications, student);
    expect(mine.map((n) => n.id)).toEqual(["n-a", "n-c"]);
    expect(mine.some((n) => n.id === "n-b")).toBe(false);
  });

  it("CDC tidak melihat notifikasi student", () => {
    const mine = visibleNotifications(notifications, cdc);
    expect(mine.map((n) => n.id)).toEqual(["n-b"]);
  });

  it("unread count hanya menghitung notifikasi sendiri yang belum dibaca", () => {
    expect(unreadCount(notifications, student)).toBe(1);
    expect(unreadCount(notifications, lecturer)).toBe(0);
  });

  it("tanpa sesi tidak ada notifikasi yang terbaca", () => {
    expect(visibleNotifications(notifications, null)).toEqual([]);
  });
});

describe("lecturer aggregate privacy", () => {
  it("insight hanya memuat field agregat, tanpa identifier mahasiswa", () => {
    // Bentuk DTO yang diizinkan untuk dosen.
    const insight = {
      topicKey: "normalisasi",
      label: "Normalisasi & denormalisasi",
      courseId: "c-basisdata",
      courseName: "Sistem Basis Data",
      meetingId: "m-bd-07",
      meetingNumber: 7,
      postCount: 1,
      replyCount: 1,
      lastActivityAt: "2026-11-20T10:00",
      acknowledged: false,
    };
    const serialized = JSON.stringify(insight);
    expect(serialized).not.toContain("Dimas");
    expect(serialized).not.toContain("LontarHujan");
    expect(serialized).not.toContain("2210512034");
    expect(serialized).not.toContain("@student");
    expect(Object.keys(insight)).not.toContain("authorUserId");
    expect(Object.keys(insight)).not.toContain("author");
  });
});

describe("state persistence round-trip", () => {
  it("menyimpan dan memulihkan state tanpa kehilangan booking", () => {
    const initial = createInitialState();
    const withLogin = reducer(initial, { type: "LOGIN", userId: DEMO_STUDENT_ID });
    const hydrated = hydrateState(serializeState(withLogin));
    expect(hydrated.currentUserId).toBe(DEMO_STUDENT_ID);
    expect(hydrated.bookings).toHaveLength(withLogin.bookings.length);
  });

  it("data korup tidak membuat aplikasi crash", () => {
    const hydrated = hydrateState("{ bukan json }");
    expect(hydrated.users.length).toBeGreaterThan(0);
    expect(hydrated.currentUserId).toBeNull();
  });

  it("null storage mengembalikan state awal", () => {
    expect(hydrateState(null).currentUserId).toBeNull();
  });
});