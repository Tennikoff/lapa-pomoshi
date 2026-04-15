"use client";

import Link from "next/link";
import styles from "../auth.module.css";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, type LoginFormValues } from "../../../lib/authSchemas";
import { FieldError } from "../_components/FieldError";

export default function LoginPage() {
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
      // TODO: Подключим API на следующем шаге
      console.log("LOGIN SUBMIT", values);

      // пример: если сервер вернул ошибку логина
      // setError("root", { message: "Неверный Email или пароль" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Неверный Email или пароль";
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