"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import s from "./editProfile.module.css";

import type { ProfileDto } from "@/src/types/profile";
import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { isOrgRole } from "@/src/lib/role";

import {
  AVAILABILITY,
  CITY_DEFAULT,
  COMPETENCIES,
  DISTRICTS,
  PREF_ANIMALS,
  PREF_INTERACTION,
} from "@/src/lib/constants/volunteerOptions";

import { ORG_NEEDS } from "@/src/lib/constants/orgOptions";

import {
  getVolunteerExtra,
  setVolunteerExtra,
  type VolunteerExtra,
} from "@/src/lib/storage/volunteerExtra";

import { organizationsApi } from "@/src/lib/api/organizations";
import { usersApi } from "@/src/lib/api/users";

import {
  normalizeAvailabilities,
  normalizePreferences,
  denormalizeAvailabilities,
  denormalizePreferences,
} from "@/src/lib/normalizeDictionaries";

import { ApiError } from "@/src/lib/api/http";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

function toggleSingle(list: string[], value: string) {
  return list[0] === value ? [] : [value];
}

function TagCheckbox({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className={s.tagItem}>
      <input
        id={id}
        type="checkbox"
        className={s.tagInput}
        checked={checked}
        onChange={onChange}
      />
      <label htmlFor={id} className={s.tagLabel}>
        {label}
      </label>
    </div>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileDto | null>(null);

  const [avatarUrl, setAvatarUrlState] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [about, setAbout] = useState("");
  const [competencies, setCompetencies] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [prefAnimals, setPrefAnimals] = useState<string[]>([]);
  const [prefInteraction, setPrefInteraction] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]); // 0..1

  const [orgAbout, setOrgAbout] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);
  const [orgDistricts, setOrgDistricts] = useState<string[]>([]); // 0..1
  const [donationRequisites, setDonationRequisites] = useState("");

  const city = useMemo(() => CITY_DEFAULT, []);

  useEffect(() => {
    (async () => {
      try {
        const p = await fetchCurrentProfile();
        setProfile(p);
        if (!p) return;

        setAvatarUrlState(p.photoUrl ?? null);

        const org = isOrgRole(p.role);

        if (org) {
          setOrgAbout(p.description ?? "");
          setPhone(p.phone ?? "");
          setWebsite(p.website ?? "");
          setNeeds(p.constantNeeds ?? []);
          setDonationRequisites(p.donationDetails ?? "");
          setOrgDistricts(p.location ? [p.location] : []);
        } else {
          setAbout(p.description ?? "");

          const extra = getVolunteerExtra(p.userId);

          setCompetencies(extra?.competencies ?? p.competencies ?? []);

          const apiAvailUI = denormalizeAvailabilities(p.availabilities ?? []);
          const lsAvailUI = extra?.availability ?? [];
          setAvailability(apiAvailUI.length ? apiAvailUI : lsAvailUI);

          const apiPrefsUI = denormalizePreferences(p.preferences ?? []);
          const lsPrefsUI = extra?.prefAnimals ?? [];
          setPrefAnimals(apiPrefsUI.length ? apiPrefsUI : lsPrefsUI);

          setPrefInteraction(extra?.prefInteraction ?? []);

          const apiLoc = p.location ? [p.location] : [];
          const lsLoc = (extra?.districts ?? []).slice(0, 1);
          const one = apiLoc.length ? apiLoc : lsLoc;
          setDistricts(one.slice(0, 1));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };

    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(`.${s.avatarEditor}`)) return;
      setSheetOpen(false);
    };

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(`.${s.avatarEditor}`)) return;
      setSheetOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("focusin", onFocusIn);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [sheetOpen]);

  const onPickFromGallery = () => {
    setSheetOpen(false);
    galleryInputRef.current?.click();
  };

  const onPickFromCamera = () => {
    setSheetOpen(false);
    cameraInputRef.current?.click();
  };

  const onDeleteAvatar = async () => {
    if (!profile) return;
    setSheetOpen(false);

    try {
      if (isOrgRole(profile.role)) {
        const res = await organizationsApi.patchProfile({ photoUrl: null });
        setAvatarUrlState(res.photoUrl ?? null);
      } else {
        const res = await usersApi.patchProfile({ photoUrl: null });
        setAvatarUrlState(res.photoUrl ?? null);
      }
    } catch {
      setAvatarUrlState(null);
      alert("Не удалось удалить фото на сервере (возможно, бэк не поддерживает удаление).");
    }
  };

  const onFileSelected = async (file: File | undefined) => {
    if (!profile || !file) return;

    if (file.size > MAX_PHOTO_BYTES) {
      alert("Файл не должен превышать 5 MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarUrlState(objectUrl);

    try {
      if (isOrgRole(profile.role)) {
        const res = await organizationsApi.patchProfilePhoto(file);
        setAvatarUrlState(res.photoUrl ?? null);
      } else {
        const res = await usersApi.patchProfilePhoto(file);
        setAvatarUrlState(res.photoUrl ?? null);
      }
    } catch (e) {
      setAvatarUrlState(profile.photoUrl ?? null);

      let msg = "Не удалось загрузить фото профиля";
      if (e instanceof ApiError) msg = e.message;
      else if (e instanceof Error) msg = e.message;

      if (msg.toLowerCase().includes("5 mb") || msg.toLowerCase().includes("5mb")) {
        msg = "Файл не должен превышать 5 MB";
      }
      alert(msg);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const org = isOrgRole(profile.role);

    const NO_PHOTO = "/images/NoPhoto.png";
    const trimmedAvatarUrl = (avatarUrl ?? "").trim();
    const effectiveAvatarUrl = trimmedAvatarUrl ? trimmedAvatarUrl : NO_PHOTO;

    try {
      if (org) {
        await organizationsApi.patchProfile({
          description: orgAbout.trim() || null,
          phone: phone.trim() || null,
          website: website.trim() || null,
          donationDetails: donationRequisites.trim() || null,
          constantNeeds: needs,
          location: orgDistricts[0] ?? null,
        });
        router.push("/profile");
        return;
      }

      const safeAvailApi = normalizeAvailabilities(availability);
      const safePrefsApi = normalizePreferences(prefAnimals);
      const safeDistricts = districts.slice(0, 1);

      await usersApi.patchProfile({
        description: about.trim() || null,
        location: safeDistricts[0] ?? null,
        competencies,
        preferences: safePrefsApi,
        availabilities: safeAvailApi,
      });

      const payload: VolunteerExtra = {
        about,
        competencies,
        availability,
        prefAnimals,
        prefInteraction,
        city,
        districts: safeDistricts,
      };
      setVolunteerExtra(profile.userId, payload);

      router.push("/profile");
    } catch (e2) {
      let msg = "Не удалось сохранить профиль";
      if (e2 instanceof ApiError) msg = e2.message;
      else if (e2 instanceof Error) msg = e2.message;
      alert(msg);
    }
  };

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.container}>Загрузка...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={s.page}>
        <div className={s.container}>
          <h2 style={{ marginBottom: 10 }}>Вы не вошли в аккаунт</h2>
          <p style={{ color: "#6C757D" }}>Войдите, чтобы редактировать профиль.</p>
        </div>
      </div>
    );
  }

  const org = isOrgRole(profile.role);

  // ===== NoPhoto fallback (без изменения дизайна) =====
  const NO_PHOTO = "/images/NoPhoto.png";
  const trimmedAvatarUrl = (avatarUrl ?? "").trim();
  const effectiveAvatarUrl = trimmedAvatarUrl ? trimmedAvatarUrl : NO_PHOTO;
  const isNoPhoto = !trimmedAvatarUrl;

  return (
    <div className={s.page}>
      <div className={s.container}>
        <form className={s.form} onSubmit={onSubmit}>
          <div className={s.profileInfo}>
            <div className={s.avatarEditor}>
              <div
                className={s.avatar}
                role="button"
                tabIndex={0}
                onClick={() => setSheetOpen((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSheetOpen((v) => !v);
                }}
                aria-label="Сменить фото профиля"
              >
                <img className={s.avatarImg} src={effectiveAvatarUrl} alt="Аватар" />

                <div className={s.avatarEditButton}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M17.414 2.586a2 2 0 0 0-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 0 0 0-2.828zM3 17a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5l-2 2v3H5V7h3l2-2H4a1 1 0 0 0-1 1v10z" />
                  </svg>
                  <span>Сменить фото</span>
                </div>

                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => onFileSelected(e.target.files?.[0])}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={(e) => onFileSelected(e.target.files?.[0])}
                />
              </div>

              {sheetOpen ? (
                <div className={s.actionSheet} role="dialog" aria-modal="false">
                  <ul className={s.actionsList}>
                    <li>
                      <button type="button" className={s.actionBtn} onClick={onPickFromGallery}>
                        Выбрать из галереи
                      </button>
                    </li>
                    <li>
                      <button type="button" className={s.actionBtn} onClick={onPickFromCamera}>
                        Сделать снимок
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className={`${s.actionBtn} ${s.actionDelete}`}
                        onClick={onDeleteAvatar}
                      >
                        Удалить фото
                      </button>
                    </li>
                  </ul>
                  <div className={s.cancelAction}>
                    <button
                      type="button"
                      className={s.cancelBtn}
                      onClick={() => setSheetOpen(false)}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <h1 className={s.name}>{profile.name ?? "Фамилия Имя"}</h1>
            <p className={s.role}>{org ? "Куратор / Организация" : "Волонтёр"}</p>
          </div>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>О себе</h2>
            <textarea
              className={`${s.textarea} ${s.textareaSmall}`}
              value={org ? orgAbout : about}
              onChange={(e) => (org ? setOrgAbout(e.target.value) : setAbout(e.target.value))}
            />
          </section>

          {org ? (
            <>
              <section className={s.section}>
                <h2 className={s.sectionTitle}>Контактные данные</h2>
                <div className={s.field}>
                  <label className={s.fieldLabel}>Телефон</label>
                  <input
                    className={s.input}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className={s.field} style={{ marginTop: 12 }}>
                  <label className={s.fieldLabel}>Сайт</label>
                  <input
                    className={s.input}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </section>

              <section className={s.section}>
                <h2 className={s.sectionTitle}>Постоянные потребности</h2>
                <div className={s.tags}>
                  {ORG_NEEDS.map((label) => (
                    <TagCheckbox
                      key={label}
                      id={`need_${label}`}
                      label={label}
                      checked={needs.includes(label)}
                      onChange={() => setNeeds((prev) => toggle(prev, label))}
                    />
                  ))}
                </div>
              </section>

              <section className={s.section}>
                <h2 className={s.sectionTitle}>Локация</h2>
                <p className={s.city}>Город: {city}</p>
                <div className={s.tags}>
                  {DISTRICTS.map((label) => (
                    <TagCheckbox
                      key={label}
                      id={`org_loc_${label}`}
                      label={label}
                      checked={orgDistricts.includes(label)}
                      onChange={() => setOrgDistricts((prev) => toggleSingle(prev, label))}
                    />
                  ))}
                </div>
              </section>

              <section className={s.section}>
                <h2 className={s.sectionTitle}>Реквизиты для пожертвований</h2>
                <textarea
                  className={`${s.textarea} ${s.textareaSmall}`}
                  value={donationRequisites}
                  onChange={(e) => setDonationRequisites(e.target.value)}
                />
              </section>
            </>
          ) : (
            <>
              <section className={s.section}>
                <h2 className={s.sectionTitle}>Компетенции</h2>
                <div className={s.tags}>
                  {COMPETENCIES.map((label) => (
                    <TagCheckbox
                      key={label}
                      id={`comp_${label}`}
                      label={label}
                      checked={competencies.includes(label)}
                      onChange={() => setCompetencies((prev) => toggle(prev, label))}
                    />
                  ))}
                </div>
              </section>

              <section className={s.section}>
                <h2 className={s.sectionTitle}>Доступность</h2>
                <div className={s.tags}>
                  {AVAILABILITY.map((label) => (
                    <TagCheckbox
                      key={label}
                      id={`avail_${label}`}
                      label={label}
                      checked={availability.includes(label)}
                      onChange={() => setAvailability((prev) => toggle(prev, label))}
                    />
                  ))}
                </div>
              </section>

              <section className={s.section}>
                <h2 className={s.sectionTitle}>Предпочтения (Животные)</h2>
                <div className={s.tags}>
                  {PREF_ANIMALS.map((label) => (
                    <TagCheckbox
                      key={label}
                      id={`pa_${label}`}
                      label={label}
                      checked={prefAnimals.includes(label)}
                      onChange={() => setPrefAnimals((prev) => toggle(prev, label))}
                    />
                  ))}
                </div>
              </section>

              <section className={s.section}>
                <h2 className={s.sectionTitle}>Локация</h2>
                <p className={s.city}>Город: {city}</p>
                <div className={s.tags}>
                  {DISTRICTS.map((label) => (
                    <TagCheckbox
                      key={label}
                      id={`vol_loc_${label}`}
                      label={label}
                      checked={districts.includes(label)}
                      onChange={() => setDistricts((prev) => toggleSingle(prev, label))}
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          <button type="submit" className={s.saveButton}>
            СОХРАНИТЬ
          </button>
        </form>
      </div>
    </div>
  );
}