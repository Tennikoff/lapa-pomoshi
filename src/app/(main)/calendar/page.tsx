"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import styles from "./calendar.module.css";

import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { isOrgRole } from "@/src/lib/role";
import { helpTasksApi } from "@/src/lib/api/helpTasks";
import type { HelpTaskDto, HelpTasksListDto } from "@/src/types/helpTask";
import { ApiError } from "@/src/lib/api/http";

// карточки должны быть 1-в-1 как в ленте задач у волонтера
import { TaskCard } from "@/src/app/(main)/tasks/_components/TaskCard";

// ✅ берем сетку/стили из ленты задач
import tasksFeedStyles from "@/src/app/(main)/tasks/tasks.module.css";

const HELP_TASKS_CHANGED_EVENT = "lp_help_tasks_changed";

// Чтобы не тащить бесконечно много (на всякий случай)
const PAGE_SIZE = 50;
const MAX_TOTAL = 500;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function parseISO(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function capitalizeFirstRu(s: string) {
  const t = s.trim();
  if (!t) return t;
  return t[0].toLocaleUpperCase("ru-RU") + t.slice(1);
}

function formatMonthTitle(d: Date) {
  // “Апрель 2025”
  return capitalizeFirstRu(d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }));
}

function formatSelectedTitle(d: Date) {
  // “9 апреля 2025”
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getMonthStart(current: Date) {
  return new Date(current.getFullYear(), current.getMonth(), 1);
}

function getMonthEnd(current: Date) {
  // последний день месяца
  return new Date(current.getFullYear(), current.getMonth() + 1, 0);
}

// Пн=0 ... Вс=6
function mondayIndex(jsDay: number) {
  return (jsDay + 6) % 7;
}

type TaskRange = {
  task: HelpTaskDto;
  start: Date; // startOfDay
  end: Date; // startOfDay
};

async function loadAllMyTasks(isOrg: boolean): Promise<HelpTaskDto[]> {
  const all: HelpTaskDto[] = [];
  let offset = 0;

  while (all.length < MAX_TOTAL) {
    const res: HelpTasksListDto = isOrg
      ? await helpTasksApi.myCreated(offset, PAGE_SIZE)
      : await helpTasksApi.myWorking(offset, PAGE_SIZE);

    const chunk = res.tasks ?? [];
    all.push(...chunk);

    if (!res.hasMore) break;

    offset += PAGE_SIZE;
    // защита: если бэк внезапно начал возвращать hasMore=true, но tasks=[]
    if (!chunk.length) break;
  }

  return all.slice(0, MAX_TOTAL);
}

// ✅ CSS vars из tasks.module.css (.page), чтобы TaskCard выглядел 1-в-1 как в ленте
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

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [meRoleOrg, setMeRoleOrg] = useState<boolean | null>(null);
  const [items, setItems] = useState<HelpTaskDto[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfDay(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(() => startOfDay(new Date()));

  const reload = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setErrorText(null);

    try {
      const me = await fetchCurrentProfile();
      if (!me) {
        setItems([]);
        setMeRoleOrg(null);
        return;
      }

      const org = isOrgRole(me.role);
      setMeRoleOrg(org);

      const tasks = await loadAllMyTasks(org);
      setItems(tasks);
    } catch (e) {
      let msg = "Не удалось загрузить календарь";
      if (e instanceof ApiError) msg = e.message;
      else if (e instanceof Error) msg = e.message;
      setErrorText(msg);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  // init
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // автообновление после create/update/delete задач
  useEffect(() => {
    const onChanged = () => {
      // тихо перезагрузим, без глобального "Загрузка…"
      reload({ silent: true });
    };
    window.addEventListener(HELP_TASKS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(HELP_TASKS_CHANGED_EVENT, onChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // если перелистнули месяц — selectedDay остаётся в этом месяце
  useEffect(() => {
    const ms = getMonthStart(currentMonth);
    const me = getMonthEnd(currentMonth);
    const sel = selectedDay;
    if (sel < startOfDay(ms) || sel > startOfDay(me)) {
      setSelectedDay(startOfDay(ms));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const monthStart = useMemo(() => startOfDay(getMonthStart(currentMonth)), [currentMonth]);
  const monthEnd = useMemo(() => startOfDay(getMonthEnd(currentMonth)), [currentMonth]);

  // нормализуем задачи в диапазоны по дням
  const ranges: TaskRange[] = useMemo(() => {
    const out: TaskRange[] = [];
    for (const t of items) {
      const a = parseISO(t.startedAt);
      const b = parseISO(t.endedAt);
      if (!a || !b) continue;
      const sa = startOfDay(a);
      const sb = startOfDay(b);
      const start = sa <= sb ? sa : sb;
      const end = sa <= sb ? sb : sa;
      out.push({ task: t, start, end });
    }
    return out;
  }, [items]);

  // набор дней месяца, которые надо подсветить
  const monthEventDays = useMemo(() => {
    const set = new Set<string>();
    for (const r of ranges) {
      const from = r.start > monthStart ? r.start : monthStart;
      const to = r.end < monthEnd ? r.end : monthEnd;
      if (from > to) continue;
      for (let d = from; d <= to; d = addDays(d, 1)) {
        set.add(dayKey(d));
      }
    }
    return set;
  }, [ranges, monthStart, monthEnd]);

  // задачи для выбранного дня: всё, что покрывает этот день
  const tasksForSelectedDay = useMemo(() => {
    const sel = startOfDay(selectedDay);
    const list = ranges.filter((r) => sel >= r.start && sel <= r.end).map((r) => r.task);
    list.sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
    return list;
  }, [ranges, selectedDay]);

  // сетка 6 недель (42 ячейки)
  const calendarCells = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const first = new Date(y, m, 1);
    const daysInMonth = getMonthEnd(currentMonth).getDate();
    const offset = mondayIndex(first.getDay());
    const cells: Array<Date | null> = [];
    for (let i = 0; i < 42; i++) {
      const dayNum = i - offset + 1;
      if (dayNum < 1 || dayNum > daysInMonth) cells.push(null);
      else cells.push(new Date(y, m, dayNum));
    }
    return cells;
  }, [currentMonth]);

  const onPrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const onNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p className={styles.muted}>Загрузка…</p>
        </div>
      </div>
    );
  }

  if (meRoleOrg === null) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Календарь</h2>
          <p className={styles.muted}>Войдите в аккаунт, чтобы увидеть свои задачи в календаре.</p>
        </div>
      </div>
    );
  }

  const selKey = dayKey(selectedDay);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.calendarWidget}>
          <div className={styles.calendarHeader}>
            <h2 className={styles.monthTitle}>{formatMonthTitle(currentMonth)}</h2>
            <div className={styles.nav}>
              <button type="button" className={styles.navBtn} onClick={onPrevMonth} aria-label="Предыдущий месяц">
                ←
              </button>
              <button type="button" className={styles.navBtn} onClick={onNextMonth} aria-label="Следующий месяц">
                →
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.weekday}>ПН</div>
            <div className={styles.weekday}>ВТ</div>
            <div className={styles.weekday}>СР</div>
            <div className={styles.weekday}>ЧТ</div>
            <div className={styles.weekday}>ПТ</div>
            <div className={styles.weekday}>СБ</div>
            <div className={styles.weekday}>ВС</div>

            {calendarCells.map((d, idx) => {
              if (!d) return <div key={idx} className={styles.dayEmpty} />;
              const k = dayKey(d);
              const hasEvent = monthEventDays.has(k);
              const isSelected = k === selKey;
              const className = [styles.dayBtn, hasEvent ? styles.dayHasEvent : "", isSelected ? styles.daySelected : ""]
                .filter(Boolean)
                .join(" ");

              return (
                <button key={k} type="button" className={className} onClick={() => setSelectedDay(startOfDay(d))}>
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <h3 className={styles.sectionTitle}>Задачи на {formatSelectedTitle(selectedDay)}</h3>
        {errorText ? <p className={styles.muted}>{errorText}</p> : null}

        {!errorText && tasksForSelectedDay.length === 0 ? (
          <p className={styles.muted}>На этот день задач нет.</p>
        ) : !errorText ? (
          // ✅ вот здесь карточки теперь выглядят 1-в-1 как в ленте задач волонтёра
          <div className={tasksFeedStyles.cardsGrid} style={TASK_VARS}>
            {tasksForSelectedDay.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                mode="volunteer" // внешний вид как в ленте задач волонтёра + кликабельность
                onEdit={() => {}}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}