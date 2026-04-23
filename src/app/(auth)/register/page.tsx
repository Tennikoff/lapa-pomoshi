"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormValues } from "../../../lib/authSchemas";
import { FieldError } from "../_components/FieldError";
import { apiRegister } from "../../../lib/api/auth";
import { ApiError } from "../../../lib/api/http";

import { setPendingFullNameByEmail } from "../../../lib/storage/userMeta";

const ROLE_TO_API: Record<RegisterFormValues["role"], number> = {
  volunteer: 1,
  curator: 2,
};

export default function RegisterPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "curator",
      email: "",
      fio: "",
      password: "",
      password2: "",
      terms: false,
    },
    mode: "onBlur",
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await apiRegister({
        email: values.email.trim(),
        password: values.password,
        role: ROLE_TO_API[values.role],
      });

      // сохраняем ФИО локально до момента confirm-email (пока нет userId)
      setPendingFullNameByEmail(values.email.trim(), values.fio.trim());

      router.push(`/verify-email?email=${encodeURIComponent(values.email.trim())}`);
    } catch (e) {
      let message = "Не удалось зарегистрироваться";
      if (e instanceof ApiError) message = e.message;
      else if (e instanceof Error) message = e.message;

      if (message.toLowerCase().includes("существ")) {
        message = "Пользователь с таким Email уже существует";
      }
      setError("root", { message });
    }
  };

  return (
    <div className={styles.authWrap}>
      <div className={`${styles.authCard} ${styles.authCardRegister}`}>
        <h1 className={styles.authTitle}>
          <Link href="/login" className={styles.titleLink}>
            Вход
          </Link>
          /<span className={styles.active}>Регистрация</span>
        </h1>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          {errors.root?.message && (
            <div className={styles.formError}>
              <FieldError message={errors.root.message} />
              <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link
                  href="/login"
                  className={styles.titleLink}
                  style={{ textDecoration: "underline" }}
                >
                  Перейти на вход
                </Link>
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
            <span className={styles.fieldLabel}>Регистрация как:</span>
            <div className={styles.radioGroup}>
              <label className={styles.radio}>
                <input type="radio" value="curator" {...register("role")} />
                <span>Куратор/Организация</span>
              </label>
              <label className={styles.radio}>
                <input type="radio" value="volunteer" {...register("role")} />
                <span>Волонтёр</span>
              </label>
            </div>
          </div>

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
            <label className={styles.fieldLabel} htmlFor="fio">
              ФИО
            </label>
            <input
              id="fio"
              type="text"
              autoComplete="name"
              aria-invalid={!!errors.fio}
              className={`${styles.input} ${errors.fio ? styles.inputError : ""}`}
              {...register("fio")}
            />
            {errors.fio?.message && <FieldError message={errors.fio.message} />}
          </div>

          <div className={styles.field}>
            <label className={`${styles.fieldLabel} ${styles.fieldHint}`} htmlFor="pass">
              Придумайте пароль (минимум 8 символов, латиница, цифры, спецсимвол)
            </label>
            <input
              id="pass"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
              {...register("password")}
            />
            {errors.password?.message && <FieldError message={errors.password.message} />}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pass2">
              Повторите пароль
            </label>
            <input
              id="pass2"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password2}
              className={`${styles.input} ${errors.password2 ? styles.inputError : ""}`}
              {...register("password2")}
            />
            {errors.password2?.message && <FieldError message={errors.password2.message} />}
          </div>

          <label className={styles.check}>
            <input type="checkbox" {...register("terms")} />
            <span>Я принимаю пользовательское соглашение</span>
          </label>

          <div className={styles.termsErrorSlot}>
            {errors.terms?.message ? <FieldError message={errors.terms.message} /> : null}
          </div>

          <button className={styles.btn} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "..." : "ЗАРЕГИСТРИРОВАТЬСЯ"}
          </button>
        </form>
      </div>
    </div>
  );
}