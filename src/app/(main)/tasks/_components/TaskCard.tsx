"use client";

import s from "../tasks.module.css";
import type { Task } from "@/src/types/task";
import type { Animal } from "@/src/types/animal";
import { countResponses } from "@/src/lib/storage/tasks";

const PLACEHOLDER_IMG = "https://placehold.co/80x80/eef3f8/777?text=Фото";

function formatTimeRange(task: Task) {
  if (task.kind === "foster") {
    const a = task.startAt ? new Date(task.startAt) : null;
    const b = task.endAt ? new Date(task.endAt) : null;
    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (a && b) return `${fmt(a)}-${fmt(b)}`;
    if (a) return fmt(a);
    return "—";
  }

  if (task.startAt && task.endAt) {
    const a = new Date(task.startAt);
    const b = new Date(task.endAt);
    const date = a.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const ta = a.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const tb = b.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    return `${date}, ${ta} - ${tb}`;
  }

  return "—";
}

export function TaskCard({
  task,
  animal,
  onEdit,
  mode,
}: {
  task: Task;
  animal: Animal | null;
  onEdit: () => void;
  mode: "curator" | "volunteer";
}) {
  const img = animal?.photoUrl || PLACEHOLDER_IMG;
  const responsesCount = countResponses(task);

  // ====== CARD: FOSTER (особый layout) ======
  if (task.kind === "foster") {
    return (
      <div className={s.taskCard}>
        {/* Левая колонка: фото + (Район/Дата/Отклики) под фото */}
        <div className={s.cardLeft}>
          <img src={img} alt="Фото" className={s.taskCardImage} />

          <div className={s.photoMeta}>
            <div className={s.photoMetaRow}>
              <span className={s.photoMetaLabel}>Район:</span>
              <span className={s.tag}>{task.district || "—"}</span>
            </div>

            <div className={s.photoMetaRow}>
              {/* “Дата передержки” как значение (без жирного) */}
              <span className={s.photoMetaDate}>{formatTimeRange(task)}</span>
            </div>

            <div className={`${s.photoMetaRow} ${s.photoMetaResponses}`}>
              Отклики: {responsesCount}
            </div>
          </div>
        </div>

        {/* Правая часть: контент */}
        <div className={s.taskCardContent}>
          <h3 className={s.cardTitle}>{task.title}</h3>
          <p className={s.cardDescription}>{task.description}</p>

          {/* компетенции (если появятся у передержки) */}
          {task.competencies.length ? (
            <div className={s.cardDetails}>
              <div className={s.cardDetailGroup}>
                <span className={s.detailLabel}>Компетенции:</span>
                {task.competencies.map((c) => (
                  <span key={c} className={s.tag}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* карандаш только для куратора */}
        {mode === "curator" ? (
          <button
            className={s.cardEditBtn}
            type="button"
            onClick={onEdit}
            aria-label="Редактировать"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM3 17a1 1 0 001 1h12a1 1 0 001-1v-5l-2 2v3H5V7h3l2-2H4a1 1 0 00-1 1v10z" />
            </svg>
          </button>
        ) : null}
      </div>
    );
  }

  // ====== CARD: обычная задача (как было) ======
  return (
    <div className={s.taskCard}>
      <img src={img} alt="Фото" className={s.taskCardImage} />

      <div className={s.taskCardContent}>
        <h3 className={s.cardTitle}>{task.title}</h3>
        <p className={s.cardDescription}>{task.description}</p>

        <div className={s.cardDetails}>
          {task.competencies.length ? (
            <div className={s.cardDetailGroup}>
              <span className={s.detailLabel}>Компетенции:</span>
              {task.competencies.map((c) => (
                <span key={c} className={s.tag}>
                  {c}
                </span>
              ))}
            </div>
          ) : null}

          <div className={s.cardDetailGroup}>
            <span className={s.detailLabel}>Район:</span>
            <span className={s.tag}>{task.district || "—"}</span>
          </div>
        </div>

        <div className={s.cardFooter}>
          <span>{formatTimeRange(task)}</span> <br />
          <span>Отклики: {responsesCount}</span>
        </div>
      </div>

      {mode === "curator" ? (
        <button className={s.cardEditBtn} type="button" onClick={onEdit} aria-label="Редактировать">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM3 17a1 1 0 001 1h12a1 1 0 001-1v-5l-2 2v3H5V7h3l2-2H4a1 1 0 00-1 1v10z" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}