import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import type { Role } from "../domain/types";
import { HOME_PATH } from "../domain/permissions";
import { useCurrentUser } from "../store/AppStore";
import { EmptyState, LinkButton } from "../components/ui";

/** Guard klien. Bukan pengganti otorisasi server-side di produksi. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <div className="card">
          <EmptyState
            icon={<ShieldAlert size={20} aria-hidden />}
            title="Kamu belum masuk"
            description="Pilih peran demo terlebih dahulu untuk membuka halaman ini. Autentikasi ini adalah mock, bukan SSO kampus."
            action={
              <LinkButton to="/" size="sm">
                Kembali ke pemilihan peran
              </LinkButton>
            }
          />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const user = useCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <div className="card">
          <EmptyState
            icon={<ShieldAlert size={20} aria-hidden />}
            title="Kamu belum masuk"
            description="Pilih peran demo terlebih dahulu."
            action={
              <LinkButton to="/" size="sm">
                Pilih peran
              </LinkButton>
            }
          />
        </div>
      </div>
    );
  }

  if (user.role !== role) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <div className="card">
          <EmptyState
            icon={<ShieldAlert size={20} aria-hidden />}
            title="Halaman ini bukan untuk peranmu"
            description={`Kamu masuk sebagai ${user.role}. Akses ditolak di sisi UI dan juga divalidasi pada lapisan domain.`}
            action={
              <LinkButton to={HOME_PATH[user.role]} size="sm">
                Ke beranda peran saya
              </LinkButton>
            }
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg py-16">
      <div className="card">
        <EmptyState
          icon={<ShieldAlert size={20} aria-hidden />}
          title="Halaman tidak ditemukan"
          description="Tautan mungkin sudah berubah. Kembali ke pemilihan peran untuk memulai alur demo."
          action={
            <LinkButton to="/" size="sm">
              Kembali ke beranda
            </LinkButton>
          }
        />
        <p className="pb-6 text-center text-xs text-ink-400">
          <Link to="/" className="font-semibold text-brand-600 hover:underline">
            Buka pemilihan peran
          </Link>
        </p>
      </div>
    </div>
  );
}