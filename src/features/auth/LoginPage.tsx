import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarCheck,
  GraduationCap,
  Info,
  Lock,
  MessagesSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import logo from "../../assets/campusespace-logo.svg";
import { demoAccounts } from "../../data/seed";
import { HOME_PATH, publicName } from "../../domain/permissions";
import type { Role } from "../../domain/types";
import { useStore } from "../../store/AppStore";
import { Badge, Button, Card, cx } from "../../components/ui";

const ROLE_UI: Record<
  Role,
  { title: string; tagline: string; icon: typeof Users; bullets: { icon: typeof Users; text: string }[] }
> = {
  STUDENT: {
    title: "Mahasiswa",
    tagline: "Belajar bersama tanpa kehilangan privasi.",
    icon: GraduationCap,
    bullets: [
      { icon: MessagesSquare, text: "Diskusi per mata kuliah, pertemuan, dan hashtag" },
      { icon: BookOpen, text: "Materi kuliah, arsip diskusi, sumber belajar dosen" },
      { icon: CalendarCheck, text: "Cari ruang, ajukan booking, pantau status" },
    ],
  },
  CDC: {
    title: "Tim CDC",
    tagline: "Antrean permohonan dan kalender ruang dalam satu tempat.",
    icon: ShieldCheck,
    bullets: [
      { icon: Users, text: "Identitas pemohon hanya untuk proses izin" },
      { icon: CalendarCheck, text: "Approve/reject dengan alasan dan cek benturan" },
      { icon: Building2, text: "Timetable mingguan per ruang dan jam" },
    ],
  },
  LECTURER: {
    title: "Dosen",
    tagline: "Jadwal mengajar dan denyut kelas, tanpa membaca identitas.",
    icon: BookOpen,
    bullets: [
      { icon: CalendarCheck, text: "Jadwal hari ini beserta lokasi ruang" },
      { icon: MessagesSquare, text: "Insight topik dalam agregat anonim" },
      { icon: Lock, text: "Read-only: tanpa composer, boleh acknowledgement" },
    ],
  },
};

export function LoginPage() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  function signIn(userId: string, role: Role) {
    dispatch({ type: "LOGIN", userId });
    navigate(HOME_PATH[role]);
  }

  const current = state.users.find((u) => u.id === state.currentUserId);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pt-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="size-11" width={44} height={44} />
            <div>
              <p className="text-lg font-extrabold tracking-tight text-ink-900">CampusSpace</p>
              <p className="text-xs font-medium text-ink-500">
                Ruang belajar kampus · prototipe MVP
              </p>
            </div>
          </div>
          <Badge tone="warning">Data DEMO</Badge>
        </header>

        <section className="mt-10 max-w-2xl">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700">
            <Info size={12} aria-hidden /> Mock auth — bukan SSO kampus
          </p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-4xl">
            Satu ruang untuk diskusi, ruang kelas, dan keputusan yang rapi.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-600 sm:text-base">
            Pilih peran untuk mencoba alur lengkap: mahasiswa berdiskusi dan mengajukan ruang, Tim
            CDC memutuskan permohonan, dosen melihat jadwal dan insight anonim.
          </p>
          {current ? (
            <p className="mt-3 text-xs text-ink-500">
              Sesi terakhir:{" "}
              <strong className="font-semibold text-ink-700">{publicName(current)}</strong> — memilih
              peran lain akan mengganti sesi demo.
            </p>
          ) : null}
        </section>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {(Object.keys(ROLE_UI) as Role[]).map((role) => {
            const ui = ROLE_UI[role];
            const account = demoAccounts.find((a) => a.role === role);
            if (!account) return null;
            const Icon = ui.icon;
            return (
              <Card key={role} className="flex flex-col p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <Icon size={20} aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-ink-900">{ui.title}</h2>
                    <p className="text-[11px] font-medium text-ink-400">{account.detail}</p>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-ink-500">{ui.tagline}</p>

                <ul className="mt-4 flex-1 space-y-2">
                  {ui.bullets.map((b) => {
                    const BIcon = b.icon;
                    return (
                      <li key={b.text} className="flex items-start gap-2 text-xs leading-relaxed text-ink-600">
                        <BIcon size={14} className="mt-0.5 shrink-0 text-brand-500" aria-hidden />
                        <span>{b.text}</span>
                      </li>
                    );
                  })}
                </ul>

                <Button
                  className="mt-5 w-full"
                  onClick={() => signIn(account.userId, role)}
                  aria-label={`Masuk sebagai ${ui.title}`}
                >
                  Masuk sebagai {ui.title}
                  <ArrowRight size={15} aria-hidden />
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <p className="text-xs font-bold text-ink-800">Yang sengaja belum disimulasikan</p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-ink-500">
              <li>• SSO kampus dan API jadwal akademik resmi.</li>
              <li>• Room ID, koordinat denah, kapasitas/fasilitas, dan foto aktual ruangan.</li>
              <li>• Aturan booking formal serta kewenangan rinci CDC vs akademik.</li>
            </ul>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-bold text-ink-800">Privasi yang dijaga</p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-ink-500">
              <li>• Diskusi publik hanya menampilkan pseudonym mahasiswa.</li>
              <li>• Nama asli hanya terbuka bagi Tim CDC di alur booking.</li>
              <li>• Dosen hanya menerima agregat anonim, tanpa identifier mahasiswa.</li>
            </ul>
          </Card>
        </div>

        <p className={cx("mt-6 text-[11px] leading-relaxed text-ink-400")}>
          Data demo disimpan di penyimpanan lokal browser dan dapat direset kapan saja dari menu
          profil. Tidak ada data yang dikirim ke server.
        </p>
      </div>
    </div>
  );
}