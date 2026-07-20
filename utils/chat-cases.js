// Functionality: manage support chat case metadata and summaries. Purpose: keep chat history grouping logic consistent for list and detail APIs.

export function newCaseId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `C${yy}${mm}${dd}${hh}${mi}${ss}`;
}

export function buildMessageMeta(caseId, event) {
  return { caseId, event };
}

export function readCaseMeta(metadata) {
  if (!metadata) return {};

  let parsed = metadata;
  if (typeof metadata === "string") {
    try {
      parsed = JSON.parse(metadata);
    } catch {
      return {};
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  return {
    caseId: typeof parsed.caseId === "string" ? parsed.caseId : undefined,
    event: typeof parsed.event === "string" ? parsed.event : undefined,
    replyType:
      typeof parsed.replyType === "string" ? parsed.replyType : undefined,
  };
}

function isVisibleMessage(event, content) {
  if (event === "CASE_OPEN" || event === "CASE_CLOSED") return false;
  return String(content || "").trim().length > 0;
}

export function summarizeCases(messages) {
  const byCase = new Map();
  const ordered = [...messages].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  for (const msg of ordered) {
    const meta = readCaseMeta(msg.metadata);
    if (!meta.caseId) continue;

    const existing = byCase.get(meta.caseId);
    const createdAt = new Date(msg.createdAt);

    if (!existing) {
      byCase.set(meta.caseId, {
        caseId: meta.caseId,
        status: meta.event === "CASE_CLOSED" ? "CLOSED" : "OPEN",
        openedAt: createdAt,
        closedAt: meta.event === "CASE_CLOSED" ? createdAt : null,
        lastMessageAt: createdAt,
        messageCount: isVisibleMessage(meta.event, msg.content) ? 1 : 0,
        preview: isVisibleMessage(meta.event, msg.content) ? msg.content : "",
      });
      continue;
    }

    existing.lastMessageAt = createdAt;
    if (meta.event === "CASE_CLOSED") {
      existing.status = "CLOSED";
      existing.closedAt = createdAt;
    }
    if (meta.event === "CASE_OPEN" && existing.openedAt > createdAt) {
      existing.openedAt = createdAt;
    }
    if (isVisibleMessage(meta.event, msg.content)) {
      existing.messageCount += 1;
      existing.preview = msg.content;
    }
  }

  return Array.from(byCase.values())
    .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
    .map((item) => ({
      caseId: item.caseId,
      status: item.status,
      openedAt: item.openedAt.toISOString(),
      closedAt: item.closedAt ? item.closedAt.toISOString() : null,
      lastMessageAt: item.lastMessageAt.toISOString(),
      messageCount: item.messageCount,
      preview: item.preview,
    }));
}

export function getCaseStatus(messages, caseId) {
  let found = false;
  let status = "OPEN";

  for (const msg of messages) {
    const meta = readCaseMeta(msg.metadata);
    if (meta.caseId !== caseId) continue;
    found = true;
    if (meta.event === "CASE_CLOSED") status = "CLOSED";
    if (meta.event === "CASE_OPEN") status = "OPEN";
  }

  return found ? status : null;
}
