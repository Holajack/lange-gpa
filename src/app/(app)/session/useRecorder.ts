"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useRecorder — the GPA "talking picture dictionary".
 * Records the session with MediaRecorder (mic by default, camera
 * optional) so the grower can re-live every card afterwards: same
 * voice, same laughter, zero translation. Permission denial is soft —
 * the session simply continues without its recording.
 */

export type RecStatus = "idle" | "recording" | "denied" | "unsupported";

export interface RecorderClip {
  url: string;
  hasVideo: boolean;
  filename: string;
}

export function useRecorder() {
  const [status, setStatus] = useState<RecStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [clip, setClip] = useState<RecorderClip | null>(null);
  /** live camera stream for the self-view (null when mic-only) */
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);
  const clipUrlRef = useRef<string | null>(null);

  const clearTick = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const teardownStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLiveStream(null);
  }, []);

  const stop = useCallback(() => {
    clearTick();
    const rec = recRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop(); // onstop finalizes the clip + tears the stream down
    } else {
      teardownStream();
    }
    setStatus((s) => (s === "recording" ? "idle" : s));
  }, [clearTick, teardownStream]);

  const start = useCallback(
    async (withCamera: boolean) => {
      if (
        typeof window === "undefined" ||
        typeof MediaRecorder === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setStatus("unsupported");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: withCamera,
        });
        streamRef.current = stream;
        setLiveStream(withCamera ? stream : null);
        chunksRef.current = [];
        const rec = new MediaRecorder(stream);
        recRef.current = rec;
        rec.ondataavailable = (e: BlobEvent) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        rec.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: rec.mimeType || (withCamera ? "video/webm" : "audio/webm"),
          });
          if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
          const url = URL.createObjectURL(blob);
          clipUrlRef.current = url;
          setClip({
            url,
            hasVideo: withCamera,
            filename: `lange-session-${new Date().toISOString().slice(0, 10)}.webm`,
          });
          // a finished clip is a real GPA milestone — the talking picture dictionary
          window.dispatchEvent(new CustomEvent("lange:award", { detail: { id: "first-recording" } }));
          teardownStream();
        };
        rec.start();
        setElapsed(0);
        setStatus("recording");
        clearTick();
        tickRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
      } catch {
        // permission denied / no devices — keep growing, just without the recording
        setStatus("denied");
        teardownStream();
      }
    },
    [clearTick, teardownStream]
  );

  // full teardown on unmount
  useEffect(
    () => () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
      const rec = recRef.current;
      if (rec && rec.state !== "inactive") {
        rec.onstop = null;
        rec.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
    },
    []
  );

  return { status, elapsed, clip, liveStream, start, stop };
}
