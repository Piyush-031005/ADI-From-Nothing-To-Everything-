#define PI 3.14159265358979
precision highp float;

uniform float uTime;
uniform float uProgress;       // 0=void, 1=full singularity
uniform vec2  uResolution;
uniform float uDistortion;     // 0-1 gravitational lensing strength

in vec2 vUv;
out vec4 pc_FragColor;

// ── Gravitational lensing ─────────────────────────────────────────────────────
vec2 lensDistort(vec2 uv, vec2 center, float strength) {
  vec2 d = uv - center;
  float r = length(d);
  float power = 1.0 - strength / (r * r * 10.0 + 0.001);
  return center + d * power;
}

// ── Soft glow ─────────────────────────────────────────────────────────────────
float glow(float dist, float radius, float softness) {
  return smoothstep(radius + softness, radius - softness, dist);
}

// ── Color temperature ────────────────────────────────────────────────────────
vec3 tempColor(float t) {
  // t: 0=deep violet, 0.5=white, 1=blue-white
  vec3 cold  = vec3(0.4, 0.3, 1.0);
  vec3 white = vec3(1.0, 0.98, 0.95);
  vec3 hot   = vec3(0.6, 0.8, 1.0);
  if (t < 0.5) return mix(cold, white, t * 2.0);
  return mix(white, hot, (t - 0.5) * 2.0);
}

void main() {
  vec2 uv = vUv;
  vec2 center = vec2(0.5);

  // Aspect correction
  float aspect = uResolution.x / uResolution.y;
  vec2 uvAspect = uv;
  uvAspect.x = (uv.x - 0.5) * aspect + 0.5;

  vec2 d = uvAspect - vec2(0.5 * aspect + 0.0, 0.5);
  float dist = length(d);

  // Gravitational lens warp
  float lensStrength = uDistortion * 0.012;
  float warp = lensStrength / (dist * dist + 0.001);
  vec2 warpedUv = uv + normalize(d) * (-warp);

  // Core singularity
  float pulse = sin(uTime * 2.5) * 0.5 + 0.5;
  float coreRadius = 0.002 + pulse * 0.002;
  float core = glow(dist, coreRadius, 0.003) * uProgress;

  // Inner halo
  float halo1 = glow(dist, 0.015, 0.02) * 0.5 * uProgress;
  float halo2 = glow(dist, 0.04,  0.04) * 0.2 * uProgress;
  float halo3 = glow(dist, 0.12,  0.1)  * 0.08 * uProgress;

  // Photon ring (very thin bright ring)
  float ringDist = abs(dist - 0.018 * uProgress);
  float ring = smoothstep(0.003, 0.0, ringDist) * uProgress;

  // Total brightness
  float brightness = core + halo1 + halo2 + halo3 + ring;

  // Color
  vec3 col = tempColor(uProgress * pulse);
  col = mix(col, vec3(1.0), core); // pure white at center

  // Chromatic aberration on the rim
  float chromatic = halo2 * 0.5;
  vec3 finalCol = col * brightness;
  finalCol.r += chromatic * 0.3;
  finalCol.b += chromatic * 0.5;

  // Subtle starfield background
  float grain = fract(sin(dot(uv * 300.0, vec2(12.9898, 78.233))) * 43758.5453);
  finalCol += vec3(grain * 0.008 * (1.0 - uProgress * 0.8));

  pc_FragColor = vec4(finalCol, 1.0);
}
