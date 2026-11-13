import { ImageResponse } from "next/og";

export const alt = "Abhishyanth Vemula — Software Engineer, AI Developer, Creative Technologist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social card: the site's navy-to-violet field, the name and the four-word identity. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "72px 80px",
          color: "#f6f4fa",
          background:
            "radial-gradient(60% 70% at 78% 30%, rgba(103,80,200,0.75), transparent 70%), radial-gradient(40% 40% at 90% 85%, rgba(241,126,152,0.35), transparent 70%), linear-gradient(180deg, #0b0f22, #111528)",
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 8, color: "#73dfff", textTransform: "uppercase" }}>Developer. Engineer. Creator. Gamer.</div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, marginTop: 24, letterSpacing: -3 }}>Abhishyanth Vemula</div>
        <div style={{ fontSize: 34, marginTop: 24, color: "#dce3ff" }}>Backend systems, AI agents and creative 3D web.</div>
      </div>
    ),
    size,
  );
}
