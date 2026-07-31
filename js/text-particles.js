import { prefersReducedMotion, lowPower } from "./config.js";

const DURATION = 820;
const MAX_PARTICLES = lowPower ? 380 : 850;
const SAMPLE_STEP = lowPower ? 4 : 3;
const ALPHA_THRESHOLD = 90;
const STAGGER_STEP = 70;

const sampleCanvas = document.createElement("canvas");
const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });

const instances = new Map();

function ease(x) {
  return x * x * (3 - 2 * x);
}

function getInstance(element) {
  let instance = instances.get(element);
  if (!instance) {
    const canvas = document.createElement("canvas");
    canvas.className = "text-particles";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    instance = { canvas, ctx: canvas.getContext("2d"), rafId: null, timerId: null };
    instances.set(element, instance);
  }
  return instance;
}

function wrapLines(measureCtx, text, maxWidth) {
  const words = text.split(" ").filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (current && measureCtx.measureText(attempt).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function samplePoints(text, style, width, height, dpr) {
  sampleCanvas.width = Math.ceil(width * dpr);
  sampleCanvas.height = Math.ceil(height * dpr);
  sampleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sampleCtx.clearRect(0, 0, width, height);
  sampleCtx.fillStyle = "#fff";
  sampleCtx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  sampleCtx.textAlign = "left";
  sampleCtx.textBaseline = "middle";
  if ("letterSpacing" in sampleCtx) sampleCtx.letterSpacing = style.letterSpacing;

  const fontSizePx = parseFloat(style.fontSize) || 16;
  const rawLineHeight = parseFloat(style.lineHeight);
  const lineHeight = Number.isFinite(rawLineHeight) ? rawLineHeight : fontSizePx * 1.15;

  const lines = wrapLines(sampleCtx, text, width);
  lines.forEach((line, i) => {
    sampleCtx.fillText(line, 0, lineHeight * (i + 0.5));
  });

  const pixelWidth = sampleCanvas.width;
  const pixelHeight = sampleCanvas.height;
  const imageData = sampleCtx.getImageData(0, 0, pixelWidth, pixelHeight).data;
  const step = Math.max(1, Math.round(SAMPLE_STEP * dpr));
  const points = [];

  for (let py = 0; py < pixelHeight; py += step) {
    for (let px = 0; px < pixelWidth; px += step) {
      const alpha = imageData[(py * pixelWidth + px) * 4 + 3];
      if (alpha > ALPHA_THRESHOLD) points.push({ x: px / dpr, y: py / dpr });
    }
  }

  return capParticles(points);
}

function capParticles(points) {
  if (points.length <= MAX_PARTICLES) return points;
  const stride = points.length / MAX_PARTICLES;
  const result = [];
  for (let i = 0; i < MAX_PARTICLES; i++) result.push(points[Math.floor(i * stride)]);
  return result;
}

function finishBurst(element, instance) {
  instance.rafId = null;
  instance.canvas.style.opacity = "0";
  element.classList.remove("particles-hidden");
}

function cancelBurst(element) {
  const instance = instances.get(element);
  if (!instance) return;
  if (instance.timerId) clearTimeout(instance.timerId);
  if (instance.rafId) cancelAnimationFrame(instance.rafId);
  instance.timerId = null;
  instance.rafId = null;
  instance.canvas.style.opacity = "0";
  element.classList.remove("particles-hidden");
}

function runBurst(element, instance) {
  const { canvas, ctx } = instance;
  const rect = element.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const style = getComputedStyle(element);
  const color = style.color;

  const points = samplePoints(element.textContent, style, width, height, dpr);

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.left = `${rect.left}px`;
  canvas.style.top = `${rect.top}px`;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  canvas.style.opacity = "1";

  if (!points.length) {
    finishBurst(element, instance);
    return;
  }

  const particles = points.map(point => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 46 + Math.random() * 130;
    return {
      tx: point.x,
      ty: point.y,
      sx: point.x + Math.cos(angle) * distance,
      sy: point.y + Math.sin(angle) * distance,
      size: 1.1 + Math.random() * 1.7,
      delay: Math.random() * 0.22
    };
  });

  const startedAt = performance.now();

  function frame(now) {
    const elapsed = (now - startedAt) / DURATION;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;

    const settled = elapsed >= 1;
    for (const particle of particles) {
      const t = Math.min(1, Math.max(0, (elapsed - particle.delay) / (1 - particle.delay)));
      const eased = ease(t);
      const x = particle.sx + (particle.tx - particle.sx) * eased;
      const y = particle.sy + (particle.ty - particle.sy) * eased;
      ctx.globalAlpha = Math.min(1, t * 2.2 + 0.05);
      ctx.beginPath();
      ctx.arc(x, y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (settled) {
      finishBurst(element, instance);
    } else {
      instance.rafId = requestAnimationFrame(frame);
    }
  }

  instance.rafId = requestAnimationFrame(frame);
}

export function burstText(element, html, order = 0) {
  cancelBurst(element);
  element.innerHTML = html;

  if (prefersReducedMotion || !sampleCtx) return;

  const instance = getInstance(element);
  element.classList.add("particles-hidden");

  const delay = order * STAGGER_STEP;
  if (delay > 0) {
    instance.timerId = setTimeout(() => {
      instance.timerId = null;
      runBurst(element, instance);
    }, delay);
  } else {
    runBurst(element, instance);
  }
}
