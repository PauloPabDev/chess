import { lowPower } from "./config.js";

export const state = {
  manifest: null,
  pieces: [],
  particleCount: lowPower ? 10000 : 26000,
  currentIndex: -1,
  morph: null
};
