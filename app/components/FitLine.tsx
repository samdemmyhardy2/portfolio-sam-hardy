"use client";

import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

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

export function FitLine({
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
              <span
                key={`g-${groupId}`}
                onClick={() => {
                  onGroupClick?.(lineIndex, groupId, label);
                }}
                className="hero-chunk"
                aria-label={`item-${groupId}`}
                style={{ cursor: "pointer" }}
              >
                {inner}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
