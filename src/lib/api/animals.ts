import { apiFetch } from "@/src/lib/api/http";
import { authHeaders } from "@/src/lib/api/authHeaders";

export type AnimalOwnerDto = {
  id: string; // uuid
  name: string;
};

export type AnimalDto = {
  id: string; // uuid
  animalType: string; // "Собака"
  breed: string | null;
  name: string;
  age: number | null; // ✅ бэк ожидает short?
  health: string | null;
  character: string | null;
  specialNeeds: string | null;
  photoUrl: string | null;
  owners: AnimalOwnerDto[];
};

export type AnimalListItemDto = {
  id: string; // uuid
  name: string;
  photoUrl: string | null;
};

export type AnimalsMyResponseDto = {
  animals: AnimalListItemDto[];
  offset: number;
  limit: number;
  hasMore: boolean;
};

/**
 * DTO для создания животного.
 * ВАЖНО: age на бэке short? (Int16?), но формы у тебя сейчас отдают строку.
 * Поэтому тип допускает string | number, а перед отправкой мы нормализуем в number|null.
 */
export type CreateAnimalDto = {
  animalType: string;
  name: string;
  breed?: string | null;
  age?: number | string | null; // ✅ допускаем string, чтобы не краснели формы
  health?: string | null;
  character?: string | null;
  specialNeeds?: string | null;
  photoUrl?: string | null;
};

export type UpdateAnimalDto = Partial<CreateAnimalDto>;

/** Нормализация значения возраста в number|null|undefined, чтобы бэк не падал на "age": "1" */
function normalizeNullableInt16(age: unknown): number | null | undefined {
  if (age === undefined) return undefined;
  if (age === null) return null;

  // number
  if (typeof age === "number") {
    if (!Number.isFinite(age)) return null;
    const n = Math.trunc(age);
    // int16 range check (на всякий)
    if (n < -32768 || n > 32767) return null;
    return n;
  }

  // string
  if (typeof age === "string") {
    const t = age.trim();
    if (!t) return null;
    // только целое число
    if (!/^-?\d+$/.test(t)) return null;

    const n = Number(t);
    if (!Number.isFinite(n)) return null;

    const nn = Math.trunc(n);
    if (nn < -32768 || nn > 32767) return null;

    return nn;
  }

  return null;
}

function normalizeCreateDto(dto: CreateAnimalDto): CreateAnimalDto {
  return {
    ...dto,
    age: normalizeNullableInt16(dto.age),
  };
}

function normalizeUpdateDto(dto: UpdateAnimalDto): UpdateAnimalDto {
  return {
    ...dto,
    age: normalizeNullableInt16(dto.age),
  };
}

export const animalsApi = {
  // GET /api/Animals/my
  my: async (offset = 0, limit = 10): Promise<AnimalsMyResponseDto> => {
    const res = await apiFetch(`/api/Animals/my?offset=${offset}&limit=${limit}`, {
      headers: authHeaders(),
    });
    return res as AnimalsMyResponseDto;
  },

  // GET /api/Animals/{animalId}
  getById: async (animalId: string): Promise<AnimalDto> => {
    const res = await apiFetch(`/api/Animals/${animalId}`, {
      headers: authHeaders(),
    });
    return res as AnimalDto;
  },

  // POST /api/Animals
  create: async (dto: CreateAnimalDto): Promise<AnimalDto> => {
    const bodyDto = normalizeCreateDto(dto);

    const res = await apiFetch("/api/Animals", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(bodyDto),
    });

    return res as AnimalDto;
  },

  // PATCH /api/Animals/{animalId}
  patch: async (animalId: string, dto: UpdateAnimalDto): Promise<AnimalDto> => {
    const bodyDto = normalizeUpdateDto(dto);

    const res = await apiFetch(`/api/Animals/${animalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(bodyDto),
    });

    return res as AnimalDto;
  },

  // DELETE /api/Animals/{animalId}
  delete: async (animalId: string): Promise<void> => {
    await apiFetch(`/api/Animals/${animalId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  // GET /api/Animals/organization/{organizationId}
  byOrganization: async (organizationId: string, offset = 0, limit = 10) => {
    const res = await apiFetch(
      `/api/Animals/organization/${organizationId}?offset=${offset}&limit=${limit}`,
      { headers: authHeaders() }
    );
    return res as unknown;
  },

  // GET /api/Animals/volunteer/{volunteerId}
  byVolunteer: async (volunteerId: string, offset = 0, limit = 10) => {
    const res = await apiFetch(
      `/api/Animals/volunteer/${volunteerId}?offset=${offset}&limit=${limit}`,
      { headers: authHeaders() }
    );
    return res as unknown;
  },
};