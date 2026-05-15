"use client";

import { useRouter } from "next/navigation";

export function BackHeader({ title }: { title: string }) {
  const router = useRouter();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Назад"
        style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          border: "2px solid rgba(6, 53, 94, 1)",
          background: "#fff",
          color: "#06355e",
          cursor: "pointer",
          fontSize: 22,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
        }}
      >
        ←
      </button>

      <h1 style={{ margin: 0, color: "#1c274c", fontSize: 22, fontWeight: 600 }}>
        {title}
      </h1>
    </div>
  );
}