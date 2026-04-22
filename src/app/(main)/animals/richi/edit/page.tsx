"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import a from "../../../animals/new/animalNew.module.css";

const RITCHI_PHOTO_URL =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600";

export default function EditRichiAnimalCardPage() {
  const router = useRouter();

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(RITCHI_PHOTO_URL);

  const onPickPhoto = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const onCancel = () => {
    router.back();
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const species = String(fd.get("species") ?? "").trim();

    if (!species) {
      alert("Выберите вид животного");
      return;
    }

    // TODO: позже подключим API сохранения
    console.log("ANIMAL CARD UPDATE (RICHI)", Object.fromEntries(fd.entries()));
    alert("Карточка животного сохранена (пока mock)");
    router.push("/animals/richi");
  };

  return (
    <div className={a.page}>
      <form className={a.formCard} onSubmit={onSubmit}>
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
              <img className={a.photoPreview} src={previewUrl} alt="Превью фото" />
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
            defaultValue="Ричи"
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
            defaultValue="Собака"
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
            defaultValue="Лабрадор"
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
            defaultValue="1 год"
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
            defaultValue="Найден на улице в возрасте 2 месяцев. Был истощён, сейчас чувствует себя отлично."
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
            defaultValue="Здоров, привит, обработан от паразитов"
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
            defaultValue="Дружелюбный, активный, любит детей"
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
            defaultValue="Нуждается в длительных прогулках"
          />
        </div>

        <div className={a.actions}>
          <button type="button" className={a.btn} onClick={onCancel}>
            ОТМЕНИТЬ
          </button>
          <button type="submit" className={a.btn}>
            СОХРАНИТЬ
          </button>
        </div>
      </form>
    </div>
  );
}