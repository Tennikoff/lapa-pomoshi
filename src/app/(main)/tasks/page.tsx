"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import s from "./tasks.module.css";

import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { COMPETENCIES, DISTRICTS, PREF_ANIMALS } from "@/src/lib/constants/volunteerOptions";

import type { ProfileDto } from "@/src/types/profile";
import type { Task } from "@/src/types/task";
import type { Animal } from "@/src/types/animal";

import { TASKS_CHANGED_EVENT, listTasks, listTasksByCreator } from "@/src/lib/storage/tasks";
import { getAnimal } from "@/src/lib/storage/animals";

import { TaskCard } from "./_components/TaskCard";

type OpenDrop = null | "animal" | "competencies" | "location" | "sort";
type SortMode = "alpha" | "created" | "due";

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function includesCI(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

function sortLabel(mode: SortMode) {
  if (mode === "alpha") return "По алфавиту";
  if (mode === "created") return "По дате создания";
  return "По дате выполнения";
}

function mapSpeciesToPref(species: string | null | undefined) {
  const x = (species || "").trim().toLowerCase();
  if (!x) return null;

  if (x.includes("соб")) return "Собаки";
  if (x.includes("кош")) return "Кошки";
  if (x.includes("рыб")) return "Рыбы";
  if (x.includes("крол")) return "Кролики";
  if (x.includes("птиц")) return "Птицы";
  if (x.includes("грыз")) return "Грызуны";
  if (x.includes("хор")) return "Хорьки";
  if (x.includes("репт")) return "Рептилии";

  return null;
}

export default function TasksPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [items, setItems] = useState<Task[]>([]);

  const [open, setOpen] = useState<OpenDrop>(null);

  const [animalTypes, setAnimalTypes] = useState<string[]>([]);
  const [competencies, setCompetencies] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("due");

  useEffect(() => {
    (async () => {
      try {
        const me = await fetchCurrentProfile();
        setProfile(me);
        if (!me) return;

        const list = me.role === 2 ? listTasksByCreator(me.userId) : listTasks();
        setItems(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!profile) return;

    const onChanged = () => {
      const list = profile.role === 2 ? listTasksByCreator(profile.userId) : listTasks();
      setItems(list);
    };

    window.addEventListener(TASKS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(TASKS_CHANGED_EVENT, onChanged);
  }, [profile]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-drop-root]")) return;
      setOpen(null);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  const animalsById = useMemo(() => {
    const map = new Map<string, Animal | null>();
    for (const t of items) {
      if (!t.animalId) continue;
      if (map.has(t.animalId)) continue;
      map.set(t.animalId, getAnimal(t.animalId));
    }
    return map;
  }, [items]);

  const filteredSorted = useMemo(() => {
    const out = items.filter((t) => {
      const animal = t.animalId ? (animalsById.get(t.animalId) ?? null) : null;

      if (animalTypes.length) {
        const label = mapSpeciesToPref(animal?.species);
        if (!label) return false;
        if (!animalTypes.includes(label)) return false;
      }

      if (competencies.length) {
        const ok = competencies.some((c) => t.competencies.includes(c));
        if (!ok) return false;
      }

      if (districts.length) {
        if (!districts.includes(t.district)) return false;
      }

      if (query.trim()) {
        const hay = [
          t.title,
          t.description,
          t.city,
          t.district,
          animal?.name ?? "",
          animal?.species ?? "",
          animal?.breed ?? "",
        ].join(" ");

        if (!includesCI(hay, query.trim())) return false;
      }

      return true;
    });

    const sorted = [...out].sort((a, b) => {
      if (sort === "alpha") {
        return a.title.localeCompare(b.title, "ru", { sensitivity: "base" });
      }

      if (sort === "created") {
        // новые сверху
        return b.createdAt.localeCompare(a.createdAt);
      }

      // due: по startAt (или createdAt, если startAt нет)
      const da = a.startAt ?? a.createdAt;
      const db = b.startAt ?? b.createdAt;
      return da.localeCompare(db);
    });

    return sorted;
  }, [items, animalsById, animalTypes, competencies, districts, query, sort]);

  const tasksList = useMemo(() => filteredSorted.filter((t) => t.kind === "task"), [filteredSorted]);
  const fostersList = useMemo(
    () => filteredSorted.filter((t) => t.kind === "foster"),
    [filteredSorted]
  );

  const onCreateTask = () => router.push("/tasks/new");
  const onCreateFoster = () => router.push("/tasks/foster/new");

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.container} style={{ color: "#6c757d" }}>
          Загрузка...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={s.page}>
        <div className={s.container}>
          <div className={s.emptyBox}>Вы не вошли в аккаунт. Войдите, чтобы увидеть задачи.</div>
        </div>
      </div>
    );
  }

  const mode: "curator" | "volunteer" = profile.role === 2 ? "curator" : "volunteer";

  return (
    <div className={`${s.page} ${mode === "volunteer" ? s.pageVolunteer : ""}`}>
      <div className={s.container}>
        {/* Панель управления */}
        <div className={s.controlsPanel} data-drop-root>
          {mode === "curator" ? (
            <>
              <button className={`${s.btn} ${s.btnPeach}`} onClick={onCreateTask}>
                Создать задачу
              </button>
              <button className={`${s.btn} ${s.btnPeach}`} onClick={onCreateFoster}>
                Запросить передержку
              </button>
            </>
          ) : (
            <>
              {/* Волонтёр: поиск в этой же строке */}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск..."
                className={s.searchInput}
              />
            </>
          )}

          {/* Вид животного */}
          <div className={s.dropWrap}>
            <button
              className={`${s.btn} ${s.btnLavender} ${s.dropBtn}`}
              type="button"
              onClick={() => setOpen((v) => (v === "animal" ? null : "animal"))}
            >
              Вид животного +
            </button>

            {open === "animal" ? (
              <div className={s.dropMenuLavender} role="dialog" aria-label="Фильтр: вид животного">
                <ul className={s.dropList}>
                  {(PREF_ANIMALS as unknown as string[]).map((label) => (
                    <li key={label}>
                      <label className={s.dropItem}>
                        <input
                          type="checkbox"
                          checked={animalTypes.includes(label)}
                          onChange={() => setAnimalTypes((p) => toggle(p, label))}
                        />
                        <span>{label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Компетенции */}
          <div className={s.dropWrap}>
            <button
              className={`${s.btn} ${s.btnLavender} ${s.dropBtn}`}
              type="button"
              onClick={() => setOpen((v) => (v === "competencies" ? null : "competencies"))}
            >
              Компетенции +
            </button>

            {open === "competencies" ? (
              <div className={s.dropMenuLavender} role="dialog" aria-label="Фильтр: компетенции">
                <ul className={s.dropList}>
                  {(COMPETENCIES as unknown as string[]).map((label) => (
                    <li key={label}>
                      <label className={s.dropItem}>
                        <input
                          type="checkbox"
                          checked={competencies.includes(label)}
                          onChange={() => setCompetencies((p) => toggle(p, label))}
                        />
                        <span>{label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Локация */}
          <div className={s.dropWrap}>
            <button
              className={`${s.btn} ${s.btnLavender} ${s.dropBtn}`}
              type="button"
              onClick={() => setOpen((v) => (v === "location" ? null : "location"))}
            >
              Локация +
            </button>

            {open === "location" ? (
              <div className={s.dropMenuLavender} role="dialog" aria-label="Фильтр: локация">
                <ul className={s.dropList}>
                  {(DISTRICTS as unknown as string[]).map((label) => (
                    <li key={label}>
                      <label className={s.dropItem}>
                        <input
                          type="checkbox"
                          checked={districts.includes(label)}
                          onChange={() => setDistricts((p) => toggle(p, label))}
                        />
                        <span>{label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Волонтёр: сортировка в той же строке справа */}
          {mode === "volunteer" ? (
            <div className={s.sortWrap}>
              <div
                className={s.sortControl}
                role="button"
                tabIndex={0}
                onClick={() => setOpen((v) => (v === "sort" ? null : "sort"))}
              >
                Сортировка: {sortLabel(sort)} ▼
              </div>

              {open === "sort" ? (
                <div className={s.sortMenuWhite} role="dialog" aria-label="Сортировка">
                  <ul className={s.sortList}>
                    <li>
                      <button
                        type="button"
                        className={`${s.sortBtn} ${sort === "alpha" ? s.sortBtnActive : ""}`}
                        onClick={() => {
                          setSort("alpha");
                          setOpen(null);
                        }}
                      >
                        По алфавиту
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className={`${s.sortBtn} ${sort === "created" ? s.sortBtnActive : ""}`}
                        onClick={() => {
                          setSort("created");
                          setOpen(null);
                        }}
                      >
                        По дате создания
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className={`${s.sortBtn} ${sort === "due" ? s.sortBtnActive : ""}`}
                        onClick={() => {
                          setSort("due");
                          setOpen(null);
                        }}
                      >
                        По дате выполнения
                      </button>
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Куратор: поиск+сортировка второй строкой */}
        {mode === "curator" ? (
          <div className={s.searchRow} data-drop-root>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск..."
              className={s.searchInput}
            />

            <div className={s.sortWrap}>
              <div
                className={s.sortControl}
                role="button"
                tabIndex={0}
                onClick={() => setOpen((v) => (v === "sort" ? null : "sort"))}
              >
                Сортировка: {sortLabel(sort)} ▼
              </div>

              {open === "sort" ? (
                <div className={s.sortMenuWhite} role="dialog" aria-label="Сортировка">
                  <ul className={s.sortList}>
                    <li>
                      <button
                        type="button"
                        className={`${s.sortBtn} ${sort === "alpha" ? s.sortBtnActive : ""}`}
                        onClick={() => {
                          setSort("alpha");
                          setOpen(null);
                        }}
                      >
                        По алфавиту
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className={`${s.sortBtn} ${sort === "created" ? s.sortBtnActive : ""}`}
                        onClick={() => {
                          setSort("created");
                          setOpen(null);
                        }}
                      >
                        По дате создания
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className={`${s.sortBtn} ${sort === "due" ? s.sortBtnActive : ""}`}
                        onClick={() => {
                          setSort("due");
                          setOpen(null);
                        }}
                      >
                        По дате выполнения
                      </button>
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Задачи */}
        <section className={s.tasksSection}>
          <h2 className={s.sectionTitle}>{profile.role === 2 ? "Мои задачи" : "Задачи"}</h2>

          {tasksList.length === 0 ? (
            <div className={s.emptyBox}>Пока нет задач.</div>
          ) : (
            <div className={s.cardsGrid}>
              {tasksList.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  animal={t.animalId ? animalsById.get(t.animalId) ?? null : null}
                  onEdit={() => router.push(`/tasks/${t.id}`)}
                  mode={mode}
                />
              ))}
            </div>
          )}
        </section>

        {/* Передержки */}
        <section className={s.tasksSection}>
          <h2 className={s.sectionTitle}>{profile.role === 2 ? "Мои передержки" : "Передержки"}</h2>

          {fostersList.length === 0 ? (
            <div className={s.emptyBox}>Пока нет передержек.</div>
          ) : (
            <div className={`${s.cardsGrid} ${s.cardsGridFoster}`}>
              {fostersList.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  animal={t.animalId ? animalsById.get(t.animalId) ?? null : null}
                  onEdit={() => router.push(`/tasks/${t.id}`)}
                  mode={mode}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}