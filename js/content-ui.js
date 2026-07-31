import * as THREE from "three";
import { DOM } from "./dom.js";
import { state } from "./state.js";
import { uniforms } from "./particles.js";

let errorTimer = null;

export function animateContent() {
  DOM.content.classList.remove("swap");
  void DOM.content.offsetWidth;
  DOM.content.classList.add("swap");
}

export function setAccent(color) {
  document.documentElement.style.setProperty("--accent", color);
  uniforms.uColorA.value.set(color);
  uniforms.uColorB.value.set(color).lerp(new THREE.Color("#d6a6ff"), .58);
}

export function updateIntroContent() {
  setAccent("#85efff");
  DOM.chapter.textContent = "Introducción";
  DOM.title.innerHTML = 'El tablero es un <span class="highlight">universo.</span>';
  DOM.subtitle.textContent = "Seis piezas. Seis formas distintas de cambiar una partida.";
  DOM.description.textContent = "Explora cómo se mueve y qué representa cada pieza de ajedrez. Al avanzar, las partículas dispersas se reunirán para revelar su forma.";
  animateContent();
  document.body.classList.remove("piece-active");
  updateRail(-1);
}

export function updatePieceContent(piece, index) {
  setAccent(piece.accent || "#85efff");
  DOM.chapter.textContent = `Pieza ${piece.number} · Ajedrez`;
  DOM.title.innerHTML = `${escapeHtml(piece.name.replace(/^El |^La /, ""))}<span class="highlight">.</span>`;
  DOM.subtitle.textContent = piece.subtitle;
  DOM.description.textContent = piece.description;
  animateContent();
  document.body.classList.add("piece-active");

  DOM.counter.textContent = `${piece.number} / ${String(state.pieces.length).padStart(2, "0")}`;
  DOM.progressFill.style.width = `${((index + 1) / state.pieces.length) * 100}%`;
  DOM.buttonText.textContent = index === state.pieces.length - 1 ? "Volver al inicio" : "Siguiente pieza";
  updateRail(index);
}

export function updateRail(index) {
  DOM.railDots.forEach(dot => {
    dot.classList.toggle("active", Number(dot.dataset.index) === index);
  });
}

export function updateNavigation() {
  if (state.currentIndex === -1) {
    DOM.counter.textContent = `00 / ${String(state.pieces.length).padStart(2, "0")}`;
    DOM.progressFill.style.width = "0%";
    DOM.buttonText.textContent = "Conocer las piezas";
  }
}

export function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

export function showError(message) {
  clearTimeout(errorTimer);
  DOM.error.textContent = message;
  DOM.error.classList.add("visible");
  errorTimer = setTimeout(() => DOM.error.classList.remove("visible"), 5200);
}
