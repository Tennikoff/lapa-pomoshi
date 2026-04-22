"use client";

import { useRouter } from "next/navigation";
import overlay from "../../modalOverlay.module.css";
import a from "../../../animals/new/animalNew.module.css";

export default function NewAnimalModalPage() {
  const router = useRouter();

  const onClose = () => router.back();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const species = String(fd.get("species") ?? "").trim();

    if (!species) {
      alert("Выберите вид животного");
      return;
    }

    alert("Карточка животного успешно создана (пока mock)");
    router.back();
  };

  return (
    <div className={overlay.overlay} role="dialog" aria-modal="true">
      <form className={a.formCard} onSubmit={onSubmit}>
        <h1 className={a.title}>Создание карточки животного</h1>

        <div className={a.field}>
          <label className={a.label}>Фото</label>

          <label className={a.photoUpload} style={{ width: 120, height: 120 }}>
            <div className={a.photoPlaceholder}>
              <div className={a.plus}>+</div>
              <div className={a.photoText}>
                Загрузить<br />фото
              </div>
            </div>
            <input type="file" accept="image/*" className={a.fileInput} />
          </label>
        </div>

        <div className={a.field}>
          <label className={a.label} htmlFor="name">Имя (если есть)</label>
          <input id="name" name="name" type="text" className={a.input} />
        </div>

        <div className={a.field}>
          <label className={a.label} htmlFor="species">Вид животного*</label>
          <input id="species" name="species" type="text" className={a.input} />
        </div>

        <div className={a.field}>
          <label className={a.label} htmlFor="breed">Порода</label>
          <input id="breed" name="breed" type="text" className={a.input} />
        </div>

        <div className={a.field}>
          <label className={a.label} htmlFor="age">Возраст</label>
          <input id="age" name="age" type="text" className={a.input} />
        </div>

        <div className={a.field}>
          <label className={a.label} htmlFor="history">История</label>
          <textarea id="history" name="history" className={a.textarea} />
        </div>

        <div className={a.field}>
          <label className={a.label} htmlFor="health">Состояние здоровья</label>
          <textarea id="health" name="health" className={a.textarea} />
        </div>

        <div className={a.field}>
          <label className={a.label} htmlFor="character">Характер</label>
          <textarea id="character" name="character" className={a.textarea} />
        </div>

        <div className={a.field}>
          <label className={a.label} htmlFor="needs">Особые потребности</label>
          <textarea id="needs" name="needs" className={a.textarea} />
        </div>

        <div className={a.actions}>
          <button type="button" className={a.btn} onClick={onClose}>
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