export type AnyRole = string | number | null | undefined;

export function isOrgRole(role: AnyRole): boolean {
  if (role === 2) return true; // совместимость со старым форматом
  if (role === 1) return false;

  if (typeof role === "string") {
    const r = role.trim().toLowerCase();
    // основной новый формат
    if (r === "организация") return true;
    if (r === "волонтёр") return false;

    // запасные варианты, если бэк/БД когда-то поменяют формат
    if (r === "organization" || r === "org") return true;
    if (r === "volunteer") return false;
  }

  return false;
}