import type { ProfileDto } from "@/src/types/profile";
import { clearAccessToken, getAccessToken } from "@/src/lib/tokenStorage";
import { apiFetch } from "@/src/lib/api/http";

export async function fetchCurrentProfile(): Promise<ProfileDto | null> {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const res = await apiFetch("/api/Users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res as ProfileDto;
  } catch {
    clearAccessToken();
    return null;
  }
}