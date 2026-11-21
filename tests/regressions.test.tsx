import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { App } from "../src/app/App";
import { FloorPlanImage } from "../src/components/FloorPlan";
import { DEMO_STUDENT_ID } from "../src/data/seed";
import { validateDecision } from "../src/domain/booking";
import { LoginPage } from "../src/features/auth/LoginPage";
import { createMemoryAdapter, STORAGE_KEY } from "../src/lib/storage";
import { AppStoreProvider, createInitialState, reducer, serializeState } from "../src/store/AppStore";

/**
 * State demo dengan mahasiswa yang BELUM punya pseudonym.
 * Kondisi ini dulu membocorkan nama asli lewat shell dan halaman login.
 */
function stateWithoutPseudonym() {
  const loggedIn = reducer(createInitialState(), { type: "LOGIN", userId: DEMO_STUDENT_ID });
  return reducer(loggedIn, { type: "SET_PSEUDONYM", userId: DEMO_STUDENT_ID, pseudonym: "" });
}

function adapterWith(state: ReturnType<typeof stateWithoutPseudonym>) {
  return createMemoryAdapter({ [STORAGE_KEY]: serializeState(state) });
}

function renderAt(path: string, state: ReturnType<typeof stateWithoutPseudonym>) {
  return render(
    <App
      adapter={adapterWith(state)}
      Router={
        MemoryRouter as unknown as React.ComponentType<{
          children: React.ReactNode;
          initialEntries?: string[];
        }>
      }
      initialEntries={[path]}
    />,
  );
}

/** LoginPage langsung: rute "/" mengalihkan ke beranda bila sesi masih aktif. */
function renderLogin(state: ReturnType<typeof stateWithoutPseudonym>) {
  return render(
    <AppStoreProvider adapter={adapterWith(state)}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AppStoreProvider>,
  );
}

describe("student tanpa pseudonym tetap anonim", () => {
  it("halaman login tidak menampilkan nama asli pada sesi terakhir", async () => {
    renderLogin(stateWithoutPseudonym());

    // Sesi terakhir memakai nama publik, bukan nama asli.
    const session = await screen.findByText(/Sesi terakhir/i);
    expect(session).toHaveTextContent(/Mahasiswa anonim/);
    expect(session).not.toHaveTextContent(/Dimas Prakoso/);
    expect(screen.queryByText(/Dimas Prakoso/)).not.toBeInTheDocument();
    expect(screen.queryByText(/2210512034/)).not.toBeInTheDocument();
  });

  it("shell mahasiswa tidak memakai nama asli sebagai fallback", async () => {
    renderAt("/student", stateWithoutPseudonym());

    expect((await screen.findAllByText(/Mahasiswa anonim/)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Dimas Prakoso/)).not.toBeInTheDocument();
    expect(screen.queryByText(/2210512034/)).not.toBeInTheDocument();
  });

  it("pseudonym kosong tetap bisa diperbaiki dari beranda mahasiswa", async () => {
    const user = userEvent.setup();
    renderAt("/student", stateWithoutPseudonym());

    await user.click(await screen.findByRole("button", { name: /Ubah pseudonym/i }));
    const input = await screen.findByLabelText(/Pseudonym publik/i);
    await user.type(input, "DaunPagi");
    await user.click(screen.getByRole("button", { name: /^Simpan$/i }));

    expect((await screen.findAllByText(/DaunPagi/)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Dimas Prakoso/)).not.toBeInTheDocument();
  });
});

describe("pembatalan booking oleh pemilik", () => {
  const pending = {
    id: "bk-milik-1",
    roomId: "r-4-02",
    requesterUserId: "u-student-1",
    purpose: "Diskusi kelompok tugas besar",
    startsAt: "2099-01-05T09:00",
    endsAt: "2099-01-05T11:00",
    status: "PENDING" as const,
    createdAt: "2099-01-01T08:00",
  };

  it("hanya pemilik yang boleh membatalkan", () => {
    expect(
      validateDecision(pending, { action: "CANCEL", actorRole: "STUDENT", actorUserId: "u-student-1" })
        .ok,
    ).toBe(true);
    expect(
      validateDecision(pending, { action: "CANCEL", actorRole: "STUDENT", actorUserId: "u-student-2" })
        .ok,
    ).toBe(false);
  });

  it("CANCEL tanpa actor ditolak, tidak lolos diam-diam", () => {
    expect(validateDecision(pending, { action: "CANCEL", actorRole: "STUDENT" }).ok).toBe(false);
  });

  it("booking yang sudah diputuskan tidak bisa dibatalkan", () => {
    for (const status of ["REJECTED", "CANCELLED"] as const) {
      expect(
        validateDecision(
          { ...pending, status },
          { action: "CANCEL", actorRole: "STUDENT", actorUserId: "u-student-1" },
        ).ok,
      ).toBe(false);
    }
  });

  it("reducer mengubah status menjadi CANCELLED dan menambah notifikasi", () => {
    const loggedIn = reducer(createInitialState(), { type: "LOGIN", userId: "u-student-1" });
    const next = reducer(
      { ...loggedIn, bookings: [pending] },
      {
        type: "CANCEL_BOOKING",
        bookingId: pending.id,
        notification: {
          id: "n-batal",
          recipientUserId: "u-student-1",
          type: "BOOKING_CANCELLED",
          title: "Permohonan dibatalkan",
          body: "Dibatalkan.",
          createdAt: "2099-01-02T08:00",
        },
      },
    );
    expect(next.bookings[0].status).toBe("CANCELLED");
    expect(next.notifications.some((n) => n.id === "n-batal")).toBe(true);
  });
});

describe("notifikasi lintas peran untuk booking baru", () => {
  it("permohonan mahasiswa membuat notifikasi masuk ke Tim CDC", () => {
    const loggedIn = reducer(createInitialState(), { type: "LOGIN", userId: DEMO_STUDENT_ID });
    const booking = {
      id: "bk-baru",
      roomId: "r-4-02",
      requesterUserId: DEMO_STUDENT_ID,
      purpose: "Diskusi kelompok tugas besar",
      startsAt: "2099-01-05T09:00",
      endsAt: "2099-01-05T11:00",
      status: "PENDING" as const,
      createdAt: "2099-01-01T08:00:00.000Z",
    };

    const next = reducer(loggedIn, {
      type: "CREATE_BOOKING",
      booking,
      notification: {
        id: "n-siswa",
        recipientUserId: DEMO_STUDENT_ID,
        type: "BOOKING_SUBMITTED",
        title: "Permohonan terkirim",
        body: "Menunggu keputusan.",
        createdAt: booking.createdAt,
      },
    });

    const cdcUsers = next.users.filter((u) => u.role === "CDC");
    expect(cdcUsers.length).toBeGreaterThan(0);
    for (const cdcUser of cdcUsers) {
      expect(
        next.notifications.some(
          (n) => n.recipientUserId === cdcUser.id && n.targetPath === "/cdc/approval/bk-baru",
        ),
      ).toBe(true);
    }
    // Mahasiswa tetap menerima konfirmasi miliknya sendiri.
    expect(next.notifications.some((n) => n.id === "n-siswa")).toBe(true);
  });
});

describe("denah punya state gagal muat", () => {
  it("menampilkan loading lalu error bila berkas denah tidak bisa dibuka", () => {
    render(<FloorPlanImage src="/floor-plans/hilang.jpeg" alt="Denah uji" />);

    const img = screen.getByAltText("Denah uji");
    expect(screen.getByText(/Memuat denah/i)).toBeInTheDocument();

    fireEvent.error(img);

    expect(screen.getByText(/Denah gagal dimuat/i)).toBeInTheDocument();
    // Tidak menyisakan <img> rusak di DOM.
    expect(screen.queryByAltText("Denah uji")).not.toBeInTheDocument();
  });

  it("menampilkan empty state bila aset denah memang tidak ada", () => {
    render(<FloorPlanImage alt="Denah uji" />);
    expect(screen.getByText(/Aset denah tidak tersedia/i)).toBeInTheDocument();
  });
});

describe("pembatalan dari UI Booking saya", () => {
  it("mahasiswa dapat membatalkan permohonan miliknya dan status berubah", async () => {
    const user = userEvent.setup();
    const loggedIn = reducer(createInitialState(), { type: "LOGIN", userId: DEMO_STUDENT_ID });
    const next = reducer(loggedIn, {
      type: "CREATE_BOOKING",
      booking: {
        id: "bk-ui-batal",
        roomId: "r-4-02",
        requesterUserId: DEMO_STUDENT_ID,
        purpose: "Latihan presentasi IMK untuk demo",
        startsAt: "2099-01-05T09:00",
        endsAt: "2099-01-05T11:00",
        status: "PENDING",
        createdAt: "2099-01-01T08:00",
      },
      notification: {
        id: "n-ui-baru",
        recipientUserId: DEMO_STUDENT_ID,
        type: "BOOKING_SUBMITTED",
        title: "Permohonan terkirim",
        body: "Menunggu keputusan.",
        createdAt: "2099-01-01T08:00",
      },
    });

    render(
      <App
        adapter={adapterWith(next)}
        Router={
          MemoryRouter as unknown as React.ComponentType<{
            children: React.ReactNode;
            initialEntries?: string[];
          }>
        }
        initialEntries={["/student/booking"]}
      />,
    );

    const card = (
      await screen.findByText(/Latihan presentasi IMK untuk demo/i)
    ).closest("li") as HTMLElement;
    expect(card).not.toBeNull();

    await user.click(within(card).getByRole("button", { name: /Batalkan permohonan/i }));
    await user.click(await screen.findByRole("button", { name: /Ya, batalkan/i }));

    expect(await screen.findByTestId("toast")).toHaveTextContent(/dibatalkan/i);
    expect(await screen.findByText(/^Dibatalkan$/i)).toBeInTheDocument();
    expect(within(card).queryByRole("button", { name: /Batalkan permohonan/i })).toBeNull();
  });
});