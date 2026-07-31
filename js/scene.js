import * as THREE from "three";
import { DOM } from "./dom.js";
import { lowPower } from "./config.js";
import { uniforms, particleGroup } from "./particles.js";

export const renderer = new THREE.WebGLRenderer({
  canvas: DOM.canvas,
  alpha: true,
  antialias: false,
  powerPreference: "high-performance"
});

renderer.setClearColor(0x05060b, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 0, 8.4);

scene.add(particleGroup);

export const pointer = { x: 0, y: 0 };
export const pointerTarget = { x: 0, y: 0 };

export function resize() {
  const width = innerWidth;
  const height = innerHeight;
  const ratio = Math.min(devicePixelRatio, lowPower ? 1.15 : 1.6);

  renderer.setPixelRatio(ratio);
  renderer.setSize(width, height, false);
  uniforms.uPixelRatio.value = ratio;
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();

  if (width <= 860) {
    camera.position.z = 12.5;
    particleGroup.position.set(.05, -1.58, 0);
    particleGroup.scale.setScalar(Math.min(.97, width / 470) * .9);
  } else {
    camera.position.z = 8.4;
    particleGroup.position.set(2.45, -.02, 0);
    particleGroup.scale.setScalar(Math.min(1.15, width / 1450 + .25));
  }
}
