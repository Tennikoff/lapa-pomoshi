"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import s from "./tasks.module.css";
import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { isOrgRole } from "@/src/lib/role";
import { dictionariesApi, type DictionaryItemDto } from "@/src/lib/api/dictionaries";
import { helpTasksApi } from "@/src/lib/api/helpTasks";
import type { ProfileDto } from "@/src/types/profile";
import type { HelpTaskDto, HelpTasksListDto } from "@/src/types/helpTask";
import { TaskCard } from "./_components/TaskCard";

const HELP_TASKS_CHANGED_EVENT = "lp_help_tasks_changed";

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

function loc0OrEmpty(t: HelpTaskDto) {
  return t.locations?.[0] ?? "";
}

export default function TasksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [open, setOpen] = useState<OpenDrop>(null);

  // dictionaries
  const [locationsDict, setLocationsDict] = useState<DictionaryItemDto[]>([]);
  const [competenciesDict, setCompetenciesDict] = useState<DictionaryItemDto[]>([]);
  const [preferencesDict, setPreferencesDict] = useState<DictionaryItemDto[]>([]);

  // filters
  const [animalTypes, setAnimalTypes] = useState<string[]>([]);
  const [competencies, setCompetencies] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("due");

  // data
  const [items, setItems] = useState<HelpTaskDto[]>([]);

  const org = isOrgRole(profile?.role);
  const mode: "curator" | "volunteer" = org ? "curator" : "volunteer";

  const allLocationNames = useMemo(
    () => locationsDict.map((x) => x.name),
    [locationsDict]
  );

  const load = async (p: ProfileDto, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);

    try {
      const isOrg = isOrgRole(p.role);

      if (isOrg) {
        const res = (await helpTasksApi.myCreated(0, 50)) as HelpTasksListDto;
        setItems(res.tasks);
        return;
      }

      // VOLUNTEER: feed (server-side filtering)
      const locs = districts.length ? districts : allLocationNames;

      const res = (await helpTasksApi.feed({
        offset: 0,
        limit: 50,
        search: query.trim() || undefined,
        locations: locs.length ? locs : undefined,
        competencies: competencies.length ? competencies : undefined,
        preferences: animalTypes.length ? animalTypes : undefined,
      })) as HelpTasksListDto;

      setItems(res.tasks);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  // init
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const me = await fetchCurrentProfile();
        setProfile(me);
        if (!me) return;

        const [locs, comps, prefs] = await Promise.all([
          dictionariesApi.locations(),
          dictionariesApi.competencies(),
          dictionariesApi.preferences(),
        ]);

        setLocationsDict(locs);
        setCompetenciesDict(comps);
        setPreferencesDict(prefs);

        await load(me, { silent: true });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // close dropdowns on outside click / esc
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

  // 🔥 авто-обновление после create/update/delete
  useEffect(() => {
    if (!profile) return;

    const onChanged = () => load(profile, { silent: true });

    window.addEventListener(HELP_TASKS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(HELP_TASKS_CHANGED_EVENT, onChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, districts, competencies, animalTypes, query, allLocationNames.length]);

  // volunteer: reload when filters change (server side feed) with debounce
  useEffect(() => {
    if (!profile) return;
    if (isOrgRole(profile.role)) return;
    if (!locationsDict.length) return;

    const id = window.setTimeout(() => {
      load(profile, { silent: true });
    }, 250);

    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, query, districts, competencies, animalTypes, locationsDict.length]);

  const filteredSorted = useMemo(() => {
    // org: client-side filtering
    const out = items.filter((t) => {
      if (!org) return true;

      if (competencies.length) {
        const ok = competencies.some((c) => (t.competencies || []).includes(c));
        if (!ok) return false;
      }

      if (districts.length) {
        const loc0 = loc0OrEmpty(t);
        if (!districts.includes(loc0)) return false;
      }

      if (query.trim()) {
        const animalName = t.animals?.[0]?.name ?? "";
        const hay = [t.title, t.description, loc0OrEmpty(t), animalName].join(" ");
        if (!includesCI(hay, query.trim())) return false;
      }

      return true;
    });

    const sorted = [...out].sort((a, b) => {
      if (sort === "alpha")
        return a.title.localeCompare(b.title, "ru", { sensitivity: "base" });

      if (sort === "created") return (b.createdAt || "").localeCompare(a.createdAt || "");

      const da = a.startedAt ?? a.createdAt;
      const db = b.startedAt ?? b.createdAt;
      return String(da).localeCompare(String(db));
    });

    return sorted;
  }, [items, org, competencies, districts, query, sort]);

  const tasksList = useMemo(
    () => filteredSorted.filter((x) => !x.isTaskOverexposure),
    [filteredSorted]
  );

  const fostersList = useMemo(
    () => filteredSorted.filter((x) => x.isTaskOverexposure),
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
          <div className={s.emptyBox}>
            Вы не вошли в аккаунт. Войдите, чтобы увидеть задачи.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${s.page} ${mode === "volunteer" ? s.pageVolunteer : ""}`}>
      <div className={s.container}>
        {/* 1-я строка: кнопки куратора + фильтры */}
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
            // Волонтёр: как было — поиск в первой строке
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск..."
              className={s.searchInput}
            />
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
                  {preferencesDict.map((x) => (
                    <li key={x.id}>
                      <label className={s.dropItem}>
                        <input
                          type="checkbox"
                          checked={animalTypes.includes(x.name)}
                          onChange={() => setAnimalTypes((p) => toggle(p, x.name))}
                        />
                        <span>{x.name}</span>
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
                  {competenciesDict.map((x) => (
                    <li key={x.id}>
                      <label className={s.dropItem}>
                        <input
                          type="checkbox"
                          checked={competencies.includes(x.name)}
                          onChange={() => setCompetencies((p) => toggle(p, x.name))}
                        />
                        <span>{x.name}</span>
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
                  {locationsDict.map((x) => (
                    <li key={x.id}>
                      <label className={s.dropItem}>
                        <input
                          type="checkbox"
                          checked={districts.includes(x.name)}
                          onChange={() => setDistricts((p) => toggle(p, x.name))}
                        />
                        <span>{x.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Волонтёр: сортировка в 1-й строке (как было) */}
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

        {/* 2-я строка: поиск куратора + сортировка (на одном уровне) */}
        {mode === "curator" ? (
          <div className={s.searchRowCurator} data-drop-root>
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

        <section className={s.tasksSection}>
          <h2 className={s.sectionTitle}>{org ? "Мои задачи" : "Задачи"}</h2>
          {tasksList.length === 0 ? (
            <div className={s.emptyBox}>Пока нет задач.</div>
          ) : (
            <div className={s.cardsGrid}>
              {tasksList.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onEdit={() => router.push(`/tasks/${t.id}`)}
                  mode={mode}
                />
              ))}
            </div>
          )}
        </section>

        <section className={s.tasksSection}>
          <h2 className={s.sectionTitle}>{org ? "Мои передержки" : "Передержки"}</h2>
          {fostersList.length === 0 ? (
            <div className={s.emptyBox}>Пока нет передержек.</div>
          ) : (
            <div className={`${s.cardsGrid} ${s.cardsGridFoster}`}>
              {fostersList.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
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