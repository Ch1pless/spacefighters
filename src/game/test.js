import * as twgl from 'twgl-base.js/dist/4.x/twgl';
import { Base3D } from '../engine/core/Base3D.js';
import { Matrix4 } from '@math.gl/core';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { ObjectLoader } from 'three';

const loader = new OBJLoader();

let ship_obj = require('../assets/Viper-mk-IV-fighter/Viper-mk-IV-fighter.obj');
let ship_model;
loader.load(ship_obj, obj => { ship_model = obj; }, undefined, error => {console.log(error); });

let counter  = 0;
function printShip() {
  if (ship_model == undefined)
    counter++;
  else {
    console.log(`Took ${counter} tries till load`);
    console.log(ship_model);
  }
  if (ship_model == undefined)
    requestAnimationFrame(printShip);
}

printShip();

export default class extends Base3D {
  constructor(gl, size=1) {
    super();
    this.gl = gl;
    this.vs = require("./boxvert.glsl");
    this.fs = require("./boxfrag.glsl");

    this.programInfo = twgl.createProgramInfo(this.gl, [this.vs, this.fs]);
    this.generateCube();
    this.scale = size;
  }

  generateCube() {
    const arrays = {
      position: [
        // 0 - left bottom front:
        -1, -1, -1,
        // 1 - right bottom front:
        1, -1, -1,
        // 2 - left bottom back:
        -1, 1, -1,
        // 3 - right bottom back:
        1, 1, -1,
        // 4 - top middle:
        0, 0, 1,
      ],
      normal: [
        0, 0.1, -0.9,
        0.9, 0.1, 0,
        0, 0.1, 0.9,
        -0.9, 0.1, 0,
        0, -1, 0,
        0, -1, 0,
      ],
      indices: [
        // face 1: front
        0, 4, 1,
        // face 2: right
        1, 4, 3,
        // face 3: back
        3, 4, 2,
        // face 4: left
        2, 4, 0,
        // face 5: down
        2, 1, 3,
        // face 6; down
        2, 0, 1,
      ]
    };

    this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, arrays);
  }
  
  render() {
    this.gl.useProgram(this.programInfo.program);
    this.updateMatrix();

    const uniforms = {
      u_projectionMatrix: new Matrix4().perspective({aspect: this.gl.canvas.width / this.gl.canvas.height, far: 1000}),
      u_modelMatrix: this.matrix,
      u_normalMatrix: this.normalMatrix,
      u_color: [.25, .5, 1.]
    };

    twgl.setUniforms(this.programInfo, uniforms);
    twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo);
    twgl.drawBufferInfo(this.gl, this.bufferInfo);

  }

}
