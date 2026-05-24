"use client";

import Link from "next/link";
import profileStyles from "@/src/app/(main)/profile/profile.module.css";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import styles from "./calendar.module.css";

import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { isOrgRole } from "@/src/lib/role";
import { helpTasksApi } from "@/src/lib/api/helpTasks";
import type { HelpTaskDto, HelpTasksListDto } from "@/src/types/helpTask";
import { ApiError } from "@/src/lib/api/http";

import { TaskCard } from "@/src/app/(main)/tasks/_components/TaskCard";
import tasksFeedStyles from "@/src/app/(main)/tasks/tasks.module.css";

const HELP_TASKS_CHANGED_EVENT = "lp_help_tasks_changed";

const PAGE_SIZE = 50;
const MAX_TOTAL = 500;

function startOfDayLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDaysLocal(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function dayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function dayKeyFromISO_UTC(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function dayKeyFromISO_Local(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return dayKeyLocal(d);
}

function keyToUtcDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function addDaysKey(key: string, days: number) {
  const dt = keyToUtcDate(key);
  dt.setUTCDate(dt.getUTCDate() + days);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function normalizeRangeKeys(a: string, b: string): { startKey: string; endKey: string } {
  return a <= b ? { startKey: a, endKey: b } : { startKey: b, endKey: a };
}

function capitalizeFirstRu(s: string) {
  const t = s.trim();
  if (!t) return t;
  return t[0].toLocaleUpperCase("ru-RU") + t.slice(1);
}

function formatMonthTitle(d: Date) {
  return capitalizeFirstRu(
    d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
  );
}

function formatSelectedTitle(d: Date) {
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
  return new Date(current.getFullYear(), current.getMonth() + 1, 0);
}

function mondayIndex(jsDay: number) {
  return (jsDay + 6) % 7;
}

type TaskRange = {
  task: HelpTaskDto;
  startKey: string;
  endKey: string;
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

    if (!chunk.length) break;
  }

  return all.slice(0, MAX_TOTAL);
}

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

  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfDayLocal(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(() => startOfDayLocal(new Date()));

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

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    const onChanged = () => reload({ silent: true });
    window.addEventListener(HELP_TASKS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(HELP_TASKS_CHANGED_EVENT, onChanged);
  }, []);

  useEffect(() => {
    const ms = startOfDayLocal(getMonthStart(currentMonth));
    const me = startOfDayLocal(getMonthEnd(currentMonth));
    const sel = selectedDay;

    if (sel < ms || sel > me) {
      setSelectedDay(ms);
    }
  }, [currentMonth]);

  const monthStart = useMemo(
    () => startOfDayLocal(getMonthStart(currentMonth)),
    [currentMonth]
  );

  const monthEnd = useMemo(
    () => startOfDayLocal(getMonthEnd(currentMonth)),
    [currentMonth]
  );

  const ranges: TaskRange[] = useMemo(() => {
    const out: TaskRange[] = [];

    for (const tsk of items) {
      const aKey = tsk.isTaskOverexposure
        ? dayKeyFromISO_UTC(tsk.startedAt)
        : dayKeyFromISO_Local(tsk.startedAt);

      const bKey = tsk.isTaskOverexposure
        ? dayKeyFromISO_UTC(tsk.endedAt)
        : dayKeyFromISO_Local(tsk.endedAt);

      if (!aKey || !bKey) continue;

      const { startKey, endKey } = normalizeRangeKeys(aKey, bKey);
      out.push({ task: tsk, startKey, endKey });
    }

    return out;
  }, [items]);

  const monthEventDays = useMemo(() => {
    const set = new Set<string>();

    const msKey = dayKeyLocal(monthStart);
    const meKey = dayKeyLocal(monthEnd);

    for (const r of ranges) {
      const from = r.startKey > msKey ? r.startKey : msKey;
      const to = r.endKey < meKey ? r.endKey : meKey;
      if (from > to) continue;

      for (let k = from; k <= to; k = addDaysKey(k, 1)) {
        set.add(k);
      }
    }

    return set;
  }, [ranges, monthStart, monthEnd]);

  const tasksForSelectedDay = useMemo(() => {
    const selKey = dayKeyLocal(selectedDay);

    const list = ranges
      .filter((r) => selKey >= r.startKey && selKey <= r.endKey)
      .map((r) => r.task);

    list.sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
    return list;
  }, [ranges, selectedDay]);

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

  const onPrevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const onNextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

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
      <div className={profileStyles.page}>
        <div className={profileStyles.centerScreen}>
          <div className={profileStyles.centerBox}>
            <h2 style={{ margin: "0 0 6px" }}>Вы не вошли в аккаунт</h2>
            <p style={{ color: "#6C757D", margin: 0 }}>
              Войдите, чтобы увидеть календарь.
            </p>

            <Link
              href="/login"
              className={`${profileStyles.btnLarge} ${profileStyles.btnLogin}`}
            >
              ВОЙТИ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selKey = dayKeyLocal(selectedDay);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.calendarWidget}>
          <div className={styles.calendarHeader}>
            <h2 className={styles.monthTitle}>{formatMonthTitle(currentMonth)}</h2>
            <div className={styles.nav}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={onPrevMonth}
                aria-label="Предыдущий месяц"
              >
                ←
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={onNextMonth}
                aria-label="Следующий месяц"
              >
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

              const k = dayKeyLocal(d);
              const hasEvent = monthEventDays.has(k);
              const isSelected = k === selKey;

              const className = [
                styles.dayBtn,
                hasEvent ? styles.dayHasEvent : "",
                isSelected ? styles.daySelected : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={k}
                  type="button"
                  className={className}
                  onClick={() => setSelectedDay(startOfDayLocal(d))}
                >
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
          <div className={tasksFeedStyles.cardsGrid} style={TASK_VARS}>
            {tasksForSelectedDay.map((tsk) => (
              <TaskCard key={tsk.id} task={tsk} mode="volunteer" onEdit={() => {}} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}