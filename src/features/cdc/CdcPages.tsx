import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Eye,
  Filter,
  IdCard,
  Inbox,
  Info,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  BookingStatusBadge,
  DemoTag,
  InlineNote,
  PageHeader,
  StatTile,
} from "../../components/common";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FieldError,
  Label,
  LinkButton,
  Select,
  TextArea,
  cx,
} from "../../components/ui";
import { canTransition, hasBlockingConflict, validateDecision } from "../../domain/booking";
import type { AppNotification, BookingStatus } from "../../domain/types";
import {
  addDays,
  longDate,
  minutesFromMidnight,
  pad,
  rangeLabel,
  shortDate,
  startOfWeek,
  timeOf,
  weekDays,
} from "../../lib/datetime";
import { useCurrentUser, useStore } from "../../store/AppStore";
import { useCdcBookings, useDayTimetable } from "../../store/selectors";

const STATUS_FILTERS: { value: "ALL" | BookingStatus; label: string }[] = [
  { value: "ALL", label: "Semua status" },
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

export function CdcHomePage() {
  const bookings = useCdcBookings();
  const pending = bookings.filter((b) => b.status === "PENDING");
  const flagged = pending.filter((b) => hasBlockingConflict(b.conflicts));
  const approvedToday = bookings.filter(
    (b) => b.status === "APPROVED" && new Date(b.decidedAt ?? "").toDateString() === new Date().toDateString(),
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="CDC"
        title="Antrean operasional"
        description="Permohonan ruang yang perlu keputusan, lengkap dengan cek benturan terhadap jadwal akademik dan booking yang sudah disetujui."
        actions={
          <>
            <DemoTag label="Data DEMO" />
            <LinkButton to="/cdc/approval" size="sm">
              <Inbox size={14} aria-hidden /> Buka antrean lengkap
            </LinkButton>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Menunggu keputusan"
          value={pending.length}
          hint="Perlu tindakan CDC"
          icon={<Clock3 size={15} aria-hidden />}
        />
        <StatTile
          label="Berpotensi bentrok"
          value={flagged.length}
          hint="Jadwal akademik / approved"
          icon={<AlertTriangle size={15} aria-hidden />}
        />
        <StatTile
          label="Disetujui hari ini"
          value={approvedToday}
          hint="Berdasarkan timestamp demo"
          icon={<CheckCircle2 size={15} aria-hidden />}
        />
        <StatTile
          label="Total permohonan"
          value={bookings.length}
          hint="Seluruh status"
          icon={<ClipboardList size={15} aria-hidden />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader
            title="Perlu keputusan"
            description="Urut dari waktu penggunaan terdekat."
            icon={<Inbox size={15} aria-hidden />}
            action={
              <Link
                to="/cdc/approval"
                className="text-[11px] font-bold text-brand-600 hover:text-brand-800"
              >
                Semua antrean
              </Link>
            }
          />
          {pending.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={20} aria-hidden />}
              title="Antrean bersih"
              description="Tidak ada permohonan yang menunggu keputusan saat ini."
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {pending.map((booking) => (
                <li key={booking.id}>
                  <Link
                    to={`/cdc/approval/${booking.id}`}
                    className="block px-4 py-3 transition-colors hover:bg-brand-50/50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink-900">
                          {booking.roomName}{" "}
                          <span className="font-medium text-ink-400">· {booking.floorLabel}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-500">
                          {longDate(booking.startsAt)} ·{" "}
                          <span className="font-mono">
                            {rangeLabel(booking.startsAt, booking.endsAt)}
                          </span>
                        </p>
                      </div>
                      {hasBlockingConflict(booking.conflicts) ? (
                        <Badge tone="danger">
                          <AlertTriangle size={9} aria-hidden /> Bentrok
                        </Badge>
                      ) : (
                        <Badge tone="warning">Menunggu</Badge>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-[11px] leading-relaxed text-ink-600">
                      {booking.purpose}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <WeekTimetableCard compact />
          <InlineNote title="Ruang lingkup identitas">
            Nama asli, NIM, dan email pemohon hanya tampil di halaman detail approval. Antrean dan
            kalender tetap memakai pseudonym.
          </InlineNote>
        </div>
      </div>
    </div>
  );
}

export function CdcApprovalPage() {
  const bookings = useCdcBookings();
  const [status, setStatus] = useState<"ALL" | BookingStatus>("PENDING");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (status !== "ALL" && b.status !== status) return false;
      if (!q) return true;
      return [b.roomName, b.purpose, b.studentPseudonym, b.floorLabel]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [bookings, status, query]);

  const pending = bookings.filter((b) => b.status === "PENDING").length;

  return (
    <div>
      <PageHeader
        eyebrow="CDC · Approval"
        title="Antrean permohonan"
        description={`${pending} permohonan menunggu keputusan. Setiap keputusan dicatat beserta aktor dan waktu.`}
        actions={<DemoTag label="Data DEMO" />}
      />

      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-500">
          <Filter size={13} aria-hidden /> Filter
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as "ALL" | BookingStatus)}
          aria-label="Filter status"
          className="w-44"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari ruang, tujuan, pseudonym…"
          aria-label="Cari permohonan"
          className="h-10 min-w-52 flex-1 rounded-xl border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:border-brand-400"
        />
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox size={20} aria-hidden />}
            title="Tidak ada permohonan pada filter ini"
            description="Ubah filter status atau kata kunci pencarian untuk melihat permohonan lain."
          />
        </Card>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-[1.6fr_1fr_1fr_7rem_5.5rem] gap-3 border-b border-ink-100 bg-ink-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-ink-500 lg:grid">
            <span>Permohonan</span>
            <span>Waktu</span>
            <span>Pemohon (pseudonym)</span>
            <span>Benturan</span>
            <span className="text-right">Status</span>
          </div>
          <ul className="divide-y divide-ink-100">
            {filtered.map((b) => (
              <li key={b.id}>
                <Link
                  to={`/cdc/approval/${b.id}`}
                  className="grid gap-1.5 px-4 py-3 transition-colors hover:bg-brand-50/40 lg:grid-cols-[1.6fr_1fr_1fr_7rem_5.5rem] lg:items-center lg:gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink-900">
                      {b.roomName} <span className="font-medium text-ink-400">· {b.floorLabel}</span>
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-500">{b.purpose}</p>
                  </div>
                  <div className="text-[11px] text-ink-600">
                    <p className="font-semibold">{shortDate(b.startsAt)}</p>
                    <p className="font-mono text-ink-500">
                      {rangeLabel(b.startsAt, b.endsAt)}
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-ink-600">{b.studentPseudonym}</div>
                  <div>
                    {hasBlockingConflict(b.conflicts) ? (
                      <Badge tone="danger">
                        <AlertTriangle size={9} aria-hidden /> Bentrok
                      </Badge>
                    ) : b.conflicts.length > 0 ? (
                      <Badge tone="warning">Pending lain</Badge>
                    ) : (
                      <Badge tone="success">Bersih</Badge>
                    )}
                  </div>
                  <div className="lg:text-right">
                    <BookingStatusBadge status={b.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CdcApprovalDetailPage() {
  const { bookingId } = useParams();
  const bookings = useCdcBookings();
  const booking = bookings.find((b) => b.id === bookingId);
  const user = useCurrentUser();
  const { dispatch, toast, state } = useStore();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);

  if (!booking) {
    return (
      <Card>
        <EmptyState
          icon={<Inbox size={20} aria-hidden />}
          title="Permohonan tidak ditemukan"
          description="Permohonan mungkin sudah tidak ada. Kembali ke antrean untuk memilih permohonan lain."
          action={
            <LinkButton to="/cdc/approval" size="sm">
              Kembali ke antrean
            </LinkButton>
          }
        />
      </Card>
    );
  }

  if (!user) return null;

  const blocking = hasBlockingConflict(booking.conflicts);
  const canApprove = canTransition(booking.status, "APPROVE") && !blocking;

  function decide(action: "APPROVE" | "REJECT") {
    if (!booking || !user) return;
    const validation = validateDecision(booking, {
      action,
      reason,
      actorRole: user.role,
    });
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    if (action === "APPROVE" && blocking) {
      setError("Tidak bisa disetujui: masih ada benturan jadwal akademik atau booking disetujui.");
      return;
    }
    setError(null);

    const status: BookingStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    const notification: AppNotification = {
      id: `n-${booking.id}-${action.toLowerCase()}`,
      recipientUserId: booking.requesterUserId,
      type: status === "APPROVED" ? "BOOKING_APPROVED" : "BOOKING_REJECTED",
      title: status === "APPROVED" ? "Permohonan ruang disetujui" : "Permohonan ruang ditolak",
      body:
        status === "APPROVED"
          ? `${booking.roomName} pada ${longDate(booking.startsAt)} ${rangeLabel(booking.startsAt, booking.endsAt)} disetujui.`
          : `${booking.roomName} pada ${longDate(booking.startsAt)} ditolak: ${reason.trim()}`,
      targetPath: "/student/booking",
      createdAt: new Date().toISOString(),
    };

    dispatch({
      type: "DECIDE_BOOKING",
      bookingId: booking.id,
      status,
      decidedByUserId: user.id,
      rejectionReason: action === "REJECT" ? reason.trim() : undefined,
      notification,
    });

    toast(
      "success",
      action === "APPROVE"
        ? "Permohonan disetujui dan pemohon menerima notifikasi."
        : "Permohonan ditolak dengan alasan yang tercatat.",
    );
    navigate("/cdc/approval");
  }

  return (
    <div>
      <Link
        to="/cdc/approval"
        className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-brand-700"
      >
        <ArrowLeft size={12} aria-hidden /> Antrean approval
      </Link>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
                  Permohonan ruang
                </p>
                <h1 className="mt-1 text-lg font-extrabold tracking-tight text-ink-900">
                  {booking.roomName}
                </h1>
                <p className="mt-1 text-xs text-ink-500">{booking.floorLabel} · Gedung Utama</p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Waktu mulai" value={`${longDate(booking.startsAt)} · ${timeOf(booking.startsAt)}`} />
              <Field label="Waktu selesai" value={`${timeOf(booking.endsAt)}`} />
              <Field label="Jumlah peserta" value={booking.participantCount ? `${booking.participantCount} orang` : "Belum ditentukan"} />
              <Field label="Diajukan" value={longDate(booking.createdAt)} />
            </dl>

            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                Tujuan penggunaan
              </p>
              <p className="mt-1 rounded-xl bg-ink-50 px-3 py-2.5 text-xs leading-relaxed text-ink-700">
                {booking.purpose}
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Identitas pemohon"
              description="Hanya tersedia di workflow booking untuk proses izin."
              icon={<IdCard size={15} aria-hidden />}
              action={<Badge tone="info">Akses terbatas</Badge>}
            />
            <dl className="grid gap-3 px-5 py-4 sm:grid-cols-2">
              <Field label="Nama lengkap" value={booking.requester.fullName} strong />
              <Field label="NIM" value={booking.requester.campusSubjectId ?? "Belum tersedia"} mono />
              <Field label="Email kampus" value={booking.requester.email ?? "Belum tersedia"} />
              <Field label="Pseudonym publik" value={booking.requester.publicPseudonym ?? "—"} />
            </dl>
            <p className="border-t border-ink-100 px-5 py-2.5 text-[10px] leading-relaxed text-ink-400">
              Identitas ini tidak ditampilkan di antrean, kalender, maupun area diskusi.
            </p>
          </Card>

          <Card>
            <CardHeader
              title="Cek benturan"
              description="Dibandingkan dengan jadwal akademik dan booking yang sudah disetujui."
              icon={<ShieldCheck size={15} aria-hidden />}
              action={
                blocking ? (
                  <Badge tone="danger">Ada benturan</Badge>
                ) : (
                  <Badge tone="success">Tidak ada benturan</Badge>
                )
              }
            />
            {booking.conflicts.length === 0 ? (
              <div className="px-5 py-4">
                <p className="text-xs leading-relaxed text-ink-600">
                  Tidak ditemukan jadwal akademik maupun booking disetujui pada rentang waktu ini.
                  Ketersediaan akhir tetap keputusan operasional CDC.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-ink-100">
                {booking.conflicts.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5 px-5 py-2.5">
                    <AlertTriangle
                      size={14}
                      className={cx(
                        "mt-0.5 shrink-0",
                        c.kind === "PENDING_BOOKING" ? "text-pending-600" : "text-danger-600",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink-800">{c.label}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-ink-500">
                        {rangeLabel(c.startsAt, c.endsAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card>
            <CardHeader title="Keputusan" icon={<CheckCircle2 size={15} aria-hidden />} />
            <div className="space-y-3 px-5 py-4">
              {booking.status !== "PENDING" ? (
                <div className="rounded-xl bg-ink-50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-ink-700">
                    Permohonan ini sudah {booking.status === "APPROVED" ? "disetujui" : booking.status === "REJECTED" ? "ditolak" : "dibatalkan"}.
                  </p>
                  {booking.decidedByUserId ? (
                    <p className="mt-0.5 text-[11px] text-ink-500">
                      Oleh{" "}
                      {state.users.find((u) => u.id === booking.decidedByUserId)?.fullName ??
                        "petugas"}{" "}
                      {booking.decidedAt ? `· ${timeOf(booking.decidedAt)}` : ""}
                    </p>
                  ) : null}
                  {booking.rejectionReason ? (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-ink-600">
                      Alasan: {booking.rejectionReason}
                    </p>
                  ) : null}
                </div>
              ) : (
                <>
                  {blocking ? (
                    <div className="rounded-xl border border-danger-600/30 bg-danger-50 px-3 py-2.5">
                      <p className="text-[11px] font-bold text-danger-600">
                        Approval diblokir oleh benturan
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-ink-600">
                        Minta pemohon memilih waktu lain, atau ubah jadwal lebih dulu melalui menu
                        Jadwal.
                      </p>
                    </div>
                  ) : (
                    <Button
                      variant="success"
                      className="w-full"
                      onClick={() => decide("APPROVE")}
                      disabled={!canApprove}
                    >
                      <CheckCircle2 size={15} aria-hidden /> Setujui permohonan
                    </Button>
                  )}

                  {showReject ? (
                    <div className="space-y-2">
                      <Label htmlFor="reject-reason">Alasan penolakan (wajib)</Label>
                      <TextArea
                        id="reject-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        invalid={Boolean(error)}
                        placeholder="Contoh: bentrok jadwal akademik pada jam yang sama. Silakan pilih waktu lain."
                        maxLength={280}
                      />
                      <div className="flex items-center justify-between">
                        <FieldError>{error}</FieldError>
                        <span className="ml-auto text-[10px] text-ink-400">{reason.length}/280</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="danger" size="sm" onClick={() => decide("REJECT")}>
                          Tolak permohonan
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowReject(false);
                            setError(null);
                          }}
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => setShowReject(true)}
                    >
                      <XCircle size={15} aria-hidden /> Tolak dengan alasan
                    </Button>
                  )}

                  {error && !showReject ? <FieldError>{error}</FieldError> : null}
                </>
              )}

              <div className="flex items-start gap-2 rounded-xl bg-ink-50 px-3 py-2.5">
                <Info size={13} className="mt-0.5 shrink-0 text-ink-400" aria-hidden />
                <p className="text-[10px] leading-relaxed text-ink-500">
                  Keputusan, aktor, dan waktu disimpan pada permohonan. Pada MVP ini penyimpanan
                  bersifat lokal, bukan audit log server.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Jadwal ruangan pada tanggal ini" icon={<CalendarClock size={15} aria-hidden />} />
            <DayRoomSchedule roomId={booking.roomId} date={booking.startsAt} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  strong,
  mono,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd
        className={cx(
          "mt-0.5 text-xs text-ink-800",
          strong && "font-bold",
          mono && "font-mono text-ink-600",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function DayRoomSchedule({ roomId, date }: { roomId: string; date: string }) {
  const entries = useDayTimetable(new Date(date)).filter((e) => e.roomId === roomId);

  if (entries.length === 0) {
    return (
      <p className="px-5 py-4 text-xs text-ink-500">
        Tidak ada entri lain untuk ruangan ini pada tanggal tersebut.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-ink-100">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-2">
          <span className="truncate text-[11px] font-semibold text-ink-700">
            {entry.kind === "ACADEMIC" ? entry.label : "Booking"}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-ink-500">
            {rangeLabel(entry.startsAt, entry.endsAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* --------------------------- Weekly calendar --------------------------- */

const HOUR_START = 7;
const HOUR_END = 21;

export function WeekTimetableCard({ compact = false }: { compact?: boolean }) {
  const { state } = useStore();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const days = weekDays(weekStart);
  const rooms = state.rooms.filter((r) => r.kind === "CLASSROOM" || r.kind === "LAB");
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const room = state.rooms.find((r) => r.id === roomId);

  const events = useMemo(() => {
    const academic = state.academicSchedules
      .filter((s) => s.roomId === roomId)
      .map((s) => {
        const course = state.courses.find((c) => c.id === s.courseId);
        return {
          id: s.id,
          kind: "ACADEMIC" as const,
          label: course?.name ?? "Jadwal akademik",
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          status: "SCHEDULED" as const,
        };
      });
    const bookings = state.bookings
      .filter((b) => b.roomId === roomId && (b.status === "APPROVED" || b.status === "PENDING"))
      .map((b) => ({
        id: b.id,
        kind: "BOOKING" as const,
        label: b.purpose,
        startsAt: b.startsAt,
        endsAt: b.endsAt,
        status: b.status,
      }));
    return [...academic, ...bookings];
  }, [state.academicSchedules, state.bookings, state.courses, roomId]);

  const weekLabel = `${shortDate(days[0])} – ${shortDate(days[6])}`;
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const dayMinuteHeight = compact ? 0.9 : 1.2;

  return (
    <Card>
      <CardHeader
        title="Kalender ruangan"
        description={room ? `${room.name} · ${weekLabel}` : weekLabel}
        icon={<CalendarCheck size={15} aria-hidden />}
        action={
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Minggu sebelumnya"
              onClick={() => setWeekStart((d) => addDays(d, -7))}
              className="inline-flex size-7 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-100"
            >
              <ChevronLeft size={14} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Minggu berikutnya"
              onClick={() => setWeekStart((d) => addDays(d, 7))}
              className="inline-flex size-7 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-100"
            >
              <ChevronRight size={14} aria-hidden />
            </button>
          </div>
        }
      />

      <div className="border-b border-ink-100 px-4 py-2.5">
        <Select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          aria-label="Pilih ruangan untuk kalender"
          className="h-8 text-xs"
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[38rem]">
          <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b border-ink-100 bg-ink-50/60 text-[10px] font-bold text-ink-500">
            <span className="px-2 py-1.5" />
            {days.map((d) => (
              <span key={d.toISOString()} className="px-1 py-1.5 text-center">
                {shortDate(d)}
              </span>
            ))}
          </div>

          <div className="relative grid grid-cols-[3rem_repeat(7,1fr)]">
            <div>
              {hours.map((h) => (
                <div
                  key={h}
                  className="border-b border-ink-100 px-2 text-right text-[10px] font-medium text-ink-400"
                  style={{ height: `${dayMinuteHeight * 60}px` }}
                >
                  {pad(h)}:00
                </div>
              ))}
            </div>

            {days.map((day) => (
              <div key={day.toISOString()} className="relative border-l border-ink-100">
                {hours.map((h) => (
                  <div
                    key={h}
                    className="border-b border-ink-100"
                    style={{ height: `${dayMinuteHeight * 60}px` }}
                  />
                ))}

                {events
                  .filter((e) => new Date(e.startsAt).toDateString() === day.toDateString())
                  .map((event) => {
                    const startMin = minutesFromMidnight(event.startsAt);
                    const endMin = minutesFromMidnight(event.endsAt);
                    const top = (startMin - HOUR_START * 60) * dayMinuteHeight;
                    const height = Math.max(18, (endMin - startMin) * dayMinuteHeight - 2);

                    if (startMin < HOUR_START * 60 || startMin > HOUR_END * 60) return null;

                    const isAcademic = event.kind === "ACADEMIC";
                    return (
                      <div
                        key={event.id}
                        title={`${event.label} · ${rangeLabel(event.startsAt, event.endsAt)}`}
                        className={cx(
                          "absolute inset-x-1 overflow-hidden rounded-md border px-1 py-0.5 text-[9px] leading-tight",
                          isAcademic
                            ? "border-brand-300 bg-brand-100 text-brand-800"
                            : event.status === "APPROVED"
                              ? "border-available-600/30 bg-available-50 text-available-600"
                              : "border-pending-600/30 bg-pending-50 text-pending-600",
                        )}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <span className="block truncate font-bold">{event.label}</span>
                        <span className="block truncate font-mono">
                          {timeOf(event.startsAt)}–{timeOf(event.endsAt)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 px-4 py-2.5 text-[10px] text-ink-500">
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-sm border border-brand-300 bg-brand-100" aria-hidden /> Jadwal
          akademik
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-sm border border-available-600/30 bg-available-50" aria-hidden />{" "}
          Disetujui
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-sm border border-pending-600/30 bg-pending-50" aria-hidden />{" "}
          Menunggu
        </span>
      </div>
    </Card>
  );
}

export function CdcSchedulePage() {
  const { state } = useStore();
  const user = useCurrentUser();  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const days = weekDays(weekStart);

  const rows = useMemo(() => {
    const inWeek = (iso: string) => {
      const d = new Date(iso);
      return d >= weekStart && d < addDays(weekStart, 7);
    };
    return state.academicSchedules
      .filter((s) => inWeek(s.startsAt))
      .map((s) => {
        const course = state.courses.find((c) => c.id === s.courseId);
        const room = state.rooms.find((r) => r.id === s.roomId);
        return { ...s, courseName: course?.name ?? "Mata kuliah", roomName: room?.name ?? "Ruang" };
      })
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [state.academicSchedules, state.courses, state.rooms, weekStart]);

  return (
    <div>
      <PageHeader
        eyebrow="CDC · Jadwal"
        title="Jadwal akademik"
        description="Data jadwal pada MVP berasal dari seed DEMO. Impor atau sinkronisasi API akademik belum tersedia."
        actions={<DemoTag label="Jadwal DEMO" />}
      />

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Minggu</p>
                <p className="text-sm font-bold text-ink-900">
                  {shortDate(days[0])} – {shortDate(days[6])}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="secondary" onClick={() => setWeekStart((d) => addDays(d, -7))}>
                  <ChevronLeft size={13} aria-hidden /> Sebelumnya
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setWeekStart(startOfWeek(new Date()))}>
                  Minggu ini
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setWeekStart((d) => addDays(d, 7))}>
                  Berikutnya <ChevronRight size={13} aria-hidden />
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Daftar jadwal"
              description="Jadwal resmi hanya boleh diubah petugas berwenang."
              icon={<CalendarClock size={15} aria-hidden />}
            />
            {rows.length === 0 ? (
              <EmptyState
                icon={<CalendarClock size={18} aria-hidden />}
                title="Jadwal belum tersedia"
                description="Tidak ada jadwal akademik pada minggu ini di data demo."
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {rows.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-900">{row.courseName}</p>
                      <p className="mt-0.5 text-[11px] text-ink-500">
                        {row.roomName} ·{" "}
                        {state.users.find((u) => u.id === row.lecturerId)?.fullName ?? "Dosen"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-400">{longDate(row.startsAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">Akademik</Badge>
                      <span className="font-mono text-[11px] font-semibold text-ink-600">
                        {rangeLabel(row.startsAt, row.endsAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-ink-100 px-4 py-2.5 text-[10px] leading-relaxed text-ink-400">
              Kewenangan rinci CDC vs bagian akademik belum ditetapkan, sehingga layar ini bersifat
              read-only. Sumber: seed DEMO, bukan sistem akademik.
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <WeekTimetableCard />
          <InlineNote title="Status edit jadwal">
            Pada MVP, jadwal akademik hanya dapat dibaca. Edit/impor menunggu format resmi dan
            kewenangan petugas, sesuai Decision Log.
          </InlineNote>
          {user ? (
            <Card className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                Sesi CDC
              </p>
              <p className="mt-1 text-xs font-semibold text-ink-800">{user.fullName}</p>
              <p className="text-[11px] text-ink-500">{user.title}</p>
              <p className="mt-2 flex items-center gap-1 text-[10px] text-ink-400">
                <Eye size={11} aria-hidden /> Akses identitas pemohon hanya di detail booking.
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}