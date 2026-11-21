import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  Clock3,
  Hash,
  MessagesSquare,
  PencilLine,
  Sparkles,
  UserRound,
} from "lucide-react";
import { BookingStatusBadge, DemoTag, StatTile } from "../../components/common";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FieldError,
  Label,
  LinkButton,
  TextInput,
} from "../../components/ui";
import { publicName } from "../../domain/permissions";
import { rangeLabel, relativeTime, shortDate, timeOf } from "../../lib/datetime";
import { useCurrentUser, useStore } from "../../store/AppStore";
import { useDiscussions, useMyBookings, useNotifications } from "../../store/selectors";

export function StudentHomePage() {
  const user = useCurrentUser();
  const { toast, dispatch } = useStore();
  const discussions = useDiscussions();
  const bookings = useMyBookings(user?.id ?? null);
  const notifications = useNotifications(user?.id ?? null);
  const [editing, setEditing] = useState(false);
  const [pseudonym, setPseudonym] = useState(user?.publicPseudonym ?? "");
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const unread = notifications.filter((n) => !n.readAt).length;
  const topTags = Array.from(
    new Set(discussions.flatMap((d) => d.tags ?? [])),
  ).slice(0, 6);

  function savePseudonym(event: React.FormEvent) {
    event.preventDefault();
    const value = pseudonym.trim();
    if (value.length < 3 || value.length > 24) {
      setError("Pseudonym 3–24 karakter.");
      return;
    }
    if (!/^[A-Za-z0-9._-]+$/.test(value)) {
      setError("Gunakan huruf, angka, titik, garis bawah, atau tanda hubung.");
      return;
    }
    setError(null);
    if (!user) return;
    dispatch({ type: "SET_PSEUDONYM", userId: user.id, pseudonym: value });
    toast("success", "Pseudonym diperbarui. Nama publik di diskusi langsung berubah.");
    setEditing(false);
  }

  return (
    <div>
      <div className="mb-5 overflow-hidden rounded-2xl border border-brand-200 bg-white">
        <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-5 text-white sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
            Selamat datang kembali
          </p>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
            Halo, {user.publicPseudonym}
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/80">
            Kamu tampil di ruang publik sebagai pseudonym. Nama asli dan NIM hanya dipakai Tim CDC saat
            memproses permohonan ruang.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              <UserRound size={10} aria-hidden /> {user.publicPseudonym}
            </Badge>
            <Badge tone="neutral">Mock auth</Badge>
            <DemoTag label="Data DEMO" />
          </div>
          <Button size="sm" variant="secondary" onClick={() => setEditing((v) => !v)}>
            <PencilLine size={13} aria-hidden />
            {editing ? "Tutup" : "Ubah pseudonym"}
          </Button>
        </div>

        {editing ? (
          <form onSubmit={savePseudonym} className="border-t border-ink-100 px-5 py-3" noValidate>
            <Label htmlFor="pseudonym">Pseudonym publik</Label>
            <div className="flex flex-wrap items-start gap-2">
              <div className="min-w-48 flex-1">
                <TextInput
                  id="pseudonym"
                  value={pseudonym}
                  invalid={Boolean(error)}
                  onChange={(e) => setPseudonym(e.target.value)}
                  placeholder="Contoh: LontarHujan"
                  maxLength={24}
                />
                <FieldError>{error}</FieldError>
              </div>
              <Button type="submit" size="md">
                Simpan
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-ink-400">
              Nama baru hanya mengubah tampilan publik, bukan identitas akademik.
            </p>
          </form>
        ) : null}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Diskusi"
          value={discussions.length}
          hint="Seluruh mata kuliah"
          icon={<MessagesSquare size={15} aria-hidden />}
        />
        <StatTile
          label="Booking menunggu"
          value={pending}
          hint="Menunggu keputusan CDC"
          icon={<Clock3 size={15} aria-hidden />}
        />
        <StatTile
          label="Notifikasi baru"
          value={unread}
          hint="Belum dibaca"
          icon={<Sparkles size={15} aria-hidden />}
        />
        <StatTile
          label="Permohonan saya"
          value={bookings.length}
          hint="Semua status"
          icon={<Building2 size={15} aria-hidden />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Diskusi terbaru"
              description="Konteks pertemuan dan dosen terlihat langsung."
              icon={<MessagesSquare size={15} aria-hidden />}
              action={
                <Link
                  to="/student/discussions"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800"
                >
                  Semua <ArrowRight size={12} aria-hidden />
                </Link>
              }
            />
            <ul className="divide-y divide-ink-100">
              {discussions.slice(0, 4).map((post) => (
                <li key={post.id}>
                  <Link
                    to={`/student/discussions/${post.id}`}
                    className="block px-4 py-3 transition-colors hover:bg-brand-50/50"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="brand">{post.course.hashtag}</Badge>
                      <span className="text-[10px] font-semibold text-ink-400">
                        Pertemuan {post.meeting.meetingNumber}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-bold leading-snug text-ink-900">
                      {post.title ?? post.body.slice(0, 60)}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-400">
                      {post.author.pseudonym} · {post.course.name} · {post.replyCount} balasan ·{" "}
                      {relativeTime(post.lastActivityAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Permohonan ruang terakhir"
              icon={<Building2 size={15} aria-hidden />}
              action={
                <Link
                  to="/student/booking"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800"
                >
                  Semua <ArrowRight size={12} aria-hidden />
                </Link>
              }
            />
            {bookings.length === 0 ? (
              <EmptyState
                icon={<Building2 size={18} aria-hidden />}
                title="Belum ada permohonan"
                description="Cari ruang dan ajukan waktu penggunaan."
                action={
                  <LinkButton to="/student/rooms" size="sm" variant="secondary">
                    Cari ruangan
                  </LinkButton>
                }
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {bookings.slice(0, 3).map((booking) => (
                  <li key={booking.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-ink-800">{booking.roomName}</p>
                      <p className="text-[11px] text-ink-400">
                        {shortDate(booking.startsAt)} · {rangeLabel(booking.startsAt, booking.endsAt)}
                      </p>
                    </div>
                    <BookingStatusBadge status={booking.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Jelajahi topik" icon={<Hash size={15} aria-hidden />} />
            <div className="flex flex-wrap gap-1.5 px-4 py-3">
              {topTags.map((tag) => (
                <Link
                  key={tag}
                  to="/student/discussions"
                  className="inline-flex items-center gap-0.5 rounded-full border border-ink-200 px-2.5 py-1 text-[11px] font-semibold text-ink-600 hover:border-brand-300 hover:text-brand-700"
                >
                  <Hash size={9} aria-hidden />
                  {tag}
                </Link>
              ))}
            </div>
            <div className="border-t border-ink-100 px-4 py-3">
              <LinkButton to="/student/materials" size="sm" variant="secondary" className="w-full">
                <CalendarClock size={13} aria-hidden /> Buka materi kuliah
              </LinkButton>
            </div>
          </Card>

          <Card>
            <CardHeader title="Aktivitas terbaru" icon={<Check size={15} aria-hidden />} />
            {notifications.length === 0 ? (
              <EmptyState
                icon={<Check size={18} aria-hidden />}
                title="Belum ada aktivitas"
                description="Notifikasi keputusan booking dan balasan diskusi akan muncul di sini."
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {notifications.slice(0, 4).map((n) => (
                  <li key={n.id} className="px-4 py-2.5">
                    <p className="text-[11px] font-bold text-ink-800">{n.title}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-ink-500">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-ink-400">
                      {timeOf(n.createdAt)} · {relativeTime(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
              Reputasi publik
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-600">
              Kontribusimu tercatat sebagai{" "}
              <strong className="font-semibold text-ink-800">{publicName(user)}</strong>. Tidak ada
              skor atau KPI dekoratif — hanya jejak diskusi yang bisa dibaca ulang.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}