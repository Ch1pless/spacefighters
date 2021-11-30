#version 300 es
precision highp float;

uniform samplerCube u_skybox;

in vec3 fPosition;

out vec4 outColor;

void main() {
  outColor = texture(u_skybox, fPosition);
}