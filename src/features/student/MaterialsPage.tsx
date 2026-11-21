import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Link2,
  MessagesSquare,
  Presentation,
  Video,
} from "lucide-react";
import { DemoTag, PageHeader } from "../../components/common";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  LinkButton,
  Select,
  cx,
} from "../../components/ui";
import type { ResourceType } from "../../domain/types";
import { relativeTime } from "../../lib/datetime";
import { useStore } from "../../store/AppStore";
import { useDiscussions, useResources } from "../../store/selectors";

const RESOURCE_ICON: Record<ResourceType, typeof FileText> = {
  PDF: FileText,
  SLIDE: Presentation,
  VIDEO: Video,
  LINK: Link2,
  OTHER: FileText,
};

const RESOURCE_LABEL: Record<ResourceType, string> = {
  PDF: "PDF",
  SLIDE: "Slide",
  VIDEO: "Video",
  LINK: "Tautan",
  OTHER: "Berkas",
};

export function MaterialsPage() {
  const { state } = useStore();
  const [courseId, setCourseId] = useState(state.courses[0]?.id ?? "");
  const course = state.courses.find((c) => c.id === courseId);
  const meetings = useMemo(
    () =>
      state.meetings
        .filter((m) => m.courseId === courseId)
        .sort((a, b) => b.meetingNumber - a.meetingNumber),
    [state.meetings, courseId],
  );
  const [meetingId, setMeetingId] = useState<string>("");
  const activeMeetingId = meetingId || meetings[0]?.id || "";
  const activeMeeting = meetings.find((m) => m.id === activeMeetingId);

  const resources = useResources(courseId, activeMeetingId);
  const discussions = useDiscussions(courseId).filter((d) => d.meetingId === activeMeetingId);
  const courseResources = useResources(courseId);

  return (
    <div>
      <PageHeader
        eyebrow="Akademik"
        title="Materi kuliah"
        description="Alur Course → Meeting → materi kuliah, arsip diskusi, dan sumber belajar dosen. Hanya resource yang benar-benar tersedia yang ditampilkan."
        actions={<DemoTag label="Materi DEMO" />}
      />

      <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
        <div className="space-y-3">
          <Card className="p-3">
            <label htmlFor="course-select" className="mb-1.5 block text-xs font-semibold text-ink-700">
              Mata kuliah
            </label>
            <Select
              id="course-select"
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setMeetingId("");
              }}
            >
              {state.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {course ? (
              <div className="mt-2.5 space-y-1 text-[11px] text-ink-500">
                {course.code ? (
                  <p>
                    Kode: <span className="font-semibold text-ink-700">{course.code}</span>
                  </p>
                ) : null}
                <p>
                  Hashtag: <span className="font-semibold text-brand-700">{course.hashtag}</span>
                </p>
                <p>
                  Resource tercatat:{" "}
                  <span className="font-semibold text-ink-700">{courseResources.length}</span>
                </p>
              </div>
            ) : null}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Pertemuan" icon={<BookOpen size={15} aria-hidden />} />
            {meetings.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={18} aria-hidden />}
                title="Belum ada pertemuan"
                description="Mata kuliah ini belum memiliki data pertemuan pada demo."
              />
            ) : (
              <ul className="max-h-96 divide-y divide-ink-100 overflow-y-auto">
                {meetings.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setMeetingId(m.id)}
                      aria-current={m.id === activeMeetingId}
                      className={cx(
                        "flex w-full items-start gap-2 px-3.5 py-2.5 text-left transition-colors",
                        m.id === activeMeetingId
                          ? "bg-brand-50"
                          : "hover:bg-ink-50",
                      )}
                    >
                      <span
                        className={cx(
                          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                          m.id === activeMeetingId
                            ? "bg-brand-600 text-white"
                            : "bg-ink-100 text-ink-600",
                        )}
                      >
                        {m.meetingNumber}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cx(
                            "block text-[11px] font-semibold leading-snug",
                            m.id === activeMeetingId ? "text-brand-800" : "text-ink-700",
                          )}
                        >
                          {m.topic}
                        </span>
                        {m.date ? (
                          <span className="mt-0.5 block text-[10px] text-ink-400">{m.date}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {activeMeeting ? (
            <Card className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
                    Pertemuan {activeMeeting.meetingNumber}
                  </p>
                  <h2 className="mt-0.5 text-base font-extrabold tracking-tight text-ink-900">
                    {activeMeeting.topic}
                  </h2>
                  <p className="mt-1 text-[11px] text-ink-500">
                    {course?.name}
                    {activeMeeting.lecturerId
                      ? ` · ${state.users.find((u) => u.id === activeMeeting.lecturerId)?.fullName ?? ""}`
                      : ""}
                  </p>
                </div>
                <LinkButton
                  to={`/student/discussions?course=${courseId}`}
                  size="sm"
                  variant="secondary"
                >
                  <MessagesSquare size={13} aria-hidden /> Lihat diskusi
                </LinkButton>
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon={<BookOpen size={20} aria-hidden />}
                title="Pilih pertemuan"
                description="Pilih salah satu pertemuan di samping untuk melihat materi dan arsipnya."
              />
            </Card>
          )}

          <Card>
            <CardHeader
              title="Materi kuliah"
              description={activeMeeting ? `Untuk pertemuan ${activeMeeting.meetingNumber}` : undefined}
              icon={<Presentation size={15} aria-hidden />}
            />
            {resources.length === 0 ? (
              <EmptyState
                icon={<FileText size={18} aria-hidden />}
                title="Belum ada materi"
                description="Dosen belum mengunggah materi untuk pertemuan ini. Daftar tidak diisi dengan asumsi."
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {resources.map((resource) => {
                  const Icon = RESOURCE_ICON[resource.type];
                  return (
                    <li key={resource.id} className="flex items-start gap-2.5 px-4 py-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Icon size={14} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold leading-snug text-ink-800">{resource.title}</p>
                        {resource.description ? (
                          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500">
                            {resource.description}
                          </p>
                        ) : null}
                        <div className="mt-1 flex items-center gap-1.5">
                          <Badge tone="neutral">{RESOURCE_LABEL[resource.type]}</Badge>
                          <span className="text-[10px] text-ink-400">
                            {resource.url ? "Tautan tersedia" : "Berkas demo (tanpa unduhan)"}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Arsip diskusi"
              description="Diskusi yang lahir dari pertemuan ini"
              icon={<MessagesSquare size={15} aria-hidden />}
            />
            {discussions.length === 0 ? (
              <EmptyState
                icon={<MessagesSquare size={18} aria-hidden />}
                title="Belum ada diskusi"
                description="Belum ada pertanyaan untuk pertemuan ini."
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {discussions.map((d) => (
                  <li key={d.id}>
                    <Link
                      to={`/student/discussions/${d.id}`}
                      className="flex items-start justify-between gap-3 px-4 py-2.5 hover:bg-brand-50/50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-ink-800">
                          {d.title ?? d.body.slice(0, 60)}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-ink-400">
                          {d.author.pseudonym} · {d.replyCount} balasan ·{" "}
                          {relativeTime(d.lastActivityAt)}
                        </span>
                      </span>
                      <ChevronRight size={14} className="mt-1 shrink-0 text-ink-300" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}