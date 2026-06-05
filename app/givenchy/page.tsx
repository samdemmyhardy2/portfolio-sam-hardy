"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatedHeader, type HeaderLine } from "../components/AnimatedHeader";

export default function GivenchyPage() {
  const GAP_PX = 10;
  const TOPLINE_TARGET = 0.991;
  const CURRENT_ROUTE = "/givenchy";
  const ACTIVE_LABEL = "GIVENCHY";

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

  const firstRow = useMemo(
    () => ({
      title: "CHRISTIES AUCTION HOUSE: LIVE BIDDING",
      description:
        "Sandbox copy of the Christie’s case study for squiggle work. The live Christie’s page is unchanged.",
      image: "/Christies/Images (2x)/Christies-Hero-Web.png",
    }),
    []
  );

  return (
    <main className="min-h-screen bg-[#F5FF00]">
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

      <section className="w-full">
        <div
          className="mx-auto w-full"
          style={{
            maxWidth: 1696,
            paddingLeft: 24,
            paddingRight: 24,
          }}
        >
          <div className="grid grid-cols-[765px_132px_581px] items-start" style={{ marginTop: 92 }}>
            <div className="flex flex-col">
              <Image
                src={firstRow.image}
                alt=""
                width={765}
                height={581}
                className="block h-auto w-full object-contain"
              />
              <div style={{ marginBottom: 148 }} />
            </div>
            <div className="block" />
            <div className="flex flex-col" style={{ width: 581 }}>
              <div style={{ marginTop: 187 }}>
                <div
                  className="uppercase tracking-[-0.02em]"
                  style={{
                    fontSize: 36,
                    marginBottom: 46,
                    fontFamily:
                      '"HN-Condensed-Black","Helvetica Neue Condensed Black","Helvetica Neue",Arial,sans-serif',
                    fontWeight: 900,
                  }}
                >
                  {firstRow.title}
                </div>
                <div className="text-[12px] leading-[1.5]" style={{ marginBottom: 24 }}>
                  {firstRow.description}
                </div>
                <p className="text-[12px] leading-[1.5]">
                  <Link
                    href="http://localhost:3001/projects/givenchy-page.html"
                    className="underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open timeline sandbox (static squiggle)
                  </Link>
                  {" · "}
                  <Link href="/christies" className="underline">
                    Christie’s (Next)
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
