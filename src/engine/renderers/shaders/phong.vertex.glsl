#version 300 es
precision mediump float;

uniform mat4 u_modelMatrix;
uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat3 u_normalMatrix;


in vec3 position;
in vec3 normal;

out vec3 fPosition;
out vec3 fNormal;

void main() {
  vec4 modelPosition = u_modelViewMatrix * vec4(position, 1.0);
  fNormal = normalize(u_normalMatrix * normal);
  fPosition = modelPosition.xyz / modelPosition.w;
  gl_Position = u_projectionMatrix * modelPosition;
}