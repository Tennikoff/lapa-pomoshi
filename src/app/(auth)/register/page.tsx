"use client";

import Link from "next/link";
import styles from "../auth.module.css";

export default function RegisterPage() {
  return (
    <div className={styles.authWrap}>

      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>
          <Link href="/login" className={styles.titleLink}>
            Вход
          </Link>
          /<span className={styles.active}>Регистрация</span>
        </h1>

        <form>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Регистрация как:</span>
            <div className={styles.radioGroup}>
              <label className={styles.radio}>
                <input type="radio" name="role" defaultChecked value="curator" />
                <span>Куратор/Организация</span>
              </label>

              <label className={styles.radio}>
                <input type="radio" name="role" value="volunteer" />
                <span>Волонтёр</span>
              </label>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="email">
              Email
            </label>
            <input className={styles.input} id="email" name="email" type="email" />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="fio">
              ФИО
            </label>
            <input className={styles.input} id="fio" name="fio" type="text" />
          </div>

          <div className={styles.field}>
            <label className={`${styles.fieldLabel} ${styles.fieldHint}`} htmlFor="pass">
              Придумайте пароль (минимум 8 символов, латиница, цифры, спецсимвол)
            </label>
            <input className={styles.input} id="pass" name="password" type="password" />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pass2">
              Повторите пароль
            </label>
            <input className={styles.input} id="pass2" name="password2" type="password" />
          </div>

          <label className={styles.check}>
            <input type="checkbox" name="terms" />
            <span>Я принимаю пользовательское соглашение</span>
          </label>

          <button className={styles.btn} type="submit">
            ЗАРЕГИСТРИРОВАТЬСЯ
          </button>
        </form>
      </div>
    </div>
  );
}