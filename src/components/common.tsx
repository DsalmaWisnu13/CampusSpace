import type { ReactNode } from "react";
import { CircleDot } from "lucide-react";
import type { BookingStatus } from "../domain/types";
import { Badge, Card, cx, type BadgeTone } from "./ui";

/** Status selalu punya label teks, bukan hanya warna. */
const STATUS_MAP: Record<BookingStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Menunggu", tone: "warning" },
  APPROVED: { label: "Disetujui", tone: "success" },
  REJECTED: { label: "Ditolak", tone: "danger" },
  CANCELLED: { label: "Dibatalkan", tone: "neutral" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const meta = STATUS_MAP[status];
  return (
    <Badge tone={meta.tone}>
      <CircleDot size={9} aria-hidden />
      {meta.label}
    </Badge>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Label DEMO untuk data simulasi (wajib menurut brief). */
export function DemoTag({ label = "DEMO" }: { label?: string }) {
  return (
    <span className="demo-ribbon" title="Data simulasi, bukan data akademik resmi">
      {label}
    </span>
  );
}

export function InlineNote({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: ReactNode;
  tone?: "info" | "warning";
}) {
  return (
    <Card
      className={cx(
        "px-4 py-3",
        tone === "warning" ? "border-pending-600/25 bg-pending-50" : "border-brand-200 bg-brand-50",
      )}
    >
      <p
        className={cx(
          "text-xs font-bold",
          tone === "warning" ? "text-pending-600" : "text-brand-700",
        )}
      >
        {title}
      </p>
      <p
        className={cx(
          "mt-1 text-xs leading-relaxed",
          tone === "warning" ? "text-pending-600/90" : "text-brand-800/80",
        )}
      >
        {children}
      </p>
    </Card>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
        {icon ? <span className="text-brand-400">{icon}</span> : null}
      </div>
      <p className="mt-1.5 text-2xl font-extrabold leading-none tracking-tight text-ink-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] leading-relaxed text-ink-400">{hint}</p> : null}
    </div>
  );
}