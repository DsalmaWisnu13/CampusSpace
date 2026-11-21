import { useMemo } from "react";
import { findConflicts, hasBlockingConflict, toBookingView, toCdcBookingView, validateBookingDraft } from "../domain/booking";
import { publicName } from "../domain/permissions";
import type {
  AcademicSchedule,
  AppNotification,
  BookingView,
  CdcBookingView,
  Course,
  CourseMeeting,
  DiscussionReplyView,
  DiscussionView,
  LearningResource,
  LecturerClassView,
  Room,
  Floor,
  TimetableEntry,
  TopicInsight,
} from "../domain/types";import { isSameDay } from "../lib/datetime";
import { useStore } from "../store/AppStore";

function byStartAsc<T extends { startsAt: string }>(a: T, b: T) {
  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
}

export function useLookups() {
  const { state } = useStore();
  return useMemo(() => {
    const userById = new Map(state.users.map((u) => [u.id, u]));
    const courseById = new Map(state.courses.map((c) => [c.id, c]));
    const meetingById = new Map(state.meetings.map((m) => [m.id, m]));
    const roomById = new Map(state.rooms.map((r) => [r.id, r]));
    const floorById = new Map(state.floors.map((f) => [f.id, f]));
    const buildingById = new Map(state.buildings.map((b) => [b.id, b]));

    const courseLabel = (schedule: AcademicSchedule) => {
      const course = courseById.get(schedule.courseId);
      return course ? `Jadwal ${course.name}` : "Jadwal akademik";
    };

    return {
      userById,
      courseById,
      meetingById,
      roomById,
      floorById,
      buildingById,
      courseLabel,
      roomsOnFloor: (floorId: string) => state.rooms.filter((r) => r.floorId === floorId),
    };
  }, [state]);
}

/* -------------------------- Notifications -------------------------- */

export function useNotifications(userId: string | null): AppNotification[] {
  const { state } = useStore();
  return useMemo(() => {
    if (!userId) return [];
    return state.notifications
      .filter((n) => n.recipientUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.notifications, userId]);
}

/* --------------------------- Discussions --------------------------- */

export function useDiscussions(courseId?: string): DiscussionView[] {
  const { state } = useStore();
  const { userById, courseById, meetingById } = useLookups();

  return useMemo(() => {
    return state.posts
      .filter((p) => !courseId || p.courseId === courseId)
      .map((post) => {
        const author = userById.get(post.authorUserId);
        const course = courseById.get(post.courseId);
        const meeting = meetingById.get(post.meetingId);
        const replies = state.replies.filter((r) => r.postId === post.id);
        const lastReply = replies.reduce<number>(
          (max, r) => Math.max(max, new Date(r.createdAt).getTime()),
          0,
        );
        const lecturerName = course?.lecturerId
          ? userById.get(course.lecturerId)?.fullName
          : undefined;
        return {
          ...post,
          author: {
            userId: post.authorUserId,
            pseudonym: publicName(author),
          },
          course: course
            ? { id: course.id, name: course.name, hashtag: course.hashtag }
            : { id: post.courseId, name: "Mata kuliah", hashtag: "#umum" },
          meeting: meeting
            ? { id: meeting.id, meetingNumber: meeting.meetingNumber, topic: meeting.topic }
            : { id: post.meetingId, meetingNumber: 0, topic: "Pertemuan" },
          lecturerName,
          replyCount: replies.length,
          lastActivityAt: new Date(
            Math.max(lastReply, new Date(post.createdAt).getTime()),
          ).toISOString(),
        } satisfies DiscussionView;
      })
      .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
  }, [state.posts, state.replies, courseId, userById, courseById, meetingById]);
}

export function useDiscussion(postId: string | undefined) {
  const { state } = useStore();
  const { userById, courseById, meetingById } = useLookups();

  return useMemo(() => {
    const post = state.posts.find((p) => p.id === postId);
    if (!post) return null;
    const course = courseById.get(post.courseId) as Course | undefined;
    const meeting = meetingById.get(post.meetingId) as CourseMeeting | undefined;
    const author = userById.get(post.authorUserId);
    const replies: DiscussionReplyView[] = state.replies
      .filter((r) => r.postId === post.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((reply) => ({
        ...reply,
        author: {
          userId: reply.authorUserId,
          pseudonym: publicName(userById.get(reply.authorUserId)),
        },
      }));

    return {
      post,
      course,
      meeting,
      authorPseudonym: publicName(author),
      lecturerName: course?.lecturerId ? userById.get(course.lecturerId)?.fullName : undefined,
      replies,
    };
  }, [state.posts, state.replies, postId, userById, courseById, meetingById]);
}

export function useResources(courseId?: string, meetingId?: string): LearningResource[] {
  const { state } = useStore();
  return useMemo(
    () =>
      state.resources.filter(
        (r) => (!courseId || r.courseId === courseId) && (!meetingId || r.meetingId === meetingId),
      ),
    [state.resources, courseId, meetingId],
  );
}

/* ---------------------------- Bookings ----------------------------- */

export function useMyBookings(userId: string | null): BookingView[] {
  const { state } = useStore();
  const { roomById, floorById } = useLookups();

  return useMemo(() => {
    if (!userId) return [];
    return state.bookings
      .filter((b) => b.requesterUserId === userId)
      .map((b) => {
        const room = roomById.get(b.roomId);
        const floor = room ? floorById.get(room.floorId) : undefined;
        return toBookingView(b, room, floor?.label ?? "Lantai ?", publicName(state.users.find((u) => u.id === userId)));
      })
      .sort((a, b) => byStartAsc(b, a));
  }, [state.bookings, state.users, userId, roomById, floorById]);
}

export function useCdcBookings(): CdcBookingView[] {
  const { state } = useStore();
  const { roomById, floorById, courseLabel } = useLookups();

  return useMemo(() => {
    return state.bookings
      .map((b) => {
        const room = roomById.get(b.roomId);
        const floor = room ? floorById.get(room.floorId) : undefined;
        const requester = state.users.find((u) => u.id === b.requesterUserId);
        const view = toBookingView(
          b,
          room,
          floor?.label ?? "Lantai ?",
          publicName(requester),
        );
        const conflicts = findConflicts(
          b,
          state.academicSchedules,
          state.bookings.filter((other) => other.status === "APPROVED"),
          { ignoreBookingId: b.id, labelForAcademic: courseLabel },
        );
        return toCdcBookingView(
          view,
          {
            userId: b.requesterUserId,
            fullName: requester?.fullName ?? "Pemohon tidak dikenal",
            campusSubjectId: requester?.campusSubjectId,
            email: requester?.email,
            publicPseudonym: requester?.publicPseudonym,
          },
          conflicts,
        );
      })
      .sort((a, b) => {
        if (a.status === "PENDING" && b.status !== "PENDING") return -1;
        if (b.status === "PENDING" && a.status !== "PENDING") return 1;
        return byStartAsc(a, b);
      });
  }, [state.bookings, state.users, state.academicSchedules, roomById, floorById, courseLabel]);
}

export { hasBlockingConflict, validateBookingDraft };

/* --------------------------- Rooms & map --------------------------- */

export function useDayTimetable(day: Date): TimetableEntry[] {
  const { state } = useStore();
  const { courseLabel, roomById } = useLookups();

  return useMemo(() => {
    const academic: TimetableEntry[] = state.academicSchedules
      .filter((s) => isSameDay(s.startsAt, day))
      .map((s) => {
        const room = roomById.get(s.roomId);
        const conflicts = findConflicts(s, [], state.bookings, {
          labelForAcademic: courseLabel,
        }).filter((c) => c.kind !== "ACADEMIC");
        return {
          id: s.id,
          roomId: s.roomId,
          roomName: room?.name ?? "Ruangan",
          kind: "ACADEMIC" as const,
          status: "SCHEDULED" as const,
          label: courseLabel(s),
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          editable: true,
          hasConflict: conflicts.length > 0,
        };
      });

    const bookings: TimetableEntry[] = state.bookings
      .filter((b) => isSameDay(b.startsAt, day) && (b.status === "APPROVED" || b.status === "PENDING"))
      .map((b) => {
        const room = roomById.get(b.roomId);
        return {
          id: b.id,
          roomId: b.roomId,
          roomName: room?.name ?? "Ruangan",
          kind: "BOOKING" as const,
          status: b.status,
          label: b.purpose,
          startsAt: b.startsAt,
          endsAt: b.endsAt,
          editable: false,
          hasConflict: false,
        };
      });

    return [...academic, ...bookings].sort(byStartAsc);
  }, [state.academicSchedules, state.bookings, day, courseLabel, roomById]);
}

/* --------------------------- Lecturer ------------------------------ */

export function useLecturerClasses(lecturerId: string | null): LecturerClassView[] {
  const { state } = useStore();
  const { courseById, roomById, floorById, meetingById } = useLookups();

  return useMemo(() => {
    if (!lecturerId) return [];
    return state.academicSchedules
      .filter((s) => s.lecturerId === lecturerId)
      .map((schedule) => {
        const course = courseById.get(schedule.courseId);
        const room = roomById.get(schedule.roomId);
        const floor = room ? floorById.get(room.floorId) : undefined;
        const meeting = schedule.meetingId ? meetingById.get(schedule.meetingId) : undefined;
        const canHighlightOnMap = Boolean(room?.mapRegion) && floor?.mappingStatus === "VERIFIED";
        return {
          schedule,
          courseName: course?.name ?? "Mata kuliah",
          courseCode: course?.code,
          meetingTopic: meeting?.topic,
          room: room as Room,
          floor: floor as Floor,
          canHighlightOnMap,
        };
      })
      .filter((v) => Boolean(v.room) && Boolean(v.floor))
      .sort((a, b) => byStartAsc(a.schedule, b.schedule));
  }, [state.academicSchedules, lecturerId, courseById, roomById, floorById, meetingById]);
}

const TOPIC_LABELS: Record<string, string> = {
  normalisasi: "Normalisasi & denormalisasi",
  "query-plan": "Query plan & indeks",
  indeks: "Query plan & indeks",
  usability: "Usability testing",
  metode: "Metode penelitian pengguna",
  graph: "Graph traversal",
  bfs: "Graph traversal",
  dfs: "Graph traversal",
  ia: "Information architecture",
  navigasi: "Information architecture",
  "studi-kasus": "Studi kasus",
};

function topicLabel(tag: string): string {
  return TOPIC_LABELS[tag] ?? tag.replace(/-/g, " ");
}

/**
 * Insight kelas untuk dosen: agregat anonim.
 * Tidak mengekspos userId, pseudonym, NIM, atau isi balasan.
 */
export function useTopicInsights(lecturerId: string | null): TopicInsight[] {
  const { state } = useStore();
  const { courseById, meetingById } = useLookups();

  return useMemo(() => {
    if (!lecturerId) return [];
    const allowedMeetings = new Set(
      state.meetings
        .filter((m) => m.lecturerId === lecturerId || courseById.get(m.courseId)?.lecturerId === lecturerId)
        .map((m) => m.id),
    );

    const buckets = new Map<string, TopicInsight>();

    for (const post of state.posts) {
      if (!allowedMeetings.has(post.meetingId)) continue;
      const course = courseById.get(post.courseId);
      const meeting = meetingById.get(post.meetingId);
      if (!course || !meeting) continue;
      const replyCount = state.replies.filter((r) => r.postId === post.id).length;
      const tags = post.tags?.length ? post.tags : ["umum"];

      for (const tag of new Set(tags)) {
        const key = `${post.courseId}:${tag.toLowerCase()}`;
        const existing = buckets.get(key);
        const lastActivityAt = post.createdAt;
        if (existing) {
          existing.postCount += 1;
          existing.replyCount += replyCount;
          if (new Date(lastActivityAt) > new Date(existing.lastActivityAt)) {
            existing.lastActivityAt = lastActivityAt;
            existing.meetingId = meeting.id;
            existing.meetingNumber = meeting.meetingNumber;
          }
        } else {
          buckets.set(key, {
            topicKey: tag.toLowerCase(),
            label: topicLabel(tag.toLowerCase()),
            courseId: post.courseId,
            courseName: course.name,
            meetingId: meeting.id,
            meetingNumber: meeting.meetingNumber,
            postCount: 1,
            replyCount,
            lastActivityAt,
            acknowledged: false,
          });
        }
      }
    }

    return Array.from(buckets.values())
      .map((insight) => {
        const ack = state.acknowledgements.find(
          (a) =>
            a.lecturerId === lecturerId &&
            a.courseMeetingId === insight.meetingId &&
            a.topicKey === insight.topicKey,
        );
        return { ...insight, acknowledged: Boolean(ack), acknowledgementId: ack?.id };
      })
      .sort((a, b) => b.postCount + b.replyCount - (a.postCount + a.replyCount));
  }, [state.posts, state.replies, state.acknowledgements, state.meetings, lecturerId, courseById, meetingById]);
}