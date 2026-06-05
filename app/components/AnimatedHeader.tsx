"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ===== Types ===== */
export type HeaderLine = {
  text: string;
  minPx: number;
  maxPx: number;
  targetFill: number;
  perItemLinks: boolean;
  nonLinkGroupIds: number[];
};

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

  lineIndex?: number;
  onGroupClick?: (lineIndex: number, groupId: number, label: string) => void;
  activeKey?: string | null;
};

type Phase = "idle" | "hiding" | "blank" | "revealing";

/* ===== helpers (from your fallback) ===== */
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

/* ===== FitLine (copied from your fallback) ===== */
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
  activeKey = null,
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

  React.useLayoutEffect(() => {
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

  const UnitReveal = ({ unitIndex, children }: { unitIndex: number; children: React.ReactNode }) => {
    if (!animateIn) return <>{children}</>;
    const rank = rankByUnitIndex?.[unitIndex] ?? 0;
    const visible = rank < revealCount;
    return <span style={{ visibility: visible ? "visible" : "hidden" }}>{children}</span>;
  };

  const groups = useMemo(() => {
    const map = new Map<number, number[]>();
    units.forEach((u, idx) => {
      const arr = map.get(u.group) ?? [];
      arr.push(idx);
      map.set(u.group, arr);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [units]);

  const groupLabel = (unitIdxs: number[]) => {
    const s = unitIdxs
      .flatMap((ui) => units[ui].parts)
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    return s.endsWith("/") ? s : `${s}/`;
  };
  const normalizeLabel = (value: string) =>
    value.replace(/\//g, "").replace(/\s+/g, " ").trim().toUpperCase();

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

            const label = groupLabel(unitIdxs);

            const isActive = activeKey ? normalizeLabel(label) === activeKey : false;

            return (
              <a
                key={`g-${groupId}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onGroupClick?.(lineIndex, groupId, label);
                }}
                className={`hero-chunk${isActive ? " hero-active" : ""}`}
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

/* ===== Routing-aware animation wrapper ===== */
const TRANSITION_KEY = "__hero_transition__";

function randomSeedU32() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 2 ** 32);
}

export function AnimatedHeader({
  lines,
  gapPx,
  framesBetweenReveals = 1,
  activeLabel,
  onResolveRoute,
  renderFooter,
}: {
  lines: HeaderLine[];
  gapPx: number;
  framesBetweenReveals?: number;
  activeLabel?: string;
  onResolveRoute: (lineIndex: number, groupId: number, label: string) => string | null;
  renderFooter?: (phase: Phase) => React.ReactNode;
}) {
  const router = useRouter();
  const activeKey = activeLabel
    ? activeLabel.replace(/\//g, "").replace(/\s+/g, " ").trim().toUpperCase()
    : null;

  const FRAMES_BETWEEN_REVEALS = framesBetweenReveals;

  const [mounted, setMounted] = useState(false);

  // if we arrived via a transition, start blank 1 frame then reveal
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window !== "undefined") {
      const raw = sessionStorage.getItem(TRANSITION_KEY);
      if (raw) {
        sessionStorage.removeItem(TRANSITION_KEY);
        return "blank";
      }
    }
    return "idle";
  });

  const [transitionSeed, setTransitionSeed] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const raw = sessionStorage.getItem(TRANSITION_KEY);
      if (raw) {
        try {
          const payload = JSON.parse(raw) as { seed?: number };
          return typeof payload.seed === "number" ? payload.seed : randomSeedU32();
        } catch {}
      }
    }
    return randomSeedU32();
  });

  const { ranksByLine, totalUnits } = useMemo(() => makeRanksForLines(lines, transitionSeed), [lines, transitionSeed]);

  const [measuredCount, setMeasuredCount] = useState(0);
  const allMeasured = measuredCount >= lines.length;

  const [revealCount, setRevealCount] = useState(0);
  const revealRef = useRef(0);
  const frameRef = useRef(0);

  const pendingRouteRef = useRef<string | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    setMeasuredCount(0);
  }, [lines]);

  // if we start blank (coming from previous page), advance to revealing on next frame
  useEffect(() => {
    if (!mounted) return;
    if (phase !== "blank") return;
    const raf = requestAnimationFrame(() => {
      const route = pendingRouteRef.current;
      if (route) {
        pendingRouteRef.current = null;
        // tell next page to start blank + which seed to use
        sessionStorage.setItem(
          TRANSITION_KEY,
          JSON.stringify({ seed: randomSeedU32(), startBlank: true })
        );
        router.push(route);
        return;
      }
      setPhase("revealing");
    });
    return () => cancelAnimationFrame(raf);
  }, [mounted, phase, router]);

  // ensure initial reveal if we started idle
  useEffect(() => {
    if (!mounted) return;
    if (phase === "idle") {
      setPhase("revealing");
    }
  }, [mounted]);

  // failsafe: finish => idle
  useEffect(() => {
    if (!mounted) return;
    if (!allMeasured) return;
    if (phase === "revealing" && revealCount >= totalUnits) {
      setPhase("idle");
    }
  }, [mounted, allMeasured, phase, revealCount, totalUnits]);

  useEffect(() => {
    if (!mounted) return;
    if (!allMeasured) return;

    let raf = 0;
    frameRef.current = 0;

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

      if (phase === "hiding" && revealRef.current === 0) {
        setPhase("blank");
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    if (phase === "revealing") {
      revealRef.current = 0;
      setRevealCount(0);
      raf = requestAnimationFrame(tick);
    } else if (phase === "hiding") {
      revealRef.current = totalUnits;
      setRevealCount(totalUnits);
      raf = requestAnimationFrame(tick);
    } else if (phase === "idle") {
      revealRef.current = totalUnits;
      setRevealCount(totalUnits);
    }

    return () => cancelAnimationFrame(raf);
  }, [mounted, allMeasured, totalUnits, FRAMES_BETWEEN_REVEALS, phase, router]);

  const handleGroupClick = (lineIndex: number, groupId: number, label: string) => {
    // Allow clicks during reveal; only block while transitioning away
    if (phase === "hiding" || phase === "blank") return;

    const route = onResolveRoute(lineIndex, groupId, label);
    if (!route) return;

    pendingRouteRef.current = route;
    setPhase("hiding");
  };

  return (
    <>
      <style jsx global>{`
        /* hard kill underlines */
        a,
        a:visited,
        a:hover,
        a:active {
          color: inherit;
          text-decoration: none;
        }
        .hero-chunk {
          color: inherit;
          text-decoration: none;
          cursor: pointer;
        }
        .hero-chunk:hover {
          color: #f5ff00;
        }
        .hero-active {
          animation: heroFlash 1s steps(2, end) infinite;
        }
        @keyframes heroFlash {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
      `}</style>

      <div
        className="mx-auto w-full max-w-[1280px] px-6"
        style={{
          position: "relative",
          zIndex: 1,
          overflow: "visible",
          paddingTop: "55px",
          paddingBottom: "40px",
        }}
      >
        <div className="hero-title uppercase tracking-[-0.02em]" style={{ color: "#2E2E2E" }}>
          {!mounted ? null : phase === "blank" ? null : (
            <div style={{ display: "flex", flexDirection: "column", gap: `${gapPx}px` }}>
              {lines.map((l, i) => (
                <FitLine
                  key={`line-${i}`}
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
                  activeKey={activeKey}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {renderFooter ? renderFooter(phase) : null}
    </>
  );
}