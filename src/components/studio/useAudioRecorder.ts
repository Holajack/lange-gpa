"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useAudioRecorder — a small, audio-only MediaRecorder hook for the studio
 * tools. (The live session room keeps its own camera-capable recorder.)
 * Permission denial is soft: status flips to "denied" and nothing throws.
 */

export type AudioRecStatus = "idle" | "recording" | "denied" | "unsupported";

export interface AudioTake {
  blob: Blob;
  durationSec: number;
  mime: string;
}

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

export function useAudioRecorder() {
  const [status, setStatus] = useState<AudioRecStatus>("idle");
  const [elapsed, setElapsed] = useState(0);

  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const tickRef = useRef<number | null>(null);
  const resolveRef = useRef<((take: AudioTake | null) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (tickRef.current !== null) window.clearInterval(tickRef.current);
    tickRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recRef.current = null;
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (
      typeof window === "undefined" ||
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setStatus("unsupported");
      return false;
    }
    if (recRef.current) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const type = rec.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const durationSec = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
        cleanup();
        setStatus("idle");
        resolveRef.current?.(blob.size > 0 ? { blob, durationSec, mime: type } : null);
        resolveRef.current = null;
      };
      recRef.current = rec;
      startedAt.current = Date.now();
      setElapsed(0);
      rec.start(1000);
      tickRef.current = window.setInterval(
        () => setElapsed(Math.round((Date.now() - startedAt.current) / 1000)),
        500
      );
      setStatus("recording");
      return true;
    } catch {
      cleanup();
      setStatus("denied");
      return false;
    }
  }, [cleanup]);

  /** Stop and resolve with the finished take (null if nothing was captured). */
  const stop = useCallback((): Promise<AudioTake | null> => {
    const rec = recRef.current;
    if (!rec || rec.state === "inactive") {
      cleanup();
      setStatus((s) => (s === "recording" ? "idle" : s));
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      rec.stop();
    });
  }, [cleanup]);

  /** Stop and throw the take away. */
  const cancel = useCallback(() => {
    const rec = recRef.current;
    resolveRef.current = null;
    if (rec && rec.state !== "inactive") {
      rec.onstop = null;
      rec.stop();
    }
    cleanup();
    setStatus("idle");
    setElapsed(0);
  }, [cleanup]);

  useEffect(() => () => cancel(), [cancel]);

  return { status, elapsed, start, stop, cancel };
}
