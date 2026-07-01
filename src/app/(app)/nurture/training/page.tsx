"use client";

/**
 * /nurture/training — the golden-rules walkthrough + quick check every
 * nurturer passes once before the Nurturer Studio unlocks. Entry point is
 * the TrainingGate in /nurture/page.tsx; passing writes
 * `nurturerCertStatus: "passed"` onto the profile, which CloudProfileBridge
 * syncs to Convex so the site owner can review attempts later via
 * /admin/nurturers.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { useApp } from "@/lib/store";
import { Mascot } from "@/components/Mascot";
import { Card, Pill } from "@/components/ui";

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 0.68, 0.32, 1] } },
};

/** Mirrors GOLDEN_RULES in /nurture/page.tsx — same six rules, same keys. */
const GOLDEN_RULES: { emoji: string; titleKey: string; bodyKey: string }[] = [
  { emoji: "✌️", titleKey: "nurGoldenRule1Title", bodyKey: "nurGoldenRule1Body" },
  { emoji: "🎯", titleKey: "nurGoldenRule2Title", bodyKey: "nurGoldenRule2Body" },
  { emoji: "🔁", titleKey: "nurGoldenRule3Title", bodyKey: "nurGoldenRule3Body" },
  { emoji: "👉", titleKey: "nurGoldenRule4Title", bodyKey: "nurGoldenRule4Body" },
  { emoji: "🧸", titleKey: "nurGoldenRule5Title", bodyKey: "nurGoldenRule5Body" },
  { emoji: "🎙️", titleKey: "nurGoldenRule6Title", bodyKey: "nurGoldenRule6Body" },
];

const QUIZ: { id: string; qKey: string; optKeys: string[]; correct: number }[] = [
  { id: "q1", qKey: "nurTrainQ1", optKeys: ["nurTrainQ1Opt1", "nurTrainQ1Opt2", "nurTrainQ1Opt3", "nurTrainQ1Opt4"], correct: 0 },
  { id: "q2", qKey: "nurTrainQ2", optKeys: ["nurTrainQ2Opt1", "nurTrainQ2Opt2", "nurTrainQ2Opt3", "nurTrainQ2Opt4"], correct: 1 },
  { id: "q3", qKey: "nurTrainQ3", optKeys: ["nurTrainQ3Opt1", "nurTrainQ3Opt2", "nurTrainQ3Opt3", "nurTrainQ3Opt4"], correct: 2 },
  { id: "q4", qKey: "nurTrainQ4", optKeys: ["nurTrainQ4Opt1", "nurTrainQ4Opt2", "nurTrainQ4Opt3", "nurTrainQ4Opt4"], correct: 1 },
  { id: "q5", qKey: "nurTrainQ5", optKeys: ["nurTrainQ5Opt1", "nurTrainQ5Opt2", "nurTrainQ5Opt3", "nurTrainQ5Opt4"], correct: 1 },
  { id: "q6", qKey: "nurTrainQ6", optKeys: ["nurTrainQ6Opt1", "nurTrainQ6Opt2", "nurTrainQ6Opt3", "nurTrainQ6Opt4"], correct: 2 },
];

const PASS_THRESHOLD = 5; // out of 6

type Step = "walkthrough" | "quiz" | "result";

export default function NurtureTrainingPage() {
  const { profile, t, updateProfile } = useApp();
  const router = useRouter();

  const [step, setStep] = useState<Step>("walkthrough");
  const [ruleIndex, setRuleIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  // a pure grower has no business here — send them back to the gate
  useEffect(() => {
    if (profile && profile.role === "grower") router.replace("/nurture");
  }, [profile, router]);

  if (!profile || profile.role === "grower") return null;

  const rule = GOLDEN_RULES[ruleIndex];
  const allAnswered = QUIZ.every((q) => answers[q.id] !== undefined);

  const submit = () => {
    const missed = QUIZ.filter((q) => answers[q.id] !== q.correct).map((q) => q.id);
    const correctCount = QUIZ.length - missed.length;
    const score = Math.round((correctCount / QUIZ.length) * 100);
    const passed = correctCount >= PASS_THRESHOLD;
    updateProfile({
      nurturerCertStatus: passed ? "passed" : "failed",
      nurturerCertScore: score,
      nurturerCertAttempts: (profile.nurturerCertAttempts ?? 0) + 1,
      nurturerCertPassedAt: passed ? new Date().toISOString() : profile.nurturerCertPassedAt,
      nurturerCertMissed: missed,
    });
    setResult({ score, passed });
    setStep("result");
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
    setRuleIndex(0);
    setStep("walkthrough");
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="mx-auto max-w-2xl space-y-8 pb-12 pt-2">
      {step === "walkthrough" && (
        <motion.div variants={fadeUp}>
          <Card className="p-8 text-center sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-orange">{t("nurTrainWalkTitle")}</p>
            <p className="mt-1 text-sm text-muted">{t("nurTrainWalkIntro")}</p>
            <div className="mt-6 flex justify-center text-5xl">{rule.emoji}</div>
            <h2 className="headline mt-4 text-2xl">{t(rule.titleKey)}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">{t(rule.bodyKey)}</p>
            <p className="mt-6 text-xs text-muted">
              {ruleIndex + 1} / {GOLDEN_RULES.length}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {ruleIndex > 0 && (
                <Pill className="bg-white/8 px-6 py-3 font-semibold text-ink" onClick={() => setRuleIndex((i) => i - 1)}>
                  {t("nurTrainWalkBack")}
                </Pill>
              )}
              {ruleIndex < GOLDEN_RULES.length - 1 ? (
                <Pill className="bg-orange px-7 py-3 font-semibold text-canvas" onClick={() => setRuleIndex((i) => i + 1)}>
                  {t("nurTrainWalkNext")}
                </Pill>
              ) : (
                <Pill className="bg-orange px-7 py-3 font-semibold text-canvas" onClick={() => setStep("quiz")}>
                  {t("nurTrainWalkStart")}
                </Pill>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {step === "quiz" && (
        <motion.div variants={fadeUp}>
          <Card className="p-8 sm:p-10">
            <div className="flex justify-center">
              <Mascot size={90} mood="think" />
            </div>
            <h2 className="headline mt-4 text-center text-2xl">{t("nurTrainQuizTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted">{t("nurTrainQuizSubtitle")}</p>
            <div className="mt-8 space-y-6">
              {QUIZ.map((q, qi) => (
                <div key={q.id}>
                  <p className="text-xs font-bold uppercase tracking-widest text-orange">
                    {t("nurTrainQuizQuestionWord")} {qi + 1} / {QUIZ.length}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{t(q.qKey)}</p>
                  <div className="mt-3 grid gap-2">
                    {q.optKeys.map((optKey, oi) => (
                      <button
                        key={optKey}
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                        className={`rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                          answers[q.id] === oi
                            ? "border-orange bg-orange/10 font-semibold text-ink"
                            : "border-white/10 bg-white/5 text-muted hover:bg-white/8"
                        }`}
                      >
                        {t(optKey)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Pill className="bg-orange px-7 py-3 font-semibold text-canvas" onClick={submit} disabled={!allAnswered}>
                {t("nurTrainQuizSubmit")}
              </Pill>
            </div>
          </Card>
        </motion.div>
      )}

      {step === "result" && result && (
        <motion.div variants={fadeUp}>
          <Card className="p-8 text-center sm:p-10">
            <div className="flex justify-center">
              <Mascot size={130} mood={result.passed ? "cheer" : "think"} />
            </div>
            <h2 className="headline mt-4 text-3xl">
              {result.passed ? t("nurTrainQuizPassTitle") : t("nurTrainQuizFailTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
              {result.passed ? t("nurTrainQuizPassBody") : t("nurTrainQuizFailBody")}
            </p>
            <p className="mt-4 text-sm font-semibold text-orange">
              {t("nurTrainQuizScoreLabel")}: {result.score}%
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {result.passed ? (
                <Pill className="bg-orange px-7 py-3.5 font-semibold text-canvas" onClick={() => router.push("/nurture")}>
                  {t("nurTrainQuizContinue")}
                </Pill>
              ) : (
                <Pill className="bg-orange px-7 py-3.5 font-semibold text-canvas" onClick={retry}>
                  {t("nurTrainQuizRetry")}
                </Pill>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
