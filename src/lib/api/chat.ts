import { apiFetch } from "@/src/lib/api/http";
import { authHeaders } from "@/src/lib/api/authHeaders";
import type { ChatsListDto, ChatMessagesListDto } from "@/src/types/chat";

export const chatApi = {
  chats: async (offset = 0, limit = 50): Promise<ChatsListDto> => {
    const res = await apiFetch(`/api/Chat/chats?offset=${offset}&limit=${limit}`, {
      headers: authHeaders(),
    });
    return res as ChatsListDto;
  },

  messages: async (taskId: string, offset = 0, limit = 200): Promise<ChatMessagesListDto> => {
    const res = await apiFetch(
      `/api/Chat/messages/${taskId}?offset=${offset}&limit=${limit}`,
      { headers: authHeaders() }
    );
    return res as ChatMessagesListDto;
  },

  markRead: async (taskId: string): Promise<{ message: string }> => {
    const res = await apiFetch(`/api/Chat/messages/read/${taskId}`, {
      method: "POST",
      headers: authHeaders(),
    });
    return res as { message: string };
  },
};