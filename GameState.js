const THREE = require("three");

module.exports = class GameState {
  constructor() {
    this.players = {};
    this.missiles = {};
    this.stateInverval = null;
  }

  updateMissile(id, matrix) {
    this.missiles[id] = matrix;
  }

  removeMissile(id) {
    delete this.missiles[id];
  }

  addPlayer(id, color) {
    let positions = [
      [-8, 4, -50],
      [8, -7, 50]
    ];

    let idx = Object.keys(this.players).length;
    this.players[id] = {
      matrix: new THREE.Matrix4().setPosition(positions[idx][0], positions[idx][1], positions[idx][2]),
      color: color
    };
  }


}