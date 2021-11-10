import * as twgl from "twgl-base.js";
import { Vector3, Matrix4, toRadians } from "@math.gl/core";
import { Base3D } from "../engine/core/Base3D";
export default class extends Base3D {
  constructor(gl, amount = 1000, radFromCenter = 1) {
    super();

    this.gl = gl;
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.clearColor(0, 0, 0, 1);

    this.vert = require("./spacecraftvert.glsl");
    this.frag = require("./spacecraftfrag.glsl");

    this.programInfo = twgl.createProgramInfo(this.gl, [this.vert, this.frag]);
  }
}
