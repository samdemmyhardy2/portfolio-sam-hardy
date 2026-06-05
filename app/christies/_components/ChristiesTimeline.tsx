import Image from "next/image";
import React from "react";

export type TimelineItem = {
  title: string;
  description: string;
};

const PAGE_MAX = 1696;
const SIDE_PADDING = 101;
const TEXT_COLOR = "#2E2E2E";

const IMAGE_SRC = "/Christies/Images (2x)/Christies-Hero-Web.png";

export function ChristiesTimeline({ items }: { items: TimelineItem[] }) {
  const first = items[0];
  if (!first) return null;

  return (
    <section className="w-full" style={{ color: TEXT_COLOR }}>
      <div
        className="mx-auto w-full"
        style={{
          maxWidth: PAGE_MAX,
          paddingLeft: SIDE_PADDING,
          paddingRight: SIDE_PADDING,
        }}
      >
        <div
          className="grid grid-cols-1 items-start gap-6 md:grid-cols-[765px_148px_581px]"
          style={{ marginTop: 148 }}
        >
          <div className="flex flex-col">
            <Image
              src={IMAGE_SRC}
              alt=""
              width={765}
              height={510}
              className="block h-auto w-full object-contain"
            />
            <div style={{ marginBottom: 148 }} />
          </div>
          <div className="hidden md:block" />
          <div className="flex flex-col">
            <div style={{ marginTop: 187 }}>
              <div
                className="font-black uppercase tracking-[-0.02em]"
                style={{ fontSize: 46, marginBottom: 46 }}
              >
                {first.title}
              </div>
              <div className="text-[12px] leading-[1.5]" style={{ marginBottom: 186 }}>
                {first.description}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
