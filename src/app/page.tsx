import Link from "next/link";
import Image from "next/image";
import s from "./landing.module.css";

import { LandingHeader } from "@/src/components/layout/LandingHeader";
import { LandingFooter } from "@/src/components/layout/LandingFooter";
import { LeaderCard } from "@/src/components/features/LeaderCard";
import { NewsItem } from "@/src/components/features/NewsItem";

export default function HomePage() {
  return (
    <div className={s.page}>
      <LandingHeader />

      <main>
        {/* HERO */}
        <section className={s.hero}>
          <div className={`${s.container} ${s.heroInner}`}>
            <div className={s.heroCollage}>
              <div className={s.heroCollageCol}>
                <div className={`${s.heroImg} ${s.heroImg1}`} />
                <div className={`${s.heroImg} ${s.heroImg3}`} />
              </div>
              <div className={s.heroCollageCol}>
                <div className={`${s.heroImg} ${s.heroImg2}`} />
                <div className={`${s.heroImg} ${s.heroImg4}`} />
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
                <div className={s.heroCat}>🐱</div>
                <Link href="/animals" className={s.btn}>
                  Сообщить о животном
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ИЩУТ ДОМ */}
        <section className={s.gallery}>
          <div className={s.container}>
            <div className={s.galleryInner}>
              <div className={s.galleryHeader}>
                <div className={s.galleryTitle}>
                  <h2>Ищут дом</h2>
                  <p>Помоги найти семью тем, кто ждёт</p>
                </div>

                <div className={s.galleryArrows}>
                  <button className={s.arrowBtn}>←</button>
                  <button className={s.arrowBtn}>→</button>
                </div>
              </div>

              <div className={s.galleryGrid}>
                <div className={`${s.galleryImageWrap} ${s.rabbit}`}>
                  <Image
                    src="/images/Кроля1.png"
                    alt="Кролик ищет дом"
                    fill
                    className={s.galleryImageContain}
                  />
                </div>

                <div className={s.galleryRightCol}>
                  <div className={s.galleryRow}>
                    <div className={`${s.galleryImageWrap} ${s.puppy}`}>
                      <Image
                        src="/images/Щенок.jpg"
                        alt="Щенок ищет дом"
                        fill
                        className={s.galleryImage}
                      />
                    </div>

                    <div className={`${s.galleryImageWrap} ${s.parrot}`}>
                      <Image
                        src="/images/Попугай.jpg"
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
                        src="/images/Котёнок.png"
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