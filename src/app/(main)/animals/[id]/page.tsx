// src/app/(main)/animals/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import s from "../richi/richi.module.css";

import { animalsApi, type AnimalDto } from "@/src/lib/api/animals";
import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { ApiError } from "@/src/lib/api/http";
import { unpackAnimalSpecialNeeds } from "@/src/lib/animalHistoryBridge";

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600";

type LoadState = "loading" | "ready" | "not_found" | "unauthorized";

function yearsWordRu(n: number) {
  const a = Math.abs(n);
  const mod100 = a % 100;
  const mod10 = a % 10;

  if (mod100 >= 11 && mod100 <= 14) return "лет";
  if (mod10 === 1) return "год";
  if (mod10 >= 2 && mod10 <= 4) return "года";
  return "лет";
}

function formatAgeRu(age: number | null | undefined) {
  if (age == null) return "";
  return `${age} ${yearsWordRu(age)}`;
}

export default function AnimalCardPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const id = String(params.id || "");
  const readonly = (searchParams.get("readonly") || "") === "1";

  const [state, setState] = useState<LoadState>("loading");
  const [animal, setAnimal] = useState<AnimalDto | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setState("loading");
      setAnimal(null);
      setCanEdit(false);

      try {
        const a1 = await animalsApi.getById(id);
        if (cancelled) return;

        setAnimal(a1);

        // compute edit permission: owner
        try {
          const me = await fetchCurrentProfile(); // null if not authorized
          if (cancelled) return;

          const ownerIds = (a1.owners || []).map((o) => o.id);
          const hasAccess = Boolean(me?.userId && ownerIds.includes(me.userId));
          setCanEdit(hasAccess);
        } catch {
          setCanEdit(false);
        }

        setState("ready");
      } catch (e) {
        if (cancelled) return;

        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          setState("unauthorized");
          return;
        }

        setState("not_found");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const onClose = () => router.back();
  const onEdit = () => router.push(`/animals/${id}/edit?from=card`);

  const showEditButton = useMemo(() => {
    if (readonly) return false;
    return canEdit;
  }, [canEdit, readonly]);

  if (state === "loading") {
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

  if (state === "unauthorized") {
    return (
      <div className={s.overlay} role="dialog" aria-modal="true">
        <div className={s.modal}>
          <button className={s.closeBtn} type="button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
          <h2 style={{ margin: 0, color: "#06355e" }}>Нет доступа</h2>
          <p style={{ color: "#5f748d", marginBottom: 0 }}>
            Войдите в аккаунт, чтобы посмотреть карточку животного.
          </p>
        </div>
      </div>
    );
  }

  if (state === "not_found" || !animal) {
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
  const titleName = animal.name?.trim() ? animal.name.trim() : "Без имени";

  const metaLine = [animal.animalType, formatAgeRu(animal.age)]
    .filter(Boolean)
    .join(", ");

  // “История” и реальные “Особые потребности” извлекаем из specialNeeds
  const meta = unpackAnimalSpecialNeeds(animal.specialNeeds);

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
            {metaLine ? <p className={s.meta}>{metaLine}</p> : null}
            {animal.breed ? <p className={s.meta}>Порода: {animal.breed}</p> : null}
          </div>
        </header>

        <main className={s.body}>
          <section className={s.section}>
            <h2 className={s.sectionTitle}>История</h2>
            <p className={s.text}>{meta.history || "—"}</p>
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
            <p className={s.text}>{meta.specialNeeds || "—"}</p>
          </section>
        </main>

        {showEditButton ? (
          <footer className={s.footer}>
            <button type="button" className={s.editBtn} onClick={onEdit}>
              РЕДАКТИРОВАТЬ
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}