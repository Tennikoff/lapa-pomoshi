export const ONBOARDING_CHANGED_EVENT = "lp_onboarding_changed";
const KEY = "lp_onboarding_done_v1";

function canUseLS() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ONBOARDING_CHANGED_EVENT));
}

function loadMap(): Record<string, boolean> {
  if (!canUseLS()) return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveMap(map: Record<string, boolean>) {
  if (!canUseLS()) return;
  localStorage.setItem(KEY, JSON.stringify(map));
  emitChanged();
}

export function isOnboardingDone(userId: string): boolean {
  const map = loadMap();
  return Boolean(map[userId]);
}

export function setOnboardingDone(userId: string, done: boolean) {
  const map = loadMap();
  map[userId] = done;
  saveMap(map);
}