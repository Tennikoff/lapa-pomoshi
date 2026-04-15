"use client";

import Link from "next/link";
import styles from "../auth.module.css";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerSchema, type RegisterFormValues } from "../../../lib/authSchemas";
import { FieldError } from "../_components/FieldError";

export default function RegisterPage() {
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
      // TODO: подключим API на следующем шаге
      console.log("REGISTER SUBMIT", values);
    } catch (e) {
      // без any: e имеет тип unknown
      const message =
        e instanceof Error ? e.message : "Пользователь с таким Email уже существует";

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
          {/* Общая ошибка формы (обычно от API) */}
          {errors.root?.message && (
            <div className={styles.formError}>
              <FieldError message={errors.root.message} />
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

          {/* СЛОТ: здесь настраиваешь "высоту" сообщения через CSS (min-height) */}
          <div className={styles.termsErrorSlot}>
            {errors.terms?.message ? (
              <FieldError
                message={errors.terms.message}
                className={styles.termsErrorText}
              />
            ) : null}
          </div>

          <button className={styles.btn} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "..." : "ЗАРЕГИСТРИРОВАТЬСЯ"}
          </button>
        </form>
      </div>
    </div>
  );
}