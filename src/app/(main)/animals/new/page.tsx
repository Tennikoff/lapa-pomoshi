"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import s from "./animalNew.module.css";

export default function NewAnimalCardPage() {
  const router = useRouter();

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onPickPhoto = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const onCancel = () => {
    router.back(); // или router.push("/profile")
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // пока без API — просто проверим required на "Вид"
    const fd = new FormData(e.currentTarget);
    const species = String(fd.get("species") ?? "").trim();

    if (!species) {
      alert('Выберите вид животного');
      return;
    }

    // TODO: позже подключим API создания карточки животного
    console.log("ANIMAL CARD CREATE", Object.fromEntries(fd.entries()));
    alert("Карточка животного успешно создана (пока mock)");
    router.push("/profile");
  };

  return (
    <div className={s.page}>
      <form className={s.formCard} onSubmit={onSubmit}>
        <h1 className={s.title}>Создание карточки животного</h1>

        <div className={s.field}>
          <label className={s.label}>Фото</label>

          <div className={s.photoRow}>
            <button
              type="button"
              className={s.photoUpload}
              onClick={onPickPhoto}
              aria-label="Загрузить фото"
            >
              {previewUrl ? (
                <img className={s.photoPreview} src={previewUrl} alt="Превью фото" />
              ) : (
                <div className={s.photoPlaceholder}>
                  <div className={s.plus}>+</div>
                  <div className={s.photoText}>
                    Загрузить<br />фото
                  </div>
                </div>
              )}
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className={s.fileInput}
              onChange={onFileChange}
            />
          </div>
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="name">
            Имя (если есть)
          </label>
          <input id="name" name="name" type="text" className={s.input} />
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="species">
            Вид животного*
          </label>
          <input id="species" name="species" type="text" className={s.input} />
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="breed">
            Порода
          </label>
          <input id="breed" name="breed" type="text" className={s.input} />
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="age">
            Возраст
          </label>
          <input id="age" name="age" type="text" className={s.input} />
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="history">
            История
          </label>
          <textarea id="history" name="history" className={s.textarea} />
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="health">
            Состояние здоровья
          </label>
          <textarea id="health" name="health" className={s.textarea} />
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="character">
            Характер
          </label>
          <textarea id="character" name="character" className={s.textarea} />
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="needs">
            Особые потребности
          </label>
          <textarea id="needs" name="needs" className={s.textarea} />
        </div>

        <div className={s.actions}>
          <button type="button" className={s.btn} onClick={onCancel}>
            ОТМЕНИТЬ
          </button>
          <button type="submit" className={s.btn}>
            СОХРАНИТЬ
          </button>
        </div>
      </form>
    </div>
  );
}