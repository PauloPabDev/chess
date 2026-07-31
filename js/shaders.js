export const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform float uPointSize;
  uniform float uPixelRatio;
  uniform float uBurst;
  uniform float uIntro;

  attribute vec3 aTarget;
  attribute vec3 aSeed;
  varying vec3 vSeed;
  varying float vPulse;

  float ease(float x) {
    return x * x * (3.0 - 2.0 * x);
  }

  void main() {
    float p = ease(clamp(uProgress, 0.0, 1.0));
    float burst = sin(p * 3.14159265);
    vec3 randomDirection = normalize((aSeed - 0.5) + vec3(0.001));
    vec3 transformed = mix(position, aTarget, p);
    transformed += randomDirection * burst * uBurst * (0.65 + aSeed.x * 0.8);

    float freeMovement = 0.07 + uIntro * 0.13;
    transformed.x += sin(uTime * (.32 + aSeed.x * .36) + aSeed.z * 18.0) * freeMovement;
    transformed.y += cos(uTime * (.28 + aSeed.y * .31) + aSeed.x * 16.0) * freeMovement;
    transformed.z += sin(uTime * (.24 + aSeed.z * .30) + aSeed.y * 15.0) * freeMovement;

    vec4 modelPosition = modelMatrix * vec4(transformed, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    float perspective = 7.2 / max(1.0, -viewPosition.z);
    gl_PointSize = uPointSize * uPixelRatio * perspective * (.66 + aSeed.z * .62);

    vSeed = aSeed;
    vPulse = .78 + .22 * sin(uTime * 1.5 + aSeed.x * 17.0);
  }
`;

export const fragmentShader = `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec3 vSeed;
  varying float vPulse;

  void main() {
    vec2 uv = gl_PointCoord - .5;
    float distanceToCenter = length(uv);
    if (distanceToCenter > .5) discard;

    float core = 1.0 - smoothstep(0.0, .16, distanceToCenter);
    float glow = 1.0 - smoothstep(.05, .5, distanceToCenter);
    vec3 color = mix(uColorA, uColorB, vSeed.y);
    color *= 1.08 + core * .95;
    float alpha = (core * .9 + glow * .42) * vPulse;
    gl_FragColor = vec4(color, alpha);
  }
`;
