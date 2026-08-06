// Functionality: normalize avatar URLs for safe frontend rendering.
// Purpose: keep Google avatar handling consistent across auth and OAuth routes.

export function isGoogleAvatarUrl(value) {
  const source = String(value || "").trim();
  if (!source) return false;

  try {
    const parsed = new URL(source);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.toLowerCase().endsWith("googleusercontent.com")
    );
  } catch {
    return false;
  }
}

export function buildGoogleAvatarProxyUrl(origin, sourceUrl) {
  const base = String(origin || "").replace(/\/$/, "");
  const source = String(sourceUrl || "").trim();
  if (!base || !source) return source;

  return `${base}/api/oauth/google/avatar?src=${encodeURIComponent(source)}`;
}
