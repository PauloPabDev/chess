import { lowPower } from "./config.js";

export const state = {
  manifest: null,
  pieces: [],
  particleCount: lowPower ? 7000 : 14000,
  currentIndex: -1,
  morph: null
};
