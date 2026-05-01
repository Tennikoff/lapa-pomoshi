"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import overlay from "@/src/app/(main)/@modal/modalOverlay.module.css";
import f from "@/src/app/(main)/tasks/foster/new/fosterNew.module.css";
import t from "@/src/app/(main)/tasks/tasks.module.css";
import m from "./taskView.module.css";

import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { isOrgRole } from "@/src/lib/role";

import { helpTasksApi } from "@/src/lib/api/helpTasks";
import { responsesApi } from "@/src/lib/api/responses";
import type { HelpTaskDto } from "@/src/types/helpTask";
import type { ResponseDto } from "@/src/types/response";

const FALLBACK_PHOTO = "https://placehold.co/100x100/eef3f8/777?text=Фото";

function formatDateTimeRange(task: HelpTaskDto) {
  const a = task.startedAt ? new Date(task.startedAt) : null;
  const b = task.endedAt ? new Date(task.endedAt) : null;
  if (!a || !b) return "—";

  const date = a.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const ta = a.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const tb = b.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  return `${date}, ${ta} – ${tb}`;
}

export default function TaskViewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params.id || "");

  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState<Awaited<ReturnType<typeof fetchCurrentProfile>> | null>(null);
  const [task, setTask] = useState<HelpTaskDto | null>(null);

  const [responding, setResponding] = useState(false);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [myResponse, setMyResponse] = useState<ResponseDto | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const profile = await fetchCurrentProfile();
        setMe(profile);

        const tsk = await helpTasksApi.getById(id);
        setTask(tsk);

        // если волонтёр — проверим через my-sent, откликался ли уже
        if (profile && !isOrgRole(profile.role)) {
          try {
            const sent = await responsesApi.mySent(0, 50);
            const found = sent.responses.find((r) => r.taskId === id) ?? null;
            setAlreadyResponded(Boolean(found));
            setMyResponse(found);
          } catch {
            // не критично
            setAlreadyResponded(false);
            setMyResponse(null);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onClose = () => router.back();

  const canRespond = useMemo(() => {
    if (!me) return false;
    if (!task) return false;
    if (isOrgRole(me.role)) return false;
    if (alreadyResponded) return false;
    return true;
  }, [alreadyResponded, me, task]);

  const ctaText = alreadyResponded
    ? "ОТКЛИК ОТПРАВЛЕН"
    : responding
      ? "..."
      : "ОТКЛИКНУТЬСЯ";

  const onRespond = async () => {
    if (!task) return;

    const profile = me ?? (await fetchCurrentProfile());
    if (!profile) {
      alert("Нужно войти в аккаунт волонтёра");
      router.push("/login");
      return;
    }

    if (isOrgRole(profile.role)) {
      alert("Отклик доступен только волонтёрам");
      return;
    }

    if (responding) return;

    setResponding(true);
    try {
      const res = await responsesApi.create(task.id);
      setAlreadyResponded(true);
      setMyResponse(res);
      alert("Отклик отправлен");
    } catch (e) {
      // если бэк вернёт текстом "уже откликались" — просто покажем общую ошибку
      alert("Не удалось отправить отклик");
    } finally {
      setResponding(false);
    }
  };

  if (loading || !task) {
    return (
      <div
        className={`${overlay.overlay} ${overlay.center}`}
        role="dialog"
        aria-modal="true"
        style={{ "--modal-dim": "0.6" } as CSSProperties}
      >
        <div className={overlay.content}>
          <div className={overlay.scrollBox} />
        </div>
      </div>
    );
  }

  const firstAnimal = task.animals?.[0] ?? null;
  const photoUrl = firstAnimal?.photoUrl || FALLBACK_PHOTO;

  const animalTitle = firstAnimal?.name?.trim()
    ? firstAnimal.name.trim()
    : "Животное";

  const district = task.locations?.[0] ?? "—";
  const comps = task.competencies ?? [];
  const dateTimeText = formatDateTimeRange(task);

  return (
    <div
      className={`${overlay.overlay} ${overlay.center}`}
      role="dialog"
      aria-modal="true"
      style={{ "--modal-dim": "0.6" } as CSSProperties}
    >
      <div className={overlay.content}>
        <div className={overlay.scrollBox}>
          <div className={m.modal}>
            <button className={m.closeBtn} type="button" onClick={onClose} aria-label="Закрыть">
              ×
            </button>

            <h2 className={m.title}>{task.title}</h2>

            <div className={m.body}>
              {/* Животное */}
              <div className={m.animalInfo}>
                <img src={photoUrl} alt={animalTitle} className={m.animalPhoto} />
                <div className={m.animalText}>
                  <h3 className={m.animalName}>{animalTitle}</h3>

                  {firstAnimal ? (
                    <Link className={m.moreLink} href={`/animals/${firstAnimal.id}`}>
                      Подробнее
                    </Link>
                  ) : null}
                </div>
              </div>

              {/* Описание */}
              <p className={m.description}>{task.description || "—"}</p>

              {/* Детали */}
              <div className={m.details}>
                <div className={m.row}>
                  <span className={m.label}>Куратор:</span> {task.creator?.name?.trim() ? task.creator.name : "—"}
                </div>

                <div className={m.row}>
                  <span className={m.label}>Компетенции:</span>
                  {comps.length ? (
                    comps.map((c) => (
                      <span key={c} className={t.tag}>
                        {c}
                      </span>
                    ))
                  ) : (
                    <span>—</span>
                  )}
                </div>

                <div className={m.row}>
                  <span className={m.label}>Район:</span>
                  <span className={t.tag}>{district}</span>
                </div>

                <div className={m.row}>
                  <span className={m.label}>Дата и время:</span> {dateTimeText}
                </div>

                <div className={m.row}>
                  <span className={m.label}>Волонтёров:</span> {task.requiredVolunteers}
                </div>

                {myResponse ? (
                  <div className={m.row}>
                    <span className={m.label}>Статус отклика:</span> {myResponse.status}
                  </div>
                ) : null}
              </div>

              {/* Кнопка отклика — как "Удалить" */}
              <div className={f.deleteRow}>
                <button
                  type="button"
                  className={f.actionBtn}
                  onClick={onRespond}
                  disabled={!canRespond || responding}
                >
                  {ctaText}
                </button>
              </div>

              {!me ? (
                <p className={m.note}>Чтобы откликнуться, нужно войти в аккаунт волонтёра.</p>
              ) : isOrgRole(me.role) ? (
                <p className={m.note}>Отклик доступен только волонтёрам.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}