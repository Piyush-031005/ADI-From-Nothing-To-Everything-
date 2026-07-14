precision highp float;

uniform vec3 uSunDirection;
uniform vec3 uAtmosphereColor;
uniform float uAtmosphereStrength;

in vec3 vNormal;
in vec3 vPosition;

out vec4 pc_FragColor;

void main() {
  vec3 norm    = normalize(vNormal);
  vec3 sunDir  = normalize(uSunDirection);
  vec3 viewDir = normalize(-vPosition);

  // Rayleigh rim: glow where normal is perpendicular to view
  float rim = 1.0 - max(dot(norm, viewDir), 0.0);
  rim = pow(rim, 3.0);

  // Sun-side brightening (day limb brighter)
  float sunFacing = max(dot(norm, sunDir), 0.0);
  float dayRim = rim * (0.4 + sunFacing * 0.6);

  // Twilight band (neither day nor night)
  float twilight = smoothstep(-0.1, 0.1, dot(norm, sunDir));
  vec3 twilightColor = mix(vec3(0.5, 0.2, 0.1), uAtmosphereColor, twilight);

  vec3 col = twilightColor * dayRim * uAtmosphereStrength;

  // Alpha based on rim
  float alpha = dayRim * 0.6 * uAtmosphereStrength;

  pc_FragColor = vec4(col, alpha);
}
