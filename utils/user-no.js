// Functionality: generate a readable member number with checksum. Purpose: keep userNo format stable across registration sources.

const CHECK_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function toBase36Value(ch) {
  if (ch >= "0" && ch <= "9") return Number(ch);
  return ch.charCodeAt(0) - 55;
}

function buildCheckChar(base) {
  const body = base.slice(1);
  const weightedBody = [...body].reduce((sum, ch, idx) => {
    return sum + toBase36Value(ch) * (idx + 1);
  }, 0);
  const prefixFactor = toBase36Value(base[0] || "U") * 2;
  const checkIndex = (weightedBody + prefixFactor) % CHECK_ALPHABET.length;
  return CHECK_ALPHABET[checkIndex];
}

export function buildUserNo(createdAt, id) {
  const yy = String(createdAt.getFullYear()).slice(-2);
  const mm = String(createdAt.getMonth() + 1).padStart(2, "0");
  const dd = String(createdAt.getDate()).padStart(2, "0");
  const serial = String(id);
  const base = `U${yy}${mm}${dd}${serial}`;
  return `${base}${buildCheckChar(base)}`;
}
