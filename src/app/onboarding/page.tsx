"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./onboarding.module.css";

import { LandingPage } from "@/src/components/landing/LandingPage";
import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { getAccessToken } from "@/src/lib/tokenStorage";
import { isOnboardingDone, setOnboardingDone } from "@/src/lib/storage/onboarding";

type StepItem = {
  title: string;
  description: string;
  targetId: string;
};

type Rect = { top: number; left: number; width: number; height: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function OnboardingPage() {
  const router = useRouter();

  const steps: StepItem[] = useMemo(
    () => [
      {
        title: "Добро пожаловать в ЛАПА ПОМОЩИ!",
        description:
          "Здесь находятся все актуальные задачи для помощи животным. Используйте фильтры, чтобы найти нужное.",
        targetId: "nav-tasks",
      },
      {
        title: "Планируйте своё время",
        description:
          "В календаре отображаются все ваши задачи с удобной визуализацией по датам. Выбирайте подходящий вид: день, неделя или месяц.",
        targetId: "nav-calendar",
      },
      {
        title: "Полезная информация всегда под\nрукой",
        description:
          "Статьи по уходу за животными, инструкции и рекомендации\nпомогут в работе. Фильтруйте материалы по виду\nживотного и интересующей теме.",
        targetId: "nav-knowledge",
      },
      {
        title: "Общайтесь с командой",
        description:
          "Для каждой задачи создается отдельный чат с куратором и\nисполнителями. Здесь можно обсудить детали и\nкоординировать совместную работу. ",
        targetId: "nav-chat",
      },
      {
        title: "Заполните свой профиль",
        description:
          "Нажав на иконку профиля, вы сможете его просмотреть и\nотредактировать. Заполненный профиль помогает\nэффективнее взаимодействовать с другими участниками\nплатформы.",
        targetId: "nav-profile",
      },
    ],
    []
  );

  const total = steps.length;

  const [stepIdx, setStepIdx] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const [highlightRect, setHighlightRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    (async () => {
      const profile = await fetchCurrentProfile();
      if (!profile) {
        router.replace("/login");
        return;
      }

      if (isOnboardingDone(profile.userId)) {
        router.replace("/profile");
        return;
      }

      setUserId(profile.userId);
      setLoading(false);
    })();
  }, [router]);

  useLayoutEffect(() => {
    if (loading) return;

    const targetId = steps[stepIdx]?.targetId;

    const update = () => {
      const el = document.getElementById(targetId);
      const tooltipEl = tooltipRef.current;

      if (!el || !tooltipEl) {
        setHighlightRect(null);
        setTooltipPos(null);
        return;
      }

      const r = el.getBoundingClientRect();

      const pad = 8;
      setHighlightRect({
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      });

      const tooltipWidth = tooltipEl.offsetWidth || 540;
      const leftRaw = r.left + r.width / 2 - tooltipWidth / 2;
      const left = clamp(leftRaw, 12, window.innerWidth - tooltipWidth - 12);

      const top = r.bottom + 16;
      setTooltipPos({ top, left });
    };

    const t = window.setTimeout(update, 0);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [loading, stepIdx, steps]);

  const finish = () => {
    if (userId) setOnboardingDone(userId, true);
    router.replace("/profile");
  };

  const onSkip = () => finish();

  const onNext = () => {
    if (stepIdx >= total - 1) return;
    setStepIdx((x) => x + 1);
  };

  const onBack = () => setStepIdx((x) => Math.max(0, x - 1));

  if (loading) {
    return (
      <div className={styles.modalRoot}>
        <div className={styles.modalBg}>
          <LandingPage />
        </div>
        <div className={styles.modalOverlay} />
      </div>
    );
  }

  const stepNumber = stepIdx + 1;
  const item = steps[stepIdx];
  const isLastStep = stepIdx === total - 1;

  const highlightStyle = highlightRect
    ? {
        top: highlightRect.top,
        left: highlightRect.left,
        width: highlightRect.width,
        height: highlightRect.height,
      }
    : undefined;

  const tooltipStyle = tooltipPos ? { top: tooltipPos.top, left: tooltipPos.left } : undefined;

  // Шаг 1: делаем заголовок без переносов
  const titleClass =
    stepIdx === 0
      ? `${styles.tooltipTitle} ${styles.tooltipTitleNoWrap}`
      : styles.tooltipTitle;

  return (
    <div className={styles.modalRoot}>
      <div className={styles.modalBg}>
        <LandingPage />
      </div>

      <div className={styles.modalOverlay} />

      {highlightRect ? <div className={styles.highlight} style={highlightStyle} /> : null}

      <div
        ref={tooltipRef}
        className={`${styles.tooltipWrapper} ${!tooltipPos ? styles.tooltipWrapperCentered : ""}`}
        style={tooltipStyle}
      >
        <div className={styles.tooltipBox}>
          <h2 className={titleClass}>{item.title}</h2>
          <p className={styles.tooltipDescription}>{item.description}</p>

          <div className={styles.tooltipFooter}>
            <span className={styles.tooltipStep}>
              Шаг {stepNumber} из {total}
            </span>

            <div className={styles.tooltipActions}>
              {!isLastStep ? (
                <button
                  type="button"
                  className={`${styles.tooltipButton} ${styles.tooltipButtonSkip}`}
                  onClick={onSkip}
                >
                  Пропустить
                </button>
              ) : null}

              {stepNumber >= 2 ? (
                <button
                  type="button"
                  className={`${styles.tooltipButton} ${styles.tooltipButtonBack}`}
                  onClick={onBack}
                >
                  Назад
                </button>
              ) : null}

              {isLastStep ? (
                <button
                  type="button"
                  className={`${styles.tooltipButton} ${styles.tooltipButtonNext}`}
                  onClick={finish}
                >
                  Перейти к профилю
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.tooltipButton} ${styles.tooltipButtonNext}`}
                  onClick={onNext}
                >
                  Далее
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}