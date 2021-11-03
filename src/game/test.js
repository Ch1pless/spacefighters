import { Object3D } from '../engine/core/Object3D.js';
// const twgl = require('twgl-base.js');
// const OBJLoader = require('three/jsm/loaders/OBJLoader');

// const game_canvas = document.getElementById('game');
// const gl = twgl.getContext(game_canvas);
// const loader = new OBJLoader();

// const ship_model = loader.load('../assets/Viper-mk-IV-fighter obj/Viper-mk-IV-fighter.obj');

// console.log(ship_model);

export default function() {
  const tester = new Object3D();
  tester.setRotationFromAxisAngle([0, 1, 0], 1/2);
  tester.updateMatrix();
  console.log(tester.matrix);
  tester.position = [0, 10, 10];
  tester.updateMatrix();
  console.log(tester.matrix);
}
