import { useEffect, useId, useRef, useState } from "react";
import { Bell, ChevronDown, GraduationCap, Menu, RotateCcw, X } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/campusespace-logo.svg";
import { HOME_PATH, publicName, unreadCount } from "../domain/permissions";
import type { Role } from "../domain/types";
import { relativeTime } from "../lib/datetime";
import { useNotifications } from "../store/selectors";
import { useCurrentUser, useStore } from "../store/AppStore";
import { cx } from "./ui";

const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Mahasiswa",
  CDC: "Tim CDC",
  LECTURER: "Dosen",
};

const NAV: Record<Role, { to: string; label: string }[]> = {
  STUDENT: [
    { to: "/student", label: "Beranda" },
    { to: "/student/discussions", label: "Diskusi" },
    { to: "/student/rooms", label: "Cari Ruang" },
    { to: "/student/booking", label: "Booking Saya" },
  ],
  CDC: [
    { to: "/cdc", label: "Beranda" },
    { to: "/cdc/approval", label: "Approval" },
    { to: "/cdc/jadwal", label: "Jadwal" },
  ],
  LECTURER: [
    { to: "/lecturer", label: "Beranda" },
    { to: "/lecturer/jadwal", label: "Jadwal" },
    { to: "/lecturer/insight", label: "Insight Mahasiswa" },
  ],
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const { toast, resetDemo } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-700 focus:shadow-lg"
      >
        Lompat ke konten utama
      </a>

      <header className="sticky top-0 z-40 border-b border-brand-100/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link to={HOME_PATH[user.role]} className="flex items-center gap-2.5 rounded-lg">
            <img src={logo} alt="" className="size-9" width={36} height={36} />
            <span className="leading-tight">
              <span className="block text-sm font-extrabold tracking-tight text-brand-800">
                CampusSpace
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-ink-400">
                Demo MVP
              </span>
            </span>
          </Link>

          <nav aria-label="Navigasi utama" className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV[user.role].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === HOME_PATH[user.role]}
                className={({ isActive }) =>
                  cx(
                    "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <RoleMenu onResetDemo={resetDemo} onToast={toast} />
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <nav
            id="mobile-nav"
            aria-label="Navigasi mobile"
            className="border-t border-ink-100 bg-white px-4 py-3 lg:hidden"
          >
            <ul className="space-y-1">
              {NAV[user.role].map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === HOME_PATH[user.role]}
                    className={({ isActive }) =>
                      cx(
                        "block rounded-lg px-3 py-2.5 text-sm font-semibold",
                        isActive ? "bg-brand-50 text-brand-700" : "text-ink-600",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </header>

      <main id="main" className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-brand-100 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-y-1 px-4 py-4 text-[11px] text-ink-500 sm:px-6">
          <GraduationCap size={14} className="mr-1.5 text-brand-400" aria-hidden />
          <span className="font-semibold text-ink-600">CampusSpace</span>
          <span className="mx-2 text-ink-300">·</span>
          <span>Prototipe DEMO — bukan data akademik resmi.</span>
          <span className="mx-2 hidden text-ink-300 sm:inline">·</span>
          <span className="hidden sm:inline">Data disimpan lokal di browser kamu.</span>
        </div>
      </footer>
    </div>
  );
}

function RoleMenu({
  onResetDemo,
  onToast,
}: {
  onResetDemo: () => void;
  onToast: (tone: "success" | "error" | "info", message: string) => void;
}) {
  const user = useCurrentUser();
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const displayName = publicName(user);
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white py-1.5 pl-1.5 pr-2 text-left transition-colors hover:border-brand-300"
      >
        <span
          aria-hidden
          className="flex size-7 items-center justify-center rounded-lg bg-brand-600 text-[11px] font-bold text-white"
        >
          {initials}
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block max-w-[9rem] truncate text-xs font-bold text-ink-800">
            {displayName}
          </span>
          <span className="block text-[10px] font-medium text-ink-400">
            {ROLE_LABEL[user.role]}
          </span>
        </span>
        <ChevronDown size={14} className="text-ink-400" aria-hidden />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xl"
        >
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-bold text-ink-900">{displayName}</p>
            {user.role === "STUDENT" ? (
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500">
                Nama kamu hanya terlihat oleh Tim CDC saat permohonan ruang diproses.
              </p>
            ) : (
              <p className="mt-0.5 text-[11px] text-ink-500">{user.title ?? ROLE_LABEL[user.role]}</p>
            )}
          </div>
          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-ink-600 hover:bg-ink-100"
              onClick={() => {
                setOpen(false);
                navigate("/");
              }}
            >
              Ganti peran demo
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-ink-600 hover:bg-ink-100"
              onClick={() => {
                onResetDemo();
                onToast("info", "Data demo dikembalikan ke kondisi awal.");
                setOpen(false);
                navigate("/");
              }}
            >
              <RotateCcw size={14} aria-hidden /> Reset data demo
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-danger-600 hover:bg-danger-50"
              onClick={() => {
                dispatch({ type: "LOGOUT" });
                navigate("/");
              }}
            >
              Keluar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotificationBell() {
  const user = useCurrentUser();
  const notifications = useNotifications(user?.id ?? null);
  const { dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = unreadCount(notifications, user);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Notifikasi${count > 0 ? `, ${count} belum dibaca` : ""}`}
        className="relative inline-flex size-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700"
      >
        <Bell size={17} aria-hidden />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-bold leading-4 text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[20rem] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Notifikasi</p>
            <button
              type="button"
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 disabled:text-ink-300"
              disabled={count === 0}
              onClick={() => dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ", userId: user.id })}
            >
              Tandai semua dibaca
            </button>
          </div>
          <ul className="max-h-80 divide-y divide-ink-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-ink-500">
                Belum ada notifikasi untuk peran ini.
              </li>
            ) : (
              notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    to={n.targetPath ?? HOME_PATH[user.role]}
                    onClick={() => {
                      dispatch({ type: "MARK_NOTIFICATION_READ", notificationId: n.id });
                      setOpen(false);
                    }}
                    className={cx(
                      "block px-4 py-3 transition-colors hover:bg-brand-50/60",
                      !n.readAt && "bg-brand-50/40",
                    )}
                  >
                    <p className="flex items-center gap-1.5 text-xs font-bold text-ink-800">
                      {!n.readAt ? (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-brand-500"
                          aria-label="Belum dibaca"
                        />
                      ) : null}
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500">{n.body}</p>
                    <p className="mt-1 text-[10px] font-medium text-ink-400">
                      {relativeTime(n.createdAt)}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}