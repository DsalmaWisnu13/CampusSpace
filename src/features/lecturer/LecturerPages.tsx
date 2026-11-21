import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  CheckCheck,
  ClipboardList,
  EyeOff,
  FileText,
  Link2,
  MapPin,
  MapPinOff,
  MessagesSquare,
  Presentation,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import { DemoTag, InlineNote, PageHeader, StatTile } from "../../components/common";
import { FloorPlanImage, RoomPhoto } from "../../components/FloorPlan";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  LinkButton,
  cx,
} from "../../components/ui";
import type { AppNotification, ResourceType, TopicAcknowledgement } from "../../domain/types";
import { isSameDay, longDate, relativeTime, shortDate, timeOf } from "../../lib/datetime";
import { useCurrentUser, useStore } from "../../store/AppStore";
import {
  useDiscussions,
  useLecturerClasses,
  useNotifications,
  useResources,
  useTopicInsights,
} from "../../store/selectors";

export function LecturerHomePage() {
  const user = useCurrentUser();
  const classes = useLecturerClasses(user?.id ?? null);
  const insights = useTopicInsights(user?.id ?? null);
  const notifications = useNotifications(user?.id ?? null);

  if (!user) return null;

  const today = new Date();
  const todayClasses = classes.filter((c) => isSameDay(c.schedule.startsAt, today));
  const nextClass = [...classes]
    .filter((c) => new Date(c.schedule.startsAt).getTime() >= today.getTime())
    .sort((a, b) => new Date(a.schedule.startsAt).getTime() - new Date(b.schedule.startsAt).getTime())[0];
  const topInsights = insights.slice(0, 4);

  return (
    <div>
      <div className="mb-5 rounded-2xl border border-brand-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
              Ruang dosen
            </p>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">
              {user.fullName}
            </h1>
            <p className="mt-1 text-xs text-ink-500">{user.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              <ShieldCheck size={10} aria-hidden /> Read-only diskusi
            </Badge>
            <DemoTag label="Data DEMO" />
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Kelas hari ini"
          value={todayClasses.length}
          hint={longDate(today)}
          icon={<CalendarClock size={15} aria-hidden />}
        />
        <StatTile
          label="Total kelas"
          value={classes.length}
          hint="Pada data demo"
          icon={<BookOpen size={15} aria-hidden />}
        />
        <StatTile
          label="Topik aktif"
          value={insights.length}
          hint="Agregat anonim"
          icon={<Sparkles size={15} aria-hidden />}
        />
        <StatTile
          label="Acknowledged"
          value={insights.filter((i) => i.acknowledged).length}
          hint="Akan dijelaskan"
          icon={<Check size={15} aria-hidden />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Jadwal mengajar hari ini"
              description={longDate(today)}
              icon={<CalendarClock size={15} aria-hidden />}
              action={
                <Link
                  to="/lecturer/jadwal"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800"
                >
                  Semua jadwal <ArrowRight size={12} aria-hidden />
                </Link>
              }
            />
            {todayClasses.length === 0 ? (
              <EmptyState
                icon={<CalendarClock size={20} aria-hidden />}
                title="Jadwal belum tersedia"
                description="Tidak ada kelas terjadwal hari ini pada data demo. Jadwal resmi belum terhubung ke API akademik."
                action={
                  nextClass ? (
                    <p className="text-[11px] text-ink-500">
                      Kelas berikutnya: {shortDate(nextClass.schedule.startsAt)} ·{" "}
                      {nextClass.courseName}
                    </p>
                  ) : undefined
                }
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {todayClasses.map((item) => (
                  <TodayClassRow key={item.schedule.id} item={item} />
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Insight topik mahasiswa"
              description="Agregat anonim: tanpa nama, NIM, email, atau isi balasan."
              icon={<Sparkles size={15} aria-hidden />}
              action={
                <Link
                  to="/lecturer/insight"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800"
                >
                  Detail <ArrowRight size={12} aria-hidden />
                </Link>
              }
            />
            {topInsights.length === 0 ? (
              <EmptyState
                icon={<MessagesSquare size={18} aria-hidden />}
                title="Belum ada topik"
                description="Belum ada diskusi mahasiswa pada kelas yang kamu ampu."
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {topInsights.map((insight) => (
                  <li key={`${insight.courseId}-${insight.topicKey}`} className="px-4 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-ink-800">{insight.label}</p>
                        <p className="mt-0.5 text-[11px] text-ink-500">
                          {insight.courseName} · Pertemuan {insight.meetingNumber}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] font-bold text-brand-700">
                          {insight.postCount} diskusi
                        </p>
                        <p className="text-[10px] text-ink-400">{insight.replyCount} balasan</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {nextClass ? (
            <Card>
              <CardHeader
                title="Kelas berikutnya"
                description="Lokasi dan waktu mengajar"
                icon={<MapPin size={15} aria-hidden />}
              />
              <div className="px-4 py-3">
                <p className="text-sm font-bold text-ink-900">{nextClass.courseName}</p>
                <p className="mt-0.5 text-[11px] text-ink-500">
                  {longDate(nextClass.schedule.startsAt)} ·{" "}
                  {timeOf(nextClass.schedule.startsAt)}–{timeOf(nextClass.schedule.endsAt)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone="brand">
                    <MapPin size={9} aria-hidden /> {nextClass.room.name}
                  </Badge>
                  <Badge tone="neutral">{nextClass.floor.label}</Badge>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
                  {nextClass.meetingTopic ?? "Topik pertemuan belum tersedia."}
                </p>
                <div className="mt-3">
                  <LinkButton to="/lecturer/jadwal" size="sm" variant="secondary" className="w-full">
                    Lihat jadwal & lokasi
                  </LinkButton>
                </div>
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Notifikasi" icon={<CheckCheck size={15} aria-hidden />} />
            {notifications.length === 0 ? (
              <EmptyState
                icon={<CheckCheck size={18} aria-hidden />}
                title="Belum ada notifikasi"
                description="Perubahan jadwal dan acknowledgement akan muncul di sini."
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {notifications.slice(0, 4).map((n) => (
                  <li key={n.id} className="px-4 py-2.5">
                    <p className={cx("text-[11px] font-bold", n.readAt ? "text-ink-600" : "text-ink-900")}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-ink-500">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-ink-400">{relativeTime(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <InlineNote title="Batas akses dosen" tone="warning">
            Kamu tidak dapat membuat postingan atau balasan. Data yang ditampilkan adalah agregat
            anonim — tidak ada identifier mahasiswa yang dikirim ke tampilan ini.
          </InlineNote>
        </div>
      </div>
    </div>
  );
}

function TodayClassRow({ item }: { item: ReturnType<typeof useLecturerClasses>[number] }) {
  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-ink-900">{item.courseName}</p>
          <p className="mt-0.5 text-[11px] text-ink-500">
            {item.courseCode ? `${item.courseCode} · ` : ""}
            Pertemuan {item.schedule.meetingId ?? "—"}
          </p>
        </div>
        <span className="shrink-0 font-mono text-[11px] font-semibold text-ink-700">
          {timeOf(item.schedule.startsAt)}–{timeOf(item.schedule.endsAt)}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-600">
        {item.meetingTopic ?? "Topik belum tersedia."}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone="brand">
          <MapPin size={9} aria-hidden /> {item.room.name}
        </Badge>
        <Badge tone="neutral">{item.floor.label}</Badge>
        {item.canHighlightOnMap ? (
          <Badge tone="success">Lokasi terverifikasi</Badge>
        ) : (
          <Badge tone="warning">
            <MapPinOff size={9} aria-hidden /> Tanpa highlight denah
          </Badge>
        )}
      </div>
    </li>
  );
}

/* ------------------------- Teaching schedule page ------------------------- */

export function LecturerSchedulePage() {
  const user = useCurrentUser();
  const classes = useLecturerClasses(user?.id ?? null);
  const { state } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!user) return null;

  const selected = classes.find((c) => c.schedule.id === selectedId) ?? classes[0];
  const upcoming = classes.filter((c) => new Date(c.schedule.startsAt).getTime() >= Date.now());
  const past = classes.filter((c) => new Date(c.schedule.startsAt).getTime() < Date.now());

  return (
    <div>
      <PageHeader
        eyebrow="Dosen · Jadwal"
        title="Jadwal mengajar"
        description="Waktu, kelas, dan lokasi. Highlight denah hanya muncul jika mapping ruang sudah diverifikasi."
        actions={<DemoTag label="Jadwal DEMO" />}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Kelas mendatang"
              description={`${upcoming.length} kelas`}
              icon={<CalendarClock size={15} aria-hidden />}
            />
            {upcoming.length === 0 ? (
              <EmptyState
                icon={<CalendarClock size={18} aria-hidden />}
                title="Jadwal belum tersedia"
                description="Tidak ada kelas mendatang pada data demo."
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {upcoming.map((item) => (
                  <li key={item.schedule.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.schedule.id)}
                      aria-pressed={selected?.schedule.id === item.schedule.id}
                      className={cx(
                        "w-full px-4 py-3 text-left transition-colors",
                        selected?.schedule.id === item.schedule.id
                          ? "bg-brand-50"
                          : "hover:bg-ink-50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-ink-900">{item.courseName}</p>
                          <p className="mt-0.5 text-[11px] text-ink-500">
                            {shortDate(item.schedule.startsAt)} · {item.room.name}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] font-semibold text-ink-700">
                          {timeOf(item.schedule.startsAt)}–{timeOf(item.schedule.endsAt)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {past.length > 0 ? (
            <Card>
              <CardHeader title="Kelas sebelumnya" description="Arsip minggu ini" icon={<ClipboardList size={15} aria-hidden />} />
              <ul className="divide-y divide-ink-100">
                {past.map((item) => (
                  <li key={item.schedule.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-ink-700">{item.courseName}</p>
                      <p className="text-[10px] text-ink-400">
                        {shortDate(item.schedule.startsAt)} · {item.room.name}
                      </p>
                    </div>
                    <Badge tone="neutral">Selesai</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          {selected ? (
            <Card>
              <CardHeader
                title="Detail kelas"
                description={`${selected.courseName} · ${selected.floor.label}`}
                icon={<MapPin size={15} aria-hidden />}
                action={
                  selected.canHighlightOnMap ? (
                    <Badge tone="success">Mapping terverifikasi</Badge>
                  ) : (
                    <Badge tone="warning">Mapping belum ada</Badge>
                  )
                }
              />
              <div className="space-y-3 px-4 py-3">
                <dl className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <dt className="font-bold uppercase tracking-wide text-ink-400">Waktu</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-ink-800">
                      {timeOf(selected.schedule.startsAt)}–{timeOf(selected.schedule.endsAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-wide text-ink-400">Tanggal</dt>
                    <dd className="mt-0.5 font-semibold text-ink-800">
                      {shortDate(selected.schedule.startsAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-wide text-ink-400">Ruangan</dt>
                    <dd className="mt-0.5 font-semibold text-ink-800">{selected.room.name}</dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-wide text-ink-400">Lantai</dt>
                    <dd className="mt-0.5 font-semibold text-ink-800">{selected.floor.label}</dd>
                  </div>
                </dl>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Topik</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-700">
                    {selected.meetingTopic ?? "Topik belum tersedia."}
                  </p>
                </div>

                {selected.canHighlightOnMap ? (
                  <div className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5">
                    <p className="text-[11px] leading-relaxed text-brand-800">
                      Mapping terverifikasi: ruangan dapat di-highlight pada denah.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-pending-600/25 bg-pending-50 px-3 py-2.5">
                    <p className="flex items-center gap-1 text-[11px] font-bold text-pending-600">
                      <MapPinOff size={12} aria-hidden /> Denah tidak di-highlight
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-pending-600/90">
                      Room ID dan koordinat belum diverifikasi, jadi sistem tidak menebak lokasi.
                      Gunakan nama ruangan dan lantai di atas.
                    </p>
                  </div>
                )}

                <div className="overflow-hidden rounded-xl border border-ink-200">
                  <FloorPlanImage
                    src={selected.floor.floorPlanAsset}
                    alt={`Denah ${selected.floor.label} tanpa highlight`}
                    className="max-w-md"
                  />
                </div>
                <p className="text-[10px] leading-relaxed text-ink-400">
                  Denah ditampilkan sebagaimana aslinya. Penanda ruang akan ditambahkan setelah
                  koordinat ruang diverifikasi.
                </p>
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon={<CalendarClock size={20} aria-hidden />}
                title="Pilih kelas"
                description="Pilih salah satu kelas untuk melihat lokasi dan topik."
              />
            </Card>
          )}

          {selected ? <ClassroomPhoto roomId={selected.room.id} /> : null}
          {selected ? (
            <Card className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
                Catatan data ruang
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                {state.rooms.find((r) => r.id === selected.room.id)?.dataNote}
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ClassroomPhoto({ roomId }: { roomId: string }) {
  const { state } = useStore();
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room) return null;
  return (
    <Card>
      <CardHeader title="Foto ruangan" icon={<BookOpen size={15} aria-hidden />} />
      <div className="p-4">
        <RoomPhoto room={room} className="min-h-32" />
      </div>
    </Card>
  );
}

/* ---------------------------- Insight page ---------------------------- */

export function LecturerInsightPage() {
  const user = useCurrentUser();
  const insights = useTopicInsights(user?.id ?? null);
  const { state, dispatch, toast } = useStore();
  const discussions = useDiscussions();
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  if (!user) return null;

  function acknowledge(insight: (typeof insights)[number]) {
    if (!user) return;
    const key = `${insight.courseId}-${insight.topicKey}`;
    const ack: TopicAcknowledgement = {
      id: `ack-${Date.now().toString(36)}`,
      lecturerId: user.id,
      courseMeetingId: insight.meetingId,
      topicKey: insight.topicKey,
      status: "WILL_EXPLAIN",
      createdAt: new Date().toISOString(),
    };
    const notification: AppNotification = {
      id: `n-${ack.id}`,
      recipientUserId: user.id,
      type: "INSIGHT_ACKNOWLEDGED",
      title: "Topik ditandai akan dijelaskan",
      body: `“${insight.label}” pada ${insight.courseName} akan kamu jelaskan di kelas.`,
      targetPath: "/lecturer/insight",
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "ACKNOWLEDGE_TOPIC", acknowledgement: ack, notification });
    setAcknowledged((prev) => new Set(prev).add(key));
    toast("success", "Topik ditandai akan dijelaskan.");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Dosen · Insight"
        title="Topik populer mahasiswa"
        description="Agregat anonim per mata kuliah dan pertemuan. Tidak ada nama, NIM, email, atau isi balasan."
        actions={<DemoTag label="Agregat DEMO" />}
      />

      <InlineNote title="Cara membaca data ini">
        Angka dihitung dari jumlah diskusi dan balasan yang menyebut topik tersebut. Data ini tidak
        dapat ditelusuri kembali ke mahasiswa tertentu.
      </InlineNote>

      <div className="mt-4 space-y-3">
        {insights.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Sparkles size={20} aria-hidden />}
              title="Belum ada insight"
              description="Belum ada diskusi pada kelas yang kamu ampu di data demo."
            />
          </Card>
        ) : (
          insights.map((insight) => {
            const key = `${insight.courseId}-${insight.topicKey}`;
            const isAck = insight.acknowledged || acknowledged.has(key);
            return (
              <Card key={key} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="brand">{insight.courseName}</Badge>
                      <Badge tone="neutral">Pertemuan {insight.meetingNumber}</Badge>
                    </div>
                    <h2 className="mt-2 text-sm font-bold text-ink-900">{insight.label}</h2>
                    <p className="mt-0.5 text-[11px] text-ink-500">
                      Aktivitas terakhir {relativeTime(insight.lastActivityAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-center">
                    <div>
                      <p className="text-lg font-extrabold leading-none text-ink-900">
                        {insight.postCount}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                        Diskusi
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-extrabold leading-none text-ink-900">
                        {insight.replyCount}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                        Balasan
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-3">
                  <p className="flex items-center gap-1 text-[10px] text-ink-400">
                    <EyeOff size={11} aria-hidden /> Tanpa identifier mahasiswa
                  </p>
                  {isAck ? (
                    <Badge tone="success">
                      <Check size={10} aria-hidden /> Akan dijelaskan
                    </Badge>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => acknowledge(insight)}>
                      <Check size={13} aria-hidden /> Tandai akan dijelaskan
                    </Button>
                  )}
                </div>

                <ArchivePreview
                  courseId={insight.courseId}
                  meetingId={insight.meetingId}
                  discussions={discussions}
                />
              </Card>
            );
          })
        )}
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-ink-400">
        {state.posts.length} diskusi pada dataset DEMO. Insight dihitung lokal di browser.
      </p>
    </div>
  );
}

function ArchivePreview({
  courseId,
  meetingId,
  discussions,
}: {
  courseId: string;
  meetingId: string;
  discussions: ReturnType<typeof useDiscussions>;
}) {
  const archive = discussions.filter((d) => d.courseId === courseId && d.meetingId === meetingId);
  const { state } = useStore();
  const resources = useResources(courseId, meetingId);

  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800"
      >
        <MessagesSquare size={12} aria-hidden /> {open ? "Sembunyikan" : "Lihat"} arsip pertemuan (
        {archive.length})
      </button>

      {open ? (
        <div className="mt-2 space-y-2">
          {archive.length === 0 ? (
            <p className="rounded-lg bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
              Belum ada diskusi pada pertemuan ini.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {archive.map((d) => (
                <li key={d.id} className="rounded-lg bg-ink-50 px-3 py-2">
                  <p className="text-[11px] font-bold text-ink-800">
                    {d.title ?? d.body.slice(0, 50)}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-ink-500">
                    {d.body}
                  </p>
                  <p className="mt-1 text-[10px] text-ink-400">
                    {d.author.pseudonym} · {d.replyCount} balasan · {relativeTime(d.lastActivityAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {resources.length > 0 ? (
            <div className="pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                Sumber belajar tersedia
              </p>
              <ul className="mt-1 space-y-1">
                {resources.map((r) => {
                  const Icon = RESOURCE_ICON[r.type];
                  return (
                    <li key={r.id} className="flex items-center gap-1.5 text-[11px] text-ink-600">
                      <Icon size={11} className="text-brand-500" aria-hidden />
                      {r.title}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <p className="text-[10px] leading-relaxed text-ink-400">
            Arsip menampilkan pseudonym karena diskusi bersifat publik di dalam kelas.{" "}
            {state.posts.length} postingan total pada demo.
          </p>
        </div>
      ) : null}
    </div>
  );
}

const RESOURCE_ICON: Record<ResourceType, typeof FileText> = {
  PDF: FileText,
  SLIDE: Presentation,
  VIDEO: Video,
  LINK: Link2,
  OTHER: FileText,
};