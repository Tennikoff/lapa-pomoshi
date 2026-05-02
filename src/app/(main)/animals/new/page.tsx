"use client";

import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import overlay from "../../@modal/modalOverlay.module.css";
import a from "./animalNew.module.css";

import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { animalsApi } from "@/src/lib/api/animals";
import { fileToDataUrl } from "@/src/lib/fileToDataUrl";
import { ApiError } from "@/src/lib/api/http";

export default function NewAnimalPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onPickPhoto = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // ✅ DataURL — попробуем отправлять на бэк как photoUrl
    const dataUrl = await fileToDataUrl(file);
    setPhotoDataUrl(dataUrl);
  };

  const onCancel = () => router.back();

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const fd = new FormData(e.currentTarget);

    const name = String(fd.get("name") ?? "").trim();
    const animalType = String(fd.get("species") ?? "").trim();
    const breed = String(fd.get("breed") ?? "").trim();
    const ageRaw = String(fd.get("age") ?? "").trim();
    const health = String(fd.get("health") ?? "").trim();
    const character = String(fd.get("character") ?? "").trim();
    const needs = String(fd.get("needs") ?? "").trim();
    // history в API нет — UI оставляем, на бэк не шлём
    // const history = String(fd.get("history") ?? "").trim();

    if (!animalType) return alert("Выберите вид животного");

    // Бэк требует name — если пусто, подставляем
    const safeName = name || "Без имени";

    // age на бэке short? — но мы уже нормализуем в animalsApi
    const age = ageRaw ? ageRaw : null;

    setSubmitting(true);
    try {
      const me = await fetchCurrentProfile();
      if (!me) {
        alert("Нужно войти в аккаунт, чтобы создать карточку животного");
        router.push("/login");
        return;
      }

      const created = await animalsApi.create({
        animalType,
        name: safeName,
        breed: breed || null,
        age, // string|null OK -> animalsApi нормализует в number|null
        health: health || null,
        character: character || null,
        specialNeeds: needs || null,
        photoUrl: photoDataUrl || null, // ✅ пробуем сохранять фото в API
      });

      router.replace(`/animals/${created.id}`);
    } catch (e2) {
      let msg = "Не удалось создать карточку животного";
      if (e2 instanceof ApiError) msg = e2.message;
      else if (e2 instanceof Error) msg = e2.message;

      console.error(e2);
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

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
            <h1 className={a.title}>Создание карточки животного</h1>

            <div className={a.field}>
              <label className={a.label}>Фото</label>
              <div className={a.photoRow}>
                <button
                  type="button"
                  className={a.photoUpload}
                  onClick={onPickPhoto}
                  aria-label="Загрузить фото"
                >
                  {previewUrl ? (
                    <img className={a.photoPreview} src={previewUrl} alt="Превью фото" />
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
              <input id="name" name="name" type="text" className={a.input} />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="species">
                Вид животного*
              </label>
              <input id="species" name="species" type="text" className={a.input} />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="breed">
                Порода
              </label>
              <input id="breed" name="breed" type="text" className={a.input} />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="age">
                Возраст
              </label>
              <input id="age" name="age" type="text" className={a.input} />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="history">
                История
              </label>
              <textarea id="history" name="history" className={a.textarea} />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="health">
                Состояние здоровья
              </label>
              <textarea id="health" name="health" className={a.textarea} />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="character">
                Характер
              </label>
              <textarea id="character" name="character" className={a.textarea} />
            </div>

            <div className={a.field}>
              <label className={a.label} htmlFor="needs">
                Особые потребности
              </label>
              <textarea id="needs" name="needs" className={a.textarea} />
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