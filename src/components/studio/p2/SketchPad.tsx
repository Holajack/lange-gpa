"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Check, Eraser, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { textOn } from "../StudioShell";

const PAPER = "#fffaf0";
const INKS = [
  { id: "ink", color: "#26262e", key: "st2_skInk" },
  { id: "red", color: "#d8473d", key: "st2_skRed" },
  { id: "blue", color: "#2f6fd0", key: "st2_skBlue" },
  { id: "green", color: "#2f9a57", key: "st2_skGreen" },
] as const;

const W = 800;
const H = 600;

/**
 * A pencil-and-paper stand-in for "draw as you go": stick figures and a few
 * key details, nothing more. Deliberately not an illustration tool — the
 * drawing only has to be enough to hang the telling on.
 */
export function SketchPad({
  accent,
  onSave,
  onCancel,
}: {
  accent: string;
  onSave: (png: Blob) => void;
  onCancel: () => void;
}) {
  const { t } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [ink, setInk] = useState<string>(INKS[0].color);
  const [dirty, setDirty] = useState(false);

  const wipe = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
    setDirty(false);
  };

  useEffect(wipe, []);

  const at = (ev: PointerEvent<HTMLCanvasElement>) => {
    const box = ev.currentTarget.getBoundingClientRect();
    return { x: ((ev.clientX - box.left) / box.width) * W, y: ((ev.clientY - box.top) / box.height) * H };
  };

  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const down = (ev: PointerEvent<HTMLCanvasElement>) => {
    ev.currentTarget.setPointerCapture(ev.pointerId);
    const p = at(ev);
    last.current = p;
    stroke(p, { x: p.x + 0.1, y: p.y + 0.1 });
    setDirty(true);
  };
  const move = (ev: PointerEvent<HTMLCanvasElement>) => {
    if (!last.current) return;
    const p = at(ev);
    stroke(last.current, p);
    last.current = p;
  };
  const up = () => {
    last.current = null;
  };

  const save = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) onSave(blob);
    }, "image/png");
  };

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
        role="img"
        aria-label={t("st2_skCanvas")}
        className="aspect-[4/3] w-full cursor-crosshair rounded-3xl border border-line"
        style={{ touchAction: "none", background: PAPER }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label={t("st2_skColor")} className="flex items-center gap-2">
          {INKS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={ink === option.color}
              aria-label={t(option.key)}
              onClick={() => setInk(option.color)}
              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${
                ink === option.color ? "border-white" : "border-transparent"
              }`}
            >
              <span className="block h-7 w-7 rounded-full border border-white/30" style={{ background: option.color }} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={wipe}
          disabled={!dirty}
          className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink disabled:opacity-40"
        >
          <Eraser size={14} strokeWidth={2.5} /> {t("st2_skClear")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink"
        >
          <X size={14} strokeWidth={2.5} /> {t("st2_skCancel")}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!dirty}
          className={`pill ml-auto min-h-11 px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${textOn(accent)}`}
          style={{ background: accent }}
        >
          <Check size={15} strokeWidth={3} /> {t("st2_skUse")}
        </button>
      </div>
    </div>
  );
}
