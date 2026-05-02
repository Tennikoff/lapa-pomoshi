"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import overlay from "../../../@modal/modalOverlay.module.css";
import a from "../../new/animalNew.module.css";

import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { fileToDataUrl } from "@/src/lib/fileToDataUrl";
import { animalsApi, type AnimalDto } from "@/src/lib/api/animals";
import { ApiError } from "@/src/lib/api/http";

export default function EditAnimalPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params.id || "");

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [animal, setAnimal] = useState<AnimalDto | null>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  // defaults
  const [name, setName] = useState("");
  const [animalType, setAnimalType] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState(""); // UI строка, API нормализует
  const [history, setHistory] = useState(""); // API не хранит — UI оставляем
  const [health, setHealth] = useState("");
  const [character, setCharacter] = useState("");
  const [needs, setNeeds] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await fetchCurrentProfile();
        if (!me) {
          alert("Нужно войти в аккаунт, чтобы редактировать карточку");
          router.push("/login");
          return;
        }

        const a1 = await animalsApi.getById(id);

        // доступ: текущий юзер должен быть owner
        const hasAccess = (a1.owners || []).some((o) => o.id === me.userId);
        if (!hasAccess) {
          alert("Нет доступа к редактированию этой карточки");
          router.push("/profile");
          return;
        }

        setAnimal(a1);

        setPhotoPreview(a1.photoUrl);
        setPhotoDataUrl(a1.photoUrl);

        setName(a1.name ?? "");
        setAnimalType(a1.animalType ?? "");
        setBreed(a1.breed ?? "");
        setAge(a1.age != null ? String(a1.age) : "");
        setHistory("");
        setHealth(a1.health ?? "");
        setCharacter(a1.character ?? "");
        setNeeds(a1.specialNeeds ?? "");
      } catch {
        setAnimal(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const onPickPhoto = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);

    const dataUrl = await fileToDataUrl(file);
    setPhotoDataUrl(dataUrl);
  };

  const onCancel = () => router.back();

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const safeName = name.trim() || "Без имени";
    const safeType = animalType.trim();
    if (!safeType) return alert("Выберите вид животного");

    setSubmitting(true);
    try {
      await animalsApi.patch(id, {
        animalType: safeType,
        name: safeName,
        breed: breed.trim() || null,
        age: age.trim() ? age.trim() : null, // string|null -> animalsApi нормализует
        health: health.trim() || null,
        character: character.trim() || null,
        specialNeeds: needs.trim() || null,
        photoUrl: photoDataUrl || null, // ✅ пробуем сохранять фото в API
      });

      router.replace(`/animals/${id}`);
    } catch (e2) {
      let msg = "Не удалось сохранить изменения";
      if (e2 instanceof ApiError) msg = e2.message;
      else if (e2 instanceof Error) msg = e2.message;

      console.error(e2);
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
            <button className={a.closeBtn} type="button" onClick={onCancel} aria-label="Закрыть">
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
                    <img className={a.photoPreview} src={photoPreview} alt="Превью фото" />
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
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className={a.fileInput}
                  onChange={onFileChange}
                />
              </div>
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
              <button type="button" className={a.btn} onClick={onCancel} disabled={submitting}>
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