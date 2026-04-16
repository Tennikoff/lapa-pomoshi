"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, type LoginFormValues } from "../../../lib/authSchemas";
import { FieldError } from "../_components/FieldError";
import { mockLogin } from "../../../lib/mock/auth";

const UNVERIFIED_TEXT =
  "Аккаунт не подтвержден. Введите код подтверждения, отправленный на email";

export default function LoginPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const emailValue = watch("email") || "";

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const res = await mockLogin(values);

      if (!res.ok) {
        if (res.errorCode === "INVALID_CREDENTIALS") {
          setError("root", { message: "Неверный Email или пароль" });
          return;
        }
        if (res.errorCode === "UNVERIFIED") {
          setError("root", { message: UNVERIFIED_TEXT });
          return;
        }
        if (res.errorCode === "BLOCKED") {
          setError("root", { message: "Ваш аккаунт заблокирован. Обратитесь в поддержку" });
          return;
        }
      }

      // Успех (пока без токенов): просто редирект куда-то в main
      router.push("/");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Неверный Email или пароль";
      setError("root", { message });
    }
  };

  const isUnverified = errors.root?.message === UNVERIFIED_TEXT;

  return (
    <div className={styles.authWrap}>
      <div className={`${styles.authCard} ${styles.authCardLogin}`}>
        <h1 className={styles.authTitle}>
          <span className={styles.active}>Вход</span>/
          <Link href="/register" className={styles.titleLink}>
            Регистрация
          </Link>
        </h1>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          {errors.root?.message && (
            <div className={styles.formError}>
              <FieldError message={errors.root.message} />

              {isUnverified ? (
                <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Link
                    href={`/verify-email?email=${encodeURIComponent(emailValue.trim())}`}
                    className={styles.titleLink}
                    style={{ textDecoration: "underline" }}
                  >
                    Ввести код
                  </Link>
                  <Link
                    href="/reset-password"
                    className={styles.titleLink}
                    style={{ textDecoration: "underline" }}
                  >
                    Восстановить пароль
                  </Link>
                </div>
              ) : (
                <div style={{ marginTop: 8 }}>
                  <Link
                    href="/reset-password"
                    className={styles.titleLink}
                    style={{ textDecoration: "underline" }}
                  >
                    Восстановить пароль
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              {...register("email")}
            />
            {errors.email?.message && <FieldError message={errors.email.message} />}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pass">
              Пароль
            </label>
            <input
              id="pass"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
              {...register("password")}
            />
            {errors.password?.message && <FieldError message={errors.password.message} />}
          </div>

          <div className={styles.forgotRow}>
            <Link href="/reset-password" className={styles.forgotLink}>
              Забыли пароль?
            </Link>
          </div>

          <button className={styles.btn} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "..." : "ВОЙТИ"}
          </button>
        </form>
      </div>
    </div>
  );
}