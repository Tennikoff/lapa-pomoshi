import { apiFetch, ApiError } from "@/src/lib/api/http";
import { authHeaders } from "@/src/lib/api/authHeaders";

export type ReferenceBookItemDto = {
  id?: string | number;

  title?: string | null;
  description?: string | null;
  videoUrl?: string | null;
};

type ParamsByNames = { animalType: string; theme: string };

function buildQs(p: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  return sp.toString();
}

function normalizeToArray(res: unknown): ReferenceBookItemDto[] {
  // 1) array
  if (Array.isArray(res)) return res as ReferenceBookItemDto[];

  // 2) { items: [...] }
  if (res && typeof res === "object") {
    const o = res as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as ReferenceBookItemDto[];

    // 3) single article object
    const hasTitle = typeof o.title === "string";
    const hasDesc = typeof o.description === "string";
    if (hasTitle || hasDesc) return [res as ReferenceBookItemDto];
  }

  return [];
}

async function fetchWithOptionalAuth(path: string): Promise<unknown> {
  // пробуем с auth (как и остальные запросы в проекте)
  try {
    return await apiFetch(path, { headers: authHeaders() });
  } catch (e) {
    // если токен битый/просроченный, а ручка публичная — ретраим без Authorization
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      return await apiFetch(path);
    }
    throw e;
  }
}

export const referenceBookApi = {
  /**
   * Реальный бэк (по твоим тестам) принимает:
   * GET /api/ReferenceBook?AnimalType=Кошка&Theme=Кормление
   *
   * ВАЖНО:
   * - AnimalType: ЕД. число (из Dictionaries/animal-types)
   * - Theme: обязателен
   * - Ответ может быть объектом (не массив) => нормализуем в массив из 1 элемента
   */
  listByNames: async (params: ParamsByNames): Promise<ReferenceBookItemDto[]> => {
    const animalType = String(params.animalType ?? "").trim();
    const theme = String(params.theme ?? "").trim();

    const qs = buildQs({
      AnimalType: animalType,
      Theme: theme,
    });

    const res = await fetchWithOptionalAuth(`/api/ReferenceBook?${qs}`);
    return normalizeToArray(res);
  },
};