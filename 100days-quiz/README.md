# 戀愛人格測試網站

黑白灰科技風的互動測驗網站。使用者依序回答 11 題，最後觸發彩蛋，並把作答結果自動寄一封 email 給你。

## 檔案結構

```
100days-quiz/
├── index.html          # 頁面骨架（開始 → 測驗 → 分析暱稱 → 結果彩蛋 → 100天頁）
├── style.css            # 黑白灰科技風樣式
├── script.js             # 測驗邏輯、進度條、文字解密彩蛋、送出結果
└── functions/
    └── api/
        └── submit.js     # Cloudflare Pages Function，收到結果後透過 Resend 寄信
```

## 網站流程

1. **開始畫面**：輸入暱稱，開始測驗。
2. **測驗畫面**：上方進度條即時顯示第幾題／共 11 題，每題 4 個互動選項按鈕。
3. **分析暱稱畫面**：測驗結束後，要求再輸入一次暱稱以「產生分析」。
4. **結果畫面**：顯示「使用者：（剛輸入的暱稱）」。滑鼠移到「取得分析結果」按鈕上時，
   文字會用解密動畫轉成「梁宸彰」；移開滑鼠會轉回原本暱稱。點擊按鈕才會真正送出資料並寄信。
5. **100 天頁面**：目前先留空（`index.html` 裡的 `#finalContent`），
   之後要放的動畫元素可以直接貼進這個區塊。

## 部署到 Cloudflare Pages

1. 把這個資料夾整個 push 到一個 GitHub repo（或用 `wrangler pages deploy` 直接部署，不需要建置步驟，
   純靜態檔案＋Pages Functions）。
2. 到 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **建立** → **Pages** →
   連接你的 GitHub repo。
   - Build command：留空
   - Build output directory：`/`（專案根目錄）
3. 部署完成後，到專案的 **Settings → Environment variables**，新增以下變數（Production 和 Preview 都要設定）：

   | 變數名稱 | 說明 | 範例 |
   |---|---|---|
   | `RESEND_API_KEY` | 你在 Resend 申請的 API Key | `re_xxxxxxxx` |
   | `TO_EMAIL` | 結果要寄到的信箱（你自己的信箱） | `you@example.com` |
   | `FROM_EMAIL` | 寄件人地址（選填） | `notify@yourdomain.com` |

## 設定 Resend（免費寄信服務）

1. 到 [resend.com](https://resend.com) 註冊帳號。
2. 到 **API Keys** 頁面建立一組新的 Key，貼到 Cloudflare 的 `RESEND_API_KEY`。
3. 兩種寄件人設定方式：
   - **最快測試**：不設定 `FROM_EMAIL`，程式會用 Resend 提供的測試寄件位址 `onboarding@resend.dev`。
     這個位址在 Resend 免費方案下**只能寄到你註冊 Resend 時用的那個信箱**，適合先測試流程。
   - **正式上線**：到 Resend 的 **Domains** 頁面新增並驗證你自己的網域（加幾筆 DNS 紀錄），
     驗證通過後就能用 `notify@你的網域` 當寄件人，也能寄給任何收件人。
4. 設定完成後重新部署（或觸發一次新的 deploy），環境變數才會生效。

## 本機預覽

不需要任何建置工具，直接用任何靜態伺服器打開 `index.html` 即可看到畫面
（但 `/api/submit` 這個 Function 只有部署到 Cloudflare Pages 後才會運作；
本機預覽時點擊「取得分析結果」，送信會失敗，但畫面仍會正常跳轉到 100 天頁面，不影響操作）。

如果想連 Function 一起在本機測試，可以安裝 `wrangler` 後執行：

```bash
npx wrangler pages dev . --compatibility-date=2024-01-01
```

並在指令加上 `--binding` 或用 `.dev.vars` 檔案帶入 `RESEND_API_KEY` / `TO_EMAIL` / `FROM_EMAIL`。

## 之後要做的事

- [ ] 設計「100 天」頁面的實際內容，取代 `index.html` 裡 `#finalContent` 的預留文字。
- [ ] 把預計要貼上的動畫元素（例如你提供的 OrbitImages 之類的元件）整合進 `#finalContent`。
- [ ] 如果要正式使用，記得到 Resend 驗證自己的網域，避免只能寄到單一信箱的限制。
