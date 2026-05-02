"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#0a0a0f", color: "#f2f0e8", fontFamily: "sans-serif", padding: 24 }}>
        <h2 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</h2>
        <p style={{ marginBottom: 16, color: "#8a8a9a" }}>{error.message}</p>
        <button onClick={reset} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #333", background: "#111", color: "#fff" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
