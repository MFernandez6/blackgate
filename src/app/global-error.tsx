"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          background: "#0F1C2E",
          color: "#F4F4F4",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
        }}
      >
        <p style={{ letterSpacing: "0.2em", fontSize: 10, textTransform: "uppercase" }}>
          BLACKGATE
        </p>
        <h1 style={{ color: "#C6A85B", fontWeight: 600 }}>Could not launch</h1>
        <p style={{ maxWidth: 360, opacity: 0.75, fontSize: 14 }}>
          The home-screen app hit an unexpected error. Try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: 24,
            background: "#C6A85B",
            color: "#0F1C2E",
            border: 0,
            padding: "12px 20px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
