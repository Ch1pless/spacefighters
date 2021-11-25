import * as twgl from "twgl-base.js/dist/4.x/twgl";

export function SetBufferInfo(geometry, gl) {
  const twglAttributes = {};
  
  for (const key in geometry.attributes) {
    twglAttributes[key] = {
      numComponents: geometry.attributes[key].itemSize,
      data: [...geometry.attributes[key].array]
    }
  }
  if (geometry.index !== null)
    twglAttributes.indices = {data: [...geometry.index.array], numComponents: 3};

  geometry.userData.twglAttributes = twglAttributes;
  geometry.userData.twglBufferInfo = twgl.createBufferInfoFromArrays(gl, twglAttributes);

  return geometry.userData.twglBufferInfo;
}