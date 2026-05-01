"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Clock } from "lucide-react";

import overlay from "@/src/app/(main)/@modal/modalOverlay.module.css";
import f from "@/src/app/(main)/tasks/foster/new/fosterNew.module.css";
import a from "@/src/app/(main)/animals/new/animalNew.module.css";

import { ConfirmDeleteDialog } from "@/src/components/modals/ConfirmDeleteDialog";

import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { CITY_DEFAULT, COMPETENCIES, DISTRICTS } from "@/src/lib/constants/volunteerOptions";

import {
  ANIMALS_CHANGED_EVENT,
  createAnimal,
  listAnimals,
} from "@/src/lib/storage/animals";

import { deleteTask, getTask, updateTask } from "@/src/lib/storage/tasks";
import { fileToDataUrl } from "@/src/lib/fileToDataUrl";

import type { Animal } from "@/src/types/animal";
import type { Task } from "@/src/types/task";

function toIsoDateStart(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toIsoDateTime(date: string, time: string): string | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function isoToInputDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoToInputTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function TaskEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params.id || "");

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);

  // delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);

  // животные
  const [meUserId, setMeUserId] = useState<string | null>(null);
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

  // общие поля (и для foster, и для task)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState<string>("");

  // foster: даты (date-only)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const fosterStartRef = useRef<HTMLInputElement | null>(null);
  const fosterEndRef = useRef<HTMLInputElement | null>(null);

  // task: даты+время
  // ✅ ТОЛЬКО 1 компетенция
  const [competency, setCompetency] = useState<string>("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const taskStartDateRef = useRef<HTMLInputElement | null>(null);
  const taskStartTimeRef = useRef<HTMLInputElement | null>(null);
  const taskEndDateRef = useRef<HTMLInputElement | null>(null);
  const taskEndTimeRef = useRef<HTMLInputElement | null>(null);

  const selectedAnimal = useMemo(
    () => animals.find((x) => x.id === selectedAnimalId) ?? null,
    [animals, selectedAnimalId]
  );

  useEffect(() => {
    (async () => {
      try {
        const me = await fetchCurrentProfile();
        if (!me) {
          router.replace("/login");
          return;
        }

        setMeUserId(me.userId);

        const t = getTask(id);
        if (!t) {
          alert("Задача не найдена");
          router.replace("/tasks");
          return;
        }

        // редактирование только автору
        if (t.creatorUserId !== me.userId) {
          alert("Нет доступа к редактированию этой задачи");
          router.replace("/tasks");
          return;
        }

        setTask(t);

        // животные
        const list = listAnimals(me.userId);
        setAnimals(list);
        setAnimalsOpen(true);
        setSelectedAnimalId(t.animalId ?? null);

        // общие поля
        setTitle(t.title ?? "");
        setDescription(t.description ?? "");
        setDistrict(t.district ?? "");

        if (t.kind === "foster") {
          setStartDate(isoToInputDate(t.startAt));
          setEndDate(isoToInputDate(t.endAt));
        } else {
          setCompetency(t.competencies && t.competencies[0] ? t.competencies[0] : "");
          setStartDate(isoToInputDate(t.startAt));
          setStartTime(isoToInputTime(t.startAt));
          setEndDate(isoToInputDate(t.endAt));
          setEndTime(isoToInputTime(t.endAt));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  useEffect(() => {
    if (!meUserId) return;
    const onChanged = () => setAnimals(listAnimals(meUserId));
    window.addEventListener(ANIMALS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(ANIMALS_CHANGED_EVENT, onChanged);
  }, [meUserId]);

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyEl = el as any;
    if (typeof anyEl.showPicker === "function") anyEl.showPicker();
    else el.focus();
  };

  const onCancel = () => router.back();

  // ===== создание животного внутри редактирования =====
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
    setCreateAnimalOpen(true);
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

  const onCancelCreateAnimal = () => setCreateAnimalOpen(false);

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

      setAnimals(listAnimals(meUserId));
      setSelectedAnimalId(created.id);
      setAnimalsOpen(true);
      setCreateAnimalOpen(false);
    } finally {
      setAnimalSubmitting(false);
    }
  };

  // ===== delete flow (сначала закрыть окно, потом удалить) =====
  const onAskDelete = () => setDeleteOpen(true);
  const onCancelDelete = () => setDeleteOpen(false);
  const onConfirmDelete = () => {
    setDeleteOpen(false);
    router.back();
    window.setTimeout(() => {
      deleteTask(id);
    }, 0);
  };

  // ===== submit (update) =====
  const onSubmitEdit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const me = await fetchCurrentProfile();
    if (!me) {
      router.replace("/login");
      return;
    }

    const t = getTask(id);
    if (!t) return;

    if (!selectedAnimalId) return alert("Выберите животное");
    if (!title.trim()) return alert("Заполните заголовок");
    if (!description.trim()) return alert("Заполните описание");
    if (!district) return alert("Выберите район");

    if (t.kind === "foster") {
      if (!startDate || !endDate) return alert("Укажите Дату начала и Дату окончания");

      const startAt = toIsoDateStart(startDate);
      const endAt = toIsoDateStart(endDate);
      if (!startAt || !endAt) return alert("Некорректная дата");

      updateTask(id, {
        title: title.trim(),
        description: description.trim(),
        city: CITY_DEFAULT,
        district,
        startAt,
        endAt,
        animalId: selectedAnimalId,
      });

      router.back();
      return;
    }

    // task
    if (!startDate || !startTime || !endDate || !endTime) {
      return alert("Укажите дату и время начала/окончания");
    }

    const startAt = toIsoDateTime(startDate, startTime);
    const endAt = toIsoDateTime(endDate, endTime);
    if (!startAt || !endAt) return alert("Некорректная дата/время");

    updateTask(id, {
      title: title.trim(),
      description: description.trim(),
      competencies: competency ? [competency] : [],
      city: CITY_DEFAULT,
      district,
      startAt,
      endAt,
      animalId: selectedAnimalId,
    });

    router.back();
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

  if (!task) return null;

  // ===== экран создания животного =====
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

  // ===== основной экран редактирования (foster/task) =====
  return (
    <>
      <div
        className={overlay.overlay}
        role="dialog"
        aria-modal="true"
        style={{ "--modal-dim": "0.6" } as CSSProperties}
      >
        <div className={overlay.content}>
          <div className={overlay.scrollBox}>
            <form className={f.formCard} onSubmit={onSubmitEdit}>
              <button className={f.closeBtn} type="button" onClick={onCancel} aria-label="Закрыть">
                ×
              </button>

              <h1 className={f.title}>{task.kind === "foster" ? "Запрос передержки" : "Создание задачи"}</h1>

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
                                {a2.photoUrl ? <img className={f.animalImg} src={a2.photoUrl} alt="" /> : null}
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
                          Выбрано: {selectedAnimal.name?.trim() ? selectedAnimal.name : "Без имени"} (
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
                  placeholder="Например: Поездка к ветеринару"
                />
              </section>

              {/* Описание */}
              <section className={f.section}>
                <h2 className={f.sectionTitle}>Описание</h2>
                <textarea
                  className={f.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите задачу..."
                />
              </section>

              {/* TASK ONLY: компетенции + дата/время */}
              {task.kind === "task" ? (
                <>
                  <section className={f.section}>
                    <h2 className={f.sectionTitle}>Необходимые компетенции</h2>
                    <div className={f.tags}>
                      {COMPETENCIES.map((label) => {
                        const active = competency === label;

                        return (
                          <button
                            key={label}
                            type="button"
                            className={`${f.tag} ${active ? f.tagActive : ""}`}
                            onClick={() => setCompetency((prev) => (prev === label ? "" : label))}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className={f.section}>
                    <h2 className={f.sectionTitle}>Время выполнения</h2>

                    <div className={f.timeGrid}>
                      <div>
                        <label className={f.fieldLabel}>Дата начала</label>
                        <div className={f.dateInputWrap}>
                          <button
                            type="button"
                            className={f.dateIconBtn}
                            onClick={() => openPicker(taskStartDateRef)}
                            aria-label="Выбрать дату начала"
                          >
                            <Calendar className={f.dateIcon} />
                          </button>
                          <input
                            ref={taskStartDateRef}
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
                            onClick={() => openPicker(taskStartTimeRef)}
                            aria-label="Выбрать время начала"
                          >
                            <Clock className={f.dateIcon} />
                          </button>
                          <input
                            ref={taskStartTimeRef}
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
                            onClick={() => openPicker(taskEndDateRef)}
                            aria-label="Выбрать дату окончания"
                          >
                            <Calendar className={f.dateIcon} />
                          </button>
                          <input
                            ref={taskEndDateRef}
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
                            onClick={() => openPicker(taskEndTimeRef)}
                            aria-label="Выбрать время окончания"
                          >
                            <Clock className={f.dateIcon} />
                          </button>
                          <input
                            ref={taskEndTimeRef}
                            className={f.timeInput}
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                /* FOSTER ONLY: период (date-only) */
                <section className={f.section}>
                  <h2 className={f.sectionTitle}>Период передержки</h2>

                  <div className={f.dateGrid}>
                    <div>
                      <label className={f.fieldLabel}>Дата начала</label>
                      <div className={f.dateInputWrap}>
                        <button
                          type="button"
                          className={f.dateIconBtn}
                          onClick={() => openPicker(fosterStartRef)}
                          aria-label="Выбрать дату начала"
                        >
                          <Calendar className={f.dateIcon} />
                        </button>
                        <input
                          ref={fosterStartRef}
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
                          onClick={() => openPicker(fosterEndRef)}
                          aria-label="Выбрать дату окончания"
                        >
                          <Calendar className={f.dateIcon} />
                        </button>
                        <input
                          ref={fosterEndRef}
                          className={f.dateInput}
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              )}

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

              {/* Delete row — как в редактировании передержки */}
              <div className={f.deleteRow}>
                <button type="button" className={f.actionBtn} onClick={onAskDelete}>
                  УДАЛИТЬ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onCancel={onCancelDelete}
        onConfirm={onConfirmDelete}
        question={task.kind === "foster" ? "Вы уверены, что хотите удалить запрос?" : "Вы уверены, что хотите удалить задачу?"}
      />
    </>
  );
}