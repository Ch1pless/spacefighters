import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/objloader";

const missileFiles = {
  obj: require("../assets/Missile/Missile.obj")
};


export class PlayerController {
  constructor(config, player) {
    this.player = player;
    this.config = config;
    this.keysPressed = {};
    this.thrust = 0;
    
    this.missileFired = false;
    this.missile = null;
    this.missileTimer = 0;
    this.missileLifespan = 10;

    this.originalMissile = null;

    new OBJLoader().load(missileFiles.obj, (obj) => {
      obj.traverse((child) => {
        if (child.isMesh) {
          child.rotateX(90*3.14159/180);
          child.material.color = new THREE.Color(0x303030);
          child.geometry.computeBoundingSphere();
        }
      });
      this.originalMissile = obj;
    });

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

  setScene(scene) {
    this.scene = scene;
  }

  setEnemy(enemy) {
    this.enemy = enemy;
  }

  getMissileDestroyed() {
    if (this.missileDestroyed) {
      this.missileDestroyed = false;
      return true;
    }
    return false;
  }

  getMissileCreated() {
    if (this.missileCreated) {
      this.missileCreated = false;
      return true;
    }
    return false;
  }

  fireMissile() {
    if (this.missileFired) return;
    this.missileFired = true;
    this.missileCreated = true;
    this.createMissile();
  }

  createMissile() {
    this.missile = this.originalMissile.clone();
    this.missile.position.copy(this.player.position);
    this.missile.position.y -= 2;
    this.missile.setRotationFromQuaternion(this.player.quaternion);

    this.scene.add(this.missile);
  }

  moveMissile(deltaT) {
    let mTarget = new THREE.Vector3();
    let mPosition = new THREE.Vector3();
    let mDirection = new THREE.Vector3();

    this.enemy.getWorldPosition(mTarget);
    this.missile.getWorldPosition(mPosition);
    this.missile.getWorldDirection(mDirection);

    let tDirection = new THREE.Vector3().subVectors(mTarget, mPosition).normalize();

    let cross1 = new THREE.Vector3().crossVectors(mDirection, tDirection).normalize();
    while (cross1.x == 0 && cross1.y == 0 && cross1.z == 0) {
      cross1.crossVectors(mDirection, new THREE.Vector3().randomDirection()).normalize();
    }

    // Plane Projection
    // let cross2 = new THREE.Vector3().crossVectors(mDirection, cross1);

    let angleRotation = mDirection.angleTo(tDirection);

    this.missile.rotateOnWorldAxis(cross1, Math.min(angleRotation, 40*Math.PI/180) * deltaT);
    this.missile.translateZ(40 * deltaT);
  }

  destroyMissile() {
    this.missile.removeFromParent();
    this.missile = null;
    this.missileFired = false;
    this.missileTimer = 0;
    this.missileDestroyed = true;
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

    if (this.keysPressed[this.config.keys.fire]) {
      this.fireMissile();
    }

    if (this.missileFired) {
      this.moveMissile(deltaT);
      this.missileTimer += deltaT;
    }

    if (this.missileTimer > this.missileLifespan)
      this.destroyMissile();

  }
}