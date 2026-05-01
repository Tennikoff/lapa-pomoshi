export function isOrgRole(role: unknown): boolean {
  // поддержим и старый формат (2), и новый строковый
  if (role === 2) return true;
  if (typeof role === "string") {
    const r = role.trim().toLowerCase();
    return r === "организация" || r === "куратор";
  }
  return false;
}