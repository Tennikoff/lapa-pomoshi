export const AVAILABILITY_TO_API: Record<string, string> = {
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

  "Утром": "Утро",
  Утро: "Утро",

  "Днём": "День",
  День: "День",

  "Вечером": "Вечер",
  Вечер: "Вечер",
};

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

export const PREFERENCES_TO_API: Record<string, string> = {
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
  return values.map((v) => v.trim()).filter(Boolean);
}