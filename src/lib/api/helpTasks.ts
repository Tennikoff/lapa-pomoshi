import { apiFetch } from "@/src/lib/api/http";
import { authHeaders } from "@/src/lib/api/authHeaders";
import type { CreateHelpTaskDto, HelpTaskDto, HelpTasksListDto, UpdateHelpTaskDto } from "@/src/types/helpTask";

export type HelpTaskFeedParams = {
  search?: string;
  locations?: string[];
  competencies?: string[];
  preferences?: string[];
  availabilities?: string[];
  isTaskOverexposure?: boolean;
  startedAfter?: string;  // ISO
  startedBefore?: string; // ISO
  offset?: number;
  limit?: number;
};

function buildFeedQuery(p: HelpTaskFeedParams) {
  const sp = new URLSearchParams();

  if (p.search?.trim()) sp.set("Search", p.search.trim());
  if (typeof p.isTaskOverexposure === "boolean") sp.set("IsTaskOverexposure", String(p.isTaskOverexposure));
  if (p.startedAfter) sp.set("StartedAfter", p.startedAfter);
  if (p.startedBefore) sp.set("StartedBefore", p.startedBefore);

  if (typeof p.offset === "number") sp.set("offset", String(p.offset));
  if (typeof p.limit === "number") sp.set("limit", String(p.limit));

  const appendArray = (key: string, arr?: string[]) => {
    if (!arr || !arr.length) return;
    for (const v of arr) sp.append(key, v);
  };

  appendArray("Locations", p.locations);
  appendArray("Competencies", p.competencies);
  appendArray("Preferences", p.preferences);
  appendArray("Availabilities", p.availabilities);

  return sp.toString();
}

export const helpTasksApi = {
  /** GET /api/HelpTasks/feed */
  feed: async (params: HelpTaskFeedParams): Promise<HelpTasksListDto> => {
    const q = buildFeedQuery(params);
    const path = q ? `/api/HelpTasks/feed?${q}` : "/api/HelpTasks/feed";
    const res = await apiFetch(path, { headers: authHeaders() });
    return res as HelpTasksListDto; // мы уже видели форму {tasks,offset,limit,hasMore}
  },

  /** GET /api/HelpTasks/my-created */
  myCreated: async (offset = 0, limit = 10): Promise<HelpTasksListDto> => {
    const res = await apiFetch(`/api/HelpTasks/my-created?offset=${offset}&limit=${limit}`, {
      headers: authHeaders(),
    });
    return res as HelpTasksListDto;
  },

  /** GET /api/HelpTasks/my-working */
  myWorking: async (offset = 0, limit = 10): Promise<HelpTasksListDto> => {
    const res = await apiFetch(`/api/HelpTasks/my-working?offset=${offset}&limit=${limit}`, {
      headers: authHeaders(),
    });
    return res as HelpTasksListDto;
  },

  /** POST /api/HelpTasks */
  create: async (dto: CreateHelpTaskDto): Promise<HelpTaskDto> => {
    const res = await apiFetch("/api/HelpTasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(dto),
    });
    return res as HelpTaskDto;
  },

  /** GET /api/HelpTasks/{taskId} */
  getById: async (taskId: string): Promise<HelpTaskDto> => {
    const res = await apiFetch(`/api/HelpTasks/${taskId}`, { headers: authHeaders() });
    return res as HelpTaskDto;
  },

  /** PATCH /api/HelpTasks/{taskId} */
  update: async (taskId: string, dto: UpdateHelpTaskDto): Promise<HelpTaskDto> => {
    const res = await apiFetch(`/api/HelpTasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(dto),
    });
    return res as HelpTaskDto;
  },

  /** DELETE /api/HelpTasks/{taskId} */
  delete: async (taskId: string): Promise<void> => {
    await apiFetch(`/api/HelpTasks/${taskId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  /** POST /api/HelpTasks/{taskId}/complete */
  complete: async (taskId: string): Promise<void> => {
    await apiFetch(`/api/HelpTasks/${taskId}/complete`, {
      method: "POST",
      headers: authHeaders(),
    });
  },
};