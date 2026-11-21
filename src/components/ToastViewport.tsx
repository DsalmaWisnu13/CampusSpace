import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useStore } from "../store/AppStore";
import { cx } from "./ui";

const TONE = {
  success: { icon: CheckCircle2, className: "border-available-600/30 bg-white text-available-600" },
  error: { icon: AlertCircle, className: "border-danger-600/30 bg-white text-danger-600" },
  info: { icon: Info, className: "border-brand-200 bg-white text-brand-700" },
} as const;

/** Toast via live region, auto-dismiss, bisa ditutup manual. */
export function ToastViewport() {
  const { state, dispatch } = useStore();
  const toast = state.toast;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => dispatch({ type: "DISMISS_TOAST" }), 4500);
    return () => window.clearTimeout(timer);
  }, [toast, dispatch]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      role="region"
      aria-label="Notifikasi aksi"
    >
      <div aria-live="polite" aria-atomic="true" className="w-full max-w-md">
        {toast ? (
          <div
            className={cx(
              "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg",
              TONE[toast.tone].className,
            )}
            data-testid="toast"
          >
            {(() => {
              const Icon = TONE[toast.tone].icon;
              return <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />;
            })()}
            <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
            <button
              type="button"
              onClick={() => dispatch({ type: "DISMISS_TOAST" })}
              className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              aria-label="Tutup notifikasi"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}