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
import { apiFetch } from "@/src/lib/api/http";

import { getAnimal } from "@/src/lib/storage/animals";
import { getTask, respondToTask } from "@/src/lib/storage/tasks";

import type { Animal } from "@/src/types/animal";
import type { Task } from "@/src/types/task";

const FALLBACK_PHOTO = "https://placehold.co/100x100/eef3f8/777?text=Фото";

type PublicUserDto = {
  userId?: string;
  name?: string | null;
  fullName?: string | null;
  fio?: string | null;
  email?: string | null;
};

function pickCuratorName(u: PublicUserDto | null): string {
  if (!u) return "—";
  const raw = u.name ?? u.fullName ?? u.fio ?? u.email ?? "";
  const s = String(raw).trim();
  return s || "—";
}

function formatDateTimeRange(task: Task) {
  const a = task.startAt ? new Date(task.startAt) : null;
  const b = task.endAt ? new Date(task.endAt) : null;

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

  const [task, setTaskState] = useState<Task | null>(null);
  const [animal, setAnimalState] = useState<Animal | null>(null);

  const [curatorName, setCuratorName] = useState<string>("—");

  const [responding, setResponding] = useState(false);
  const [alreadyResponded, setAlreadyResponded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const profile = await fetchCurrentProfile();
        setMe(profile);

        const tsk = getTask(id);
        if (!tsk) {
          alert("Задача не найдена");
          router.back();
          return;
        }

        setTaskState(tsk);

        const an = tsk.animalId ? getAnimal(tsk.animalId) : null;
        setAnimalState(an);

        // Уже откликался?
        if (profile) {
          const exists = tsk.responses.some(
            (r) => r.userId === profile.userId && r.status !== "withdrawn"
          );
          setAlreadyResponded(exists);
        }

        // Имя куратора (swagger: GET /api/Users/public/{userId})
        try {
          const u = (await apiFetch(`/api/Users/public/${tsk.creatorUserId}`)) as PublicUserDto;
          setCuratorName(pickCuratorName(u));
        } catch {
          setCuratorName("—");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const onClose = () => router.back();

  const canRespond = useMemo(() => {
    if (!me) return false;
    if (!task) return false;
    if (isOrgRole(me.role)) return false; // отклик только волонтёрам
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
      alert("Нужно войти в аккаунт");
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
      const res = respondToTask(task.id, profile.userId);

      if (res.ok) {
        setAlreadyResponded(true);
        alert("Отклик отправлен");
        return;
      }

      if (res.reason === "ALREADY") {
        setAlreadyResponded(true);
        alert("Вы уже откликались на эту задачу");
        return;
      }

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

  const photoUrl = animal?.photoUrl || FALLBACK_PHOTO;

  const animalTitle = animal?.name?.trim()
    ? animal.name.trim()
    : animal?.species?.trim()
      ? animal.species
      : "Животное";

  const animalMeta = [animal?.species, animal?.age].filter(Boolean).join(", ");
  const breed = animal?.breed?.trim() ? animal.breed.trim() : "";

  const comps = task.competencies || [];
  const dateTimeText = formatDateTimeRange(task);

  const volunteersCount =
    (task as unknown as { requiredVolunteers?: number }).requiredVolunteers ??
    (task as unknown as { volunteersNeeded?: number }).volunteersNeeded ??
    "—";

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
                  {animalMeta ? <p className={m.animalLine}>{animalMeta}</p> : null}
                  {breed ? <p className={m.animalLine}>Порода: {breed}</p> : null}

                  {animal ? (
                    <Link className={m.moreLink} href={`/animals/${animal.id}`}>
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
                  <span className={m.label}>Куратор:</span> {curatorName}
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
                  <span className={t.tag}>{task.district || "—"}</span>
                </div>

                <div className={m.row}>
                  <span className={m.label}>Дата и время:</span> {dateTimeText}
                </div>

                <div className={m.row}>
                  <span className={m.label}>Волонтёров:</span> {volunteersCount}
                </div>
              </div>

              {/* Кнопка отклика — 1в1 как "Удалить" в редактировании */}
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