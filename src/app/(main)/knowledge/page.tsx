"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import styles from "./knowledge.module.css";

// ✅ фильтры 1-в-1 как у волонтёра в /tasks
import taskStyles from "@/src/app/(main)/tasks/tasks.module.css";

import { dictionariesApi, type DictionaryItemDto } from "@/src/lib/api/dictionaries";
import { referenceBookApi } from "@/src/lib/api/referenceBook";
import { ApiError } from "@/src/lib/api/http";

type OpenDrop = null | "type" | "theme";

type NormalizedArticle = {
  key: string;
  typeId: number; // id из Dictionaries/animal-types (ед. число)
  themeId: number; // id из Dictionaries/themes
  title: string;
  description: string;
  videoUrl?: string | null;
};

const UI_LS_KEY = "lp_knowledge_ui_v3";

// кеш всей медиатеки (1 загрузка на вход)
const RB_ALL_CACHE_KEY = "lp_referenceBook_all_cache_v1";
const RB_ALL_CACHE_TTL_MS = 30 * 60 * 1000; // 30 минут

function canUseLS() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function dedupeByKey(items: NormalizedArticle[]) {
  const map = new Map<string, NormalizedArticle>();
  for (const x of items) map.set(x.key, x);
  return Array.from(map.values());
}

// ✅ если кеш пустой — считаем его битым и игнорируем
function readAllCache(): NormalizedArticle[] | null {
  if (!canUseLS()) return null;

  const cached = safeJsonParse<{ savedAt: number; items: NormalizedArticle[] }>(localStorage.getItem(RB_ALL_CACHE_KEY));
  if (!cached?.savedAt || !Array.isArray(cached.items)) return null;
  if (Date.now() - cached.savedAt > RB_ALL_CACHE_TTL_MS) return null;

  if (!cached.items.length) {
    // защищаемся от "закешировали пустоту и всё пропало"
    try {
      localStorage.removeItem(RB_ALL_CACHE_KEY);
    } catch {
      // ignore
    }
    return null;
  }

  return cached.items;
}

function writeAllCache(items: NormalizedArticle[]) {
  if (!canUseLS()) return;
  if (!items.length) return; // ✅ не кешируем пустоту

  try {
    localStorage.setItem(RB_ALL_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), items }));
  } catch {
    // ignore
  }
}

// CSS vars из tasks.module.css (.page) — чтобы lavender-стили совпали
type TaskVars = CSSProperties & {
  ["--color-bg-page"]?: string;
  ["--color-bg-card"]?: string;
  ["--color-text-primary"]?: string;
  ["--color-text-secondary"]?: string;
  ["--color-accent-peach"]?: string;
  ["--color-accent-peach-hover"]?: string;
  ["--color-accent-lavender"]?: string;
  ["--color-tag-blue"]?: string;
  ["--color-border"]?: string;
};

const TASK_VARS: TaskVars = {
  ["--color-bg-page"]: "#f8f9fa",
  ["--color-bg-card"]: "#ebf3fc",
  ["--color-text-primary"]: "#212529",
  ["--color-text-secondary"]: "#6c757d",
  ["--color-accent-peach"]: "#e9b8a7",
  ["--color-accent-peach-hover"]: "#dda693",
  ["--color-accent-lavender"]: "#d9c4ec",
  ["--color-tag-blue"]: "#c3eaff",
  ["--color-border"]: "#dee2e6",
};

// ✅ простой лимитер параллелизма (без библиотек)
async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T, idx: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      const idx = nextIndex++;
      if (idx >= items.length) return;
      out[idx] = await mapper(items[idx], idx);
    }
  };

  const workers = Array.from({ length: Math.max(1, limit) }, () => worker());
  await Promise.all(workers);
  return out;
}

export default function KnowledgePage() {
  const [loading, setLoading] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [open, setOpen] = useState<OpenDrop>(null);

  // dictionaries
  const [themes, setThemes] = useState<DictionaryItemDto[]>([]);
  const [prefs, setPrefs] = useState<DictionaryItemDto[]>([]); // preferences: мн. число (UI)
  const [animalTypes, setAnimalTypes] = useState<DictionaryItemDto[]>([]); // animal-types: ед. число (ReferenceBook)

  // filters (по ID); пусто => показываем ВСЮ медиатеку
  const [selectedPrefIds, setSelectedPrefIds] = useState<number[]>([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState<number[]>([]);

  const hasFilters = selectedPrefIds.length > 0 || selectedThemeIds.length > 0;

  // sidebar navigation + flash highlight
  const [activeThemeId, setActiveThemeId] = useState<number | null>(null);
  const [flashThemeId, setFlashThemeId] = useState<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  // ALL articles (после 1 загрузки)
  const [allArticles, setAllArticles] = useState<NormalizedArticle[]>([]);

  // opened article
  const [activeArticleKey, setActiveArticleKey] = useState<string | null>(null);

  // restore UI from localStorage
  useEffect(() => {
    if (!canUseLS()) return;

    const ui = safeJsonParse<{
      selectedPrefIds: number[];
      selectedThemeIds: number[];
      activeThemeId: number | null;
      activeArticleKey: string | null;
    }>(localStorage.getItem(UI_LS_KEY));

    if (!ui) return;

    if (Array.isArray(ui.selectedPrefIds)) setSelectedPrefIds(ui.selectedPrefIds);
    if (Array.isArray(ui.selectedThemeIds)) setSelectedThemeIds(ui.selectedThemeIds);
    if (typeof ui.activeThemeId === "number" || ui.activeThemeId === null) setActiveThemeId(ui.activeThemeId);
    if (typeof ui.activeArticleKey === "string" || ui.activeArticleKey === null) setActiveArticleKey(ui.activeArticleKey);
  }, []);

  // persist UI to localStorage
  useEffect(() => {
    if (!canUseLS()) return;

    localStorage.setItem(
      UI_LS_KEY,
      JSON.stringify({
        selectedPrefIds,
        selectedThemeIds,
        activeThemeId,
        activeArticleKey,
      })
    );
  }, [activeArticleKey, activeThemeId, selectedPrefIds, selectedThemeIds]);

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

  // load dictionaries
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorText(null);

      try {
        const [themesRes, prefsRes, animalTypesRes] = await Promise.all([
          dictionariesApi.themes(),
          dictionariesApi.preferences(),
          dictionariesApi.animalTypes(),
        ]);

        setThemes(themesRes);
        setPrefs(prefsRes);
        setAnimalTypes(animalTypesRes);

        setActiveThemeId((prev) => (prev != null ? prev : themesRes[0]?.id ?? null));
      } catch (e) {
        let msg = "Не удалось загрузить словари медиатеки";
        if (e instanceof ApiError) msg = e.message;
        else if (e instanceof Error) msg = e.message;
        setErrorText(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // load ALL articles once
  useEffect(() => {
    (async () => {
      if (!themes.length || !animalTypes.length) return;

      const cached = readAllCache();
      if (cached) {
        setAllArticles(cached);
        return;
      }

      setLoadingArticles(true);
      setErrorText(null);

      try {
        const combos: Array<{ type: DictionaryItemDto; theme: DictionaryItemDto }> = [];
        for (const t of animalTypes) for (const th of themes) combos.push({ type: t, theme: th });

        const CONCURRENCY = 4;

        const results = await mapWithConcurrency(combos, CONCURRENCY, async ({ type, theme }) => {
          try {
            const res = await referenceBookApi.listByNames({
              animalType: type.name, // "Кошка"
              theme: theme.name, // "Кормление"
            });

            return res
              .map((x, idx) => {
                const title = String(x.title ?? "").trim();
                const description = String(x.description ?? "").trim();
                if (!title && !description) return null;

                const key = `rb_${type.id}_${theme.id}_${idx}`;
                const item: NormalizedArticle = {
                  key,
                  typeId: type.id,
                  themeId: theme.id,
                  title: title || "Без названия",
                  description: description || "—",
                  videoUrl: x.videoUrl ?? null,
                };
                return item;
              })
              .filter(Boolean) as NormalizedArticle[];
          } catch (e) {
            // 400 для конкретной комбинации — норма (нет статьи)
            if (e instanceof ApiError && e.status === 400) return [];
            throw e;
          }
        });

        const merged = results.flat();
        const normalized = dedupeByKey(merged);

        if (!normalized.length) {
          // здесь уже реально "ничего не загрузили" — это ошибка окружения/доступа
          setErrorText("Не удалось загрузить статьи медиатеки (получили 0 статей). Проверь доступность /api/ReferenceBook.");
          setAllArticles([]);
          return;
        }

        setAllArticles(normalized);
        writeAllCache(normalized);
      } catch (e) {
        let msg = "Не удалось загрузить медиатеку";
        if (e instanceof ApiError) msg = e.message;
        else if (e instanceof Error) msg = e.message;
        setErrorText(msg);
        setAllArticles([]);
      } finally {
        setLoadingArticles(false);
      }
    })();
  }, [themes.length, animalTypes.length]);

  // sidebar themes: если фильтр тем выбран — показываем только их, иначе все
  const sidebarThemes = useMemo(() => {
    if (!selectedThemeIds.length) return themes;
    const set = new Set(selectedThemeIds);
    return themes.filter((x) => set.has(x.id));
  }, [selectedThemeIds, themes]);

  // local filtering
  const filteredArticles = useMemo(() => {
    let out = allArticles;

    if (selectedPrefIds.length) {
      const set = new Set(selectedPrefIds);
      out = out.filter((a) => set.has(a.typeId));
    }

    if (selectedThemeIds.length) {
      const set = new Set(selectedThemeIds);
      out = out.filter((a) => set.has(a.themeId));
    }

    return out;
  }, [allArticles, selectedPrefIds, selectedThemeIds]);

  const themeSections = useMemo(() => {
    return sidebarThemes.map((th) => ({
      theme: th,
      items: filteredArticles.filter((a) => a.themeId === th.id),
    }));
  }, [filteredArticles, sidebarThemes]);

  const activeArticle = useMemo(() => {
    if (!activeArticleKey) return null;
    return filteredArticles.find((x) => x.key === activeArticleKey) ?? null;
  }, [activeArticleKey, filteredArticles]);

  const togglePrefId = (id: number) => {
    setSelectedPrefIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleThemeId = (id: number) => {
    setSelectedThemeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const flashTheme = (themeId: number) => {
    setFlashThemeId(themeId);
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setFlashThemeId(null), 1800);
  };

  const scrollToTheme = (themeId: number) => {
    const el = document.getElementById(`theme_${themeId}`);
    if (!el) return;
    setOpen(null);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    flashTheme(themeId);
  };

  if (loading) {
    return (
      <div className={`${styles.page} ${taskStyles.pageVolunteer}`} style={TASK_VARS}>
        <div className={styles.container}>
          <p className={styles.muted}>Загрузка…</p>
        </div>
      </div>
    );
  }

  if (errorText) {
    return (
      <div className={`${styles.page} ${taskStyles.pageVolunteer}`} style={TASK_VARS}>
        <div className={styles.container}>
          <p className={styles.muted}>{errorText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${taskStyles.pageVolunteer}`} style={TASK_VARS}>
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <ul className={styles.sidebarList}>
            {sidebarThemes.map((th) => {
              const active = th.id === activeThemeId;
              return (
                <li key={th.id}>
                  <button
                    type="button"
                    className={`${styles.sidebarBtn} ${active ? styles.sidebarBtnActive : ""}`}
                    onClick={() => {
                      setActiveThemeId(th.id);
                      setActiveArticleKey(null);
                      scrollToTheme(th.id);
                    }}
                  >
                    {th.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className={styles.content}>
          <div className={styles.filtersRow} data-drop-root>
            <div className={taskStyles.dropWrap}>
              <button
                className={`${taskStyles.btn} ${taskStyles.btnLavender} ${taskStyles.dropBtn}`}
                type="button"
                onClick={() => setOpen((v) => (v === "type" ? null : "type"))}
              >
                Вид животного +
              </button>

              {open === "type" ? (
                <div className={taskStyles.dropMenuLavender} role="dialog" aria-label="Фильтр: вид животного">
                  <ul className={taskStyles.dropList}>
                    {prefs.map((x) => (
                      <li key={x.id}>
                        <label className={taskStyles.dropItem}>
                          <input
                            type="checkbox"
                            checked={selectedPrefIds.includes(x.id)}
                            onChange={() => togglePrefId(x.id)}
                          />
                          <span>{x.name}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className={taskStyles.dropWrap}>
              <button
                className={`${taskStyles.btn} ${taskStyles.btnLavender} ${taskStyles.dropBtn}`}
                type="button"
                onClick={() => setOpen((v) => (v === "theme" ? null : "theme"))}
              >
                Тема +
              </button>

              {open === "theme" ? (
                <div className={taskStyles.dropMenuLavender} role="dialog" aria-label="Фильтр: тема">
                  <ul className={taskStyles.dropList}>
                    {themes.map((x) => (
                      <li key={x.id}>
                        <label className={taskStyles.dropItem}>
                          <input
                            type="checkbox"
                            checked={selectedThemeIds.includes(x.id)}
                            onChange={() => toggleThemeId(x.id)}
                          />
                          <span>{x.name}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <h1 className={styles.sectionTitle}>Медиатека</h1>
          {loadingArticles ? <p className={styles.muted}>Загрузка статей…</p> : null}

          {activeArticle ? (
            <div className={styles.articleBox}>
              <div className={styles.articleHeader}>
                <h2 className={styles.articleTitle}>{activeArticle.title}</h2>
                <button
                  type="button"
                  className={styles.closeArticleBtn}
                  onClick={() => setActiveArticleKey(null)}
                  aria-label="Закрыть статью"
                >
                  ×
                </button>
              </div>
              <p className={styles.articleText}>{activeArticle.description}</p>
            </div>
          ) : (
            <>
              {themeSections.map(({ theme, items }) => {
                const isFlash = flashThemeId === theme.id;

                return (
                  <section
                    key={theme.id}
                    id={`theme_${theme.id}`}
                    style={{
                      scrollMarginTop: 110,
                      paddingTop: 6,
                      marginTop: 18,
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        padding: "6px 10px",
                        borderRadius: 12,
                        background: isFlash ? "#eff1f3" : "transparent",
                        transition: "background 220ms ease",
                      }}
                    >
                      <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                        {theme.name}
                      </h2>
                    </div>

                    {items.length ? (
                      <div className={styles.cardsGrid} style={{ marginTop: 16 }}>
                        {items.map((a) => (
                          <button
                            key={a.key}
                            type="button"
                            className={styles.cardBtn}
                            onClick={() => setActiveArticleKey(a.key)}
                            aria-label={a.title}
                          >
                            <h3 className={styles.cardTitle}>{a.title}</h3>

                            <div className={styles.cardMeta}>
                              <span className={styles.tag}>
                                {prefs.find((p) => p.id === a.typeId)?.name ?? `Тип #${a.typeId}`}
                              </span>
                              <span className={styles.tag}>{theme.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      // ✅ как ты просил: под каждой темой, если статей реально нет
                      <p className={styles.muted} style={{ marginTop: 10 }}>
                        По выбранным фильтрам статей нет.
                      </p>
                    )}
                  </section>
                );
              })}
            </>
          )}
        </main>
      </div>
    </div>
  );
}