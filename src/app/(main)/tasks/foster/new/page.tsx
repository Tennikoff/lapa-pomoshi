"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";

import overlay from "@/src/app/(main)/@modal/modalOverlay.module.css";
import f from "./fosterNew.module.css";
import a from "@/src/app/(main)/animals/new/animalNew.module.css";

import { AnimalTypeSelect } from "@/src/components/ui/AnimalTypeSelect/AnimalTypeSelect";
import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { isOrgRole } from "@/src/lib/role";
import { dictionariesApi, type DictionaryItemDto } from "@/src/lib/api/dictionaries";
import {
  animalsApi,
  type AnimalDto,
  type AnimalListItemDto,
  type CreateAnimalDto,
} from "@/src/lib/api/animals";
import { helpTasksApi } from "@/src/lib/api/helpTasks";

import { packAnimalSpecialNeeds } from "@/src/lib/animalHistoryBridge";

const HELP_TASKS_CHANGED_EVENT = "lp_help_tasks_changed";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

function isTooLarge(file: File) {
  return file.size > MAX_PHOTO_BYTES;
}

function toIsoDateStart(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function FosterNewPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [locationsDict, setLocationsDict] = useState<DictionaryItemDto[]>([]);

  const [animals, setAnimals] = useState<AnimalListItemDto[]>([]);
  const [animalsOpen, setAnimalsOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [selectedAnimalFull, setSelectedAnimalFull] = useState<AnimalDto | null>(null);

  const [createAnimalOpen, setCreateAnimalOpen] = useState(false);
  const animalFileRef = useRef<HTMLInputElement | null>(null);
  const [animalPreviewUrl, setAnimalPreviewUrl] = useState<string | null>(null);
  const [animalPhotoFile, setAnimalPhotoFile] = useState<File | null>(null);
  const [animalPhotoError, setAnimalPhotoError] = useState<string | null>(null);

  const [anName, setAnName] = useState("");
  const [anType, setAnType] = useState("");
  const [anBreed, setAnBreed] = useState("");
  const [anAge, setAnAge] = useState("");
  const [anHistory, setAnHistory] = useState("");
  const [anHealth, setAnHealth] = useState("");
  const [anCharacter, setAnCharacter] = useState("");
  const [anNeeds, setAnNeeds] = useState("");
  const [animalSubmitting, setAnimalSubmitting] = useState(false);

  const [title, setTitle] = useState("Запрос передержки");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [district, setDistrict] = useState<string>("");

  const startRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLInputElement | null>(null);

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyEl = el as any;
    if (typeof anyEl.showPicker === "function") anyEl.showPicker();
    else el.focus();
  };

  const loadAnimals = async () => {
    const res = await animalsApi.my(0, 50);
    setAnimals(res.animals);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const me = await fetchCurrentProfile();
        if (!me) {
          router.replace("/login");
          return;
        }

        if (!isOrgRole(me.role)) {
          alert("Запрос передержки доступен только куратору/организации");
          router.replace("/tasks");
          return;
        }

        const locs = await dictionariesApi.locations();
        setLocationsDict(locs);

        await loadAnimals();

        setAnimalsOpen(false);
        setSelectedAnimalId(null);
        setSelectedAnimalFull(null);

        setTitle("Запрос передержки");
        setDescription("");
        setStartDate("");
        setEndDate("");
        setDistrict("");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedAnimalId) {
      setSelectedAnimalFull(null);
      return;
    }

    (async () => {
      try {
        const full = await animalsApi.getById(selectedAnimalId);
        setSelectedAnimalFull(full);
      } catch {
        setSelectedAnimalFull(null);
      }
    })();
  }, [selectedAnimalId]);

  useEffect(() => {
    return () => {
      if (animalPreviewUrl && animalPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(animalPreviewUrl);
      }
    };
  }, [animalPreviewUrl]);

  const onCancel = () => router.back();

  const resetAnimalDraft = () => {
    if (animalPreviewUrl && animalPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(animalPreviewUrl);
    }

    setAnimalPreviewUrl(null);
    setAnimalPhotoFile(null);
    setAnimalPhotoError(null);

    setAnName("");
    setAnType("");
    setAnBreed("");
    setAnAge("");
    setAnHistory("");
    setAnHealth("");
    setAnCharacter("");
    setAnNeeds("");
  };

  const onOpenCreateAnimal = () => {
    resetAnimalDraft();
    setCreateAnimalOpen(true);
  };

  const onPickAnimalPhoto = () => animalFileRef.current?.click();

  const onAnimalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setAnimalPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return objectUrl;
    });

    if (isTooLarge(file)) {
      setAnimalPhotoFile(null);
      setAnimalPhotoError("Файл не должен превышать 5 MB. Выберите другое фото.");
      e.target.value = "";
      return;
    }

    setAnimalPhotoFile(file);
    setAnimalPhotoError(null);
  };

  const onCancelCreateAnimal = () => setCreateAnimalOpen(false);

  const onSaveAnimal = async () => {
    if (animalSubmitting) return;

    const animalType = anType.trim();
    const name = anName.trim();

    if (!animalType) return alert("Выберите тип животного");
    if (!name) return alert("Укажите имя животного");
    if (animalPhotoError) return alert(animalPhotoError);

    setAnimalSubmitting(true);
    try {
      const packedSpecialNeeds = packAnimalSpecialNeeds({
        history: anHistory,
        specialNeeds: anNeeds,
      });

      const dto: CreateAnimalDto = {
        animalType,
        name,
        breed: anBreed.trim() || null,
        age: anAge.trim() || null,
        health: anHealth.trim() || null,
        character: anCharacter.trim() || null,
        specialNeeds: packedSpecialNeeds,
      };

      const created = animalPhotoFile
        ? await animalsApi.createWithPhoto(dto, animalPhotoFile)
        : await animalsApi.create(dto);

      await loadAnimals();
      setSelectedAnimalId(created.id);
      setAnimalsOpen(true);
      setCreateAnimalOpen(false);
    } finally {
      setAnimalSubmitting(false);
    }
  };

  const onSubmitFoster: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (saving) return;

    const me = await fetchCurrentProfile();
    if (!me) {
      router.replace("/login");
      return;
    }

    if (!isOrgRole(me.role)) {
      alert("Запрос передержки доступен только куратору/организации");
      return;
    }

    if (!selectedAnimalId) return alert("Выберите животное");
    if (!title.trim()) return alert("Заполните заголовок");
    if (!description.trim()) return alert("Заполните описание");
    if (!startDate || !endDate) return alert("Укажите дату начала и дату окончания");
    if (!district) return alert("Выберите район");

    const startedAt = toIsoDateStart(startDate);
    const endedAt = toIsoDateStart(endDate);
    if (!startedAt || !endedAt) return alert("Некорректная дата");

    setSaving(true);
    try {
      await helpTasksApi.create({
        title: title.trim(),
        description: description.trim(),
        requiredVolunteers: 1,
        isTaskOverexposure: true,
        startedAt,
        endedAt,
        animalIds: [selectedAnimalId],
        competencies: [],
        locations: [district],
      });

      window.dispatchEvent(new Event(HELP_TASKS_CHANGED_EVENT));
      router.back();
    } finally {
      setSaving(false);
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
          <div className={overlay.scrollBox} />
        </div>
      </div>
    );
  }

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

                {animalPhotoError ? <p className={a.photoWarning}>{animalPhotoError}</p> : null}
              </div>

              <div className={a.field}>
                <label className={a.label} htmlFor="an-name">
                  Имя*
                </label>
                <input
                  id="an-name"
                  className={a.input}
                  value={anName}
                  onChange={(e) => setAnName(e.target.value)}
                />
              </div>

              <div className={a.field}>
                <label className={a.label}>Тип животного*</label>
                <AnimalTypeSelect
                  name="anType"
                  value={anType}
                  onChange={setAnType}
                  placeholder="Выберите вид животного"
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
                  <div className={f.emptyNote}>У вас нет животных в базе. Создайте карточку.</div>
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
                              title={a2.name}
                            >
                              {a2.photoUrl ? (
                                <img className={f.animalImg} src={a2.photoUrl} alt="" />
                              ) : null}
                              <span className={f.animalCardLabel}>{a2.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedAnimalFull ? (
                      <p className={f.selectedMeta}>
                        Выбрано: {selectedAnimalFull.name} ({selectedAnimalFull.animalType}
                        {selectedAnimalFull.breed ? `, ${selectedAnimalFull.breed}` : ""})
                      </p>
                    ) : null}
                  </>
                )
              ) : null}
            </section>

            <section className={f.section}>
              <h2 className={f.sectionTitle}>Заголовок задачи</h2>
              <input
                className={f.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Передержка на время отпуска"
              />
            </section>

            <section className={f.section}>
              <h2 className={f.sectionTitle}>Описание</h2>
              <textarea
                className={f.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите условия, кормление, прогулки..."
              />
            </section>

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

            <section className={f.section}>
              <h2 className={f.sectionTitle}>Локация</h2>
              <div className={f.tags}>
                {locationsDict.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    className={`${f.tag} ${district === x.name ? f.tagActive : ""}`}
                    onClick={() => setDistrict(x.name)}
                  >
                    {x.name}
                  </button>
                ))}
              </div>
            </section>

            <div className={f.actions}>
              <button type="button" className={f.actionBtn} onClick={onCancel} disabled={saving}>
                ОТМЕНИТЬ
              </button>
              <button type="submit" className={f.actionBtn} disabled={saving}>
                {saving ? "..." : "СОХРАНИТЬ"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}