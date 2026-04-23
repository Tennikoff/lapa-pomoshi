export const ORG_EXTRA_CHANGED_EVENT = "lp_org_extra_changed";

export type OrgExtra = {
  about: string;
  phone: string;
  website: string;
  needs: string[];
  city: string;
  districts: string[];
  donationRequisites: string;
};

const KEY = "lp_org_extra_v1";

function canUseLS() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ORG_EXTRA_CHANGED_EVENT));
}

function loadMap(): Record<string, OrgExtra> {
  if (!canUseLS()) return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function saveMap(map: Record<string, OrgExtra>) {
  if (!canUseLS()) return;
  localStorage.setItem(KEY, JSON.stringify(map));
  emitChanged();
}

export function getOrgExtra(userId: string): OrgExtra | null {
  return loadMap()[userId] ?? null;
}

export function setOrgExtra(userId: string, extra: OrgExtra) {
  const map = loadMap();
  map[userId] = extra;
  saveMap(map);
}