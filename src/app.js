import { io } from "socket.io-client";
import * as twgl from "twgl-base.js";
import * as THREE from "three";
import "regenerator-runtime/runtime.js";
import { OBJLoader } from "three/examples/jsm/loaders/objloader";
import { MTLLoader } from "three/examples/jsm/loaders/mtlloader";
import TWGLRenderer from "./engine/renderers/TWGLRenderer";

const terrainFiles = {
  obj: require("./assets/Terrain/Icelandic mountain.obj"), 
  mtl: require("./assets/Terrain/Icelandic mountain.mtl"),
  texture: require("./assets/Terrain/ColorFxLowRes.png")
};
const shipFiles = {
  obj: require("./assets/StarSparrow_OBJ/StarSparrow01.obj"), 
  texture: require("./assets/StarSparrow_OBJ/Textures/StarSparrow_Blue.png")
};


class IO {
  constructor(app) {
    this.app = app;
    this.socket = io();
    this.bindEvents();
  }

  bindEvents() {
    this.socket.on('connect', this.onConnect.bind(this));
    this.socket.on('error', this.onError);
  }

  onConnect() {
    this.app.clientId = this.socket.id;
  }

  onError(data) {
    alert(data.message);
  }
}

class App {
  constructor() {
    this.gameId = 0;
    this.role = '';
    this.clientId = null;
    this.gameCanvas = document.getElementById("game");
  }

  async init() {
    this.gl = twgl.getContext(this.gameCanvas);
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.gl.canvas.clientWidth / this.gl.canvas.clientHeight, 0.1, 1000);

    this.scene.background = 0x808080;

    this.twgl_renderer = new TWGLRenderer(this.gl);
    
    this.ship = await new OBJLoader().loadAsync(shipFiles.obj);
    this.ship_image = await new THREE.ImageLoader().loadAsync(shipFiles.texture);

    this.ship.traverse((object) => {
      if (object.type == "Mesh")
        object.material.userData.textureMap = twgl.createTexture(this.gl, {src: this.ship_image, flipY: true});
    });

    this.terrain = await new OBJLoader().setMaterials(await new MTLLoader().loadAsync(terrainFiles.mtl)).loadAsync(terrainFiles.obj);
    this.terrain_image = await new THREE.ImageLoader().loadAsync(terrainFiles.texture);

    this.terrain.traverse((object) => {
      if (object.type == "Mesh")
        object.material.userData.textureMap = twgl.createTexture(this.gl, {src: this.terrain_image, flipY: true});
    });

    this.terrain.translateZ(300);
    this.terrain.translateY(-50);
    this.terrain.scale.set(10, 10, 10);

    this.ship.add(this.camera);
    
    this.camera.translateZ(-18);
    this.camera.translateY(10);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.scene.add(this.ship);
    this.scene.add(this.terrain);
    // this.scene.add(new THREE.DirectionalLight(0xffffff, 0.5));
  }

  draw() {
    if (twgl.resizeCanvasToDisplaySize(this.gl.canvas))
      this.camera.updateProjectionMatrix();

    this.twgl_renderer.render(this.scene, this.camera, this.gl);

    requestAnimationFrame(this.draw.bind(this));
  }
}

const Application = new App();
const Server = new IO(Application);

(
  async function () {
    await Application.init();
    Application.draw();
  }
)();

// Shitty player controller just to test transforming the model and such
document.addEventListener("keypress", (event) => {
  if (event.key == "w")
    Application.ship.translateZ(1);
  else if (event.key == "s")
    Application.ship.translateZ(-1);
  else if (event.key == "c")
    Application.ship.translateY(-1);
  else if (event.key == " ")
    Application.ship.translateY(1);
  else if (event.key == "a")
    Application.ship.rotateY(1*3.14159/180);
  else if (event.key == "d")
    Application.ship.rotateY(-1*3.14159/180);
})