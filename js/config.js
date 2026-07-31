export const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const mobile = matchMedia("(max-width: 860px)").matches;
export const lowPower = mobile || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
export const MORPH_DURATION = prefersReducedMotion ? 260 : 1850;
