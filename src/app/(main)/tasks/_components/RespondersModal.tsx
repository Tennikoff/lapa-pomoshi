"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./RespondersModal.module.css";
import { responsesApi } from "@/src/lib/api/responses";
import { ApiError } from "@/src/lib/api/http";
import type { ResponseDto } from "@/src/types/response";

const HELP_TASKS_CHANGED_EVENT = "lp_help_tasks_changed";

const STATUS_PENDING = "На рассмотрении";
const STATUS_ACCEPTED = "Принят";
const STATUS_DECLINED = "Отклонен";

function normStatus(s: string | null | undefined) {
  return String(s ?? "").trim();
}
function isPending(status: string | null | undefined) {
  const s = normStatus(status);
  if (!s) return true;
  if (s === STATUS_PENDING) return true;
  return s.toLowerCase().includes("рассмотр");
}
function isAccepted(status: string | null | undefined) {
  const s = normStatus(status);
  if (!s) return false;
  if (s === STATUS_ACCEPTED) return true;
  return s.toLowerCase().includes("прин");
}
function isDeclined(status: string | null | undefined) {
  const s = normStatus(status);
  if (!s) return false;
  if (s === STATUS_DECLINED) return true;
  return s.toLowerCase().includes("откл");
}

export function RespondersModal({
  open,
  taskId,
  taskTitle,
  onClose,
}: {
  open: boolean;
  taskId: string | null;
  taskTitle?: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [items, setItems] = useState<ResponseDto[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const title = useMemo(() => {
    if (!taskTitle?.trim()) return "Откликнувшиеся";
    return `Отклики: ${taskTitle.trim()}`;
  }, [taskTitle]);

  useEffect(() => {
    if (!open) return;
    if (!taskId) return;

    (async () => {
      setLoading(true);
      setErrorText(null);
      try {
        const res = await responsesApi.listByTask(taskId, 0, 100);
        setItems(res.responses ?? []);
      } catch (e) {
        let msg = "Не удалось загрузить отклики";
        if (e instanceof ApiError) msg = e.message;
        else if (e instanceof Error) msg = e.message;
        setErrorText(msg);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, taskId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const onOverlayMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const updateStatus = async (responseId: string, status: string) => {
    if (!taskId) return;
    if (busyId) return;

    setBusyId(responseId);
    setErrorText(null);
    try {
      const updated = await responsesApi.updateStatus(responseId, status);
      setItems((prev) => prev.map((x) => (x.id === responseId ? updated : x)));

      window.dispatchEvent(new Event(HELP_TASKS_CHANGED_EVENT));
    } catch (e) {
      let msg = "Не удалось обновить статус отклика";
      if (e instanceof ApiError) msg = e.message;
      else if (e instanceof Error) msg = e.message;
      setErrorText(msg);
    } finally {
      setBusyId(null);
    }
  };

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      onMouseDown={onOverlayMouseDown}
    >
      <div className={styles.modal}>
        <button
          className={styles.closeBtn}
          type="button"
          onClick={onClose}
          aria-label="Закрыть окно"
        >
          ×
        </button>

        <h3 className={styles.title}>{title}</h3>

        {loading ? <p className={styles.meta}>Загрузка…</p> : null}
        {errorText ? <p className={styles.meta}>{errorText}</p> : null}

        {!loading && !errorText && items.length === 0 ? (
          <p className={styles.empty}>Откликов пока нет.</p>
        ) : null}

        {!loading && items.length ? (
          <div className={styles.list}>
            {items.map((r) => {
              const pending = isPending(r.status);
              const accepted = isAccepted(r.status);
              const declined = isDeclined(r.status);
              const disabled = busyId === r.id;

              const senderId = r.sender?.id;
              const senderName = r.sender?.name?.trim() ? r.sender.name : "Без имени";

              return (
                <div key={r.id} className={styles.item}>
                  {senderId ? (
                    <Link
                      href={`/users/${senderId}`}
                      className={styles.nameLink}
                      title={senderName}
                      onClick={() => onClose()}
                    >
                      {senderName}
                    </Link>
                  ) : (
                    <span className={styles.name} title={senderName}>
                      {senderName}
                    </span>
                  )}

                  {pending ? (
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnAccept}`}
                        disabled={disabled}
                        onClick={() => updateStatus(r.id, STATUS_ACCEPTED)}
                      >
                        Принять
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDecline}`}
                        disabled={disabled}
                        onClick={() => updateStatus(r.id, STATUS_DECLINED)}
                      >
                        Отклонить
                      </button>
                    </div>
                  ) : accepted ? (
                    <span className={`${styles.badge} ${styles.badgeAccepted}`}>Принято</span>
                  ) : declined ? (
                    <span className={`${styles.badge} ${styles.badgeDeclined}`}>Отклонено</span>
                  ) : (
                    <span className={styles.meta}>{normStatus(r.status) || "—"}</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}