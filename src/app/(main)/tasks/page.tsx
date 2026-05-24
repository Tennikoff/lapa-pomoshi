"use client";

import Link from "next/link";
import profileStyles from "@/src/app/(main)/profile/profile.module.css";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import s from "./tasks.module.css";

import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { isOrgRole } from "@/src/lib/role";
import { dictionariesApi, type DictionaryItemDto } from "@/src/lib/api/dictionaries";
import { helpTasksApi } from "@/src/lib/api/helpTasks";
import { animalsApi } from "@/src/lib/api/animals";

import type { ProfileDto } from "@/src/types/profile";
import type { HelpTaskDto, HelpTasksListDto } from "@/src/types/helpTask";

import { TaskCard } from "./_components/TaskCard";
import { RespondersModal } from "./_components/RespondersModal";

const HELP_TASKS_CHANGED_EVENT = "lp_help_tasks_changed";

const INITIAL_VISIBLE = 6;
const LOAD_MORE_STEP = 6;

const PAGE_SIZE = 50;
const MAX_TOTAL = 500;

const ALL_CACHE_PREFIX = "lp_helpTasks_all_v1:";
const ALL_CACHE_TTL_MS = 2 * 60 * 1000;

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

function canUseLS() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cacheKeyFor(userId: string, mode: "volunteer" | "curator") {
  return `${ALL_CACHE_PREFIX}${userId}:${mode}`;
}

function readAllCache(key: string): {
  tasks: HelpTaskDto[];
  animalTypeById: Record<string, string>;
  savedAt: number;
} | null {
  if (!canUseLS()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      savedAt: number;
      tasks: HelpTaskDto[];
      animalTypeById: Record<string, string>;
    };
    if (!parsed?.savedAt || !Array.isArray(parsed.tasks) || !parsed.animalTypeById) return null;
    if (Date.now() - parsed.savedAt > ALL_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeAllCache(key: string, tasks: HelpTaskDto[], animalTypeById: Record<string, string>) {
  if (!canUseLS()) return;
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), tasks, animalTypeById }));
  } catch {
  }
}

const PREF_TO_TYPES: Record<string, string[]> = {
  Грызуны: ["Грызун", "Грызуны"],
  Кошки: ["Кошка", "Кошки"],
  Кролики: ["Кролик", "Кролики"],
  Птицы: ["Птица", "Птицы"],
  Рептилии: ["Рептилия", "Рептилии"],
  Рыбы: ["Рыба", "Рыбы"],
  Собаки: ["Собака", "Собаки"],
  Хорьки: ["Хорёк", "Хорек", "Хорьки"],
};

function matchPreference(preferencePlural: string, animalType: string) {
  const variants = PREF_TO_TYPES[preferencePlural] ?? [preferencePlural];
  const a = animalType.trim().toLowerCase();
  return variants.some((v) => v.trim().toLowerCase() === a);
}

async function loadAllMyCreated(): Promise<HelpTaskDto[]> {
  const all: HelpTaskDto[] = [];
  let offset = 0;

  while (all.length < MAX_TOTAL) {
    const res = (await helpTasksApi.myCreated(offset, PAGE_SIZE)) as HelpTasksListDto;
    const chunk = res.tasks ?? [];
    all.push(...chunk);

    if (!res.hasMore) break;
    offset += PAGE_SIZE;
    if (!chunk.length) break;
  }

  return all.slice(0, MAX_TOTAL);
}

async function loadAllFeed(allLocations: string[]): Promise<HelpTaskDto[]> {
  const all: HelpTaskDto[] = [];
  let offset = 0;

  while (all.length < MAX_TOTAL) {
    const res = (await helpTasksApi.feed({
      offset,
      limit: PAGE_SIZE,
      locations: allLocations.length ? allLocations : undefined,
    })) as HelpTasksListDto;

    const chunk = res.tasks ?? [];
    all.push(...chunk);

    if (!res.hasMore) break;
    offset += PAGE_SIZE;
    if (!chunk.length) break;
  }

  return all.slice(0, MAX_TOTAL);
}

async function buildAnimalTypeMap(tasks: HelpTaskDto[]): Promise<Record<string, string>> {
  const ids = new Set<string>();
  for (const t of tasks) {
    for (const an of t.animals ?? []) {
      if (an?.id) ids.add(an.id);
    }
  }

  const unique = Array.from(ids);
  if (!unique.length) return {};

  const out: Record<string, string> = {};
  await Promise.all(
    unique.map(async (id) => {
      try {
        const full = await animalsApi.getById(id);
        if (full?.animalType) out[id] = full.animalType;
      } catch {
      }
    })
  );

  return out;
}

export default function TasksPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [open, setOpen] = useState<OpenDrop>(null);

  const [locationsDict, setLocationsDict] = useState<DictionaryItemDto[]>([]);
  const [competenciesDict, setCompetenciesDict] = useState<DictionaryItemDto[]>([]);
  const [preferencesDict, setPreferencesDict] = useState<DictionaryItemDto[]>([]);

  const [animalTypes, setAnimalTypes] = useState<string[]>([]);
  const [competencies, setCompetencies] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("due");

  const [allItems, setAllItems] = useState<HelpTaskDto[]>([]);
  const [animalTypeById, setAnimalTypeById] = useState<Record<string, string>>({});

  const [visibleTasks, setVisibleTasks] = useState(INITIAL_VISIBLE);
  const [visibleFosters, setVisibleFosters] = useState(INITIAL_VISIBLE);

  const [responsesOpen, setResponsesOpen] = useState(false);
  const [responsesTaskId, setResponsesTaskId] = useState<string | null>(null);
  const [responsesTaskTitle, setResponsesTaskTitle] = useState<string>("");

  const org = isOrgRole(profile?.role);
  const mode: "curator" | "volunteer" = org ? "curator" : "volunteer";

  const allLocationNames = useMemo(() => locationsDict.map((x) => x.name), [locationsDict]);

  const openResponsesModal = (t: HelpTaskDto) => {
    setResponsesTaskId(t.id);
    setResponsesTaskTitle(t.title ?? "");
    setResponsesOpen(true);
  };

  const closeResponses = () => {
    setResponsesOpen(false);
    setResponsesTaskId(null);
    setResponsesTaskTitle("");
  };

  const loadOnce = async (
    me: ProfileDto,
    allLocations: string[],
    opts?: { silent?: boolean }
  ) => {
    if (!opts?.silent) setLoading(true);

    try {
      const cacheKey = cacheKeyFor(me.userId, isOrgRole(me.role) ? "curator" : "volunteer");
      const cached = readAllCache(cacheKey);
      if (cached) {
        setAllItems(cached.tasks ?? []);
        setAnimalTypeById(cached.animalTypeById ?? {});
        return;
      }

      const tasks = isOrgRole(me.role) ? await loadAllMyCreated() : await loadAllFeed(allLocations);
      setAllItems(tasks);

      const map = await buildAnimalTypeMap(tasks);
      setAnimalTypeById(map);

      writeAllCache(cacheKey, tasks, map);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

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

        const allLocNames = locs.map((x) => x.name);
        await loadOnce(me, allLocNames, { silent: true });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  useEffect(() => {
    if (!profile) return;

    const onChanged = async () => {
      const key = cacheKeyFor(profile.userId, isOrgRole(profile.role) ? "curator" : "volunteer");
      if (canUseLS()) localStorage.removeItem(key);

      const allLoc = allLocationNames.length ? allLocationNames : [];
      await loadOnce(profile, allLoc, { silent: true });
    };

    window.addEventListener(HELP_TASKS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(HELP_TASKS_CHANGED_EVENT, onChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, allLocationNames.length]);

  useEffect(() => {
    setVisibleTasks(INITIAL_VISIBLE);
    setVisibleFosters(INITIAL_VISIBLE);
  }, [query, sort, animalTypes.join("|"), competencies.join("|"), districts.join("|")]);

  const filteredSorted = useMemo(() => {
    const out = allItems.filter((t0) => {
      if (competencies.length) {
        const ok = competencies.some((c) => (t0.competencies || []).includes(c));
        if (!ok) return false;
      }

      if (districts.length) {
        const loc0 = loc0OrEmpty(t0);
        if (!districts.includes(loc0)) return false;
      }

      if (animalTypes.length) {
        const ids = (t0.animals ?? []).map((x) => x?.id).filter(Boolean) as string[];
        if (!ids.length) return false;

        const has = ids.some((id) => {
          const type = animalTypeById[id];
          if (!type) return false;
          return animalTypes.some((pref) => matchPreference(pref, type));
        });

        if (!has) return false;
      }

      if (query.trim()) {
        const animalName = t0.animals?.[0]?.name ?? "";
        const hay = [t0.title, t0.description, loc0OrEmpty(t0), animalName].join(" ");
        if (!includesCI(hay, query.trim())) return false;
      }

      return true;
    });

    const sorted = [...out].sort((a, b) => {
      if (sort === "alpha") return a.title.localeCompare(b.title, "ru", { sensitivity: "base" });
      if (sort === "created") return (b.createdAt || "").localeCompare(a.createdAt || "");
      const da = a.startedAt ?? a.createdAt;
      const db = b.startedAt ?? b.createdAt;
      return String(da).localeCompare(String(db));
    });

    return sorted;
  }, [allItems, animalTypeById, animalTypes, competencies, districts, query, sort]);

  const tasksList = useMemo(() => filteredSorted.filter((x) => !x.isTaskOverexposure), [filteredSorted]);
  const fostersList = useMemo(() => filteredSorted.filter((x) => x.isTaskOverexposure), [filteredSorted]);

  const visibleTasksList = useMemo(() => tasksList.slice(0, visibleTasks), [tasksList, visibleTasks]);
  const visibleFostersList = useMemo(() => fostersList.slice(0, visibleFosters), [fostersList, visibleFosters]);

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
      <div className={profileStyles.page}>
        <div className={profileStyles.centerScreen}>
          <div className={profileStyles.centerBox}>
            <h2 style={{ margin: "0 0 6px" }}>Вы не вошли в аккаунт</h2>
            <p style={{ color: "#6C757D", margin: 0 }}>
              Войдите, чтобы увидеть задачи.
            </p>

            <Link href="/login" className={`${profileStyles.btnLarge} ${profileStyles.btnLogin}`}>
              ВОЙТИ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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

            {/* Волонтёр: сортировка в 1-й строке */}
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

          {/* 2-я строка: поиск куратора + сортировка */}
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

          {/* TASKS */}
          <section className={s.tasksSection}>
            <h2 className={s.sectionTitle}>{org ? "Мои задачи" : "Задачи"}</h2>

            {tasksList.length === 0 ? (
              <div className={s.emptyBox}>Пока нет задач.</div>
            ) : (
              <>
                <div className={s.cardsGrid}>
                  {visibleTasksList.map((t0) => (
                    <TaskCard
                      key={t0.id}
                      task={t0}
                      onEdit={() => router.push(`/tasks/${t0.id}`)}
                      mode={mode}
                      onOpenResponses={mode === "curator" ? () => openResponsesModal(t0) : undefined}
                    />
                  ))}
                </div>

                {tasksList.length > visibleTasks ? (
                  <div className={s.loadMoreRow}>
                    <button
                      type="button"
                      className={s.loadMoreBtn}
                      onClick={() => setVisibleTasks((v) => v + LOAD_MORE_STEP)}
                    >
                      Загрузить ещё
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>

          {/* FOSTERS */}
          <section className={s.tasksSection}>
            <h2 className={s.sectionTitle}>{org ? "Мои передержки" : "Передержки"}</h2>

            {fostersList.length === 0 ? (
              <div className={s.emptyBox}>Пока нет передержек.</div>
            ) : (
              <>
                <div className={`${s.cardsGrid} ${s.cardsGridFoster}`}>
                  {visibleFostersList.map((t0) => (
                    <TaskCard
                      key={t0.id}
                      task={t0}
                      onEdit={() => router.push(`/tasks/${t0.id}`)}
                      mode={mode}
                      onOpenResponses={mode === "curator" ? () => openResponsesModal(t0) : undefined}
                    />
                  ))}
                </div>

                {fostersList.length > visibleFosters ? (
                  <div className={s.loadMoreRow}>
                    <button
                      type="button"
                      className={s.loadMoreBtn}
                      onClick={() => setVisibleFosters((v) => v + LOAD_MORE_STEP)}
                    >
                      Загрузить ещё
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>

      <RespondersModal
        open={responsesOpen}
        taskId={responsesTaskId}
        taskTitle={responsesTaskTitle}
        onClose={closeResponses}
      />
    </>
  );
}