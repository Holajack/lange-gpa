"use client";

/**
 * 1:1 video calls (Stage D3) — free WebRTC. Peer-to-peer over Google STUN;
 * Convex (convex/calls.ts) only relays the SDP offer/answer + ICE candidates,
 * polled ~1s. Mounted once in the app shell so an incoming call rings anywhere.
 *
 * First cut: works on most home/office networks. Networks behind strict
 * (symmetric) NAT will need a TURN relay added to ICE_SERVERS later.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CONVEX_ON } from "@/lib/convexClient";
import { COMMUNITY_EXCHANGE_ON } from "@/lib/featureFlags";
import { useConvex } from "convex/react";
import { useApp } from "@/lib/store";


/**
 * ICE servers. STUN alone works on ~85% of networks; strict/symmetric NAT
 * (many mobile carriers, corporate/hotel Wi-Fi) needs a TURN relay or the call
 * never connects. TURN is configured via env (NEXT_PUBLIC_TURN_URLS +
 * _USERNAME + _CREDENTIAL — plug in metered.ca / Cloudflare / Twilio). When
 * none is set we fall back to the free Open Relay project so beta calls still
 * connect on restrictive networks out of the box (replace for real scale).
 */
function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];
  const urls = process.env.NEXT_PUBLIC_TURN_URLS;
  const username = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const credential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
  if (urls && username && credential) {
    servers.push({ urls: urls.split(",").map((u) => u.trim()).filter(Boolean), username, credential });
  } else {
    servers.push({
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    });
  }
  return servers;
}

const ICE_SERVERS: RTCIceServer[] = buildIceServers();

type CallState = "idle" | "calling" | "incoming" | "active";

type CallActions = { startCall: (toProfileId: string, toName: string) => void };
const CallCtx = createContext<CallActions>({ startCall: () => {} });
export const useCallActions = () => useContext(CallCtx);

function CallEngine({ children }: { children: React.ReactNode }) {
  const convex = useConvex();
  const { t } = useApp();
  const [state, setState] = useState<CallState>("idle");
  const [peerName, setPeerName] = useState("");
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localElRef = useRef<HTMLVideoElement | null>(null);
  const remoteElRef = useRef<HTMLVideoElement | null>(null);
  const callIdRef = useRef<string | null>(null);
  const roleRef = useRef<"caller" | "callee">("caller");
  const remoteSetRef = useRef(false);
  const addedIce = useRef<Set<string>>(new Set());
  const incomingRef = useRef<{ callId: string; offer: string; callerName: string } | null>(null);
  const pollRef = useRef<number | null>(null);

  const bindEls = useCallback(() => {
    if (localElRef.current && localStreamRef.current) localElRef.current.srcObject = localStreamRef.current;
    if (remoteElRef.current && remoteStreamRef.current) remoteElRef.current.srcObject = remoteStreamRef.current;
  }, []);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((tr) => tr.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    addedIce.current.clear();
    callIdRef.current = null;
    incomingRef.current = null;
    remoteSetRef.current = false;
    setState("idle");
    setPeerName("");
    setMuted(false);
    setCamOff(false);
  }, []);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    setMuted((m) => {
      const next = !m;
      stream.getAudioTracks().forEach((tr) => (tr.enabled = !next));
      return next;
    });
  }, []);

  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    setCamOff((c) => {
      const next = !c;
      stream.getVideoTracks().forEach((tr) => (tr.enabled = !next));
      return next;
    });
  }, []);

  const makePc = useCallback(
    (role: "caller" | "callee") => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pc.onicecandidate = (e) => {
        if (e.candidate && callIdRef.current) {
          void convex
            .mutation("calls:addIce" as never, {
              callId: callIdRef.current,
              candidate: JSON.stringify(e.candidate.toJSON()),
            } as never)
            .catch(() => {});
        }
      };
      pc.ontrack = (e) => {
        remoteStreamRef.current = e.streams[0] ?? null;
        bindEls();
      };
      return pc;
    },
    [convex, bindEls]
  );

  const attachLocal = useCallback(async (pc: RTCPeerConnection) => {
    // Preflight: acquire mic + camera. A denied/absent device is the most
    // common call failure — surface it instead of failing silently.
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      setMediaError(true);
      window.setTimeout(() => setMediaError(false), 4500);
      throw err;
    }
    localStreamRef.current = stream;
    stream.getTracks().forEach((tr) => pc.addTrack(tr, stream));
    bindEls();
  }, [bindEls]);

  const startPolling = useCallback(
    () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = window.setInterval(async () => {
        const callId = callIdRef.current;
        const pc = pcRef.current;
        if (!callId || !pc) return;
        try {
          const call = (await convex.query("calls:getCall" as never, { callId } as never)) as {
            status: string;
            answer: string | null;
          } | null;
          if (!call || call.status === "ended" || call.status === "declined") {
            cleanup();
            return;
          }
          if (roleRef.current === "caller" && call.answer && !remoteSetRef.current) {
            remoteSetRef.current = true;
            await pc.setRemoteDescription(JSON.parse(call.answer));
            setState("active");
          }
          const cands = (await convex.query("calls:getIce" as never, { callId } as never)) as {
            id: string;
            candidate: string;
          }[];
          for (const c of cands) {
            if (!addedIce.current.has(c.id)) {
              addedIce.current.add(c.id);
              try {
                await pc.addIceCandidate(JSON.parse(c.candidate));
              } catch {
                /* candidate out of order — ignore */
              }
            }
          }
        } catch {
          /* transient */
        }
      }, 1200);
    },
    [convex, cleanup]
  );

  const startCall = useCallback(
    async (toProfileId: string, toName: string) => {
      if (state !== "idle") return;
      roleRef.current = "caller";
      remoteSetRef.current = false;
      setPeerName(toName);
      setState("calling");
      const pc = makePc("caller");
      pcRef.current = pc;
      try {
        await attachLocal(pc);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const callId = (await convex.mutation("calls:startCall" as never, {
          toProfileId,
          offer: JSON.stringify(offer),
        } as never)) as string;
        callIdRef.current = callId;
        startPolling();
      } catch {
        await convex.mutation("calls:endCall" as never, { callId: callIdRef.current, declined: false } as never).catch(() => {});
        cleanup();
      }
    },
    [state, makePc, attachLocal, convex, startPolling, cleanup]
  );

  const acceptIncoming = useCallback(async () => {
    const inc = incomingRef.current;
    if (!inc) return;
    roleRef.current = "callee";
    callIdRef.current = inc.callId;
    setPeerName(inc.callerName);
    const pc = makePc("callee");
    pcRef.current = pc;
    try {
      await pc.setRemoteDescription(JSON.parse(inc.offer));
      await attachLocal(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await convex.mutation("calls:answerCall" as never, { callId: inc.callId, answer: JSON.stringify(answer) } as never);
      setState("active");
      startPolling();
    } catch {
      cleanup();
    }
  }, [makePc, attachLocal, convex, startPolling, cleanup]);

  const declineIncoming = useCallback(async () => {
    const inc = incomingRef.current;
    if (inc) {
      await convex.mutation("calls:endCall" as never, { callId: inc.callId, declined: true } as never).catch(() => {});
    }
    cleanup();
  }, [convex, cleanup]);

  const hangUp = useCallback(async () => {
    if (callIdRef.current) {
      await convex.mutation("calls:endCall" as never, { callId: callIdRef.current, declined: false } as never).catch(() => {});
    }
    cleanup();
  }, [convex, cleanup]);

  // ring when idle
  useEffect(() => {
    const id = window.setInterval(async () => {
      if (state !== "idle") return;
      try {
        const inc = (await convex.query("calls:incomingCall" as never, {} as never)) as {
          callId: string;
          offer: string;
          callerName: string;
        } | null;
        if (inc && inc.offer) {
          incomingRef.current = inc;
          setPeerName(inc.callerName);
          setState("incoming");
        }
      } catch {
        /* ignore */
      }
    }, 2500);
    return () => window.clearInterval(id);
  }, [convex, state]);

  // keep video elements bound whenever the overlay (re)mounts
  useEffect(() => {
    bindEls();
  }, [state, bindEls]);

  return (
    <CallCtx.Provider value={{ startCall }}>
      {children}
      {state !== "idle" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          {state === "incoming" ? (
            <div className="card mx-4 w-full max-w-sm p-7 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet/20 text-3xl">📹</div>
              <p className="headline text-2xl">{peerName}</p>
              <p className="mt-1 text-sm text-muted">{t("callIncoming")}</p>
              <div className="mt-7 flex justify-center gap-4">
                <button onClick={() => void declineIncoming()} className="pill bg-red-500 px-6 py-3 font-bold text-white">
                  {t("callDecline")}
                </button>
                <button onClick={() => void acceptIncoming()} className="pill bg-lime px-6 py-3 font-bold text-canvas">
                  {t("callAccept")}
                </button>
              </div>
            </div>
          ) : (
            <div className="relative mx-4 flex h-[78vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-black">
              <video
                ref={remoteElRef}
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full bg-black object-cover"
              />
              {state === "calling" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                  <p className="headline text-2xl text-white">{peerName}</p>
                  <p className="text-sm text-white/70">{t("callRinging")}</p>
                </div>
              )}
              <video
                ref={localElRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-24 right-4 h-36 w-28 rounded-2xl border border-white/20 bg-black object-cover shadow-pop sm:h-44 sm:w-32"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 p-6">
                <button
                  onClick={toggleMute}
                  aria-label={t("callMuteMic")}
                  aria-pressed={muted}
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-pop ${muted ? "bg-white text-canvas" : "bg-white/15 text-white hover:bg-white/25"}`}
                >
                  {muted ? "🔇" : "🎤"}
                </button>
                <button
                  onClick={() => void hangUp()}
                  aria-label={t("callHangUp")}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-2xl text-white shadow-pop"
                >
                  📞
                </button>
                <button
                  onClick={toggleCam}
                  aria-label={t("callToggleCam")}
                  aria-pressed={camOff}
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-pop ${camOff ? "bg-white text-canvas" : "bg-white/15 text-white hover:bg-white/25"}`}
                >
                  {camOff ? "🚫" : "📷"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {mediaError && (
        <div className="fixed inset-x-0 bottom-6 z-[110] flex justify-center px-4">
          <p className="card max-w-sm bg-red-500/90 px-5 py-3 text-center text-sm font-semibold text-white shadow-pop">
            {t("callMediaBlocked")}
          </p>
        </div>
      )}
    </CallCtx.Provider>
  );
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  if (!CONVEX_ON || !COMMUNITY_EXCHANGE_ON) return <>{children}</>;
  return <CallEngine>{children}</CallEngine>;
}
