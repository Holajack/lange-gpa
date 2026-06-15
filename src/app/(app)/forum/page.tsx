"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Mascot } from "@/components/Mascot";
import { Card, Pill, Tag } from "@/components/ui";
import { useApp } from "@/lib/store";
import { langByCode, LANGUAGES } from "@/lib/languages";
import { FORUM_SEED, NURTURERS } from "@/lib/nurturers";
import type { ForumPost, LangCode } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Category metadata — labels route through t() so chips follow immersion */
/* ------------------------------------------------------------------ */

type Category = ForumPost["category"];
type CatFilter = Category | "all";

/** `labelKey` resolves through t() at render time so chips/options follow immersion. */
const CATEGORIES: { id: CatFilter; emoji: string; labelKey: string; color: string }[] = [
  { id: "all", emoji: "✨", labelKey: "frmCatAll", color: "#7c5cff" },
  { id: "find-nurturer", emoji: "🔍", labelKey: "frmCatFindNurturer", color: "#ff8a1e" },
  { id: "phase-help", emoji: "🪜", labelKey: "frmCatPhaseHelp", color: "#7c5cff" },
  { id: "wins", emoji: "🎉", labelKey: "frmCatWins", color: "#b8f03c" },
  { id: "culture", emoji: "🏮", labelKey: "frmCatCulture", color: "#ff5d5d" },
  { id: "tools", emoji: "🧰", labelKey: "frmCatTools", color: "#ffd234" },
];

const catMeta = (id: Category) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

const GROWER_COLOR = "#7c5cff";
const NURTURER_COLOR = "#ff8a1e";

/** Seed replies mark nurturers as "Name (nurturer)" — reuse that convention. */
const replyIsNurturer = (author: string) => /\(nurturer\)/i.test(author);

const accentFor = (cat: Category): string | undefined =>
  cat === "wins" ? "#b8f03c" : cat === "find-nurturer" ? "#ff8a1e" : undefined;

const inputCls =
  "w-full rounded-2xl border border-line bg-white/6 px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-violet/60 focus:bg-white/8";

const selectCls =
  "rounded-full border border-line bg-white/6 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-violet/60 [&>option]:bg-raised [&>option]:text-ink";

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ForumPage() {
  const { profile, t } = useApp();

  const userName = profile?.name?.trim() ? profile.name : "You";
  const userRole = profile?.role ?? "grower";
  const userIsNurturer = userRole === "nurturer";
  const userColor = userIsNurturer ? NURTURER_COLOR : GROWER_COLOR;

  /* ---- local forum state ---- */
  const [posts, setPosts] = useState<ForumPost[]>(FORUM_SEED);
  const [cat, setCat] = useState<CatFilter>("all");
  const [langFilter, setLangFilter] = useState<LangCode[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [openThreads, setOpenThreads] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  /* ---- composer state ---- */
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [newCat, setNewCat] = useState<Category>("wins");
  const [newLang, setNewLang] = useState<LangCode>(profile?.targetLang ?? "es");

  /* Stagger only on the first paint, not on every filter change. */
  const introDone = useRef(false);

  const postLangs = useMemo(() => {
    const seen: LangCode[] = [];
    for (const p of posts) if (!seen.includes(p.lang)) seen.push(p.lang);
    return seen;
  }, [posts]);

  const visible = useMemo(
    () =>
      posts.filter(
        (p) =>
          (cat === "all" || p.category === cat) &&
          (langFilter.length === 0 || langFilter.includes(p.lang))
      ),
    [posts, cat, langFilter]
  );

  const onlineNurturers = NURTURERS.filter((n) => n.online);

  /* ---- actions ---- */
  const toggleLang = (code: LangCode) =>
    setLangFilter((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleThread = (id: string) =>
    setOpenThreads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submitPost = () => {
    if (!title.trim() || !body.trim()) return;
    const post: ForumPost = {
      id: `up-${Date.now()}`,
      author: userName,
      authorRole: userRole,
      lang: newLang,
      category: newCat,
      title: title.trim(),
      body: body.trim(),
      replies: [],
      likes: 0,
      ago: "now",
    };
    setPosts((prev) => [post, ...prev]);
    setTitle("");
    setBody("");
    setComposerOpen(false);
  };

  const submitReply = (postId: string) => {
    const text = (drafts[postId] ?? "").trim();
    if (!text) return;
    const author = userIsNurturer ? `${userName} (nurturer)` : userName;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, replies: [...p.replies, { author, body: text, ago: "now" }] } : p
      )
    );
    setDrafts((prev) => ({ ...prev, [postId]: "" }));
    setOpenThreads((prev) => new Set(prev).add(postId));
  };

  return (
    <div className="relative">
      {/* ambient village glow */}
      <div className="orb left-[35%] top-[120px] h-[260px] w-[260px] bg-lime/10" />

      {/* ------------------------------ header ------------------------------ */}
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.9, 0.3, 1] }}
        className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 pt-4"
      >
        <div>
          <div className="mb-2 flex items-center gap-2 text-2xl" aria-hidden>
            <span className="floaty inline-block">🏘️</span>
            <span className="floaty inline-block" style={{ animationDelay: "0.4s" }}>🌱</span>
            <span className="floaty inline-block" style={{ animationDelay: "0.8s" }}>💬</span>
          </div>
          <h1 className="headline text-4xl lg:text-5xl">{t("forumTitle")}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted lg:text-base">{t("forumSub")}</p>
        </div>

        <div className="flex items-center gap-5">
          {/* who's around the fire right now */}
          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex -space-x-2.5">
              {onlineNurturers.slice(0, 5).map((n) => (
                <Avatar key={n.id} name={n.name} color={n.color} size={34} ring />
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className="pulsedot h-2 w-2 rounded-full bg-lime" />
              {onlineNurturers.length} {t("online")}
            </div>
          </div>

          <Pill
            onClick={() => setComposerOpen((v) => !v)}
            className="bg-violet px-6 py-3 text-sm font-semibold text-white"
          >
            {composerOpen ? <X size={16} /> : <Plus size={16} />}
            {t("newPost")}
          </Pill>
        </div>
      </motion.header>

      {/* ------------------------------ filters ------------------------------ */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.9, 0.3, 1] }}
        className="mt-7 flex flex-wrap items-center gap-2"
      >
        {CATEGORIES.map((c) => {
          const active = cat === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              aria-pressed={active}
              className={`pill px-4 py-2 text-sm font-medium transition-colors ${
                active ? "bg-violet text-white" : "bg-white/6 text-muted hover:bg-white/10 hover:text-ink"
              }`}
            >
              <span aria-hidden>{c.emoji}</span> {t(c.labelKey)}
            </button>
          );
        })}

        <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />

        {postLangs.map((code) => {
          const lang = langByCode(code);
          const active = langFilter.includes(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggleLang(code)}
              aria-pressed={active}
              title={lang.name}
              className={`pill border px-3.5 py-2 text-sm transition-colors ${
                active
                  ? "border-violet/60 bg-violet/20 text-ink"
                  : "border-transparent bg-white/6 text-muted hover:bg-white/10"
              }`}
            >
              <span aria-hidden>{lang.flag}</span>
              <span className="text-xs font-semibold uppercase tracking-wide">{code}</span>
            </button>
          );
        })}
      </motion.div>

      {/* ------------------------------ composer ------------------------------ */}
      <AnimatePresence initial={false}>
        {composerOpen && (
          <motion.div
            key="composer"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.2, 0.9, 0.3, 1] }}
            className="overflow-hidden"
          >
            <Card className="mt-6 p-6">
              <div className="flex items-start gap-4">
                <div className="hidden sm:block">
                  <Avatar name={userName} color={userColor} size={46} ring />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("frmTitlePlaceholder")}
                    maxLength={120}
                    className={`${inputCls} font-display text-base font-bold`}
                  />
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={t("frmBodyPlaceholder")}
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value as Category)}
                      aria-label="Category"
                      className={selectCls}
                    >
                      {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.emoji} {t(c.labelKey)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newLang}
                      onChange={(e) => setNewLang(e.target.value as LangCode)}
                      aria-label="Language"
                      className={selectCls}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.name}
                        </option>
                      ))}
                    </select>
                    <div className="w-full sm:ml-auto sm:w-auto">
                      <Pill
                        onClick={submitPost}
                        disabled={!title.trim() || !body.trim()}
                        className="w-full bg-lime px-6 py-2.5 text-sm font-semibold text-canvas sm:w-auto"
                      >
                        {t("newPost")} ✨
                      </Pill>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------ posts ------------------------------ */}
      <div className="mt-6 flex flex-col gap-5">
        <AnimatePresence initial={true} mode="popLayout">
          {visible.map((post, i) => (
            <motion.article
              key={post.id}
              layout
              initial={{ opacity: 0, y: 26, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
              transition={{
                duration: 0.5,
                delay: introDone.current ? 0 : 0.15 + i * 0.07,
                ease: [0.2, 0.9, 0.3, 1],
              }}
              onAnimationComplete={() => {
                introDone.current = true;
              }}
            >
              <PostCard
                post={post}
                liked={liked.has(post.id)}
                threadOpen={openThreads.has(post.id)}
                draft={drafts[post.id] ?? ""}
                onLike={() => toggleLike(post.id)}
                onToggleThread={() => toggleThread(post.id)}
                onDraft={(v) => setDrafts((prev) => ({ ...prev, [post.id]: v }))}
                onReply={() => submitReply(post.id)}
                userName={userName}
                userColor={userColor}
                replyLabel={t("reply")}
                replyPlaceholder={t("frmReplyPlaceholder")}
                catLabel={t(catMeta(post.category).labelKey)}
                roleLabel={post.authorRole === "nurturer" ? t("nurturerWord") : t("student")}
              />
            </motion.article>
          ))}
        </AnimatePresence>

        {/* empty state */}
        {visible.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.9, 0.3, 1] }}
          >
            <Card className="flex flex-col items-center gap-4 px-8 py-14 text-center">
              <Mascot size={120} mood="think" float />
              <p className="headline text-2xl">{t("frmEmptyTitle")}</p>
              <p className="max-w-sm text-sm text-muted">{t("frmEmptyBody")}</p>
              <Pill
                onClick={() => {
                  setCat("all");
                  setLangFilter([]);
                  setComposerOpen(true);
                }}
                className="bg-violet px-6 py-3 text-sm font-semibold text-white"
              >
                <Plus size={16} /> {t("newPost")}
              </Pill>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Post card                                                           */
/* ------------------------------------------------------------------ */

function PostCard({
  post,
  liked,
  threadOpen,
  draft,
  onLike,
  onToggleThread,
  onDraft,
  onReply,
  userName,
  userColor,
  replyLabel,
  replyPlaceholder,
  catLabel,
  roleLabel,
}: {
  post: ForumPost;
  liked: boolean;
  threadOpen: boolean;
  draft: string;
  onLike: () => void;
  onToggleThread: () => void;
  onDraft: (v: string) => void;
  onReply: () => void;
  userName: string;
  userColor: string;
  replyLabel: string;
  replyPlaceholder: string;
  catLabel: string;
  roleLabel: string;
}) {
  const lang = langByCode(post.lang);
  const meta = catMeta(post.category);
  const accent = accentFor(post.category);
  const isNurturer = post.authorRole === "nurturer";
  const avatarColor = isNurturer ? NURTURER_COLOR : GROWER_COLOR;
  const likeCount = post.likes + (liked ? 1 : 0);

  return (
    <Card hover className="relative overflow-hidden p-6 lg:p-7">
      {/* category accent: wins → lime, find-nurturer → orange */}
      {accent && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: `linear-gradient(180deg, ${accent}cc, ${accent}33)` }}
        />
      )}
      <div>
        {/* meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Avatar name={post.author} color={avatarColor} ring />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-sm font-bold">{post.author}</span>
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: `${avatarColor}26`, color: avatarColor }}
              >
                {roleLabel}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
              <span aria-hidden>{lang.flag}</span>
              <span>{lang.name}</span>
              <span aria-hidden>·</span>
              <span>{post.ago}</span>
            </div>
          </div>
          <Tag className="ml-auto">
            <span aria-hidden>{meta.emoji}</span>
            <span style={{ color: meta.color }}>{catLabel}</span>
          </Tag>
        </div>

        {/* content */}
        <h2 className="headline mt-4 text-xl lg:text-2xl">{post.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/85 lg:text-[15px]">{post.body}</p>

        {/* footer */}
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={onLike}
            aria-pressed={liked}
            aria-label="Like"
            className={`pill px-4 py-2 text-sm transition-colors ${
              liked ? "bg-coral/20 text-ink" : "bg-white/6 text-muted hover:bg-white/10"
            }`}
          >
            <span key={likeCount} className="popin inline-block" aria-hidden>
              {liked ? "❤️" : "🤍"}
            </span>
            <span className="font-semibold tabular-nums">{likeCount}</span>
          </button>

          <button
            type="button"
            onClick={onToggleThread}
            aria-expanded={threadOpen}
            className={`pill px-4 py-2 text-sm transition-colors ${
              threadOpen ? "bg-violet/20 text-ink" : "bg-white/6 text-muted hover:bg-white/10"
            }`}
          >
            <span aria-hidden>💬</span>
            <span className="font-semibold tabular-nums">{post.replies.length}</span>
          </button>
        </div>

        {/* thread */}
        <AnimatePresence initial={false}>
          {threadOpen && (
            <motion.div
              key="thread"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.32, ease: [0.2, 0.9, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5">
                {post.replies.map((r, idx) => {
                  const rColor = replyIsNurturer(r.author) ? NURTURER_COLOR : GROWER_COLOR;
                  return (
                    <motion.div
                      key={`${post.id}-r${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <Avatar name={r.author} color={rColor} size={30} />
                      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-white/5 px-4 py-3">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-display text-xs font-bold" style={{ color: rColor }}>
                            {r.author}
                          </span>
                          <span className="text-[11px] text-muted">{r.ago}</span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-ink/85">{r.body}</p>
                      </div>
                    </motion.div>
                  );
                })}

                {/* reply composer */}
                <form
                  className="mt-1 flex flex-wrap items-center gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onReply();
                  }}
                >
                  <Avatar name={userName} color={userColor} size={30} />
                  <input
                    value={draft}
                    onChange={(e) => onDraft(e.target.value)}
                    placeholder={replyPlaceholder}
                    className={`${inputCls} flex-1 min-w-[140px] py-2.5`}
                  />
                  <Pill
                    type="submit"
                    disabled={!draft.trim()}
                    className="w-full shrink-0 bg-violet px-5 py-2.5 text-sm font-semibold text-white sm:w-auto"
                  >
                    {replyLabel}
                  </Pill>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
