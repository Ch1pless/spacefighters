import * as THREE from "three";

export class PlayerController {
  constructor(config, player) {
    this.player = player;
    this.config = config;
    this.keysPressed = {};
    this.thrust = 0;
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
    let strafe = 0;
    let pitch = 0;
    let roll = 0;

    if (this.keysPressed[this.config.keys.pitchUp])
      pitch += 1;
    if (this.keysPressed[this.config.keys.pitchDown])
      pitch -= 1;

    if (this.keysPressed[this.config.keys.rollRight])
      roll += 1;
    if (this.keysPressed[this.config.keys.rollLeft])
      roll -= 1;

    if (this.keysPressed[this.config.keys.strafeLeft])
      strafe += 1;
    if (this.keysPressed[this.config.keys.strafeRight])
      strafe -= 1;

    if (this.keysPressed[this.config.keys.thrustUp])
      this.thrust += this.config.thrustRate;
    if (this.keysPressed[this.config.keys.thrustDown])
      this.thrust -= this.config.thrustRate;
    if (!this.keysPressed[this.config.keys.thrustDown] && !this.keysPressed[this.config.keys.thrustUp]) {
      if (Math.abs(this.thrust) < this.config.thrustRate)
        this.thrust = 0;
      if (this.thrust < 0)
        this.thrust += this.config.thrustRate * 0.5;
      else if (this.thrust > 0)
        this.thrust -= this.config.thrustRate * 0.5;
    }

    if (this.thrust < this.config.thrustClamp.min)
      this.thrust = this.config.thrustClamp.min;
    else if (this.thrust > this.config.thrustClamp.max)
      this.thrust = this.config.thrustClamp.max;

    this.player.translateZ(this.thrust * deltaT);
    this.player.translateX(strafe * this.config.strafeSpeed * deltaT);
    this.player.rotateX(pitch * this.config.pitchSpeed * deltaT);
    this.player.rotateZ(roll * this.config.rollSpeed * deltaT);
  }
}