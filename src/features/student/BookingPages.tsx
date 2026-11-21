import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";
import { BookingStatusBadge, DemoTag } from "../../components/common";
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
  TextInput,
  cx,
} from "../../components/ui";
import {
  findConflicts,
  validateBookingDraft,
  validateDecision,
  type FieldErrors,
} from "../../domain/booking";
import type { AppNotification, ConflictInfo, RoomBooking } from "../../domain/types";
import { longDate, pad, rangeLabel } from "../../lib/datetime";
import { useCurrentUser, useStore } from "../../store/AppStore";

function defaultStart(): string {
  const now = new Date();
  const next = new Date(now.getTime() + 60 * 60 * 1000);
  next.setMinutes(next.getMinutes() < 30 ? 30 : 0, 0, 0);
  if (next.getMinutes() === 0) next.setHours(next.getHours() + 1);
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
}

function defaultEnd(start: string): string {
  const d = new Date(start);
  d.setHours(d.getHours() + 2);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BookingForm({ roomId }: { roomId: string }) {
  const user = useCurrentUser();
  const { state, dispatch, toast } = useStore();
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [endsAt, setEndsAt] = useState(() => defaultEnd(defaultStart()));
  const [purpose, setPurpose] = useState("");
  const [participantCount, setParticipantCount] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const room = state.rooms.find((r) => r.id === roomId);

  const conflicts: ConflictInfo[] = useMemo(() => {
    if (!startsAt || !endsAt) return [];
    try {
      return findConflicts(
        { roomId, startsAt, endsAt },
        state.academicSchedules,
        state.bookings,
        {
          labelForAcademic: (s) => {
            const course = state.courses.find((c) => c.id === s.courseId);
            return course ? `Jadwal ${course.name}` : "Jadwal akademik";
          },
        },
      );
    } catch {
      return [];
    }
  }, [roomId, startsAt, endsAt, state.academicSchedules, state.bookings, state.courses]);

  const hardConflicts = conflicts.filter(
    (c) => c.kind === "ACADEMIC" || c.kind === "APPROVED_BOOKING",
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;

    const draft = {
      roomId,
      purpose,
      participantCount: participantCount ? Number(participantCount) : undefined,
      startsAt,
      endsAt,
    };

    const validation = validateBookingDraft(draft, state.rooms);
    setErrors(validation.fieldErrors);

    if (!validation.valid) {
      setFormError("Periksa kembali isian yang ditandai.");
      return;
    }

    if (hardConflicts.length > 0) {
      setFormError(
        "Waktu yang dipilih bentrok dengan jadwal akademik atau booking yang sudah disetujui. Silakan pilih waktu lain.",
      );
      return;
    }

    setFormError(null);

    const id = `bk-${Date.now().toString(36)}`;
    const booking: RoomBooking = {
      id,
      roomId,
      requesterUserId: user.id,
      purpose: purpose.trim(),
      participantCount: draft.participantCount,
      startsAt,
      endsAt,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    const notification: AppNotification = {
      id: `n-${id}`,
      recipientUserId: user.id,
      type: "BOOKING_SUBMITTED",
      title: "Permohonan ruang terkirim",
      body: `Permohonan ${room?.name ?? "ruangan"} pada ${longDate(startsAt)} ${rangeLabel(startsAt, endsAt)} menunggu keputusan Tim CDC.`,
      targetPath: "/student/booking",
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: "CREATE_BOOKING", booking, notification });
    toast("success", "Permohonan terkirim. Status awal: Menunggu.");
    setSubmittedId(id);
    setPurpose("");
    setParticipantCount("");
  }

  if (!user) return null;

  if (submittedId) {
    return (
      <Card>
        <CardHeader title="Permohonan terkirim" icon={<CheckCircle2 size={15} aria-hidden />} />
        <div className="px-5 py-5">
          <p className="text-sm leading-relaxed text-ink-700">
            Permohonan untuk <strong>{room?.name}</strong> sudah masuk antrean Tim CDC dengan status{" "}
            <strong>Menunggu</strong>. Kamu akan menerima notifikasi saat diputuskan.
          </p>
          <dl className="mt-3 space-y-1 rounded-xl bg-ink-50 px-3 py-2.5 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Waktu</dt>
              <dd className="font-semibold text-ink-800">
                {longDate(startsAt)} · {rangeLabel(startsAt, endsAt)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Status</dt>
              <dd>
                <BookingStatusBadge status="PENDING" />
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setSubmittedId(null)}>
              Ajukan waktu lain
            </Button>
            <LinkButton to="/student/booking" size="sm">
              Lihat booking saya
            </LinkButton>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Ajukan penggunaan ruang"
        description="Permohonan masuk sebagai PENDING hingga diputuskan Tim CDC."
        icon={<CalendarPlus size={15} aria-hidden />}
        action={<DemoTag label="Aturan DEMO" />}
      />

      <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="booking-start">Mulai</Label>
            <TextInput
              id="booking-start"
              type="datetime-local"
              value={startsAt}
              invalid={Boolean(errors.startsAt)}
              onChange={(e) => {
                setStartsAt(e.target.value);
                setEndsAt((prev) => (prev && prev > e.target.value ? prev : defaultEnd(e.target.value)));
              }}
              required
            />
            <FieldError>{errors.startsAt}</FieldError>
          </div>
          <div>
            <Label htmlFor="booking-end">Selesai</Label>
            <TextInput
              id="booking-end"
              type="datetime-local"
              value={endsAt}
              invalid={Boolean(errors.endsAt)}
              onChange={(e) => setEndsAt(e.target.value)}
              required
            />
            <FieldError>{errors.endsAt}</FieldError>
          </div>
        </div>

        <div>
          <Label htmlFor="booking-participants" hint="(opsional)">
            Jumlah peserta
          </Label>
          <Select
            id="booking-participants"
            value={participantCount}
            invalid={Boolean(errors.participantCount)}
            onChange={(e) => setParticipantCount(e.target.value)}
          >
            <option value="">Belum ditentukan</option>
            {[2, 3, 4, 5, 6, 8, 10, 15, 20, 30].map((n) => (
              <option key={n} value={n}>
                {n} orang
              </option>
            ))}
          </Select>
          <FieldError>{errors.participantCount}</FieldError>
        </div>

        <div>
          <Label htmlFor="booking-purpose">Tujuan penggunaan</Label>
          <TextArea
            id="booking-purpose"
            value={purpose}
            maxLength={280}
            invalid={Boolean(errors.purpose)}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Contoh: diskusi kelompok tugas besar basis data, 5 orang."
            aria-describedby="purpose-help"
          />
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <FieldError>{errors.purpose}</FieldError>
            <span id="purpose-help" className="ml-auto text-ink-400">
              {purpose.length}/280
            </span>
          </div>
        </div>

        {conflicts.length > 0 ? (
          <div
            className={cx(
              "rounded-xl border px-3 py-2.5",
              hardConflicts.length > 0
                ? "border-danger-600/30 bg-danger-50"
                : "border-pending-600/30 bg-pending-50",
            )}
            role="status"
          >
            <p
              className={cx(
                "flex items-center gap-1.5 text-xs font-bold",
                hardConflicts.length > 0 ? "text-danger-600" : "text-pending-600",
              )}
            >
              {hardConflicts.length > 0 ? (
                <XCircle size={13} aria-hidden />
              ) : (
                <AlertTriangle size={13} aria-hidden />
              )}
              {hardConflicts.length > 0
                ? "Bentrok — permohonan tidak bisa diajukan pada waktu ini"
                : "Ada permohonan lain yang menunggu pada slot ini"}
            </p>
            <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-ink-600">
              {conflicts.map((c, i) => (
                <li key={`${c.kind}-${i}`}>
                  <span className="font-semibold">{rangeLabel(c.startsAt, c.endsAt)}</span> ·{" "}
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {formError ? (
          <p className="rounded-xl border border-danger-600/30 bg-danger-50 px-3 py-2 text-xs font-semibold text-danger-600" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex items-start gap-2 rounded-xl bg-ink-50 px-3 py-2.5">
          <Info size={14} className="mt-0.5 shrink-0 text-ink-400" aria-hidden />
          <p className="text-[11px] leading-relaxed text-ink-500">
            Nama asli dan NIM kamu hanya terlihat oleh Tim CDC saat memproses permohonan ini. Di
            area publik kamu tetap tampil sebagai pseudonym.
          </p>
        </div>

        <Button type="submit" className="w-full">
          Kirim permohonan
        </Button>
      </form>
    </Card>
  );
}

export function MyBookingsPage() {
  const user = useCurrentUser();
  const { state, dispatch, toast } = useStore();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const bookings = useMemo(() => {
    if (!user) return [];
    return state.bookings
      .filter((b) => b.requesterUserId === user.id)
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  }, [state.bookings, user]);

  if (!user) return null;

  function cancelBooking(booking: RoomBooking) {
    if (!user) return;
    // Aturan domain tetap divalidasi di sini, bukan hanya disembunyikan tombolnya.
    const validation = validateDecision(booking, {
      action: "CANCEL",
      actorRole: user.role,
      actorUserId: user.id,
    });
    if (!validation.ok) {
      toast("error", validation.message);
      return;
    }

    dispatch({
      type: "CANCEL_BOOKING",
      bookingId: booking.id,
      notification: {
        id: `n-${booking.id}-cancel`,
        recipientUserId: user.id,
        type: "BOOKING_CANCELLED",
        title: "Permohonan dibatalkan",
        body: `Permohonan ${roomNameFor(booking)} pada ${longDate(booking.startsAt)} dibatalkan.`,
        targetPath: "/student/booking",
        createdAt: new Date().toISOString(),
      },
    });
    toast("info", "Permohonan dibatalkan.");
    setConfirmId(null);
  }

  function roomNameFor(booking: RoomBooking): string {
    return state.rooms.find((r) => r.id === booking.roomId)?.name ?? "ruangan";
  }

  const pending = bookings.filter((b) => b.status === "PENDING").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">Booking</p>
          <h1 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">
            Booking saya
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {bookings.length} permohonan tercatat · {pending} menunggu keputusan.
          </p>
        </div>
        <LinkButton to="/student/rooms" size="md" variant="secondary">
          Cari ruangan lain
        </LinkButton>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarPlus size={20} aria-hidden />}
            title="Belum ada permohonan ruang"
            description="Mulai dari daftar ruang, pilih ruangan yang cocok, lalu ajukan waktu penggunaan."
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {bookings.map((booking) => {
            const room = state.rooms.find((r) => r.id === booking.roomId);
            const floor = room ? state.floors.find((f) => f.id === room.floorId) : undefined;
            return (
              <Card as="li" key={booking.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-ink-900">
                      {room?.name ?? "Ruangan"}{" "}
                      <span className="text-xs font-medium text-ink-400">· {floor?.label}</span>
                    </h2>
                    <p className="mt-1 text-xs text-ink-500">
                      {longDate(booking.startsAt)} ·{" "}
                      <span className="font-mono">
                        {rangeLabel(booking.startsAt, booking.endsAt)}
                      </span>
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-ink-700">{booking.purpose}</p>

                {booking.status === "REJECTED" ? (
                  <div className="mt-3 rounded-xl border border-danger-600/30 bg-danger-50 px-3 py-2.5">
                    <p className="text-[11px] font-bold text-danger-600">Alasan penolakan</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-700">
                      {booking.rejectionReason?.trim() || "Alasan tidak tercatat."}
                    </p>
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3 text-[11px] text-ink-400">
                  <span className="font-mono">{booking.id}</span>
                  {booking.participantCount ? (
                    <Badge tone="neutral">{booking.participantCount} peserta</Badge>
                  ) : null}

                  {booking.status === "PENDING" || booking.status === "APPROVED" ? (
                    <span className="ml-auto">
                      {confirmId === booking.id ? (
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold text-ink-600">
                            Batalkan permohonan ini?
                          </span>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => cancelBooking(booking)}
                          >
                            Ya, batalkan
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                            Tidak
                          </Button>
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmId(booking.id)}
                        >
                          Batalkan permohonan
                        </Button>
                      )}
                    </span>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}