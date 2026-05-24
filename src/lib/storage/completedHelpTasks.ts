// src/lib/storage/completedHelpTasks.ts
import type { HelpTaskDto } from "@/src/types/helpTask";

export const COMPLETED_HELP_TASKS_CHANGED_EVENT = "lp_completed_help_tasks_changed";

const KEY = "lp_completed_help_tasks_v1";
const MAX_ITEMS_PER_USER = 200;

export type CompletedHelpTaskItem = HelpTaskDto & {
  archivedAt: string; // когда мы поместили в архив (локально)
};

function canUseLS() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COMPLETED_HELP_TASKS_CHANGED_EVENT));
}

type StoreShape = {
  byUserId: Record<string, CompletedHelpTaskItem[]>;
};

function readStore(): StoreShape {
  if (!canUseLS()) return { byUserId: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { byUserId: {} };
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed || typeof parsed !== "object") return { byUserId: {} };
    if (!parsed.byUserId || typeof parsed.byUserId !== "object") return { byUserId: {} };
    return parsed;
  } catch {
    return { byUserId: {} };
  }
}

function writeStore(next: StoreShape) {
  if (!canUseLS()) return;
  localStorage.setItem(KEY, JSON.stringify(next));
  emitChanged();
}

function safeClone<T>(x: T): T {
  // для HelpTaskDto достаточно JSON-клона
  return JSON.parse(JSON.stringify(x)) as T;
}

export function listCompletedHelpTasks(userId: string): CompletedHelpTaskItem[] {
  const id = String(userId || "").trim();
  if (!id) return [];
  const st = readStore();
  return Array.isArray(st.byUserId[id]) ? st.byUserId[id] : [];
}

export function addCompletedHelpTask(userId: string, task: HelpTaskDto) {
  const id = String(userId || "").trim();
  if (!id) return;

  const st = readStore();
  const prev = Array.isArray(st.byUserId[id]) ? st.byUserId[id] : [];

  const item: CompletedHelpTaskItem = {
    ...safeClone(task),
    archivedAt: new Date().toISOString(),
  };

  // dedupe by task.id
  const next = [item, ...prev.filter((x) => x.id !== item.id)].slice(0, MAX_ITEMS_PER_USER);

  st.byUserId[id] = next;
  writeStore(st);
}

export function clearCompletedHelpTasks(userId: string) {
  const id = String(userId || "").trim();
  if (!id) return;

  const st = readStore();
  delete st.byUserId[id];
  writeStore(st);
}