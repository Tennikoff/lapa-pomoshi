import type { ProfileDto } from "@/src/types/profile";
import { apiFetch } from "@/src/lib/api/http";
import { clearAccessToken, getAccessToken } from "@/src/lib/tokenStorage";
import { isOrgRole } from "@/src/lib/role";
import { organizationsApi } from "@/src/lib/api/organizations";

export async function fetchCurrentProfile(): Promise<ProfileDto | null> {
  const token = getAccessToken();
  if (!token) return null;

  let p: ProfileDto;

  // 1) Базовый профиль (критично)
  try {
    const res = await apiFetch("/api/Users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    p = res as ProfileDto;
  } catch {
    clearAccessToken();
    return null;
  }

  // 2) Расширение для организации (НЕ критично)
  if (isOrgRole(p.role)) {
    try {
      const org = await organizationsApi.getProfile();
      return { ...p, ...org };
    } catch {
      return p;
    }
  }

  return p;
}  