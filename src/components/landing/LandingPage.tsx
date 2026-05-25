// src/components/landing/LandingPage.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import s from "../../app/landing.module.css";
import { LandingHeader } from "@/src/components/layout/LandingHeader";
import { LandingFooter } from "@/src/components/layout/LandingFooter";
import { LeaderCard } from "@/src/components/features/LeaderCard";
import { NewsItem } from "@/src/components/features/NewsItem";
import { getAccessToken } from "@/src/lib/tokenStorage";

function subscribeAuth(cb: () => void) {
  // storage — обновление, если токен изменился в другом табе
  // focus — чтобы подхватывать актуальный токен при возврате на вкладку
  window.addEventListener("storage", cb);
  window.addEventListener("focus", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("focus", cb);
  };
}

function getAuthSnapshot() {
  return Boolean(getAccessToken());
}

function getServerSnapshot() {
  return false;
}

// 3 новости показываем сразу, по кнопке добавляем ещё 3
const NEWS_STEP = 3;

// ВАЖНО: первые 3 — самые свежие (как было), следующие 3 — “ещё новости”
const NEWS_ITEMS: Array<{ date: string; text: string }> = [
  {
    date: "15 мая 2026",
    text: 'В приюте "Добрый дом" открылась новая вольерная площадка. Благо даря помощ и волонтеров теперь 1 0 собак живут в просторны х вольерах с утепленными будками.',
  },
  {
    date: "14 мая 2026",
    text: 'Вышел новый выпуск "Азбуки волонтера". Полезные совет ы для самых маленьких подопечных.',
  },
  {
    date: "10 мая 2026",
    text: 'Приглашаем на весен нюю ярмарку в под держку приютов. 20 марта в парке "Сокольн ики" прой дет благотворительная ярмарка. Ждем воло нтеров для помощ и в орга низации.',
  },
  {
    date: "08 мая 2026",
    text: "Обновили медиатеку: добавили новые материалы по первой помощи и уходу за животными.",
  },
  {
    date: "05 мая 2026",
    text: "Собрали и доставили срочный груз кормов для нескольких передержек. Спасибо всем, кто помог!",
  },
  {
    date: "01 мая 2026",
    text: "Запустили улучшения в задачах: быстрее обновляется лента после отклика и изменений куратора.",
  },
];

export function LandingPage() {
  const authed = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getServerSnapshot
  );

  const [visibleNews, setVisibleNews] = useState<number>(NEWS_STEP);

  const canShowMoreNews = visibleNews < NEWS_ITEMS.length;

  return (
    <div className={s.page}>
      <LandingHeader />
      <main>
        {/* HERO */}
        <section className={s.hero}>
          <div className={`${s.container} ${s.heroInner}`}>
            <div className={s.heroCollage}>
              <div className={s.heroCollageCol}>
                <div className={s.heroImg}>
                  <Image
                    src="/images/Вол1.png"
                    alt="Фото животного 1"
                    fill
                    className={s.heroImgTag}
                  />
                </div>
                <div className={s.heroImg}>
                  <Image
                    src="/images/Вол3.png"
                    alt="Фото животного 3"
                    fill
                    className={s.heroImgTag}
                  />
                </div>
              </div>
              <div className={s.heroCollageCol}>
                <div className={s.heroImg}>
                  <Image
                    src="/images/Вол2.png"
                    alt="Фото животного 2"
                    fill
                    className={s.heroImgTag}
                  />
                </div>
                <div className={s.heroImg}>
                  <Image
                    src="/images/Вол4.png"
                    alt="Фото животного 4"
                    fill
                    className={s.heroImgTag}
                  />
                </div>
              </div>
            </div>

            <div className={s.heroContent}>
              <h1 className={s.heroTitle}>ЛАПА ПОМОЩИ</h1>
              <p className={s.heroSubtitle}>
                Помощь, которая находит адресата.
                <br />
                Никакого хаоса. Только структура,
                <br />
                прозрачность и забота.
              </p>

              <div className={s.heroAction}>
                <div className={s.heroCat}>
                  <img src="/images/кися.svg" alt="Иллюстрация кошки" />
                </div>

                {/* гость: "Войти" (кликабельная)
                    авторизован: "Так держать!" (некликабельная) */}
                {!authed ? (
                  <Link
                    href="/login"
                    className={`${s.btn} ${s.btnFixedWidth}`}
                  >
                    Войти
                  </Link>
                ) : (
                  <span
                    className={`${s.btn} ${s.btnFixedWidth}`}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    Так держать!
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Блок с фото */}
        <section className={s.gallery}>
          <div className={s.container}>
            <div className={s.galleryInner}>
              <div className={s.galleryHeader}>
                {!authed ? (
                  <>
                    <Link href="/register" className={s.galleryHeaderBtn}>
                      Оказать помощь
                    </Link>
                    <Link href="/register" className={s.galleryHeaderBtn}>
                      Нужна помощь
                    </Link>
                  </>
                ) : (
                  <div
                    className={s.galleryHeaderBtn}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      cursor: "default",
                      userSelect: "none",
                    }}
                  >
                    Маленькие души, ради которых мы стараемся
                  </div>
                )}
              </div>

              <div className={s.galleryGrid}>
                <div className={`${s.galleryImageWrap} ${s.rabbit}`}>
                  <Image
                    src="/images/потрепыш (Пользовательское).png"
                    alt="Кролик ищет дом"
                    fill
                    className={s.galleryImageContain}
                  />
                </div>

                <div className={s.galleryRightCol}>
                  <div className={s.galleryRow}>
                    <div className={`${s.galleryImageWrap} ${s.puppy}`}>
                      <Image
                        src="/images/беспризорный дог.png"
                        alt="Щенок ищет дом"
                        fill
                        className={s.galleryImage}
                      />
                    </div>
                    <div className={`${s.galleryImageWrap} ${s.parrot}`}>
                      <Image
                        src="/images/Хомя.png"
                        alt="Попугай ищет дом"
                        fill
                        className={s.galleryImage}
                      />
                    </div>
                  </div>

                  <div className={s.galleryRow}>
                    <div className={`${s.galleryImageWrap} ${s.dog}`}>
                      <Image
                        src="/images/Дог1.png"
                        alt="Собака ищет дом"
                        fill
                        className={s.galleryImage}
                      />
                    </div>
                    <div className={`${s.galleryImageWrap} ${s.cat}`}>
                      <Image
                        src="/images/кот в мазуте.png"
                        alt="Кошка ищет дом"
                        fill
                        className={s.galleryImage}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ЛИДЕРЫ */}
        <section className={s.leaders}>
          <div className={s.container}>
            <div className={s.leadersWrapper}>
              <h2 className={s.leadersTitle}>Лидеры помощи мая</h2>
              <div className={s.leadersList}>
                <LeaderCard
                  image="/images/Кузнецова Анна2.png"
                  name="Кузнецова Анна"
                  tasks={14}
                />
                <LeaderCard
                  image="/images/Саитова Ольга.png"
                  name="Саитова Ольга"
                  tasks={11}
                />
                <LeaderCard
                  image="/images/Князев Олег.png"
                  name="Князев Олег"
                  tasks={7}
                />
                <LeaderCard
                  image="/images/Кузнецова Анна1.png"
                  name="Кузнецова Анна"
                  tasks={6}
                />
              </div>
            </div>
          </div>
        </section>

        {/* НОВОСТИ */}
        <section className={s.news}>
          <div className={s.container}>
            <h2 className={s.newsTitle}>Новости</h2>
            <div className={s.newsContent}>
              {NEWS_ITEMS.slice(0, visibleNews).map((n, idx) => (
                <NewsItem key={`${n.date}_${idx}`} date={n.date} text={n.text} />
              ))}

              {canShowMoreNews ? (
                <button
                  type="button"
                  className={s.newsMore}
                  onClick={() =>
                    setVisibleNews((v) =>
                      Math.min(NEWS_ITEMS.length, v + NEWS_STEP)
                    )
                  }
                >
                  Ещё новости
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}