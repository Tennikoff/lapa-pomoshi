"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import s from "./profile.module.css";

import { clearAccessToken, getAccessToken } from "../../../lib/tokenStorage";

type ProfileDto = {
  userId: string;
  email: string;
  name: string;
  role: number;
  age: number | null;
  description: string | null;
  sumRating: number;
  countRating: number;
  photoUrl: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  // пока заглушки
  const competencies = ["Ремонт", "Транспортировка", "Социализация", "Фото/видео"];
  const availability = ["Пн", "Ср", "Сб", "Вс", "Днём"];
  const prefAnimals = ["Собаки", "Рыбы", "Птицы", "Рептилии"];
  const prefInteraction = ["Приюты", "Частные передержки"];
  const city = "Екатеринбург";
  const districts = [
    "Кировский",
    "Верх-Исетский",
    "Железнодорожный",
    "Октябрьский",
    "Академический",
    "Орджоникидзевский",
    "Ленинский",
    "Чкаловский",
  ];

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          clearAccessToken();
          setProfile(null);
          setLoading(false);
          return;
        }

        const data = (await res.json()) as ProfileDto;
        setProfile(data);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onLogout = () => {
    clearAccessToken();
    router.push("/");
  };

  const rating = useMemo(() => {
    if (!profile || !profile.countRating) return { avg: "5.0", count: 4 };
    const avg = profile.sumRating && profile.countRating
      ? (profile.sumRating / profile.countRating).toFixed(1)
      : "0.0";
    return { avg, count: profile.countRating };
  }, [profile]);

  // Если не авторизован
  if (!loading && !getAccessToken()) {
    return (
      <div className={s.page}>
        <div className={s.container}>
          <h2 style={{ marginBottom: 10 }}>Вы не вошли в аккаунт</h2>
          <p style={{ color: "#6C757D" }}>Войдите, чтобы увидеть профиль.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        <div className={s.profileHeader}>
          <div className={s.avatar} />

          <div className={s.profileInfo}>
            <h1>{profile?.name ?? "Фамилия Имя"}</h1>
            <p>Волонтёр</p>
          </div>

          <button className={s.btnLogout} onClick={onLogout}>
            Выйти
          </button>
        </div>

        <section className={s.section}>
          <h3 className={s.sectionTitle}>О себе</h3>
          <p style={{ color: "#6C757D", fontSize: 14 }}>
            {profile?.description ??
              "Расскажите о себе: Опыт, Навыки, Почему Хотите Помогать Животным..."}
          </p>
        </section>

        <section className={s.section}>
          <h3 className={s.sectionTitle}>Компетенции</h3>
          <div className={s.tagsWrapper}>
            {competencies.map((x) => (
              <span key={x} className={s.tag}>
                {x}
              </span>
            ))}
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.sectionTitle}>Доступность</h3>
          <div className={s.tagsWrapper}>
            {availability.map((x) => (
              <span key={x} className={s.tag}>
                {x}
              </span>
            ))}
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.sectionTitle}>Предпочтения (Животные)</h3>
          <div className={s.tagsWrapper}>
            {prefAnimals.map((x) => (
              <span key={x} className={s.tag}>
                {x}
              </span>
            ))}
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.sectionTitle}>Предпочтения (Взаимодействие)</h3>
          <div className={s.tagsWrapper}>
            {prefInteraction.map((x) => (
              <span key={x} className={s.tag}>
                {x}
              </span>
            ))}
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.sectionTitle}>Локация</h3>
          <p className={s.sectionSubtitle}>Город: {city}</p>
          <div className={s.tagsWrapper}>
            {districts.map((x) => (
              <span key={x} className={s.tag}>
                {x}
              </span>
            ))}
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.sectionTitle}>Мои питомцы</h3>
          <div className={s.petsGrid}>
            <div className={s.petCard}>
              <span>Ричи</span>
            </div>

            <div className={s.addPet}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Добавить
            </div>
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.sectionTitle}>Активность</h3>
          <p style={{ color: "#6C757D", fontSize: 14 }}>Выполненные задачи: x</p>
        </section>

        {/* Рейтинг: звёзды + текст справа, всё по центру */}
        <section className={s.section}>
          <h3 className={s.sectionTitle}>Рейтинг</h3>

          <div className={s.ratingRow}>
            <div className={s.starsBig}>★★★★★</div>
            <div className={s.ratingMeta}>
              {rating.avg} ({rating.count} отзыва)
            </div>
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.sectionTitle}>Отзывы</h3>
          <div className={s.reviewsList}>
            <div className={s.reviewItem}>
              <div className={s.reviewHeader}>
                <span className={s.reviewStars}>★★★★★</span>
                <span className={s.reviewAuthor}>Приют «Добрый дом»</span>
              </div>
              <div className={s.reviewText}>
                Отличный волонтёр! Помог с лечением собаки. Очень ответственный и внимательный. Рекомендую!
              </div>
            </div>

            <div className={s.reviewItem}>
              <div className={s.reviewHeader}>
                <span className={s.reviewStars}>★★★★★</span>
                <span className={s.reviewAuthor}>Попов Сергей</span>
              </div>
              <div className={s.reviewText}>
                Отличный волонтёр! Помог с лечением собаки. Очень ответственный и внимательный. Рекомендую!
              </div>
            </div>

            <div className={s.reviewItem}>
              <div className={s.reviewHeader}>
                <span className={s.reviewStars}>★★★★★</span>
                <span className={s.reviewAuthor}>Суханова Виктория</span>
              </div>
              <div className={s.reviewText}>
                Отличный волонтёр! Помог с лечением собаки. Очень ответственный и внимательный. Рекомендую!
              </div>
            </div>
          </div>

          <a href="#" className={s.allReviews}>
            Все отзывы
          </a>
        </section>

        <button className={s.btnLarge}>РЕДАКТИРОВАТЬ ПРОФИЛЬ</button>
      </div>
    </div>
  );
}