import { apiFetch } from "@/src/lib/api/http";
import { authHeaders } from "@/src/lib/api/authHeaders";
import type { ProfileDto } from "@/src/types/profile";

export const usersApi = {
  getProfile: async (): Promise<ProfileDto> => {
    const res = await apiFetch("/api/Users/profile", { headers: authHeaders() });
    return res as ProfileDto;
  },

  patchProfile: async (dto: Partial<ProfileDto>): Promise<ProfileDto> => {
    const res = await apiFetch("/api/Users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(dto),
    });
    return res as ProfileDto;
  },
};