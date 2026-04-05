import s from "@/src/app/landing.module.css";
import { Mail, Phone } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.footerTop}>
          <div className={s.footerBrandRow}>
            <span className={s.footerLogo}>ЛАПА ПОМОЩИ</span>
            <span className={s.footerDesc}>
              Умная платформа для помощи животным и поддержки волонтеров
            </span>
          </div>
        </div>

        <div className={s.footerContacts}>
          <div className={s.footerContactItem}>
            <Mail size={16} strokeWidth={1.8} />
            <span>Email: help@lapapomoshi.ru</span>
          </div>

          <div className={s.footerContactItem}>
            <Phone size={16} strokeWidth={1.8} />
            <span>Телефон: +7 (912) 123-45-67</span>
          </div>
        </div>

        <div className={s.footerBottom}>
          <span>© 2026 Лапа Помощи</span>
          <span>|</span>
          <a href="#">Политика конфиденциальности</a>
          <span>|</span>
          <a href="#">Пользовательское соглашение</a>
        </div>
      </div>
    </footer>
  );
}