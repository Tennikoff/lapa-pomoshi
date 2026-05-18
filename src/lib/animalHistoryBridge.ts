// src/lib/animalHistoryBridge.ts

const PREFIX = "LP_ANIMAL_META_V1:";

type AnimalMetaV1 = {
  history?: string | null;
  specialNeeds?: string | null;
};

export function packAnimalSpecialNeeds(params: {
  history?: string | null;
  specialNeeds?: string | null;
}): string | null {
  const history = (params.history ?? "").trim();
  const specialNeeds = (params.specialNeeds ?? "").trim();

  // Ничего нет — пусть будет null (как и было)
  if (!history && !specialNeeds) return null;

  // Если история не заполнена — не меняем формат, храним specialNeeds “как раньше”
  if (!history) return specialNeeds || null;

  // История есть: упаковываем обе сущности в JSON
  const meta: AnimalMetaV1 = {
    history,
    specialNeeds: specialNeeds || null,
  };

  return PREFIX + JSON.stringify(meta);
}

export function unpackAnimalSpecialNeeds(raw: string | null | undefined): {
  history: string | null;
  specialNeeds: string | null;
  isPacked: boolean;
} {
  const t = String(raw ?? "").trim();
  if (!t) return { history: null, specialNeeds: null, isPacked: false };

  if (!t.startsWith(PREFIX)) {
    // старый формат: это обычные “особые потребности”
    return { history: null, specialNeeds: t, isPacked: false };
  }

  const json = t.slice(PREFIX.length).trim();
  try {
    const parsed = JSON.parse(json) as AnimalMetaV1;
    return {
      history: (parsed.history ?? null) ? String(parsed.history).trim() : null,
      specialNeeds: (parsed.specialNeeds ?? null) ? String(parsed.specialNeeds).trim() : null,
      isPacked: true,
    };
  } catch {
    // Если вдруг строка повреждена — не ломаем UI, показываем как “особые потребности”
    return { history: null, specialNeeds: t, isPacked: false };
  }
}