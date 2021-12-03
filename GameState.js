const THREE = require("three");

module.exports = class GameState {
  constructor() {
    this.players = {};
    this.stateInverval = null;
  }

  addPlayer(id, color) {
    this.players[id] = {
      matrix: new THREE.Matrix4().identity(),
      color: color
    };
    if (Object.keys(this.players).length == 2)
      this.setupPlayers();
  }

  setupPlayers() {
    for (const player in this.players) {
      this.players[player].matrix.makeTranslation(0, 0, Math.random()*20-10);
    }
  }


}