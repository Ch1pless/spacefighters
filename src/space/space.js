import * as twgl from "twgl-base.js";
import { Vector3, Matrix4 } from "@math.gl/core";
import { Object3D } from "../engine/core/Object3D";
export default class extends Object3D {
  constructor(gl, amount = 1000, radFromCenter = 100_000) {
    super();

    this.gl = gl;
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.clearColor(0, 0, 0, 1);

    this.vert = require("./vertex.glsl");
    this.frag = require("./fragment.glsl");

    this.programInfo = twgl.createProgramInfo(this.gl, [this.vert, this.frag]);
    this.generateStars(amount, radFromCenter)
  }

  generateStars(amount, radFromCenter) {
    this.stars = { numComponents: 3, data: [] };
    for (let i = 0; i < amount; ++i) {
      let pos = new Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
      pos.normalize();
      pos.scale(radFromCenter);
      this.stars.data.push(pos.x, pos.y, pos.z);
    }

    this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, {position: this.stars});
  }

  renderStars(camera) {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.useProgram(this.programInfo.program);

    this.updateMatrix();

    const uniforms = {
      u_projectionMatrix: new Matrix4().perspective({aspect: this.gl.canvas.width / this.gl.canvas.height, far: Infinity}),
      u_viewMatrix: camera.viewMatrix,
      u_modelMatrix: this.matrix
    };

    twgl.setUniforms(this.programInfo, uniforms);
    twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo);
    twgl.drawBufferInfo(this.gl, this.bufferInfo, this.gl.POINTS);
  }
}
