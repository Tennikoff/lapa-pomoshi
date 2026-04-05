import Link from "next/link";

export function Navbar() {
  return (
    <header
      style={{
        background: "#a9dbf2",
        borderBottom: "1px solid rgba(24, 59, 102, 0.15)",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "0 20px",
          height: "82px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ fontWeight: 700, color: "#183b66" }}>
          ЛАПА ПОМОЩИ
        </Link>

        <nav style={{ display: "flex", gap: "24px" }}>
          <Link href="/">Главная</Link>
          <Link href="/knowledge">Медиатека</Link>
          <Link href="/tasks">Задачи</Link>
          <Link href="/calendar">Календарь</Link>
        </nav>
      </div>
    </header>
  );
}