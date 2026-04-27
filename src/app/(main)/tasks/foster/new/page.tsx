"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";

import overlay from "../../../@modal/modalOverlay.module.css";
import f from "./fosterNew.module.css";

/* стили формы создания животного (как /animals/new) */
import a from "@/src/app/(main)/animals/new/animalNew.module.css";

import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { CITY_DEFAULT, DISTRICTS } from "@/src/lib/constants/volunteerOptions";
import {
  ANIMALS_CHANGED_EVENT,
  createAnimal,
  listAnimals,
} from "@/src/lib/storage/animals";
import type { Animal } from "@/src/types/animal";
import { createTask } from "@/src/lib/storage/tasks";
import { fileToDataUrl } from "@/src/lib/fileToDataUrl";

function toIsoDateStart(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function FosterNewPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [meUserId, setMeUserId] = useState<string | null>(null);

  // животные
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [animalsOpen, setAnimalsOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);

  // создание животного (экран)
  const [createAnimalOpen, setCreateAnimalOpen] = useState(false);
  const animalFileRef = useRef<HTMLInputElement | null>(null);
  const [animalPreviewUrl, setAnimalPreviewUrl] = useState<string | null>(null);
  const [animalPhotoDataUrl, setAnimalPhotoDataUrl] = useState<string | null>(null);

  const [anName, setAnName] = useState("");
  const [anSpecies, setAnSpecies] = useState("");
  const [anBreed, setAnBreed] = useState("");
  const [anAge, setAnAge] = useState("");
  const [anHistory, setAnHistory] = useState("");
  const [anHealth, setAnHealth] = useState("");
  const [anCharacter, setAnCharacter] = useState("");
  const [anNeeds, setAnNeeds] = useState("");
  const [animalSubmitting, setAnimalSubmitting] = useState(false);

  // поля передержки
  const [title, setTitle] = useState("Запрос передержки");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [district, setDistrict] = useState<string>("");

  const startRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetchCurrentProfile();
        if (!me) {
          router.replace("/login");
          return;
        }
        setMeUserId(me.userId);
        setAnimals(listAnimals(me.userId));

        setSelectedAnimalId(null);
        setAnimalsOpen(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!meUserId) return;
    const onChanged = () => setAnimals(listAnimals(meUserId));
    window.addEventListener(ANIMALS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(ANIMALS_CHANGED_EVENT, onChanged);
  }, [meUserId]);

  const selectedAnimal = useMemo(
    () => animals.find((x) => x.id === selectedAnimalId) ?? null,
    [animals, selectedAnimalId]
  );

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyEl = el as any;
    if (typeof anyEl.showPicker === "function") anyEl.showPicker();
    else el.focus();
  };

  const onCancel = () => router.back();

  const onSubmitFoster: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const me = await fetchCurrentProfile();
    if (!me) {
      router.replace("/login");
      return;
    }

    if (!selectedAnimalId) return alert("Выберите животное");
    if (!title.trim()) return alert("Заполните заголовок задачи");
    if (!description.trim()) return alert("Заполните описание");
    if (!startDate || !endDate) return alert("Укажите Дату начала и Дату окончания");
    if (!district) return alert("Выберите район");

    const startAt = toIsoDateStart(startDate);
    const endAt = toIsoDateStart(endDate);
    if (!startAt || !endAt) return alert("Некорректная дата");

    createTask({
      creatorUserId: me.userId,
      kind: "foster",
      title: title.trim(),
      description: description.trim(),
      competencies: [],
      city: CITY_DEFAULT,
      district,
      startAt,
      endAt,
      animalId: selectedAnimalId,
    });

    router.back();
  };

  const resetAnimalDraft = () => {
    setAnimalPreviewUrl(null);
    setAnimalPhotoDataUrl(null);
    setAnName("");
    setAnSpecies("");
    setAnBreed("");
    setAnAge("");
    setAnHistory("");
    setAnHealth("");
    setAnCharacter("");
    setAnNeeds("");
  };

  const onOpenCreateAnimal = () => {
    resetAnimalDraft();
    setCreateAnimalOpen(true); // скрываем передержку, показываем создание
  };

  const onPickAnimalPhoto = () => animalFileRef.current?.click();

  const onAnimalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setAnimalPreviewUrl(objectUrl);

    const dataUrl = await fileToDataUrl(file);
    setAnimalPhotoDataUrl(dataUrl);
  };

  const onCancelCreateAnimal = () => {
    setCreateAnimalOpen(false); // вернуть окно передержки
  };

  const onSaveAnimal = async () => {
    if (animalSubmitting) return;
    if (!meUserId) return;

    const species = anSpecies.trim();
    if (!species) return alert("Выберите вид животного");

    setAnimalSubmitting(true);
    try {
      const created = createAnimal({
        ownerUserId: meUserId,
        photoUrl: animalPhotoDataUrl,
        name: anName.trim(),
        species,
        breed: anBreed.trim(),
        age: anAge.trim(),
        history: anHistory.trim(),
        health: anHealth.trim(),
        character: anCharacter.trim(),
        needs: anNeeds.trim(),
      });

      // обновляем список/выбор и возвращаемся к передержке
      setAnimals(listAnimals(meUserId));
      setSelectedAnimalId(created.id);
      setAnimalsOpen(true);

      setCreateAnimalOpen(false);
    } finally {
      setAnimalSubmitting(false);
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

  // ====== ЭКРАН СОЗДАНИЯ ЖИВОТНОГО (вместо окна передержки) ======
  if (createAnimalOpen) {
    return (
      <div
        className={overlay.overlay}
        role="dialog"
        aria-modal="true"
        style={{ "--modal-dim": "0.6" } as CSSProperties}
      >
        <div className={overlay.content}>
          <div className={overlay.scrollBox}>
            <div className={a.formCard} style={{ margin: 0, position: "relative" }}>
              <button
                className={a.closeBtn}
                type="button"
                onClick={onCancelCreateAnimal}
                aria-label="Закрыть"
              >
                ×
              </button>

              <h1 className={a.title}>Создание карточки животного</h1>

              <div className={a.field}>
                <label className={a.label}>Фото</label>
                <div className={a.photoRow}>
                  <button
                    type="button"
                    className={a.photoUpload}
                    onClick={onPickAnimalPhoto}
                    aria-label="Загрузить фото"
                  >
                    {animalPreviewUrl ? (
                      <img className={a.photoPreview} src={animalPreviewUrl} alt="Превью фото" />
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
                    ref={animalFileRef}
                    type="file"
                    accept="image/*"
                    className={a.fileInput}
                    onChange={onAnimalFileChange}
                  />
                </div>
              </div>

              <div className={a.field}>
                <label className={a.label} htmlFor="an-name">
                  Имя (если есть)
                </label>
                <input
                  id="an-name"
                  className={a.input}
                  value={anName}
                  onChange={(e) => setAnName(e.target.value)}
                />
              </div>

              <div className={a.field}>
                <label className={a.label} htmlFor="an-species">
                  Вид животного*
                </label>
                <input
                  id="an-species"
                  className={a.input}
                  value={anSpecies}
                  onChange={(e) => setAnSpecies(e.target.value)}
                />
              </div>

              <div className={a.field}>
                <label className={a.label} htmlFor="an-breed">
                  Порода
                </label>
                <input
                  id="an-breed"
                  className={a.input}
                  value={anBreed}
                  onChange={(e) => setAnBreed(e.target.value)}
                />
              </div>

              <div className={a.field}>
                <label className={a.label} htmlFor="an-age">
                  Возраст
                </label>
                <input
                  id="an-age"
                  className={a.input}
                  value={anAge}
                  onChange={(e) => setAnAge(e.target.value)}
                />
              </div>

              <div className={a.field}>
                <label className={a.label} htmlFor="an-history">
                  История
                </label>
                <textarea
                  id="an-history"
                  className={a.textarea}
                  value={anHistory}
                  onChange={(e) => setAnHistory(e.target.value)}
                />
              </div>

              <div className={a.field}>
                <label className={a.label} htmlFor="an-health">
                  Состояние здоровья
                </label>
                <textarea
                  id="an-health"
                  className={a.textarea}
                  value={anHealth}
                  onChange={(e) => setAnHealth(e.target.value)}
                />
              </div>

              <div className={a.field}>
                <label className={a.label} htmlFor="an-character">
                  Характер
                </label>
                <textarea
                  id="an-character"
                  className={a.textarea}
                  value={anCharacter}
                  onChange={(e) => setAnCharacter(e.target.value)}
                />
              </div>

              <div className={a.field}>
                <label className={a.label} htmlFor="an-needs">
                  Особые потребности
                </label>
                <textarea
                  id="an-needs"
                  className={a.textarea}
                  value={anNeeds}
                  onChange={(e) => setAnNeeds(e.target.value)}
                />
              </div>

              <div className={a.actions}>
                <button
                  type="button"
                  className={a.btn}
                  onClick={onCancelCreateAnimal}
                  disabled={animalSubmitting}
                >
                  ОТМЕНИТЬ
                </button>

                <button
                  type="button"
                  className={a.btn}
                  onClick={onSaveAnimal}
                  disabled={animalSubmitting}
                >
                  {animalSubmitting ? "..." : "СОХРАНИТЬ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====== ЭКРАН ПЕРЕДЕРЖКИ (основной) ======
  return (
    <div
      className={overlay.overlay}
      role="dialog"
      aria-modal="true"
      style={{ "--modal-dim": "0.6" } as CSSProperties}
    >
      <div className={overlay.content}>
        <div className={overlay.scrollBox}>
          <form className={f.formCard} onSubmit={onSubmitFoster}>
            <button className={f.closeBtn} type="button" onClick={onCancel} aria-label="Закрыть">
              ×
            </button>

            <h1 className={f.title}>Запрос передержки</h1>

            {/* ЖИВОТНОЕ */}
            <section className={f.section}>
              <h2 className={f.sectionTitle}>Животное</h2>

              <div className={f.animalActions}>
                <button
                  type="button"
                  className={f.animalActionBtn}
                  onClick={() => setAnimalsOpen((v) => !v)}
                  aria-expanded={animalsOpen}
                >
                  {animalsOpen ? "Скрыть список животных" : "Выбрать из моих животных"}
                </button>

                <button type="button" className={f.animalActionBtn} onClick={onOpenCreateAnimal}>
                  Создать новую карточку
                </button>
              </div>

              {animalsOpen ? (
                animals.length === 0 ? (
                  <div className={f.emptyNote}>
                    У вас нет карточек животных. Сначала создайте карточку животного в профиле.
                  </div>
                ) : (
                  <>
                    <div className={f.animalsScroller}>
                      <div className={f.animalsRow}>
                        {animals.map((a2) => {
                          const active = a2.id === selectedAnimalId;

                          return (
                            <button
                              key={a2.id}
                              type="button"
                              className={`${f.animalCard} ${active ? f.animalCardActive : ""}`}
                              onClick={() => setSelectedAnimalId(a2.id)}
                              aria-pressed={active}
                              title={a2.name?.trim() ? a2.name : a2.species}
                            >
                              {a2.photoUrl ? (
                                <img className={f.animalImg} src={a2.photoUrl} alt="" />
                              ) : null}

                              <span className={f.animalCardLabel}>
                                {a2.name?.trim() ? a2.name : a2.species}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedAnimal ? (
                      <p className={f.selectedMeta}>
                        Выбрано:{" "}
                        {selectedAnimal.name?.trim() ? selectedAnimal.name : "Без имени"} (
                        {selectedAnimal.species}
                        {selectedAnimal.breed ? `, ${selectedAnimal.breed}` : ""})
                      </p>
                    ) : null}
                  </>
                )
              ) : null}
            </section>

            {/* Заголовок */}
            <section className={f.section}>
              <h2 className={f.sectionTitle}>Заголовок задачи</h2>
              <input
                className={f.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Передержка на время отпуска"
              />
            </section>

            {/* Описание */}
            <section className={f.section}>
              <h2 className={f.sectionTitle}>Описание</h2>
              <textarea
                className={f.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите условия, кормление, прогулки и т.д."
              />
            </section>

            {/* Период */}
            <section className={f.section}>
              <h2 className={f.sectionTitle}>Период передержки</h2>

              <div className={f.dateGrid}>
                <div>
                  <label className={f.fieldLabel}>Дата начала</label>
                  <div className={f.dateInputWrap}>
                    <button
                      type="button"
                      className={f.dateIconBtn}
                      onClick={() => openPicker(startRef)}
                      aria-label="Выбрать дату начала"
                    >
                      <Calendar className={f.dateIcon} />
                    </button>
                    <input
                      ref={startRef}
                      className={f.dateInput}
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className={f.fieldLabel}>Дата окончания</label>
                  <div className={f.dateInputWrap}>
                    <button
                      type="button"
                      className={f.dateIconBtn}
                      onClick={() => openPicker(endRef)}
                      aria-label="Выбрать дату окончания"
                    >
                      <Calendar className={f.dateIcon} />
                    </button>
                    <input
                      ref={endRef}
                      className={f.dateInput}
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Локация */}
            <section className={f.section}>
              <h2 className={f.sectionTitle}>Локация</h2>
              <div className={f.tags}>
                {DISTRICTS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`${f.tag} ${district === label ? f.tagActive : ""}`}
                    onClick={() => setDistrict(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Actions */}
            <div className={f.actions}>
              <button type="button" className={f.actionBtn} onClick={onCancel}>
                ОТМЕНИТЬ
              </button>
              <button type="submit" className={f.actionBtn}>
                СОХРАНИТЬ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}