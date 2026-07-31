import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { DOM } from "./dom.js";
import { lowPower } from "./config.js";
import { state } from "./state.js";
import { geometry, spatialSort, rebuildParticleBuffers } from "./particles.js";

const shapeCache = new Map();

export async function loadManifest() {
  const response = await fetch("./stl/pieces.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`No se pudo cargar pieces.json (${response.status})`);
  state.manifest = await response.json();
  state.pieces = state.manifest.pieces;
  state.particleCount = lowPower ? state.manifest.particleCount.mobile : state.manifest.particleCount.desktop;

  if (state.particleCount !== geometry.getAttribute("position").count) {
    rebuildParticleBuffers(state.particleCount);
  }
}

export async function loadPiecePoints(piece) {
  if (shapeCache.has(piece.id)) return shapeCache.get(piece.id);

  DOM.state.textContent = `Cargando ${piece.name.toLowerCase()}`;
  const loader = new STLLoader();
  const stlGeometry = await loader.loadAsync(`./stl/${piece.file}`);

  stlGeometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  stlGeometry.computeBoundingBox();

  const box = stlGeometry.boundingBox;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z) || 1;

  stlGeometry.translate(-center.x, -center.y, -center.z);
  const normalizedScale = 4.45 / maxDimension;
  stlGeometry.scale(normalizedScale, normalizedScale, normalizedScale);
  stlGeometry.computeVertexNormals();

  const mesh = new THREE.Mesh(stlGeometry, new THREE.MeshBasicMaterial());
  const sampler = new MeshSurfaceSampler(mesh).build();
  const sample = new THREE.Vector3();
  const points = new Float32Array(state.particleCount * 3);

  for (let i = 0; i < state.particleCount; i++) {
    sampler.sample(sample);
    points[i * 3] = sample.x;
    points[i * 3 + 1] = sample.y;
    points[i * 3 + 2] = sample.z;
  }

  mesh.material.dispose();
  stlGeometry.dispose();

  const sorted = spatialSort(points);
  shapeCache.set(piece.id, sorted);
  DOM.state.textContent = "Experiencia lista";
  return sorted;
}
