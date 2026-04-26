export type TaskKind = "task" | "foster";

export type TaskStatus = "active" | "in_progress" | "done" | "cancelled";

export type TaskResponseStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export type TaskResponse = {
  userId: string;
  status: TaskResponseStatus;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  creatorUserId: string;

  kind: TaskKind;

  title: string;
  description: string;

  competencies: string[]; // COMPETENCIES
  city: string;
  district: string; // DISTRICTS

  startAt: string | null; // ISO
  endAt: string | null;   // ISO

  // ВАЖНО: только id существующей карточки животного (или null)
  animalId: string | null;

  status: TaskStatus;

  responses: TaskResponse[];

  createdAt: string;
  updatedAt: string;
};