"use client";

import { useRouter } from "next/navigation";
import overlay from "../../modalOverlay.module.css";
import s from "../../../animals/richi/richi.module.css";

const RITCHI_PHOTO_URL =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600";

export default function RichiModalPage() {
  const router = useRouter();

  const onClose = () => router.back();

  const onEdit = () => {
    router.push("/animals/richi/edit");
  };

  return (
    <div className={`${overlay.overlay} ${overlay.center}`} role="dialog" aria-modal="true">
      <div className={s.modal}>
        <button className={s.closeBtn} type="button" onClick={onClose} aria-label="Закрыть">
          ×
        </button>

        <header className={s.header}>
          <img src={RITCHI_PHOTO_URL} alt="Фото собаки по имени Ричи" className={s.photo} />
          <div className={s.info}>
            <h1 className={s.name}>Ричи</h1>
            <p className={s.meta}>Собака, 1 год</p>
            <p className={s.meta}>Порода: Лабрадор</p>
          </div>
        </header>

        <main className={s.body}>
          <section className={s.section}>
            <h2 className={s.sectionTitle}>История</h2>
            <p className={s.text}>
              Найден на улице в возрасте 2 месяцев. Был истощён, сейчас чувствует себя отлично.
            </p>
          </section>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>Состояние здоровья</h2>
            <p className={s.text}>Здоров, привит, обработан от паразитов</p>
          </section>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>Характер</h2>
            <p className={s.text}>Дружелюбный, активный, любит детей</p>
          </section>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>Особые потребности</h2>
            <p className={s.text}>Нуждается в длительных прогулках</p>
          </section>
        </main>

        <footer className={s.footer}>
          <button type="button" className={s.editBtn} onClick={onEdit}>
            РЕДАКТИРОВАТЬ
          </button>
        </footer>
      </div>
    </div>
  );
}