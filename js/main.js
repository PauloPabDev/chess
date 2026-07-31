import { DOM } from "./dom.js";
import { state } from "./state.js";
import { MORPH_DURATION, prefersReducedMotion, mobile } from "./config.js";
import { geometry, uniforms, particleGroup, createScatteredPoints, spatialSort } from "./particles.js";
import { renderer, scene, camera, resize } from "./scene.js";
import { loadManifest, loadPiecePoints } from "./piece-loader.js";
import { updateIntroContent, updatePieceContent, updateNavigation, showError } from "./content-ui.js";

async function goTo(targetIndex) {
  if (state.morph || !state.pieces.length) return;

  const total = state.pieces.length;
  let nextIndex = targetIndex;
  if (nextIndex >= total) nextIndex = -1;
  if (nextIndex < -1) nextIndex = total - 1;
  if (nextIndex === state.currentIndex) return;

  DOM.nextButton.disabled = true;

  try {
    if (nextIndex === -1) {
      const target = spatialSort(createScatteredPoints(state.particleCount));
      beginMorph(target, -1);
      updateIntroContent();
      return;
    }

    const piece = state.pieces[nextIndex];
    const target = await loadPiecePoints(piece);
    beginMorph(target, nextIndex);
    updatePieceContent(piece, nextIndex);

    const following = state.pieces[nextIndex + 1];
    if (following) window.requestIdleCallback?.(() => loadPiecePoints(following).catch(() => {}));
  } catch (error) {
    console.error(error);
    showError("No fue posible cargar la pieza. Ejecuta la web con un servidor local y comprueba la carpeta stl.");
    DOM.nextButton.disabled = false;
    DOM.state.textContent = "Error al cargar modelo";
  }
}

function showNext() { return goTo(state.currentIndex + 1); }
function showPrev() { return goTo(state.currentIndex - 1); }

function beginMorph(targetPoints, nextIndex) {
  const targetAttribute = geometry.getAttribute("aTarget");
  targetAttribute.array.set(targetPoints);
  targetAttribute.needsUpdate = true;
  uniforms.uProgress.value = 0;

  state.morph = {
    startedAt: performance.now(),
    duration: MORPH_DURATION,
    points: targetPoints,
    nextIndex
  };
}

function finishMorph() {
  const positionAttribute = geometry.getAttribute("position");
  positionAttribute.array.set(state.morph.points);
  positionAttribute.needsUpdate = true;

  state.currentIndex = state.morph.nextIndex;
  uniforms.uIntro.value = state.currentIndex === -1 ? 1 : 0;
  uniforms.uProgress.value = 0;
  state.morph = null;
  DOM.nextButton.disabled = false;
  updateNavigation();
}

function render(time) {
  requestAnimationFrame(render);
  const seconds = time * .001;
  uniforms.uTime.value = seconds;

  if (state.morph) {
    uniforms.uProgress.value = Math.min(1, (time - state.morph.startedAt) / state.morph.duration);
    if (uniforms.uProgress.value >= 1) finishMorph();
  }

  const spinFactor = prefersReducedMotion ? 1 : 4.2;
  const automaticRotation = (state.currentIndex === -1 ? seconds * .026 : seconds * .07) * spinFactor;
  particleGroup.rotation.y += (automaticRotation - particleGroup.rotation.y) * .035;

  renderer.render(scene, camera);
}

// -- Simulated scroll: wheel/touch/keys only ever change which piece is
// active. The page itself never really scrolls (see body { overflow: hidden }).
let navLocked = false;

function navigate(direction) {
  if (document.body.classList.contains("gate-active")) return;
  if (navLocked || state.morph) return;

  navLocked = true;
  const step = direction > 0 ? showNext() : showPrev();
  Promise.resolve(step).finally(() => { navLocked = false; });
}

DOM.nextButton.addEventListener("click", () => navigate(1));

DOM.railDots.forEach(dot => {
  dot.addEventListener("click", () => {
    if (document.body.classList.contains("gate-active") || navLocked || state.morph) return;
    navLocked = true;
    Promise.resolve(goTo(Number(dot.dataset.index))).finally(() => { navLocked = false; });
  });
});

addEventListener("keydown", event => {
  if (["ArrowRight", "ArrowDown", "PageDown", "Enter"].includes(event.key)) navigate(1);
  if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) navigate(-1);
});

let wheelCooldown = 0;
addEventListener("wheel", event => {
  if (mobile) return;
  const now = performance.now();
  if (now - wheelCooldown < 120) return;
  wheelCooldown = now;
  navigate(Math.sign(event.deltaY));
}, { passive: true });

let touchStartY = null;
addEventListener("touchstart", event => {
  touchStartY = event.touches[0].clientY;
}, { passive: true });

addEventListener("touchend", event => {
  if (touchStartY === null) return;
  const deltaY = touchStartY - event.changedTouches[0].clientY;
  touchStartY = null;
  if (Math.abs(deltaY) < 42) return;
  navigate(Math.sign(deltaY));
}, { passive: true });

function dismissGate() {
  if (document.body.classList.contains("gate-dismissed")) return;
  document.body.classList.remove("gate-active");
  document.body.classList.add("gate-dismissed");
  goTo(0);
}

DOM.gateYes.addEventListener("click", dismissGate);
DOM.gateContinue.addEventListener("click", dismissGate);

DOM.gateNo.addEventListener("click", () => {
  DOM.gatePanelQuestion.hidden = true;
  DOM.gatePanelMessage.hidden = false;
  DOM.gatePanelMessage.classList.remove("swap");
  void DOM.gatePanelMessage.offsetWidth;
  DOM.gatePanelMessage.classList.add("swap");
});

addEventListener("resize", resize, { passive: true });

document.addEventListener("visibilitychange", () => {
  DOM.state.textContent = document.hidden ? "Animación en pausa" : "Experiencia lista";
});

async function start() {
  resize();
  requestAnimationFrame(render);

  try {
    await loadManifest();
    DOM.state.textContent = "Experiencia lista";
    DOM.nextButton.disabled = false;
    DOM.buttonText.textContent = "Conocer las piezas";
    DOM.gateYes.disabled = false;
    DOM.gateHint.textContent = "";
    updateNavigation();

    if (state.pieces[0]) window.requestIdleCallback?.(() => loadPiecePoints(state.pieces[0]).catch(() => {}));
  } catch (error) {
    console.error(error);
    DOM.state.textContent = "No se encontró la carpeta stl";
    DOM.buttonText.textContent = "Modelos no disponibles";
    DOM.gateHint.textContent = "No se encontraron los modelos. Ejecuta la web con un servidor local.";
    showError("No se pudo leer stl/pieces.json. Abre el proyecto con un servidor local, no directamente como archivo.");
  }
}

start();
