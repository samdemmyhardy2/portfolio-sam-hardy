"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const ARTBOARD_W = 1440;
const ARTBOARD_H = 6400;

const BG = "#F5FF00";
const TEXT = "#2E2E2E";

type Block = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  body: string;
  image: string;
  align: "left" | "right";
};

const BLOCKS: Block[] = [
  {
    id: "hero",
    x: 120,
    y: 240,
    w: 520,
    h: 360,
    title: "CHRISTIES AUCTION HOUSE: LIVE BIDDIN",
    body:
      "A 9-month contract with the historic auction house working to bring bidding online and accessible for all. Christies users spend significant amounts of money in single transactions; meaning we had to rethink the “classic” e-commerce flow",
    image: "/Christies/Group 157576.png",
    align: "left",
  },
  {
    id: "mobile",
    x: 930,
    y: 610,
    w: 220,
    h: 360,
    title: "Live Bidding: Mobile versio",
    body:
      "During the design ideation, a number of different approaches where considered, including a modal overlay, inline and opening a new page. In the end we opted for an inline experience on desktop and a modal overlay for mobile",
    image: "/Christies/Landing Page - Mobile [Bids Overlay].png",
    align: "right",
  },
  {
    id: "timeline-1",
    x: 180,
    y: 980,
    w: 300,
    h: 220,
    title: "design journey timelin",
    body:
      "The first thing to do with a redesign is look at the current site, lay every page in the journey out and group issues from past user tests, customer complaints, bugs, best practice and general observations",
    image: "/Christies/Group 157561.png",
    align: "left",
  },
  {
    id: "lowfi",
    x: 900,
    y: 1220,
    w: 240,
    h: 200,
    title: "Lowfi wireframe",
    body:
      "When in a testing environment, lowfi black & white wireframes can invoke different comments from users who identify it as more of a “sketch” as opposed to a real working product",
    image: "/Christies/Mask Groupq.png",
    align: "right",
  },
  {
    id: "figma",
    x: 180,
    y: 1460,
    w: 240,
    h: 200,
    title: "dev friendly figma executio",
    body:
      "Creating the final design file execution reference file for the Developers. The Christies design system was not yet in existence so reusable best practice on brand components where created",
    image: "/Christies/Mask Groupq-1.png",
    align: "left",
  },
  {
    id: "card-sort",
    x: 900,
    y: 1720,
    w: 240,
    h: 200,
    title: "In-person card sorting workshop",
    body:
      "As the discovery for the project was ramping up, and many stakeholders where involved and asking for various features to be included, we decided to host an in person workshop in Prague featuring stakeholders from New York and London",
    image: "/Christies/Mask Groupwer.png",
    align: "right",
  },
  {
    id: "user-flow",
    x: 180,
    y: 1980,
    w: 240,
    h: 200,
    title: "User flo",
    body:
      "Identifying the area of the journey we will be working on is crucial as we need to “take the baton” from the other pages of the product",
    image: "/Christies/Vector.png",
    align: "left",
  },
  {
    id: "user-testing",
    x: 900,
    y: 2260,
    w: 240,
    h: 200,
    title: "User Testin",
    body:
      "Thought the project we did 2 rounds of user testing. The first round more of a “sanity check” with general users, the second test focused on real Christie's users",
    image: "/Christies/Screenshot 2022-08-09 at 12.30 1.png",
    align: "right",
  },
  {
    id: "analytics",
    x: 180,
    y: 2550,
    w: 240,
    h: 200,
    title: "Analytic",
    body: "Using the tool “HotJar” we where able to identify certain friction points and focus on them",
    image: "/Christies/Group 37aw 1.png",
    align: "left",
  },
];

const USER_FLOW = [
  "User Enters Site and lands on the homepage",
  "User Clicks auctions and lands on the auctions calendar page",
  "User is presented with the option to place an advanced bid",
  "User is presented with information related to placing an advanced bid",
  "User places advanced bid",
  "User is notified the status of their bid",
  "User selects an auction with advanced bidding",
  "User clicks on a lot item within the auctions listing page",
  "User registers with christie",
  "User verifies identit",
];

export function CaseStudyCanvas() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scaleX = (w - 24 * 2) / ARTBOARD_W;
      const scaleY = (h - 24 * 2) / ARTBOARD_H;
      setScale(Math.min(scaleX, scaleY, 1));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const artboardStyle = useMemo(
    () => ({
      width: ARTBOARD_W,
      height: ARTBOARD_H,
      position: "relative" as const,
      background: BG,
      transform: `scale(${scale})`,
      transformOrigin: "top center",
    }),
    [scale]
  );

  return (
    <div
      ref={wrapRef}
      style={{
        display: "flex",
        justifyContent: "center",
        paddingBottom: 120,
      }}
    >
      <div style={{ height: ARTBOARD_H * scale }}>
        <div style={artboardStyle}>
          <svg
            width={ARTBOARD_W}
            height={ARTBOARD_H}
            style={{ position: "absolute", inset: 0 }}
          >
            <line
              x1={ARTBOARD_W / 2}
              y1={520}
              x2={ARTBOARD_W / 2}
              y2={ARTBOARD_H - 520}
              stroke={TEXT}
              strokeWidth={2}
              strokeDasharray="8 8"
            />
            {BLOCKS.map((b) => (
              <circle
                key={`node-${b.id}`}
                cx={ARTBOARD_W / 2}
                cy={b.y + 60}
                r={6}
                fill={TEXT}
              />
            ))}
          </svg>

          <div
            style={{
              position: "absolute",
              top: 480,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 16,
              color: TEXT,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              fontFamily:
                `"HN-Condensed-Black","Helvetica Neue Condensed Black","Helvetica Neue",Arial,sans-serif`,
            }}
          >
            design journey timelin
          </div>

          {BLOCKS.map((b) => (
            <div key={b.id}>
              <img
                src={b.image}
                alt=""
                style={{
                  position: "absolute",
                  left: b.align === "left" ? b.x : undefined,
                  right: b.align === "right" ? ARTBOARD_W - (b.x + b.w) : undefined,
                  top: b.y,
                  width: b.w,
                  height: "auto",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: b.align === "left" ? ARTBOARD_W / 2 + 80 : b.x,
                  right: b.align === "right" ? ARTBOARD_W / 2 + 80 : undefined,
                  top: b.y + 10,
                  width: 280,
                  color: TEXT,
                  fontFamily:
                    `"HN-Condensed-Black","Helvetica Neue Condensed Black","Helvetica Neue",Arial,sans-serif`,
                  textTransform: "uppercase",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 900 }}>{b.title}</div>
                <div style={{ fontSize: 11, marginTop: 8, lineHeight: 1.4 }}>
                  {b.body}
                </div>
              </div>
              {debug ? (
                <div
                  style={{
                    position: "absolute",
                    left: b.align === "left" ? b.x : ARTBOARD_W - (b.x + b.w),
                    top: b.y,
                    width: b.w,
                    height: b.h,
                    border: "1px dashed rgba(0,0,0,0.3)",
                  }}
                />
              ) : null}
            </div>
          ))}

          <div
            style={{
              position: "absolute",
              left: 180,
              top: 3000,
              width: 520,
              color: TEXT,
              fontFamily:
                `"HN-Condensed-Black","Helvetica Neue Condensed Black","Helvetica Neue",Arial,sans-serif`,
              textTransform: "uppercase",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 900 }}>User Flo</div>
            <div style={{ fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
              {USER_FLOW.map((s, i) => (
                <div key={`${s}-${i}`}>{s}</div>
              ))}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 120,
              bottom: 260,
              color: TEXT,
              fontFamily:
                `"HN-Condensed-Black","Helvetica Neue Condensed Black","Helvetica Neue",Arial,sans-serif`,
              textTransform: "uppercase",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              fontSize: 36,
              lineHeight: 1,
            }}
          >
            Sam Hardy Lead Product
            <br />
            Designer/ &nbsp; Hire Me/ &nbsp; About ME/
          </div>
          <div
            style={{
              position: "absolute",
              left: 120,
              bottom: 210,
              color: TEXT,
              fontFamily:
                `"HN-Condensed-Black","Helvetica Neue Condensed Black","Helvetica Neue",Arial,sans-serif`,
              textTransform: "uppercase",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              fontSize: 24,
              lineHeight: 1,
            }}
          >
            Nespresso/ Christies Auction House/
            <br />
            Givenchy/ Farfetch/ Obodo/ Net-A-Porter/ Wagamama/
          </div>

          {debug ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                border: "1px solid rgba(0,0,0,0.3)",
              }}
            />
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDebug((v) => !v)}
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          fontSize: 12,
          background: "rgba(0,0,0,0.2)",
          color: TEXT,
          border: "1px solid rgba(0,0,0,0.3)",
          borderRadius: 6,
          padding: "6px 10px",
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        {debug ? "Hide" : "Show"} bounds
      </button>
    </div>
  );
}
