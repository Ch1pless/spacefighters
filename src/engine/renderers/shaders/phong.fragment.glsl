#version 300 es
precision mediump float;

struct Light {
  vec4 position;
  vec3 color;
  vec3 spotLookAt;
  float intensity;
  float decay;
  float spotAngle;
  int type; // 0: ambient, 1: simple(point/directional), 2: spotlight
};

uniform vec3 u_eyePosition;
uniform vec3 u_materialColor;
uniform vec3 u_specularColor;
uniform float u_shininess;
uniform float u_specular;
uniform int u_numLights;
uniform Light[4] u_lights; 

in vec3 fNormal;
in vec3 fPosition;

out vec4 outColor;

vec3 computeAmbient(Light l) {
  return u_materialColor * l.intensity;
}

vec3 computeSimple(Light l) {
  vec3 lightVector = l.position.xyz;
  if (l.position.w > 0.0) lightVector -= fPosition;

  vec3 L = normalize(lightVector);
  vec3 V = normalize(u_eyePosition - fPosition);
  vec3 H = normalize(L + V);
  vec3 N = normalize(fNormal);

  vec3 diffuseColor = u_materialColor * clamp(dot(N, L), 0.0, 1.0);
  vec3 specularColor = u_specularColor * pow(clamp(dot(N, H), 0.0, 1.0), u_shininess); 

  return (1.0 - u_specular) * diffuseColor + u_specular * specularColor;
}

vec3 computeSpotlight(Light l) {
  return vec3(0, 0, 0);
}

vec3 computeColor() {
  vec3 color;
  for (int i = 0; i < u_numLights; ++i) {
    if (u_lights[i].type == -1)
      continue;
    else if (u_lights[i].type == 0)
      color += computeAmbient(u_lights[i]);
    else if (u_lights[i].type == 1)
      color += computeSimple(u_lights[i]);
    else
      color += computeSpotlight(u_lights[i]);
  }
  return color;
}



void main() {
  vec3 color = computeColor();
  outColor = vec4(color, 1.0);
}