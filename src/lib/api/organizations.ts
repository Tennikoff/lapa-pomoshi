import { apiFetch } from "@/src/lib/api/http";
import { authHeaders } from "@/src/lib/api/authHeaders";
import type { OrganizationProfileDto } from "@/src/types/organization";

export const organizationsApi = {
  getProfile: async (): Promise<OrganizationProfileDto> => {
    const res = await apiFetch("/api/Organizations/profile", {
      headers: authHeaders(),
    });
    return res as OrganizationProfileDto;
  },

  patchProfile: async (
    dto: Partial<OrganizationProfileDto>
  ): Promise<OrganizationProfileDto> => {
    const res = await apiFetch("/api/Organizations/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(dto),
    });
    return res as OrganizationProfileDto;
  },

  patchProfilePhoto: async (photoFile: File): Promise<OrganizationProfileDto> => {
    const fd = new FormData();
    fd.append("photo", photoFile);

    const res = await apiFetch("/api/Organizations/profile", {
      method: "PATCH",
      headers: authHeaders(),
      body: fd,
    });

    return res as OrganizationProfileDto;
  },
};