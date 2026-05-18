"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import overlay from "@/src/app/(main)/@modal/modalOverlay.module.css";
import a from "@/src/app/(main)/animals/new/animalNew.module.css";

import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { animalsApi, type AnimalDto } from "@/src/lib/api/animals";
import { ApiError } from "@/src/lib/api/http";

import {
  packAnimalSpecialNeeds,
  unpackAnimalSpecialNeeds,
} from "@/src/lib/animalHistoryBridge";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

function isTooLarge(file: File) {
  return file.size > MAX_PHOTO_BYTES;
}

export default function EditAnimalPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params.id || "");

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [animal, setAnimal] = useState<AnimalDto | null>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // fields
  const [name, setName] = useState("");
  const [animalType, setAnimalType] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");

  // UI field "История" (на бэке нет поля, храним в specialNeeds в упакованном виде)
  const [history, setHistory] = useState("");

  const [health, setHealth] = useState("");
  const [character, setCharacter] = useState("");

  // UI field "Особые потребности" (тоже хранится в specialNeeds, но отдельно от истории внутри упаковки)
  const [needs, setNeeds] = useState("");

  // cleanup objectURL
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  // init load + access check
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const me = await fetchCurrentProfile();
        if (!me) {
          alert("Нужно войти в аккаунт, чтобы редактировать карточку");
          router.push("/login");
          return;
        }

        const a1 = await animalsApi.getById(id);
        if (cancelled) return;

        const hasAccess = (a1.owners || []).some((o) => o.id === me.userId);
        if (!hasAccess) {
          alert("Нет доступа к редактированию этой карточки");
          router.push("/profile");
          return;
        }

        setAnimal(a1);

        setPhotoPreview(a1.photoUrl ?? null);

        setName(a1.name ?? "");
        setAnimalType(a1.animalType ?? "");
        setBreed(a1.breed ?? "");
        setAge(a1.age != null ? String(a1.age) : "");

        // ✅ история/особые потребности берём из specialNeeds (распаковка)
        const meta = unpackAnimalSpecialNeeds(a1.specialNeeds);
        setHistory(meta.history ?? "");
        setNeeds(meta.specialNeeds ?? "");

        setHealth(a1.health ?? "");
        setCharacter(a1.character ?? "");
      } catch {
        setAnimal(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const onPickPhoto = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return objectUrl;
    });

    if (isTooLarge(file)) {
      setPhotoFile(null);
      setPhotoError("Файл не должен превышать 5 MB. Выберите другое фото.");
      e.target.value = "";
      return;
    }

    setPhotoFile(file);
    setPhotoError(null);
  };

  const onCancel = () => router.back();

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (photoError) return;

    const safeName = name.trim() || "Без имени";
    const safeType = animalType.trim();
    if (!safeType) return alert("Выберите вид животного");

    setSubmitting(true);
    try {
      // ✅ упаковываем историю + особые потребности в одно поле specialNeeds
      const packedSpecialNeeds = packAnimalSpecialNeeds({
        history,
        specialNeeds: needs,
      });

      const dto = {
        animalType: safeType,
        name: safeName,
        breed: breed.trim() || null,
        age: age.trim() ? age.trim() : null,
        health: health.trim() || null,
        character: character.trim() || null,
        specialNeeds: packedSpecialNeeds,
      };

      if (photoFile) {
        await animalsApi.patchWithPhoto(id, dto, photoFile);
      } else {
        await animalsApi.patch(id, dto);
      }

      router.replace(`/animals/${id}`);
    } catch (e2) {
      let msg = "Не удалось сохранить изменения";
      if (e2 instanceof ApiError) msg = e2.message;
      else if (e2 instanceof Error) msg = e2.message;

      const low = msg.toLowerCase();
      if (low.includes("5 mb") || low.includes("5mb")) {
        setPhotoError("Файл не должен превышать 5 MB. Выберите другое фото.");
        setPhotoFile(null);
        return;
      }

      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className={overlay.overlay}
        role="dialog"
        aria-modal="true"
        style={{ "--modal-dim": "0.6" } as CSSProperties}
      >
        <div className={overlay.content}>
          <div className={overlay.scrollBox} style={{ color: "#fff" }}>
            Загрузка...
          </div>
        </div>
      </div>
    );
  }

  if (!animal) return null;

  return (
    <div
      className={overlay.overlay}
      role="dialog"
      aria-modal="true"
      style={{ "--modal-dim": "0.6" } as CSSProperties}
    >
      <div className={overlay.content}>
        <div className={overlay.scrollBox}>
          <form className={a.formCard} onSubmit={onSubmit}>
            <button
              className={a.closeBtn}
              type="button"
              onClick={onCancel}
              aria-label="Закрыть"
            >
              ×
            </button>

            <h1 className={a.title}>Редактирование карточки</h1>

            <div className={a.field}>
              <label className={a.label}>Фото</label>
              <div className={a.photoRow}>
                <button
                  type="button"
                  className={a.photoUpload}
                  onClick={onPickPhoto}
                  aria-label="Загрузить фото"
                >
                  {photoPreview ? (
                    <img
                      className={a.photoPreview}
                      src={photoPreview}
                      alt="Превью фото"
                    />
                  ) : (
                    <div className={a.photoPlaceholder}>
                      <div className={a.plus}>+</div>
                      <div className={a.photoText}>
                        Загрузить
                        <br />
                        фото
                      </div>
                    </div>
                  )}

                  {photoError ? <div className={a.photoErrorBadge}>×</div> : null}
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className={a.fileInput}
                  onChange={onFileChange}
                />
              </div>

              {photoError ? <p className={a.photoWarning}>{photoError}</p> : null}
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="name">
                Имя (если есть)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={a.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="species">
                Вид животного*
              </label>
              <input
                id="species"
                name="species"
                type="text"
                className={a.input}
                value={animalType}
                onChange={(e) => setAnimalType(e.target.value)}
              />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="breed">
                Порода
              </label>
              <input
                id="breed"
                name="breed"
                type="text"
                className={a.input}
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
              />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="age">
                Возраст
              </label>
              <input
                id="age"
                name="age"
                type="text"
                className={a.input}
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="history">
                История
              </label>
              <textarea
                id="history"
                name="history"
                className={a.textarea}
                value={history}
                onChange={(e) => setHistory(e.target.value)}
              />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="health">
                Состояние здоровья
              </label>
              <textarea
                id="health"
                name="health"
                className={a.textarea}
                value={health}
                onChange={(e) => setHealth(e.target.value)}
              />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="character">
                Характер
              </label>
              <textarea
                id="character"
                name="character"
                className={a.textarea}
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
              />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="needs">
                Особые потребности
              </label>
              <textarea
                id="needs"
                name="needs"
                className={a.textarea}
                value={needs}
                onChange={(e) => setNeeds(e.target.value)}
              />
            </div>

            <div className={a.actions}>
              <button
                type="button"
                className={a.btn}
                onClick={onCancel}
                disabled={submitting}
              >
                ОТМЕНИТЬ
              </button>
              <button type="submit" className={a.btn} disabled={submitting}>
                {submitting ? "..." : "СОХРАНИТЬ"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}