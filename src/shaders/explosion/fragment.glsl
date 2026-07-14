precision highp float;

in vec3 vColor;
in float vAlpha;

out vec4 pc_FragColor;

void main() {
  // Soft circular particle
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  // Soft disc with glow core
  float alpha = smoothstep(0.5, 0.0, dist);
  float glow  = smoothstep(0.5, 0.1, dist) * 0.6;

  float finalAlpha = (alpha + glow) * vAlpha;

  if (finalAlpha < 0.001) discard;

  pc_FragColor = vec4(vColor + glow * vec3(0.3, 0.2, 0.1), finalAlpha);
}
