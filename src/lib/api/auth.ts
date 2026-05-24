import { apiFetch } from "./http";

export type AuthLoginResponseDto = {
  phone: string | null;
  website: string | null;
  donationDetails: string | null;
  latestPost: unknown | null;
  constantNeeds: string[];

  accessToken: string;
  tokenType: string;
  userId: string;

  email?: string | null;
  name: string;
  role: string | number;

  age: number | null;
  description: string | null;
  photoUrl: string | null;
  location: string | null;

  countTasks: number;
  latestComments: unknown[];
  latestAnimals: unknown[];

  sumRating: number;
  countRating: number;

  createdAt: string;
};

export async function apiRegister(params: { email: string; password: string; role: string }) {
  return apiFetch("/api/Auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function apiLogin(params: { email: string; password: string }) {
  return apiFetch("/api/Auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }) as Promise<AuthLoginResponseDto>;
}

export async function apiConfirmEmail(params: { email: string; code: string }) {
  return apiFetch("/api/Auth/confirm-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }) as Promise<AuthLoginResponseDto>;
}

export async function apiForgotPassword(params: { email: string }) {
  return apiFetch("/api/Auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function apiResetPasswordWithCode(params: {
  email: string;
  code: string;
  newPassword: string;
}) {
  return apiFetch("/api/Auth/reset-password-with-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}