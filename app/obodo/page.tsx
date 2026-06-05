"use client";

import React, { useMemo } from "react";
import { AnimatedHeader, type HeaderLine } from "../components/AnimatedHeader";

export default function ObodoPage() {
  const GAP_PX = 10;
  const TOPLINE_TARGET = 0.991;
  const ACTIVE_LABEL = "OBODO";
  const CURRENT_ROUTE = "/obodo";

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
          const upper = label.toUpperCase();
          if (upper.includes("OBODO")) return null;
          if (upper.includes("NESPRESSO")) return "/nespresso";
          if (upper.includes("CHRISTIES AUCTION HOUSE")) return "/christies";
          if (upper.includes("GIVENCHY")) return "/givenchy";
          if (upper.includes("FARFETCH")) return "/farfetch";
          if (upper.includes("NET-A-PORTER")) return "/net-a-porter";
          if (upper.includes("WAGAMAMA")) return "/wagamama";
          return null;
        }}
      />
    </main>
  );
}
