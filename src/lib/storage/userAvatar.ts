export const USER_AVATAR_CHANGED_EVENT = "lp_user_avatar_changed";

const KEY = "lp_user_avatar_by_userid_v1";

function canUseLS() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(USER_AVATAR_CHANGED_EVENT));
}

function loadMap(): Record<string, string> {
  if (!canUseLS()) return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveMap(map: Record<string, string>) {
  if (!canUseLS()) return;
  localStorage.setItem(KEY, JSON.stringify(map));
  emitChanged();
}

export function getUserAvatar(userId: string): string | null {
  const id = userId.trim();
  if (!id) return null;
  const map = loadMap();
  return map[id] ?? null;
}

export function setUserAvatar(userId: string, dataUrl: string | null) {
  const id = userId.trim();
  if (!id) return;

  const map = loadMap();

  if (!dataUrl) {
    delete map[id];
    saveMap(map);
    return;
  }

  map[id] = dataUrl;
  saveMap(map);
}