export type AnyRole = string | number | null | undefined;

export function isOrgRole(role: AnyRole): boolean {
  // старый формат
  if (role === 2) return true;
  if (role === 1) return false;

  if (typeof role === "string") {
    const r = role.trim().toLowerCase();

    // новый формат из API
    if (r === "организация") return true;
    if (r === "волонтёр") return false;

    // иногда роль может прилететь как строковый "2"/"1" (например из claim’ов/маппинга)
    if (r === "2") return true;
    if (r === "1") return false;

    // запасные варианты
    if (r === "organization" || r === "org") return true;
    if (r === "volunteer") return false;
    if (r === "куратор") return true;
  }

  return false;
}