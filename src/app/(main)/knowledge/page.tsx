"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./knowledge.module.css";

import taskStyles from "@/src/app/(main)/tasks/tasks.module.css";

import { dictionariesApi, type DictionaryItemDto } from "@/src/lib/api/dictionaries";
import { referenceBookApi, type ReferenceBookItemDto } from "@/src/lib/api/referenceBook";
import { ApiError } from "@/src/lib/api/http";

type OpenDrop = null | "type" | "theme";

type NormalizedArticle = {
  key: string;
  typeId: number;
  themeId: number;
  title: string;
  description: string;
  videoUrl?: string | null;
};

const UI_LS_KEY = "lp_knowledge_ui_v3";
const RB_CACHE_PREFIX = "lp_referenceBook_cache_v3:";
const CACHE_TTL_MS = 5 * 60 * 1000;

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

function normItem(x: ReferenceBookItemDto, idx: number): NormalizedArticle | null {
  const typeId = Number(x.typeId);
  const themeId = Number(x.themeId);
  if (!Number.isFinite(typeId) || !Number.isFinite(themeId)) return null;

  const title = String(x.title ?? "").trim() || "Без названия";
  const description = String(x.description ?? "").trim() || "—";
  const id = x.id != null ? String(x.id) : `rb_${typeId}_${themeId}_${idx}`;

  return {
    key: id,
    typeId,
    themeId,
    title,
    description,
    videoUrl: x.videoUrl ?? null,
  };
}

function rbCacheKey(themeId: number, typeIds: number[]) {
  const sorted = [...typeIds].sort((a, b) => a - b).join(",");
  return `${RB_CACHE_PREFIX}theme=${themeId}|types=${sorted}`;
}

function readRbCache(key: string): NormalizedArticle[] | null {
  if (!canUseLS()) return null;
  const cached = safeJsonParse<{ savedAt: number; items: ReferenceBookItemDto[] }>(localStorage.getItem(key));
  if (!cached?.savedAt || !Array.isArray(cached.items)) return null;
  if (Date.now() - cached.savedAt > CACHE_TTL_MS) return null;

  return (cached.items ?? []).map(normItem).filter(Boolean) as NormalizedArticle[];
}

function writeRbCache(key: string, items: ReferenceBookItemDto[]) {
  if (!canUseLS()) return;
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), items }));
  } catch {
    // ignore
  }
}

function dedupeByKey(items: NormalizedArticle[]) {
  const map = new Map<string, NormalizedArticle>();
  for (const x of items) map.set(x.key, x);
  return Array.from(map.values());
}

export default function KnowledgePage() {
  const [loading, setLoading] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [open, setOpen] = useState<OpenDrop>(null);

  // dictionaries
  const [themes, setThemes] = useState<DictionaryItemDto[]>([]);
  const [prefs, setPrefs] = useState<DictionaryItemDto[]>([]); // preferences: Собаки/Кошки/...
  const [animalTypes, setAnimalTypes] = useState<DictionaryItemDto[]>([]); // animal-types: Собака/Кошка/...

  // filters (по ID)
  const [selectedPrefIds, setSelectedPrefIds] = useState<number[]>([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState<number[]>([]);

  // sidebar active theme
  const [activeThemeId, setActiveThemeId] = useState<number | null>(null);

  // loaded articles for active theme + selected types
  const [articles, setArticles] = useState<NormalizedArticle[]>([]);

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

  // load dictionaries (themes + preferences + animal-types)
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorText(null);

      try {
        const [themesRes, prefsRes, animalTypesRes] = await Promise.all([
          dictionariesApi.themes(),
          dictionariesApi.preferences(), // мн. число
          dictionariesApi.animalTypes(), // ед. число (для ReferenceBook!)
        ]);

        setThemes(themesRes);
        setPrefs(prefsRes);
        setAnimalTypes(animalTypesRes);

        // ✅ если тема не выбрана — выбираем первую
        if (activeThemeId == null && themesRes.length) {
          setActiveThemeId(themesRes[0].id);
        }

        // ✅ если тип не выбран — выбираем первый
        if (!selectedPrefIds.length && prefsRes.length) {
          setSelectedPrefIds([prefsRes[0].id]);
        }
      } catch (e) {
        let msg = "Не удалось загрузить словари медиатеки";
        if (e instanceof ApiError) msg = e.message;
        else if (e instanceof Error) msg = e.message;
        setErrorText(msg);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derived: sidebar themes (учитываем фильтр Тема+)
  const sidebarThemes = useMemo(() => {
    if (!selectedThemeIds.length) return themes;
    const set = new Set(selectedThemeIds);
    return themes.filter((x) => set.has(x.id));
  }, [selectedThemeIds, themes]);

  // если активную тему “вырезали” фильтром тем — переключаем на первую доступную
  useEffect(() => {
    if (!themes.length) return;
    if (!sidebarThemes.length) return;

    if (activeThemeId == null) {
      setActiveThemeId(sidebarThemes[0].id);
      setActiveArticleKey(null);
      return;
    }

    const exists = sidebarThemes.some((x) => x.id === activeThemeId);
    if (!exists) {
      setActiveThemeId(sidebarThemes[0].id);
      setActiveArticleKey(null);
    }
  }, [activeThemeId, sidebarThemes, themes.length]);

  // load articles for active theme + selected types
  useEffect(() => {
    (async () => {
      if (activeThemeId == null) return;
      if (!selectedPrefIds.length) return;

      const themeName = themes.find((t) => t.id === activeThemeId)?.name ?? "";
      if (!themeName) return;

      const cacheKey = rbCacheKey(activeThemeId, selectedPrefIds);
      const cached = readRbCache(cacheKey);
      if (cached) {
        setArticles(cached);
        return;
      }

      setLoadingArticles(true);
      setErrorText(null);

      try {
        const settled = await Promise.allSettled(
          selectedPrefIds.map(async (prefId) => {
            // ReferenceBook принимает AnimalType в ЕД. числе → берем из animal-types по тому же id
            const animalTypeName = animalTypes.find((x) => x.id === prefId)?.name ?? "";
            if (!animalTypeName) return null;

            const res = await referenceBookApi.listByNames({ animalType: animalTypeName, theme: themeName });
            const first = res[0];
            if (!first) return null;

            // обогащаем typeId/themeId (в ответе их нет)
            const dto: ReferenceBookItemDto = {
              id: `rb_${prefId}_${activeThemeId}`,
              typeId: prefId,
              themeId: activeThemeId,
              title: first.title ?? null,
              description: first.description ?? null,
              videoUrl: first.videoUrl ?? null, // ✅ без any
            };

            return dto;
          })
        );

        const rawItems: ReferenceBookItemDto[] = settled
          .filter((x) => x.status === "fulfilled" && x.value)
          .map((x) => (x as PromiseFulfilledResult<ReferenceBookItemDto>).value);

        const normalized = dedupeByKey(rawItems.map(normItem).filter(Boolean) as NormalizedArticle[]);

        setArticles(normalized);
        writeRbCache(cacheKey, rawItems);
      } catch (e) {
        let msg = "Не удалось загрузить статьи медиатеки";
        if (e instanceof ApiError) msg = e.message;
        else if (e instanceof Error) msg = e.message;
        setErrorText(msg);
        setArticles([]);
      } finally {
        setLoadingArticles(false);
      }
    })();
    // ✅ фиксированный размер dependency array
  }, [activeThemeId, selectedPrefIds.join(","), themes.length, animalTypes.length]);

  const activeTheme = useMemo(() => themes.find((x) => x.id === activeThemeId) ?? null, [activeThemeId, themes]);

  const articlesForActiveTheme = useMemo(() => {
    if (!activeThemeId) return [];
    return articles.filter((x) => x.themeId === activeThemeId);
  }, [activeThemeId, articles]);

  const activeArticle = useMemo(() => {
    if (!activeArticleKey) return null;
    return articles.find((x) => x.key === activeArticleKey) ?? null;
  }, [activeArticleKey, articles]);

  const togglePrefId = (id: number) => {
    setSelectedPrefIds((prev) => {
      const has = prev.includes(id);
      // нельзя снять последний тип, иначе не будет что грузить
      if (has && prev.length === 1) return prev;
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const toggleThemeId = (id: number) => {
    setSelectedThemeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p className={styles.muted}>Загрузка…</p>
        </div>
      </div>
    );
  }

  if (errorText) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p className={styles.muted}>{errorText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* SIDEBAR */}
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
                    }}
                  >
                    {th.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* CONTENT */}
        <main className={styles.content}>
          <div className={styles.filtersRow} data-drop-root>
            {/* Вид животного + */}
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

            {/* Тема + */}
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

          <h1 className={styles.sectionTitle}>{activeTheme?.name ?? "Медиатека"}</h1>

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
              {!loadingArticles && articlesForActiveTheme.length === 0 ? (
                <p className={styles.muted}>По выбранным фильтрам статей нет.</p>
              ) : null}

              {articlesForActiveTheme.length ? (
                <div className={styles.cardsGrid}>
                  {articlesForActiveTheme.map((a) => (
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
                        <span className={styles.tag}>
                          {themes.find((t) => t.id === a.themeId)?.name ?? `Тема #${a.themeId}`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}