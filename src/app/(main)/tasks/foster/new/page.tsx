"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";

import overlay from "../../../@modal/modalOverlay.module.css";
import f from "./fosterNew.module.css";

import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { CITY_DEFAULT, DISTRICTS } from "@/src/lib/constants/volunteerOptions";
import { listAnimals } from "@/src/lib/storage/animals";
import type { Animal } from "@/src/types/animal";
import { createTask } from "@/src/lib/storage/tasks";

function toIsoDateStart(value: string): string | null {
  // value: "YYYY-MM-DD"
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function FosterNewPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);

  const [title, setTitle] = useState("Запрос передержки");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState("");   // YYYY-MM-DD
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
        const myAnimals = listAnimals(me.userId);
        setAnimals(myAnimals);
        // по желанию можно авто-выбрать первого
        if (myAnimals[0]) setSelectedAnimalId(myAnimals[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const selectedAnimal = useMemo(
    () => animals.find((a) => a.id === selectedAnimalId) ?? null,
    [animals, selectedAnimalId]
  );

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el) return;
    // showPicker работает не везде, поэтому fallback на focus()
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  };

  const onCancel = () => router.back();

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const me = await fetchCurrentProfile();
    if (!me) {
      router.replace("/login");
      return;
    }

    if (!selectedAnimalId) {
      alert("Выберите животное");
      return;
    }
    if (!title.trim()) {
      alert("Заполните заголовок задачи");
      return;
    }
    if (!description.trim()) {
      alert("Заполните описание");
      return;
    }
    if (!startDate || !endDate) {
      alert("Укажите Дату начала и Дату окончания");
      return;
    }
    if (!district) {
      alert("Выберите район");
      return;
    }

    const startAt = toIsoDateStart(startDate);
    const endAt = toIsoDateStart(endDate);
    if (!startAt || !endAt) {
      alert("Некорректная дата");
      return;
    }

    createTask({
      creatorUserId: me.userId,
      kind: "foster",
      title: title.trim(),
      description: description.trim(),
      competencies: [], // пока пусто
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
          <div className={overlay.scrollBox} style={{ color: "#fff" }}>
            Загрузка...
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
          <form className={f.formCard} onSubmit={onSubmit}>
            <button className={f.closeBtn} type="button" onClick={onCancel} aria-label="Закрыть">
              ×
            </button>

            <h1 className={f.title}>Запрос передержки</h1>

            {/* ===== ЖИВОТНОЕ ===== */}
            <section className={f.section}>
              <h2 className={f.sectionTitle}>Животное</h2>

              {animals.length === 0 ? (
                <div className={f.emptyNote}>
                  У вас нет карточек животных. Сначала создайте карточку животного в профиле.
                </div>
              ) : (
                <div className={f.animalsScroller}>
                  <div className={f.animalsRow}>
                    {animals.map((a) => {
                      const active = a.id === selectedAnimalId;
                      const bg = a.photoUrl ? `url(${a.photoUrl})` : undefined;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          className={`${f.animalCard} ${active ? f.animalCardActive : ""}`}
                          onClick={() => setSelectedAnimalId(a.id)}
                          style={
                            bg
                              ? {
                                  backgroundImage: bg,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }
                              : undefined
                          }
                          aria-pressed={active}
                          title={a.name?.trim() ? a.name : a.species}
                        >
                          <span className={f.animalCardLabel}>
                            {a.name?.trim() ? a.name : a.species}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedAnimal ? (
                <p className={f.selectedMeta}>
                  Выбрано: {selectedAnimal.name?.trim() ? selectedAnimal.name : "Без имени"} (
                  {selectedAnimal.species}
                  {selectedAnimal.breed ? `, ${selectedAnimal.breed}` : ""})
                </p>
              ) : null}
            </section>

            {/* ===== Заголовок ===== */}
            <section className={f.section}>
              <h2 className={f.sectionTitle}>Заголовок задачи</h2>
              <input
                className={f.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Передержка на время отпуска"
              />
            </section>

            {/* ===== Описание ===== */}
            <section className={f.section}>
              <h2 className={f.sectionTitle}>Описание</h2>
              <textarea
                className={f.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите условия, кормление, прогулки и т.д."
              />
            </section>

            {/* ===== Период ===== */}
            <section className={f.section}>
              <h2 className={f.sectionTitle}>Период передержки</h2>

              <div className={f.dateGrid}>
                <div className={f.dateField}>
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

                <div className={f.dateField}>
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

            {/* ===== Локация ===== */}
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

            {/* ===== Actions ===== */}
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