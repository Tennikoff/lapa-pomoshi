export type HelpTaskCreatorDto = {
  id: string;
  name: string;
};

export type HelpTaskAnimalDto = {
  id: string;
  name: string;
  photoUrl: string | null;
};

export type HelpTaskWorkerDto = {
  id: string;
  name: string;
};

export type HelpTaskDto = {
  id: string;
  title: string;
  description: string;
  requiredVolunteers: number;
  countResponses: number;
  isTaskOverexposure: boolean;

  startedAt: string;
  endedAt: string;
  createdAt: string;

  creator: HelpTaskCreatorDto;

  animals: HelpTaskAnimalDto[];
  competencies: string[];
  locations: string[];

  workers: HelpTaskWorkerDto[];
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
  startedAt: string;
  endedAt: string;
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