export const USER_META_CHANGED_EVENT = "lp_user_meta_changed";

const KEY_BY_USER = "lp_user_fullname_by_userid_v1";
const KEY_PENDING_BY_EMAIL = "lp_pending_fullname_by_email_v1";

function canUseLS() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(USER_META_CHANGED_EVENT));
}

function load(key: string): Record<string, string> {
  if (!canUseLS()) return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function save(key: string, map: Record<string, string>) {
  if (!canUseLS()) return;
  localStorage.setItem(key, JSON.stringify(map));
  emitChanged();
}

/** На регистрации: сохраняем ФИО временно по email */
export function setPendingFullNameByEmail(email: string, fullName: string) {
  const e = email.trim().toLowerCase();
  const name = fullName.trim();
  if (!e || !name) return;

  const map = load(KEY_PENDING_BY_EMAIL);
  map[e] = name;
  save(KEY_PENDING_BY_EMAIL, map);
}

/** На confirm-email: забираем ФИО по email (и удаляем из pending) */
export function consumePendingFullNameByEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  const map = load(KEY_PENDING_BY_EMAIL);
  const name = map[e];
  if (!name) return null;

  delete map[e];
  save(KEY_PENDING_BY_EMAIL, map);
  return name;
}

/** Записываем ФИО по userId */
export function setFullNameByUserId(userId: string, fullName: string) {
  const id = userId.trim();
  const name = fullName.trim();
  if (!id || !name) return;

  const map = load(KEY_BY_USER);
  map[id] = name;
  save(KEY_BY_USER, map);
}

/** Читаем ФИО по userId */
export function getFullNameByUserId(userId: string): string | null {
  const id = userId.trim();
  if (!id) return null;

  const map = load(KEY_BY_USER);
  return map[id] ?? null;
}