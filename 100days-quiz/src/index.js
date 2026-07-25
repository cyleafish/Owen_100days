// Cloudflare Workers 進入點
// - POST /api/submit  → 寄送測驗結果 email（透過 Resend）
// - 其他所有路徑       → 交給 Workers Static Assets 處理（public/ 底下的檔案）
//
// 環境變數（在 Cloudflare Dashboard → 你的 Worker → 設定 → 變數和祕密 設定）：
//   RESEND_API_KEY   你的 Resend API Key（必填，設成「機密」）
//   TO_EMAIL         結果要寄到哪個信箱（必填）
//   FROM_EMAIL       寄件人地址（選填，預設 onboarding@resend.dev）
//
// ============================================================
// 除錯模式（debug）說明
// ============================================================
// Workers 沒辦法像瀏覽器一樣直接點一下設「中斷點」，這裡改用兩種方式讓你看到
// 每一步發生了什麼：
//
// 1. console.log — 每個關鍵步驟都會印出來。部署後打開：
//      Cloudflare Dashboard → 你的 Worker → Observability → Logs
//    或在本機用 `npx wrangler tail` 就能看到「即時日誌」，跟平常在瀏覽器
//    Console 看 log 的體驗一樣。
//
// 2. DEBUG_MODE — 設為 true 時，/api/submit 回傳的 JSON 會多帶一個
//    `debug` 欄位，內容包含每一步的狀態，直接在瀏覽器 F12 → Network →
//    submit → Response 就能看到，不用另外開日誌頁面。
//
// 排查完問題、要正式上線前，記得把 DEBUG_MODE 改回 false，
// 避免把診斷資訊（例如 Key 是否有設定）暴露給任何打這支 API 的人看到。
const DEBUG_MODE = true;

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml({ nickname1, answers, submittedAt }) {
  const rows = (answers || [])
    .map(
      (a, i) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #2e2e2e;color:#8a8a8a;font-family:monospace;font-size:12px;vertical-align:top;white-space:nowrap;">
          Q${String(i + 1).padStart(2, "0")}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #2e2e2e;">
          <div style="color:#f6f6f4;font-weight:600;margin-bottom:4px;">${escapeHtml(a.question)}</div>
          <div style="color:#c9c9c9;">${escapeHtml(a.selected)}</div>
        </td>
      </tr>`
    )
    .join("");

  return `
  <div style="background:#0a0a0a;padding:32px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#131313;border:1px solid #2e2e2e;padding:28px;">
      <div style="font-family:monospace;font-size:11px;letter-spacing:0.15em;color:#8a8a8a;text-transform:uppercase;margin-bottom:12px;">
        Love Personality Protocol · New Submission
      </div>
      <h2 style="color:#f6f6f4;margin:0 0 18px;">小可愛100天測驗結果</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <tr>
          <td style="padding:8px 12px;color:#8a8a8a;">開始暱稱</td>
          <td style="padding:8px 12px;color:#f6f6f4;">${escapeHtml(nickname1 || "—")}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;color:#8a8a8a;">送出時間</td>
          <td style="padding:8px 12px;color:#f6f6f4;">${escapeHtml(submittedAt || "—")}</td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;">
        ${rows}
      </table>
    </div>
  </div>`;
}

async function handleSubmit(request, env) {
  console.log("[submit] ── 收到請求 ──");

  // ------------------------------------------------------------
  // 中斷點 1：檢查環境變數有沒有讀到
  // ------------------------------------------------------------
  const hasKey = Boolean(env.RESEND_API_KEY);
  const hasTo = Boolean(env.TO_EMAIL);
  console.log("[submit] 1. 環境變數檢查 →", {
    RESEND_API_KEY_exists: hasKey,
    RESEND_API_KEY_preview: hasKey ? `${env.RESEND_API_KEY.slice(0, 6)}...(共 ${env.RESEND_API_KEY.length} 字元)` : null,
    TO_EMAIL_exists: hasTo,
    TO_EMAIL_value: env.TO_EMAIL || null,
    FROM_EMAIL_value: env.FROM_EMAIL || "(未設定，將使用預設值)",
  });

  if (!hasKey || !hasTo) {
    console.log("[submit] ✕ 中斷：環境變數沒設定完整");
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server email is not configured.",
        debug: DEBUG_MODE ? { step: "env-check", hasKey, hasTo } : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // ------------------------------------------------------------
  // 中斷點 2：檢查前端送過來的 body 有沒有正確解析
  // ------------------------------------------------------------
  let data;
  try {
    data = await request.json();
    console.log("[submit] 2. 收到的內容 →", {
      nickname1: data.nickname1,
      answerCount: Array.isArray(data.answers) ? data.answers.length : "不是陣列",
      submittedAt: data.submittedAt,
    });
  } catch (err) {
    console.log("[submit] ✕ 中斷：body 不是合法 JSON →", err.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid JSON body.",
        debug: DEBUG_MODE ? { step: "parse-body", message: err.message } : undefined,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const nickname1 = (data.nickname1 || "訪客").toString().slice(0, 40);

  // ------------------------------------------------------------
  // 中斷點 3：實際呼叫 Resend API 之前
  // ------------------------------------------------------------
  const emailPayload = {
    from: env.FROM_EMAIL || "onboarding@resend.dev",
    to: env.TO_EMAIL,
    subject: `新的戀愛人格測試結果 - ${nickname1}`,
    html: buildEmailHtml(data),
  };
  console.log("[submit] 3. 準備呼叫 Resend →", {
    from: emailPayload.from,
    to: emailPayload.to,
    subject: emailPayload.subject,
  });

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    // ------------------------------------------------------------
    // 中斷點 4：Resend 回應之後（不管成功失敗都印出來）
    // ------------------------------------------------------------
    const resendBodyText = await resendRes.text();
    console.log("[submit] 4. Resend 回應 →", {
      status: resendRes.status,
      ok: resendRes.ok,
      body: resendBodyText,
    });

    if (!resendRes.ok) {
      console.log("[submit] ✕ 中斷：Resend 回傳非 2xx");
      return new Response(
        JSON.stringify({
          success: false,
          error: resendBodyText,
          debug: DEBUG_MODE
            ? { step: "resend-call", status: resendRes.status, sentTo: emailPayload.to, sentFrom: emailPayload.from }
            : undefined,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[submit] ✓ 完成：寄信成功");
    return new Response(
      JSON.stringify({
        success: true,
        debug: DEBUG_MODE ? { step: "done", resendResponse: resendBodyText } : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.log("[submit] ✕ 中斷：fetch 本身丟出例外 →", err.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
        debug: DEBUG_MODE ? { step: "fetch-exception", message: err.message } : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/submit" && request.method === "POST") {
      return handleSubmit(request, env);
    }

    // 其餘路徑（index.html、100days.html、圖片等）交給 Workers Static Assets
    return env.ASSETS.fetch(request);
  },
};
