"use client";

import { useRouter } from "next/navigation";
import s from "../tasks.module.css";
import type { HelpTaskDto } from "@/src/types/helpTask";

const PLACEHOLDER_IMG = "https://placehold.co/100x100/eef3f8/777?text=Фото";

function fmtShortDate(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatTimeRange(task: HelpTaskDto) {
  const a = task.startedAt ? new Date(task.startedAt) : null;
  const b = task.endedAt ? new Date(task.endedAt) : null;
  if (!a || !b) return "—";

  // передержка: 01.05 - 07.05
  if (task.isTaskOverexposure) {
    return `${fmtShortDate(a)} - ${fmtShortDate(b)}`;
  }

  // задача: 01 мая 2026, 18:00 - 20:00
  const date = a.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const ta = a.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const tb = b.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${ta} - ${tb}`;
}

export function TaskCard({
  task,
  onEdit,
  mode,
  onOpenResponses,
}: {
  task: HelpTaskDto;
  onEdit: () => void;
  mode: "curator" | "volunteer";
  onOpenResponses?: () => void;
}) {
  const router = useRouter();
  const firstAnimal = task.animals?.[0] ?? null;
  const img = firstAnimal?.photoUrl || PLACEHOLDER_IMG;
  const district = task.locations?.[0] ?? "—";
  const responsesCount = task.countResponses ?? 0;

  const isClickable = mode === "volunteer";
  const onOpenView = () => router.push(`/tasks/${task.id}/view`);

  const onEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const onResponsesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenResponses?.();
  };

  const cardProps = isClickable
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick: onOpenView,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") onOpenView();
        },
        style: { cursor: "pointer" as const },
      }
    : {};

  const responsesNode =
    mode === "curator" ? (
      <button
        type="button"
        className={`${s.fosterResponses} ${s.responsesBtn}`}
        onClick={onResponsesClick}
        disabled={!onOpenResponses}
        aria-label={`Отклики: ${responsesCount}`}
      >
        Отклики: {responsesCount}
      </button>
    ) : (
      <div className={s.fosterResponses}>Отклики: {responsesCount}</div>
    );

  // ====== FOSTER CARD ======
  if (task.isTaskOverexposure) {
    return (
      <div className={`${s.taskCard} ${s.taskCardFoster}`} {...cardProps}>
        <img src={img} alt="Фото" className={`${s.taskCardImage} ${s.fosterPhoto}`} />

        <div className={s.fosterMain}>
          <h3 className={s.cardTitle}>{task.title}</h3>
          <p className={s.fosterDescription}>{task.description}</p>
        </div>

        <div className={s.fosterDate}>
          <span className={s.fosterMetaLabel}>Дата:</span>
          <span className={s.fosterDateValue}>{formatTimeRange(task)}</span>
        </div>

        <div className={s.fosterDistrict}>
          <span className={s.fosterMetaLabel}>Район:</span>
          <span className={s.tag}>{district}</span>
        </div>

        {responsesNode}

        {mode === "curator" ? (
          <button className={s.cardEditBtn} type="button" onClick={onEditClick} aria-label="Редактировать">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.414 2.586a2 2 0 0 0-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 0 0 0-2.828zM3 17a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5l-2 2v3H5V7h3l2-2H4a1 1 0 0 0-1 1v10z" />
            </svg>
          </button>
        ) : null}
      </div>
    );
  }

  // ====== TASK CARD ======
  return (
    <div className={`${s.taskCard} ${s.taskCardTask}`} {...cardProps}>
      <img src={img} alt="Фото" className={`${s.taskCardImage} ${s.fosterPhoto}`} />

      <div className={s.fosterMain}>
        <h3 className={s.cardTitle}>{task.title}</h3>
        <p className={s.fosterDescription}>{task.description}</p>
      </div>

      <div className={s.taskCompetencies}>
        <span className={s.fosterMetaLabel}>Компетенции:</span>
        {task.competencies?.length ? (
          <div className={s.taskCompetenciesTags}>
            {task.competencies.map((c) => (
              <span key={c} className={s.tag}>
                {c}
              </span>
            ))}
          </div>
        ) : (
          <span className={s.taskCompetenciesEmpty}>—</span>
        )}
      </div>

      <div className={s.fosterDate}>
        <span className={s.fosterMetaLabel}>Дата:</span>
        <span className={s.fosterDateValue}>{formatTimeRange(task)}</span>
      </div>

      <div className={s.fosterDistrict}>
        <span className={s.fosterMetaLabel}>Район:</span>
        <span className={s.tag}>{district}</span>
      </div>

      {responsesNode}

      {mode === "curator" ? (
        <button className={s.cardEditBtn} type="button" onClick={onEditClick} aria-label="Редактировать">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.414 2.586a2 2 0 0 0-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 0 0 0-2.828zM3 17a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5l-2 2v3H5V7h3l2-2H4a1 1 0 0 0-1 1v10z" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}