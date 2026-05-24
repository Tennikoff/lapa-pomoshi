"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "../auth.module.css";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  resetEmailSchema,
  type ResetEmailFormValues,
  resetCodeSchema,
  type ResetCodeFormValues,
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../../../lib/authSchemas";

import { FieldError } from "../_components/FieldError";
import {
  mockRequestPasswordResetCode,
  mockVerifyPasswordResetCode,
  mockResendPasswordResetCode,
  mockSetNewPassword,
} from "../../../lib/mock/auth";

const OTP_LEN = 6;

const EMAIL_NOT_FOUND_TEXT = "Аккаунт с таким email не найден";
const INVALID_CODE_TEXT = "Неверный код Попробуйте ещё раз.";
const EXPIRED_CODE_TEXT = "Срок действия кода истёк. Запросите новый код.";
const SUCCESS_TEXT = "Пароль успешно изменен.";

type Step = 1 | 2 | 3 | 4;

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const canResend = timeLeft <= 0;

  // Шаг 1: email
  const emailForm = useForm<ResetEmailFormValues>({
    resolver: zodResolver(resetEmailSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });

  // Шаг 2: code
  const codeForm = useForm<ResetCodeFormValues>({
    resolver: zodResolver(resetCodeSchema),
    defaultValues: { code: "" },
    mode: "onSubmit",
  });

  // Шаг 3: new password
  const passForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", password2: "" },
    mode: "onBlur",
  });

  const code = useMemo(() => digits.join(""), [digits]);

  // синхронизируем code в RHF
  useEffect(() => {
    codeForm.setValue("code", code, { shouldDirty: true, shouldValidate: false });
  }, [code, codeForm]);

  // таймер resend на шаге 2
  useEffect(() => {
    if (step !== 2) return;
    if (timeLeft <= 0) return;

    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, step]);

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

  // ===== submit шаг 1 =====
  const onSubmitEmail = async (values: ResetEmailFormValues) => {
    emailForm.clearErrors();

    const res = await mockRequestPasswordResetCode({ email: values.email });

    if (!res.ok && res.errorCode === "EMAIL_NOT_FOUND") {
      emailForm.setError("email", { message: EMAIL_NOT_FOUND_TEXT });
      return;
    }

    setEmail(values.email.trim());
    setStep(2);

    setTimeLeft(59);
    setDigits(Array(OTP_LEN).fill(""));
    codeForm.clearErrors();
  };

  // submit шаг 2
  const onSubmitCode = async (values: ResetCodeFormValues) => {
    codeForm.clearErrors();

    const res = await mockVerifyPasswordResetCode({ email, code: values.code });

    if (res.ok) {
      setStep(3);
      return;
    }

    if (res.errorCode === "INVALID_CODE") {
      codeForm.setError("code", { message: INVALID_CODE_TEXT });
      return;
    }

    if (res.errorCode === "EXPIRED_CODE") {
      codeForm.setError("code", { message: EXPIRED_CODE_TEXT });
      return;
    }
  };

  // resend на шаге 2
  const onResend = async () => {
    if (!canResend) return;

    codeForm.clearErrors("code");
    await mockResendPasswordResetCode({ email });
    setTimeLeft(59);
  };

  // submit шаг 3
  const onSubmitNewPassword = async (values: ResetPasswordFormValues) => {
    passForm.clearErrors();

    const res = await mockSetNewPassword({ email, newPassword: values.password });

    if (!res.ok && res.errorCode === "EMAIL_NOT_FOUND") {
      passForm.setError("root", { message: EMAIL_NOT_FOUND_TEXT });
      return;
    }

    setStep(4);
  };

  const timerText =
    timeLeft > 0 ? `(0:${String(timeLeft).padStart(2, "0")})` : "";

  const isExpiredError = codeForm.formState.errors.code?.message === EXPIRED_CODE_TEXT;
  const isInvalidError = codeForm.formState.errors.code?.message === INVALID_CODE_TEXT;

  const cardStepClass =
    step === 1
      ? styles.authCardResetStep1
      : step === 2
      ? styles.authCardResetStep2
      : step === 3
      ? styles.authCardResetStep3
      : "";

  return (
    <div className={styles.authWrap}>
      <div
        className={`${styles.authCard} ${styles.authCardReset} ${cardStepClass} ${
          step === 4 ? styles.authCardResetSuccess : ""
        }`}
      >
        <h1 className={styles.verifyTitle}>Восстановление пароля</h1>

        {/* ===== STEP 1 ===== */}
        {step === 1 && (
          <>
            <p className={styles.verifyDescription}>
              Введите email, указанный при регистрации.
              <br />
              Мы отправим код для восстановления пароля.
            </p>

            <form noValidate onSubmit={emailForm.handleSubmit(onSubmitEmail)}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!emailForm.formState.errors.email}
                  className={`${styles.input} ${
                    emailForm.formState.errors.email ? styles.inputError : ""
                  }`}
                  {...emailForm.register("email")}
                />
                {emailForm.formState.errors.email?.message && (
                  <FieldError message={emailForm.formState.errors.email.message} />
                )}
              </div>

              <button className={styles.btn} type="submit" disabled={emailForm.formState.isSubmitting}>
                {emailForm.formState.isSubmitting ? "..." : "ОТПРАВИТЬ КОД"}
              </button>
            </form>
          </>
        )}

        {/* ===== STEP 2 ===== */}
        {step === 2 && (
          <>
            <p className={styles.verifyDescription}>
              Мы отправили код подтверждения на ваш адрес.
              <br />
              Введите код из письма.
            </p>

            <form noValidate onSubmit={codeForm.handleSubmit(onSubmitCode)}>
              <div className={styles.otpGroup}>
                <div className={styles.otpRow}>
                  {Array.from({ length: OTP_LEN }).map((_, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      className={`${styles.otpInput} ${
                        codeForm.formState.errors.code ? styles.otpInputError : ""
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
                  {codeForm.formState.errors.code?.message ? (
                    <FieldError message={codeForm.formState.errors.code.message} />
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

              <button className={styles.btn} type="submit" disabled={codeForm.formState.isSubmitting}>
                {codeForm.formState.isSubmitting ? "..." : "ПОДТВЕРДИТЬ"}
              </button>
            </form>
          </>
        )}

        {/* ===== STEP 3 ===== */}
        {step === 3 && (
          <>
            <p className={styles.verifyDescription}>
              Придумайте пароль (минимум 8 символов, латиница, цифры, спецсимвол)
            </p>

            <form noValidate onSubmit={passForm.handleSubmit(onSubmitNewPassword)}>
              {passForm.formState.errors.root?.message && (
                <div className={styles.formError}>
                  <FieldError message={passForm.formState.errors.root.message} />
                </div>
              )}

              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="new-password">
                  Новый пароль
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!passForm.formState.errors.password}
                  className={`${styles.input} ${
                    passForm.formState.errors.password ? styles.inputError : ""
                  }`}
                  {...passForm.register("password")}
                />
                {passForm.formState.errors.password?.message && (
                  <FieldError message={passForm.formState.errors.password.message} />
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="confirm-password">
                  Повторите пароль
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!passForm.formState.errors.password2}
                  className={`${styles.input} ${
                    passForm.formState.errors.password2 ? styles.inputError : ""
                  }`}
                  {...passForm.register("password2")}
                />
                {passForm.formState.errors.password2?.message && (
                  <FieldError message={passForm.formState.errors.password2.message} />
                )}
              </div>

              <button className={styles.btn} type="submit" disabled={passForm.formState.isSubmitting}>
                {passForm.formState.isSubmitting ? "..." : "СОХРАНИТЬ ПАРОЛЬ"}
              </button>
            </form>
          </>
        )}

        {/* ===== STEP 4 (SUCCESS) ===== */}
        {step === 4 && (
          <>
            <p className={styles.verifyDescription}>{SUCCESS_TEXT}</p>

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