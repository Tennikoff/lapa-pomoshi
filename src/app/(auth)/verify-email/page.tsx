"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "../auth.module.css";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  verifyEmailSchema,
  type VerifyEmailFormValues,
} from "../../../lib/authSchemas";

import { FieldError } from "../_components/FieldError";
import { apiConfirmEmail } from "../../../lib/api/auth";
import { ApiError } from "../../../lib/api/http";
import { setAccessToken } from "../../../lib/tokenStorage";

const OTP_LEN = 6;

const INVALID_CODE_TEXT = "Неверный код. Попробуйте ещё раз.";
const EXPIRED_CODE_TEXT = "Срок действия кода истёк. Запросите новый код.";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const emailFromQuery = (searchParams.get("email") || "").trim();

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [timeLeft, setTimeLeft] = useState<number>(59);
  const [isVerified, setIsVerified] = useState(false);

  const canResend = timeLeft <= 0;

  const {
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: "" },
    mode: "onSubmit",
  });

  const code = useMemo(() => digits.join(""), [digits]);

  // для css-классов отступов
  const isExpiredError = errors.code?.message === EXPIRED_CODE_TEXT;
  const isInvalidError = errors.code?.message === INVALID_CODE_TEXT;

  // синхронизируем code в RHF
  useEffect(() => {
    setValue("code", code, { shouldDirty: true, shouldValidate: false });
  }, [code, setValue]);

  // таймер
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const focusIndex = (idx: number) => inputRefs.current[idx]?.focus();

  const setDigit = (idx: number, val: string) => {
    // если хочешь сбрасывать ошибку при вводе — раскомментируй:
    // clearErrors("code");

    const onlyDigit = val.replace(/\D/g, "").slice(0, 1);

    setDigits((prev) => {
      const next = [...prev];
      next[idx] = onlyDigit;
      return next;
    });

    if (onlyDigit && idx < OTP_LEN - 1) focusIndex(idx + 1);
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        setDigits((prev) => {
          const next = [...prev];
          next[idx] = "";
          return next;
        });
        return;
      }
      if (idx > 0) focusIndex(idx - 1);
    }

    if (e.key === "ArrowLeft" && idx > 0) focusIndex(idx - 1);
    if (e.key === "ArrowRight" && idx < OTP_LEN - 1) focusIndex(idx + 1);
  };

  const handlePaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").trim();
    const numbers = paste.replace(/\D/g, "");
    if (!numbers) return;

    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < numbers.length && idx + i < OTP_LEN; i++) {
        next[idx + i] = numbers[i];
      }
      return next;
    });

    const nextFocus = Math.min(OTP_LEN - 1, idx + numbers.length);
    focusIndex(nextFocus);
  };

  const onSubmit = async (values: VerifyEmailFormValues) => {
    clearErrors();

    if (!emailFromQuery) {
      setError("code", { message: "Не указан email для подтверждения" });
      return;
    }

    try {
      const res = await apiConfirmEmail({
        email: emailFromQuery,
        code: values.code,
      });

      // confirm-email возвращает accessToken => сохраняем
      setAccessToken(res.accessToken);

      // показываем success-экран
      setIsVerified(true);
    } catch (e) {
      let message = "Не удалось подтвердить email";

      if (e instanceof ApiError) message = e.message;
      else if (e instanceof Error) message = e.message;

      // Маппинг под твои тексты (когда бек вернёт свои формулировки)
      const m = message.toLowerCase();

      if (m.includes("неверн") && m.includes("код")) {
        setError("code", { message: INVALID_CODE_TEXT });
        return;
      }
      if (m.includes("истек") || m.includes("истёк") || m.includes("срок")) {
        setError("code", { message: EXPIRED_CODE_TEXT });
        return;
      }

      // дефолт: показываем под кодом, как ты хотел
      setError("code", { message });
    }
  };

  // Resend: эндпоинт ты не прислал. Пока оставляем UI таймера,
  // но по клику ничего реального не отправляем — чтобы не обманывать пользователя.
  const onResend = async () => {
    if (!canResend) return;

    // если появится эндпоинт resend — подключим тут
    // сейчас просто перезапускаем таймер, без реальной отправки
    setTimeLeft(59);
  };

  const timerText =
    timeLeft > 0 ? `(0:${String(timeLeft).padStart(2, "0")})` : "";

  return (
    <div className={styles.authWrap}>
      <div
        className={`${styles.authCard} ${styles.authCardVerify} ${
          isVerified ? styles.authCardVerifySuccess : ""
        }`}
      >
        <h1 className={styles.verifyTitle}>Подтверждение email</h1>

        {!isVerified ? (
          <>
            <p className={styles.verifyDescription}>
              Мы отправили код подтверждения на ваш адрес.
              <br />
              Введите код из письма, чтобы завершить регистрацию.
            </p>

            <form noValidate onSubmit={handleSubmit(onSubmit)}>
              <div className={styles.otpGroup}>
                <div className={styles.otpRow}>
                  {Array.from({ length: OTP_LEN }).map((_, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      className={`${styles.otpInput} ${
                        errors.code ? styles.otpInputError : ""
                      }`}
                      value={digits[idx]}
                      onChange={(e) => setDigit(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={(e) => handlePaste(idx, e)}
                      inputMode="numeric"
                      pattern="\d*"
                      type="text"
                      aria-label={`Цифра кода ${idx + 1}`}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>

                <div
                  className={[
                    styles.otpErrorSlot,
                    isExpiredError ? styles.otpErrorExpired : "",
                    isInvalidError ? styles.otpErrorInvalid : "",
                  ].join(" ")}
                >
                  {errors.code?.message ? (
                    <FieldError message={errors.code.message} />
                  ) : null}
                </div>

                <p className={styles.resendInfo}>
                  Не пришло письмо?
                  <button
                    type="button"
                    onClick={onResend}
                    className={`${styles.resendLink} ${
                      !canResend ? styles.resendLinkDisabled : ""
                    }`}
                    disabled={!canResend}
                  >
                    Отправить повторно
                  </button>
                  {timerText ? <span className={styles.timer}>{timerText}</span> : null}
                </p>
              </div>

              <button className={styles.btn} type="submit" disabled={isSubmitting}>
                {isSubmitting ? "..." : "ПОДТВЕРДИТЬ"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className={styles.verifyDescription}>Аккаунт успешно подтвержден.</p>

            {/* После confirm-email токен уже сохранён => можно идти на главную */}
            <Link
              href="/"
              className={styles.btn}
              style={{ display: "block", textAlign: "center", paddingTop: 14 }}
            >
              ВОЙТИ
            </Link>
          </>
        )}
      </div>
    </div>
  );
}