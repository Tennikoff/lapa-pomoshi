"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./AnimalTypeSelect.module.css";

export type AnimalTypeOption = {
  label: string; // то, что показываем в списке
  value: string; // то, что отправляем в API/форму
};

export const ANIMAL_TYPE_OPTIONS: AnimalTypeOption[] = [
  { label: "Собаки", value: "Собака" },
  { label: "Кошки", value: "Кошка" },
  { label: "Рыбы", value: "Рыба" },
  { label: "Кролики", value: "Кролик" },
  { label: "Птицы", value: "Птица" },
  { label: "Грызуны", value: "Грызун" },
  { label: "Хорьки", value: "Хорёк" },
  { label: "Рептилии", value: "Рептилия" },
];

export function AnimalTypeSelect({
  name,
  value,
  onChange,
  placeholder = "Выберите вид животного",
  options = ANIMAL_TYPE_OPTIONS,
}: {
  name: string;
  value: string; // API value
  onChange: (nextValue: string) => void;
  placeholder?: string;
  options?: AnimalTypeOption[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(() => {
    const found = options.find((x) => x.value === value);
    return found?.label ?? "";
  }, [options, value]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={rootRef}>
      {/* скрытый input, чтобы FormData('species') работал как раньше */}
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        className={styles.control}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.value}>
          {selectedLabel ? (
            selectedLabel
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </span>
        <span className={styles.chev}>{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div className={styles.menu} role="listbox" aria-label="Выбор вида животного">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`${styles.item} ${active ? styles.itemActive : ""}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                role="option"
                aria-selected={active}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}