import { io } from "socket.io-client";
import * as twgl from "twgl-base.js";
import * as THREE from "three";
import "regenerator-runtime/runtime.js";
import { OBJLoader } from "three/examples/jsm/loaders/objloader";
import { MTLLoader } from "three/examples/jsm/loaders/mtlloader";
import TWGLRenderer from "./engine/renderers/TWGLRenderer";
import { PlayerController } from "./game/PlayerController";
import { Skybox } from "./space/Skybox";


const IMGLoader = new THREE.ImageLoader();

const terrainFiles = {
  obj: require("./assets/Terrain/Icelandic mountain.obj"), 
  mtl: require("./assets/Terrain/Icelandic mountain.mtl"),
  texture: require("./assets/Terrain/ColorFxLowRes.png")
};
const shipFiles = {
  obj: require("./assets/StarSparrow_OBJ/StarSparrow01.obj"), 
  texture: require("./assets/StarSparrow_OBJ/Textures/StarSparrow_Blue.png")
};
const skyboxFiles = {
  textures: [
    require("./assets/Skyboxes/Skybox01/right.png"), // pos-x
    require("./assets/Skyboxes/Skybox01/left.png"), // neg-x
    require("./assets/Skyboxes/Skybox01/top.png"), // pos-y
    require("./assets/Skyboxes/Skybox01/bottom.png"), // neg-y
    require("./assets/Skyboxes/Skybox01/front.png"), // pos-z
    require("./assets/Skyboxes/Skybox01/back.png") // neg-z
  ]
};

const tableFiles = {
  obj: require("./assets/ModernGlassTable.obj"),
};

const config = {
  space: {
    starAmount: 1000,
    radiusFromCenter: 100_000,
  },
  player: {
    horMovSpeed: 40,
    verMovSpeed: 20,
    horRotSpeed: 20*3.14159/180,
    keys: {
      forward: "w",
      backward: "s",
      left: "a",
      right: "d",
      up: " ",
      down: "c"
    }
  }
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
    this.gameCanvas = document.querySelector("#game");
    this.loadScreen = document.querySelector("#load");
    this.start = undefined;
    this.previousTimeStamp = undefined;
    this.displayingReadyScene = false;
    this.displayingGameScene = false;
  }

  toggleLoadingScreen() {
    this.loadScreen.classList.toggle("hide");
  }

  async initSkybox() {
    this.skybox = new Skybox()
    await this.skybox.init(await Promise.all([
      IMGLoader.loadAsync(skyboxFiles.textures[0]), // pos-x
      IMGLoader.loadAsync(skyboxFiles.textures[1]), // neg-x
      IMGLoader.loadAsync(skyboxFiles.textures[2]), // pos-y
      IMGLoader.loadAsync(skyboxFiles.textures[3]), // neg-y
      IMGLoader.loadAsync(skyboxFiles.textures[4]), // pos-z
      IMGLoader.loadAsync(skyboxFiles.textures[5]), // neg-z
    ]), this.gl);
  }

  async initTable() {
    this.table = await new OBJLoader().loadAsync(tableFiles.obj);
  }

  async startReadyScene() {
    this.toggleLoadingScreen();
    this.displayingReadyScene = true;
    this.scene = new THREE.Scene();
    this.scene.background = 0x000000;
    this.camera = new THREE.PerspectiveCamera(45, this.gl.canvas.clientWidth / this.gl.canvas.clientHeight, 0.1, 1000);

    await Promise.all([this.initTable(), this.initShip()]);
    this.table.traverse(object => {
      if (object.isMesh) {
        console.log(object.material.color);
        object.material.color = new THREE.Color(0x303030);
      }
    })
    this.scene.add(this.ship);
    this.scene.add(this.table);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.1));
    this.pointLight = new THREE.PointLight(0xffffff, 1, 1, 1);
    this.scene.add(this.pointLight);
    this.pointLight.position.set(-3, 3, 4);

    this.ship.position.set(-5, 1, 10);
    this.ship.setRotationFromEuler(new THREE.Euler(0, 180*3.14159/180, 0));

    this.table.position.set(-5, -12, 10);

    this.table.scale.multiplyScalar(1.5);
    this.ship.scale.multiplyScalar(0.70);
    
    this.shipOffset = this.ship.position.clone();
    this.shipOffset.x -= 10;

    this.camera.position.set(0, 6, -10);
    this.camera.lookAt(this.shipOffset);
    requestAnimationFrame(this.drawReadyScene.bind(this));
    this.toggleLoadingScreen();
  }

  drawReadyScene(timestamp) {
    if (this.start === undefined)
      this.start = timestamp;
    
    if (twgl.resizeCanvasToDisplaySize(this.gl.canvas))
      this.camera.updateProjectionMatrix();

    if (this.previousTimeStamp !== undefined && timestamp != this.previousTimeStamp) {
      const deltaT = (timestamp - this.previousTimeStamp) / 1000;
      this.ship.rotateY(5*3.14159/180 * deltaT);
    }
    
    this.twgl_renderer.render(this.scene, this.camera, this.gl);

    this.previousTimeStamp = timestamp;

    if (this.displayingReadyScene)
      requestAnimationFrame(this.drawReadyScene.bind(this));
  }

  async initShip() {
    this.ship = await new OBJLoader().loadAsync(shipFiles.obj);
    console.log(this.ship);
    this.ship_image = await IMGLoader.loadAsync(shipFiles.texture);
    this.ship.traverse((object) => {
      if (object.isMesh) {
        object.material.userData.textureMap = twgl.createTexture(this.gl, {src: this.ship_image, flipY: true}); 
      }
    });
  }

  async initPlayer() {
    await this.initShip();

    this.shipController = new PlayerController(config.player, this.ship);

    this.ship.add(this.camera);
    
    this.camera.translateZ(-20);
    this.camera.translateY(6);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.scene.add(this.ship);
  }

  async initTerrain() {
    this.terrain = await new OBJLoader().setMaterials(await new MTLLoader().loadAsync(terrainFiles.mtl)).loadAsync(terrainFiles.obj);
    this.terrain_image = await IMGLoader.loadAsync(terrainFiles.texture);

    this.terrain.traverse((object) => {
      if (object.type == "Mesh")
        object.material.userData.textureMap = twgl.createTexture(this.gl, {src: this.terrain_image, flipY: true});
    });

    this.terrain.translateZ(300);
    this.terrain.translateY(-50);
    this.terrain.scale.set(10, 10, 10);

    this.scene.add(this.terrain);
  }

  async init() {
    this.gl = twgl.getContext(this.gameCanvas);
    this.twgl_renderer = new TWGLRenderer(this.gl);
  }

  async startGameScene() {
    this.toggleLoadingScreen();
    this.displayingGameScene = true;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.gl.canvas.clientWidth / this.gl.canvas.clientHeight, 0.1, 1000);

    this.scene.background = 0x808080;

    await Promise.all([this.initPlayer(), this.initTerrain(), this.initSkybox()]);
    
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    this.sun = new THREE.DirectionalLight(0xfcb0f1, 0.5);
    this.scene.add(this.sun);
    this.sun.position.set(1, 1, 2);

    requestAnimationFrame(this.drawGameScene.bind(this));
    this.toggleLoadingScreen();
  }

  drawGameScene(timestamp) {
    if (this.start === undefined)
      this.start = timestamp;
    
    if (twgl.resizeCanvasToDisplaySize(this.gl.canvas))
      this.camera.updateProjectionMatrix();
    if (this.previousTimeStamp !== undefined && timestamp != this.previousTimeStamp) {
      const deltaT = (timestamp - this.previousTimeStamp) / 1000;
      this.shipController.update(deltaT);
    }
    

    this.twgl_renderer.render(this.scene, this.camera, this.gl);
    if (this.skybox) {
      this.skybox.render(this.camera, this.gl);
    }

    this.previousTimeStamp = timestamp;

    if (this.displayingGameScene)
      requestAnimationFrame(this.drawGameScene.bind(this));
  }
}

const Application = new App();
const Server = new IO(Application);

(
  async function () {
    await Application.init();
    await Application.startGameScene();
  }
)();