"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "./richi.module.css";
import { ConfirmDeleteDialog } from "../../../../components/modals/ConfirmDeleteDialog";

const RITCHI_PHOTO_URL =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600";

export default function RichiAnimalCardPage() {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const onClose = () => router.back();

  const onEdit = () => router.push("/animals/richi/edit");

  const onAskDelete = () => setDeleteOpen(true);
  const onCancelDelete = () => setDeleteOpen(false);

  const onConfirmDelete = () => {
    setDeleteOpen(false);

    alert("Карточка удалена (пока без API)");

    router.push("/profile");
  };

  return (
    <>
      <div className={s.overlay} role="dialog" aria-modal="true">
        <div className={s.modal}>
          <button className={s.closeBtn} type="button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>

          {/* МУСОРКА (белая) */}
          <button className={s.trashBtn} type="button" onClick={onAskDelete} aria-label="Удалить карточку">
            <svg
              className={s.trashIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M6 6l1 16h10l1-16" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
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

      <ConfirmDeleteDialog open={deleteOpen} onCancel={onCancelDelete} onConfirm={onConfirmDelete} />
    </>
  );
}