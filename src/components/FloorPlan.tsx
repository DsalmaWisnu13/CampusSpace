import { useMemo, useState } from "react";
import { ImageOff, MapPinOff } from "lucide-react";
import type { Floor, Room } from "../domain/types";
import { Badge, Card, CardHeader, EmptyState, Select, cx } from "./ui";

/**
 * Gambar denah dengan state loading/gagal yang jujur.
 * Aset bisa hilang di lingkungan demo, jadi kegagalan muat tidak boleh
 * menghasilkan ikon gambar rusak tanpa penjelasan.
 */
export function FloorPlanImage({
  src,
  alt,
  className,
  unoptimizedNote,
}: {
  src?: string;
  alt: string;
  className?: string;
  unoptimizedNote?: string;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    src ? "loading" : "error",
  );

  if (!src || status === "error") {
    return (
      <div className="px-4 py-8">
        <EmptyState
          icon={<ImageOff size={20} aria-hidden />}
          title={src ? "Denah gagal dimuat" : "Aset denah tidak tersedia"}
          description={
            src
              ? "Berkas denah tidak dapat dibuka. Coba muat ulang halaman; gunakan List View bila masalah berlanjut."
              : "File denah lantai ini belum diunggah. Hubungi pengelola gedung untuk versi terbaru."
          }
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {status === "loading" ? (
        <p className="absolute inset-x-0 top-3 text-center text-[11px] font-semibold text-ink-400">
          Memuat denah…
        </p>
      ) : null}
      <img
        src={src}
        alt={alt}
        className={cx(
          "mx-auto block h-auto w-full object-contain transition-opacity",
          status === "loading" ? "opacity-0" : "opacity-100",
          className,
        )}
        loading="lazy"
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("error")}
      />
      {unoptimizedNote ? (
        <p className="px-3 py-2 text-[10px] leading-relaxed text-ink-400">{unoptimizedNote}</p>
      ) : null}
    </div>
  );
}

/**
 * Denah ditampilkan sebagai aset APA ADANYA.
 * Tidak ada overlay/hotspot karena Room ID + koordinat belum terverifikasi.
 */
export function FloorPlan({ floor, rooms }: { floor: Floor; rooms: Room[] }) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(rooms[0]?.id ?? null);
  const selected = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={`Denah ${floor.label}`}
        description="Gambar denah resmi kampus. Label ruang di bawah mengikuti legenda gambar."
        icon={<MapPinOff size={16} aria-hidden />}
        action={<Badge tone="warning">Belum terverifikasi</Badge>}
      />

      <div className="border-b border-ink-100 bg-pending-50 px-5 py-3">
        <p className="text-xs leading-relaxed text-pending-600">
          <strong className="font-bold">Catatan data:</strong> denah ini ditampilkan tanpa penanda
          ruang. Pemetaan Room ID ke koordinat denah belum tersedia, jadi CampusSpace tidak menebak
          posisi ruangan.
        </p>
      </div>

      <div className="subtle-grid bg-ink-50/40 p-4">
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
          <FloorPlanImage
            src={floor.floorPlanAsset}
            alt={`Denah ${floor.label} dari dokumen kampus`}
            className="max-w-3xl"
          />
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_1.1fr]">
        <div>
          <label
            htmlFor="room-picker"
            className="mb-1.5 block text-xs font-semibold text-ink-700"
          >
            Pilih ruangan untuk melihat detail
          </label>
          <Select
            id="room-picker"
            value={selectedRoomId ?? ""}
            onChange={(event) => setSelectedRoomId(event.target.value || null)}
          >
            <option value="">— Pilih ruangan —</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </Select>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
            Daftar ini adalah daftar nama pada legenda denah, bukan hasil pemetaan spasial.
          </p>
        </div>

        <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-4">
          {selected ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-ink-900">{selected.name}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="font-semibold text-ink-500">Kapasitas</dt>
                <dd className="text-ink-700">
                  {selected.capacity ? `${selected.capacity} orang` : "Belum tersedia"}
                </dd>
                <dt className="font-semibold text-ink-500">Fasilitas</dt>
                <dd className="text-ink-700">
                  {selected.facilities?.length ? selected.facilities.join(", ") : "Belum tersedia"}
                </dd>
                <dt className="font-semibold text-ink-500">Room ID</dt>
                <dd>
                  <code className="rounded bg-white px-1.5 py-0.5 text-[11px] text-ink-600">
                    {selected.id}
                  </code>{" "}
                  <span className="text-[11px] text-ink-400">(demo)</span>
                </dd>
              </dl>
              {selected.dataNote ? (
                <p className="text-[11px] leading-relaxed text-ink-500">{selected.dataNote}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-ink-500">Belum ada ruangan yang dipilih.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Foto ruang: sengaja belum ada aset, jadi tampilkan empty state jujur. */
export function RoomPhoto({ room, className }: { room: Room; className?: string }) {
  if (room.photoAsset) {
    return (
      <img
        src={room.photoAsset}
        alt={`Foto ${room.name}`}
        className={cx("w-full rounded-xl object-cover", className)}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 bg-ink-50 px-4 py-8 text-center",
        className,
      )}
    >
      <ImageOff size={22} className="text-ink-400" aria-hidden />
      <p className="text-xs font-semibold text-ink-600">Foto ruangan belum tersedia</p>
      <p className="max-w-[16rem] text-[11px] leading-relaxed text-ink-500">
        CampusSpace tidak memakai foto stok sebagai pengganti. Hubungi CDC untuk dokumentasi ruang.
      </p>
    </div>
  );
}