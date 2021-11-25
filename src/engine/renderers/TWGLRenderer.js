import * as twgl from "twgl-base.js";
import { SetBufferInfo } from "../core/ThreeToTwgl";

const textureShader = [require("./shaders/texturevert.glsl"), require("./shaders/texturefrag.glsl")];
const basicShader = [require("./shaders/basicvert.glsl"), require("./shaders/basicfrag.glsl")];

export default class TWGLRenderer {
  constructor() {
    // Do Nothing
  }
  
  // calculate 0-1 rgb code
  clampedColor(hexcode) {
    const r = (0xff0000 & hexcode) >> 16,
          g = (0xff00 & hexcode) >> 8,
          b = 0xff & hexcode;
    return [r / 256, g / 256, b / 256, 1.0];
  }

  render(scene, camera, gl) {
    if (gl === undefined) {
      console.error("GL is undefined.");
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);

    const clampedBG = this.clampedColor(scene.background);
    gl.clearColor(...clampedBG);

    // I dunno what this does, so we wont do it for now
    // gl.colorMask(true, true, true, true);
    // gl.depthMask(true);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
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

    if (scene.autoUpdate) scene.updateMatrixWorld();

    if (camera.parent === null) camera.updateMatrixWorld();

    for (const child of scene.children)
      this.renderObject(child, scene, camera, gl);
  }

  renderObject(object, scene, camera, gl) {
    if (object.type === "Mesh") {
      const geo = object.geometry, mat = object.material;

      let bufferInfo = null;
      if (geo.userData.twglBufferInfo !== undefined)
        bufferInfo = geo.userData.twglBufferInfo;
      else
        bufferInfo = SetBufferInfo(geo, gl);

      let textureMap = null;
      if (mat.userData.textureMap !== undefined)
        textureMap = mat.userData.textureMap;
      
      object.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);
      object.normalMatrix.getNormalMatrix(object.modelViewMatrix);

      if (object.matrixWorld.determinant() < 0)
        gl.frontFace(gl.CW);
      else
        gl.frontFace(gl.CCW);

      // generate uniforms
      const uniforms = {
        u_modelMatrix: object.matrixWorld.toArray(),
        u_viewMatrix: camera.matrixWorldInverse.toArray(),
        u_modelViewMatrix: object.modelViewMatrix.toArray(),
        u_projectionMatrix: camera.projectionMatrix.toArray(),
        u_normalMatrix: object.normalMatrix.toArray(),
        u_materialColor: [mat.color.r, mat.color.g, mat.color.b]
      };


      if (textureMap !== null)
        uniforms["u_textureMap"] = textureMap;

      let programInfo;
      if (textureMap !== null)
        programInfo = twgl.createProgramInfo(gl, textureShader);
      else
        programInfo = twgl.createProgramInfo(gl, basicShader);

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, bufferInfo);
    }

    for (const child of object.children)
      this.renderObject(child, scene, camera, gl);
  }
}