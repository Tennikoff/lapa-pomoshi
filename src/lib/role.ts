export type AnyRole = string | number | null | undefined;

export function isOrgRole(role: AnyRole): boolean {
  if (role === 2) return true;
  if (role === 1) return false;

  if (typeof role === "string") {
    const r = role.trim().toLowerCase();

    if (r === "организация") return true;
    if (r === "волонтёр") return false;

    if (r === "2") return true;
    if (r === "1") return false;

    if (r === "organization" || r === "org") return true;
    if (r === "volunteer") return false;
    if (r === "куратор") return true;
  }

  return false;
}