import Link from "next/link";

import type { ProfileDto } from "@/src/types/profile";
import { usersApi } from "@/src/lib/api/users";
import { isOrgRole } from "@/src/lib/role";
import { ApiError, apiFetch } from "@/src/lib/api/http";

import s from "@/src/app/(main)/profile/profile.module.css";
import { BackHeader } from "./ui/BackHeader";
import { PublicReviewsSection } from "./ui/PublicReviewsSection";

export const dynamic = "force-dynamic";

const DEFAULT_PET_BG =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300";

type PublicAnimalsResponseDto = {
  animals?: Array<{ id: string; name: string; photoUrl: string | null }>;
};

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

export default async function PublicUserProfilePage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = String(rawId ?? "").trim();

  let profile: ProfileDto | null = null;
  let errorText: string | null = null;

  if (!id) {
    errorText = "Некорректный userId в URL";
  } else {
    try {
      profile = await usersApi.getPublicProfile(id);
    } catch (e) {
      if (e instanceof ApiError) errorText = `API ${e.status}: ${e.message}`;
      else if (e instanceof Error) errorText = e.message;
      else errorText = "Не удалось загрузить профиль";
    }
  }

  if (!profile) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px 20px 40px" }}>
        <BackHeader title="Задачи" />
        <div>
          <p style={{ margin: "0 0 10px", color: "#6c757d" }}>
            userId: <code>{id || "—"}</code>
          </p>
          <p style={{ margin: 0, color: "#6c757d" }}>
            {errorText || "Пользователь не найден / профиль недоступен"}
          </p>
          <div style={{ marginTop: 14 }}>
            <Link
              href="/tasks"
              style={{ textDecoration: "underline", color: "#1c274c" }}
            >
              Перейти к задачам
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const org = isOrgRole(profile.role);
  const displayName = profile.name?.trim() ? profile.name.trim() : profile.email;

  const aboutText = profile.description?.trim()
    ? profile.description.trim()
    : org
      ? "Расскажите об организации..."
      : "Расскажите о себе...";

  const locationTags = profile.location?.trim() ? [profile.location.trim()] : [];

  // ✅ честный рейтинг без фейковых значений
  const count = Number(profile.countRating ?? 0);
  const sum = Number(profile.sumRating ?? 0);
  const avg = count > 0 ? (sum / count).toFixed(1) : "0.0";
  const rating = { avg, count };

  // Питомцы (публично, если ручка доступна без auth)
  let pets: Array<{ id: string; name: string; photoUrl: string | null }> = [];
  try {
    const path = org
      ? `/api/Animals/organization/${profile.userId}?offset=0&limit=50`
      : `/api/Animals/volunteer/${profile.userId}?offset=0&limit=50`;

    const res = (await apiFetch(path, { cache: "no-store" })) as PublicAnimalsResponseDto;
    pets = Array.isArray(res?.animals) ? res.animals : [];
  } catch {
    pets = [];
  }

  return (
    <main>
      <div className={s.page}>
        <div className={s.container}>
          <div style={{ marginTop: 20 }}>
            <BackHeader title="Задачи" />
          </div>

          <div className={s.profileHeader}>
            <div
              className={s.avatar}
              style={
                profile.photoUrl
                  ? {
                      backgroundImage: `url(${profile.photoUrl})`,
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
          </div>

          <section className={s.section}>
            <h3 className={s.sectionTitle}>О себе</h3>
            <p style={{ color: "#6C757D", fontSize: 14, margin: 0 }}>{aboutText}</p>
          </section>

          {org ? (
            <>
              <section className={s.section}>
                <h3 className={s.sectionTitle}>Контактные данные</h3>
                <div className={s.contactDetails}>
                  <p className={s.contactRow}>
                    <span className={s.contactLabel}>Телефон:</span>{" "}
                    {profile.phone?.trim() ? profile.phone.trim() : <span className={s.muted}>Не указано</span>}
                  </p>
                  <p className={s.contactRow}>
                    <span className={s.contactLabel}>Сайт:</span>{" "}
                    {profile.website?.trim() ? profile.website.trim() : <span className={s.muted}>Не указано</span>}
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
          ) : (
            <>
              <section className={s.section}>
                <h3 className={s.sectionTitle}>Компетенции</h3>
                {renderTags(profile.competencies || [])}
              </section>

              <section className={s.section}>
                <h3 className={s.sectionTitle}>Доступность</h3>
                {renderTags(profile.availabilities || [])}
              </section>

              <section className={s.section}>
                <h3 className={s.sectionTitle}>Предпочтения (Животные)</h3>
                {renderTags(profile.preferences || [])}
              </section>
            </>
          )}

          <section className={s.section}>
            <h3 className={s.sectionTitle}>Локация</h3>
            {renderTags(locationTags)}
          </section>

          <section className={s.section}>
            <h3 className={s.sectionTitle}>Мои питомцы</h3>
            {pets.length ? (
              <div className={s.petsGrid}>
                {pets.map((pet) => (
                  <div
                    key={pet.id}
                    className={s.petCard}
                    style={{
                      backgroundImage: `url(${pet.photoUrl || DEFAULT_PET_BG})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      cursor: "default",
                    }}
                    aria-label={pet.name?.trim() ? pet.name.trim() : "Животное"}
                  >
                    <span>{pet.name?.trim() ? pet.name.trim() : "Животное"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#6C757D", fontSize: 14, margin: 0 }}>Не указано</p>
            )}
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

          <PublicReviewsSection showLeaveReviewButton />
        </div>
      </div>
    </main>
  );
}