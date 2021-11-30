import * as twgl from "twgl-base.js";
import * as THREE from "three";

const skyboxShader = [require("./skybox.vertex.glsl"), require("./skybox.fragment.glsl")];

export class Skybox {
  constructor() {
    this.attributes = {
      position: { 
        numComponents: 3, 
        data: [
          -1,  1, -1,
          -1, -1, -1,
           1, -1, -1,
           1, -1, -1,
           1,  1, -1,
          -1,  1, -1,
      
          -1, -1,  1,
          -1, -1, -1,
          -1,  1, -1,
          -1,  1, -1,
          -1,  1,  1,
          -1, -1,  1,
      
           1, -1, -1,
           1, -1,  1,
           1,  1,  1,
           1,  1,  1,
           1,  1, -1,
           1, -1, -1,
      
          -1, -1,  1,
          -1,  1,  1,
           1,  1,  1,
           1,  1,  1,
           1, -1,  1,
          -1, -1,  1,
      
          -1,  1, -1,
           1,  1, -1,
           1,  1,  1,
           1,  1,  1,
          -1,  1,  1,
          -1,  1, -1,
      
          -1, -1, -1,
          -1, -1,  1,
           1, -1, -1,
           1, -1, -1,
          -1, -1,  1,
           1, -1,  1
        ]
      }
    };
  }

  async init(images, gl) {
    this.cubeMap = twgl.createTexture(gl, {
      target: gl.TEXTURE_CUBE_MAP,
      src: images,
      min: gl.LINEAR_MIPMAP_LINEAR
    });
  }

  render(camera, gl) {
    if (this.bufferInfo === undefined)
      this.bufferInfo = twgl.createBufferInfoFromArrays(gl, this.attributes);

    if (this.programInfo === undefined)
      this.programInfo = twgl.createProgramInfo(gl, skyboxShader);

    const viewDirection = camera.matrixWorldInverse.clone().setPosition(0, 0, 0);

    const uniforms = {
      u_skybox: this.cubeMap,
      u_projectionMatrix: camera.projectionMatrix.toArray(),
      u_viewMatrix: viewDirection.toArray(),
    };

    // let quad pass depth test at 1.0
    gl.depthFunc(gl.LEQUAL);

    gl.useProgram(this.programInfo.program);
    twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo);
    twgl.setUniforms(this.programInfo, uniforms);
    twgl.drawBufferInfo(gl, this.bufferInfo);

    gl.depthFunc(gl.LESS);
  }


}