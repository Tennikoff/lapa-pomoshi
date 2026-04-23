import type { Animal } from "@/src/types/animal";

export const ANIMALS_CHANGED_EVENT = "lp_animals_changed";

const KEY = "lp_animals_v1";

function canUseLS() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ANIMALS_CHANGED_EVENT));
}

function loadAll(): Animal[] {
  if (!canUseLS()) return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Animal[];
  } catch {
    return [];
  }
}

function saveAll(items: Animal[]) {
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

export function listAnimals(ownerUserId: string) {
  return loadAll().filter((a) => a.ownerUserId === ownerUserId);
}

export function getAnimal(id: string) {
  return loadAll().find((a) => a.id === id) ?? null;
}

export function createAnimal(input: Omit<Animal, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const item: Animal = { ...input, id: uid(), createdAt: now, updatedAt: now };
  saveAll([item, ...loadAll()]);
  return item;
}

export function updateAnimal(id: string, patch: Partial<Omit<Animal, "id" | "ownerUserId">>) {
  const all = loadAll();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const next: Animal = {
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

export function deleteAnimal(id: string) {
  saveAll(loadAll().filter((a) => a.id !== id));
}