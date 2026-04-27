"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import s from "./fosterNew.module.css";

import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { listAnimals } from "@/src/lib/storage/animals";
import type { Animal } from "@/src/types/animal";

import { DISTRICTS, CITY_DEFAULT } from "@/src/lib/constants/volunteerOptions";
import { getVolunteerExtra } from "@/src/lib/storage/volunteerExtra";
import { getOrgExtra } from "@/src/lib/storage/orgExtra";

import { createTask } from "@/src/lib/storage/tasks";

const CAL_ICON = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

function isoFromDateInput(v: string): string | null {
  const x = v.trim();
  if (!x) return null;
  // input[type=date] => YYYY-MM-DD
  const d = new Date(x);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function petTitle(a: Animal) {
  const name = a.name?.trim();
  return name ? name : a.species;
}

export default function FosterTaskNewPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<number | null>(null);
  const [city, setCity] = useState<string>(CITY_DEFAULT);

  const [pets, setPets] = useState<Animal[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const [animalId, setAnimalId] = useState<string | null>(null);

  const selectedAnimal = useMemo(() => {
    if (!animalId) return null;
    return pets.find((p) => p.id === animalId) ?? null;
  }, [animalId, pets]);

  // form fields
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState("");     // YYYY-MM-DD
  const [district, setDistrict] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const me = await fetchCurrentProfile();
        if (!me) {
          router.replace("/login");
          return;
        }
        setUserId(me.userId);
        setRole(me.role);

        // city из extra (если заполнено)
        if (me.role === 2) {
          const extra = getOrgExtra(me.userId);
          setCity(extra?.city || CITY_DEFAULT);
        } else {
          const extra = getVolunteerExtra(me.userId);
          setCity(extra?.city || CITY_DEFAULT);
        }

        // реальные животные из профиля (localStorage)
        setPets(listAnimals(me.userId));
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // автозаголовок “Передержка <имя>”
  useEffect(() => {
    if (!selectedAnimal) return;
    if (title.trim()) return;
    const name = selectedAnimal.name?.trim();
    setTitle(`Передержка ${name ? name : selectedAnimal.species}`);
  }, [selectedAnimal, title]);

  const onPickFromMyPets = () => {
    setSelectorOpen(true);
  };

  const onSelectPet = (id: string) => {
    setAnimalId(id);
    setSelectorOpen(false);
  };

  const onRemoveSelected = () => {
    setAnimalId(null);
    // возвращаем этап с кнопками
    setSelectorOpen(false);
  };

  const onCancel = () => router.back();

  const onSave = () => {
    if (!userId || !role) return;

    // Передержка: животное ОБЯЗАТЕЛЬНО
    if (!animalId) {
      alert("Для задачи передержки необходимо выбрать животное");
      return;
    }
    if (!title.trim()) {
      alert('Заполните заголовок задачи');
      return;
    }
    const startAt = isoFromDateInput(startDate);
    const endAt = isoFromDateInput(endDate);
    if (!startAt) {
      alert("Укажите дату начала");
      return;
    }
    if (!endAt) {
      alert("Укажите дату окончания");
      return;
    }
    if (!district.trim()) {
      alert("Выберите район");
      return;
    }

    createTask({
      creatorUserId: userId,
      kind: "foster",
      title: title.trim(),
      description: desc.trim(),
      competencies: [], // для передержки в MVP оставляем пусто
      city,
      district,
      startAt,
      endAt,
      animalId,
    });

    router.push("/tasks");
  };

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.container} style={{ color: "#6c757d" }}>
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <main className={s.container}>
        <h1 className={s.title}>Создание задачи</h1>

        {/* 1) Животное */}
        <div className={s.formGroup}>
          <span className={s.label}>Животное</span>

          {/* Этап 1: кнопки */}
          {!selectedAnimal ? (
            <div className={s.animalButtons}>
              <button className={s.btnLavender} type="button" onClick={onPickFromMyPets}>
                Выбрать из моих животных
              </button>
              <button
                className={s.btnLavender}
                type="button"
                onClick={() => router.push("/animals/new")}
              >
                Создать новую карточку
              </button>
            </div>
          ) : null}

          {/* Этап 2: селектор животных (реальные карточки из профиля) */}
          {!selectedAnimal && selectorOpen ? (
            <div className={s.selector}>
              {pets.length === 0 ? (
                <div className={s.muted}>
                  У вас нет добавленных животных. Создайте карточку животного в профиле.
                </div>
              ) : (
                pets.map((p) => (
                  <div key={p.id} className={s.petCard} onClick={() => onSelectPet(p.id)}>
                    <img
                      src={
                        p.photoUrl ||
                        "https://placehold.co/120x120/eef3f8/777?text=Фото"
                      }
                      alt={petTitle(p)}
                    />
                    <span className={s.petName}>{petTitle(p)}</span>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {/* Этап 3: выбранное животное (как в профиле) */}
          {selectedAnimal ? (
            <div className={s.selectedWrap} style={{ marginTop: 16 }}>
              <img
                className={s.selectedImg}
                src={
                  selectedAnimal.photoUrl ||
                  "https://placehold.co/140x140/eef3f8/777?text=Фото"
                }
                alt={petTitle(selectedAnimal)}
              />
              <button className={s.trashBtn} type="button" onClick={onRemoveSelected} aria-label="Убрать животное">
                <svg
                  className={s.trashIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M6 6l1 16h10l1-16" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
              <span className={s.selectedName}>{petTitle(selectedAnimal)}</span>
            </div>
          ) : null}
        </div>

        {/* 2) Заголовок */}
        <div className={s.formGroup}>
          <label className={s.label}>Заголовок задачи</label>
          <input className={s.input} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        {/* 3) Описание */}
        <div className={s.formGroup}>
          <label className={s.label}>Описание</label>
          <input className={s.input} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>

        {/* 4) Период */}
        <div className={s.formGroup}>
          <label className={s.label}>Период передержки</label>
          <div className={s.dateInputs}>
            <div className={s.dateRow}>
              {CAL_ICON}
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Дата начала"
              />
            </div>
            <div className={s.dateRow}>
              {CAL_ICON}
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Дата окончания"
              />
            </div>
          </div>
        </div>

        {/* 5) Локация */}
        <div className={s.formGroup}>
          <label className={s.label}>Локация</label>
          <div className={s.tags}>
            {(DISTRICTS as unknown as string[]).map((d) => (
              <button
                key={d}
                type="button"
                className={`${s.tagBtn} ${district === d ? s.tagBtnActive : ""}`}
                onClick={() => setDistrict(d)}
              >
                {d}
              </button>
            ))}
          </div>
          <div className={s.muted} style={{ marginTop: 10 }}>
            Город: {city}
          </div>
        </div>

        {/* 6) Кнопки */}
        <div className={s.actions}>
          <button className={s.btnAction} type="button" onClick={onCancel}>
            Отменить
          </button>
          <button className={s.btnAction} type="button" onClick={onSave}>
            Сохранить
          </button>
        </div>
      </main>
    </div>
  );
}