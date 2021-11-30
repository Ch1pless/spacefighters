import * as twgl from "twgl-base.js";
import * as THREE from "three";
import { SetBufferInfo } from "../core/ThreeToTwgl";

let textureProgram, basicProgram, phongProgram, phongTextureProgram;

const lights = [];
const renderList = [];
export default class TWGLRenderer {
  constructor(gl) {
    // Do Nothing
    textureProgram = twgl.createProgramInfo(gl, [require("./shaders/texture.vertex.glsl"), require("./shaders/texture.fragment.glsl")]);
    basicProgram = twgl.createProgramInfo(gl, [require("./shaders/basic.vertex.glsl"), require("./shaders/basic.fragment.glsl")]);
    phongProgram = twgl.createProgramInfo(gl, [require("./shaders/phong.vertex.glsl"), require("./shaders/phong.fragment.glsl")]);
    phongTextureProgram = twgl.createProgramInfo(gl, [require("./shaders/phong_texture.vertex.glsl"), require("./shaders/phong_texture.fragment.glsl")]);
  }

  
  
  // calculate 0-1 rgb code
  clampedColor(hexcode) {
    const r = (0xff0000 & hexcode) >> 16,
          g = (0xff00 & hexcode) >> 8,
          b = 0xff & hexcode;
    return [r / 256, g / 256, b / 256, 1.0];
  }

  render(scene, camera, gl) {
    if (scene === undefined) {
      console.error("scene is undefined.");
      return;
    }
    if (camera === undefined) {
      console.error("camera is undefined.");
      return;
    }
    if (gl === undefined) {
      console.error("gl is undefined.");
      return;
    }

    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    const clampedBG = this.clampedColor(scene.background);
    gl.clearColor(...clampedBG);

    // I dunno what this does, so we wont do it for now
    // gl.colorMask(true, true, true, true);
    // gl.depthMask(true);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    lights.length = 0; // clear lights array
    renderList.length = 0;
    scene.traverse(object => { if (object.isLight) lights.push(object); });
    scene.traverse(object => { if (object.isMesh) renderList.push(object); });


    if (scene.autoUpdate) scene.updateMatrixWorld();

    if (camera.parent === null) camera.updateMatrixWorld();

    for (const object of renderList)
      this.renderObject(object, scene, camera, gl);
  }

  createProgramInfo(material, gl) {
    const hasTexture = material.userData.textureMap !== undefined;
    
    if (material.isMeshBasicMaterial) {
      if (hasTexture)
        return textureProgram;
      else
        return basicProgram;
    } else if (material.isMeshPhongMaterial) {
      if (hasTexture)
        return phongTextureProgram;
      else
        return phongProgram;
    }
  }

  createBufferInfo(geometry, gl) {
    if (geometry.userData.twglBufferInfo !== undefined)
      return geometry.userData.twglBufferInfo;
    else
      return SetBufferInfo(geometry, gl);
  }

  setLightUniforms(uniforms) {
    uniforms.u_lights.length = 4; // constant max amount of lights allowed in shader
    for (let i = 0; i < lights.length; ++i) {
      const light = lights[i];
      const color = [light.color.r, light.color.g, light.color.b];
      const lightStruct = {
        position: [0.0, 0.0, 0.0, 0.0],
        color: [1.0, 1.0, 1.0],
        spotLookAt: [0.0, 0.0, 0.0],
        intensity: 1.0,
        decay: 1.0,
        spotAngle: 0.0,
        type: -1 // 0: ambient, 1: simple(point/directional), 2: spotlight, 3: no light
      };
      if (light.isAmbientLight) {
        lightStruct.type = 0;
        lightStruct.intensity = light.intensity;
        lightStruct.color = color;
      } else if (light.isPointLight) {
        lightStruct.type = 1;
        lightStruct.position = [...light.localToWorld(light.position.clone()).toArray(), 1];
        lightStruct.decay = light.decay;
        lightStruct.color = color;
        lightStruct.intensity = light.intensity;
      } else if (light.isDirectionalLight) {
        let reverseLightDirection = new THREE.Vector3().subVectors(light.position, light.target.position);
        light.localToWorld(reverseLightDirection);
        lightStruct.type = 1;
        lightStruct.position = [...reverseLightDirection.toArray(), 0];
        lightStruct.color = color;
        lightStruct.intensity = light.intensity;
      } else if (light.isSpotLight) {
        console.error("Not implemented yet");
      }
      uniforms.u_lights[i] = lightStruct;
    }

    for (let i = lights.length; i < uniforms.u_lights.length; ++i) {
      const lightStruct = {
        position: [0, 0, 0, 0],
        color: [1, 1, 1],
        spotLookAt: [0, 0, 0],
        intensity: 1,
        decay: 1,
        spotAngle: 0,
        type: -1 // 0: ambient, 1: simple(point/directional), 2: spotlight, -1: no light
      };
      uniforms.u_lights[i] = lightStruct;
    }
  }

  renderObject(object, scene, camera, gl) {
    const geo = object.geometry, mat = object.material;

    let bufferInfo = this.createBufferInfo(geo, gl);

    let textureMap = null;
    if (mat.userData.textureMap !== undefined)
      textureMap = mat.userData.textureMap;

    let drawType = gl.TRIANGLES;
    if (geo.userData.drawType !== undefined)
      drawType = geo.userData.drawType;
    
    object.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);
    object.normalMatrix.getNormalMatrix(object.modelViewMatrix);

    // generate uniforms
    const uniforms = {
      u_eyePosition: camera.localToWorld(camera.position.clone()).toArray(),
      u_modelMatrix: object.matrixWorld.toArray(),
      u_viewMatrix: camera.matrixWorldInverse.toArray(),
      u_modelViewMatrix: object.modelViewMatrix.toArray(),
      u_projectionMatrix: camera.projectionMatrix.toArray(),
      u_normalMatrix: object.normalMatrix.toArray(),
      u_materialColor: [mat.color.r, mat.color.g, mat.color.b],
      u_numLights: lights.length,
      u_lights: []
    };

    this.setLightUniforms(uniforms);

    
    
    if (mat.userData.textureMap !== undefined)
      uniforms["u_textureMap"] = textureMap;
    
    if (mat.isMeshPhongMaterial) {
      uniforms["u_specularColor"] = [mat.specular.r, mat.specular.g, mat.specular.b];
      uniforms["u_shininess"] = mat.shininess;
      uniforms["u_specular"] = 0.2;
    }
    // console.log(JSON.stringify(uniforms));

    let programInfo = this.createProgramInfo(mat, gl);

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, bufferInfo, drawType);
  }
}