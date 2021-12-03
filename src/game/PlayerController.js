import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/objloader";

const missileFiles = {
  obj: require("../assets/Missile/Missile.obj")
};
let originalMissile;
new OBJLoader().load(missileFiles.obj, (obj) => {
  obj.traverse((child) => {
    if (child.isMesh) {
      child.rotateX(90*3.14159/180);
      child.material.color = new THREE.Color(0x303030);
    }
  });
  let light = new THREE.PointLight(0xff8000, 0.7, 1, 1);
  light.translateZ(-1);
  obj.add(light);
  originalMissile = obj;
});

export class PlayerController {
  constructor(config, player, scene) {
    this.player = player;
    this.config = config;
    this.keysPressed = {};
    this.firing = false;
    this.missile = null;
    this.direction = null;
    this.scene = scene;
    this.timer = 0;
    let totalRotation = 0;
    this.init();
  }

  fireMissile(direction){
    if (this.firing) return;
    this.firing = true;
    this.direction = direction;
    this.initMissile();
  }

  moveMissile(deltaT){
    if (this.direction == null) return;
    this.direction.normalize();
    const missileSpeed = 30;
    //console.log(this.missile);
    this.missile.translateZ(this.direction.z * missileSpeed * deltaT);
    this.missile.translateY(this.direction.y * missileSpeed * deltaT);
    this.missile.translateX(this.direction.x * missileSpeed * deltaT);
    //this.missile.rotateY(this.config.horRotSpeed * 1 * deltaT);
  }

  initMissile() {
    this.missile = originalMissile.clone();
    // console.log("here");
    // console.log(this.missile);
    this.missile.position.set(this.player.position.x, this.player.position.y-2, this.player.position.z) ;
    this.missile.setRotationFromQuaternion(this.player.quaternion);
    //this.missile.setRotationFromEuler(new THREE.Euler(90*3.14159/180, 0, 0));
    this.scene.add(this.missile);
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
    if (this.keysPressed[this.config.keys.fire]){
      let direction = new THREE.Vector3(0, 0, 1);
      //console.log(this.firing);
      this.fireMissile(direction);
    }    
    movement.normalize();
    this.player.translateZ(movement.z * this.config.horMovSpeed * deltaT);
    this.player.translateY(movement.y * this.config.verMovSpeed * deltaT);
    this.player.rotateY(this.config.horRotSpeed * rotationY * deltaT);
    this.totalRotation += this.config.horRotSpeed * rotationY * deltaT;
    if (this.timer >= 10){
      this.firing = false
      this.missile.removeFromParent();
      this.timer = 0;
    }
    if (this.firing) {
      this.timer += deltaT;
      this.moveMissile(deltaT);
    }
  }
}