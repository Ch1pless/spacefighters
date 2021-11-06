#version 300 es
precision mediump float;

uniform mat4 u_projectionMatrix;
uniform mat4 u_modelMatrix;

in vec3 position;

out vec3 fragPosition;

highp float rand(vec2 co)
{
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

void main() {
  vec4 mPosition = u_projectionMatrix * u_modelMatrix * vec4(position, 1.);
  gl_Position = mPosition;
  gl_PointSize = rand(position.xy) * 2.;
}