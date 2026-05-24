export type Role = "curator" | "volunteer";

type MockUser = {
  email: string;
  password: string;
  role: Role;
  verified: boolean;
  blocked?: boolean;
};

const LS_USERS_KEY = "lp_users_v1";

function canUseLS() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadUsers(): MockUser[] {
  if (!canUseLS()) return [];
  try {
    const raw = localStorage.getItem(LS_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MockUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: MockUser[]) {
  if (!canUseLS()) return;
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}

function findUserByEmail(email: string) {
  const users = loadUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized);
}

export type RegisterResult =
  | { ok: true }
  | { ok: false; errorCode: "EMAIL_EXISTS" };

export async function mockRegister(params: {
  email: string;
  password: string;
  role: Role;
}): Promise<RegisterResult> {
  await new Promise((r) => setTimeout(r, 500));

  const email = params.email.trim().toLowerCase();
  const users = loadUsers();

  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, errorCode: "EMAIL_EXISTS" };
  }

  users.push({
    email,
    password: params.password,
    role: params.role,
    verified: false,
  });

  saveUsers(users);
  return { ok: true };
}

export type LoginResult =
  | { ok: true; role: Role }
  | { ok: false; errorCode: "INVALID_CREDENTIALS" | "UNVERIFIED" | "BLOCKED" };

export async function mockLogin(params: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  await new Promise((r) => setTimeout(r, 500));

  const email = params.email.trim().toLowerCase();
  const user = findUserByEmail(email);

  if (!user || user.password !== params.password) {
    return { ok: false, errorCode: "INVALID_CREDENTIALS" };
  }

  if (user.blocked) {
    return { ok: false, errorCode: "BLOCKED" };
  }

  if (!user.verified) {
    return { ok: false, errorCode: "UNVERIFIED" };
  }

  return { ok: true, role: user.role };
}

export type VerifyEmailResult =
  | { ok: true }
  | { ok: false; errorCode: "INVALID_CODE" | "EXPIRED_CODE" | "NO_USER" };

export async function mockVerifyEmailCode(params: {
  email: string;
  code: string;
}): Promise<VerifyEmailResult> {
  await new Promise((r) => setTimeout(r, 500));

  const email = params.email.trim().toLowerCase();
  const user = findUserByEmail(email);

  if (!user) return { ok: false, errorCode: "NO_USER" };

  if (params.code === "111111") {
    const users = loadUsers();
    const next = users.map((u) =>
      u.email.toLowerCase() === email ? { ...u, verified: true } : u
    );
    saveUsers(next);
    return { ok: true };
  }

  if (params.code === "222222") {
    return { ok: false, errorCode: "EXPIRED_CODE" };
  }

  return { ok: false, errorCode: "INVALID_CODE" };
}

export async function mockResendVerifyEmailCode(params: { email: string }) {
  await new Promise((r) => setTimeout(r, 400));

  return { ok: true as const };
}

export type ResetRequestResult =
  | { ok: true }
  | { ok: false; errorCode: "EMAIL_NOT_FOUND" };

export async function mockRequestPasswordResetCode(params: { email: string }): Promise<ResetRequestResult> {
  await new Promise((r) => setTimeout(r, 450));

  const email = params.email.trim().toLowerCase();
  const user = findUserByEmail(email);

  if (!user) return { ok: false, errorCode: "EMAIL_NOT_FOUND" };

  return { ok: true };
}

export type ResetVerifyResult =
  | { ok: true }
  | { ok: false; errorCode: "INVALID_CODE" | "EXPIRED_CODE" };

export async function mockVerifyPasswordResetCode(params: {
  email: string;
  code: string;
}): Promise<ResetVerifyResult> {
  await new Promise((r) => setTimeout(r, 450));

  if (params.code === "111111") return { ok: true };
  if (params.code === "222222") return { ok: false, errorCode: "EXPIRED_CODE" };
  return { ok: false, errorCode: "INVALID_CODE" };
}

export type ResetSetPasswordResult =
  | { ok: true }
  | { ok: false; errorCode: "EMAIL_NOT_FOUND" };

export async function mockSetNewPassword(params: {
  email: string;
  newPassword: string;
}): Promise<ResetSetPasswordResult> {
  await new Promise((r) => setTimeout(r, 450));

  const email = params.email.trim().toLowerCase();
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email);

  if (idx === -1) return { ok: false, errorCode: "EMAIL_NOT_FOUND" };

  const next = [...users];
  next[idx] = { ...next[idx], password: params.newPassword };
  saveUsers(next);

  return { ok: true };
}

export async function mockResendPasswordResetCode(_params: { email: string }) {
  await new Promise((r) => setTimeout(r, 400));
  return { ok: true as const };
}