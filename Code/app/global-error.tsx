"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <h2 style={{ fontSize: "24px", color: "#1e293b", marginBottom: "8px" }}>Something went wrong</h2>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>{error.message}</p>
            <button
              onClick={() => reset()}
              style={{ padding: "10px 24px", fontSize: "14px", fontWeight: 600, color: "#fff", background: "#0d9488", border: "none", borderRadius: "100px", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
