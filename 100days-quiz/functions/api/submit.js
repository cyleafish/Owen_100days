// Cloudflare Pages Function
// Route: POST /api/submit
//
// 需要在 Cloudflare Pages 專案的 Settings → Environment variables 設定：
//   RESEND_API_KEY   你的 Resend API Key（必填）
//   TO_EMAIL         結果要寄到哪個信箱（必填）
//   FROM_EMAIL       寄件人地址（選填，預設 onboarding@resend.dev，
//                     正式使用建議改成你在 Resend 驗證過網域的地址）

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml({ nickname1, nickname2, answers, submittedAt }) {
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

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RESEND_API_KEY || !env.TO_EMAIL) {
    return new Response(
      JSON.stringify({ success: false, error: "Server email is not configured." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const nickname2 = (data.nickname2 || data.nickname1 || "訪客").toString().slice(0, 40);

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "onboarding@resend.dev",
        to: env.TO_EMAIL,
        subject: `新的戀愛人格測試結果 - ${nickname2}`,
        html: buildEmailHtml(data),
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      return new Response(JSON.stringify({ success: false, error: errText }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
