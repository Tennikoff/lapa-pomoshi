export const VOLUNTEER_EXTRA_CHANGED_EVENT = "lp_volunteer_extra_changed";

export type VolunteerExtra = {
  about: string;
  competencies: string[];
  availability: string[];
  prefAnimals: string[];
  prefInteraction: string[];
  city: string;
  districts: string[];
};

const KEY = "lp_volunteer_extra_v1";

function canUseLS() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(VOLUNTEER_EXTRA_CHANGED_EVENT));
}

function loadMap(): Record<string, VolunteerExtra> {
  if (!canUseLS()) return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function saveMap(map: Record<string, VolunteerExtra>) {
  if (!canUseLS()) return;
  localStorage.setItem(KEY, JSON.stringify(map));
  emitChanged();
}

export function getVolunteerExtra(userId: string): VolunteerExtra | null {
  return loadMap()[userId] ?? null;
}

export function setVolunteerExtra(userId: string, extra: VolunteerExtra) {
  const map = loadMap();
  map[userId] = extra;
  saveMap(map);
}