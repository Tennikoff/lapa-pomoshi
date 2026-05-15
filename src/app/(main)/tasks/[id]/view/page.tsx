"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";

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

  const ta = a.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const tb = b.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${date}, ${ta} – ${tb}`;
}

type RespKind = "none" | "pending" | "accepted" | "declined" | "other";

function normalizeStatus(s: string | null | undefined) {
  return String(s ?? "").trim();
}

function getRespKind(status: string | null | undefined): RespKind {
  const s = normalizeStatus(status);
  if (!s) return "pending";

  const low = s.toLowerCase();

  // словарь бэка: "На рассмотрении", "Принят", "Отклонен"
  if (s === "На рассмотрении" || low.includes("рассмотр")) return "pending";
  if (s === "Принят" || low.includes("прин")) return "accepted";
  if (s === "Отклонен" || low.includes("отклон")) return "declined";

  return "other";
}

export default function TaskViewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();

  // ✅ это id задачи из URL
  const taskId = String(params.id || "");

  // ✅ если мы уже ушли на другой URL (например /users/...), модалка должна исчезнуть
  const expectedPath = `/tasks/${taskId}/view`;
  const shouldShowModal = pathname === expectedPath;

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<
    Awaited<ReturnType<typeof fetchCurrentProfile>> | null
  >(null);
  const [task, setTask] = useState<HelpTaskDto | null>(null);

  const [responding, setResponding] = useState(false);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [myResponse, setMyResponse] = useState<ResponseDto | null>(null);

  const loadMyResponse = async (
    id: string,
    profile: NonNullable<typeof me>
  ) => {
    if (isOrgRole(profile.role)) return;

    try {
      const sent = await responsesApi.mySent(0, 200);
      const found = sent.responses.find((r) => r.taskId === id) ?? null;
      setAlreadyResponded(Boolean(found));
      setMyResponse(found);
    } catch {
      setAlreadyResponded(false);
      setMyResponse(null);
    }
  };

  useEffect(() => {
    // ✅ если модалка сейчас не должна показываться — не грузим данные
    if (!shouldShowModal) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const profile = await fetchCurrentProfile();
        if (cancelled) return;
        setMe(profile);

        const tsk = await helpTasksApi.getById(taskId);
        if (cancelled) return;
        setTask(tsk);

        if (profile && !isOrgRole(profile.role)) {
          await loadMyResponse(taskId, profile);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, shouldShowModal]);

  // Обновлять статус при возврате в окно (когда куратор принял/отклонил)
  useEffect(() => {
    if (!shouldShowModal) return;
    if (!me) return;
    if (isOrgRole(me.role)) return;
    if (!alreadyResponded) return;

    const onFocus = async () => {
      const profile = me ?? (await fetchCurrentProfile());
      if (profile) await loadMyResponse(taskId, profile);
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [alreadyResponded, me, taskId, shouldShowModal]);

  const onClose = () => router.back();

  const respKind: RespKind = useMemo(() => {
    if (!myResponse) return alreadyResponded ? "pending" : "none";
    return getRespKind(myResponse.status);
  }, [alreadyResponded, myResponse]);

  const canRespond = useMemo(() => {
    if (!task) return false;
    if (responding) return false;
    if (alreadyResponded) return false;
    if (!me) return true; // можно нажать — дальше попросим логин
    if (isOrgRole(me.role)) return false;
    return true;
  }, [alreadyResponded, me, responding, task]);

  const ctaText = useMemo(() => {
    if (responding) return "...";
    if (respKind === "none") return "ОТКЛИКНУТЬСЯ";
    if (respKind === "pending") return "НА РАССМОТРЕНИИ";
    if (respKind === "accepted") return "ПРИНЯТА";
    if (respKind === "declined") return "ОТКЛОНЕНА";
    return normalizeStatus(myResponse?.status) || "—";
  }, [myResponse?.status, respKind, responding]);

  const ctaClassName = useMemo(() => {
    if (respKind === "pending") return m.ctaPending;
    if (respKind === "accepted") return m.ctaAccepted;
    if (respKind === "declined") return m.ctaDeclined;
    return "";
  }, [respKind]);

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
    if (responding || alreadyResponded) return;

    setResponding(true);
    try {
      const res = await responsesApi.create(task.id);
      setAlreadyResponded(true);
      setMyResponse(res);
      alert("Отклик отправлен");
    } catch {
      alert("Не удалось отправить отклик");
    } finally {
      setResponding(false);
    }
  };

  // ✅ ключевая штука: если мы уже ушли с /tasks/:id/view — не рендерим модалку вообще
  if (!shouldShowModal) return null;

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

  // ✅ creatorId — это id куратора/организации (userId в public endpoint)
  const creatorId = task.creator?.id || null;

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
            <button
              className={m.closeBtn}
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
            >
              ×
            </button>

            <h2 className={m.title}>{task.title}</h2>

            <div className={m.body}>
              {/* Животное */}
              <div className={m.animalInfo}>
                <img
                  src={photoUrl}
                  alt={animalTitle}
                  className={m.animalPhoto}
                />
                <div className={m.animalText}>
                  <h3 className={m.animalName}>{animalTitle}</h3>
                  {firstAnimal ? (
                    <Link
                      className={m.moreLink}
                      href={`/animals/${firstAnimal.id}`}
                    >
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
                  <span className={m.label}>Куратор:</span>{" "}
                  {creatorId ? (
                    <Link href={`/users/${creatorId}`} className={m.creatorLink}>
                      {task.creator?.name?.trim()
                        ? task.creator.name
                        : "Без имени"}
                    </Link>
                  ) : (
                    <span>
                      {task.creator?.name?.trim() ? task.creator.name : "—"}
                    </span>
                  )}
                </div>

                <div className={m.row}>
                  <span className={m.label}>Компетенции:</span>{" "}
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
                  <span className={m.label}>Район:</span>{" "}
                  <span className={t.tag}>{district}</span>
                </div>

                <div className={m.row}>
                  <span className={m.label}>Дата и время:</span> {dateTimeText}
                </div>

                <div className={m.row}>
                  <span className={m.label}>Волонтёров:</span>{" "}
                  {task.requiredVolunteers}
                </div>
              </div>

              {/* Кнопка отклика */}
              <div className={f.deleteRow}>
                <button
                  type="button"
                  className={`${f.actionBtn} ${ctaClassName}`}
                  onClick={onRespond}
                  disabled={!canRespond || responding || respKind !== "none"}
                >
                  {ctaText}
                </button>
              </div>

              {!me ? (
                <p className={m.note}>
                  Чтобы откликнуться, нужно войти в аккаунт волонтёра.
                </p>
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