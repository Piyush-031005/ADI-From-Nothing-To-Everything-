// Atmosphere vertex shader — thin shell around planet
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

in vec3 position;
in vec3 normal;

out vec3 vNormal;
out vec3 vPosition;

void main() {
  vNormal = normal;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
