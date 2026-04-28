"use client";

import styles from "./confirmDeleteDialog.module.css";

type Props = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  question?: string;
};

export function ConfirmDeleteDialog({
  open,
  onCancel,
  onConfirm,
  question = "Вы уверены, что хотите удалить карточку?",
}: Props) {
  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.dialog}>
        <p className={styles.question}>{question}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={onCancel}>
            ОТМЕНА
          </button>
          <button type="button" className={styles.btn} onClick={onConfirm}>
            УДАЛИТЬ
          </button>
        </div>
      </div>
    </div>
  );
}