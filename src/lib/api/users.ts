import { apiFetch } from "@/src/lib/api/http";
import { authHeaders } from "@/src/lib/api/authHeaders";
import type { ProfileDto } from "@/src/types/profile";

export const usersApi = {
  getProfile: async (): Promise<ProfileDto> => {
    const res = await apiFetch("/api/Users/profile", { headers: authHeaders() });
    return res as ProfileDto;
  },


  getPublicProfile: async (userId: string): Promise<ProfileDto> => {
    const res = await apiFetch(`/api/Users/public/${userId}`, { cache: "no-store" });
    return res as ProfileDto;
  },

  // JSON PATCH (как раньше)
  patchProfile: async (dto: Partial<ProfileDto>): Promise<ProfileDto> => {
    const res = await apiFetch("/api/Users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(dto),
    });
    return res as ProfileDto;
  },

  // ✅ multipart PATCH: загрузка фото профиля
  patchProfilePhoto: async (photoFile: File): Promise<ProfileDto> => {
    const fd = new FormData();
    // ключ должен быть "photo" (по аналогии с Animals, и как обычно делают на бэке)
    fd.append("photo", photoFile);

    const res = await apiFetch("/api/Users/profile", {
      method: "PATCH",
      headers: authHeaders(), // Content-Type НЕ ставим!
      body: fd,
    });

    return res as ProfileDto;
  },
};