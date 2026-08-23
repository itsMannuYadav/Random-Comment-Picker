import { ImageResponse } from "next/og";
import { appConfig } from "@/lib/env";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbf7f1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#cc3c1c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 30, height: 30, borderRadius: 8, border: "4px solid #fffaf6" }} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#1c1815" }}>{appConfig.name}</div>
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            color: "#1c1815",
            textAlign: "center",
            lineHeight: 1.1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Pick a winner.</span>
          <span>Make it fair.</span>
        </div>
        <div style={{ fontSize: 28, color: "#75695c", marginTop: 28 }}>
          Random. Simple. Fair. — YouTube, Reddit &amp; more
        </div>
      </div>
    ),
    { ...size }
  );
}
