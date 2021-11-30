#version 300 es
precision highp float;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;

in vec3 position;

out vec3 fPosition;

void main() {
  fPosition = position;
  vec4 newPosition = u_projectionMatrix * u_viewMatrix * vec4(position, 1.0);
  gl_Position = newPosition.xyww; // guarantee furthest depth
}