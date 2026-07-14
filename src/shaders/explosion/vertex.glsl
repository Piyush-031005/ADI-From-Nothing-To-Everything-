#define PI 3.14159265358979

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float uTime;
uniform float uExplosionProgress; // 0=start, 1=fully expanded
uniform float uViewHeight;

in vec3 position;       // origin position (random in tiny sphere)
in vec3 aVelocity;      // explosion direction * speed
in float aSize;
in float aTemp;         // 0=cool(red), 1=hot(white)
in float aLife;         // 0-1, random lifetime offset

out vec3 vColor;
out float vAlpha;

// Blackbody approximation
vec3 tempToColor(float t) {
  vec3 cold   = vec3(0.9, 0.3, 0.1); // hot red
  vec3 medium = vec3(1.0, 0.6, 0.2); // orange
  vec3 hot    = vec3(1.0, 0.95, 0.8); // near-white
  if (t < 0.5) return mix(cold, medium, t * 2.0);
  return mix(medium, hot, (t - 0.5) * 2.0);
}

void main() {
  // Explosion displacement
  float p = uExplosionProgress;
  // Ease: fast start, slow end
  float eased = 1.0 - pow(1.0 - p, 3.0);

  // Each particle has a random offset in its lifetime
  float localP = clamp(eased - aLife * 0.3, 0.0, 1.0);

  vec3 newPosition = position + aVelocity * localP * 8.0;

  // Slight turbulence falloff
  float turbStrength = (1.0 - localP) * 0.3;
  newPosition += sin(position * 10.0 + uTime) * turbStrength;

  vec4 mvPos = modelViewMatrix * vec4(newPosition, 1.0);
  gl_Position = projectionMatrix * mvPos;

  // Size: large at bang, shrinks with distance
  float sizeBase = aSize * 0.006 * uViewHeight;
  float sizeFade = 1.0 - localP * 0.6;
  gl_PointSize = sizeBase * sizeFade;
  gl_PointSize *= (1.0 / -mvPos.z);
  gl_PointSize = clamp(gl_PointSize, 0.5, 24.0);

  // Color: starts white-hot, cools to red/orange
  float coolProgress = localP;
  vColor = tempToColor(mix(aTemp, aTemp * (1.0 - coolProgress * 0.8), 0.5));

  // Alpha: fade in fast, slow fade out
  float fadeIn  = smoothstep(0.0, 0.1, localP);
  float fadeOut = 1.0 - smoothstep(0.6, 1.0, localP);
  vAlpha = fadeIn * fadeOut;
}
