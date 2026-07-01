"use client";

/**
 * /profile — the grower's own account page. This is where the nav profile
 * pill leads (NOT onboarding): everything you told Nuri, shown back to you
 * and editable, plus Clerk account management (password, email, security)
 * and sign-out. Nothing here re-asks you anything — onboarding answers are
 * already saved (localStorage + Convex via CloudProfileBridge); "Edit
 * profile" reopens the wizard pre-filled if you want to change something.
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Globe2, LogOut, MapPin, Pencil, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { langByCode } from "@/lib/languages";
import { interestById, motivationById, paceByMinutes } from "@/lib/onboardingOptions";
import { Avatar } from "@/components/Avatar";
import { Card, Tag } from "@/components/ui";

const CLERK_ON = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** Clerk's full account UI (password / email / security), loaded client-only. */
const ClerkUserProfile = dynamic(
  () => import("@clerk/nextjs").then((m) => m.UserProfile),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet border-t-transparent" />
      </div>
    ),
  }
);

/** Account & security — only when Clerk is configured (keyless demo hides it). */
function AccountPanel({ t }: { t: (key: string) => string }) {
  // useClerk is safe here: AccountPanel only mounts when Clerk is configured
  // (CLERK_ON), so the ClerkProvider is present in the tree.
  const { signOut } = useClerk();
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="headline flex items-center gap-2 text-xl">
          🔐 {t("prfAccountSecurity")}
        </h2>
        <button
          type="button"
          onClick={() => void signOut({ redirectUrl: "/" })}
          className="pill flex items-center gap-2 bg-white/6 px-4 py-2 text-sm font-semibold text-muted hover:text-ink"
        >
          <LogOut size={15} /> {t("prfSignOut")}
        </button>
      </div>
      <div className="overflow-x-auto">
        <ClerkUserProfile routing="hash" />
      </div>
    </Card>
  );
}

/** Editable Tandem-style profile fields — shown to others when they tap you. */
function AboutYouCard() {
  const { profile, updateProfile, t } = useApp();
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [goals, setGoals] = useState(profile?.goals ?? "");
  const [idealPartner, setIdealPartner] = useState(profile?.idealPartner ?? "");
  const [certs, setCerts] = useState((profile?.certificates ?? []).join(", "));
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateProfile({
      bio: bio.trim() || undefined,
      goals: goals.trim() || undefined,
      idealPartner: idealPartner.trim() || undefined,
      certificates: certs
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const area = (label: string, value: string, set: (v: string) => void, rows: number) => (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-widest text-muted">{label}</span>
      <textarea
        value={value}
        onChange={(e) => set(e.target.value)}
        rows={rows}
        className="mt-2 w-full resize-none rounded-xl border border-line bg-white/5 px-4 py-2.5 text-sm text-ink caret-violet outline-none transition-colors focus:border-violet"
      />
    </label>
  );

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="headline text-xl">🪪 {t("prfbAboutYou")}</h2>
        <button
          type="button"
          onClick={save}
          className="pill bg-violet px-4 py-2 text-sm font-semibold text-white"
          style={{ boxShadow: "var(--shadow-glow-violet)" }}
        >
          {saved ? `✓ ${t("prfbSaved")}` : t("prfbSave")}
        </button>
      </div>
      <p className="mb-4 text-xs text-muted">{t("prfbAboutYouSub")}</p>
      <div className="space-y-4">
        {area(t("prfbBio"), bio, setBio, 3)}
        {area(t("prfbGoals"), goals, setGoals, 2)}
        {area(t("prfbIdealPartner"), idealPartner, setIdealPartner, 2)}
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">{t("prfbCertificates")}</span>
          <input
            value={certs}
            onChange={(e) => setCerts(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-white/5 px-4 py-2.5 text-sm text-ink caret-violet outline-none transition-colors focus:border-violet"
          />
          <span className="mt-1 block text-[11px] text-muted">{t("prfbCertsHint")}</span>
        </label>
      </div>
    </Card>
  );
}

export default function ProfilePage() {
  const { profile, t, toggleImmersion } = useApp();
  const router = useRouter();

  if (!profile) return null;

  const target = langByCode(profile.targetLang);
  const known = profile.knownLangs.filter((c) => c !== profile.targetLang).map(langByCode);
  const nurture = (profile.nurtureLangs ?? []).map(langByCode);
  const roleLabel =
    profile.role === "nurturer"
      ? t("nurturerWord")
      : profile.role === "both"
        ? `${t("student")} + ${t("nurturerWord")}`
        : t("student");

  const motivations = (profile.motivation ?? []).map(motivationById).filter(Boolean);
  const interests = (profile.interests ?? []).map(interestById).filter(Boolean);
  const pace = profile.dailyMinutes != null ? paceByMinutes(profile.dailyMinutes) : undefined;
  const paceLabel = pace
    ? (pace as { allIn?: boolean }).allIn
      ? `${pace.minutes / 60} ${t("hours")}`
      : `${pace.minutes} ${t("minutes")}`
    : null;

  const NotSet = () => <p className="text-sm text-muted">{t("prfNotSet")}</p>;

  return (
    <div className="space-y-6">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <h1 className="headline text-4xl lg:text-5xl">{t("prfTitle")}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/wallet")}
            className="pill flex items-center gap-2 bg-raised-2 px-5 py-3 font-semibold text-ink hover:bg-white/10"
          >
            👛 {t("wallet")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="pill flex items-center gap-2 bg-violet px-5 py-3 font-semibold text-white"
            style={{ boxShadow: "var(--shadow-glow-violet)" }}
          >
            <Pencil size={16} /> {t("prfEditProfile")}
          </button>
        </div>
      </motion.div>

      {/* hero — who you are */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.5, ease: "easeOut" }}
      >
        <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <Avatar name={profile.name || "G"} color="#ffb52e" size={72} ring src={profile.photoUrl} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl font-bold">{profile.name}</p>
            <p className="mt-0.5 text-sm text-muted">{roleLabel}</p>
            {(profile.city || profile.country) && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <MapPin size={13} className="text-lime" />
                {[profile.city, profile.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          {/* immersion toggle — quick setting */}
          {profile.role !== "nurturer" && (
            <button
              type="button"
              onClick={toggleImmersion}
              className="card flex items-center gap-2 self-start rounded-full bg-raised/85 px-4 py-2.5 text-sm font-semibold backdrop-blur-xl sm:self-center"
              title={t("dshOnbImmersionMode")}
            >
              <Sparkles size={15} className={profile.immersion ? "text-lime" : "text-muted"} />
              {t("dshOnbImmersionMode")}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  profile.immersion ? "bg-lime text-canvas" : "bg-raised-2 text-muted"
                }`}
              >
                {target.flag}
              </span>
            </button>
          )}
        </Card>
      </motion.div>

      {/* the answers grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* languages */}
        <Card className="p-5 sm:p-6">
          <h2 className="headline mb-4 flex items-center gap-2 text-xl">
            <Globe2 size={18} className="text-violet-soft" /> {t("prfYourLanguages")}
          </h2>
          <div className="space-y-3 text-sm">
            {profile.role !== "nurturer" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted">🌱 {t("wldGrowing")}</span>
                <Tag className="px-3 py-1">
                  {target.flag} {target.nativeName}
                </Tag>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted">💬 {t("wldSpeaks")}</span>
              {known.length === 0 ? (
                <Tag className="px-3 py-1">
                  {langByCode(profile.knownLangs[0] ?? "en").flag} {langByCode(profile.knownLangs[0] ?? "en").nativeName}
                </Tag>
              ) : (
                known.map((l) => (
                  <Tag key={l.code} className="px-3 py-1">
                    {l.flag} {l.nativeName}
                  </Tag>
                ))
              )}
            </div>
            {nurture.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted">🤝 {t("nurture")}</span>
                {nurture.map((l) => (
                  <Tag key={l.code} className="px-3 py-1">
                    {l.flag} {l.nativeName}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* daily rhythm */}
        <Card className="p-5 sm:p-6">
          <h2 className="headline mb-4 text-xl">🌿 {t("prfDailyRhythm")}</h2>
          {paceLabel && pace ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">{pace.emoji}</span>
              <div>
                <p className="font-semibold">
                  {paceLabel} <span className="font-normal text-muted">{t("dshOnbPerDay")}</span>
                </p>
                <p className="headline text-lg text-lime">{t(pace.identityKey)}</p>
              </div>
            </div>
          ) : (
            <NotSet />
          )}
        </Card>

        {/* why you're growing */}
        <Card className="p-5 sm:p-6">
          <h2 className="headline mb-4 text-xl">💛 {t("prfWhyGrowing")}</h2>
          {motivations.length === 0 ? (
            <NotSet />
          ) : (
            <div className="flex flex-wrap gap-2">
              {motivations.map((m) => (
                <Tag key={m!.id} className="px-3 py-1.5">
                  {m!.emoji} {t(m!.labelKey)}
                </Tag>
              ))}
            </div>
          )}
        </Card>

        {/* what you love */}
        <Card className="p-5 sm:p-6">
          <h2 className="headline mb-4 text-xl">✨ {t("dshOnbWhatLoveHead")}</h2>
          {interests.length === 0 ? (
            <NotSet />
          ) : (
            <div className="flex flex-wrap gap-2">
              {interests.map((i) => (
                <Tag key={i!.id} className="px-3 py-1.5">
                  {i!.emoji} {t(i!.labelKey)}
                </Tag>
              ))}
            </div>
          )}
        </Card>
      </div>

      <AboutYouCard />

      {/* account & security (Clerk) */}
      {CLERK_ON && <AccountPanel t={t} />}
    </div>
  );
}
