import type { Task, TaskResponse } from "@/src/types/task";

export const TASKS_CHANGED_EVENT = "lp_tasks_changed";
const KEY = "lp_tasks_v1";

function canUseLS() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
function emitChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TASKS_CHANGED_EVENT));
}
function loadAll(): Task[] {
  if (!canUseLS()) return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Task[];
  } catch {
    return [];
  }
}
function saveAll(items: Task[]) {
  if (!canUseLS()) return;
  localStorage.setItem(KEY, JSON.stringify(items));
  emitChanged();
}
function uid() {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function listTasks(): Task[] {
  return loadAll();
}

export function listTasksByCreator(userId: string): Task[] {
  const id = userId.trim();
  return loadAll().filter((t) => t.creatorUserId === id);
}

export function getTask(id: string): Task | null {
  return loadAll().find((t) => t.id === id) ?? null;
}

export function createTask(
  input: Omit<Task, "id" | "createdAt" | "updatedAt" | "responses" | "status"> & {
    status?: Task["status"];
  }
): Task {
  const now = new Date().toISOString();
  const item: Task = {
    ...input,
    id: uid(),
    status: input.status ?? "active",
    responses: [],
    createdAt: now,
    updatedAt: now,
  };
  saveAll([item, ...loadAll()]);
  return item;
}

export function updateTask(
  id: string,
  patch: Partial<Omit<Task, "id" | "creatorUserId" | "createdAt">>
): Task | null {
  const all = loadAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const next: Task = {
    ...all[idx],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };

  const copy = [...all];
  copy[idx] = next;
  saveAll(copy);
  return next;
}

export function deleteTask(id: string) {
  saveAll(loadAll().filter((t) => t.id !== id));
}

export function respondToTask(taskId: string, userId: string) {
  const t = getTask(taskId);
  if (!t) return { ok: false as const, reason: "TASK_NOT_FOUND" as const };

  const exists = t.responses.some((r) => r.userId === userId && r.status !== "withdrawn");
  if (exists) return { ok: false as const, reason: "ALREADY" as const };

  const now = new Date().toISOString();
  const response: TaskResponse = {
    userId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  updateTask(taskId, { responses: [response, ...t.responses] });
  return { ok: true as const };
}

export function countResponses(t: Task) {
  return t.responses.filter((r) => r.status === "pending").length;
}