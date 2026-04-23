"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import overlay from "../../../@modal/modalOverlay.module.css";
import a from "../../new/animalNew.module.css";

import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { fileToDataUrl } from "@/src/lib/fileToDataUrl";
import { getAnimal, updateAnimal } from "@/src/lib/storage/animals";

export default function EditAnimalPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params.id || "");

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  const [defaults, setDefaults] = useState<{
    name: string;
    species: string;
    breed: string;
    age: string;
    history: string;
    health: string;
    character: string;
    needs: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetchCurrentProfile();
        if (!me) {
          alert("Нужно войти в аккаунт, чтобы редактировать карточку");
          router.push("/login");
          return;
        }

        const animal = getAnimal(id);
        if (!animal) {
          alert("Карточка не найдена");
          router.push("/profile");
          return;
        }

        if (animal.ownerUserId !== me.userId) {
          alert("Нет доступа к редактированию этой карточки");
          router.push("/profile");
          return;
        }

        setPhotoPreview(animal.photoUrl);
        setPhotoDataUrl(animal.photoUrl);

        setDefaults({
          name: animal.name ?? "",
          species: animal.species ?? "",
          breed: animal.breed ?? "",
          age: animal.age ?? "",
          history: animal.history ?? "",
          health: animal.health ?? "",
          character: animal.character ?? "",
          needs: animal.needs ?? "",
        });
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

    // ВАЖНО: читаем FormData до await
    const form = e.currentTarget;
    const fd = new FormData(form);

    setSubmitting(true);
    try {
      const species = String(fd.get("species") ?? "").trim();
      if (!species) {
        alert("Выберите вид животного");
        return;
      }

      const name = String(fd.get("name") ?? "").trim();
      const breed = String(fd.get("breed") ?? "").trim();
      const age = String(fd.get("age") ?? "").trim();
      const history = String(fd.get("history") ?? "").trim();
      const health = String(fd.get("health") ?? "").trim();
      const character = String(fd.get("character") ?? "").trim();
      const needs = String(fd.get("needs") ?? "").trim();

      const updated = updateAnimal(id, {
        photoUrl: photoDataUrl,
        name,
        species,
        breed,
        age,
        history,
        health,
        character,
        needs,
      });

      if (!updated) {
        alert("Не удалось сохранить (карточка не найдена)");
        router.push("/profile");
        return;
      }

      router.replace(`/animals/${id}`);
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

  if (!defaults) return null;

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
            {/* Крестик закрыть (если ты уже добавил a.closeBtn в CSS) */}
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
              <input id="name" name="name" type="text" className={a.input} defaultValue={defaults.name} />
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
                defaultValue={defaults.species}
              />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="breed">
                Порода
              </label>
              <input id="breed" name="breed" type="text" className={a.input} defaultValue={defaults.breed} />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="age">
                Возраст
              </label>
              <input id="age" name="age" type="text" className={a.input} defaultValue={defaults.age} />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="history">
                История
              </label>
              <textarea
                id="history"
                name="history"
                className={a.textarea}
                defaultValue={defaults.history}
              />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="health">
                Состояние здоровья
              </label>
              <textarea id="health" name="health" className={a.textarea} defaultValue={defaults.health} />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="character">
                Характер
              </label>
              <textarea
                id="character"
                name="character"
                className={a.textarea}
                defaultValue={defaults.character}
              />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="needs">
                Особые потребности
              </label>
              <textarea id="needs" name="needs" className={a.textarea} defaultValue={defaults.needs} />
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