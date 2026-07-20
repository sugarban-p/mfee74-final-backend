// Functionality: run end-to-end API smoke checks against the local backend.
// Purpose: quickly verify schema-field alignment and major auth/member/chat flows.

const baseUrl = process.env.API_BASE_URL || "http://localhost:3001";
const testEmail = `smoke_${Date.now()}@example.com`;
const testPassword = "Password123!";

let sessionCookie = "";
let accessToken = "";
let refreshToken = "";
let caseId = "";
let hasFailure = false;

function printResult(ok, label, detail = "") {
  const icon = ok ? "[PASS]" : "[FAIL]";
  const line = `${icon} ${label}${detail ? ` - ${detail}` : ""}`;
  console.log(line);
  if (!ok) hasFailure = true;
}

function extractSessionCookie(response) {
  const setCookie = response.headers.get("set-cookie") || "";
  const match = setCookie.match(/connect\.sid=[^;]+/);
  if (match) {
    sessionCookie = match[0];
  }
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (sessionCookie) {
    headers.Cookie = headers.Cookie
      ? `${headers.Cookie}; ${sessionCookie}`
      : sessionCookie;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  extractSessionCookie(response);

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { response, data };
}

async function run() {
  console.log(`Smoke test target: ${baseUrl}`);

  {
    const { response, data } = await request("/", { method: "GET" });
    printResult(
      response.status === 200 && data?.success === true,
      "GET /",
      `status=${response.status}`,
    );
  }

  {
    const { response, data } = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    printResult(
      response.status === 201 && data?.message === "REGISTERED",
      "POST /api/auth/register",
      `status=${response.status}`,
    );
  }

  {
    const { response, data } = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    accessToken = data?.accessToken || "";
    refreshToken = data?.refreshToken || "";
    printResult(
      response.status === 200 &&
        data?.message === "LOGIN_SUCCESS" &&
        Boolean(accessToken) &&
        Boolean(refreshToken),
      "POST /api/auth/login",
      `status=${response.status}`,
    );
  }

  {
    const previousAccessToken = accessToken;
    const { response, data } = await request("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    accessToken = data?.accessToken || accessToken;
    refreshToken = data?.refreshToken || refreshToken;

    printResult(
      response.status === 200 &&
        data?.message === "TOKEN_REFRESHED" &&
        Boolean(accessToken) &&
        Boolean(refreshToken) &&
        previousAccessToken !== accessToken,
      "POST /api/auth/refresh",
      `status=${response.status}`,
    );
  }

  {
    const { response } = await request("/api/user/profile", {
      method: "GET",
    });
    printResult(
      response.status === 200,
      "GET /api/user/profile",
      `status=${response.status}`,
    );
  }

  {
    const { response } = await request("/api/user/security", {
      method: "GET",
    });
    printResult(
      response.status === 200,
      "GET /api/user/security",
      `status=${response.status}`,
    );
  }

  {
    const { response } = await request("/api/dashboard/stats", {
      method: "GET",
    });
    printResult(
      response.status === 200,
      "GET /api/dashboard/stats",
      `status=${response.status}`,
    );
  }

  {
    const { response, data } = await request("/api/chat/send", {
      method: "POST",
      body: JSON.stringify({ content: "請問運費" }),
    });
    caseId = data?.caseId || "";
    printResult(
      response.status === 200 && Boolean(caseId),
      "POST /api/chat/send",
      `status=${response.status}`,
    );
  }

  {
    const { response } = await request("/api/chat/history?range=today", {
      method: "GET",
    });
    printResult(
      response.status === 200,
      "GET /api/chat/history",
      `status=${response.status}`,
    );
  }

  {
    const { response } = await request("/api/chat/case/close", {
      method: "POST",
      body: JSON.stringify({ caseId }),
    });
    printResult(
      response.status === 200,
      "POST /api/chat/case/close",
      `status=${response.status}`,
    );
  }

  {
    const { response } = await request("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    printResult(
      response.status === 200,
      "POST /api/auth/logout",
      `status=${response.status}`,
    );
  }

  if (hasFailure) {
    console.error("Smoke test finished with failures.");
    process.exit(1);
  }

  console.log("Smoke test finished successfully.");
}

run().catch((error) => {
  console.error("Smoke test crashed:", error);
  process.exit(1);
});
