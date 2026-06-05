"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ScreenId = "home" | "christies";
type Phase = "idle" | "hiding" | "blank" | "revealing";

type FitLineProps = {
  text: string;
  minPx?: number;
  maxPx?: number;
  targetFill?: number;
  perItemLinks?: boolean;
  animateIn?: boolean;

  rankByUnitIndex?: number[];
  revealCount?: number;

  nonLinkGroupIds?: number[];
  onMeasured?: () => void;

  // NEW: let parent react to clicks per item
  lineIndex?: number;
  onGroupClick?: (lineIndex: number, groupId: number, label: string) => void;
};

function splitParts(text: string) {
  return text.split(/(\s+|\/)/).filter((t) => t !== "");
}
const isSpace = (t: string) => /^\s+$/.test(t);
const isSlash = (t: string) => t === "/";

function buildUnits(text: string) {
  const parts = splitParts(text);

  type Unit = { parts: string[]; group: number };
  const units: Unit[] = [];

  let i = 0;
  let group = 0;

  while (i < parts.length) {
    const lead: string[] = [];
    while (i < parts.length && isSpace(parts[i])) {
      lead.push(parts[i]);
      i++;
    }
    if (i >= parts.length) break;

    if (isSlash(parts[i])) {
      i++;
      continue;
    }

    const unitParts: string[] = [...lead, parts[i]];
    i++;

    let endedItem = false;
    if (i < parts.length && isSlash(parts[i])) {
      unitParts.push(parts[i]);
      i++;
      endedItem = true;

      while (i < parts.length && isSpace(parts[i])) {
        unitParts.push(parts[i]);
        i++;
      }
    }

    units.push({ parts: unitParts, group });
    if (endedItem) group += 1;
  }

  return { parts, units };
}

function makeRng(seed0: number) {
  let s = seed0 >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function FitLine({
  text,
  minPx = 18,
  maxPx = 140,
  targetFill = 1,
  perItemLinks = false,
  animateIn = true,
  rankByUnitIndex,
  revealCount = 0,
  nonLinkGroupIds = [],
  onMeasured,
  lineIndex = 0,
  onGroupClick,
}: FitLineProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [fontPx, setFontPx] = useState<number>(minPx);
  const [boxH, setBoxH] = useState<number>(minPx);
  const [offsetY, setOffsetY] = useState<number>(0);

  const measuredOnceRef = useRef(false);

  const mainFontFamily = useMemo(
    () =>
      `"HN-Condensed-Black","Helvetica Neue Condensed Black","Helvetica Neue",Arial,sans-serif`,
    []
  );

  const slashFontFamily = useMemo(
    () => `"HN-UltraLight","Helvetica Neue",Arial,sans-serif`,
    []
  );

  const built = useMemo(() => buildUnits(text), [text]);
  const parts = built.parts;
  const units = built.units;

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const run = () => {
      const fullWidth = el.clientWidth;
      if (!fullWidth) return;

      const targetWidth = fullWidth * targetFill;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const measureMixed = (px: number) => {
        let totalW = 0;
        let maxAscent = 0;
        let maxDescent = 0;

        for (const t of parts) {
          if (!t) continue;

          if (isSlash(t)) ctx.font = `200 ${px}px ${slashFontFamily}`;
          else ctx.font = `900 ${px}px ${mainFontFamily}`;

          const m = ctx.measureText(t);
          totalW += m.width;

          const ascent = (m as any).actualBoundingBoxAscent ?? px * 0.8;
          const descent = (m as any).actualBoundingBoxDescent ?? px * 0.2;

          if (ascent > maxAscent) maxAscent = ascent;
          if (descent > maxDescent) maxDescent = descent;
        }

        return { w: totalW, h: maxAscent + maxDescent };
      };

      let lo = minPx;
      let hi = maxPx;
      let best = minPx;

      for (let it = 0; it < 22; it++) {
        const mid = (lo + hi) / 2;
        const r = measureMixed(mid);

        if (r.w <= targetWidth) {
          best = mid;
          lo = mid;
        } else {
          hi = mid;
        }
      }

      const px = Math.min(best * 1.01, maxPx);
      const r = measureMixed(px);

      const hidden = Math.max(0, px - r.h);
      const shiftUp = hidden / 2;

      setFontPx(px);
      setBoxH(r.h);
      setOffsetY(shiftUp);

      if (!measuredOnceRef.current) {
        measuredOnceRef.current = true;
        onMeasured?.();
      }
    };

    const fontsReady = (document as any).fonts?.ready;
    if (fontsReady) (document as any).fonts.ready.then(run).catch(run);
    else run();

    const ro = new ResizeObserver(() => {
      const fr = (document as any).fonts?.ready;
      if (fr) (document as any).fonts.ready.then(run).catch(run);
      else run();
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [parts, minPx, maxPx, mainFontFamily, slashFontFamily, targetFill, onMeasured]);

  const PartNode = ({ t }: { t: string }) => {
    if (isSlash(t)) return <span style={{ fontFamily: slashFontFamily, fontWeight: 200 }}>/</span>;
    return <span>{t}</span>;
  };

  const UnitReveal = ({
    unitIndex,
    children,
  }: {
    unitIndex: number;
    children: React.ReactNode;
  }) => {
    if (!animateIn) return <>{children}</>;
    const rank = rankByUnitIndex?.[unitIndex] ?? 0;
    const visible = rank < revealCount;
    return <span style={{ visibility: visible ? "visible" : "hidden" }}>{children}</span>;
  };

  // Group units by item (everything ending with "/")
  const groups = useMemo(() => {
    const map = new Map<number, number[]>();
    units.forEach((u, idx) => {
      const arr = map.get(u.group) ?? [];
      arr.push(idx);
      map.set(u.group, arr);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [units]);

  // Build a label string for a given group (used by parent for transitions)
  const groupLabel = (groupId: number, unitIdxs: number[]) => {
    const s = unitIdxs
      .flatMap((ui) => units[ui].parts)
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    // ensure it ends with "/" like your UI
    return s.endsWith("/") ? s : `${s}/`;
  };

  return (
    <div ref={wrapRef} className="w-full">
      <div style={{ height: `${boxH}px`, overflow: "visible" }}>
        <div
          className="whitespace-nowrap"
          style={{
            position: "relative",
            top: `-${offsetY}px`,
            fontSize: `${fontPx}px`,
            fontFamily: mainFontFamily,
            fontWeight: 900,
            lineHeight: 1,
            margin: 0,
            padding: 0,
          }}
        >
          {groups.map(([groupId, unitIdxs]) => {
            const inner = (
              <>
                {unitIdxs.map((ui) => (
                  <UnitReveal key={`u-${groupId}-${ui}`} unitIndex={ui}>
                    <>
                      {units[ui].parts.map((p, k) => (
                        <PartNode key={`${ui}-${k}`} t={p} />
                      ))}
                    </>
                  </UnitReveal>
                ))}
              </>
            );

            const disabled = !perItemLinks || nonLinkGroupIds.includes(groupId);

            if (disabled) return <span key={`g-${groupId}`}>{inner}</span>;

            const label = groupLabel(groupId, unitIdxs);

            return (
              <a
                key={`g-${groupId}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onGroupClick?.(lineIndex, groupId, label);
                }}
                className="hero-chunk"
                aria-label={`item-${groupId}`}
              >
                {inner}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to make ranks for a given set of lines so units reveal in a single global random order
 */
function makeRanksForLines(lines: Array<{ text: string }>, seed: number) {
  const rng = makeRng(seed ^ 0x9e3779b9);
  const builtByLine = lines.map((l) => buildUnits(l.text));

  const slots: Array<{ line: number; unit: number; r: number }> = [];
  for (let line = 0; line < builtByLine.length; line++) {
    for (let u = 0; u < builtByLine[line].units.length; u++) {
      slots.push({ line, unit: u, r: rng() });
    }
  }

  slots.sort((a, b) => a.r - b.r);

  const ranks: number[][] = builtByLine.map((b) => Array(b.units.length).fill(0));
  for (let rank = 0; rank < slots.length; rank++) {
    const s = slots[rank];
    ranks[s.line][s.unit] = rank;
  }

  return { ranksByLine: ranks, totalUnits: slots.length };
}

export function HeroScreen({ initialScreen }: { initialScreen: ScreenId }) {
  const GAP_PX = 10;
  const TOPLINE_TARGET = 0.991;
  const BOTTOMLINE_TARGET = 1.005;

  // speed control (lower = faster). 1 = every frame
  const FRAMES_BETWEEN_REVEALS = 1;

  // ---- "screens" (same URL) ----
  // Home lines (your current)
  const homeLines = useMemo(
    () => [
      {
        text: "SAM HARDY LEAD PRODUCT",
        minPx: 44,
        maxPx: 120,
        targetFill: TOPLINE_TARGET,
        perItemLinks: false,
        nonLinkGroupIds: [] as number[],
      },
      {
        text: "DESIGNER/ HIRE ME/ ABOUT ME/",
        minPx: 36,
        maxPx: 110,
        targetFill: 1,
        perItemLinks: true,
        nonLinkGroupIds: [0], // DESIGNER/ not clickable
      },
      {
        text: "NESPRESSO/ CHRISTIES AUCTION HOUSE/",
        minPx: 30,
        maxPx: 100,
        targetFill: 1,
        perItemLinks: true,
        nonLinkGroupIds: [] as number[],
      },
      {
        text: "GIVENCHY/ FARFETCH/ OBODO/ NET-A-PORTER/ WAGAMAMA/",
        minPx: 26,
        maxPx: 90,
        targetFill: 1,
        perItemLinks: true,
        nonLinkGroupIds: [] as number[],
      },
      {
        text: "M&S/ M&S BANK/ SIID/ NESTFUEL/ OCTO/ ATTEST/ RWD MAGAZINE/ BAREFOOT PROJECT/",
        minPx: 18,
        maxPx: 70,
        targetFill: BOTTOMLINE_TARGET,
        perItemLinks: true,
        nonLinkGroupIds: [] as number[],
      },
    ],
    []
  );

  // Christies lines (PLACEHOLDER — edit these strings later)
  // You said you'll handle the creativity: just overwrite the `text:` fields.
  const christiesLines = useMemo(
    () => [
      {
        text: "CHRISTIES AUCTION HOUSE",
        minPx: 44,
        maxPx: 120,
        targetFill: TOPLINE_TARGET,
        perItemLinks: false,
        nonLinkGroupIds: [] as number[],
      },
      {
        text: "BACK/ CONTACT/ ABOUT/",
        minPx: 36,
        maxPx: 110,
        targetFill: 1,
        perItemLinks: true,
        nonLinkGroupIds: [] as number[],
      },
      {
        text: "CASE STUDY/ ROLE/ OUTCOMES/",
        minPx: 30,
        maxPx: 100,
        targetFill: 1,
        perItemLinks: true,
        nonLinkGroupIds: [] as number[],
      },
      {
        text: "RESEARCH/ IA/ NAVIGATION/ DESIGN SYSTEM/",
        minPx: 26,
        maxPx: 90,
        targetFill: 1,
        perItemLinks: true,
        nonLinkGroupIds: [] as number[],
      },
      {
        text: "NEXT/ PREV/ HOME/",
        minPx: 18,
        maxPx: 70,
        targetFill: BOTTOMLINE_TARGET,
        perItemLinks: true,
        nonLinkGroupIds: [] as number[],
      },
    ],
    []
  );

  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Which screen is currently displayed
  const [screen, setScreen] = useState<ScreenId>(initialScreen);
  // Which screen we are transitioning to
  const [nextScreen, setNextScreen] = useState<ScreenId | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  // Random seed per mount / per transition, so it feels fresh
  const [seed] = useState<number>(() => {
    if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
      return crypto.getRandomValues(new Uint32Array(1))[0];
    }
    return Math.floor(Math.random() * 2 ** 32);
  });

  const [transitionSeed, setTransitionSeed] = useState<number>(() => seed);

  // pick active lines based on current screen
  const activeLines = screen === "home" ? homeLines : christiesLines;

  // ranks for active screen (random per screen/transition)
  const { ranksByLine, totalUnits } = useMemo(() => {
    return makeRanksForLines(activeLines, transitionSeed);
  }, [activeLines, transitionSeed]);

  // measurement gating
  const [measuredCount, setMeasuredCount] = useState(0);
  const allMeasured = measuredCount >= activeLines.length;

  // reveal/hide counter for units
  const [revealCount, setRevealCount] = useState(0);
  const revealRef = useRef(0);
  const frameRef = useRef(0);
  const pendingRouteRef = useRef<string | null>(null);

  const slideshowImages = useMemo(
    () =>
      [
        "Group 7961.png",
        "Group 7971.png",
        "Group 7981.png",
        "Group 7991.png",
        "Group 8001.png",
        "Group 8011.png",
        "Group 8021.png",
        "Mask group1.png",
        "Mask group1-1.png",
        "Mask group1-2.png",
        "Mask group1-3.png",
        "Mask group1-4.png",
        "Mask group1-5.png",
        "Mask group1-6.png",
        "Mask group1-7.png",
        "Mask group1-8.png",
        "Mask group1-9.png",
        "Mask group1-10.png",
        "Mask group1-11.png",
        "Union1.png",
      ],
    []
  );
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    let raf = 0;
    raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (screen !== "home") return;
    if (slideshowImages.length === 0) return;
    return () => undefined;
  }, [screen, slideshowImages.length]);

  // reset measurement counter whenever screen changes
  useEffect(() => {
    setMeasuredCount(0);
  }, [screen]);

  // finish reveal => idle
  useEffect(() => {
    if (!mounted) return;
    if (!allMeasured) return;
    if (phase === "revealing" && revealCount >= totalUnits) {
      setPhase("idle");
    }
  }, [mounted, allMeasured, phase, revealCount, totalUnits]);

  // when blank after hiding, navigate to pending route or switch screen
  useEffect(() => {
    if (!mounted) return;
    if (phase !== "blank") return;

    if (pendingRouteRef.current) {
      const route = pendingRouteRef.current;
      pendingRouteRef.current = null;
      router.push(route);
      return;
    }

    if (nextScreen) {
      const newSeed =
        typeof crypto !== "undefined" && "getRandomValues" in crypto
          ? crypto.getRandomValues(new Uint32Array(1))[0]
          : Math.floor(Math.random() * 2 ** 32);
      setTransitionSeed(newSeed);
      setScreen(nextScreen);
      setNextScreen(null);
      setPhase("revealing");
    }
  }, [mounted, phase, nextScreen, router]);

  // main animation loop depending on phase
  useEffect(() => {
    if (!mounted) return;
    if (!allMeasured) return;

    let raf = 0;

    // helper: step reveal count with strict per-frame pacing
    const tick = () => {
      frameRef.current += 1;

      if (frameRef.current % FRAMES_BETWEEN_REVEALS === 0) {
        if (phase === "revealing") {
          if (revealRef.current < totalUnits) {
            revealRef.current += 1;
            setRevealCount(revealRef.current);
          }
        } else if (phase === "hiding") {
          if (revealRef.current > 0) {
            revealRef.current -= 1;
            setRevealCount(revealRef.current);
          }
        }
      }

      // phase transitions
      if (phase === "hiding" && revealRef.current === 0) {
        // 1-frame blank (yellow)
        setPhase("blank");
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    // init per phase
    frameRef.current = 0;

    if (phase === "revealing") {
      revealRef.current = 0;
      setRevealCount(0);
      raf = requestAnimationFrame(tick);
    } else if (phase === "hiding") {
      revealRef.current = totalUnits;
      setRevealCount(totalUnits);
      raf = requestAnimationFrame(tick);
    } else if (phase === "idle") {
      // idle = show fully
      revealRef.current = totalUnits;
      setRevealCount(totalUnits);
    } else if (phase === "blank") {
      // blank is rendered by the JSX; phase will be advanced by the hiding handler
    }

    return () => cancelAnimationFrame(raf);
  }, [mounted, allMeasured, totalUnits, FRAMES_BETWEEN_REVEALS, phase, nextScreen]);

  // start initial reveal on first mount
  useEffect(() => {
    if (!mounted) return;
    // first load: reveal in
    setPhase("revealing");
  }, [mounted]);

  // click handler (test with CHRISTIES AUCTION HOUSE/)
  const handleGroupClick = (lineIndex: number, groupId: number, label: string) => {
    // during transitions, ignore clicks
    if (phase !== "idle") return;

    if (screen === "home") {
      const normalized = label.replace(/\//g, "").trim().toUpperCase();
      const routeMap: Record<string, string> = {
        NESPRESSO: "/nespresso",
        "CHRISTIES AUCTION HOUSE": "/christies",
        GIVENCHY: "/givenchy",
        FARFETCH: "/farfetch",
        OBODO: "/obodo",
        "NET-A-PORTER": "/net-a-porter",
        WAGAMAMA: "/wagamama",
      };
      const route = routeMap[normalized];
      if (route) {
        pendingRouteRef.current = route;
        setPhase("hiding");
        return;
      }
    }

    // OPTIONAL: add a way back (placeholder)
    if (screen === "christies" && label.toUpperCase().includes("BACK/")) {
      pendingRouteRef.current = "/";
      setPhase("hiding");
      return;
    }
  };

  return (
    <main
      className="h-screen overflow-hidden"
      style={{ backgroundColor: "#F5FF00", position: "relative" }}
    >
      <style jsx global>{`
        .hero-chunk {
          color: inherit;
          text-decoration: none;
          cursor: pointer;
        }
        .hero-chunk:hover {
          color: #f5ff00;
        }
      `}</style>

      <div
        className="mx-auto w-full max-w-[1280px] px-6 py-10"
        style={{ position: "relative", minHeight: "100%" }}
      >
        <div className="hero-title uppercase tracking-[-0.02em]" style={{ color: "#2E2E2E" }}>
          {!mounted ? null : phase === "blank" ? null : (
            <div style={{ display: "flex", flexDirection: "column", gap: `${GAP_PX}px` }}>
              {activeLines.map((l, i) => (
                <FitLine
                  key={`${screen}-${i}`}
                  text={l.text}
                  minPx={l.minPx}
                  maxPx={l.maxPx}
                  targetFill={l.targetFill}
                  perItemLinks={l.perItemLinks}
                  nonLinkGroupIds={l.nonLinkGroupIds}
                  animateIn={true}
                  rankByUnitIndex={ranksByLine[i]}
                  revealCount={revealCount}
                  onMeasured={() => setMeasuredCount((c) => c + 1)}
                  lineIndex={i}
                  onGroupClick={handleGroupClick}
                />
              ))}
            </div>
          )}
        </div>

        {null}
      </div>
    </main>
  );
}

export default function Home() {
  return <HeroScreen initialScreen="home" />;
}