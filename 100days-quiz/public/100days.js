/* ============================================================
   照片清單 — 之後替換成你們的實際照片網址即可
   建議尺寸：正方形，至少 400x400，會自動轉為黑白
   ============================================================ */
const PHOTOS = [
  "assets/香水.jpg",
  "assets/韓服.jpg",
  "assets/茶六.jpg",
  "assets/膠囊列車.jpg",
  "assets/畢業.jpg",
  "assets/老爹.jpg"
];

const ORBIT_DURATION_MS = 26000; // 轉一圈所需時間

/* ============================================================
   開場：對焦框展開動畫
   ============================================================ */
function playIntro() {
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.body.classList.add("intro-expand");
      setTimeout(() => {
        document.body.classList.add("intro-done");
      }, 950);
    }, 380);
  });
}

/* ============================================================
   照片輪轉動畫（純 vanilla JS，取代原本 React + motion 版本）
   ============================================================ */
const stage = document.getElementById("orbitStage");
const guide = document.getElementById("orbitGuide");

let orbitItems = [];
let dims = { cx: 0, cy: 0, rx: 0, ry: 0, itemSize: 64 };

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function initOrbit() {
  stage.querySelectorAll(".orbit-photo").forEach((el) => el.remove());

  orbitItems = PHOTOS.map((src, i) => {
    const el = document.createElement("div");
    el.className = "orbit-photo";

    const img = document.createElement("img");
    img.src = src;
    img.alt = `回憶照片 ${i + 1}`;
    img.draggable = false;
    el.appendChild(img);

    stage.appendChild(el);

    return {
      el,
      offset: i / PHOTOS.length,
      rotation: (Math.random() * 18 - 9).toFixed(1),
    };
  });

  measure();
}

function measure() {
  const w = stage.clientWidth;
  const h = stage.clientHeight;

  dims.cx = w / 2;
  dims.cy = h / 2;
  dims.rx = w * 0.44;
  dims.ry = h * 0.34;
  dims.itemSize = Math.max(52, Math.min(100, w * 0.15));

  orbitItems.forEach((it) => {
    it.el.style.width = `${dims.itemSize}px`;
    it.el.style.height = `${dims.itemSize}px`;
  });

  guide.style.width = `${dims.rx * 2}px`;
  guide.style.height = `${dims.ry * 2}px`;
  guide.style.left = `${dims.cx - dims.rx}px`;
  guide.style.top = `${dims.cy - dims.ry}px`;
}

let startTime = null;
function animateOrbit(ts) {
  if (!startTime) startTime = ts;
  const elapsed = (ts - startTime) % ORBIT_DURATION_MS;
  const baseAngle = (elapsed / ORBIT_DURATION_MS) * Math.PI * 2;

  orbitItems.forEach((it) => {
    const angle = baseAngle + it.offset * Math.PI * 2;
    const x = dims.cx + dims.rx * Math.cos(angle);
    const y = dims.cy + dims.ry * Math.sin(angle);

    // 依照 y 軸位置模擬前後景深：越靠「前方」越大越亮
    const depth = (Math.sin(angle) + 1) / 2; // 0 = 最後方, 1 = 最前方
    const scale = 0.72 + depth * 0.34;
    const opacity = 0.55 + depth * 0.45;
    const zIndex = Math.round(depth * 100) + 1;

    it.el.style.transform =
      `translate(${x - dims.itemSize / 2}px, ${y - dims.itemSize / 2}px) ` +
      `scale(${scale}) rotate(${it.rotation}deg)`;
    it.el.style.zIndex = zIndex;
    it.el.style.opacity = opacity;
  });

  requestAnimationFrame(animateOrbit);
}

/* ============================================================
   初始化
   ============================================================ */
playIntro();
initOrbit();
window.addEventListener("resize", debounce(measure, 150));
requestAnimationFrame(animateOrbit);
