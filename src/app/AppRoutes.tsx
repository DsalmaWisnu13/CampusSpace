import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { CdcApprovalDetailPage, CdcApprovalPage, CdcHomePage, CdcSchedulePage } from "../features/cdc/CdcPages";
import { LoginPage } from "../features/auth/LoginPage";
import {
  LecturerHomePage,
  LecturerInsightPage,
  LecturerSchedulePage,
} from "../features/lecturer/LecturerPages";
import { MyBookingsPage } from "../features/student/BookingPages";
import {
  DiscussionFeedPage,
  DiscussionThreadPage,
  NewDiscussionPage,
} from "../features/student/Discussions";
import { MaterialsPage } from "../features/student/MaterialsPage";
import { RoomDetailPage, RoomsPage } from "../features/student/RoomsPage";
import { StudentHomePage } from "../features/student/StudentHomePage";
import { useCurrentUser } from "../store/AppStore";
import { RequireRole } from "./guards";
import { NotFoundPage } from "./guards";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="*" element={<NotFoundPage />} />

      <Route
        path="/student"
        element={
          <RequireRole role="STUDENT">
            <AppShell>
              <StudentHomePage />
            </AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/student/discussions"
        element={
          <RequireRole role="STUDENT">
            <AppShell>
              <DiscussionFeedPage />
            </AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/student/discussions/new"
        element={
          <RequireRole role="STUDENT">
            <AppShell>
              <NewDiscussionPage />
            </AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/student/discussions/:postId"
        element={
          <RequireRole role="STUDENT">
            <AppShell>
              <DiscussionThreadPage />
            </AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/student/materials"
        element={
          <RequireRole role="STUDENT">
            <AppShell>
              <MaterialsPage />
            </AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/student/rooms"
        element={
          <RequireRole role="STUDENT">
            <AppShell>
              <RoomsPage />
            </AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/student/rooms/:roomId"
        element={
          <RequireRole role="STUDENT">
            <AppShell>
              <RoomDetailRoute />
            </AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/student/booking"
        element={
          <RequireRole role="STUDENT">
            <AppShell>
              <MyBookingsPage />
            </AppShell>
          </RequireRole>
        }
      />

      <Route
        path="/cdc"
        element={
          <RequireRole role="CDC">
            <AppShell>
              <CdcHomePage />
            </AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/cdc/approval"
        element={
          <RequireRole role="CDC">
            <AppShell>
              <CdcApprovalPage />
            </AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/cdc/approval/:bookingId"
        element={
          <RequireRole role="CDC">
            <AppShell>
              <CdcApprovalDetailPage />
            </AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/cdc/jadwal"
        element={
          <RequireRole role="CDC">
            <AppShell>
              <CdcSchedulePage />
            </AppShell>
          </RequireRole>
        }
      />

      <Route
        path="/lecturer"
        element={
          <RequireRole role="LECTURER">
            <AppShell>
              <LecturerHomePage />
            </AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/lecturer/jadwal"
        element={
          <RequireRole role="LECTURER">
            <AppShell>
              <LecturerSchedulePage />
            </AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/lecturer/insight"
        element={
          <RequireRole role="LECTURER">
            <AppShell>
              <LecturerInsightPage />
            </AppShell>
          </RequireRole>
        }
      />
    </Routes>
  );
}

function RootRoute() {
  const user = useCurrentUser();
  if (user) {
    const home = user.role === "STUDENT" ? "/student" : user.role === "CDC" ? "/cdc" : "/lecturer";
    return <Navigate to={home} replace />;
  }
  return <LoginPage />;
}

function RoomDetailRoute() {
  const { roomId } = useParams();
  return <RoomDetailPage roomId={roomId ?? ""} />;
}