// Fractal Brownian Motion — layered simplex noise
// Requires simplex3.glsl to be included first

float fbm(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  float lacunarity = 2.0;
  float gain = 0.5;

  for (int i = 0; i < octaves; i++) {
    value += amplitude * snoise(p * frequency);
    frequency *= lacunarity;
    amplitude *= gain;
  }
  return value;
}

float fbm(vec3 p) {
  return fbm(p, 6);
}

// Domain-warped fbm for extra complexity
float fbm_warped(vec3 p) {
  vec3 q = vec3(
    fbm(p + vec3(0.0, 0.0, 0.0)),
    fbm(p + vec3(5.2, 1.3, 2.8)),
    fbm(p + vec3(1.7, 9.2, 3.1))
  );
  return fbm(p + 4.0 * q);
}
