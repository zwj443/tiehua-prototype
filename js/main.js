const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");
const root = document.documentElement;

const panels = {
  home: document.getElementById("homePanel"),
  show: document.getElementById("showPanel"),
  culture: document.getElementById("culturePanel")
};

const enterBtn = document.getElementById("enterBtn");
const aboutBtn = document.getElementById("aboutBtn");
const strikeBtn = document.getElementById("strikeBtn");
const lookBtn = document.getElementById("lookBtn");
const autoBtn = document.getElementById("autoBtn");
const homeLowBtn = document.getElementById("homeLowBtn");
const soundBtn = document.getElementById("soundBtn");
const showSoundBtn = document.getElementById("showSoundBtn");
const cultureBtn = document.getElementById("cultureBtn");
const backShowBtn = document.getElementById("backShowBtn");
const homeBtn = document.getElementById("homeBtn");
const showHomeBtn = document.getElementById("showHomeBtn");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const closeBtn = document.getElementById("closeBtn");
const lookHint = document.getElementById("lookHint");
const flashLayer = document.getElementById("flashLayer");
const decodeImage = document.getElementById("decodeImage");
const decodeEyebrow = document.getElementById("decodeEyebrow");
const decodeTitle = document.getElementById("decodeTitle");
const decodeText = document.getElementById("decodeText");

let width = 0;
let height = 0;
let particles = [];
let autoTimer = null;
let lowMode = false;
let soundEnabled = true;
let userAudioUnlocked = false;
let lastStrike = -Infinity;
let lookX = 0;
let lookY = 0;

const decodeModules = {
  craft: {
    eyebrow: "MODULE 01",
    title: "匠人技艺",
    text: "打铁花不是简单的表演，而是依赖匠人长期训练形成的经验技艺。击打角度、力度、时机都会影响铁花的形态与安全性。",
    imageClass: "decode-image-craft",
    fallback: "匠人技艺图像"
  },
  danger: {
    eyebrow: "MODULE 02",
    title: "高温铁水与危险性",
    text: "真实打铁花涉及高温铁水，表演者需要在高温、火星和人群之间保持精准控制，因此这项技艺兼具观赏性与危险性。",
    imageClass: "decode-image-danger",
    fallback: "高温铁水与危险性图像"
  },
  festival: {
    eyebrow: "MODULE 03",
    title: "节庆祈福意义",
    text: "打铁花常与节庆、庙会、祈福活动联系在一起。火树银花的场景象征热烈、兴旺和对美好生活的祝愿。",
    imageClass: "decode-image-festival",
    fallback: "节庆祈福意义图像"
  },
  inheritance: {
    eyebrow: "MODULE 04",
    title: "非遗传承现状",
    text: "随着生活方式变化，传统打铁花的现场观看机会减少。线上沉浸体验可以帮助年轻人先产生兴趣，再进一步了解真实非遗。",
    imageClass: "decode-image-inheritance",
    fallback: "非遗传承现状图像"
  }
};

// 音频只在用户交互后播放；文件缺失时静默跳过，不阻断体验。
const soundSources = {
  ambient: "assets/audio/ambient.mp3",
  strike: "assets/audio/strike.mp3",
  burst: "assets/audio/burst.mp3",
  whoosh: "assets/audio/whoosh.mp3",
  ui: "assets/audio/ui_click.mp3"
};

const soundVolumes = {
  ambient: 0.18,
  ui: 0.28,
  strike: 0.72,
  burst: 0.78,
  whoosh: 0.58
};
const soundCache = new Map();
const unavailableSounds = new Set();

async function loadSound(name) {
  if (soundCache.has(name)) return soundCache.get(name);
  if (unavailableSounds.has(name) || !soundSources[name]) return null;

  const audio = new Audio(soundSources[name]);
  audio.preload = "none";
  audio.volume = soundVolumes[name] ?? 0.6;
  audio.loop = name === "ambient";
  audio.addEventListener("error", () => {
    unavailableSounds.add(name);
    soundCache.delete(name);
  }, { once: true });
  soundCache.set(name, audio);
  return audio;
}

function playSound(name) {
  if (!soundEnabled || !userAudioUnlocked) return;
  loadSound(name).then((audio) => {
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {
      unavailableSounds.add(name);
      soundCache.delete(name);
    });
  });
}

function startAmbient() {
  if (!soundEnabled || !userAudioUnlocked) return;
  loadSound("ambient").then((audio) => {
    if (!audio || !soundEnabled) return;
    audio.volume = soundVolumes.ambient;
    audio.loop = true;
    audio.play().catch(() => {
      unavailableSounds.add("ambient");
      soundCache.delete("ambient");
    });
  });
}

function pauseAmbient() {
  const audio = soundCache.get("ambient");
  if (audio) audio.pause();
}

function unlockAudio() {
  userAudioUnlocked = true;
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function makeParticle(x, y, vx, vy, size, life, hue, type) {
  return {
    x,
    y,
    vx,
    vy,
    px: x,
    py: y,
    size,
    life,
    maxLife: life,
    hue,
    type,
    trail: []
  };
}

function setStep(step) {
  Object.entries(panels).forEach(([name, panel]) => {
    panel.classList.toggle("active", name === step);
  });
  document.body.classList.remove("step-home", "step-show", "step-culture");
  document.body.classList.add(`step-${step}`);
  if (step !== "culture") modal.classList.remove("show");
  if (step === "home") {
    stopAuto();
    particles = [];
    lastStrike = -Infinity;
    pauseAmbient();
  }
  if (step === "culture") {
    stopAuto();
    particles = [];
    renderDecode("craft");
  }
}

function strike() {
  const now = performance.now();
  if (now - lastStrike < 450) return;
  lastStrike = now;
  setStep("show");
  playSound("strike");

  const baseX = width * 0.5 + lookX * 32;
  const baseY = height * 0.78;
  const burstY = height * (lookY < -0.2 ? 0.16 : 0.24);
  const count = lowMode ? 180 : 450;

  for (let i = 0; i < count * 0.48; i++) {
    const angle = random(-Math.PI * 0.6, -Math.PI * 0.4);
    const speed = random(6, 14);
    particles.push(makeParticle(
      baseX + random(-12, 12),
      baseY + random(-8, 8),
      Math.cos(angle) * speed + random(-0.5, 0.5),
      Math.sin(angle) * speed - random(3.4, 7.2),
      random(1.4, 3.3),
      random(58, 90),
      random(35, 52),
      "jet"
    ));
  }

  setTimeout(() => burst(count, burstY, true), 420);
  flash();
  root.style.setProperty("--spark-level", "100%");
  setTimeout(() => root.style.setProperty("--spark-level", "18%"), 900);
  if ("vibrate" in navigator) navigator.vibrate(55);
}

function burst(count, burstY, withSound = false) {
  if (withSound) playSound("burst");
  flash();

  const burstX = width * 0.5 + random(-28, 28);
  const burstBaseY = burstY + random(-24, 20);

  for (let i = 0; i < count; i++) {
    const angle = random(Math.PI * 0.03, Math.PI * 0.97);
    const radiusBias = Math.pow(Math.random(), 0.5);
    const speed = random(2.4, 12.8) * (0.68 + radiusBias);
    particles.push(makeParticle(
      burstX + random(-32, 32),
      burstBaseY + random(-14, 14),
      Math.cos(angle) * speed * random(1.7, 3.35) + random(-1.8, 1.8),
      -Math.sin(angle) * speed * random(0.24, 0.98) + random(-0.4, 2.8),
      random(1, 3.6),
      random(84, 158),
      random(32, 48),
      "burst"
    ));
  }

  // 近景粒子更大更亮，制造从头顶飞过的感觉。
  const nearCount = lowMode ? 42 : 92;
  if (withSound) playSound("whoosh");
  for (let i = 0; i < nearCount; i++) {
    const side = Math.random() > 0.5 ? 1 : -1;
    particles.push(makeParticle(
      width * 0.5 + random(-150, 150),
      height * random(-0.02, 0.16),
      side * random(3, 8.5) + lookX * 1.4,
      random(3.4, 9.8),
      random(3.2, 7.8),
      random(76, 132),
      random(35, 48),
      "near"
    ));
  }

  const overheadCount = lowMode ? 16 : 36;
  for (let i = 0; i < overheadCount; i++) {
    particles.push(makeParticle(
      random(-80, width + 80),
      random(-20, height * 0.12),
      random(-1.2, 1.2),
      random(7.5, 12.5),
      random(4.2, 8.8),
      random(42, 78),
      random(38, 52),
      "overhead"
    ));
  }
}

function flash() {
  flashLayer.classList.add("show");
  setTimeout(() => flashLayer.classList.remove("show"), 70);
}

function drawParticle(p) {
  const t = Math.max(p.life / p.maxLife, 0);
  const alpha = Math.min(1, t * 1.35);
  const light = p.type === "near" || p.type === "overhead" ? 74 : 62;
  const color = `hsla(${p.hue}, 100%, ${light}%, ${alpha})`;
  const core = `hsla(52, 100%, 88%, ${alpha})`;
  const trailWidth = p.type === "overhead" ? p.size * 1.2 : p.size * 0.78;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < p.trail.length - 1; i++) {
    const a = p.trail[i];
    const b = p.trail[i + 1];
    const trailAlpha = alpha * (i / p.trail.length) * 0.44;
    ctx.beginPath();
    ctx.strokeStyle = `hsla(${p.hue}, 100%, 62%, ${trailAlpha})`;
    ctx.lineWidth = Math.max(1, trailWidth * (i / p.trail.length));
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.strokeStyle = `hsla(${p.hue}, 100%, 64%, ${alpha * 0.72})`;
  ctx.lineWidth = Math.max(1, trailWidth);
  ctx.moveTo(p.px, p.py);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();

  const r = p.size * (p.type === "near" || p.type === "overhead" ? 5.2 : 3.4);
  const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
  grad.addColorStop(0, core);
  grad.addColorStop(0.32, color);
  grad.addColorStop(1, "rgba(255, 90, 20, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(0.7, p.size * 0.58), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function updateParticles() {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(5, 7, 18, 0.16)";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const groundGlow = ctx.createRadialGradient(width * 0.5, height * 0.82, 0, width * 0.5, height * 0.82, width * 0.34);
  groundGlow.addColorStop(0, "rgba(255, 118, 35, 0.18)");
  groundGlow.addColorStop(0.45, "rgba(255, 118, 35, 0.04)");
  groundGlow.addColorStop(1, "rgba(255, 118, 35, 0)");
  ctx.fillStyle = groundGlow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const gravity = 0.092;
  const drag = 0.992;

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.px = p.x;
    p.py = p.y;
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > (p.type === "overhead" ? 12 : 8)) p.trail.shift();

    p.vy += gravity * (p.type === "near" || p.type === "overhead" ? 1.18 : 1);
    p.vx *= drag;
    p.vy *= drag;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    drawParticle(p);

    if (p.life <= 0 || p.y > height + 100 || p.x < -140 || p.x > width + 140) {
      particles.splice(i, 1);
    }
  }

  requestAnimationFrame(updateParticles);
}

function setLook(x, y) {
  lookX = Math.max(-1, Math.min(1, x));
  lookY = Math.max(-1, Math.min(1, y));
  root.style.setProperty("--look-x", lookX.toFixed(3));
  root.style.setProperty("--look-y", lookY.toFixed(3));
}

function showLookHint() {
  lookHint.classList.add("show");
  setTimeout(() => lookHint.classList.remove("show"), 2600);
}

function stopAuto() {
  if (!autoTimer) return;
  clearInterval(autoTimer);
  autoTimer = null;
  autoBtn.textContent = "连续演示";
}

function setLowMode(enabled) {
  lowMode = enabled;
  const label = lowMode ? "普通模式" : "低性能模式";
  homeLowBtn.textContent = label;
  homeLowBtn.setAttribute("aria-pressed", String(lowMode));
}

function updateSoundButtons() {
  const label = soundEnabled ? "声音开" : "声音关";
  soundBtn.textContent = label;
  showSoundBtn.textContent = label;
  soundBtn.setAttribute("aria-pressed", String(soundEnabled));
  showSoundBtn.setAttribute("aria-pressed", String(soundEnabled));
}

function toggleSound() {
  unlockAudio();
  soundEnabled = !soundEnabled;
  updateSoundButtons();
  if (soundEnabled && document.body.classList.contains("step-show")) {
    startAmbient();
  } else {
    pauseAmbient();
  }
}

function showAbout() {
  modalTitle.textContent = "项目简介";
  modalText.textContent = "这是一个用于设计思维课程的线上非遗沉浸体验原型。它通过主界面吸引进入、打铁花动画营造临场感，再用文化解密帮助用户理解打铁花的技艺、危险性、节庆意义与传承价值。";
  modal.classList.add("show");
}

function renderDecode(key) {
  const data = decodeModules[key];
  if (!data) return;

  decodeEyebrow.textContent = data.eyebrow;
  decodeTitle.textContent = data.title;
  decodeText.textContent = data.text;
  decodeImage.className = `decode-image ${data.imageClass}`;
  decodeImage.dataset.fallback = data.fallback;

  document.querySelectorAll("[data-decode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.decode === key);
  });
}

window.addEventListener("resize", resize);

window.addEventListener("mousemove", (event) => {
  const x = (event.clientX / width - 0.5) * 2;
  const y = (event.clientY / height - 0.5) * 2;
  setLook(x * 0.72, y * 0.72);
});

window.addEventListener("touchmove", (event) => {
  const touch = event.touches[0];
  if (!touch) return;
  const x = (touch.clientX / width - 0.5) * 2;
  const y = (touch.clientY / height - 0.5) * 2;
  setLook(x * 0.9, y * 0.9);
}, { passive: true });

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  unlockAudio();
  if (button.id === "soundBtn" || button.id === "showSoundBtn" || button.id === "strikeBtn") return;
  playSound("ui");
}, true);

enterBtn.addEventListener("click", () => {
  unlockAudio();
  setStep("show");
  startAmbient();
  showLookHint();
});

aboutBtn.addEventListener("click", showAbout);
strikeBtn.addEventListener("click", strike);

lookBtn.addEventListener("click", () => {
  setLook(0, -0.88);
  showLookHint();
  setTimeout(strike, 450);
});

autoBtn.addEventListener("click", () => {
  if (autoTimer) {
    stopAuto();
  } else {
    strike();
    autoTimer = setInterval(strike, 3200);
    autoBtn.textContent = "停止演示";
  }
});

homeLowBtn.addEventListener("click", () => {
  setLowMode(!lowMode);
});

soundBtn.addEventListener("click", toggleSound);
showSoundBtn.addEventListener("click", toggleSound);

cultureBtn.addEventListener("click", () => {
  setStep("culture");
});

backShowBtn.addEventListener("click", () => {
  setStep("show");
});

homeBtn.addEventListener("click", () => setStep("home"));
showHomeBtn.addEventListener("click", () => setStep("home"));

closeBtn.addEventListener("click", () => modal.classList.remove("show"));

document.querySelectorAll("[data-decode]").forEach((button) => {
  button.addEventListener("click", () => renderDecode(button.dataset.decode));
});

resize();
ctx.fillStyle = "#050712";
ctx.fillRect(0, 0, width, height);
setLowMode(false);
updateSoundButtons();
setStep("home");
updateParticles();
