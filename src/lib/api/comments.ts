// src/lib/api/comments.ts
import { apiFetch, ApiError } from "@/src/lib/api/http";
import { authHeaders } from "@/src/lib/api/authHeaders";
import type {
  CommentDto,
  CommentsListDto,
  CreateCommentDto,
  UpdateCommentDto,
} from "@/src/types/comment";

async function fetchWithOptionalAuth(path: string): Promise<unknown> {
  try {
    return await apiFetch(path, { headers: authHeaders() });
  } catch (e) {
    // иногда ручка может быть публичной; ретраим без auth
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      return await apiFetch(path);
    }
    throw e;
  }
}

export const commentsApi = {
  /** POST /api/Comments */
  create: async (dto: CreateCommentDto): Promise<CommentDto> => {
    const res = await apiFetch("/api/Comments", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        rating: dto.rating,
        description: dto.description ?? null,
        recipientId: dto.recipientId,
      }),
    });
    return res as CommentDto;
  },

  /** GET /api/Comments/user/{userId}?offset&limit */
  listByUser: async (
    userId: string,
    offset = 0,
    limit = 10
  ): Promise<CommentsListDto> => {
    const res = await fetchWithOptionalAuth(
      `/api/Comments/user/${userId}?offset=${offset}&limit=${limit}`
    );
    return res as CommentsListDto;
  },

  /** PATCH /api/Comments/{commentId} */
  update: async (commentId: string, dto: UpdateCommentDto): Promise<CommentDto> => {
    const res = await apiFetch(`/api/Comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(dto),
    });
    return res as CommentDto;
  },

  /** DELETE /api/Comments/{commentId} */
  delete: async (commentId: string): Promise<{ message: string }> => {
    const res = await apiFetch(`/api/Comments/${commentId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return res as { message: string };
  },
};