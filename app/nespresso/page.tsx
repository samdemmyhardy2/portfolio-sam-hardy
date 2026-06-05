"use client";

import React, { useMemo } from "react";
import { AnimatedHeader, type HeaderLine } from "../components/AnimatedHeader";

export default function NespressoPage() {
  const GAP_PX = 10;
  const TOPLINE_TARGET = 0.991;
  const CURRENT_ROUTE = "/nespresso";
  const ACTIVE_LABEL = "NESPRESSO";

  const lines = useMemo<HeaderLine[]>(
    () => [
      {
        text: "NESPRESSO/ CHRISTIES AUCTION HOUSE/",
        minPx: 30,
        maxPx: 100,
        targetFill: TOPLINE_TARGET,
        perItemLinks: true,
        nonLinkGroupIds: [],
      },
      {
        text: "GIVENCHY/ FARFETCH/ OBODO/ NET-A-PORTER/ WAGAMAMA/",
        minPx: 26,
        maxPx: 90,
        targetFill: 1,
        perItemLinks: true,
        nonLinkGroupIds: [],
      },
    ],
    []
  );

  return (
    <main className="h-screen overflow-hidden" style={{ backgroundColor: "#F5FF00" }}>
      <AnimatedHeader
        lines={lines}
        gapPx={GAP_PX}
        framesBetweenReveals={2}
        activeLabel={ACTIVE_LABEL}
        onResolveRoute={(_lineIndex, _groupId, label) => {
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
          const route = routeMap[normalized] ?? null;
          return route === CURRENT_ROUTE ? null : route;
        }}
      />
    </main>
  );
}
