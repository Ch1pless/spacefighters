#version 300 es
precision mediump float;

in vec3 fragPosition;

out vec4 fragColor;

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
  fragColor = vec4(rand(fragPosition.xy), rand(fragPosition.yz), rand(fragPosition.xz), 1.);
}