import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./AppRoutes";
import { ToastViewport } from "../components/ToastViewport";
import { AppStoreProvider } from "../store/AppStore";
import type { StorageAdapter } from "../lib/storage";

/**
 * Komposisi aplikasi lengkap (store + router + toast).
 * Dipakai oleh entry point DAN test agar keduanya menguji pohon yang sama.
 */
export function App({
  adapter,
  Router = BrowserRouter,
  initialEntries,
}: {
  adapter?: StorageAdapter;
  Router?: React.ComponentType<{ children: React.ReactNode; initialEntries?: string[] }>;
  initialEntries?: string[];
}) {
  return (
    <AppStoreProvider adapter={adapter}>
      <Router initialEntries={initialEntries}>
        <AppRoutes />
        <ToastViewport />
      </Router>
    </AppStoreProvider>
  );
}