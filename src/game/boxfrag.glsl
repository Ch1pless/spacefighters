#version 300 es
precision mediump float;

uniform vec3 u_color;

in vec3 fragNormal;

out vec4 outColor;

void main() {
  outColor = vec4(u_color * ((fragNormal+1.)/2.), 1.);
  // outColor = vec4(.1, .3, 1., 1.);
}
