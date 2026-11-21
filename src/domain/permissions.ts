import type { AppNotification, Role, User } from "./types";

export type Permission =
  | "discussion:create"
  | "discussion:reply"
  | "discussion:read"
  | "discussion:aggregate"
  | "booking:create"
  | "booking:decide"
  | "booking:viewIdentity"
  | "schedule:view"
  | "schedule:manage"
  | "lecturer:schedule"
  | "lecturer:acknowledge";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  STUDENT: [
    "discussion:create",
    "discussion:reply",
    "discussion:read",
    "booking:create",
  ],
  CDC: [
    "discussion:read",
    "booking:decide",
    "booking:viewIdentity",
    "schedule:view",
    "schedule:manage",
  ],
  LECTURER: [
    "discussion:read",
    "discussion:aggregate",
    "schedule:view",
    "lecturer:schedule",
    "lecturer:acknowledge",
  ],
};

export function can(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role].includes(permission);
}

export function assertCan(user: User | null, permission: Permission): void {
  if (!can(user, permission)) {
    throw new PermissionError(`Role ${user?.role ?? "GUEST"} tidak boleh melakukan aksi ini.`);
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

/** Nama publik: selalu pseudonym. Fallback netral, tidak pernah nama asli. */
export function publicName(user: User | undefined | null): string {
  if (!user) return "Pengguna anonim";
  if (user.role === "STUDENT") {
    return user.publicPseudonym?.trim() || "Mahasiswa anonim";
  }
  if (user.role === "LECTURER") return user.fullName;
  return user.fullName;
}

export function isSelf(user: User | null, userId: string): boolean {
  return !!user && user.id === userId;
}

/**
 * Notifikasi diisolasi per user. Recipient lain tidak boleh terbaca
 * meskipun role-nya sama.
 */
export function visibleNotifications(
  all: AppNotification[],
  viewer: User | null,
): AppNotification[] {
  if (!viewer) return [];
  return all.filter((n) => n.recipientUserId === viewer.id);
}

export function unreadCount(all: AppNotification[], viewer: User | null): number {
  return visibleNotifications(all, viewer).filter((n) => !n.readAt).length;
}

export const HOME_PATH: Record<Role, string> = {
  STUDENT: "/student",
  CDC: "/cdc",
  LECTURER: "/lecturer",
};