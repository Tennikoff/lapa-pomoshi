// src/app/(main)/tasks/new/page.tsx
"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock } from "lucide-react";

import overlay from "@/src/app/(main)/@modal/modalOverlay.module.css";
import f from "@/src/app/(main)/tasks/foster/new/fosterNew.module.css";
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

function toIsoDateTime(date: string, time: string): string | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function TaskNewPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState(false);

  // dictionaries
  const [locationsDict, setLocationsDict] = useState<DictionaryItemDto[]>([]);
  const [competenciesDict, setCompetenciesDict] = useState<DictionaryItemDto[]>([]);

  // animals list
  const [animals, setAnimals] = useState<AnimalListItemDto[]>([]);
  const [animalsOpen, setAnimalsOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [selectedAnimalFull, setSelectedAnimalFull] = useState<AnimalDto | null>(null);

  // create animal screen
  const [createAnimalOpen, setCreateAnimalOpen] = useState(false);

  const animalFileRef = useRef<HTMLInputElement | null>(null);
  const [animalPreviewUrl, setAnimalPreviewUrl] = useState<string | null>(null);
  const [animalPhotoFile, setAnimalPhotoFile] = useState<File | null>(null);
  const [animalPhotoError, setAnimalPhotoError] = useState<string | null>(null);

  const [anName, setAnName] = useState("");
  const [anType, setAnType] = useState(""); // animalType (ед. число)
  const [anBreed, setAnBreed] = useState("");
  const [anAge, setAnAge] = useState("");
  const [anHistory, setAnHistory] = useState(""); // ✅ теперь сохраняем через bridge в specialNeeds
  const [anHealth, setAnHealth] = useState("");
  const [anCharacter, setAnCharacter] = useState("");
  const [anNeeds, setAnNeeds] = useState(""); // “особые потребности” (тоже внутрь specialNeeds, вместе с history)
  const [animalSubmitting, setAnimalSubmitting] = useState(false);

  // task fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // только 1 компетенция (как в UI)
  const [competency, setCompetency] = useState<string>("");

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const [district, setDistrict] = useState<string>("");
  const [volunteersNeeded, setVolunteersNeeded] = useState<number>(1);

  // refs for pickers
  const startDateRef = useRef<HTMLInputElement | null>(null);
  const startTimeRef = useRef<HTMLInputElement | null>(null);
  const endDateRef = useRef<HTMLInputElement | null>(null);
  const endTimeRef = useRef<HTMLInputElement | null>(null);

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

  // init
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
          alert("Создание задач доступно только куратору/организации");
          router.replace("/tasks");
          return;
        }

        const [locs, comps] = await Promise.all([
          dictionariesApi.locations(),
          dictionariesApi.competencies(),
        ]);

        setLocationsDict(locs);
        setCompetenciesDict(comps);

        await loadAnimals();

        // defaults
        setAnimalsOpen(false);
        setSelectedAnimalId(null);
        setSelectedAnimalFull(null);

        setTitle("");
        setDescription("");
        setCompetency("");
        setDistrict("");
        setVolunteersNeeded(1);

        setStartDate("");
        setStartTime("");
        setEndDate("");
        setEndTime("");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load full animal for selected (meta line)
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

  // cleanup preview objectURL
  useEffect(() => {
    return () => {
      if (animalPreviewUrl && animalPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(animalPreviewUrl);
      }
    };
  }, [animalPreviewUrl]);

  const onCancel = () => router.back();

  // ===== create animal inside task =====
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
      // сброс, чтобы можно было выбрать тот же файл после сжатия
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
      // ✅ bridge: история + особые потребности сохраняются в specialNeeds
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

  // ===== submit create task =====
  const onSubmitTask: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (savingTask) return;

    const me = await fetchCurrentProfile();
    if (!me) {
      router.replace("/login");
      return;
    }

    if (!isOrgRole(me.role)) {
      alert("Создание задач доступно только куратору/организации");
      return;
    }

    if (!selectedAnimalId) return alert("Выберите животное");
    if (!title.trim()) return alert("Заполните заголовок задачи");
    if (!description.trim()) return alert("Заполните описание");

    if (!startDate || !startTime || !endDate || !endTime) {
      return alert("Укажите дату и время начала/окончания");
    }

    if (!district) return alert("Выберите район");

    if (!volunteersNeeded || volunteersNeeded < 1) {
      return alert("Количество волонтёров должно быть ≥ 1");
    }

    const startedAt = toIsoDateTime(startDate, startTime);
    const endedAt = toIsoDateTime(endDate, endTime);
    if (!startedAt || !endedAt) return alert("Некорректная дата/время");

    setSavingTask(true);
    try {
      await helpTasksApi.create({
        title: title.trim(),
        description: description.trim(),
        requiredVolunteers: volunteersNeeded,
        isTaskOverexposure: false,
        startedAt,
        endedAt,
        animalIds: [selectedAnimalId],
        competencies: competency ? [competency] : [],
        locations: [district],
      });

      window.dispatchEvent(new Event(HELP_TASKS_CHANGED_EVENT));
      router.back();
    } finally {
      setSavingTask(false);
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

  // ===== create animal screen =====
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

  // ===== main create task screen =====
  return (
    <div
      className={overlay.overlay}
      role="dialog"
      aria-modal="true"
      style={{ "--modal-dim": "0.6" } as CSSProperties}
    >
      <div className={overlay.content}>
        <div className={overlay.scrollBox}>
          <form className={f.formCard} onSubmit={onSubmitTask}>
            <button className={f.closeBtn} type="button" onClick={onCancel} aria-label="Закрыть">
              ×
            </button>

            <h1 className={f.title}>Создание задачи</h1>

            {/* Animal */}
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
                    У вас нет животных в базе. Создайте карточку.
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

            {/* Title */}
            <section className={f.section}>
              <h2 className={f.sectionTitle}>Заголовок задачи</h2>
              <input
                className={f.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Поездка к ветеринару"
              />
            </section>

            {/* Description */}
            <section className={f.section}>
              <h2 className={f.sectionTitle}>Описание</h2>
              <textarea
                className={f.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите задачу..."
              />
            </section>

            {/* Competencies (single) */}
            <section className={f.section}>
              <h2 className={f.sectionTitle}>Необходимые компетенции</h2>
              <div className={f.tags}>
                {competenciesDict.map((x) => {
                  const active = competency === x.name;
                  return (
                    <button
                      key={x.id}
                      type="button"
                      className={`${f.tag} ${active ? f.tagActive : ""}`}
                      onClick={() => setCompetency((prev) => (prev === x.name ? "" : x.name))}
                    >
                      {x.name}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Time */}
            <section className={f.section}>
              <h2 className={f.sectionTitle}>Время выполнения</h2>

              <div className={f.timeGrid}>
                <div>
                  <label className={f.fieldLabel}>Дата начала</label>
                  <div className={f.dateInputWrap}>
                    <button
                      type="button"
                      className={f.dateIconBtn}
                      onClick={() => openPicker(startDateRef)}
                    >
                      <Calendar className={f.dateIcon} />
                    </button>
                    <input
                      ref={startDateRef}
                      className={f.dateInput}
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className={f.fieldLabel}>Время начала</label>
                  <div className={f.timeInputWrap}>
                    <button
                      type="button"
                      className={f.dateIconBtn}
                      onClick={() => openPicker(startTimeRef)}
                    >
                      <Clock className={f.dateIcon} />
                    </button>
                    <input
                      ref={startTimeRef}
                      className={f.timeInput}
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className={f.fieldLabel}>Дата окончания</label>
                  <div className={f.dateInputWrap}>
                    <button
                      type="button"
                      className={f.dateIconBtn}
                      onClick={() => openPicker(endDateRef)}
                    >
                      <Calendar className={f.dateIcon} />
                    </button>
                    <input
                      ref={endDateRef}
                      className={f.dateInput}
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className={f.fieldLabel}>Время окончания</label>
                  <div className={f.timeInputWrap}>
                    <button
                      type="button"
                      className={f.dateIconBtn}
                      onClick={() => openPicker(endTimeRef)}
                    >
                      <Clock className={f.dateIcon} />
                    </button>
                    <input
                      ref={endTimeRef}
                      className={f.timeInput}
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Location */}
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

            {/* Volunteers count */}
            <section className={f.section}>
              <h2 className={f.sectionTitle}>Количество волонтёров</h2>
              <input
                className={f.numberInput}
                type="number"
                min={1}
                value={volunteersNeeded}
                onChange={(e) => setVolunteersNeeded(Number(e.target.value || 1))}
              />
            </section>

            <div className={f.actions}>
              <button
                type="button"
                className={f.actionBtn}
                onClick={onCancel}
                disabled={savingTask}
              >
                ОТМЕНИТЬ
              </button>
              <button type="submit" className={f.actionBtn} disabled={savingTask}>
                {savingTask ? "..." : "СОХРАНИТЬ"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}