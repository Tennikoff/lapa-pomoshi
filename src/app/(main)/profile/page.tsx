"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "./profile.module.css";

import { clearAccessToken, getAccessToken } from "@/src/lib/tokenStorage";
import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import type { ProfileDto } from "@/src/types/profile";

import {
  getVolunteerExtra,
  type VolunteerExtra,
  VOLUNTEER_EXTRA_CHANGED_EVENT,
} from "@/src/lib/storage/volunteerExtra";

import {
  getOrgExtra,
  type OrgExtra,
  ORG_EXTRA_CHANGED_EVENT,
} from "@/src/lib/storage/orgExtra";

import { CITY_DEFAULT } from "@/src/lib/constants/volunteerOptions";

import {
  ANIMALS_CHANGED_EVENT,
  deleteAnimal,
  listAnimals,
} from "@/src/lib/storage/animals";
import type { Animal } from "@/src/types/animal";

import { ConfirmDeleteDialog } from "@/src/components/modals/ConfirmDeleteDialog";

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

const DEFAULT_PET_BG =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300";

function renderTags(items: string[]) {
  if (!items.length) {
    return <p style={{ color: "#6C757D", fontSize: 14, margin: 0 }}>Не указано</p>;
  }
  return (
    <div className={s.tagsWrapper}>
      {items.map((x) => (
        <span key={x} className={s.tag}>
          {x}
        </span>
      ))}
    </div>
  );
}

function starsText(n: number) {
  return "★★★★★".slice(0, n).padEnd(5, "☆");
}

export default function ProfilePage() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [volExtra, setVolExtra] = useState<VolunteerExtra | null>(null);
  const [orgExtra, setOrgExtraState] = useState<OrgExtra | null>(null);

  const [pets, setPets] = useState<Animal[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePetId, setDeletePetId] = useState<string | null>(null);

  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  const allReviews = useMemo(() => [...REVIEWS_BASE, ...REVIEWS_MORE], []);
  const visibleReviews = useMemo(
    () => (reviewsExpanded ? allReviews : allReviews.slice(0, 3)),
    [allReviews, reviewsExpanded]
  );

  useEffect(() => {
    const t = getAccessToken();
    setToken(t);

    if (!t) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const p = await fetchCurrentProfile();
        setProfile(p);

        if (p) {
          setVolExtra(getVolunteerExtra(p.userId));
          setOrgExtraState(getOrgExtra(p.userId));
          setPets(listAnimals(p.userId));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // обновление при сохранении в edit + при изменении животных
  useEffect(() => {
    if (!profile) return;

    const onVolExtraChanged = () => setVolExtra(getVolunteerExtra(profile.userId));
    const onOrgExtraChanged = () => setOrgExtraState(getOrgExtra(profile.userId));
    const onAnimalsChanged = () => setPets(listAnimals(profile.userId));

    window.addEventListener(VOLUNTEER_EXTRA_CHANGED_EVENT, onVolExtraChanged);
    window.addEventListener(ORG_EXTRA_CHANGED_EVENT, onOrgExtraChanged);
    window.addEventListener(ANIMALS_CHANGED_EVENT, onAnimalsChanged);

    return () => {
      window.removeEventListener(VOLUNTEER_EXTRA_CHANGED_EVENT, onVolExtraChanged);
      window.removeEventListener(ORG_EXTRA_CHANGED_EVENT, onOrgExtraChanged);
      window.removeEventListener(ANIMALS_CHANGED_EVENT, onAnimalsChanged);
    };
  }, [profile]);

  const onLogout = () => {
    clearAccessToken();
    setToken(null);
    setProfile(null);
    router.push("/");
  };

  const rating = useMemo(() => {
    if (!profile || !profile.countRating) return { avg: "5.0", count: 4 };
    const avg =
      profile.sumRating && profile.countRating
        ? (profile.sumRating / profile.countRating).toFixed(1)
        : "0.0";
    return { avg, count: profile.countRating };
  }, [profile]);

  if (!loading && !token) {
    return (
      <div className={s.page}>
        <div className={s.container}>
          <h2 style={{ marginBottom: 10 }}>Вы не вошли в аккаунт</h2>
          <p style={{ color: "#6C757D" }}>Войдите, чтобы увидеть профиль.</p>
          <div style={{ marginTop: 12 }}>
            <Link href="/login" className={s.btnLarge} style={{ maxWidth: 260 }}>
              ВОЙТИ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // пока грузим профиль
  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.container}>
          <p style={{ color: "#6C757D" }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  const isOrg = profile?.role === 2;

  const displayName =
    profile?.name ?? (isOrg ? "Организация" : "Фамилия Имя");

  const aboutText = isOrg
    ? orgExtra?.about?.trim() || profile?.description || "Расскажите об организации..."
    : volExtra?.about?.trim() || profile?.description || "Расскажите о себе...";

  const city = isOrg ? orgExtra?.city || CITY_DEFAULT : volExtra?.city || CITY_DEFAULT;
  const districts = isOrg ? orgExtra?.districts || [] : volExtra?.districts || [];

  const onAskDeletePet = (petId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletePetId(petId);
    setDeleteOpen(true);
  };

  const onCancelDelete = () => {
    setDeleteOpen(false);
    setDeletePetId(null);
  };

  const onConfirmDelete = () => {
    if (deletePetId) deleteAnimal(deletePetId);
    setDeleteOpen(false);
    setDeletePetId(null);
  };

  return (
    <>
      <div className={s.page}>
        <div className={s.container}>
          <div className={s.profileHeader}>
            <div className={s.avatar} />
            <div className={s.profileInfo}>
              <h1>{displayName}</h1>
              <p>{isOrg ? "Куратор/Организация" : "Волонтёр"}</p>
            </div>

            <button className={s.btnLogout} onClick={onLogout}>
              Выйти
            </button>
          </div>

          <section className={s.section}>
            <h3 className={s.sectionTitle}>О себе</h3>
            <p style={{ color: "#6C757D", fontSize: 14, margin: 0 }}>{aboutText}</p>
          </section>

          {/* ===== Волонтёрские блоки ===== */}
          {!isOrg ? (
            <>
              <section className={s.section}>
                <h3 className={s.sectionTitle}>Компетенции</h3>
                {renderTags(volExtra?.competencies || [])}
              </section>

              <section className={s.section}>
                <h3 className={s.sectionTitle}>Доступность</h3>
                {renderTags(volExtra?.availability || [])}
              </section>

              <section className={s.section}>
                <h3 className={s.sectionTitle}>Предпочтения (Животные)</h3>
                {renderTags(volExtra?.prefAnimals || [])}
              </section>

              <section className={s.section}>
                <h3 className={s.sectionTitle}>Предпочтения (Взаимодействие)</h3>
                {renderTags(volExtra?.prefInteraction || [])}
              </section>
            </>
          ) : null}

          {/* ===== Организационные блоки ===== */}
          {isOrg ? (
            <>
              <section className={s.section}>
                <h3 className={s.sectionTitle}>Контактные данные</h3>

                <div className={s.contactDetails}>
                  <p className={s.contactRow}>
                    <span className={s.contactLabel}>Телефон:</span>{" "}
                    {orgExtra?.phone?.trim() ? orgExtra.phone.trim() : <span className={s.muted}>Не указано</span>}
                  </p>
                  <p className={s.contactRow}>
                    <span className={s.contactLabel}>Сайт:</span>{" "}
                    {orgExtra?.website?.trim() ? orgExtra.website.trim() : <span className={s.muted}>Не указано</span>}
                  </p>
                </div>
              </section>

              <section className={s.section}>
                <h3 className={s.sectionTitle}>Постоянные потребности</h3>
                {renderTags(orgExtra?.needs || [])}
              </section>

              <section className={s.section}>
                <h3 className={s.sectionTitle}>Реквизиты для пожертвований</h3>
                <p style={{ color: "#6C757D", fontSize: 14, margin: 0 }}>
                  {orgExtra?.donationRequisites?.trim()
                    ? orgExtra.donationRequisites.trim()
                    : "Не указано"}
                </p>
              </section>
            </>
          ) : null}

          {/* ===== Локация (общая) ===== */}
          <section className={s.section}>
            <h3 className={s.sectionTitle}>Локация</h3>
            <p className={s.sectionSubtitle}>Город: {city}</p>
            {renderTags(districts)}
          </section>

          {/* ===== Мои питомцы (общие) ===== */}
          <section className={s.section}>
            <h3 className={s.sectionTitle}>Мои питомцы</h3>

            <div className={s.petsGrid}>
              {pets.map((pet) => (
                <Link
                  key={pet.id}
                  href={`/animals/${pet.id}`}
                  className={s.petCard}
                  style={{
                    backgroundImage: `url(${pet.photoUrl || DEFAULT_PET_BG})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <button
                    type="button"
                    className={s.petTrashBtn}
                    onClick={onAskDeletePet(pet.id)}
                    aria-label={`Удалить карточку ${pet.name || pet.species}`}
                  >
                    <svg
                      className={s.petTrashIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M6 6l1 16h10l1-16" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>

                  <span>{pet.name?.trim() ? pet.name : pet.species}</span>
                </Link>
              ))}

              <Link href="/animals/new" className={s.addPet}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Добавить
              </Link>
            </div>
          </section>

          <section className={s.section}>
            <h3 className={s.sectionTitle}>Активность</h3>
            <p style={{ color: "#6C757D", fontSize: 14, margin: 0 }}>
              {isOrg ? "Созданные задачи: x" : "Выполненные задачи: x"}
            </p>
          </section>

          <section className={s.section}>
            <h3 className={s.sectionTitle}>Рейтинг</h3>
            <div className={s.ratingRow}>
              <div className={s.starsBig}>★★★★★</div>
              <div className={s.ratingMeta}>
                {rating.avg} ({rating.count} отзыва)
              </div>
            </div>
          </section>

          {/* ===== ОТЗЫВЫ: всегда 3, раскрытие ещё 3 ===== */}
          <section className={s.section}>
            <h3 className={s.sectionTitle}>Отзывы</h3>

            <div className={s.reviewsList}>
              {visibleReviews.map((r, idx) => (
                <div key={`${r.author}_${idx}`} className={s.reviewItem}>
                  <div className={s.reviewHeader}>
                    <span className={s.reviewStars}>{starsText(r.stars)}</span>
                    <span className={s.reviewAuthor}>{r.author}</span>
                  </div>
                  <div className={s.reviewText}>{r.text}</div>
                </div>
              ))}
            </div>

            {allReviews.length > 3 ? (
              <button
                type="button"
                className={s.allReviews}
                onClick={() => setReviewsExpanded((v) => !v)}
              >
                {reviewsExpanded ? "Свернуть отзывы" : "Все отзывы"}
              </button>
            ) : null}
          </section>

          <Link href="/profile/edit" className={s.btnLarge}>
            РЕДАКТИРОВАТЬ ПРОФИЛЬ
          </Link>
        </div>
      </div>

      <ConfirmDeleteDialog open={deleteOpen} onCancel={onCancelDelete} onConfirm={onConfirmDelete} />
    </>
  );
}