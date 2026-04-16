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

  // Тестовые коды:
  // 111111 -> успех
  // 222222 -> срок истёк
  // другое -> неверный
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

  // в mock ничего реально не делаем — только имитируем успех
  // можно было бы проверять, что юзер существует, но не обязательно
  return { ok: true as const };
}