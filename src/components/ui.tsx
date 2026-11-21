import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "react-router-dom";

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/* ------------------------------- Button ------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm disabled:bg-brand-300",
  secondary:
    "border border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50 active:bg-brand-100 disabled:text-ink-300",
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-800 disabled:text-ink-300",
  danger:
    "bg-danger-600 text-white hover:bg-danger-600/90 active:bg-danger-600/80 shadow-sm disabled:opacity-50",
  success:
    "bg-available-600 text-white hover:bg-available-600/90 active:bg-available-600/80 shadow-sm disabled:opacity-50",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex select-none items-center justify-center rounded-xl font-semibold transition-colors",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface LinkButtonProps extends ComponentPropsWithoutRef<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cx(
        "inline-flex select-none items-center justify-center rounded-xl font-semibold transition-colors",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

/* -------------------------------- Badge ------------------------------- */

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-ink-100 text-ink-700 border-ink-200",
  brand: "bg-brand-100 text-brand-700 border-brand-200",
  success: "bg-available-50 text-available-600 border-available-600/25",
  warning: "bg-pending-50 text-pending-600 border-pending-600/25",
  danger: "bg-danger-50 text-danger-600 border-danger-600/25",
  info: "bg-info-50 text-info-600 border-info-600/25",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-5",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------- Card --------------------------------- */

export function Card({
  children,
  className,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside" | "li";
}) {
  return <As className={cx("card", className)}>{children}</As>;
}

export function CardHeader({
  title,
  description,
  action,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-ink-900">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{description}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ Feedback ------------------------------ */

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-1 text-xs font-medium text-danger-600" role="alert">
      {children}
    </p>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {icon ? (
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          {icon}
        </span>
      ) : null}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink-800">{title}</p>
        <p className="mx-auto max-w-sm text-xs leading-relaxed text-ink-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5 p-5" aria-hidden>
      <div className="skeleton-line w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cx("skeleton-line", i % 2 ? "w-11/12" : "w-full")} />
      ))}
    </div>
  );
}

/* ------------------------------- Inputs ------------------------------- */

const INPUT_BASE =
  "w-full rounded-xl border bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 transition-colors disabled:bg-ink-50 disabled:text-ink-400";

export function TextInput({
  invalid,
  className,
  ...props
}: ComponentPropsWithoutRef<"input"> & { invalid?: boolean }) {
  return (
    <input
      className={cx(
        INPUT_BASE,
        invalid ? "border-danger-600/40 focus:border-danger-600" : "border-ink-200 focus:border-brand-400",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...props
}: ComponentPropsWithoutRef<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      className={cx(
        INPUT_BASE,
        "min-h-24 resize-y leading-relaxed",
        invalid ? "border-danger-600/40 focus:border-danger-600" : "border-ink-200 focus:border-brand-400",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"select"> & { invalid?: boolean }) {
  return (
    <select
      className={cx(
        INPUT_BASE,
        "h-10 appearance-none bg-[length:16px] bg-[right_0.65rem_center] bg-no-repeat pr-9",
        invalid ? "border-danger-600/40" : "border-ink-200 focus:border-brand-400",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b748c'><path d='M5.5 7.5 10 12l4.5-4.5' stroke='%236b748c' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
      }}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({
  children,
  htmlFor,
  hint,
}: {
  children: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-ink-700">
      {children}
      {hint ? <span className="ml-1 font-normal text-ink-400">{hint}</span> : null}
    </label>
  );
}