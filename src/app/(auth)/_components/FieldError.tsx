import { AlertTriangle } from "lucide-react";
import styles from "../auth.module.css";

export function FieldError({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <p className={`${styles.errorText} ${className}`} role="alert">
      <AlertTriangle className={styles.errorIcon} size={16} strokeWidth={2.2} />
      <span>{message}</span>
    </p>
  );
}