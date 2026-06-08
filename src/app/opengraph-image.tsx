import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PrayRats — Constância espiritual em grupo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #9d50bb 0%, #7b3fe4 45%, #6e48aa 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            PrayRats
          </div>
          <div
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.8)",
              marginTop: 20,
              fontWeight: 400,
            }}
          >
            Constância espiritual em grupo
          </div>
          <div
            style={{
              display: "flex",
              gap: 32,
              marginTop: 52,
            }}
          >
            {["🔥 Streak diário", "👥 Grupos de fé", "📖 Registre momentos"].map((item) => (
              <div
                key={item}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  padding: "10px 20px",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
