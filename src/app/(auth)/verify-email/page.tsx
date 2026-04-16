"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "../auth.module.css";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  verifyEmailSchema,
  type VerifyEmailFormValues,
} from "../../../lib/authSchemas";

import { FieldError } from "../_components/FieldError";
import {
  mockResendVerifyEmailCode,
  mockVerifyEmailCode,
} from "../../../lib/mock/auth";

const OTP_LEN = 6;

const INVALID_CODE_TEXT = "Неверный код. Попробуйте ещё раз.";
const EXPIRED_CODE_TEXT = "Срок действия кода истёк. Запросите новый код.";

export default function VerifyEmailPage() {
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

    const res = await mockVerifyEmailCode(values.code);

    if (res.ok) {
      setIsVerified(true);
      return;
    }

    // Ошибки показываем ПОД кодом (над resend)
    if (res.errorCode === "INVALID_CODE") {
      setError("code", { message: INVALID_CODE_TEXT });
      return;
    }

    if (res.errorCode === "EXPIRED_CODE") {
      setError("code", { message: EXPIRED_CODE_TEXT });
      return;
    }
  };

  const onResend = async () => {
    if (!canResend) return;

    clearErrors("code");
    await mockResendVerifyEmailCode();
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
              {/* Всё внутри otpGroup => выравнивание по первой ячейке */}
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

                {/* Ошибка под кодом и над resend */}
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

                {/* Resend выравнивается по первой ячейке */}
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

            <Link
              href="/login"
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