export type VerifyEmailResult =
  | { ok: true }
  | { ok: false; errorCode: "INVALID_CODE" | "EXPIRED_CODE" };

export async function mockVerifyEmailCode(code: string): Promise<VerifyEmailResult> {
  // имитация задержки сети
  await new Promise((r) => setTimeout(r, 500));

  // Детерминированные сценарии для теста:
  // 111111 -> успех
  // 222222 -> срок истёк
  // всё остальное -> неверный код
  if (code === "111111") return { ok: true };
  if (code === "222222") return { ok: false, errorCode: "EXPIRED_CODE" };
  return { ok: false, errorCode: "INVALID_CODE" };
}

export async function mockResendVerifyEmailCode(): Promise<{ ok: true }> {
  await new Promise((r) => setTimeout(r, 400));
  return { ok: true };
}