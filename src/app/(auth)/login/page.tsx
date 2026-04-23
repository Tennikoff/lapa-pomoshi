"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, type LoginFormValues } from "../../../lib/authSchemas";
import { FieldError } from "../_components/FieldError";
import { apiLogin } from "../../../lib/api/auth";
import { ApiError } from "../../../lib/api/http";
import { setAccessToken } from "../../../lib/tokenStorage";

export default function LoginPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const res = await apiLogin(values);
      setAccessToken(res.accessToken);
      router.push("/post-auth");
    } catch (e) {
      let message = "Ошибка входа";

      if (e instanceof ApiError) message = e.message;
      else if (e instanceof Error) message = e.message;

      // маппим под твой текст
      if (message.toLowerCase().includes("неверный email или пароль")) {
        message = "Неверный Email или пароль";
      }

      setError("root", { message });
    }
  };

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
              <div style={{ marginTop: 8 }}>
                <Link
                  href="/reset-password"
                  className={styles.titleLink}
                  style={{ textDecoration: "underline" }}
                >
                  Восстановить пароль
                </Link>
              </div>
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