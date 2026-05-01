"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "./profile.module.css";

import { clearAccessToken, getAccessToken } from "@/src/lib/tokenStorage";
import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import type { ProfileDto } from "@/src/types/profile";
import { isOrgRole } from "@/src/lib/role";

import {
  getVolunteerExtra,
  type VolunteerExtra,
  VOLUNTEER_EXTRA_CHANGED_EVENT,
} from "@/src/lib/storage/volunteerExtra";

import { ConfirmDeleteDialog } from "@/src/components/modals/ConfirmDeleteDialog";

import {
  getFullNameByUserId,
  USER_META_CHANGED_EVENT,
} from "@/src/lib/storage/userMeta";

import {
  getUserAvatar,
  USER_AVATAR_CHANGED_EVENT,
} from "@/src/lib/storage/userAvatar";

import { animalsApi, type AnimalListItemDto } from "@/src/lib/api/animals";

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
    text: "Оперативно откликнулся и помог. Всё сделал аккуратно и во время. Спасибо!",
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
    return (
      <p style={{ color: "#6C757D", fontSize: 14, margin: 0 }}>Не указано</p>
    );
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

  const [localFullName, setLocalFullName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // volunteer extra (пока localStorage)
  const [volExtra, setVolExtra] = useState<VolunteerExtra | null>(null);

  // pets from API
  const [pets, setPets] = useState<AnimalListItemDto[]>([]);

  // delete pet dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePetId, setDeletePetId] = useState<string | null>(null);

  // reviews UI
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const allReviews = useMemo(() => [...REVIEWS_BASE, ...REVIEWS_MORE], []);
  const visibleReviews = useMemo(
    () => (reviewsExpanded ? allReviews : allReviews.slice(0, 3)),
    [allReviews, reviewsExpanded]
  );

  const loadPets = async () => {
    try {
      const res = await animalsApi.my(0, 50);
      setPets(res.animals);
    } catch {
      // не критично: если упадёт — просто покажем пусто
      setPets([]);
    }
  };

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
          setLocalFullName(getFullNameByUserId(p.userId));
          setAvatarUrl(getUserAvatar(p.userId));

          if (!isOrgRole(p.role)) {
            setVolExtra(getVolunteerExtra(p.userId));
          } else {
            setVolExtra(null);
          }

          await loadPets();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Подписки на localStorage-ивенты (пока не мигрировали имя/аватар/volunteerExtra на API)
  useEffect(() => {
    if (!profile) return;

    const onVolExtraChanged = () => {
      if (!isOrgRole(profile.role)) setVolExtra(getVolunteerExtra(profile.userId));
    };
    const onUserMetaChanged = () =>
      setLocalFullName(getFullNameByUserId(profile.userId));
    const onAvatarChanged = () => setAvatarUrl(getUserAvatar(profile.userId));

    window.addEventListener(VOLUNTEER_EXTRA_CHANGED_EVENT, onVolExtraChanged);
    window.addEventListener(USER_META_CHANGED_EVENT, onUserMetaChanged);
    window.addEventListener(USER_AVATAR_CHANGED_EVENT, onAvatarChanged);

    return () => {
      window.removeEventListener(VOLUNTEER_EXTRA_CHANGED_EVENT, onVolExtraChanged);
      window.removeEventListener(USER_META_CHANGED_EVENT, onUserMetaChanged);
      window.removeEventListener(USER_AVATAR_CHANGED_EVENT, onAvatarChanged);
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
          <p style={{ color: "#6C757D" }}>
            Войдите, чтобы увидеть профиль.
          </p>
          <div style={{ marginTop: 12 }}>
            <Link href="/login" className={s.btnLarge} style={{ maxWidth: 260 }}>
              ВОЙТИ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className={s.page}>
        <div className={s.container}>
          <p style={{ color: "#6C757D" }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  const org = isOrgRole(profile.role);

  const displayName =
    localFullName?.trim() ||
    profile.name?.trim() ||
    (org ? "Организация" : "Фамилия Имя");

  const aboutText = (profile.description || "").trim()
    ? profile.description!
    : org
    ? "Расскажите об организации.."
    : volExtra?.about?.trim() || "Расскажите о себе...";

  const locationText = profile.location?.trim() ? profile.location.trim() : "";

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

  const onConfirmDelete = async () => {
    if (!deletePetId) return;

    try {
      await animalsApi.delete(deletePetId);
      await loadPets();
    } finally {
      setDeleteOpen(false);
      setDeletePetId(null);
    }
  };

  return (
    <>
      <div className={s.page}>
        <div className={s.container}>
          <div className={s.profileHeader}>
            <div
              className={s.avatar}
              style={
                avatarUrl
                  ? {
                      backgroundImage: `url(${avatarUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            />
            <div className={s.profileInfo}>
              <h1>{displayName}</h1>
              <p>{org ? "Куратор / Организация" : "Волонтёр"}</p>
            </div>
            <button className={s.btnLogout} onClick={onLogout}>
              Выйти
            </button>
          </div>

          <section className={s.section}>
            <h3 className={s.sectionTitle}>О себе</h3>
            <p style={{ color: "#6C757D", fontSize: 14, margin: 0 }}>
              {aboutText}
            </p>
          </section>

          {!org ? (
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
          ) : (
            <>
              <section className={s.section}>
                <h3 className={s.sectionTitle}>Контактные данные</h3>
                <div className={s.contactDetails}>
                  <p className={s.contactRow}>
                    <span className={s.contactLabel}>Телефон:</span>{" "}
                    {profile.phone?.trim() ? (
                      profile.phone.trim()
                    ) : (
                      <span className={s.muted}>Не указано</span>
                    )}
                  </p>
                  <p className={s.contactRow}>
                    <span className={s.contactLabel}>Сайт:</span>{" "}
                    {profile.website?.trim() ? (
                      profile.website.trim()
                    ) : (
                      <span className={s.muted}>Не указано</span>
                    )}
                  </p>
                </div>
              </section>

              <section className={s.section}>
                <h3 className={s.sectionTitle}>Постоянные потребности</h3>
                {renderTags(profile.constantNeeds || [])}
              </section>

              <section className={s.section}>
                <h3 className={s.sectionTitle}>Реквизиты для пожертвований</h3>
                <p style={{ color: "#6C757D", fontSize: 14, margin: 0 }}>
                  {profile.donationDetails?.trim()
                    ? profile.donationDetails.trim()
                    : "Не указано"}
                </p>
              </section>
            </>
          )}

          <section className={s.section}>
            <h3 className={s.sectionTitle}>Локация</h3>
            {renderTags(locationText ? [locationText] : [])}
          </section>

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
                    aria-label={`Удалить карточку ${pet.name || "животного"}`}
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

                  <span>{pet.name?.trim() ? pet.name : "Животное"}</span>
                </Link>
              ))}

              <Link href="/animals/new" className={s.addPet}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Добавить
              </Link>
            </div>
          </section>

          <section className={s.section}>
            <h3 className={s.sectionTitle}>Активность</h3>
            <p style={{ color: "#6C757D", fontSize: 14, margin: 0 }}>
              {org
                ? `Созданные задачи: ${profile.countTasks ?? 0}`
                : `Выполненные задачи: ${profile.countTasks ?? 0}`}
            </p>
          </section>

          <section className={s.section}>
            <h3 className={s.sectionTitle}>Рейтинг</h3>
            <div className={s.ratingRow}>
              <div className={s.starsBig}>★★★★★</div>
              <div className={s.ratingMeta}>
                {rating.avg} ({rating.count} отзывов)
              </div>
            </div>
          </section>

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

      <ConfirmDeleteDialog
        open={deleteOpen}
        onCancel={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}