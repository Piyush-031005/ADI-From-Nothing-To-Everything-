precision highp float;
uniform float uTime;
in vec2 vUv;
in vec3 vPosition;
in vec3 vNormal;
out vec4 pc_FragColor;

void main() {
  // A glowing, shifting star surface
  vec3 baseCol = vec3(1.0, 0.9, 0.4);
  vec3 hotCol = vec3(1.0, 1.0, 0.8);
  vec3 edgeCol = vec3(1.0, 0.5, 0.1);
  
  // Use normals to determine edge (fresnel)
  vec3 viewDir = normalize(-vPosition);
  float fresnel = dot(viewDir, normalize(vNormal));
  fresnel = clamp(fresnel, 0.0, 1.0);
  
  // Outer edge is more orange/red, center is bright white/yellow
  vec3 finalColor = mix(edgeCol, hotCol, fresnel);
  
  pc_FragColor = vec4(finalColor, 1.0);
}
