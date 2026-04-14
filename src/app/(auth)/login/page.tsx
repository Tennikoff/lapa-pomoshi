"use client";

import Link from "next/link";
import styles from "../auth.module.css";

export default function LoginPage() {
  return (
    <div className={styles.authWrap}>

      <div className={`${styles.authCard} ${styles.authCardLogin}`}>
        <h1 className={styles.authTitle}>
          <span className={styles.active}>Вход</span>/
          <Link href="/register" className={styles.titleLink}>
            Регистрация
          </Link>
        </h1>

        <form>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="email">
              Email
            </label>
            <input className={styles.input} id="email" name="email" type="email" autoComplete="email" />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pass">
              Пароль
            </label>
            <input className={styles.input} id="pass" name="password" type="password" autoComplete="current-password" />
          </div>

          <div className={styles.forgotRow}>
            <Link href="/reset-password" className={styles.forgotLink}>
              Забыли пароль?
            </Link>
          </div>

          <button className={styles.btn} type="submit">
            ВОЙТИ
          </button>
        </form>
      </div>
    </div>
  );
}