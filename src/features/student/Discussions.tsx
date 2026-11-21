import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Hash,
  MessageSquare,
  MessagesSquare,
  Presentation,
  Send,
  Video,
  Link2,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { DemoTag, PageHeader } from "../../components/common";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FieldError,
  Label,
  LinkButton,
  Select,
  TextArea,
  TextInput,
  cx,
} from "../../components/ui";
import type { AppNotification, DiscussionPost, DiscussionReply, ResourceType } from "../../domain/types";
import { longDate, relativeTime } from "../../lib/datetime";
import { useCurrentUser, useStore } from "../../store/AppStore";
import { useDiscussion, useDiscussions, useResources } from "../../store/selectors";

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

export function DiscussionFeedPage() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("all");
  const [meetingId, setMeetingId] = useState("all");
  const [tag, setTag] = useState<string | null>(null);
  const all = useDiscussions();

  const meetings = useMemo(
    () => state.meetings.filter((m) => courseId === "all" || m.courseId === courseId),
    [state.meetings, courseId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((post) => {
      if (courseId !== "all" && post.courseId !== courseId) return false;
      if (meetingId !== "all" && post.meetingId !== meetingId) return false;
      if (tag && !post.tags?.some((t) => t.toLowerCase() === tag)) return false;
      if (!q) return true;
      const haystack = [
        post.title ?? "",
        post.body,
        post.author.pseudonym,
        post.course.name,
        post.course.hashtag,
        post.meeting.topic,
        post.lecturerName ?? "",
        ...(post.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [all, query, courseId, meetingId, tag]);

  const activeFilters = query.trim() || courseId !== "all" || meetingId !== "all" || tag;

  function resetFilters() {
    setQuery("");
    setCourseId("all");
    setMeetingId("all");
    setTag(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Komunitas"
        title="Diskusi"
        description="Cari berdasarkan hashtag, mata kuliah, pertemuan, topik, atau nama dosen. Identitas mahasiswa tampil sebagai pseudonym."
        actions={
          <LinkButton to="/student/discussions/new" size="sm">
            <MessagesSquare size={14} aria-hidden /> Buat diskusi
          </LinkButton>
        }
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              aria-hidden
            />
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari #normalisasi, topik pertemuan, nama dosen…"
              aria-label="Cari diskusi"
              className="pl-9"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setMeetingId("all");
              }}
              aria-label="Filter mata kuliah"
            >
              <option value="all">Semua mata kuliah</option>
              {state.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              aria-label="Filter pertemuan"
            >
              <option value="all">Semua pertemuan</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  Pertemuan {m.meetingNumber} — {m.topic}
                </option>
              ))}
            </Select>
          </div>

          {activeFilters ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-ink-400">Filter aktif:</span>
              {tag ? (
                <button
                  type="button"
                  onClick={() => setTag(null)}
                  className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700"
                >
                  #{tag} <X size={10} aria-hidden />
                </button>
              ) : null}
              <button
                type="button"
                onClick={resetFilters}
                className="ml-1 text-[11px] font-semibold text-ink-500 underline-offset-2 hover:underline"
              >
                Reset filter
              </button>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink-500">
          {filtered.length} diskusi{activeFilters ? " cocok dengan filter" : " terbaru"}
        </p>
        <DemoTag label="Diskusi DEMO" />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Search size={20} aria-hidden />}
            title="Tidak ada diskusi yang cocok"
            description="Coba kata kunci lain, atau reset filter untuk melihat semua diskusi."
            action={
              <Button size="sm" variant="secondary" onClick={resetFilters}>
                Reset filter
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((post) => (
            <DiscussionCard key={post.id} post={post} onTagClick={setTag} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DiscussionCard({
  post,
  onTagClick,
}: {
  post: ReturnType<typeof useDiscussions>[number];
  onTagClick: (tag: string) => void;
}) {
  return (
    <Card as="li" className="overflow-hidden">
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="brand">{post.course.hashtag}</Badge>
          <Badge tone="neutral">Pertemuan {post.meeting.meetingNumber}</Badge>
          {post.tags?.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTagClick(t.toLowerCase())}
              className="inline-flex items-center gap-0.5 rounded-full border border-ink-200 px-2 py-0.5 text-[11px] font-semibold text-ink-600 hover:border-brand-300 hover:text-brand-700"
            >
              <Hash size={9} aria-hidden />
              {t}
            </button>
          ))}
        </div>

        <Link
          to={`/student/discussions/${post.id}`}
          className="mt-2.5 block text-sm font-bold leading-snug text-ink-900 hover:text-brand-700"
        >
          {post.title ?? post.body.slice(0, 70)}
        </Link>

        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-600">{post.body}</p>

        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-400">
          <span className="inline-flex items-center gap-1 font-semibold text-ink-600">
            <UserRound size={11} aria-hidden /> {post.author.pseudonym}
          </span>
          <span>·</span>
          <span>{post.course.name}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <BookOpen size={11} aria-hidden /> {post.meeting.topic}
          </span>
          {post.lecturerName ? (
            <>
              <span>·</span>
              <span>Dosen: {post.lecturerName}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-ink-100 bg-ink-50/50 px-4 py-2">
        <span className="text-[11px] text-ink-400">{relativeTime(post.lastActivityAt)}</span>
        <Link
          to={`/student/discussions/${post.id}`}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800"
        >
          <MessageSquare size={12} aria-hidden /> {post.replyCount} balasan
        </Link>
      </div>
    </Card>
  );
}

export function DiscussionThreadPage() {
  const { postId } = useParams();
  const discussion = useDiscussion(postId);
  const user = useCurrentUser();
  const { state, dispatch, toast } = useStore();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!discussion) {
    return (
      <Card>
        <EmptyState
          icon={<Search size={20} aria-hidden />}
          title="Diskusi tidak ditemukan"
          description="Diskusi mungkin sudah tidak ada pada data demo. Kembali ke feed untuk memilih diskusi lain."
          action={
            <LinkButton to="/student/discussions" size="sm">
              Kembali ke feed
            </LinkButton>
          }
        />
      </Card>
    );
  }

  const { post, course, meeting, authorPseudonym, lecturerName, replies } = discussion;
  const canReply = user?.role === "STUDENT";

  function submitReply(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    const text = body.trim();
    if (text.length < 3) {
      setError("Balasan minimal 3 karakter.");
      return;
    }
    if (text.length > 1200) {
      setError("Balasan maksimal 1200 karakter.");
      return;
    }
    setError(null);

    const reply: DiscussionReply = {
      id: `r-${Date.now().toString(36)}`,
      postId: post.id,
      authorUserId: user.id,
      body: text,
      createdAt: new Date().toISOString(),
    };

    const notification: AppNotification = {
      id: `n-${reply.id}`,
      recipientUserId: user.id,
      type: "DISCUSSION_REPLY",
      title: "Balasan kamu terkirim",
      body: `Kamu membalas “${post.title ?? post.body.slice(0, 40)}”.`,
      targetPath: `/student/discussions/${post.id}`,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: "ADD_REPLY", reply, notification });
    toast("success", "Balasan terkirim dan tersimpan di arsip pertemuan.");
    setBody("");
  }

  const archive = state.posts.filter((p) => p.meetingId === post.meetingId);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <div>
          <Link
            to="/student/discussions"
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-brand-700"
          >
            <ArrowLeft size={12} aria-hidden /> Semua diskusi
          </Link>

          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="brand">{course?.hashtag ?? "#umum"}</Badge>
              <Badge tone="neutral">Pertemuan {meeting?.meetingNumber ?? "—"}</Badge>
              {post.tags?.map((t) => (
                <Badge key={t} tone="neutral">
                  <Hash size={9} aria-hidden />
                  {t}
                </Badge>
              ))}
            </div>

            <h1 className="mt-2.5 text-lg font-extrabold leading-snug tracking-tight text-ink-900">
              {post.title ?? "Diskusi"}
            </h1>
            <p className="mt-1 text-[11px] text-ink-400">
              {authorPseudonym} · {longDate(post.createdAt)} · {course?.name}
            </p>

            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">{post.body}</p>

            <div className="mt-4 grid gap-2 rounded-xl bg-ink-50 px-3 py-2.5 text-[11px] sm:grid-cols-2">
              <p>
                <span className="font-semibold text-ink-500">Topik pertemuan: </span>
                <span className="text-ink-800">{meeting?.topic}</span>
              </p>
              <p>
                <span className="font-semibold text-ink-500">Dosen: </span>
                <span className="text-ink-800">{lecturerName ?? "Belum tersedia"}</span>
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            title={`${replies.length} balasan`}
            description="Arsip diskusi tersimpan per pertemuan."
            icon={<MessageSquare size={15} aria-hidden />}
          />
          {replies.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={18} aria-hidden />}
              title="Belum ada balasan"
              description="Jadilah yang pertama membalas diskusi ini."
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {replies.map((reply) => (
                <li key={reply.id} className="px-4 py-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-ink-700">
                    <UserRound size={11} aria-hidden /> {reply.author.pseudonym}
                    <span className="font-normal text-ink-400">· {relativeTime(reply.createdAt)}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-ink-700">
                    {reply.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Tulis balasan" icon={<Send size={15} aria-hidden />} />
          {canReply ? (
            <form onSubmit={submitReply} className="space-y-2 px-4 py-3" noValidate>
              <Label htmlFor="reply-body">Balasan</Label>
              <TextArea
                id="reply-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                invalid={Boolean(error)}
                placeholder="Bagikan pengalaman atau jawabanmu…"
                maxLength={1200}
              />
              {error ? <FieldError>{error}</FieldError> : null}
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] leading-relaxed text-ink-400">
                  Nama publik: <strong className="font-semibold text-ink-600">{authorPseudonym}</strong>{" "}
                  (pseudonym kamu sendiri akan dipakai saat membalas).
                </p>
                <Button type="submit" size="sm">
                  Kirim
                </Button>
              </div>
            </form>
          ) : (
            <div className="px-4 py-4">
              <p className="text-xs leading-relaxed text-ink-500">
                Dosen dapat membaca diskusi, tetapi tidak dapat membuat postingan atau balasan.
              </p>
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader
            title="Arsip pertemuan ini"
            description="Diskusi lain pada pertemuan yang sama"
            icon={<BookOpen size={15} aria-hidden />}
          />
          <ul className="divide-y divide-ink-100">
            {archive.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/student/discussions/${item.id}`}
                  className={cx(
                    "block px-4 py-2.5 text-xs leading-snug hover:bg-brand-50/60",
                    item.id === post.id ? "bg-brand-50/40 font-bold text-brand-700" : "text-ink-700",
                  )}
                >
                  {item.title ?? item.body.slice(0, 50)}
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <MeetingResourcesCard courseId={post.courseId} meetingId={post.meetingId} />
      </div>
    </div>
  );
}

export function MeetingResourcesCard({
  courseId,
  meetingId,
}: {
  courseId: string;
  meetingId: string;
}) {
  const resources = useResources(courseId, meetingId);
  return (
    <Card>
      <CardHeader
        title="Materi & sumber belajar"
        description="Hanya resource yang tersedia yang ditampilkan."
        icon={<Presentation size={15} aria-hidden />}
      />
      {resources.length === 0 ? (
        <EmptyState
          icon={<FileText size={18} aria-hidden />}
          title="Belum ada materi"
          description="Dosen belum mengunggah materi untuk pertemuan ini."
        />
      ) : (
        <ul className="divide-y divide-ink-100">
          {resources.map((resource) => {
            const Icon = RESOURCE_ICON[resource.type];
            return (
              <li key={resource.id} className="flex items-start gap-2.5 px-4 py-2.5">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon size={13} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-snug text-ink-800">{resource.title}</p>
                  {resource.description ? (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500">
                      {resource.description}
                    </p>
                  ) : null}
                  <Badge tone="neutral" className="mt-1">
                    {RESOURCE_LABEL[resource.type]}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function NewDiscussionPage() {
  const { state, dispatch, toast } = useStore();
  const user = useCurrentUser();
  const navigate = useNavigate();

  const [courseId, setCourseId] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const meetings = state.meetings.filter((m) => m.courseId === courseId);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;

    const nextErrors: Record<string, string> = {};
    if (!courseId) nextErrors.courseId = "Pilih mata kuliah.";
    if (!meetingId) nextErrors.meetingId = "Pilih pertemuan.";
    if (body.trim().length < 20) nextErrors.body = "Isi diskusi minimal 20 karakter.";
    if (body.trim().length > 2000) nextErrors.body = "Isi diskusi maksimal 2000 karakter.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const post: DiscussionPost = {
      id: `p-${Date.now().toString(36)}`,
      authorUserId: user.id,
      courseId,
      meetingId,
      title: title.trim() || undefined,
      body: body.trim(),
      tags: tags
        .split(",")
        .map((t) => t.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean)
        .slice(0, 5),
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: "ADD_POST", post });
    toast("success", "Diskusi dibuat. Kamu tampil dengan pseudonym.");
    navigate(`/student/discussions/${post.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/student/discussions"
        className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-brand-700"
      >
        <ArrowLeft size={12} aria-hidden /> Semua diskusi
      </Link>

      <Card>
        <CardHeader
          title="Buat diskusi baru"
          description="Diskusi selalu terikat pada satu pertemuan agar arsipnya rapi."
          icon={<MessagesSquare size={15} aria-hidden />}
          action={<DemoTag />}
        />

        <form onSubmit={submit} className="space-y-3 px-5 py-4" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="course">Mata kuliah</Label>
              <Select
                id="course"
                value={courseId}
                invalid={Boolean(errors.courseId)}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setMeetingId("");
                }}
              >
                <option value="">— Pilih —</option>
                {state.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <FieldError>{errors.courseId}</FieldError>
            </div>

            <div>
              <Label htmlFor="meeting">Pertemuan</Label>
              <Select
                id="meeting"
                value={meetingId}
                invalid={Boolean(errors.meetingId)}
                onChange={(e) => setMeetingId(e.target.value)}
                disabled={!courseId}
              >
                <option value="">{courseId ? "— Pilih —" : "Pilih mata kuliah dulu"}</option>
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    Pertemuan {m.meetingNumber} — {m.topic}
                  </option>
                ))}
              </Select>
              <FieldError>{errors.meetingId}</FieldError>
            </div>
          </div>

          <div>
            <Label htmlFor="title" hint="(opsional)">
              Judul singkat
            </Label>
            <TextInput
              id="title"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Batas aman denormalisasi"
            />
          </div>

          <div>
            <Label htmlFor="body">Isi diskusi</Label>
            <TextArea
              id="body"
              value={body}
              invalid={Boolean(errors.body)}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tulis pertanyaan atau temuanmu secara spesifik…"
              maxLength={2000}
              className="min-h-32"
            />
            <div className="flex items-center justify-between">
              <FieldError>{errors.body}</FieldError>
              <span className="ml-auto text-[11px] text-ink-400">{body.length}/2000</span>
            </div>
          </div>

          <div>
            <Label htmlFor="tags" hint="(pisahkan dengan koma, maks 5)">
              Topik internal
            </Label>
            <TextInput
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="normalisasi, studi-kasus"
            />
          </div>

          <p className="rounded-xl bg-brand-50 px-3 py-2.5 text-[11px] leading-relaxed text-brand-800">
            Diskusi ini akan tampil sebagai{" "}
            <strong className="font-bold">{user?.publicPseudonym ?? "pseudonym kamu"}</strong>. Nama
            asli dan NIM tidak pernah ditampilkan ke publik.
          </p>

          <Button type="submit" className="w-full">
            Publikasikan diskusi
          </Button>
        </form>
      </Card>
    </div>
  );
}