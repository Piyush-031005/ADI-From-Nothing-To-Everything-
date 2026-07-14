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

uniform sampler2D tDiffuse;
uniform sampler2D tSpecular;
uniform sampler2D tNormal;
uniform float uTextureLoaded;

void main() {
  vec3 norm = normalize(vNormal);

  // Sample Earth textures
  vec3 texDiffuse = texture(tDiffuse, vUv).rgb;
  float texSpecular = texture(tSpecular, vUv).r;
  vec3 texNormal = texture(tNormal, vUv).xyz * 2.0 - 1.0;
  
  // Normal mapping based on texture (simplistic tangential)
  vec3 tNorm = normalize(norm + texNormal * 0.5 * uTextureLoaded);

  // Diffuse lighting
  float diff = max(dot(tNorm, normalize(uSunDirection)), 0.0);
  float ambient = 0.08;

  // Base color: lerp between lava and Earth
  vec3 lava = lavaColor(vHeat);
  
  // Mix procedural Earth with Texture Earth
  vec3 earth = earthColor(vElevation);
  float oceanMask = step(vElevation, 0.0) * uOceanProgress;
  vec3 oceanCol = mix(vec3(0.04, 0.15, 0.35), vec3(0.05, 0.3, 0.55), sin(uTime * 0.5 + vUv.x * 20.0) * 0.5 + 0.5);
  vec3 proceduralEarth = mix(earth, oceanCol, oceanMask * 0.8);

  // We blend between procedural (early Earth) and textured (modern Earth) ONLY if texture is loaded
  vec3 finalEarth = mix(proceduralEarth, texDiffuse, uOceanProgress * uCoolProgress * uTextureLoaded);

  vec3 baseColor = mix(lava, finalEarth, uCoolProgress);

  // Specular
  vec3 viewDir = normalize(-vPosition);
  vec3 halfVec = normalize(normalize(uSunDirection) + viewDir);
  float spec = pow(max(dot(tNorm, halfVec), 0.0), 32.0);
  
  // Use texture specular for modern Earth, procedural for early
  float procSpecMask = mix(vHeat, oceanMask, uCoolProgress);
  float finalSpecMask = mix(procSpecMask, texSpecular, uOceanProgress * uCoolProgress * uTextureLoaded);
  
  vec3 specColor = vec3(1.0, 0.9, 0.7) * spec * finalSpecMask * 0.5;

  // Lava glow in cracks (low elevation = bright glow when molten)
  float lavaCrack = (1.0 - uCoolProgress) * vHeat * 0.5;
  vec3 glowColor = vec3(1.0, 0.4, 0.05) * lavaCrack;

  vec3 finalColor = baseColor * (diff + ambient) + specColor + glowColor;

  // Night side city lights (only when fully cooled)
  float nightSide = 1.0 - diff;
  if (uOceanProgress > 0.9 && uCoolProgress > 0.9) {
     float landMask = (1.0 - texSpecular) * uTextureLoaded;
     float cityLights = pow(texDiffuse.g, 3.0) * landMask;
     finalColor += vec3(1.0, 0.8, 0.4) * cityLights * nightSide * 2.0;
  } else {
     // Night side: faint lava glow visible even in shadow
     float nightGlow = (1.0 - uCoolProgress) * nightSide * vHeat * 0.15;
     finalColor += vec3(1.0, 0.2, 0.0) * nightGlow;
  }

  pc_FragColor = vec4(finalColor, 1.0);
}
