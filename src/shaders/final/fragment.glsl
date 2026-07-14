#define PI 3.14159265358979
precision highp float;

uniform sampler2D uMainTexture;
uniform sampler2D uGlowTexture;
uniform float uTime;
uniform float uChromaRadius;    // 0-1 chromatic aberration strength
uniform float uGrainStrength;   // 0-1 film grain
uniform float uBloomStrength;   // 0-1 bloom blend
uniform float uVignette;        // 0-1 vignette strength
uniform float uFlashAlpha;      // white flash for big bang

in vec2 vUv;
out vec4 pc_FragColor;

// ── RGB Chromatic Aberration ────────────────────────────────────────────────
vec3 chromaticAberration(sampler2D tex, vec2 uv, float radius) {
  float angle_r = PI * 0.0 / 3.0;
  float angle_g = PI * 2.0 / 3.0;
  float angle_b = PI * 4.0 / 3.0;

  vec2 offset = uv - vec2(0.5);
  float dist = length(offset) * radius;

  float r = texture(tex, uv + vec2(cos(angle_r), sin(angle_r)) * dist).r;
  float g = texture(tex, uv + vec2(cos(angle_g), sin(angle_g)) * dist).g;
  float b = texture(tex, uv + vec2(cos(angle_b), sin(angle_b)) * dist).b;
  return vec3(r, g, b);
}

// ── Film Grain ───────────────────────────────────────────────────────────────
float filmGrain(vec2 uv, float time) {
  return fract(sin(dot(uv + fract(time * 0.5), vec2(12.9898, 78.233))) * 43758.5453);
}

// ── Vignette ─────────────────────────────────────────────────────────────────
float vignette(vec2 uv, float strength) {
  vec2 c = uv - 0.5;
  return 1.0 - dot(c, c) * strength * 2.5;
}

void main() {
  vec2 uv = vUv;

  // Main scene with chromatic aberration
  vec3 mainColor = chromaticAberration(uMainTexture, uv, uChromaRadius);

  // Bloom glow (half-res blurred additive)
  vec3 glowColor = texture(uGlowTexture, uv).rgb;
  mainColor = mainColor + glowColor * uBloomStrength;

  // Subtle tone mapping (ACES approximation)
  mainColor = mainColor * (2.51 * mainColor + 0.03) / (mainColor * (2.43 * mainColor + 0.59) + 0.14);
  mainColor = clamp(mainColor, 0.0, 1.0);

  // Film grain
  float grain = filmGrain(uv, uTime);
  float grainOffset = (grain - 0.5) * uGrainStrength;
  mainColor += grainOffset;

  // Vignette
  float vig = vignette(uv, uVignette);
  mainColor *= vig;

  // White flash (Big Bang moment)
  mainColor = mix(mainColor, vec3(1.0), uFlashAlpha);

  pc_FragColor = vec4(clamp(mainColor, 0.0, 1.0), 1.0);
}
