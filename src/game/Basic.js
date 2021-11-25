import * as twgl from 'twgl-base.js/dist/4.x/twgl';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/objloader';
import { Object3D } from '../engine/core/Object3D.js';
import { Matrix4 } from '@math.gl/core';
import { Loader } from '../engine/core/ThreeToTwgl.js';

let ship_obj = require('../assets/StarSparrow_OBJ/StarSparrow01.obj');

export default class PlayerShip {
  constructor(gl, size=1) {
    this.gl = gl;
    this.vs = require("./boxvert.glsl");
    this.fs = require("./boxfrag.glsl");

    this.programInfo = twgl.createProgramInfo(this.gl, [this.vs, this.fs]);
    this.scale = size;

    this.uniforms = {};

    this.attributes = {};
    this.bufferInfo = {};
  }

  async init() {
    // this.ship = await Loader(ship_obj);
    this.object = await new OBJLoader().loadAsync(ship_obj);
  }
}
