import { ImageResponse } from "next/og";

import type { StaticOgImageContent } from "@/configs/seo";
import { TITLE } from "@/constants";

export interface OgImageContent extends StaticOgImageContent {
  tags?: string[];
  footerKey?: string;
  footerValue?: string;
  showAuthorName?: boolean;
}

export const ogImageSize = {
  width: 1200,
  height: 630
};

const background = [
  "radial-gradient(circle at top right, rgba(34, 211, 238, 0.24) 0%, rgba(34, 211, 238, 0) 28%)",
  "radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0) 32%)",
  "linear-gradient(135deg, #050816 0%, #0b1120 55%, #111827 100%)"
].join(", ");

export function createOgImage(content: OgImageContent): ImageResponse {
  const tags = content.tags?.slice(0, 3) ?? [];
  const shouldShowFooter = content.footerKey !== undefined && content.footerValue !== undefined;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background,
        color: "#f8fafc",
        padding: "56px",
        fontFamily: "sans-serif"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "24px",
          borderRadius: "28px",
          border: "1px solid rgba(148, 163, 184, 0.18)",
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.82) 0%, rgba(2, 6, 23, 0.7) 100%)"
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "-60px",
          width: "360px",
          height: "360px",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(34, 211, 238, 0.32) 0%, rgba(34, 211, 238, 0) 72%)"
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-160px",
          left: "-90px",
          width: "420px",
          height: "420px",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.28) 0%, rgba(59, 130, 246, 0) 74%)"
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRadius: "24px",
          padding: "12px"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              color: "#38bdf8",
              fontSize: "28px",
              letterSpacing: "0.08em",
              textTransform: "uppercase"
            }}
          >
            <span style={{ color: "#22c55e" }}>{">"}</span>
            <span>{content.eyebrow}</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#94a3b8",
              fontSize: "22px"
            }}
          >
            <span style={{ color: "#22c55e" }}>const</span>
            <span>{TITLE}</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            maxWidth: "920px"
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "64px",
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: "-0.045em"
            }}
          >
            {content.title}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "28px",
              lineHeight: 1.4,
              color: "#cbd5e1"
            }}
          >
            {content.description}
          </div>

          {tags.length > 0 ? (
            <div
              style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap"
              }}
            >
              {tags.map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 18px",
                    borderRadius: "9999px",
                    background: "rgba(15, 23, 42, 0.82)",
                    border: "1px solid rgba(56, 189, 248, 0.26)",
                    color: "#e2e8f0",
                    fontSize: "22px"
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {shouldShowFooter ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#94a3b8",
              fontSize: "24px"
            }}
          >
            <div style={{ display: "flex", gap: "12px" }}>
              <span style={{ color: "#22c55e" }}>{content.footerKey}</span>
              <span>{content.footerValue}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    ogImageSize
  );
}
