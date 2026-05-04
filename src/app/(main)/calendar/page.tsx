"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./calendar.module.css";

import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { isOrgRole } from "@/src/lib/role";
import { helpTasksApi } from "@/src/lib/api/helpTasks";
import type { HelpTaskDto } from "@/src/types/helpTask";

// карточки должны быть 1-в-1 как в ленте задач у волонтера
import { TaskCard } from "@/src/app/(main)/tasks/_components/TaskCard";

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
  return capitalizeFirstRu(
    d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
  );
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

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [meRoleOrg, setMeRoleOrg] = useState<boolean | null>(null);
  const [items, setItems] = useState<HelpTaskDto[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(() =>
    startOfDay(new Date())
  );
  const [selectedDay, setSelectedDay] = useState<Date>(() =>
    startOfDay(new Date())
  );

  // 1) грузим список задач “моих” в зависимости от роли
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const me = await fetchCurrentProfile();
        if (!me) {
          setItems([]);
          setMeRoleOrg(null);
          return;
        }

        const org = isOrgRole(me.role);
        setMeRoleOrg(org);

        // MVP: берём первой пачкой (можно потом сделать пагинацию по hasMore)
        const res = org
          ? await helpTasksApi.myCreated(0, 200)
          : await helpTasksApi.myWorking(0, 200);

        setItems(res.tasks ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) если перелистнули месяц — selectedDay остаётся в этом месяце
  useEffect(() => {
    const ms = getMonthStart(currentMonth);
    const me = getMonthEnd(currentMonth);
    const sel = selectedDay;

    if (sel < startOfDay(ms) || sel > startOfDay(me)) {
      setSelectedDay(startOfDay(ms));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const monthStart = useMemo(
    () => startOfDay(getMonthStart(currentMonth)),
    [currentMonth]
  );
  const monthEnd = useMemo(
    () => startOfDay(getMonthEnd(currentMonth)),
    [currentMonth]
  );

  // нормализуем задачи в диапазоны по дням
  const ranges: TaskRange[] = useMemo(() => {
    const out: TaskRange[] = [];

    for (const t of items) {
      const a = parseISO(t.startedAt);
      const b = parseISO(t.endedAt);
      if (!a || !b) continue;

      const sa = startOfDay(a);
      const sb = startOfDay(b);

      // на случай кривых данных: если endedAt раньше startedAt
      const start = sa <= sb ? sa : sb;
      const end = sa <= sb ? sb : sa;

      out.push({ task: t, start, end });
    }

    return out;
  }, [items]);

  // набор дней месяца, которые надо подсветить (есть хотя бы 1 задача в этот день)
  const monthEventDays = useMemo(() => {
    const set = new Set<string>();

    for (const r of ranges) {
      // пересечение с текущим месяцем
      const from = r.start > monthStart ? r.start : monthStart;
      const to = r.end < monthEnd ? r.end : monthEnd;
      if (from > to) continue;

      for (let d = from; d <= to; d = addDays(d, 1)) {
        set.add(dayKey(d));
      }
    }

    return set;
  }, [ranges, monthStart, monthEnd]);

  // задачи/передержки для выбранного дня: всё, что покрывает этот день
  const tasksForSelectedDay = useMemo(() => {
    const sel = startOfDay(selectedDay);

    const list = ranges
      .filter((r) => sel >= r.start && sel <= r.end)
      .map((r) => r.task);

    list.sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
    return list;
  }, [ranges, selectedDay]);

  // сетка 6 недель (42 ячейки) — UI не прыгает
  const calendarCells = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();

    const first = new Date(y, m, 1);
    const daysInMonth = getMonthEnd(currentMonth).getDate();
    const offset = mondayIndex(first.getDay()); // сколько пустых ячеек до 1-го числа

    const cells: Array<Date | null> = [];
    for (let i = 0; i < 42; i++) {
      const dayNum = i - offset + 1;
      if (dayNum < 1 || dayNum > daysInMonth) cells.push(null);
      else cells.push(new Date(y, m, dayNum));
    }
    return cells;
  }, [currentMonth]);

  const onPrevMonth = () => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(d);
  };

  const onNextMonth = () => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(d);
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

  if (meRoleOrg === null) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Календарь</h2>
          <p className={styles.muted}>
            Войдите в аккаунт, чтобы увидеть свои задачи в календаре.
          </p>
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

              const k = dayKey(d);
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
                  onClick={() => setSelectedDay(startOfDay(d))}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <h3 className={styles.sectionTitle}>
          Задачи на {formatSelectedTitle(selectedDay)}
        </h3>

        {tasksForSelectedDay.length === 0 ? (
          <p className={styles.muted}>На этот день задач нет.</p>
        ) : (
          <div className={styles.cardsWrap}>
            {tasksForSelectedDay.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                mode="volunteer"
                onEdit={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}