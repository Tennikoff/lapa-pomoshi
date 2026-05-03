"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import overlay from "../../@modal/modalOverlay.module.css";
import a from "./animalNew.module.css";
import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { animalsApi } from "@/src/lib/api/animals";
import { ApiError } from "@/src/lib/api/http";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

function isTooLarge(file: File) {
  return file.size > MAX_PHOTO_BYTES;
}

export default function NewAnimalPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // чтобы не копились objectURL
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onPickPhoto = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    // ✅ мгновенная проверка размера (чтобы не ловить ApiError)
    if (isTooLarge(file)) {
      // оставим превью, но файл не принимаем
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return objectUrl;
      });

      setPhotoFile(null);
      setPhotoError("Файл не должен превышать 5 MB. Выберите другое фото.");
      // сбрасываем input, чтобы можно было выбрать тот же файл заново после сжатия
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return objectUrl;
    });

    setPhotoFile(file);
    setPhotoError(null);
  };

  const onCancel = () => router.back();

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // ✅ если фото не подходит — не отправляем форму
    if (photoError) {
      // без alert — пользователь уже видит подсказку и крестик
      return;
    }

    const fd = new FormData(e.currentTarget);

    const name = String(fd.get("name") ?? "").trim();
    const animalType = String(fd.get("species") ?? "").trim();
    const breed = String(fd.get("breed") ?? "").trim();
    const ageRaw = String(fd.get("age") ?? "").trim();
    const health = String(fd.get("health") ?? "").trim();
    const character = String(fd.get("character") ?? "").trim();
    const needs = String(fd.get("needs") ?? "").trim();

    if (!animalType) return alert("Выберите вид животного");

    const safeName = name || "Без имени";
    const age = ageRaw ? ageRaw : null;

    setSubmitting(true);

    try {
      const me = await fetchCurrentProfile();
      if (!me) {
        alert("Нужно войти в аккаунт, чтобы создать карточку животного");
        router.push("/login");
        return;
      }

      const dto = {
        animalType,
        name: safeName,
        breed: breed || null,
        age,
        health: health || null,
        character: character || null,
        specialNeeds: needs || null,
      };

      const created = photoFile
        ? await animalsApi.createWithPhoto(dto, photoFile)
        : await animalsApi.create(dto);

      router.replace(`/animals/${created.id}`);
    } catch (e2) {
      // ✅ мягкая обработка “5MB” если вдруг бэк всё равно вернул
      let msg = "Не удалось создать карточку животного";
      if (e2 instanceof ApiError) msg = e2.message;
      else if (e2 instanceof Error) msg = e2.message;

      if (msg.toLowerCase().includes("5 mb") || msg.toLowerCase().includes("5mb")) {
        setPhotoError("Файл не должен превышать 5 MB. Выберите другое фото.");
        // показать крестик (превью уже есть), файл сбрасываем
        setPhotoFile(null);
        return;
      }

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