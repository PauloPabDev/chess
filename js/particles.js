import * as THREE from "three";
import { lowPower, prefersReducedMotion } from "./config.js";
import { state } from "./state.js";
import { vertexShader, fragmentShader } from "./shaders.js";

export function createScatteredPoints(count) {
  const points = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const radius = 1.0 + Math.pow(Math.random(), .58) * 3.25;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const stretchX = 1.28;
    const stretchY = .86;

    points[i * 3] = Math.sin(phi) * Math.cos(theta) * radius * stretchX;
    points[i * 3 + 1] = Math.cos(phi) * radius * stretchY;
    points[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
  }

  return points;
}

export function spatialSort(source) {
  const count = source.length / 3;
  const indexes = Array.from({ length: count }, (_, index) => index);

  indexes.sort((a, b) => {
    const ay = source[a * 3 + 1];
    const by = source[b * 3 + 1];
    const bandA = Math.round(ay * 15);
    const bandB = Math.round(by * 15);
    if (bandA !== bandB) return bandB - bandA;

    const angleA = Math.atan2(source[a * 3 + 2], source[a * 3]);
    const angleB = Math.atan2(source[b * 3 + 2], source[b * 3]);
    return angleA - angleB;
  });

  const sorted = new Float32Array(source.length);
  indexes.forEach((sourcePoint, targetPoint) => {
    sorted[targetPoint * 3] = source[sourcePoint * 3];
    sorted[targetPoint * 3 + 1] = source[sourcePoint * 3 + 1];
    sorted[targetPoint * 3 + 2] = source[sourcePoint * 3 + 2];
  });
  return sorted;
}

export const geometry = new THREE.BufferGeometry();

const scattered = createScatteredPoints(state.particleCount);
const target = new Float32Array(scattered);
const seeds = new Float32Array(state.particleCount * 3);
for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();

geometry.setAttribute("position", new THREE.BufferAttribute(scattered, 3));
geometry.setAttribute("aTarget", new THREE.BufferAttribute(target, 3));
geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));

export const uniforms = {
  uTime: { value: 0 },
  uProgress: { value: 0 },
  uPointSize: { value: lowPower ? 6.5 : 7.0 },
  uPixelRatio: { value: 1 },
  uBurst: { value: prefersReducedMotion ? 0 : 1.0 },
  uColorA: { value: new THREE.Color("#85efff") },
  uColorB: { value: new THREE.Color("#c49bff") },
  uIntro: { value: 1 }
};

export const material = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms,
  vertexShader,
  fragmentShader
});

export const particleGroup = new THREE.Group();
export const particles = new THREE.Points(geometry, material);
particleGroup.add(particles);

export function rebuildParticleBuffers(count) {
  const newScattered = createScatteredPoints(count);
  const newSeeds = new Float32Array(count * 3);
  for (let i = 0; i < newSeeds.length; i++) newSeeds[i] = Math.random();

  geometry.setAttribute("position", new THREE.BufferAttribute(newScattered, 3));
  geometry.setAttribute("aTarget", new THREE.BufferAttribute(new Float32Array(newScattered), 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(newSeeds, 3));
  geometry.computeBoundingSphere();
}
