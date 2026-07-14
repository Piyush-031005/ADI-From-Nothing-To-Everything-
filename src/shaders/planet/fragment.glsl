precision highp float;

uniform float uTime;
uniform float uCoolProgress;   // 0=molten, 1=cooled/Earth
uniform float uOceanProgress;  // 0=no ocean, 1=full ocean
uniform vec3  uSunDirection;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vUv;
in float vElevation;
in float vHeat;

out vec4 pc_FragColor;

// ── Color palette helpers ────────────────────────────────────────────────────
vec3 lavaColor(float heat) {
  vec3 darkRock = vec3(0.05, 0.03, 0.03);
  vec3 hotRock  = vec3(0.25, 0.08, 0.02);
  vec3 lava     = vec3(1.0,  0.35, 0.02);
  vec3 coreLava = vec3(1.0,  0.8,  0.3);
  if (heat < 0.33) return mix(darkRock, hotRock, heat * 3.0);
  if (heat < 0.66) return mix(hotRock, lava, (heat - 0.33) * 3.0);
  return mix(lava, coreLava, (heat - 0.66) * 3.0);
}

vec3 earthColor(float elev) {
  vec3 deepOcean  = vec3(0.02, 0.08, 0.2);
  vec3 ocean      = vec3(0.05, 0.25, 0.5);
  vec3 shallows   = vec3(0.1,  0.45, 0.55);
  vec3 beach      = vec3(0.75, 0.7,  0.5);
  vec3 grass      = vec3(0.15, 0.45, 0.1);
  vec3 highland   = vec3(0.35, 0.3,  0.2);
  vec3 snow       = vec3(0.9,  0.95, 1.0);

  if (elev < -0.15) return deepOcean;
  if (elev < -0.05) return mix(deepOcean, ocean, (elev + 0.15) / 0.1);
  if (elev < 0.0)   return mix(ocean, shallows, (elev + 0.05) / 0.05);
  if (elev < 0.02)  return mix(shallows, beach, elev / 0.02);
  if (elev < 0.06)  return mix(beach, grass, (elev - 0.02) / 0.04);
  if (elev < 0.12)  return mix(grass, highland, (elev - 0.06) / 0.06);
  return mix(highland, snow, clamp((elev - 0.12) / 0.05, 0.0, 1.0));
}

void main() {
  vec3 norm = normalize(vNormal);

  // Diffuse lighting
  float diff = max(dot(norm, normalize(uSunDirection)), 0.0);
  float ambient = 0.08;

  // Base color: lerp between lava and Earth
  vec3 lava = lavaColor(vHeat);
  vec3 earth = earthColor(vElevation);

  // Ocean mask
  float oceanMask = step(vElevation, 0.0) * uOceanProgress;
  vec3 oceanCol = mix(vec3(0.04, 0.15, 0.35), vec3(0.05, 0.3, 0.55),
    sin(uTime * 0.5 + vUv.x * 20.0) * 0.5 + 0.5);

  earth = mix(earth, oceanCol, oceanMask * 0.8);

  vec3 baseColor = mix(lava, earth, uCoolProgress);

  // Specular (only on ocean/lava)
  vec3 viewDir = normalize(-vPosition);
  vec3 halfVec = normalize(normalize(uSunDirection) + viewDir);
  float spec = pow(max(dot(norm, halfVec), 0.0), 32.0);
  float specMask = mix(vHeat, oceanMask, uCoolProgress);
  vec3 specColor = vec3(1.0, 0.9, 0.7) * spec * specMask * 0.4;

  // Lava glow in cracks (low elevation = bright glow when molten)
  float lavaCrack = (1.0 - uCoolProgress) * vHeat * 0.5;
  vec3 glowColor = vec3(1.0, 0.4, 0.05) * lavaCrack;

  vec3 finalColor = baseColor * (diff + ambient) + specColor + glowColor;

  // Night side: faint lava glow visible even in shadow
  float nightGlow = (1.0 - uCoolProgress) * (1.0 - diff) * vHeat * 0.15;
  finalColor += vec3(1.0, 0.2, 0.0) * nightGlow;

  pc_FragColor = vec4(finalColor, 1.0);
}
