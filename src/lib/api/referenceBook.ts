import { apiFetch } from "@/src/lib/api/http";
import { authHeaders } from "@/src/lib/api/authHeaders";

export type ReferenceBookItemDto = {
  id?: string | number;

  // чтобы UI мог нормально жить на единых полях
  typeId?: number;
  themeId?: number;

  title?: string | null;
  description?: string | null;

  // по факту бэк отдает videoUrl (судя по твоему ответу 200)
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
  // вариант 1: уже массив
  if (Array.isArray(res)) return res as ReferenceBookItemDto[];

  // вариант 2: { items: [...] }
  if (res && typeof res === "object") {
    const o = res as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as ReferenceBookItemDto[];

    // вариант 3: одиночный объект статьи (как у тебя в тесте)
    // { title, description, videoUrl }
    const maybeTitle = o.title;
    const maybeDesc = o.description;
    if (typeof maybeTitle === "string" || typeof maybeDesc === "string") {
      return [res as ReferenceBookItemDto];
    }
  }

  return [];
}

export const referenceBookApi = {
  /**
   * Реальный бэк (по твоему тесту) принимает:
   * GET /api/ReferenceBook?AnimalType=Кошка&Theme=Кормление
   *
   * ВАЖНО:
   * - AnimalType: ЕД. число (из Dictionaries/animal-types)
   * - Theme: обязателен
   * - Ответ: объект, не массив (но мы нормализуем в массив из 1 элемента)
   */
  listByNames: async (params: ParamsByNames): Promise<ReferenceBookItemDto[]> => {
    const animalType = String(params.animalType ?? "").trim();
    const theme = String(params.theme ?? "").trim();

    const qs = buildQs({
      AnimalType: animalType,
      Theme: theme,
    });

    const res = await apiFetch(`/api/ReferenceBook?${qs}`, { headers: authHeaders() });
    return normalizeToArray(res);
  },
};