/* ============================================================
   資料：11 題戀愛人格測試
   ============================================================ */
const QUESTIONS = [
  {
    q: "在曖昧中的對方突然對你靠近，你會如何反應？",
    options: [
      "表面鎮定，但內心無敵困惑呆在原地",
      "順勢接招，讓這份曖昧繼續發酵",
      "非常驚恐，立馬彈開保持距離",
      "主動試探，笑著回應看看對方的反應",
    ],
  },
  // {
  //   q: "伴侶做什麼你會最不開心？",
  //   options: [
  //     "約好的時間遲到",
  //     "自己什麼都不做，出一張嘴叫你做",
  //     "答應好不做的事情還是做了",
  //     "把你的計劃打亂，並且希望你依照他的想法",
  //   ],
  // },
  // {
  //   q: "你希望如何慶祝你的生日？",
  //   options: [
  //     "大肆慶祝，包下整間餐廳，希望全部人都知道",
  //     "幾個好朋友約出來一起吃飯吃蛋糕就好",
  //     "跟一兩個真心好友、伴侶共同慶祝",
  //     "自己慶祝最開心",
  //   ],
  // },
  // {
  //   q: "做什麼事情會讓你最開心？",
  //   options: [
  //     "一個人的騎車旅行",
  //     "與伴侶一起逛逛的開心下午",
  //     "完成自己計畫內的任務",
  //     "什麼都不用思考的發呆",
  //   ],
  // },
  // {
  //   q: "你更喜歡收到哪個禮物？",
  //   options: [
  //     "手做禮物與卡片",
  //     "一場精心規劃的旅行",
  //     "喜歡但自己買不下手的東西",
  //     "一場多人的派對",
  //   ],
  // },
  // {
  //   q: "在有伴侶的情況下，有異性好友來示好你會？",
  //   options: [
  //     "明確表示自己有伴侶了",
  //     "再多觀察，以避免是自己想多了",
  //     "順勢接受並裝作不知道對方心意",
  //     "坦白告訴伴侶這件事，一起討論怎麼處理",
  //   ],
  // },
  // {
  //   q: "伴侶做什麼最容易讓你心動？",
  //   options: [
  //     "很認真聽我說話",
  //     "主動照顧我的情緒",
  //     "願意陪自己完成想做的事",
  //     "默默記住我的一切",
  //   ],
  // },
  // {
  //   q: "如果伴侶說：「今天不能告訴你要去哪。」你會？",
  //   options: [
  //     "超期待，完全交給對方安排",
  //     "想要透露一點方向，讓自己能準備",
  //     "很怕踩雷，還是希望先討論",
  //     "比起驚喜，還是更喜歡一起規劃",
  //   ],
  // },
  // {
  //   q: "若你難過時希望伴侶如何反應？",
  //   options: [
  //     "馬上到你的身邊給予抱抱",
  //     "給予你喜歡的東西來哄你開心",
  //     "與你一同感同身受的難過並安慰",
  //     "給你一些自己的空間，等你準備好再陪你",
  //   ],
  // },
  // {
  //   q: "在愛情裡，你最希望得到哪一種肯定？",
  //   options: [
  //     "「謝謝你一直陪著我」",
  //     "「未來也想一直跟你在一起」",
  //     "「因為有你，我變得更好了」",
  //     "「你就是我每天最快樂的原因」",
  //   ],
  // },
  // {
  //   q: "什麼最能讓你有安全感？",
  //   options: [
  //     "每天分享生活",
  //     "對未來有共同規劃",
  //     "答應的事情說到做到",
  //     "願意花時間陪伴",
  //   ],
  // },
];

const REVEAL_NAME = "梁宸彰";

/* ============================================================
   狀態
   ============================================================ */
const state = {
  nickname1: "",
  nickname2: "",
  currentQ: 0,
  answers: [], // { question, selected, index }
};

/* ============================================================
   DOM refs
   ============================================================ */
const $ = (sel) => document.querySelector(sel);

const screens = {
  start: document.querySelector('[data-screen="start"]'),
  quiz: document.querySelector('[data-screen="quiz"]'),
  // gate: document.querySelector('[data-screen="analysis-gate"]'),
  result: document.querySelector('[data-screen="result"]'),
  final: document.querySelector('[data-screen="final"]'),
};

const progressShell = $("#progressShell");
const progressFill = $("#progressFill");
const progressStep = $("#progressStep");
const progressTotal = $("#progressTotal");

const nicknameInput1 = $("#nicknameInput1");
const startBtn = $("#startBtn");

const qIndexLabel = $("#qIndexLabel");
const questionText = $("#questionText");
const optionsWrap = $("#optionsWrap");

// const analysisBtn = $("#analysisBtn");

const userTag = $("#userTag");
const resultBtn = $("#resultBtn");
const submitHint = $("#submitHint");

progressTotal.textContent = String(QUESTIONS.length).padStart(2, "0");

/* ============================================================
   畫面切換
   ============================================================ */
function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
}

/* ============================================================
   Screen 0 → 1 : 開始測驗
   ============================================================ */
nicknameInput1.addEventListener("input", () => {
  startBtn.disabled = nicknameInput1.value.trim().length === 0;
});

startBtn.addEventListener("click", () => {
  state.nickname1 = nicknameInput1.value.trim();
  if (!state.nickname1) return;
  progressShell.hidden = false;
  state.currentQ = 0;
  renderQuestion();
  showScreen("quiz");
});

/* ============================================================
   Screen 1 : 測驗流程
   ============================================================ */
function renderQuestion() {
  const idx = state.currentQ;
  const total = QUESTIONS.length;
  const item = QUESTIONS[idx];

  qIndexLabel.textContent = `Q${String(idx + 1).padStart(2, "0")}`;
  questionText.textContent = item.q;

  progressStep.textContent = String(idx + 1).padStart(2, "0");
  progressFill.style.width = `${(idx / total) * 100}%`;

  optionsWrap.innerHTML = "";
  optionsWrap.classList.remove("locked");

  item.options.forEach((optionText, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.innerHTML = `<span class="option-mark"></span><span>${optionText}</span>`;
    btn.addEventListener("click", () => selectOption(btn, i, optionText));
    optionsWrap.appendChild(btn);
  });
}

function selectOption(btn, i, optionText) {
  if (optionsWrap.classList.contains("locked")) return;
  optionsWrap.classList.add("locked");
  btn.classList.add("selected");

  state.answers.push({
    question: QUESTIONS[state.currentQ].q,
    selected: optionText,
    index: i,
  });

  setTimeout(() => {
    const total = QUESTIONS.length;
    if (state.currentQ < total - 1) {
      state.currentQ += 1;
      renderQuestion();
    } else {
      progressFill.style.width = "100%";
      progressStep.textContent = String(total).padStart(2, "0");
      setTimeout(() => {
        progressShell.hidden = true;
        showScreen("result");
      }, 450);
    }
  }, 420);
  userTag.textContent = state.nickname1;
}

/* ============================================================
   Screen 2 : 產生分析（直接沿用開始時輸入的暱稱）
   ============================================================ */
// analysisBtn.addEventListener("click", () => {
//   state.nickname2 = state.nickname1;
//   userTag.textContent = state.nickname1;
//   showScreen("result");
// });

/* ============================================================
   Screen 3 : 文字解密效果（hover 彩蛋）
   ============================================================ */
const SCRAMBLE_CHARS = "アイウエオカキクケコABCDEFGHIJK0123456789";

class TextScramble {
  constructor(el) {
    this.el = el;
    this.frame = 0;
    this.frameRequest = null;
    this.queue = [];
    this.resolve = null;
  }

  setText(newText) {
    const oldText = this.el.textContent;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => (this.resolve = resolve));
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      const start = Math.floor(Math.random() * 12);
      const end = start + Math.floor(Math.random() * 14) + 6;
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let output = "";
    let complete = 0;
    for (let i = 0; i < this.queue.length; i++) {
      const { from, to, start, end } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        const rand = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        output += `<span class="scramble-char">${rand}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(() => {
        this.frame++;
        this.update();
      });
    }
  }
}

const scrambler = new TextScramble(userTag);
let revealed = false;

resultBtn.addEventListener("mouseleave", () => {
  if (!revealed) return;
  revealed = false;
  scrambler.setText( state.nickname1);
});

resultBtn.addEventListener("mouseenter", () => {
  if (revealed) return;
  revealed = true;
  scrambler.setText(REVEAL_NAME);
});



resultBtn.addEventListener("click", async () => {
  resultBtn.disabled = true;
  submitHint.hidden = false;
  submitHint.textContent = "結果傳送中…";

  try {
    await submitResult();
  } catch (err) {
    // 即使寄信失敗，也不打斷使用者體驗
    console.warn("submit failed", err);
  }

  setTimeout(() => {
    window.location.href = "100days.html";
  }, 500);
});

/* ============================================================
   送出結果（Cloudflare Pages Function → Resend）
   ============================================================ */
async function submitResult() {
  const payload = {
    nickname1: state.nickname1,

    answers: state.answers,
    submittedAt: new Date().toISOString(),
  };

  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`submit failed: ${res.status}`);
  }
}
