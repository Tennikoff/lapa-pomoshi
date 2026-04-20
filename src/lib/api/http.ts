export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function getBaseUrlOrNull() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;
  return base.replace(/\/$/, "");
}

async function parseBody(res: Response) {
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json") || ct.includes("application/problem+json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  try {
    return await res.text();
  } catch {
    return null;
  }
}

export async function apiFetch(path: string, init?: RequestInit) {
  const isAbsolute = /^https?:\/\//i.test(path);

  // Локальные next routes: /api/...
  const isLocalApi = path.startsWith("/api/");

  const base = getBaseUrlOrNull();

  const url = isAbsolute
    ? path
    : isLocalApi
    ? path
    : base
    ? `${base}${path.startsWith("/") ? "" : "/"}${path}`
    : (() => {
        throw new Error("NEXT_PUBLIC_API_URL is not set (needed for non-local requests)");
      })();

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
    },
  });

  const body = await parseBody(res);

  if (!res.ok) {
    if (typeof body === "string" && body.trim()) {
      throw new ApiError(body.trim(), res.status, body);
    }

    const msg =
      body && typeof body === "object"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          String((body as any).title || (body as any).message || "Ошибка запроса")
        : "Ошибка запроса";

    throw new ApiError(msg, res.status, body);
  }

  return body;
}