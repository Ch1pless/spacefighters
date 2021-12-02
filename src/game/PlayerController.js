import * as THREE from "three";

export class PlayerController {
  constructor(config, player) {
    this.player = player;
    this.config = config;
    this.keysPressed = {};
    this.init();
  }

  keyEventHandler(event) {
    this.keysPressed[event.key] = event.type == "keydown";
    if (event.type == "keydown") {
      console.log("prevented default");
      event.preventDefault();
    }
    return false;
  }

  init() {
    document.addEventListener("keydown", this.keyEventHandler.bind(this));
    document.addEventListener("keyup", this.keyEventHandler.bind(this));
  }

  update(deltaT) {
    let movement = new THREE.Vector3(0, 0, 0);
    let rotationY = 0;
    if (this.keysPressed[this.config.keys.forward])
      movement.z += 1;
    if (this.keysPressed[this.config.keys.backward])
      movement.z -= 1;
    if (this.keysPressed[this.config.keys.up])
      movement.y += 1;
    if (this.keysPressed[this.config.keys.down])
      movement.y -= 1;
    if (this.keysPressed[this.config.keys.left])
      rotationY += 1;
    if (this.keysPressed[this.config.keys.right])
      rotationY -= 1;

    
    movement.normalize();
    this.player.translateZ(movement.z * this.config.horMovSpeed * deltaT);
    this.player.translateY(movement.y * this.config.verMovSpeed * deltaT);
    this.player.rotateY(this.config.horRotSpeed * rotationY * deltaT);
  }
}