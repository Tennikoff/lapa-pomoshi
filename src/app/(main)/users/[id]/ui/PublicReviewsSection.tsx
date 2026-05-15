"use client";

import { useEffect, useMemo, useState } from "react";

import overlay from "@/src/app/(main)/@modal/modalOverlay.module.css";
import profileStyles from "@/src/app/(main)/profile/profile.module.css";

// кнопка "Отправить" = 1-в-1 как "СОХРАНИТЬ" в создании задачи
import taskForm from "@/src/app/(main)/tasks/foster/new/fosterNew.module.css";

import btnStyles from "./leaveReviewButton.module.css";
import m from "./leaveReviewModal.module.css";

type Review = { author: string; text: string; stars: 1 | 2 | 3 | 4 | 5 };

const REVIEWS_BASE: Review[] = [
  {
    author: "Приют «Добрый дом»",
    stars: 5,
    text: "Отличный волонтёр! Помог с лечением собаки. Очень ответственный и внимательный. Рекомендую!",
  },
  {
    author: "Попов Сергей",
    stars: 5,
    text: "Оперативно откликнулся и помог. Всё сделал аккуратно и вовремя. Спасибо!",
  },
  {
    author: "Суханова Виктория",
    stars: 5,
    text: "Очень приятное общение и реальная помощь. Буду обращаться ещё!",
  },
];

const REVIEWS_MORE: Review[] = [
  {
    author: "Приют «Лапки и хвостики»",
    stars: 5,
    text: "Замечательная помощь по уходу и перевозке. Надёжно и спокойно.",
  },
  {
    author: "Иванова Марина",
    stars: 5,
    text: "Спасибо за поддержку и внимание к деталям. Всё прошло идеально.",
  },
  {
    author: "Фонд «Тёплый дом»",
    stars: 5,
    text: "Ответственный исполнитель, всё по договорённости. Рекомендуем!",
  },
];

function starsText(n: number) {
  return "★★★★★".slice(0, n).padEnd(5, "☆");
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
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export function PublicReviewsSection({
  showLeaveReviewButton = false,
}: {
  showLeaveReviewButton?: boolean;
}) {
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  // modal state
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [text, setText] = useState("");

  const allReviews = useMemo(() => [...REVIEWS_BASE, ...REVIEWS_MORE], []);
  const visibleReviews = useMemo(
    () => (reviewsExpanded ? allReviews : allReviews.slice(0, 3)),
    [allReviews, reviewsExpanded]
  );

  const close = () => {
    setOpen(false);
    // "сворачивается в изначальное состояние" => сбрасываем форму
    setRating(0);
    setHover(0);
    setText("");
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

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    // пока без API — только UI
    if (!rating) {
      alert("Поставьте оценку");
      return;
    }
    alert("Отзыв отправлен (пока без API)");
    close();
  };

  return (
    <section className={profileStyles.section}>
      <h3 className={profileStyles.sectionTitle}>Отзывы</h3>

      {showLeaveReviewButton ? (
        <div className={btnStyles.wrap}>
          <button className={btnStyles.btn} type="button" onClick={() => setOpen(true)}>
            Оставить отзыв
          </button>
        </div>
      ) : null}

      <div className={profileStyles.reviewsList}>
        {visibleReviews.map((r, idx) => (
          <div key={`${r.author}_${idx}`} className={profileStyles.reviewItem}>
            <div className={profileStyles.reviewHeader}>
              <span className={profileStyles.reviewStars}>{starsText(r.stars)}</span>
              <span className={profileStyles.reviewAuthor}>{r.author}</span>
            </div>
            <div className={profileStyles.reviewText}>{r.text}</div>
          </div>
        ))}
      </div>

      {allReviews.length > 3 ? (
        <button
          type="button"
          className={profileStyles.allReviews}
          onClick={() => setReviewsExpanded((v) => !v)}
        >
          {reviewsExpanded ? "Свернуть отзывы" : "Все отзывы"}
        </button>
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
                  <button className={m.closeBtn} type="button" onClick={close} aria-label="Закрыть окно">
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
                      placeholder="Отличный волонтёр! Помог с лечением собаки. Очень ответственный и внимательный. Рекомендую!"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                  </div>

                  <div className={m.submitRow}>
                    {/* 1-в-1 стиль как "СОХРАНИТЬ" в создании задачи */}
                    <button type="submit" className={taskForm.actionBtn}>
                      ОТПРАВИТЬ
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