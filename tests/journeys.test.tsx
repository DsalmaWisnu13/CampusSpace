import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { App } from "../src/app/App";
import { createMemoryAdapter } from "../src/lib/storage";

function renderApp(initialEntries: string[] = ["/"]) {
  return render(
    <App
      adapter={createMemoryAdapter()}
      Router={MemoryRouter as unknown as React.ComponentType<{
        children: React.ReactNode;
        initialEntries?: string[];
      }>}
      initialEntries={initialEntries}
    />,
  );
}

async function signInAs(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = await screen.findByRole("button", {
    name: new RegExp(`Masuk sebagai ${label}`, "i"),
  });
  await user.click(button);
}

describe("A · student journey", () => {
  it("login menampilkan pseudonym, bukan nama asli/NIM", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Mahasiswa");

    expect(await screen.findByText(/Halo, LontarHujan/i)).toBeInTheDocument();
    expect(screen.queryByText(/Dimas Prakoso/)).not.toBeInTheDocument();
    expect(screen.queryByText(/2210512034/)).not.toBeInTheDocument();
  });

  it("mencari diskusi dengan hashtag dan membuka detail", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Mahasiswa");

    await user.click(await screen.findByRole("link", { name: /^Diskusi$/i }));

    const search = await screen.findByRole("textbox", { name: /cari diskusi/i });
    await user.type(search, "normalisasi");

    expect(await screen.findByText(/Batas denormalisasi yang masih aman\?/i)).toBeInTheDocument();
    expect(screen.queryByText(/Rekrutmen peserta usability testing/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /Batas denormalisasi/i }));
    expect(
      await screen.findByRole("heading", { level: 1, name: /Batas denormalisasi/i }),
    ).toBeInTheDocument();
  });

  it("membalas diskusi menambah balasan dan menampilkan feedback", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Mahasiswa");

    await user.click(await screen.findByRole("link", { name: /^Diskusi$/i }));
    await user.click(await screen.findByRole("link", { name: /Batas denormalisasi/i }));

    const textarea = await screen.findByLabelText(/^Balasan$/i);
    await user.type(textarea, "Menurut saya perlu proses sinkronisasi yang eksplisit.");
    await user.click(screen.getByRole("button", { name: /^Kirim$/i }));

    expect(
      await screen.findByText(/Menurut saya perlu proses sinkronisasi yang eksplisit\./i),
    ).toBeInTheDocument();
    expect(await screen.findByTestId("toast")).toHaveTextContent(/Balasan terkirim/i);
  });

  it("membuka materi kuliah dan melihat empty state foto ruang", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Mahasiswa");

    await user.click(await screen.findByRole("link", { name: /Buka materi kuliah/i }));
    expect(
      await screen.findByRole("heading", { level: 1, name: /Materi kuliah/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Catatan Query Plan/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/Arsip diskusi/i)).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("link", { name: /^Cari Ruang$/i }));
    const detailLinks = await screen.findAllByRole("link", { name: /Lihat detail/i });
    await user.click(detailLinks[0]);
    expect(await screen.findByText(/Foto ruangan belum tersedia/i)).toBeInTheDocument();
  });

  it("mengajukan booking dan melihat status Menunggu", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Mahasiswa");

    await user.click(await screen.findByRole("link", { name: /^Cari Ruang$/i }));
    const detailLinks = await screen.findAllByRole("link", { name: /Lihat detail/i });
    await user.click(detailLinks[0]);

    const purpose = await screen.findByLabelText(/Tujuan penggunaan/i);
    await user.type(purpose, "Diskusi kelompok untuk tugas besar basis data.");

    await user.click(screen.getByRole("button", { name: /Kirim permohonan/i }));

    expect(await screen.findByRole("heading", { name: /Permohonan terkirim/i })).toBeInTheDocument();
    expect((await screen.findAllByText(/Menunggu/)).length).toBeGreaterThan(0);
  });
});

describe("B & C · CDC approval journey", () => {
  it("CDC melihat identitas pemohon hanya di detail approval", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Tim CDC");

    await user.click(await screen.findByRole("link", { name: /Buka antrean lengkap/i }));

    // Antrean memakai pseudonym, bukan nama asli
    expect(await screen.findByText(/LontarHujan/)).toBeInTheDocument();
    expect(screen.queryByText(/Dimas Prakoso/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /Ruang Kelas 4-02/i }));
    expect(await screen.findByText(/Dimas Prakoso/)).toBeInTheDocument();
    expect(await screen.findByText(/2210512034/)).toBeInTheDocument();
  });

  it("approve memblokir benturan jadwal akademik", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Tim CDC");

    await user.click(await screen.findByRole("link", { name: /Buka antrean lengkap/i }));
    // bk-3 memakai Lab Room yang bentrok dengan jadwal akademik
    await user.click(await screen.findByRole("link", { name: /Lab Room/i }));

    expect(await screen.findByText(/Approval diblokir oleh benturan/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Setujui permohonan/i })).not.toBeInTheDocument();
  });

  it("reject tanpa alasan ditolak oleh validasi", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Tim CDC");

    await user.click(await screen.findByRole("link", { name: /Buka antrean lengkap/i }));
    await user.click(await screen.findByRole("link", { name: /Ruang Kelas 4-02/i }));

    await user.click(await screen.findByRole("button", { name: /Tolak dengan alasan/i }));
    await user.click(screen.getByRole("button", { name: /^Tolak permohonan$/i }));

    expect(await screen.findByText(/Alasan penolakan wajib diisi/i)).toBeInTheDocument();
  });

  it("reject dengan alasan tersimpan dan memberi feedback", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Tim CDC");

    await user.click(await screen.findByRole("link", { name: /Buka antrean lengkap/i }));
    await user.click(await screen.findByRole("link", { name: /Ruang Kelas 4-02/i }));
    await user.click(await screen.findByRole("button", { name: /Tolak dengan alasan/i }));

    const reason = "Ruang sedang digunakan untuk ujian resmi. Silakan pilih waktu lain.";
    await user.type(screen.getByLabelText(/Alasan penolakan/i), reason);
    await user.click(screen.getByRole("button", { name: /^Tolak permohonan$/i }));

    expect(await screen.findByTestId("toast")).toHaveTextContent(/ditolak dengan alasan/i);
    // Kembali ke antrean dan status berubah
    expect(await screen.findByRole("heading", { level: 1, name: /Antrean permohonan/i })).toBeInTheDocument();
  });

  it("approve booking bersih mengubah status menjadi Disetujui", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Tim CDC");

    await user.click(await screen.findByRole("link", { name: /Buka antrean lengkap/i }));
    await user.click(await screen.findByRole("link", { name: /Ruang Kelas 4-02/i }));

    await user.click(await screen.findByRole("button", { name: /Setujui permohonan/i }));

    expect(await screen.findByTestId("toast")).toHaveTextContent(/disetujui/i);
    expect(await screen.findByRole("heading", { level: 1, name: /Antrean permohonan/i })).toBeInTheDocument();
  });
});

describe("D · lecturer privacy journey", () => {
  it("menampilkan jadwal hari ini tanpa composer diskusi", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Dosen");

    expect((await screen.findAllByText(/Dr\. Sari Wulandari/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/Jadwal mengajar hari ini/i)).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: /Buat diskusi/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Balasan$/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Kirim$/i })).not.toBeInTheDocument();
  });

  it("tidak menampilkan highlight denah saat mapping belum terverifikasi", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Dosen");

    await user.click(await screen.findByRole("link", { name: /^Jadwal$/i }));
    expect(await screen.findByText(/Denah tidak di-highlight/i)).toBeInTheDocument();
    expect(screen.queryByText(/Mapping terverifikasi/i)).not.toBeInTheDocument();
  });

  it("insight anonim tanpa identifier dan acknowledgement berfungsi", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Dosen");

    await user.click(await screen.findByRole("link", { name: /Insight Mahasiswa/i }));

    expect((await screen.findAllByText(/Tanpa identifier mahasiswa/i)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/2210512034/)).not.toBeInTheDocument();
    expect(screen.queryByText(/@student/i)).not.toBeInTheDocument();

    const ackButtons = await screen.findAllByRole("button", { name: /Tandai akan dijelaskan/i });
    await user.click(ackButtons[0]);
    expect(await screen.findByTestId("toast")).toHaveTextContent(/Topik ditandai akan dijelaskan/i);
  });
});

describe("privacy · role access boundaries", () => {
  it("student tidak bisa membuka dashboard CDC", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Mahasiswa");
    expect(await screen.findByText(/Halo, LontarHujan/i)).toBeInTheDocument();
  });

  it("guest yang membuka area CDC ditolak", async () => {
    renderApp(["/cdc"]);
    expect(await screen.findByText(/Kamu belum masuk/i)).toBeInTheDocument();
    expect(screen.queryByText(/Antrean operasional/i)).not.toBeInTheDocument();
  });

  it("lecturer tidak melihat navigasi student", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Dosen");

    expect(screen.queryByRole("link", { name: /Booking Saya/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Diskusi$/i })).not.toBeInTheDocument();
  });

  it("notification bell mengisolasi notifikasi per role", async () => {
    const user = userEvent.setup();
    renderApp();
    await signInAs(user, "Dosen");

    const bell = await screen.findByRole("button", { name: /^Notifikasi/i });
    await user.click(bell);

    const panel = document.querySelector(
      '[aria-label="Notifikasi"] + ul, header ul.max-h-80',
    ) as HTMLElement | null;
    expect(panel).not.toBeNull();
    expect(within(panel as HTMLElement).getByText(/Perubahan ruang kelas/i)).toBeInTheDocument();
    expect(
      within(panel as HTMLElement).queryByText(/Permintaan ruang baru/i),
    ).not.toBeInTheDocument();
  });
});