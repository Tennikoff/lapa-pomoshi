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
  if (Array.isArray(res)) return res as ReferenceBookItemDto[];

  if (res && typeof res === "object") {
    const o = res as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as ReferenceBookItemDto[];

    const hasTitle = typeof o.title === "string";
    const hasDesc = typeof o.description === "string";
    if (hasTitle || hasDesc) return [res as ReferenceBookItemDto];
  }

  return [];
}

async function fetchWithOptionalAuth(path: string): Promise<unknown> {
  try {
    return await apiFetch(path, { headers: authHeaders() });
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      return await apiFetch(path);
    }
    throw e;
  }
}

export const referenceBookApi = {
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