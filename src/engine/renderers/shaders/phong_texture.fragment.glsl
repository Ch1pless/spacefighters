#version 300 es
precision mediump float;

#define MAX_LIGHTS 4

struct Light {
  vec4 position;
  vec3 color;
  vec3 spotLookAt;
  float intensity;
  float decay;
  float spotAngle;
  int type; // 0: ambient, 1: simple(point/directional), 2: spotlight, -1: no light
};

uniform sampler2D u_textureMap;
uniform mat4 u_viewMatrix;
uniform vec3 u_eyePosition;
uniform vec3 u_materialColor;
uniform vec3 u_specularColor;
uniform float u_shininess;
uniform float u_specular;
uniform int u_numLights;
uniform Light u_lights[MAX_LIGHTS]; 

in vec3 fPosition;
in vec3 fNormal;
in vec2 fUV;

out vec4 outColor;

vec3 computeAmbient(Light l) {
  return u_materialColor * l.intensity;
}

vec3 computeSimple(Light l, vec3 V, vec3 N) {
  vec3 lightVector = (u_viewMatrix * l.position).xyz;
  if (l.position.w > 0.0) lightVector -= fPosition;

  vec3 L = normalize(lightVector);
  vec3 H = normalize(L + V);

  vec3 diffuseColor = u_materialColor * clamp(dot(N, L), 0.0, 1.0);
  vec3 specularColor = u_specularColor * l.color * pow(clamp(dot(N, H), 0.0, 1.0), u_shininess); 

  return (1.0 - u_specular) * diffuseColor + u_specular * specularColor;
}

vec3 computeSpotlight(Light l) {
  return vec3(0, 0, 0);
}

vec3 computeColor() {
  vec3 color;
  vec3 V = normalize(u_eyePosition - fPosition);
  vec3 N = normalize(fNormal);
  for (int i = 0; i < u_numLights; ++i) {
    if (u_lights[i].type == 0) {
      color += computeAmbient(u_lights[i]);
    } else if (u_lights[i].type == 1)
      color += computeSimple(u_lights[i], V, N);
    else if (u_lights[i].type == 2)
      color += computeSpotlight(u_lights[i]);
  }
  return color;
}

void main() {
  vec3 color = computeColor();
  color = clamp(color, 0.0, 1.0);
  vec4 texColor = texture(u_textureMap, fUV);
  outColor = vec4(color * texColor.xyz, 1.0);
}