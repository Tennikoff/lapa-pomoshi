"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import s from "./profile.module.css";
import tasksStyles from "@/src/app/(main)/tasks/tasks.module.css";

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
import { animalsApi, type AnimalListItemDto } from "@/src/lib/api/animals";

import {
  denormalizeAvailabilities,
  denormalizePreferences,
} from "@/src/lib/normalizeDictionaries";

import { PublicReviewsSection } from "@/src/app/(main)/users/[id]/ui/PublicReviewsSection";

import { TaskCard } from "@/src/app/(main)/tasks/_components/TaskCard";
import {
  listCompletedHelpTasks,
  clearCompletedHelpTasks,
  COMPLETED_HELP_TASKS_CHANGED_EVENT,
} from "@/src/lib/storage/completedHelpTasks";

import { helpTasksApi } from "@/src/lib/api/helpTasks";

const HELP_TASKS_CHANGED_EVENT = "lp_help_tasks_changed";
const PAGE_SIZE = 50;
const MAX_TOTAL = 500;

const DEFAULT_PET_BG =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300";

const INITIAL_VISIBLE_PETS = 4;
const LOAD_MORE_PETS_STEP = 4;

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

export default function ProfilePage() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [volExtra, setVolExtra] = useState<VolunteerExtra | null>(null);

  const [pets, setPets] = useState<AnimalListItemDto[]>([]);
  const [visiblePetsCount, setVisiblePetsCount] = useState(INITIAL_VISIBLE_PETS);

  const [completed, setCompleted] = useState(() => listCompletedHelpTasks(""));

  const [activeCreatedIds, setActiveCreatedIds] = useState<string[] | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePetId, setDeletePetId] = useState<string | null>(null);

  const loadPets = useCallback(async () => {
    try {
      const res = await animalsApi.my(0, 50);
      const nextPets = res.animals ?? [];
      setPets(nextPets);

      setVisiblePetsCount((prev) => {
        const base = Math.max(prev, INITIAL_VISIBLE_PETS);
        return Math.min(base, nextPets.length);
      });
    } catch {
      setPets([]);
      setVisiblePetsCount(0);
    }
  }, []);

  useEffect(() => {
    if (!profile) return;

    let inFlight = false;

    const reload = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        await loadPets();
      } finally {
        inFlight = false;
      }
    };

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") reload();
    };

    window.addEventListener("popstate", reload);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    window.addEventListener("focus", onVisibilityOrFocus);

    return () => {
      window.removeEventListener("popstate", reload);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      window.removeEventListener("focus", onVisibilityOrFocus);
    };
  }, [profile, loadPets]);

  const loadActiveCreatedIds = async () => {
    try {
      const ids = new Set<string>();
      let offset = 0;

      while (ids.size < MAX_TOTAL) {
        const res = await helpTasksApi.myCreated(offset, PAGE_SIZE);
        const chunk = res.tasks ?? [];

        for (const t of chunk) {
          if (t?.id) ids.add(t.id);
        }

        if (!res.hasMore || chunk.length === 0) break;
        offset += PAGE_SIZE;
      }

      setActiveCreatedIds(Array.from(ids));
    } catch {
      setActiveCreatedIds(null);
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
          const org = isOrgRole(p.role);

          if (!org) setVolExtra(getVolunteerExtra(p.userId));
          else setVolExtra(null);

          setActiveCreatedIds(null);
          if (org) await loadActiveCreatedIds();

          await loadPets();

          setVisiblePetsCount((prev) => (prev === 0 ? INITIAL_VISIBLE_PETS : prev));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!profile) return;

    const onVolExtraChanged = () => {
      if (!isOrgRole(profile.role)) {
        setVolExtra(getVolunteerExtra(profile.userId));
      }
    };

    window.addEventListener(VOLUNTEER_EXTRA_CHANGED_EVENT, onVolExtraChanged);
    return () => window.removeEventListener(VOLUNTEER_EXTRA_CHANGED_EVENT, onVolExtraChanged);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;

    if (!isOrgRole(profile.role)) {
      setCompleted([]);
      return;
    }

    const loadCompleted = () => setCompleted(listCompletedHelpTasks(profile.userId));
    loadCompleted();

    window.addEventListener(COMPLETED_HELP_TASKS_CHANGED_EVENT, loadCompleted);
    return () => window.removeEventListener(COMPLETED_HELP_TASKS_CHANGED_EVENT, loadCompleted);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    if (!isOrgRole(profile.role)) return;

    const onChanged = () => {
      loadActiveCreatedIds();
    };

    window.addEventListener(HELP_TASKS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(HELP_TASKS_CHANGED_EVENT, onChanged);
  }, [profile?.userId]);

  const onLogout = () => {
    clearAccessToken();
    setToken(null);
    setProfile(null);
    setCompleted([]);
    setActiveCreatedIds(null);
    router.push("/");
  };

  const rating = useMemo(() => {
    if (!profile) return { avg: "0.0", count: 0 };
    const count = Number(profile.countRating ?? 0);
    const sum = Number(profile.sumRating ?? 0);
    const avg = count > 0 ? (sum / count).toFixed(1) : "0.0";
    return { avg, count };
  }, [profile]);

  const createdTotalCount = useMemo(() => {
    if (!profile || !isOrgRole(profile.role)) return 0;

    const union = new Set<string>();

    for (const id of activeCreatedIds ?? []) union.add(id);

    for (const t of completed ?? []) {
      if (t?.id) union.add(t.id);
    }

    if (activeCreatedIds === null && union.size === 0) {
      const fallbackActive = Number(profile.countTasks ?? 0);
      const completedCount = completed?.length ?? 0;
      return fallbackActive + completedCount;
    }

    return union.size;
  }, [activeCreatedIds, completed, profile]);

  if (!loading && !token) {
    return (
      <div className={s.page}>
        <div className={s.centerScreen}>
          <div className={s.centerBox}>
            <h2 style={{ margin: "0 0 6px" }}>Вы не вошли в аккаунт</h2>
            <p style={{ color: "#6C757D", margin: 0 }}>Войдите, чтобы увидеть профиль.</p>

            <Link href="/login" className={`${s.btnLarge} ${s.btnLogin}`}>
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

  const displayName = profile.name?.trim() ? profile.name.trim() : profile.email;

  const aboutText =
    profile.description?.trim() ||
    (org ? "Расскажите об организации..." : volExtra?.about?.trim() || "Расскажите о себе...");

  const competenciesView =
    (profile.competencies?.length ? profile.competencies : volExtra?.competencies) || [];

  const availabilityApi =
    (profile.availabilities?.length ? profile.availabilities : volExtra?.availability) || [];
  const availabilityView = denormalizeAvailabilities(availabilityApi);

  const prefAnimalsApi =
    (profile.preferences?.length ? profile.preferences : volExtra?.prefAnimals) || [];
  const prefAnimalsView = denormalizePreferences(prefAnimalsApi);

  const locationTags = profile.location?.trim() ? [profile.location.trim()] : [];

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

  const avatarUrl = profile.photoUrl;

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
            <p style={{ color: "#6C757D", fontSize: 14, margin: 0 }}>{aboutText}</p>
          </section>

          {!org ? (
            <>
              <section className={s.section}>
                <h3 className={s.sectionTitle}>Компетенции</h3>
                {renderTags(competenciesView)}
              </section>

              <section className={s.section}>
                <h3 className={s.sectionTitle}>Доступность</h3>
                {renderTags(availabilityView)}
              </section>

              <section className={s.section}>
                <h3 className={s.sectionTitle}>Предпочтения (Животные)</h3>
                {renderTags(prefAnimalsView)}
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
            {renderTags(locationTags)}
          </section>

          <section className={s.section}>
            <h3 className={s.sectionTitle}>Мои питомцы</h3>
            <div className={s.petsGrid}>
              {pets.slice(0, visiblePetsCount).map((pet) => (
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

              {pets.length > visiblePetsCount ? (
                <div className={s.petsLoadActions}>
                  <button
                    type="button"
                    className={tasksStyles.loadMoreBtn}
                    onClick={() =>
                      setVisiblePetsCount((v) => Math.min(pets.length, v + LOAD_MORE_PETS_STEP))
                    }
                  >
                    Загрузить строку
                  </button>
                  <button
                    type="button"
                    className={tasksStyles.loadMoreBtn}
                    onClick={() => setVisiblePetsCount(pets.length)}
                  >
                    Загрузить все
                  </button>
                </div>
              ) : null}

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
              {org
                ? `Созданные задачи: ${createdTotalCount}`
                : `Выполненные задачи: ${profile.countTasks ?? 0}`}
            </p>
          </section>

          {/* Архив выполненных задач - НЕ показываем блок, если архив пуст */}
          {org && completed.length > 0 ? (
            <section className={s.section}>
              <h3 className={s.sectionTitle}>Выполненные задачи (архив) — {completed.length}</h3>

              <div className={tasksStyles.cardsGrid}>
                {completed.slice(0, 12).map((t) => (
                  <TaskCard key={t.id} task={t} mode="curator" />
                ))}
              </div>

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className={tasksStyles.loadMoreBtn}
                  onClick={() => {
                    clearCompletedHelpTasks(profile.userId);
                  }}
                >
                  Очистить архив
                </button>
              </div>
            </section>
          ) : null}

          <section className={s.section}>
            <h3 className={s.sectionTitle}>Рейтинг</h3>
            <div className={s.ratingRow}>
              {(() => {
                const avgNum = Number(rating.avg);
                const safeAvg = Number.isFinite(avgNum) ? avgNum : 0;
                const filled = Math.max(0, Math.min(5, Math.round(safeAvg)));
                const empty = 5 - filled;
                return (
                  <div className={s.starsBig} aria-label={`Рейтинг ${rating.avg} из 5`}>
                    <span>{"★★★★★".slice(0, filled)}</span>
                    <span className={s.starsEmpty}>{"★★★★★".slice(0, empty)}</span>
                  </div>
                );
              })()}
              <div className={s.ratingMeta}>
                {rating.avg} ({rating.count} отзывов)
              </div>
            </div>
          </section>

          {/* реальные отзывы из API /api/Comments/user/{userId} */}
          <PublicReviewsSection key={profile.userId} userId={profile.userId} />

          <Link href="/profile/edit" className={s.btnLarge}>
            РЕДАКТИРОВАТЬ ПРОФИЛЬ
          </Link>
        </div>
      </div>

      <ConfirmDeleteDialog open={deleteOpen} onCancel={onCancelDelete} onConfirm={onConfirmDelete} />
    </>
  );
}