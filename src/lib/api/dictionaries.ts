import { apiFetch } from "@/src/lib/api/http";
import { authHeaders } from "@/src/lib/api/authHeaders";

export type DictionaryItemDto = {
  id: number;
  name: string;
};

function isDictionaryItem(x: unknown): x is DictionaryItemDto {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === "number" && typeof o.name === "string";
}

async function getDictionary(path: string): Promise<DictionaryItemDto[]> {
  const res = await apiFetch(path, { headers: authHeaders() });

  if (Array.isArray(res) && res.every(isDictionaryItem)) {
    return res as DictionaryItemDto[];
  }

  if (res && typeof res === "object") {
    const o = res as Record<string, unknown>;
    const items = o.items;
    if (Array.isArray(items) && items.every(isDictionaryItem)) return items as DictionaryItemDto[];
  }

  return [];
}

export const dictionariesApi = {
  locations: () => getDictionary("/api/Dictionaries/locations"),
  competencies: () => getDictionary("/api/Dictionaries/competencies"),
  availabilities: () => getDictionary("/api/Dictionaries/availabilities"),
  preferences: () => getDictionary("/api/Dictionaries/preferences"),
  constantNeeds: () => getDictionary("/api/Dictionaries/constant-needs"),
  animalTypes: () => getDictionary("/api/Dictionaries/animal-types"),
  themes: () => getDictionary("/api/Dictionaries/themes"),
  statuses: () => getDictionary("/api/Dictionaries/statuses"),
};