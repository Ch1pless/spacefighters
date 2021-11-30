#version 300 es
precision mediump float;

uniform vec3 u_materialColor;

in vec3 fNormal;
in vec3 fPosition;

out vec4 outColor;

void main() {
  outColor = vec4(u_materialColor, 1.0);
}