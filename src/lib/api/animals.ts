import { apiFetch } from "@/src/lib/api/http";
import { authHeaders } from "@/src/lib/api/authHeaders";

export type AnimalOwnerDto = {
  id: string; // uuid
  name: string;
};

export type AnimalDto = {
  id: string; // uuid
  animalType: string;
  breed: string | null;
  name: string;
  age: number | null;
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
 * DTO для создания/обновления (JSON).
 * ВАЖНО: age на бэке number (Int16?), но формы часто дают string.
 */
export type CreateAnimalDto = {
  animalType: string;
  name: string;
  breed?: string | null;
  age?: number | string | null;
  health?: string | null;
  character?: string | null;
  specialNeeds?: string | null;

  // ⚠️ photoUrl JSON бэк сейчас не сохраняет (по тестам).
  // Оставляем в типе только для совместимости/будущего, но в UI больше не используем.
  photoUrl?: string | null;
};

export type UpdateAnimalDto = Partial<CreateAnimalDto>;

function normalizeNullableInt16(age: unknown): number | null | undefined {
  if (age === undefined) return undefined;
  if (age === null) return null;

  if (typeof age === "number") {
    if (!Number.isFinite(age)) return null;
    const n = Math.trunc(age);
    if (n < -32768 || n > 32767) return null;
    return n;
  }

  if (typeof age === "string") {
    const t = age.trim();
    if (!t) return null;
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

/**
 * ВАЖНО: бэк сохраняет фото, если файл отправить через multipart/form-data с ключом "photo"
 * (это подтверждено тестом в swagger-консоли).
 */
function buildAnimalFormData(dto: CreateAnimalDto | UpdateAnimalDto, photoFile: File) {
  const fd = new FormData();

  // кладём только заданные поля (undefined не отправляем)
  const put = (key: string, value: unknown) => {
    if (value === undefined) return;
    if (value === null) return; // null не кладём в form-data
    if (typeof value === "string") {
      const t = value.trim();
      if (!t) return;
      fd.append(key, t);
      return;
    }
    fd.append(key, String(value));
  };

  // в form-data ключи должны совпасть с DTO на бэке
  put("animalType", (dto as CreateAnimalDto).animalType);
  put("name", (dto as CreateAnimalDto).name);
  put("breed", (dto as CreateAnimalDto).breed);
  put("age", (dto as CreateAnimalDto).age);
  put("health", (dto as CreateAnimalDto).health);
  put("character", (dto as CreateAnimalDto).character);
  put("specialNeeds", (dto as CreateAnimalDto).specialNeeds);

  // ✅ ключ файла: "photo"
  fd.append("photo", photoFile);

  return fd;
}

export const animalsApi = {
  my: async (offset = 0, limit = 10): Promise<AnimalsMyResponseDto> => {
    const res = await apiFetch(`/api/Animals/my?offset=${offset}&limit=${limit}`, {
      headers: authHeaders(),
    });
    return res as AnimalsMyResponseDto;
  },

  getById: async (animalId: string): Promise<AnimalDto> => {
    const res = await apiFetch(`/api/Animals/${animalId}`, { headers: authHeaders() });
    return res as AnimalDto;
  },

  // JSON create (без фото)
  create: async (dto: CreateAnimalDto): Promise<AnimalDto> => {
    const bodyDto = normalizeCreateDto(dto);
    const res = await apiFetch("/api/Animals", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(bodyDto),
    });
    return res as AnimalDto;
  },

  // multipart create (с фото)
  createWithPhoto: async (dto: CreateAnimalDto, photoFile: File): Promise<AnimalDto> => {
    const bodyDto = normalizeCreateDto(dto);
    const fd = buildAnimalFormData(bodyDto, photoFile);

    const res = await apiFetch("/api/Animals", {
      method: "POST",
      headers: authHeaders(), // НЕ ставим Content-Type вручную
      body: fd,
    });

    return res as AnimalDto;
  },

  // JSON patch (без фото)
  patch: async (animalId: string, dto: UpdateAnimalDto): Promise<AnimalDto> => {
    const bodyDto = normalizeUpdateDto(dto);
    const res = await apiFetch(`/api/Animals/${animalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(bodyDto),
    });
    return res as AnimalDto;
  },

  // multipart patch (с фото)
  patchWithPhoto: async (animalId: string, dto: UpdateAnimalDto, photoFile: File): Promise<AnimalDto> => {
    const bodyDto = normalizeUpdateDto(dto);
    const fd = buildAnimalFormData(bodyDto, photoFile);

    const res = await apiFetch(`/api/Animals/${animalId}`, {
      method: "PATCH",
      headers: authHeaders(), // НЕ ставим Content-Type вручную
      body: fd,
    });

    return res as AnimalDto;
  },

  delete: async (animalId: string): Promise<void> => {
    await apiFetch(`/api/Animals/${animalId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  byOrganization: async (organizationId: string, offset = 0, limit = 10) => {
    const res = await apiFetch(
      `/api/Animals/organization/${organizationId}?offset=${offset}&limit=${limit}`,
      { headers: authHeaders() }
    );
    return res as unknown;
  },

  byVolunteer: async (volunteerId: string, offset = 0, limit = 10) => {
    const res = await apiFetch(
      `/api/Animals/volunteer/${volunteerId}?offset=${offset}&limit=${limit}`,
      { headers: authHeaders() }
    );
    return res as unknown;
  },
};