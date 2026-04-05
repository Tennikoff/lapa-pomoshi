import Link from "next/link";
import s from "@/src/app/landing.module.css";

export function LandingHeader() {
  return (
    <header className={s.header}>
      <div className={`${s.container} ${s.headerInner}`}>
        <Link href="/" className={s.logo}>
          <div className={s.logoIcon}>🐾</div>
          <div className={s.logoText}>
            <span>ЛАПА</span>
            <br />
            <span>ПОМОЩИ</span>
          </div>
        </Link>

        <nav className={s.headerNav}>
          <div className={s.navLinks}>
            <Link href="/" className={s.navLink}>Главная</Link>
            <Link href="/knowledge" className={s.navLink}>Медиатека</Link>
            <Link href="/tasks" className={s.navLink}>Задачи</Link>
            <Link href="/chat" className={s.navLink}>Чат</Link>
            <Link href="/calendar" className={s.navLink}>Календарь</Link>
          </div>

          <Link href="/profile" className={s.profile}>
            👤
          </Link>
        </nav>
      </div>
    </header>
  );
}