// src/app/(main)/users/[id]/ui/PublicReviewsSection.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import overlay from "@/src/app/(main)/@modal/modalOverlay.module.css";
import profileStyles from "@/src/app/(main)/profile/profile.module.css";
import taskForm from "@/src/app/(main)/tasks/foster/new/fosterNew.module.css";

import btnStyles from "./leaveReviewButton.module.css";
import m from "./leaveReviewModal.module.css";

import { commentsApi } from "@/src/lib/api/comments";
import { ApiError } from "@/src/lib/api/http";
import type { CommentDto } from "@/src/types/comment";
import { getAccessToken } from "@/src/lib/tokenStorage";
import { fetchCurrentProfile } from "@/src/lib/currentProfile";

function starsText(n: number) {
  const x = Math.max(0, Math.min(5, Math.round(n)));
  return "★★★★★".slice(0, x).padEnd(5, "☆");
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StarSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.81c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export function PublicReviewsSection({
  userId,
  showLeaveReviewButton = false,
}: {
  userId: string;
  showLeaveReviewButton?: boolean;
}) {
  const router = useRouter();

  const limit = 50;

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [items, setItems] = useState<CommentDto[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  // modal state
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // hide "leave review" for myself
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setErrorText(null);

    try {
      const res = await commentsApi.listByUser(userId, 0, limit);
      setItems(res.comments ?? []);
      setHasMore(Boolean(res.hasMore));
    } catch (e) {
      let msg = "Не удалось загрузить отзывы";
      if (e instanceof ApiError) msg = e.message;
      else if (e instanceof Error) msg = e.message;

      setErrorText(msg);
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // initial load (and when userId changes)
  useEffect(() => {
    load();
  }, [load]);

  // ✅ back/forward cache
  useEffect(() => {
    if (!userId) return;

    const onPopState = () => load();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [userId, load]);

  // ✅ focus/visibility reload
  useEffect(() => {
    if (!userId) return;

    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [userId, load]);

  // determine myUserId for "hide leave review button on myself"
  useEffect(() => {
    if (!showLeaveReviewButton) return;

    const token = getAccessToken();
    if (!token) {
      setMyUserId(null);
      return;
    }

    (async () => {
      const me = await fetchCurrentProfile();
      setMyUserId(me?.userId ?? null);
    })();
  }, [showLeaveReviewButton]);

  const close = () => {
    setOpen(false);
    setRating(0);
    setHover(0);
    setText("");
    setSubmitting(false);
  };

  // ESC close
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onOverlayMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) close();
  };

  const visibleItems = useMemo(
    () => (reviewsExpanded ? items : items.slice(0, 3)),
    [items, reviewsExpanded]
  );

  const canShowLeaveButton = useMemo(() => {
    if (!showLeaveReviewButton) return false;
    if (myUserId && myUserId === userId) return false;
    return true;
  }, [myUserId, showLeaveReviewButton, userId]);

  const onOpenLeave = async () => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setOpen(true);
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!rating) {
      alert("Поставьте оценку");
      return;
    }

    setSubmitting(true);
    try {
      await commentsApi.create({
        recipientId: userId,
        rating,
        description: text.trim() ? text.trim() : null,
      });

      close();

      // 1) обновим список
      await load();

      // 2) обновим SSR-часть страницы (/users/[id]) чтобы подтянулся рейтинг
      router.refresh();
    } catch (e2) {
      let msg = "Не удалось отправить отзыв";
      if (e2 instanceof ApiError) msg = e2.message;
      else if (e2 instanceof Error) msg = e2.message;
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const leaveReviewButton = canShowLeaveButton ? (
    <div className={btnStyles.wrap}>
      <button className={btnStyles.btn} type="button" onClick={onOpenLeave}>
        Оставить отзыв
      </button>
    </div>
  ) : null;

  const hasReviews = items.length > 0;

  return (
    <section className={profileStyles.section}>
      <h3 className={profileStyles.sectionTitle}>Отзывы</h3>

      {loading ? <p className={profileStyles.muted}>Загрузка…</p> : null}
      {errorText ? <p className={profileStyles.muted}>{errorText}</p> : null}

      {!loading && !errorText && !hasReviews ? (
        <>
          <p className={profileStyles.muted} style={{ margin: 0 }}>
            Отзывов пока нет
          </p>
          {canShowLeaveButton ? (
            <div className={`${btnStyles.wrap} ${btnStyles.wrapBottom}`}>
              <button className={btnStyles.btn} type="button" onClick={onOpenLeave}>
                Оставить отзыв
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {!loading && !errorText && hasReviews ? (
        <>
          {leaveReviewButton}

          <div className={profileStyles.reviewsList}>
            {visibleItems.map((r) => (
              <div key={r.id} className={profileStyles.reviewItem}>
                {/* ✅ дата справа */}
                <div className={profileStyles.reviewHeader}>
                  <div className={profileStyles.reviewHeaderLeft}>
                    <span className={profileStyles.reviewStars}>{starsText(r.rating)}</span>
                    <span className={profileStyles.reviewAuthor}>
                      {r.sender?.name?.trim() ? r.sender.name : "Без имени"}
                    </span>
                  </div>

                  <span className={profileStyles.reviewDate}>
                    {r.createdAt ? formatDate(r.createdAt) : ""}
                  </span>
                </div>

                <div className={profileStyles.reviewText}>{r.description?.trim() || "—"}</div>
              </div>
            ))}
          </div>

          {items.length > 3 ? (
            <button
              type="button"
              className={profileStyles.allReviews}
              onClick={() => setReviewsExpanded((v) => !v)}
            >
              {reviewsExpanded ? "Свернуть отзывы" : "Все отзывы"}
            </button>
          ) : null}

          {hasMore ? (
            <p className={profileStyles.muted} style={{ margin: "10px 0 0" }}>
              Есть ещё отзывы (пока загружаем только первые {limit}).
            </p>
          ) : null}
        </>
      ) : null}

      {/* ===== MODAL ===== */}
      {open ? (
        <div
          className={`${overlay.overlay} ${overlay.center}`}
          role="dialog"
          aria-modal="true"
          onMouseDown={onOverlayMouseDown}
          style={{ ["--modal-dim" as never]: "0.6" }}
        >
          <div className={overlay.content}>
            <div className={overlay.scrollBox}>
              <div className={m.modal} onMouseDown={(e) => e.stopPropagation()}>
                <header className={m.header}>
                  <h2 className={m.title}>Оставить отзыв</h2>
                  <button
                    className={m.closeBtn}
                    type="button"
                    onClick={close}
                    aria-label="Закрыть окно"
                  >
                    ×
                  </button>
                </header>

                <form className={m.form} onSubmit={onSubmit}>
                  <div className={m.group}>
                    <label className={m.label}>Оценка</label>
                    <div className={m.starsRow} onMouseLeave={() => setHover(0)}>
                      {Array.from({ length: 5 }).map((_, i) => {
                        const v = i + 1;
                        const active = (hover || rating) >= v;
                        return (
                          <button
                            key={v}
                            type="button"
                            className={m.starBtn}
                            onMouseEnter={() => setHover(v)}
                            onClick={() => setRating(v)}
                            aria-label={`Оценка ${v}`}
                          >
                            <StarSvg className={`${m.starIcon} ${active ? "" : m.starEmpty}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={m.group}>
                    <label className={m.label} htmlFor="review-text">
                      Текст отзыва
                    </label>
                    <textarea
                      id="review-text"
                      className={m.textarea}
                      placeholder="Отличный волонтёр! Помог с лечением..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                  </div>

                  <div className={m.submitRow}>
                    <button type="submit" className={taskForm.actionBtn} disabled={submitting}>
                      {submitting ? "..." : "ОТПРАВИТЬ"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}