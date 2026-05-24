"use client";

import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore } from "react";

import s from "../../app/landing.module.css";

import { LandingHeader } from "@/src/components/layout/LandingHeader";
import { LandingFooter } from "@/src/components/layout/LandingFooter";
import { LeaderCard } from "@/src/components/features/LeaderCard";
import { NewsItem } from "@/src/components/features/NewsItem";

import { getAccessToken } from "@/src/lib/tokenStorage";

function subscribeAuth(cb: () => void) {
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

export function LandingPage() {
  const authed = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerSnapshot);

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

                {/* - гость: "Войти" (кликабельная)
                    - авторизован: "Так держать!" (некликабельная)
                    - визуал тот же, ширина фиксированная */}
                {!authed ? (
                  <Link href="/login" className={`${s.btn} ${s.btnFixedWidth}`}>
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
                {/* - гость: 2 кнопки
                    - авторизован: вместо кнопок текст */}
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
              <h2 className={s.leadersTitle}>Лидеры помощи марта</h2>
              <div className={s.leadersList}>
                <LeaderCard
                  image="/images/Кузнецова Анна2.png"
                  name="Кузнецова Анна"
                  tasks={14}
                />
                <LeaderCard image="/images/Саитова Ольга.png" name="Саитова Ольга" tasks={11} />
                <LeaderCard image="/images/Князев Олег.png" name="Князев Олег" tasks={7} />
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
              <NewsItem
                date="15 марта 2026"
                text='В приюте "Добрый дом" открылась новая вольерная площадка. Благодаря помощи волонтеров теперь 10 собак живут в просторных вольерах с утепленными будками.'
              />
              <NewsItem
                date="14 марта 2026"
                text='Вышел новый выпуск "Азбуки волонтера". Полезные советы для самых маленьких подопечных.'
              />
              <NewsItem
                date="10 марта 2026"
                text='Приглашаем на весеннюю ярмарку в поддержку приютов. 20 марта в парке "Сокольники" пройдет благотворительная ярмарка. Ждем волонтеров для помощи в организации.'
              />

              <Link href="/news" className={s.newsMore}>
                Ещё новости
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}