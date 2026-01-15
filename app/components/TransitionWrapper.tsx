"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export type NavLine = {
  text: string;
  minPx?: number;
  maxPx?: number;
  targetFill?: number;
  perItemLinks?: boolean;
  nonLinkGroupIds?: number[];
};

type TransitionWrapperProps = {
  lines: NavLine[];
  gapPx?: number;
  onGroupClick?: (lineIndex: number, groupId: number, label: string) => void;

  /**
   * Optional: if you keep TransitionWrapper in a persistent layout, pass resetKey={pathname}
   * so it re-triggers when the route changes.
   */
  resetKey?: string;
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

type FitLineProps = {
  text: string;
  minPx?: number;
  maxPx?: number;
  targetFill?: number;
  perItemLinks?: boolean;

  rankByUnitIndex?: number[];
  revealCount?: number;

  nonLinkGroupIds?: number[];
  onMeasured?: () => void;

  lineIndex?: number;
  onGroupClick?: (lineIndex: number, groupId: number, label: string) => void;
};

function FitLine({
  text,
  minPx = 18,
  maxPx = 140,
  targetFill = 1,
  perItemLinks = false,
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
    () => `"HN-Condensed-Black","Helvetica Neue Condensed Black","Helvetica Neue",Arial,sans-serif`,
    []
  );

  const slashFontFamily = useMemo(() => `"HN-UltraLight","Helvetica Neue",Arial,sans-serif`, []);

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
    const rank = rankByUnitIndex?.[unitIndex] ?? 0;
    const visible = rank < revealCount;
    return <span style={{ visibility: visible ? "visible" : "hidden" }}>{children}</span>;
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

            const label = groupLabel(unitIdxs);

            return (
              <a
                key={`g-${groupId}`}
                href="#"
                className="hero-chunk"
                aria-label={`item-${groupId}`}
                onClick={(e) => {
                  e.preventDefault();
                  onGroupClick?.(lineIndex, groupId, label);
                }}
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

export function TransitionWrapper({ lines, gapPx = 10, onGroupClick, resetKey }: TransitionWrapperProps) {
  const FRAMES_BETWEEN_REVEALS = 1;

  const [transitionSeed, setTransitionSeed] = useState<number>(() => {
    if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
      return crypto.getRandomValues(new Uint32Array(1))[0];
    }
    return Math.floor(Math.random() * 2 ** 32);
  });

  // When lines change (or resetKey changes), force a fresh random order
  useEffect(() => {
    const newSeed =
      typeof crypto !== "undefined" && "getRandomValues" in crypto
        ? crypto.getRandomValues(new Uint32Array(1))[0]
        : Math.floor(Math.random() * 2 ** 32);
    setTransitionSeed(newSeed);
  }, [lines, resetKey]);

  const { ranksByLine, totalUnits } = useMemo(() => {
    return makeRanksForLines(lines, transitionSeed);
  }, [lines, transitionSeed]);

  const [measuredCount, setMeasuredCount] = useState(0);
  const allMeasured = measuredCount >= lines.length;

  const [revealCount, setRevealCount] = useState(0);
  const revealRef = useRef(0);
  const frameRef = useRef(0);

  // reset measurement tracking when the content changes
  useEffect(() => {
    setMeasuredCount(0);
  }, [lines, resetKey]);

  // Start hidden → reveal on mount/lines-change
  useEffect(() => {
    if (!allMeasured) return;

    let raf = 0;
    revealRef.current = 0;
    frameRef.current = 0;
    setRevealCount(0);

    const tick = () => {
      frameRef.current += 1;

      if (frameRef.current % FRAMES_BETWEEN_REVEALS === 0) {
        if (revealRef.current < totalUnits) {
          revealRef.current += 1;
          setRevealCount(revealRef.current);
        }
      }

      if (revealRef.current < totalUnits) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [allMeasured, totalUnits, FRAMES_BETWEEN_REVEALS, lines, resetKey]);

  return (
    <>
      <style jsx global>{`
        /* ✅ kill default browser link styling (blue underline) */
        .hero-chunk,
        .hero-chunk:visited,
        .hero-chunk:hover,
        .hero-chunk:active,
        .hero-chunk:focus {
          color: inherit !important;
          text-decoration: none !important;
          cursor: pointer;
        }
        .hero-chunk:hover {
          color: #f5ff00 !important;
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1280px] px-6 py-10">
        <div className="hero-title uppercase tracking-[-0.02em]" style={{ color: "#2E2E2E" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: `${gapPx}px` }}>
            {lines.map((l, i) => (
              <FitLine
                key={`${resetKey ?? "page"}-${i}-${l.text}`}
                text={l.text}
                minPx={l.minPx}
                maxPx={l.maxPx}
                targetFill={l.targetFill}
                perItemLinks={l.perItemLinks}
                nonLinkGroupIds={l.nonLinkGroupIds ?? []}
                rankByUnitIndex={ranksByLine[i]}
                revealCount={revealCount}
                onMeasured={() => setMeasuredCount((c) => c + 1)}
                lineIndex={i}
                onGroupClick={onGroupClick}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}