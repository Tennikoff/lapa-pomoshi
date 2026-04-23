import type { ProfileDto } from "@/src/types/profile";
import { clearAccessToken, getAccessToken } from "@/src/lib/tokenStorage";

export async function fetchCurrentProfile(): Promise<ProfileDto | null> {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch("/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      clearAccessToken();
      return null;
    }

    return (await res.json()) as ProfileDto;
  } catch {
    return null;
  }
}