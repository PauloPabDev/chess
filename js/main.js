import { DOM } from "./dom.js";
import { state } from "./state.js";
import { MORPH_DURATION } from "./config.js";
import { geometry, uniforms, particleGroup, createScatteredPoints, spatialSort } from "./particles.js";
import { renderer, scene, camera, resize, pointer, pointerTarget } from "./scene.js";
import { loadManifest, loadPiecePoints } from "./piece-loader.js";
import { updateIntroContent, updatePieceContent, updateNavigation, showError } from "./content-ui.js";

async function showNext() {
  if (state.morph || !state.pieces.length) return;

  const nextIndex = state.currentIndex + 1 >= state.pieces.length ? -1 : state.currentIndex + 1;
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

  pointer.x += (pointerTarget.x - pointer.x) * .045;
  pointer.y += (pointerTarget.y - pointer.y) * .045;

  const automaticRotation = state.currentIndex === -1 ? seconds * .018 : seconds * .045;
  particleGroup.rotation.y += ((pointer.x * .28 + automaticRotation) - particleGroup.rotation.y) * .023;
  particleGroup.rotation.x += ((pointer.y * .14) - particleGroup.rotation.x) * .032;

  renderer.render(scene, camera);
}

DOM.nextButton.addEventListener("click", showNext);

addEventListener("keydown", event => {
  if (event.key === "ArrowRight" || event.key === "Enter") showNext();
});

addEventListener("pointermove", event => {
  pointerTarget.x = event.clientX / innerWidth * 2 - 1;
  pointerTarget.y = -(event.clientY / innerHeight * 2 - 1);
}, { passive: true });

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
    updateNavigation();

    if (state.pieces[0]) window.requestIdleCallback?.(() => loadPiecePoints(state.pieces[0]).catch(() => {}));
  } catch (error) {
    console.error(error);
    DOM.state.textContent = "No se encontró la carpeta stl";
    DOM.buttonText.textContent = "Modelos no disponibles";
    showError("No se pudo leer stl/pieces.json. Abre el proyecto con un servidor local, no directamente como archivo.");
  }
}

start();
