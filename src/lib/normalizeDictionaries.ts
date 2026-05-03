// ===== AVAILABILITIES =====
// Бэк принимает только словарные значения:
// "Понедельник"..."Воскресенье", "Утро", "День", "Вечер"
export const AVAILABILITY_TO_API: Record<string, string> = {
  // дни недели (на всякий случай поддержим и короткие, и длинные)
  Пн: "Понедельник",
  Вт: "Вторник",
  Ср: "Среда",
  Чт: "Четверг",
  Пт: "Пятница",
  Сб: "Суббота",
  Вс: "Воскресенье",

  Понедельник: "Понедельник",
  Вторник: "Вторник",
  Среда: "Среда",
  Четверг: "Четверг",
  Пятница: "Пятница",
  Суббота: "Суббота",
  Воскресенье: "Воскресенье",

  // части дня (UI -> API)
  "Утром": "Утро",
  Утро: "Утро",

  "Днём": "День",
  День: "День",

  "Вечером": "Вечер",
  Вечер: "Вечер",
};

// Что показывать в UI, когда пришло из API
// (оставляем дни недели как есть, меняем только части дня)
export const AVAILABILITY_TO_UI: Record<string, string> = {
  Утро: "Утром",
  День: "Днём",
  Вечер: "Вечером",

  Понедельник: "Понедельник",
  Вторник: "Вторник",
  Среда: "Среда",
  Четверг: "Четверг",
  Пятница: "Пятница",
  Суббота: "Суббота",
  Воскресенье: "Воскресенье",
};

export function normalizeAvailabilities(values: string[]): string[] {
  return values
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => AVAILABILITY_TO_API[v] ?? v);
}

export function denormalizeAvailabilities(values: string[]): string[] {
  return values
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => AVAILABILITY_TO_UI[v] ?? v);
}

// ===== PREFERENCES (животные) =====
// Бэк валидирует preferences по /api/Dictionaries/preferences (мн. число)
export const PREFERENCES_TO_API: Record<string, string> = {
  // на случай старых/кривых лейблов
  "Кролик и": "Кролики",
  Кролик: "Кролики",

  "Собак и": "Собаки",
  Собака: "Собаки",

  Хорёк: "Хорьки",
  Хорек: "Хорьки",
};

export function normalizePreferences(values: string[]): string[] {
  return values
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => PREFERENCES_TO_API[v] ?? v);
}

export function denormalizePreferences(values: string[]): string[] {
  // UI сейчас показывает те же строки, что словарь (мн. число)
  return values.map((v) => v.trim()).filter(Boolean);
}