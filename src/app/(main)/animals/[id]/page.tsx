"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import s from "../../animals/richi/richi.module.css";
import { getAnimal } from "@/src/lib/storage/animals";
import type { Animal } from "@/src/types/animal";

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600";

export default function AnimalCardPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params.id || "");

  const [animal, setAnimal] = useState<Animal | null | undefined>(undefined);

  useEffect(() => {
    setAnimal(getAnimal(id));
  }, [id]);

  const onClose = () => router.back();
  const onEdit = () => router.push(`/animals/${id}/edit`);

  if (animal === undefined) {
    return (
      <div className={s.overlay} role="dialog" aria-modal="true">
        <div className={s.modal}>
          <button className={s.closeBtn} type="button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
          <p style={{ margin: 0, color: "#5f748d" }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className={s.overlay} role="dialog" aria-modal="true">
        <div className={s.modal}>
          <button className={s.closeBtn} type="button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
          <h2 style={{ margin: 0, color: "#06355e" }}>Карточка не найдена</h2>
          <p style={{ color: "#5f748d" }}>Возможно, она была удалена.</p>
        </div>
      </div>
    );
  }

  const photoUrl = animal.photoUrl || FALLBACK_PHOTO;
  const titleName = animal.name?.trim() ? animal.name : "Без имени";
  const meta = [animal.species, animal.age].filter(Boolean).join(", ");

  return (
    <div className={s.overlay} role="dialog" aria-modal="true">
      <div className={s.modal}>
        <button className={s.closeBtn} type="button" onClick={onClose} aria-label="Закрыть">
          ×
        </button>

        <header className={s.header}>
          <img src={photoUrl} alt={`Фото животного ${titleName}`} className={s.photo} />
          <div className={s.info}>
            <h1 className={s.name}>{titleName}</h1>
            {meta ? <p className={s.meta}>{meta}</p> : null}
            {animal.breed ? <p className={s.meta}>Порода: {animal.breed}</p> : null}
          </div>
        </header>

        <main className={s.body}>
          <section className={s.section}>
            <h2 className={s.sectionTitle}>История</h2>
            <p className={s.text}>{animal.history || "—"}</p>
          </section>
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Состояние здоровья</h2>
            <p className={s.text}>{animal.health || "—"}</p>
          </section>
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Характер</h2>
            <p className={s.text}>{animal.character || "—"}</p>
          </section>
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Особые потребности</h2>
            <p className={s.text}>{animal.needs || "—"}</p>
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