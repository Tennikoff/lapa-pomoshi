import { apiFetch } from "./http";

export type AuthUserDto = {
  accessToken: string;
  tokenType: string;
  userId: string;
  email: string;
  name: string;
  role: number;
  age: number | null;
  description: string | null;
  sumRating: number;
  countRating: number;
  photoUrl: string | null;
};

export async function apiRegister(params: { email: string; password: string; role: string }) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function apiLogin(params: { email: string; password: string }) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }) as Promise<AuthUserDto>;
}

export async function apiConfirmEmail(params: { email: string; code: string }) {
  return apiFetch("/api/auth/confirm-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }) as Promise<AuthUserDto>;
}