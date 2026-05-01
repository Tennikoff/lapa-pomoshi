export type HelpTaskCreatorDto = {
  id: string; // uuid
  name: string;
};

export type HelpTaskAnimalDto = {
  id: string; // uuid
  name: string;
  photoUrl: string | null;
};

export type HelpTaskWorkerDto = {
  id: string; // uuid
  name: string;
};

export type HelpTaskDto = {
  id: string; // uuid
  title: string;
  description: string;
  requiredVolunteers: number;
  countResponses: number;
  isTaskOverexposure: boolean;

  startedAt: string; // ISO
  endedAt: string;   // ISO
  createdAt: string; // ISO

  creator: HelpTaskCreatorDto;

  animals: HelpTaskAnimalDto[];
  competencies: string[];
  locations: string[];

  workers: HelpTaskWorkerDto[]; // в твоём ответе [], значит массив
};

export type HelpTasksListDto = {
  tasks: HelpTaskDto[];
  offset: number;
  limit: number;
  hasMore: boolean;
};

/** DTO из swagger (CreateHelpTaskDto) */
export type CreateHelpTaskDto = {
  title: string;
  description: string;
  requiredVolunteers: number;
  isTaskOverexposure: boolean;
  startedAt: string; // ISO date-time
  endedAt: string;   // ISO date-time
  animalIds?: string[] | null;
  competencies?: string[] | null;
  locations?: string[] | null;
};

/** DTO из swagger (UpdateHelpTaskDto) */
export type UpdateHelpTaskDto = {
  title?: string | null;
  description?: string | null;
  requiredVolunteers?: number | null;
  startedAt?: string | null;
  endedAt?: string | null;
  animalIds?: string[] | null;
  competencies?: string[] | null;
  locations?: string[] | null;
};