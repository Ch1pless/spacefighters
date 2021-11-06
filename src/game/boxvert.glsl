#version 300 es
precision mediump float;

in vec3 position, normal;

uniform mat4 u_projectionMatrix;
uniform mat4 u_modelMatrix;
uniform mat3 u_normalMatrix;

out vec3 fragPosition;
out vec3 fragNormal;

void main() {
  gl_Position = u_projectionMatrix * u_modelMatrix * vec4(position, 1.);
  fragPosition = position;
  fragNormal = normalize(normal);
}