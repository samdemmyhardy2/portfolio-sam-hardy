"use client";

import React, { useState } from "react";

export function EasterEgg({ visible }: { visible: boolean }) {
  const SPIN_SECONDS = 2; // 50% slower vs 1s
  const [open, setOpen] = useState(false);

  // keep it hidden during blank/hide so it doesn't mess with scroll/measure
  if (!visible) return null;

  return (
    <div
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 0,
        paddingBottom: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 433 }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Easter egg"
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="/star.svg"
            alt="*"
            style={{
              width: 40, // change size here
              height: 40, // change size here
              display: "block",
              transformOrigin: "50% 50%",
              animation: `starspin ${SPIN_SECONDS}s linear infinite`,
            }}
          />
        </button>

        {open ? (
          <a
            href="https://www.vitsoe.com/gb/about/good-design"
            target="_blank"
            rel="noreferrer"
            className="hero-chunk"
            style={{
              fontFamily:
                `"HN-Condensed-Black","Helvetica Neue Condensed Black","Helvetica Neue",Arial,sans-serif`,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "#2E2E2E",
              textDecoration: "none",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            Good design makes a product understandable.
          </a>
        ) : null}
      </div>

      <style jsx global>{`
        @keyframes starspin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
