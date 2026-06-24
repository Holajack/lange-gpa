"use client";

/**
 * NuriGlobe — the realistic 3D planet for /world.
 *
 * A textured three.js Earth (react-globe.gl): real continents, coastlines and
 * relief, a violet atmosphere, smooth deep zoom (scroll / pinch / the +/−
 * buttons), and accurate lat/lng pins you can click. Far out you see each
 * language's capital; fly closer and the capitals give way to the people of
 * that language. Replaces the old featureless cobe dot-globe so a pin in
 * Moscow actually reads as Moscow, not "somewhere over Turkey".
 */

import dynamic from "next/dynamic";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";

export type GlobeCapital = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  emoji: string;
  label: string;
  selected: boolean;
};

export type GlobePerson = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  name: string;
  kind: "nurturer" | "grower";
  /** the signed-in user themselves — pinned a little brighter */
  me?: boolean;
};

export interface NuriGlobeHandle {
  /** multiply the camera altitude (factor < 1 zooms in, > 1 zooms out) */
  zoomBy: (factor: number) => void;
}

type Props = {
  capitals: GlobeCapital[];
  people: GlobePerson[];
  /** ease the camera here (keeping the current zoom) when it changes */
  focusLat: number;
  focusLng: number;
  /** fired when crossing the capitals↔people zoom threshold */
  onPeopleModeChange?: (peopleMode: boolean) => void;
  onPersonClick?: (id: string) => void;
  onCapitalClick?: (id: string) => void;
};

/** below this altitude the capitals give way to people */
const PEOPLE_ALT = 1.35;
const MIN_ALT = 0.18;
const MAX_ALT = 3.4;
const START_ALT = 2.3;

/** minimal imperative surface we use from react-globe.gl */
type GlobeInstance = {
  pointOfView: (pov?: { lat?: number; lng?: number; altitude?: number }, ms?: number) => unknown;
  controls: () => {
    autoRotate: boolean;
    autoRotateSpeed: number;
    enablePan: boolean;
    minDistance: number;
    maxDistance: number;
    enableZoom: boolean;
  };
};

type GlobeProps = {
  width?: number;
  height?: number;
  backgroundColor?: string;
  globeImageUrl?: string;
  bumpImageUrl?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  htmlElementsData?: object[];
  htmlLat?: (d: object) => number;
  htmlLng?: (d: object) => number;
  htmlAltitude?: number | ((d: object) => number);
  htmlElement?: (d: object) => HTMLElement;
  onZoom?: (pov: { lat: number; lng: number; altitude: number }) => void;
  onGlobeReady?: () => void;
};

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false }) as unknown as ForwardRefExoticComponent<
  GlobeProps & RefAttributes<GlobeInstance>
>;

export const NuriGlobe = forwardRef<NuriGlobeHandle, Props>(function NuriGlobe(
  { capitals, people, focusLat, focusLng, onPeopleModeChange, onPersonClick, onCapitalClick },
  ref
) {
  const globeRef = useRef<GlobeInstance | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  const [peopleMode, setPeopleMode] = useState(false);
  const peopleModeRef = useRef(false);

  // keep latest click handlers without rebuilding the marker elements
  const onPersonRef = useRef(onPersonClick);
  onPersonRef.current = onPersonClick;
  const onCapitalRef = useRef(onCapitalClick);
  onCapitalRef.current = onCapitalClick;

  // size the canvas to its square container
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize(el.offsetWidth));
    ro.observe(el);
    setSize(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  // ease to a new focus when the selected language changes (keep current zoom);
  // pause idle auto-spin during the fly-over so they don't fight
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    try {
      g.controls().autoRotate = false;
    } catch {
      /* controls not ready yet */
    }
    g.pointOfView({ lat: focusLat, lng: focusLng }, 900);
    const id = window.setTimeout(() => {
      try {
        g.controls().autoRotate = true;
      } catch {
        /* ignore */
      }
    }, 1100);
    return () => window.clearTimeout(id);
  }, [focusLat, focusLng]);

  useImperativeHandle(
    ref,
    () => ({
      zoomBy: (factor: number) => {
        const g = globeRef.current;
        if (!g) return;
        const pov = g.pointOfView() as { altitude: number };
        const altitude = Math.min(MAX_ALT, Math.max(MIN_ALT, pov.altitude * factor));
        g.pointOfView({ altitude }, 450);
      },
    }),
    []
  );

  const markers: object[] = peopleMode ? people : capitals;

  // build a clickable DOM pin per datum (safe DOM, no innerHTML — names are
  // user data). Always faces the camera; the dot/label are app-styled.
  const htmlElement = useMemo(
    () => (d: object) => {
      const wrap = document.createElement("div");
      wrap.style.cssText =
        "cursor:pointer;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:3px;will-change:transform";
      const dot = document.createElement("span");
      const label = document.createElement("span");
      label.style.cssText =
        "font:600 10px/1 ui-sans-serif,system-ui;color:#fff;text-shadow:0 1px 5px rgba(0,0,0,.95);white-space:nowrap";

      if ("kind" in d) {
        const p = d as GlobePerson;
        const sz = p.me ? 16 : 12;
        dot.style.cssText = `width:${sz}px;height:${sz}px;border-radius:9999px;background:${p.color};box-shadow:0 0 0 2px rgba(255,255,255,.9),0 0 16px ${p.color}`;
        label.textContent = (p.me ? "★ " : "") + p.name;
        wrap.append(dot, label);
        wrap.onclick = (e) => {
          e.stopPropagation();
          onPersonRef.current?.(p.id);
        };
      } else {
        const c = d as GlobeCapital;
        const sz = c.selected ? 30 : 22;
        dot.style.cssText =
          `display:flex;align-items:center;justify-content:center;width:${sz}px;height:${sz}px;border-radius:9999px;background:${c.color};font-size:${c.selected ? 15 : 11}px;` +
          (c.selected ? `box-shadow:0 0 0 3px ${c.color},0 0 26px ${c.color}` : "box-shadow:0 0 0 2px rgba(255,255,255,.75)");
        dot.textContent = c.emoji;
        wrap.append(dot);
        if (c.selected) {
          label.style.fontWeight = "700";
          label.textContent = c.label;
          wrap.append(label);
        }
        wrap.onclick = (e) => {
          e.stopPropagation();
          onCapitalRef.current?.(c.id);
        };
      }
      return wrap;
    },
    []
  );

  return (
    <div ref={wrapRef} className="h-full w-full">
      {size > 0 && (
        <Globe
          ref={globeRef}
          width={size}
          height={size}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="/textures/earth-blue-marble.jpg"
          bumpImageUrl="/textures/earth-topology.png"
          showAtmosphere
          atmosphereColor="#7c5cff"
          atmosphereAltitude={0.22}
          htmlElementsData={markers}
          htmlLat={(d: object) => (d as GlobeCapital).lat}
          htmlLng={(d: object) => (d as GlobeCapital).lng}
          htmlAltitude={0.012}
          htmlElement={htmlElement}
          onZoom={(pov) => {
            const pm = pov.altitude < PEOPLE_ALT;
            if (pm !== peopleModeRef.current) {
              peopleModeRef.current = pm;
              setPeopleMode(pm);
              onPeopleModeChange?.(pm);
            }
          }}
          onGlobeReady={() => {
            const g = globeRef.current;
            if (!g) return;
            g.pointOfView({ lat: focusLat, lng: focusLng, altitude: START_ALT }, 0);
            try {
              const c = g.controls();
              c.autoRotate = true;
              c.autoRotateSpeed = 0.3;
              c.enablePan = false;
              c.minDistance = 118; // ~altitude MIN_ALT (globe radius 100)
              c.maxDistance = 440; // ~altitude MAX_ALT
            } catch {
              /* controls not ready — defaults are fine */
            }
          }}
        />
      )}
    </div>
  );
});
