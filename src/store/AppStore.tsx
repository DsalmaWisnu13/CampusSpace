import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { buildDemoDataset, type DemoDataset } from "../data/seed";
import {
  AcademicSchedule,
  AppNotification,
  BookingStatus,
  RoomBooking,
  TopicAcknowledgement,
} from "../domain/types";
import {
  createLocalStorageAdapter,
  STORAGE_KEY,
  type StorageAdapter,
} from "../lib/storage";

export interface AppState extends Omit<DemoDataset, "referenceDate"> {
  currentUserId: string | null;
  /** Flash message terakhir untuk feedback aksi. */
  toast: { id: number; tone: "success" | "error" | "info"; message: string } | null;
}

export type ToastTone = "success" | "error" | "info";

type Action =
  | { type: "LOGIN"; userId: string }
  | { type: "LOGOUT" }
  | { type: "SET_PSEUDONYM"; userId: string; pseudonym: string }
  | { type: "ADD_POST"; post: AppState["posts"][number]; notification?: AppNotification }
  | { type: "ADD_REPLY"; reply: AppState["replies"][number]; notification: AppNotification }
  | { type: "CREATE_BOOKING"; booking: RoomBooking; notification: AppNotification }
  | {
      type: "DECIDE_BOOKING";
      bookingId: string;
      status: BookingStatus;
      decidedByUserId: string;
      rejectionReason?: string;
      notification: AppNotification;
    }
  | { type: "CANCEL_BOOKING"; bookingId: string; notification?: AppNotification }
  | { type: "MARK_NOTIFICATION_READ"; notificationId: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ"; userId: string }
  | { type: "ACKNOWLEDGE_TOPIC"; acknowledgement: TopicAcknowledgement; notification?: AppNotification }
  | { type: "UPSERT_SCHEDULE"; schedule: AcademicSchedule }
  | { type: "REMOVE_SCHEDULE"; scheduleId: string }
  | { type: "TOAST"; tone: ToastTone; message: string }
  | { type: "DISMISS_TOAST" }
  | { type: "RESET_DEMO" };

export function createInitialState(): AppState {
  const { referenceDate, ...rest } = buildDemoDataset();
  void referenceDate;
  return { ...rest, currentUserId: null, toast: null };
}

let toastId = 0;

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOGIN":
      return { ...state, currentUserId: action.userId, toast: null };

    case "LOGOUT":
      return { ...state, currentUserId: null, toast: null };

    case "SET_PSEUDONYM":
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.userId ? { ...u, publicPseudonym: action.pseudonym } : u,
        ),
      };

    case "ADD_POST":
      return {
        ...state,
        posts: [action.post, ...state.posts],
        notifications: action.notification
          ? [action.notification, ...state.notifications]
          : state.notifications,
      };

    case "ADD_REPLY":
      return {
        ...state,
        replies: [...state.replies, action.reply],
        notifications: [action.notification, ...state.notifications],
      };

    case "CREATE_BOOKING": {
      // FR9: permohonan baru harus masuk juga ke notification center Tim CDC.
      const cdcNotifications: AppNotification[] = state.users
        .filter((u) => u.role === "CDC")
        .map((u) => ({
          id: `n-${action.booking.id}-cdc-${u.id}`,
          recipientUserId: u.id,
          type: "BOOKING_SUBMITTED",
          title: "Permintaan ruang baru",
          body: `Permohonan ${action.booking.purpose} pada ${action.booking.startsAt} menunggu keputusan.`,
          targetPath: `/cdc/approval/${action.booking.id}`,
          createdAt: action.booking.createdAt,
        }));

      return {
        ...state,
        bookings: [action.booking, ...state.bookings],
        notifications: [action.notification, ...cdcNotifications, ...state.notifications],
      };
    }

    case "DECIDE_BOOKING":
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.bookingId
            ? {
                ...booking,
                status: action.status,
                decidedByUserId: action.decidedByUserId,
                decidedAt: new Date().toISOString(),
                rejectionReason: action.rejectionReason ?? booking.rejectionReason,
              }
            : booking,
        ),
        notifications: [action.notification, ...state.notifications],
      };

    case "CANCEL_BOOKING":
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.bookingId ? { ...booking, status: "CANCELLED" } : booking,
        ),
        notifications: action.notification
          ? [action.notification, ...state.notifications]
          : state.notifications,
      };

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.notificationId
            ? { ...n, readAt: n.readAt ?? new Date().toISOString() }
            : n,
        ),
      };

    case "MARK_ALL_NOTIFICATIONS_READ": {
      const now = new Date().toISOString();
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.recipientUserId === action.userId && !n.readAt ? { ...n, readAt: now } : n,
        ),
      };
    }

    case "ACKNOWLEDGE_TOPIC":
      return {
        ...state,
        acknowledgements: [action.acknowledgement, ...state.acknowledgements],
        notifications: action.notification
          ? [action.notification, ...state.notifications]
          : state.notifications,
      };

    case "UPSERT_SCHEDULE": {
      const exists = state.academicSchedules.some((s) => s.id === action.schedule.id);
      return {
        ...state,
        academicSchedules: exists
          ? state.academicSchedules.map((s) =>
              s.id === action.schedule.id ? action.schedule : s,
            )
          : [...state.academicSchedules, action.schedule],
      };
    }

    case "REMOVE_SCHEDULE":
      return {
        ...state,
        academicSchedules: state.academicSchedules.filter((s) => s.id !== action.scheduleId),
      };

    case "TOAST":
      toastId += 1;
      return { ...state, toast: { id: toastId, tone: action.tone, message: action.message } };

    case "DISMISS_TOAST":
      return { ...state, toast: null };

    case "RESET_DEMO":
      return createInitialState();

    default:
      return state;
  }
}

/** Hanya subset yang dipersistensikan; seed tetap sumber kebenaran untuk referensi. */
const PERSISTED_KEYS = [
  "currentUserId",
  "posts",
  "replies",
  "bookings",
  "notifications",
  "acknowledgements",
  "academicSchedules",
  "resources",
  "users",
] as const;

export function serializeState(state: AppState): string {
  const payload: Record<string, unknown> = {};
  for (const key of PERSISTED_KEYS) payload[key] = state[key];
  return JSON.stringify(payload);
}

export function hydrateState(raw: string | null): AppState {
  const base = createInitialState();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed || typeof parsed !== "object") return base;
    return {
      ...base,
      currentUserId: typeof parsed.currentUserId === "string" ? parsed.currentUserId : null,
      posts: parsed.posts?.length ? parsed.posts : base.posts,
      replies: parsed.replies?.length ? parsed.replies : base.replies,
      bookings: parsed.bookings?.length ? parsed.bookings : base.bookings,
      notifications: parsed.notifications?.length ? parsed.notifications : base.notifications,
      acknowledgements: parsed.acknowledgements?.length
        ? parsed.acknowledgements
        : base.acknowledgements,
      academicSchedules: parsed.academicSchedules?.length
        ? parsed.academicSchedules
        : base.academicSchedules,
      resources: parsed.resources?.length ? parsed.resources : base.resources,
      users: parsed.users?.length ? parsed.users : base.users,
    };
  } catch {
    return base;
  }
}

interface StoreValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  toast: (tone: ToastTone, message: string) => void;
  resetDemo: () => void;
  storageAvailable: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({
  children,
  adapter,
}: {
  children: ReactNode;
  adapter?: StorageAdapter;
}) {
  const storage = useMemo(() => adapter ?? createLocalStorageAdapter(), [adapter]);
  const [state, dispatch] = useReducer(reducer, storage.read(STORAGE_KEY), hydrateState);

  useEffect(() => {
    storage.write(STORAGE_KEY, serializeState(state));
  }, [state, storage]);

  const toast = useCallback(
    (tone: ToastTone, message: string) => dispatch({ type: "TOAST", tone, message }),
    [],
  );

  const resetDemo = useCallback(() => dispatch({ type: "RESET_DEMO" }), []);

  const value = useMemo<StoreValue>(
    () => ({ state, dispatch, toast, resetDemo, storageAvailable: storage.available }),
    [state, toast, resetDemo, storage],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore harus dipakai di dalam AppStoreProvider");
  return ctx;
}

export function useCurrentUser() {
  const { state } = useStore();
  return useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  );
}