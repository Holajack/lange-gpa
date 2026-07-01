"use client";

/**
 * /events — language parties (Stage E). A Tandem/Meetup-style group layer:
 * browse upcoming parties, host your own, RSVP, and look back at the ones you've
 * been to (the "Past" tab doubles as your session history). Everything is real:
 * parties + guests live in Convex (see convex/parties.ts), targeted by the
 * opaque party id; the host's Clerk id never reaches the client.
 */

import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, Crown, Plus, Users, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { useParties, type CreatePartyInput, type Party } from "@/lib/parties";
import { LANGUAGES, langByCode } from "@/lib/languages";
import { Avatar } from "@/components/Avatar";
import { Card, Tag } from "@/components/ui";
import type { LangCode } from "@/lib/types";

const GRACE_MS = 30 * 60 * 1000; // a party stays "live" for 30 min after it starts
const KIND_KEY: Record<string, string> = {
  party: "evKindParty",
  club: "evKindClub",
  practice: "evKindPractice",
};
const KIND_EMOJI: Record<string, string> = { party: "🎉", club: "👥", practice: "🗣️" };
const DURATIONS = [30, 45, 60, 90];

/** Local <input type="datetime-local"> string for a Date. */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Tab = "upcoming" | "mine" | "past";

export default function EventsPage() {
  const { profile, uiLang, t } = useApp();
  const { upcoming, mine, create, join, leave, cancel } = useParties(null);

  const [tab, setTab] = useState<Tab>("upcoming");
  const [langFilter, setLangFilter] = useState<LangCode | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fmtDay = useMemo(
    () => new Intl.DateTimeFormat(uiLang, { weekday: "short", month: "short", day: "numeric" }),
    [uiLang]
  );
  const fmtTime = useMemo(
    () => new Intl.DateTimeFormat(uiLang, { hour: "numeric", minute: "2-digit" }),
    [uiLang]
  );

  if (!profile) return null;
  const now = Date.now();

  /** Languages that actually have an upcoming party, for the filter chips. */
  const langsPresent = Array.from(new Set(upcoming.map((p) => p.lang))) as LangCode[];
  const shownUpcoming = upcoming.filter((p) => !langFilter || p.lang === langFilter);

  const mineUpcoming = mine.filter((p) => p.startsAt + GRACE_MS > now);
  const minePast = mine.filter((p) => p.startsAt + GRACE_MS <= now);

  const when = (p: Party) => `${fmtDay.format(new Date(p.startsAt))} · ${fmtTime.format(new Date(p.startsAt))}`;

  const submitCreate = async (input: CreatePartyInput) => {
    await create(input);
    setShowCreate(false);
    setTab("mine");
  };

  /* ---------- one party card ---------- */
  const PartyCard = ({ p }: { p: Party }) => {
    const lang = langByCode(p.lang as LangCode);
    const cancelled = p.status === "cancelled";
    const live = !cancelled && now >= p.startsAt && now < p.startsAt + GRACE_MS;
    const past = now >= p.startsAt + GRACE_MS;
    const actionable = !cancelled && !past;
    const full = p.capacity != null && p.guestCount >= p.capacity;

    return (
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card hover className={`flex h-full flex-col gap-3 p-5 ${cancelled ? "opacity-60" : ""}`}>
          {/* top: language + kind + status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/6 px-2.5 py-1 text-xs font-semibold">
              {lang.flag} {lang.nativeName}
            </span>
            <Tag className="px-2.5 py-1 text-[11px]">
              {KIND_EMOJI[p.kind] ?? "🎉"} {t(KIND_KEY[p.kind] ?? "evKindParty")}
            </Tag>
            {live && (
              <span className="ml-auto flex items-center gap-1.5 rounded-full bg-mint/15 px-2.5 py-1 text-[11px] font-bold text-mint">
                <span className="pulsedot h-1.5 w-1.5 rounded-full bg-mint" /> {t("evLive")}
              </span>
            )}
            {cancelled && (
              <span className="ml-auto rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-muted">
                {t("evCancelled")}
              </span>
            )}
          </div>

          {/* title */}
          <h3 className="headline text-xl leading-tight">{p.title}</h3>

          {/* when */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} strokeWidth={2.5} /> {when(p)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} strokeWidth={2.5} /> {p.durationMin} {t("minutes")}
            </span>
          </div>

          {/* host */}
          <p className="flex items-center gap-1.5 text-xs text-muted">
            {p.iAmHost ? (
              <>
                <Crown size={13} strokeWidth={2.5} className="text-orange" /> {t("evYouHost")}
              </>
            ) : (
              <>
                <Crown size={13} strokeWidth={2.5} className="text-muted/70" />{" "}
                {t("evHostedBy").replace("{name}", p.hostName)}
              </>
            )}
          </p>

          {/* topic */}
          {p.topic && <p className="text-sm italic leading-relaxed text-muted">“{p.topic}”</p>}

          {/* footer: who's going + action */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {p.guests.slice(0, 5).map((g, i) => (
                  <span key={i} className="rounded-full ring-2 ring-raised">
                    <Avatar name={g.name} color={g.isHost ? "#ff8a1e" : "#7c5cff"} size={26} src={g.photo} />
                  </span>
                ))}
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-muted">
                <Users size={13} strokeWidth={2.5} />
                {p.guestCount}
                {p.capacity != null ? `/${p.capacity}` : ""} {t("evGoing")}
              </span>
            </div>

            {p.iAmHost ? (
              actionable ? (
                <button
                  type="button"
                  onClick={() => void cancel(p.id)}
                  className="pill bg-white/8 px-4 py-1.5 text-xs font-semibold text-muted hover:text-ink"
                >
                  {t("evCancelParty")}
                </button>
              ) : null
            ) : p.iAmGoing ? (
              actionable ? (
                <div className="flex items-center gap-2">
                  <span className="pill bg-lime/15 px-3 py-1.5 text-xs font-bold text-lime">✓ {t("evJoined")}</span>
                  <button
                    type="button"
                    onClick={() => void leave(p.id)}
                    className="pill bg-white/8 px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink"
                  >
                    {t("evLeave")}
                  </button>
                </div>
              ) : (
                <span className="pill bg-lime/15 px-3 py-1.5 text-xs font-bold text-lime">✓ {t("evJoined")}</span>
              )
            ) : actionable ? (
              full ? (
                <span className="pill bg-white/8 px-4 py-1.5 text-xs font-semibold text-muted">{t("evFull")}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => void join(p.id)}
                  className="pill bg-violet px-4 py-1.5 text-xs font-bold text-white"
                  style={{ boxShadow: "var(--shadow-glow-violet)" }}
                >
                  {t("evJoin")}
                </button>
              )
            ) : null}
          </div>
        </Card>
      </motion.div>
    );
  };

  const Empty = ({ msg }: { msg: string }) => (
    <Card className="col-span-full flex flex-col items-center gap-4 p-10 text-center">
      <span className="text-4xl">🎉</span>
      <p className="max-w-sm text-sm text-muted">{msg}</p>
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="pill bg-orange px-5 py-2.5 text-sm font-bold text-canvas"
        style={{ boxShadow: "var(--shadow-glow-orange)" }}
      >
        <Plus size={15} strokeWidth={2.75} className="mr-1 inline" /> {t("evHost")}
      </button>
    </Card>
  );

  const grid = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="space-y-6">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="headline text-4xl lg:text-5xl">{t("events")}</h1>
          <p className="mt-2 text-sm text-muted">🎈 {t("evSub")}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="pill bg-orange px-6 py-3 font-semibold text-canvas"
          style={{ boxShadow: "var(--shadow-glow-orange)" }}
        >
          <Plus size={17} strokeWidth={2.75} className="mr-1.5 inline" /> {t("evHost")}
        </button>
      </motion.div>

      {/* tabs */}
      <div className="inline-flex rounded-full bg-raised-2 p-1">
        {(["upcoming", "mine", "past"] as Tab[]).map((tk) => (
          <button
            key={tk}
            type="button"
            onClick={() => setTab(tk)}
            className={`pill px-5 py-2 text-sm font-semibold transition ${
              tab === tk ? "bg-violet text-white shadow-glow-violet" : "text-muted hover:text-ink"
            }`}
          >
            {t(tk === "upcoming" ? "evUpcoming" : tk === "mine" ? "evMine" : "evPast")}
          </button>
        ))}
      </div>

      {/* language filter — upcoming only */}
      {tab === "upcoming" && langsPresent.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLangFilter(null)}
            className={`pill px-4 py-1.5 text-xs font-semibold ${
              langFilter === null ? "bg-violet text-white" : "bg-raised-2 text-muted hover:text-ink"
            }`}
          >
            🌍 {t("evAllLangs")}
          </button>
          {langsPresent.map((code) => {
            const l = langByCode(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLangFilter(code)}
                className={`pill px-4 py-1.5 text-xs font-semibold ${
                  langFilter === code ? "bg-violet text-white" : "bg-raised-2 text-muted hover:text-ink"
                }`}
              >
                {l.flag} {l.nativeName}
              </button>
            );
          })}
        </div>
      )}

      {/* lists */}
      {tab === "upcoming" && (
        <div className={grid}>
          {shownUpcoming.length === 0 ? (
            <Empty msg={t("evNoUpcoming")} />
          ) : (
            shownUpcoming.map((p) => <PartyCard key={p.id} p={p} />)
          )}
        </div>
      )}

      {tab === "mine" && (
        <div className="space-y-4">
          {mine.length === 0 ? (
            <div className={grid}>
              <Empty msg={t("evNoMine")} />
            </div>
          ) : (
            <>
              {mineUpcoming.length > 0 && (
                <div className={grid}>
                  {mineUpcoming.map((p) => (
                    <PartyCard key={p.id} p={p} />
                  ))}
                </div>
              )}
              {minePast.length > 0 && (
                <>
                  <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("evPast")}</p>
                  <div className={grid}>
                    {minePast.map((p) => (
                      <PartyCard key={p.id} p={p} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {tab === "past" && (
        <div className={grid}>
          {minePast.length === 0 ? (
            <Empty msg={t("evNoPast")} />
          ) : (
            minePast.map((p) => <PartyCard key={p.id} p={p} />)
          )}
        </div>
      )}

      {/* create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreatePartyModal
            t={t}
            defaultLang={profile.targetLang}
            onClose={() => setShowCreate(false)}
            onCreate={submitCreate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================ *
 *  Host-a-party modal
 * ================================================================ */
function CreatePartyModal({
  t,
  defaultLang,
  onClose,
  onCreate,
}: {
  t: (key: string) => string;
  defaultLang: LangCode;
  onClose: () => void;
  onCreate: (input: CreatePartyInput) => Promise<void>;
}) {
  const defaultStart = useMemo(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    return toLocalInput(d);
  }, []);

  const [title, setTitle] = useState("");
  const [lang, setLang] = useState<LangCode>(defaultLang);
  const [kind, setKind] = useState("party");
  const [whenStr, setWhenStr] = useState(defaultStart);
  const [durationMin, setDurationMin] = useState(60);
  const [capacity, setCapacity] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);

  const minWhen = useMemo(() => toLocalInput(new Date()), []);
  const startsAt = new Date(whenStr).getTime();
  const valid = title.trim().length > 0 && Number.isFinite(startsAt) && startsAt > Date.now() - 5 * 60 * 1000;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      const cap = capacity.trim() ? Math.max(2, parseInt(capacity, 10) || 0) : undefined;
      await onCreate({
        title: title.trim(),
        topic: topic.trim() || undefined,
        lang,
        kind,
        startsAt,
        durationMin,
        capacity: cap && cap > 0 ? cap : undefined,
      });
    } catch {
      setBusy(false);
    }
  };

  const fieldLabel = "text-xs font-bold uppercase tracking-wider text-muted";
  const fieldInput =
    "w-full rounded-2xl border border-line bg-white/5 px-4 py-2.5 text-sm text-ink caret-violet outline-none transition-colors placeholder:text-white/25 focus:border-violet";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("evCreateTitle")}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="card relative max-h-[90vh] w-full max-w-md overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="orb right-[-60px] top-[-60px] h-[160px] w-[160px] bg-orange/15" />
        <button
          type="button"
          aria-label={t("cancel")}
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-white/10 hover:text-ink"
        >
          <X size={18} />
        </button>

        <h2 className="headline relative text-2xl">🎈 {t("evCreateTitle")}</h2>

        <form onSubmit={submit} className="relative mt-5 space-y-4">
          {/* title */}
          <div className="space-y-1.5">
            <label className={fieldLabel}>{t("evNameLabel")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("evNamePlaceholder")}
              maxLength={80}
              autoFocus
              className={fieldInput}
            />
          </div>

          {/* language + kind */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={fieldLabel}>{t("evLangLabel")}</label>
              <select value={lang} onChange={(e) => setLang(e.target.value as LangCode)} className={fieldInput}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.nativeName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={fieldLabel}>{t("evKindLabel")}</label>
              <select value={kind} onChange={(e) => setKind(e.target.value)} className={fieldInput}>
                <option value="party">🎉 {t("evKindParty")}</option>
                <option value="club">👥 {t("evKindClub")}</option>
                <option value="practice">🗣️ {t("evKindPractice")}</option>
              </select>
            </div>
          </div>

          {/* when + duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={fieldLabel}>{t("evWhenLabel")}</label>
              <input
                type="datetime-local"
                value={whenStr}
                min={minWhen}
                onChange={(e) => setWhenStr(e.target.value)}
                className={fieldInput}
              />
            </div>
            <div className="space-y-1.5">
              <label className={fieldLabel}>{t("evDurationLabel")}</label>
              <select
                value={durationMin}
                onChange={(e) => setDurationMin(parseInt(e.target.value, 10))}
                className={fieldInput}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} {t("minutes")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* capacity */}
          <div className="space-y-1.5">
            <label className={fieldLabel}>{t("evCapacityLabel")}</label>
            <input
              type="number"
              min={2}
              max={200}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder={t("evCapacityPlaceholder")}
              className={fieldInput}
            />
          </div>

          {/* topic */}
          <div className="space-y-1.5">
            <label className={fieldLabel}>{t("evTopicLabel")}</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("evTopicPlaceholder")}
              maxLength={280}
              rows={2}
              className={`${fieldInput} resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={!valid || busy}
            className="pill flex w-full justify-center bg-violet px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
            style={{ boxShadow: "var(--shadow-glow-violet)" }}
          >
            {t("evCreateBtn")}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
