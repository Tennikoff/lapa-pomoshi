import { apiFetch } from "@/src/lib/api/http";
import { authHeaders } from "@/src/lib/api/authHeaders";

/**
 * Swagger:
 * GET /api/Dictionaries/locations
 * GET /api/Dictionaries/competencies
 * GET /api/Dictionaries/availabilities
 * GET /api/Dictionaries/preferences
 * GET /api/Dictionaries/constant-needs
 * GET /api/Dictionaries/animal-types
 * GET /api/Dictionaries/themes
 * GET /api/Dictionaries/statuses
 *
 * Ответы в swagger не описаны, поэтому возвращаем string[] "как есть".
 */

async function getStringArray(path: string): Promise<string[]> {
  const res = await apiFetch(path, { headers: authHeaders() });
  if (Array.isArray(res) && res.every((x) => typeof x === "string")) return res as string[];
  // если бэк вернёт объект вида { items: [...] } — поправим после первого реального ответа
  return [];
}

export const dictionariesApi = {
  locations: () => getStringArray("/api/Dictionaries/locations"),
  competencies: () => getStringArray("/api/Dictionaries/competencies"),
  availabilities: () => getStringArray("/api/Dictionaries/availabilities"),
  preferences: () => getStringArray("/api/Dictionaries/preferences"),
  constantNeeds: () => getStringArray("/api/Dictionaries/constant-needs"),
  animalTypes: () => getStringArray("/api/Dictionaries/animal-types"),
  themes: () => getStringArray("/api/Dictionaries/themes"),
  statuses: () => getStringArray("/api/Dictionaries/statuses"),
};