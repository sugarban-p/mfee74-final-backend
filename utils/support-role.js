// Functionality: resolve whether a user should have support-agent privileges.
// Purpose: keep support authorization rules in one shared utility.

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getSupportEmailSet() {
  const raw = String(process.env.SUPPORT_EMAILS || "");
  const list = raw
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

  return new Set(list);
}

export function isSupportUser(user) {
  if (!user) return false;

  const supportEmailSet = getSupportEmailSet();
  if (supportEmailSet.size === 0) return false;

  return supportEmailSet.has(normalizeEmail(user.email));
}
