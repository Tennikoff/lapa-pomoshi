import { apiFetch } from "@/src/lib/api/http";
import { authHeaders } from "@/src/lib/api/authHeaders";
import type { ResponseDto, ResponsesListDto } from "@/src/types/response";

export const responsesApi = {
  /** POST /api/Responses  body: { taskId } */
  create: async (taskId: string): Promise<ResponseDto> => {
    const res = await apiFetch("/api/Responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ taskId }),
    });

    return res as ResponseDto;
  },

  /** GET /api/Responses/task/{taskId}?offset&limit (доступно создателю задачи) */
  listByTask: async (taskId: string, offset = 0, limit = 10): Promise<ResponsesListDto> => {
    const res = await apiFetch(`/api/Responses/task/${taskId}?offset=${offset}&limit=${limit}`, {
      headers: authHeaders(),
    });

    return res as ResponsesListDto;
  },

  /** GET /api/Responses/my-sent?offset&limit (для волонтёра) */
  mySent: async (offset = 0, limit = 10): Promise<ResponsesListDto> => {
    const res = await apiFetch(`/api/Responses/my-sent?offset=${offset}&limit=${limit}`, {
      headers: authHeaders(),
    });

    return res as ResponsesListDto;
  },

  /** GET /api/Responses/my-received?offset&limit (для организации) */
  myReceived: async (offset = 0, limit = 10): Promise<ResponsesListDto> => {
    const res = await apiFetch(`/api/Responses/my-received?offset=${offset}&limit=${limit}`, {
      headers: authHeaders(),
    });

    return res as ResponsesListDto;
  },

  /** PATCH /api/Responses/{responseId}/status  body: { status } */
  updateStatus: async (responseId: string, status: string): Promise<ResponseDto> => {
    const res = await apiFetch(`/api/Responses/${responseId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ status }),
    });

    return res as ResponseDto;
  },
};