# 戀愛人格測試網站（Cloudflare Workers 版）

黑白灰科技風的互動測驗網站。使用者依序回答題目，最後觸發彩蛋，並把作答結果自動寄一封 email 給你。

這個版本改成 **Cloudflare Workers**（原本是 Pages Functions 寫法，已改成 Workers + Static Assets 相容結構）。

## 檔案結構

```
100days-quiz/
├── wrangler.jsonc        # Workers 設定檔：進入點、相容日期、靜態資源綁定
├── package.json           # wrangler 依賴 + 部署指令
├── src/
│   └── index.js            # Worker 進入點：處理 /api/submit，其餘交給靜態資源
└── public/                 # 所有靜態檔案（原本 Pages 的根目錄內容都搬進來了）
    ├── index.html
    ├── style.css
    ├── script.js
    ├── 100days.html
    ├── 100days.css
    ├── 100days.js
    └── assets/              # 100 天頁面用的照片，放你自己的圖片檔進去
```

## 為什麼要改成這個結構

Cloudflare Pages 的 `functions/api/xxx.js` 是靠檔案路徑自動產生路由，只有在**傳統 Pages 專案**才有效。
如果你的 Git 整合實際上跑的是 `npx wrangler deploy`（Workers 部署指令，不是 `wrangler pages deploy`），
`functions/` 資料夾會被完全忽略，`/api/submit` 就會 404。

現在改成單一進入點 `src/index.js`：
- `POST /api/submit` → 交給 Worker 處理，呼叫 Resend 寄信
- 其他所有路徑（`index.html`、`100days.html`、圖片…）→ Cloudflare 自動先比對 `public/` 底下有沒有對應檔案，
  有的話直接回傳靜態檔案；只有比對不到才會進到 Worker 程式碼

這個機制是 [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/binding/) 提供的，
你不用自己寫任何靜態檔案的路由邏輯。

## 部署方式

### 1. 確認 Worker 名稱

`wrangler.jsonc` 裡的 `"name": "owen-100days"` 建議改成跟你 Cloudflare Dashboard 上原本那個 Worker
**完全一樣的名稱**（截圖看起來你的 Git 存放庫是 `cyleafish/Owen_100days`，如果 Worker 名稱不是
`owen-100days`，記得改成一致，避免部署出一個新的、空的 Worker）。

### 2. 環境變數（跟之前一樣，不用重設）

到 Cloudflare Dashboard → 你的 Worker → **設定 → 變數與機密**，確認以下變數存在：

| 變數名稱 | 類型 | 說明 |
|---|---|---|
| `RESEND_API_KEY` | 機密 | 你在 Resend 申請的 API Key |
| `TO_EMAIL` | 變數 | 結果要寄到的信箱 — **請仔細檢查拼字**（例如 `gmail.com` 不要打成 `gamil.com`） |
| `FROM_EMAIL` | 變數（選填） | 寄件人地址，不設就用 `onboarding@resend.dev` |

改動變數後 Cloudflare 通常會提示需要重新部署（Redeploy）才會套用到正式環境。

### 3. Git 部署（跟你現在的流程一樣）

因為 `wrangler.jsonc` 裡已經設定好 `main` 和 `assets`，Cloudflare Dashboard 裡「組建組態」的部署命令
**維持原本的 `npx wrangler deploy`** 即可，不用改。push 到 `main` 分支就會自動重新部署。

### 4. 本機測試（選用）

```bash
npm install
npm run dev
```

會啟動本機開發伺服器，`/api/submit` 和靜態頁面都能在本機測試。要測試寄信功能，
在專案根目錄建立 `.dev.vars`（已加進 `.gitignore`，不會被 commit）：

```
RESEND_API_KEY=re_xxxxxxxx
TO_EMAIL=你的信箱
FROM_EMAIL=onboarding@resend.dev
```

## 部署後怎麼確認 email 有沒有問題

1. 打開網站 → F12 開發者工具 → Network 分頁
2. 跑一次測驗到最後一步
3. 找到 `submit` 這個請求：
   - **200** → 呼叫成功，若還是沒收到信，先檢查 `TO_EMAIL` 拼字，或去 Resend 後台的 Logs 頁面看實際寄送狀態
   - **404** → 代表 Worker 沒吃到這個路徑，回去檢查 `wrangler.jsonc` 的 `main` 是否指向 `src/index.js`、有沒有重新部署
   - **500 / 502** → 通常是 `RESEND_API_KEY` 或 `TO_EMAIL` 沒設定 / 設錯，看 Response 內容裡的 `error` 訊息

## 之後要做的事

- [ ] 把你自己的照片放進 `public/assets/`，檔名要跟 `public/100days.js` 裡 `PHOTOS` 陣列一致
- [ ] 部署前重新確認 `wrangler.jsonc` 的 Worker 名稱跟 Dashboard 上的一致
