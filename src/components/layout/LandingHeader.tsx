import Link from "next/link";
import { User } from "lucide-react";
import s from "@/src/app/landing.module.css";

export function LandingHeader() {
  return (
    <header className={s.header}>
      <div className={`${s.container} ${s.headerInner}`}>
        <Link href="/" className={s.logo}>
          <div className={s.logoIcon}>
            <img src="/images/лого.svg" alt="Логотип" />
          </div>
          <div className={s.logoText}>
            <span>ЛАПА</span>
            <br />
            <span>ПОМОЩИ</span>
          </div>
        </Link>

        <nav className={s.headerNav}>
          <div className={s.navLinks}>
            <Link href="/" className={s.navLink}>
              Главная
            </Link>

            <Link id="nav-knowledge" href="/knowledge" className={s.navLink}>
              Медиатека
            </Link>

            <Link id="nav-tasks" href="/tasks" className={s.navLink}>
              Задачи
            </Link>

            <Link id="nav-chat" href="/chat" className={s.navLink}>
              Чат
            </Link>

            <Link id="nav-calendar" href="/calendar" className={s.navLink}>
              Календарь
            </Link>
          </div>

          <Link id="nav-profile" href="/profile" className={s.profile}>
            <User size={26} strokeWidth={2} />
          </Link>
        </nav>
      </div>
    </header>
  );
}