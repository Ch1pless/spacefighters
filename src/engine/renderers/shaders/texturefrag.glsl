#version 300 es
precision mediump float;

uniform sampler2D u_textureMap;
uniform vec3 u_materialColor;

in vec2 fUV;
in vec3 fNormal;
in vec3 fPosition;

out vec4 outColor;

void main() {
  vec4 textureColor = texture(u_textureMap, fUV);
  outColor = vec4(u_materialColor * textureColor.xyz, 1.0);
}