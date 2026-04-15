"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../auth.module.css";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  verifyEmailSchema,
  type VerifyEmailFormValues,
} from "../../../lib/authSchemas";

import { FieldError } from "../_components/FieldError";

const OTP_LEN = 6;

export default function VerifyEmailPage() {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [timeLeft, setTimeLeft] = useState<number>(59);

  const canResend = timeLeft <= 0;

  const {
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: "" },
    mode: "onSubmit",
  });

  // Собираем код из digits
  const code = useMemo(() => digits.join(""), [digits]);

  // Синхронизируем код в react-hook-form
  useEffect(() => {
    setValue("code", code, { shouldValidate: false, shouldDirty: true });
  }, [code, setValue]);

  // Таймер
  useEffect(() => {
    if (timeLeft <= 0) return;

    const id = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [timeLeft]);

  const focusIndex = (idx: number) => {
    inputRefs.current[idx]?.focus();
  };

  const setDigit = (idx: number, val: string) => {
    const onlyDigit = val.replace(/\D/g, "").slice(0, 1); // одна цифра
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
        // если в поле есть цифра — удалим её
        setDigits((prev) => {
          const next = [...prev];
          next[idx] = "";
          return next;
        });
        return;
      }
      // если пусто — фокус назад
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
    try {
      // TODO: подключим API на следующем шаге:
      // await api.verifyEmailCode({ code: values.code });

      console.log("VERIFY CODE SUBMIT", values);

      // Пример серверной ошибки (как будет выглядеть):
      // setError("root", { message: "Неверный код подтверждения" });
      // setError("root", { message: "Срок действия кода истек" });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Неверный код подтверждения";
      setError("root", { message });
    }
  };

  const onResend = async () => {
    if (!canResend) return;

    try {
      // TODO: подключим API:
      // await api.resendVerifyEmailCode(...)
      // после успешной отправки перезапускаем таймер
      setTimeLeft(59);

      // можно показать общий текст, если хочешь:
      // setError("root", { message: "Код отправлен повторно" });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Не удалось отправить код повторно";
      setError("root", { message });
    }
  };

  const timerText =
    timeLeft > 0 ? `(0:${String(timeLeft).padStart(2, "0")})` : "";

  return (
    <div className={styles.authWrap}>
      <div className={`${styles.authCard} ${styles.authCardVerify}`}>
        <h1 className={styles.verifyTitle}>Подтверждение email</h1>

        <p className={styles.verifyDescription}>
          Мы отправили код подтверждения на ваш адрес.
          <br />
          Введите код из письма, чтобы завершить регистрацию.
        </p>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          {/* Общая ошибка формы (например: неверный код / срок истёк) */}
          {errors.root?.message && (
            <div className={styles.formError}>
              <FieldError message={errors.root.message} />
            </div>
          )}

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

          <div className={styles.otpErrorSlot}>
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

          <button className={styles.btn} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "..." : "ПОДТВЕРДИТЬ"}
          </button>
        </form>
      </div>
    </div>
  );
}