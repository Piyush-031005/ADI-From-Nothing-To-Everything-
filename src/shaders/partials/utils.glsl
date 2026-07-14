// ── Remap / Lerp helpers ─────────────────────────────────────────────────────
float inverseLerp(float v, float minV, float maxV) {
  return (v - minV) / (maxV - minV);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = clamp(inverseLerp(v, inMin, inMax), 0.0, 1.0);
  return mix(outMin, outMax, t);
}

// ── Blend modes ──────────────────────────────────────────────────────────────
vec3 blendAdd(vec3 base, vec3 blend) {
  return min(base + blend, vec3(1.0));
}

vec3 blendAdd(vec3 base, vec3 blend, float opacity) {
  return blendAdd(base, blend) * opacity + base * (1.0 - opacity);
}

vec3 blendScreen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
  return mix(
    2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
    sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
    step(0.5, blend)
  );
}

// ── Blackbody temperature → RGB color ────────────────────────────────────────
// Approximation of Planckian locus (3000K – 20000K)
vec3 blackbodyColor(float kelvin) {
  float t = kelvin / 100.0;
  vec3 col;
  // Red
  if (t <= 66.0) col.r = 1.0;
  else {
    col.r = clamp((329.698727446 * pow(t - 60.0, -0.1332047592)) / 255.0, 0.0, 1.0);
  }
  // Green
  if (t <= 66.0) {
    col.g = clamp((99.4708025861 * log(t) - 161.1195681661) / 255.0, 0.0, 1.0);
  } else {
    col.g = clamp((288.1221695283 * pow(t - 60.0, -0.0755148492)) / 255.0, 0.0, 1.0);
  }
  // Blue
  if (t >= 66.0) col.b = 1.0;
  else if (t <= 19.0) col.b = 0.0;
  else {
    col.b = clamp((138.5177312231 * log(t - 10.0) - 305.0447927307) / 255.0, 0.0, 1.0);
  }
  return col;
}

// ── SDF helpers ──────────────────────────────────────────────────────────────
float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdCircle(vec2 p, float r) { return length(p) - r; }
