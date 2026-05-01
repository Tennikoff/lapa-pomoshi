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
  age: string | null;
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
 * Мы уже выяснили минимально обязательные поля:
 * - animalType (обяз.)
 * - name (обяз.)
 *
 * Остальные — опционально (бэк принимает null).
 */
export type CreateAnimalDto = {
  animalType: string;
  name: string;
  breed?: string | null;
  age?: string | null;
  health?: string | null;
  character?: string | null;
  specialNeeds?: string | null;
  photoUrl?: string | null;
};

export type UpdateAnimalDto = Partial<CreateAnimalDto>;

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
    const res = await apiFetch("/api/Animals", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(dto),
    });

    return res as AnimalDto;
  },

  // PATCH /api/Animals/{animalId}
  patch: async (animalId: string, dto: UpdateAnimalDto): Promise<AnimalDto> => {
    const res = await apiFetch(`/api/Animals/${animalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(dto),
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
    const res = await apiFetch(`/api/Animals/volunteer/${volunteerId}?offset=${offset}&limit=${limit}`, {
      headers: authHeaders(),
    });
    return res as unknown;
  },
};