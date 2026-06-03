// app/opengraph-image.js — dynamically generated Open Graph image (1200x630).
// What it does: renders the social-share card shown when the homepage URL is
// posted to Facebook, LinkedIn, WhatsApp, etc. No static asset needed.
// What it does NOT do: it is not used inside the app UI.

import { ImageResponse } from "next/og";

export const alt = "SwapTest — swap your UK driving test date with someone";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #111110 0%, #0d1a15 100%)",
          color: "#f0eee4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: "#5DCAA5", marginBottom: 28 }}>
          SwapTest
        </div>
        <div style={{ display: "flex", fontSize: 70, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-2px", maxWidth: 1000 }}>
          Swap your UK driving test date with someone
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#9c9a92", marginTop: 32 }}>
          Free DVSA test date swapping. Same centre or nearby.
        </div>
      </div>
    ),
    { ...size }
  );
}
