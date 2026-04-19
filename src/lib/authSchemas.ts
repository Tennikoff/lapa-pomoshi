import { z } from "zod";

const hasLatinLetter = /[A-Za-z]/;
const hasDigit = /\d/;
const hasSpecial = /[^A-Za-z0-9]/;
const hasCyrillic = /[А-Яа-яЁё]/;

export const registerSchema = z
  .object({
    role: z.enum(["curator", "volunteer"]),
    email: z.string().min(1, "Обязательное поле").email("Неверный Email"),
    fio: z.string().min(1, "Обязательное поле"),
    password: z
      .string()
      .min(8, "минимум 8 символов")
      .refine((v) => !hasCyrillic.test(v), "Пароль должен быть на латинице")
      .refine((v) => hasLatinLetter.test(v), "Пароль должен содержать латиницу")
      .refine((v) => hasDigit.test(v), "Пароль должен содержать цифру")
      .refine((v) => hasSpecial.test(v), "Пароль должен содержать спецсимвол"),
    password2: z.string().min(1, "Обязательное поле"),
    terms: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.password2) {
      ctx.addIssue({
        code: "custom",
        path: ["password2"],
        message: "Пароли не совпадают",
      });
    }

    if (!data.terms) {
      ctx.addIssue({
        code: "custom",
        path: ["terms"],
        message: "Необходимо принять пользовательское соглашение",
      });
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().min(1, "Обязательное поле").email("Неверный Email"),
  password: z.string().min(1, "Обязательное поле"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .min(6, "Введите код подтверждения")
    .regex(/^\d{6}$/, "Введите код подтверждения"),
});

export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

export const resetEmailSchema = z.object({
  email: z.string().min(1, "Обязательное поле").email("Введите корректный email"),
});
export type ResetEmailFormValues = z.infer<typeof resetEmailSchema>;

export const resetCodeSchema = z.object({
  code: z
    .string()
    .min(5, "Введите код восстановления")
    .regex(/^\d{6}$/, "Введите код восстановления"),
});
export type ResetCodeFormValues = z.infer<typeof resetCodeSchema>;

/** те же правила пароля, что и в регистрации */

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "минимум 8 символов")
      .refine((v) => !hasCyrillic.test(v), "Пароль должен быть на латинице")
      .refine((v) => hasLatinLetter.test(v), "Пароль должен содержать латиницу")
      .refine((v) => hasDigit.test(v), "Пароль должен содержать цифру")
      .refine((v) => hasSpecial.test(v), "Пароль должен содержать спецсимвол"),
    password2: z.string().min(1, "Обязательное поле"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.password2) {
      ctx.addIssue({
        code: "custom",
        path: ["password2"],
        message: "Пароли не совпадают",
      });
    }
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;