import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CircleSlash,
  Clock3,
  List,
  Map as MapIcon,
  Search,
} from "lucide-react";
import { FloorPlan, RoomPhoto } from "../../components/FloorPlan";
import { DemoTag, InlineNote, PageHeader } from "../../components/common";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  LinkButton,
  Select,
  TextInput,
  cx,
} from "../../components/ui";
import type { BookingStatus, Floor, Room } from "../../domain/types";
import { isSameDay, rangeLabel, shortDate } from "../../lib/datetime";
import { useStore } from "../../store/AppStore";
import { BookingForm } from "./BookingPages";

type ViewMode = "list" | "map";

const LEARN_STATUS: Record<BookingStatus | "FREE", { label: string; tone: "success" | "warning" | "neutral" }> = {
  FREE: { label: "Tidak ada jadwal tercatat", tone: "neutral" },
  PENDING: { label: "Ada permohonan menunggu", tone: "warning" },
  APPROVED: { label: "Dipakai (disetujui)", tone: "success" },
  REJECTED: { label: "Slot bebas", tone: "neutral" },
  CANCELLED: { label: "Slot bebas", tone: "neutral" },
};

export function RoomsPage() {
  const { state } = useStore();
  const [view, setView] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [floorId, setFloorId] = useState<string>("all");

  const floors = state.floors;
  const filteredRooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.rooms.filter((room) => {
      const matchesFloor = floorId === "all" || room.floorId === floorId;
      const matchesQuery = !q || room.name.toLowerCase().includes(q);
      return matchesFloor && matchesQuery;
    });
  }, [state.rooms, floorId, query]);

  return (
    <div>
      <PageHeader
        eyebrow="Ruang"
        title="Cari ruangan"
        description="Telusuri ruangan lewat daftar atau denah asli. Foto, kapasitas, dan fasilitas hanya ditampilkan bila datanya tersedia."
        actions={<DemoTag label="Data ruang DEMO" />}
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              aria-hidden
            />
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama ruang, mis. Lab Robot"
              aria-label="Cari nama ruangan"
              className="pl-9"
            />
          </div>

          <Select
            value={floorId}
            onChange={(e) => setFloorId(e.target.value)}
            aria-label="Filter lantai"
            className="sm:w-48"
          >
            <option value="all">Semua lantai</option>
            {floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </Select>

          <div
            className="flex rounded-xl border border-ink-200 p-0.5"
            role="group"
            aria-label="Mode tampilan ruang"
          >
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold",
                view === "list" ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-100",
              )}
            >
              <List size={14} aria-hidden /> List
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              aria-pressed={view === "map"}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold",
                view === "map" ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-100",
              )}
            >
              <MapIcon size={14} aria-hidden /> Map
            </button>
          </div>
        </div>
      </Card>

      {view === "list" ? (
        <RoomList rooms={filteredRooms} floorById={new Map(floors.map((f) => [f.id, f]))} />
      ) : (
        <MapView
          floors={floorId === "all" ? floors : floors.filter((f) => f.id === floorId)}
          rooms={filteredRooms}
        />
      )}
    </div>
  );
}

function RoomList({
  rooms,
  floorById,
}: {
  rooms: Room[];
  floorById: Map<string, Floor>;
}) {
  if (rooms.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Search size={20} aria-hidden />}
          title="Tidak ada ruangan yang cocok"
          description="Coba kata kunci lain atau tampilkan semua lantai. Pencarian kosong mengembalikan seluruh daftar ruang."
          action={
            <LinkButton to="/student/rooms" size="sm" variant="secondary">
              Reset filter
            </LinkButton>
          }
        />
      </Card>
    );
  }

  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rooms.map((room) => {
        const floor = floorById.get(room.floorId);
        return (
          <Card as="li" key={room.id} className="flex flex-col overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-ink-900">{room.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-ink-500">
                    <Building2 size={12} aria-hidden />
                    {floor?.label ?? "Lantai ?"}
                    <span className="text-ink-300">·</span>
                    <span className="font-mono text-[10px] text-ink-400">{room.id}</span>
                  </p>
                </div>
                <Badge tone="neutral">{roomKindLabel(room)}</Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-ink-50 px-2.5 py-2">
                  <p className="font-semibold text-ink-500">Kapasitas</p>
                  <p className="mt-0.5 font-bold text-ink-800">
                    {room.capacity ? `${room.capacity} orang` : "Belum tersedia"}
                  </p>
                </div>
                <div className="rounded-lg bg-ink-50 px-2.5 py-2">
                  <p className="font-semibold text-ink-500">Fasilitas</p>
                  <p className="mt-0.5 font-bold text-ink-800">
                    {room.facilities?.length ? `${room.facilities.length} tercatat` : "Belum tersedia"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink-100 px-4 py-3">
              <Link
                to={`/student/rooms/${room.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800"
              >
                Lihat detail <ArrowRight size={13} aria-hidden />
              </Link>
              <LinkButton to={`/student/rooms/${room.id}#ajukan`} size="sm" variant="secondary">
                Ajukan
              </LinkButton>
            </div>
          </Card>
        );
      })}
    </ul>
  );
}

function MapView({ floors, rooms }: { floors: Floor[]; rooms: Room[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
      <div className="space-y-4">
        {floors.map((floor) => (
          <FloorPlan
            key={floor.id}
            floor={floor}
            rooms={rooms.filter((r) => r.floorId === floor.id)}
          />
        ))}
      </div>

      <div className="space-y-4">
        <InlineNote title="Kenapa denah belum punya hotspot">
          Tim belum menerima Room ID resmi dan koordinat ruang. Menampilkan penanda sekarang berarti
          menebak lokasi, jadi CampusSpace memilih menampilkan denah apa adanya. Mode List tetap
          lengkap dan bisa dipakai untuk mengajukan ruang.
        </InlineNote>

        <Card>
          <CardHeader
            title="Daftar ruang pada tampilan ini"
            description={`${rooms.length} ruang pada lantai terpilih`}
            icon={<List size={15} aria-hidden />}
          />
          {rooms.length === 0 ? (
            <EmptyState
              icon={<CircleSlash size={18} aria-hidden />}
              title="Tidak ada ruang"
              description="Filter lantai atau kata kunci saat ini tidak menemukan ruang."
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {rooms.map((room) => (
                <li key={room.id}>
                  <Link
                    to={`/student/rooms/${room.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-brand-50/50"
                  >
                    <span className="truncate text-xs font-semibold text-ink-800">{room.name}</span>
                    <span className="shrink-0 text-[10px] font-mono text-ink-400">{room.id}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export function RoomDetailPage({ roomId }: { roomId: string }) {
  const { state } = useStore();
  const room = state.rooms.find((r) => r.id === roomId);
  const floor = room ? state.floors.find((f) => f.id === room.floorId) : undefined;

  if (!room) {
    return (
      <Card>
        <EmptyState
          icon={<CircleSlash size={20} aria-hidden />}
          title="Ruangan tidak ditemukan"
          description="Ruangan mungkin tidak ada pada data demo ini. Kembali ke daftar ruang untuk memilih yang tersedia."
          action={
            <LinkButton to="/student/rooms" size="sm">
              Kembali ke daftar ruang
            </LinkButton>
          }
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <div>
          <Link
            to="/student/rooms"
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-brand-700"
          >
            ← Semua ruang
          </Link>
          <PageHeader
            title={room.name}
            description={
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <Building2 size={13} aria-hidden /> {floor?.label ?? "Lantai ?"}
                </span>
                <span className="text-ink-300">·</span>
                <span className="font-mono text-xs">{room.id}</span>
                <Badge tone="neutral">{roomKindLabel(room)}</Badge>
              </span>
            }
          />
        </div>

        <Card className="overflow-hidden">
          <CardHeader
            title="Foto ruangan"
            description="CampusSpace tidak memakai foto stok sebagai pengganti."
            icon={<Building2 size={15} aria-hidden />}
          />
          <div className="p-4">
            <RoomPhoto room={room} className="min-h-48" />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Detail ruang"
            description="Field tanpa data ditampilkan sebagai “belum tersedia”, bukan ditebak."
          />
          <dl className="divide-y divide-ink-100 text-sm">
            <DetailRow label="Lokasi">
              {floor ? `${floor.label} — Gedung Utama` : "Belum tersedia"}
            </DetailRow>
            <DetailRow label="Kapasitas">
              {room.capacity ? `${room.capacity} orang` : "Belum tersedia"}
            </DetailRow>
            <DetailRow label="Fasilitas">
              {room.facilities?.length ? room.facilities.join(", ") : "Belum tersedia"}
            </DetailRow>
            <DetailRow label="Status pemetaan denah">
              {room.mapRegion && floor?.mappingStatus === "VERIFIED"
                ? "Terverifikasi"
                : "Belum terverifikasi — tanpa highlight denah"}
            </DetailRow>
          </dl>
          {room.dataNote ? (
            <p className="border-t border-ink-100 px-5 py-3 text-[11px] leading-relaxed text-ink-500">
              {room.dataNote}
            </p>
          ) : null}
        </Card>

        {floor ? <FloorPlan floor={floor} rooms={state.rooms.filter((r) => r.floorId === floor.id)} /> : null}
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <RoomScheduleCard roomId={room.id} />
        <div id="ajukan" className="scroll-mt-24">
          <BookingForm roomId={room.id} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 px-5 py-2.5">
      <dt className="text-xs font-semibold text-ink-500">{label}</dt>
      <dd className="text-xs leading-relaxed text-ink-800">{children}</dd>
    </div>
  );
}

function RoomScheduleCard({ roomId }: { roomId: string }) {
  const { state } = useStore();
  const today = useMemo(() => new Date(), []);

  const entries = useMemo(() => {
    const academic = state.academicSchedules.filter(
      (s) => s.roomId === roomId && isSameDay(s.startsAt, today),
    );
    const bookings = state.bookings.filter((b) => b.roomId === roomId && isSameDay(b.startsAt, today));
    return { academic, bookings };
  }, [state.academicSchedules, state.bookings, roomId, today]);

  const currentStatus: BookingStatus | "FREE" = entries.bookings.some((b) => b.status === "APPROVED")
    ? "APPROVED"
    : entries.bookings.some((b) => b.status === "PENDING")
      ? "PENDING"
      : "FREE";

  return (
    <Card>
      <CardHeader
        title="Jadwal hari ini"
        description={shortDate(today)}
        icon={<CalendarClock size={15} aria-hidden />}
        action={<Badge tone={LEARN_STATUS[currentStatus].tone}>{LEARN_STATUS[currentStatus].label}</Badge>}
      />
      {entries.academic.length === 0 && entries.bookings.length === 0 ? (
        <EmptyState
          icon={<Clock3 size={18} aria-hidden />}
          title="Jadwal belum tersedia"
          description="Tidak ada jadwal akademik maupun permohonan pada tanggal ini. Ketersediaan tetap perlu dikonfirmasi Tim CDC."
        />
      ) : (
        <ul className="divide-y divide-ink-100">
          {entries.academic.map((s) => {
            const course = state.courses.find((c) => c.id === s.courseId);
            return (
              <li key={s.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-ink-800">
                    {course?.name ?? "Jadwal akademik"}
                  </p>
                  <p className="text-[11px] text-ink-500">Jadwal akademik · tidak dapat diubah</p>
                </div>
                <span className="shrink-0 font-mono text-[11px] font-semibold text-ink-600">
                  {rangeLabel(s.startsAt, s.endsAt)}
                </span>
              </li>
            );
          })}
          {entries.bookings
            .filter((b) => b.status === "APPROVED" || b.status === "PENDING")
            .map((b) => (
              <li key={b.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-ink-800">{b.purpose}</p>
                  <p className="text-[11px] text-ink-500">
                    Booking · {b.status === "APPROVED" ? "disetujui" : "menunggu"}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[11px] font-semibold text-ink-600">
                  {rangeLabel(b.startsAt, b.endsAt)}
                </span>
              </li>
            ))}
        </ul>
      )}
      <p className="border-t border-ink-100 px-4 py-2.5 text-[10px] leading-relaxed text-ink-400">
        Jadwal ini adalah data DEMO, bukan jadwal akademik resmi.
      </p>
    </Card>
  );
}

export function roomKindLabel(room: Room): string {
  switch (room.kind) {
    case "CLASSROOM":
      return "Ruang kelas";
    case "LAB":
      return "Laboratorium";
    case "LIBRARY":
      return "Perpustakaan";
    case "ADMIN":
      return "Area administrasi";
    default:
      return "Ruang";
  }
}