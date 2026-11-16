"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import {
  STAGES,
  STAGE_A_MAX_HOURS,
  STAGE_A_MIN_HOURS,
  clampInt,
  fmtDay,
  fmtHours,
  localIso,
  newId,
  trackMinutes,
  type StageId,
  type Track,
  type TrackSession,
} from "../model";
import { AccentButton, CheckLine, Chips, Field, GhostButton, MeterBar, Panel, RemoveButton, Stat, inputCls } from "../ui";

const MARKS = [1, 2, 3, 4, 5] as const;
const QUICK_MINUTES = ["30", "60", "90", "120"] as const;

/**
 * The 100/300-hours-to-a-new-you meter for one discourse track.
 *
 * It counts only time with a person that carried all five marks of a
 * special-growth hour. "More of the same chat" is still logged, honestly,
 * but shown apart. The numbers are the grower's own ledger: they never
 * touch the measured hours on the profile.
 */
export function TrackMeter({
  track,
  accent,
  onPatch,
}: {
  track: Track;
  accent: string;
  onPatch: (fn: (track: Track) => Track) => void;
}) {
  const { t, uiLang } = useApp();
  const totals = trackMinutes(track);
  const mediatedHours = totals.mediated / 60;

  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState("60");
  const [date, setDate] = useState(localIso());
  const [stage, setStage] = useState<StageId>("a");
  const [marks, setMarks] = useState<boolean[]>([false, false, false, false, false]);
  const [note, setNote] = useState("");
  const qualifies = marks.every(Boolean);

  const log = () => {
    const session: TrackSession = {
      id: newId("ses"),
      date: date || localIso(),
      minutes: clampInt(Number(minutes), 1, 600),
      stage,
      qualifies,
      note: note.trim().slice(0, 200),
    };
    onPatch((tr) => ({ ...tr, sessions: [session, ...tr.sessions] }));
    setMarks([false, false, false, false, false]);
    setNote("");
    setOpen(false);
  };

  const marksOnBar =
    track.goal === 300
      ? [
          { at: 25, label: t("st6_d_meterMarkOne") },
          { at: 100, label: "100" },
        ]
      : [{ at: 25, label: t("st6_d_meterMarkOne") }];

  const sessionRow = (s: TrackSession) => (
    <li key={s.id} className="flex items-start gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-2.5">
      <span className="min-w-0 flex-1 text-sm">
        <span className="block font-semibold text-ink">
          {fmtDay(s.date, uiLang)} · {t("st6_d_minutes").replace("{n}", String(s.minutes))} ·{" "}
          {t(`st6_d_stage_${s.stage}`)}
        </span>
        <span className="block text-xs text-muted">
          {s.qualifies ? `✓ ${t("st6_d_sessionCounts")}` : `○ ${t("st6_d_sessionOther")}`}
          {s.note && ` · ${s.note}`}
        </span>
      </span>
      <RemoveButton
        label={t("st6_remove")}
        onConfirm={() => onPatch((tr) => ({ ...tr, sessions: tr.sessions.filter((x) => x.id !== s.id) }))}
      />
    </li>
  );

  return (
    <Panel title={t("st6_d_meterTitle")} sub={t("st6_d_meterSub")}>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <p className="font-display text-5xl font-extrabold tabular-nums text-ink">{fmtHours(totals.mediated)}</p>
        <p className="pb-1.5 text-sm text-muted">
          {t("st6_d_meterOf").replace("{n}", String(track.goal))}
        </p>
      </div>
      <MeterBar
        value={mediatedHours}
        max={track.goal}
        accent={accent}
        marks={marksOnBar}
        label={t("st6_d_meterLabel")
          .replace("{n}", fmtHours(totals.mediated))
          .replace("{g}", String(track.goal))}
      />
      <div>
        <p className="mb-2 text-xs font-semibold text-muted">{t("st6_d_goalLabel")}</p>
        <Chips
          label={t("st6_d_goalLabel")}
          options={[
            { id: "100", label: t("st6_d_goal100") },
            { id: "300", label: t("st6_d_goal300") },
          ]}
          value={[String(track.goal)]}
          onToggle={(g) => onPatch((tr) => ({ ...tr, goal: g === "300" ? 300 : 100 }))}
        />
      </div>
      <p className="text-xs leading-relaxed text-muted">{t("st6_d_meterNote")}</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          value={fmtHours(totals.stageA)}
          label={t("st6_d_statStageA")}
          sub={t("st6_d_statStageASub")
            .replace("{a}", String(STAGE_A_MIN_HOURS))
            .replace("{b}", String(STAGE_A_MAX_HOURS))}
        />
        <Stat value={fmtHours(totals.other)} label={t("st6_d_statOther")} sub={t("st6_d_statOtherSub")} />
        <Stat value={fmtHours(totals.bench)} label={t("st6_d_statBench")} sub={t("st6_d_statBenchSub")} />
      </div>

      {/* ---- log time with a person ---- */}
      {!open ? (
        <GhostButton onClick={() => setOpen(true)} expanded={false}>
          <Plus size={15} strokeWidth={3} /> {t("st6_d_logOpen")}
        </GhostButton>
      ) : (
        <form
          className="space-y-4 rounded-2xl border border-line bg-raised-2 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            log();
          }}
        >
          <p className="text-sm font-semibold text-ink">{t("st6_d_logTitle")}</p>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <Field label={t("st6_d_logDate")}>
              <input
                type="date"
                value={date}
                max={localIso()}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label={t("st6_d_logMinutes")}>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={600}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Chips
            label={t("st6_d_logMinutes")}
            options={QUICK_MINUTES.map((m) => ({ id: m, label: t("st6_d_minutes").replace("{n}", m) }))}
            value={QUICK_MINUTES.filter((m) => m === minutes)}
            onToggle={(m) => setMinutes(m)}
          />
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">{t("st6_d_logStage")}</p>
            <Chips
              label={t("st6_d_logStage")}
              options={STAGES.map((s) => ({ id: s, label: t(`st6_d_stage_${s}`) }))}
              value={[stage]}
              onToggle={setStage}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted">{t("st6_d_marksLabel")}</p>
            {MARKS.map((n, i) => (
              <CheckLine
                key={n}
                checked={marks[i] ?? false}
                onChange={(next) => setMarks((prev) => prev.map((v, j) => (j === i ? next : v)))}
              >
                {t(`st6_d_mark${n}`)}
              </CheckLine>
            ))}
            <p className="text-xs leading-relaxed text-muted" role="status">
              {qualifies ? `✓ ${t("st6_d_marksYes")}` : `○ ${t("st6_d_marksNo")}`}
            </p>
          </div>
          <Field label={t("st6_d_logNote")}>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder={t("st6_d_logNotePlaceholder")}
              className={inputCls}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <AccentButton accent={accent} type="submit">
              {t("st6_d_logSave")}
            </AccentButton>
            <GhostButton onClick={() => setOpen(false)}>{t("cancel")}</GhostButton>
          </div>
        </form>
      )}

      {track.sessions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-muted">{t("st6_d_sessionsTitle")}</p>
          <ul className="space-y-2">{track.sessions.slice(0, 4).map(sessionRow)}</ul>
          {track.sessions.length > 4 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold text-muted">
                {t("st6_d_sessionsMore").replace("{n}", String(track.sessions.length - 4))}
              </summary>
              <ul className="mt-2 space-y-2">{track.sessions.slice(4).map(sessionRow)}</ul>
            </details>
          )}
        </div>
      )}
    </Panel>
  );
}
