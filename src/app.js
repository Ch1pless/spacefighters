import { io } from "socket.io-client";
import * as twgl from "twgl-base.js";
import * as THREE from "three";
import "regenerator-runtime/runtime.js";
import { OBJLoader } from "three/examples/jsm/loaders/objloader";
import TWGLRenderer from "./engine/renderers/TWGLRenderer";
import { PlayerController } from "./game/PlayerController";
import { ShipTextureSelector } from "./game/ShipTextureSelector";
import { Skybox } from "./space/Skybox";


const IMGLoader = new THREE.ImageLoader();
const ModelLoader = new OBJLoader();

const shipFiles = {
  obj: require("./assets/StarSparrow_OBJ/StarSparrow01.obj")
};

const skyboxFiles = {
  textures: [
    require("./assets/Skyboxes/Skybox01/right.png"), // pos-x
    require("./assets/Skyboxes/Skybox01/left.png"), // neg-x
    require("./assets/Skyboxes/Skybox01/bottom.png"), // pos-y
    require("./assets/Skyboxes/Skybox01/top.png"), // neg-y
    require("./assets/Skyboxes/Skybox01/front.png"), // pos-z
    require("./assets/Skyboxes/Skybox01/back.png") // neg-z
  ]
};

const asteroidFiles = [
  {
    obj: require("./assets/Asteroids/Asteroid_1/ASTEROID_1_LOW_MODEL_.obj"),
    texture: require("./assets/Asteroids/Asteroid_1/ASTEROID_LOW_POLY_1_COLOR_.png")
  }, 
  {
    obj: require("./assets/Asteroids/Asteroid_2/ASTEROID_2_LOW_MODEL_.obj"),
    texture: require("./assets/Asteroids/Asteroid_2/ASTEROID_LOW_POLY_2_COLOR_.png")
  }, 
  {
    obj: require("./assets/Asteroids/Asteroid_3/ASTEROID_3_LOW_MODEL_.obj"),
    texture: require("./assets/Asteroids/Asteroid_3/ASTEROID_LOW_POLY_3_COLOR_.png")
  }, 
  {
    obj: require("./assets/Asteroids/Asteroid_4/ASTEROID_4_LOW_MODEL_.obj"),
    texture: require("./assets/Asteroids/Asteroid_4/ASTEROID_LOW_POLY_4_COLOR_.png")
  }
];

const tableFiles = {
  obj: require("./assets/ModernGlassTable.obj"),
};

const config = {
  space: {
    starAmount: 1000,
    radiusFromCenter: 100_000,
  },
  player: {
    thrustClamp: {min: -3, max: 30},
    thrustRate: 0.3,
    strafeSpeed: 10,
    pitchSpeed: 45*Math.PI/180,
    rollSpeed: 60*Math.PI/180,
    keys: {
      pitchUp: "w",
      pitchDown: "s",
      strafeLeft: "q",
      strafeRight: "e",
      rollLeft: "a",
      rollRight: "d",
      thrustUp: " ",
      thrustDown: "c"
    }
  },
  asteroidField: {
    fieldRadius: 200,
    asteroidAmount: 10
  }
};


class IO {
  constructor(app) {
    this.app = app;
    this.socket = io();
    this.app.socket = this.socket;
    this.bindEvents();
  }

  bindEvents() {
    this.socket.on("connect", this.onConnect.bind(this));
    this.socket.on("error", this.onError);
    this.socket.on("startGame", (gameState) => { this.onGameStart(gameState); });
    this.socket.on("updateGameState", (gameState) => { this.onUpdateGameState(gameState); });
    this.socket.on("room", (room) => { this.app.room = room; document.querySelector("#ui-text").innerHTML = "Room ID: " + room; })
  }

  async onGameStart(gameState) {
    this.currentGameState = gameState;
    console.log(gameState.players);
    for (const player in gameState.players) {
      if (player == this.app.clientId) {
        await this.app.initPlayer(gameState.players[player]);
      } else {
        this.app.enemyId = player;
        await this.app.initEnemy(gameState.players[player]);
      }
    }
    this.app.swapScreens();
  }

  onUpdateGameState(gameState) {
    let enemyState = gameState.players[this.app.enemyId];
    if (this.app.player && this.app.enemy) {
      new THREE.Matrix4().fromArray(enemyState.matrix.elements).decompose(this.app.enemy.position, this.app.enemy.quaternion, this.app.enemy.scale);
    }
    this.currentGameState = gameState;
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
    this.role = '';
    this.clientId = null;
    this.socket = null;
    this.gameCanvas = document.querySelector("#game");
    this.loadScreen = document.querySelector("#load");
    
    this.start = undefined;
    this.previousTimeStamp = undefined;
    this.displayingReadyScene = false;
    this.displayingGameScene = false;
    this.shipTextureSelector = new ShipTextureSelector();
  }

  async init() {
    this.gl = twgl.getContext(this.gameCanvas);
    this.twgl_renderer = new TWGLRenderer(this.gl);
  }

  async initShip(data) {
    if (data === undefined || data === null) {
      data = {};
      data.color = "blue";
      data.matrix = new THREE.Matrix4();
    }

    await this.shipTextureSelector.init();
    const ship = await ModelLoader.loadAsync(shipFiles.obj);
    ship.traverse((object) => {
      if (object.isMesh) {
        object.material.userData.textureMap = twgl.createTexture(this.gl, {src: this.shipTextureSelector.getTextureFromColor(data.color), flipY: true}); 
        object.geometry.computeBoundingSphere();
      }
    });

    let light = new THREE.PointLight(0xe69138, 5, 1, 1);
    light.position.set(0, -0.2, -3);
    ship.add(light);

    new THREE.Matrix4().fromArray(data.matrix.elements).decompose(ship.position, ship.quaternion, ship.scale);

    return ship;
  }

  async initPlayer(playerData) {
    this.player = await this.initShip(playerData);

    this.shipController = new PlayerController(config.player, this.player);
  }

  setPlayerCamera() {
    this.camera = new THREE.PerspectiveCamera(45, this.gl.canvas.clientWidth/this.gl.canvas.clientHeight, 0.1, 1000);

    this.player.add(this.camera);
    this.camera.translateZ(-20);
    this.camera.translateY(6);
    this.camera.lookAt(this.player.position);
  }

  async initEnemy(enemyData) {
    this.enemy = await this.initShip(enemyData);

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
    this.table.traverse(object => {
      if (object.isMesh) object.material.color = new THREE.Color(0x081530);
    });
  }

  async initAsteroidField() {
    this.asteroidField = new THREE.Group();

    const asteroid_objs = await Promise.all([
      ModelLoader.loadAsync(asteroidFiles[0].obj),
      ModelLoader.loadAsync(asteroidFiles[1].obj),
      ModelLoader.loadAsync(asteroidFiles[2].obj),
      ModelLoader.loadAsync(asteroidFiles[3].obj)
    ]);

    const asteroid_imgs = await Promise.all([
      IMGLoader.loadAsync(asteroidFiles[0].texture),
      IMGLoader.loadAsync(asteroidFiles[1].texture),
      IMGLoader.loadAsync(asteroidFiles[2].texture),
      IMGLoader.loadAsync(asteroidFiles[3].texture)
    ]);

    for (let i = 0; i < asteroid_objs.length; ++i) {
      asteroid_objs[i] = asteroid_objs[i].children[0]; // set objs to mesh
      asteroid_objs[i].material.userData.textureMap = twgl.createTexture(this.gl, {src: asteroid_imgs[i], flipY: true});
      asteroid_objs[i].matrixAutoUpdate = false;
    }

    const asteroidAmount = config.asteroidField.asteroidAmount;
    const fieldRadius = config.asteroidField.fieldRadius;

    for (let i = 0; i < asteroidAmount; ++i) {
      const asteroid = asteroid_objs[Math.floor(Math.random()*4)].clone();
      asteroid.scale.multiplyScalar(1 + Math.random()*4);
      asteroid.rotation.set(Math.random()*2*Math.PI, Math.random()*2*Math.PI, Math.random()*2*Math.PI);
      let pos = [];
      for (let j = 0; j < 3; ++j)
        pos.push(Math.floor(Math.random() * fieldRadius * 2 - fieldRadius));
      asteroid.position.set(pos[0], pos[1] / 5, pos[2]);
      asteroid.updateMatrix();
      asteroid.matrixAutoUpdate = false;
      asteroid.geometry.computeBoundingSphere();
      asteroid.geometry.boundingSphere.center.copy(asteroid.position);
      this.asteroidField.add(asteroid);
    }
    this.scene.add(this.asteroidField);
  }
  
  toggleLoadingScreen() {
    this.loadScreen.classList.toggle("hide");
  }

  toggleReadyUI() {
    this.ui.classList.toggle("hide");
  }
  
  async startReadyScene() {
    this.toggleLoadingScreen();
    this.displayingReadyScene = true;
    this.scene = new THREE.Scene();
    this.scene.background = 0x000000;
    this.camera = new THREE.PerspectiveCamera(45, this.gl.canvas.clientWidth / this.gl.canvas.clientHeight, 0.1, 1000);

    await this.initTable();
    this.ship = await this.initShip();

    this.scene.add(this.ship);
    this.scene.add(this.table);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.1));

    let pointLight = new THREE.PointLight(0xffffff, 1, 1, 1);
    pointLight.position.set(-3, 3, 4);
    this.scene.add(pointLight);

    this.ship.position.set(-5, 1, 10);
    this.ship.setRotationFromEuler(new THREE.Euler(0, 180*Math.PI/180, 0));

    this.table.position.set(-5, -12, 10);

    this.table.scale.multiplyScalar(1.5);
    this.ship.scale.multiplyScalar(0.70);
    
    let shipOffset = this.ship.position.clone();
    shipOffset.x -= 10;

    this.camera.position.set(0, 6, -10);
    this.camera.lookAt(shipOffset);

    this.ui = document.querySelector("#ui");
    this.createRoomBtn = document.querySelector("#create-room");
    this.joinRoomBtn = document.querySelector("#join-room");
    this.joinRoomId = document.querySelector("#join-room-id");
    
    this.createRoomBtn.addEventListener("click", this.createRoom.bind(this));
    this.joinRoomBtn.addEventListener("click", this.joinRoom.bind(this));
    
    requestAnimationFrame(this.drawReadyScene.bind(this));

    this.toggleReadyUI();
    this.toggleLoadingScreen();
  }

  drawReadyScene(timestamp) {
    if (!this.displayingReadyScene)
      return;
    
    if (this.start === undefined)
      this.start = timestamp;
    
    if (twgl.resizeCanvasToDisplaySize(this.gl.canvas))
      this.camera.updateProjectionMatrix();

    if (this.previousTimeStamp !== undefined && timestamp != this.previousTimeStamp) {
      const deltaT = (timestamp - this.previousTimeStamp) / 1000;
      this.ship.rotateY(5*Math.PI/180 * deltaT);
    }

    if (this.shipTextureSelector.getColorChanged()) {
      this.ship.traverse((object) => {
        if (object.isMesh) {
          object.material.userData.textureMap = twgl.createTexture(this.gl, {src: this.shipTextureSelector.currentTexture(), flipY: true}); 
        }
      });
    }
    
    this.twgl_renderer.render(this.scene, this.camera, this.gl);

    this.previousTimeStamp = timestamp;

    requestAnimationFrame(this.drawReadyScene.bind(this));
  }

  stopReadyScene() {
    this.toggleReadyUI();

    this.table.traverse(object => {
      if (object.isMesh) {
        object.geometry.dispose();
        object.material.dispose();
      }
    });

    delete this.ui;
    delete this.createRoomBtn;
    delete this.joinRoomBtn;
    delete this.joinRoomId;
    delete this.table;
    delete this.ship;
    delete this.scene;
    delete this.camera;

    

    this.displayingReadyScene = false;
  }

  async startGameScene() {
    this.toggleLoadingScreen();

    this.displayingGameScene = true;
    this.scene = new THREE.Scene();

    this.scene.background = 0x808080;

    await Promise.all([this.initSkybox(), this.initAsteroidField()]);
    
    this.sun = new THREE.DirectionalLight(0xfcb0f1, 1);
    this.sun.position.set(1, 1, 2);
    
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    this.scene.add(this.sun);

    this.setPlayerCamera();

    this.scene.add(this.player);
    this.scene.add(this.enemy);

    this.missiles = {};

    requestAnimationFrame(this.drawGameScene.bind(this));

    this.toggleLoadingScreen();
  }

  drawGameScene(timestamp) {
    if (!this.displayingGameScene)
      return;
    
    if (this.start === undefined)
      this.start = timestamp;
    
    if (twgl.resizeCanvasToDisplaySize(this.gl.canvas))
      this.camera.updateProjectionMatrix();

    if (this.previousTimeStamp !== undefined && timestamp != this.previousTimeStamp) {
      const deltaT = (timestamp - this.previousTimeStamp) / 1000;
      this.shipController.update(deltaT);
    }

    this.twgl_renderer.render(this.scene, this.camera, this.gl);

    if (this.skybox) this.skybox.render(this.camera, this.gl);

    this.previousTimeStamp = timestamp;

    this.detectPlayerCollision();

    this.socket.emit("updateState", this.player.matrix, this.room);
    
    requestAnimationFrame(this.drawGameScene.bind(this));
  }

  stopGameScene() {
    this.displayingGameScene = false;
  }



  updateBoundingSphere(object) {
    const newCenter = object.position;
    object.traverse((child) => {
      if (child.isMesh) {
        child.geometry.boundingSphere.set(
          newCenter,
          child.geometry.boundingSphere.radius
        );
      }
    });
  }

  detectPlayerCollision() {
    this.updateBoundingSphere(this.player);
    this.updateBoundingSphere(this.enemy);

    if (this.missiles[this.enemyId])
      this.updateBoundingSphere(this.missiles[this.enemyId]);

    let to_check = [];

    let playerMesh;
    this.player.traverse(object => {
      if (object.isMesh)
        playerMesh = object;
    })

    this.scene.traverse(object => {
      if (object != playerMesh && object.isMesh && object.geometry.boundingSphere !== null)
        to_check.push(object);
    });

    let playerBoundingSphere = null;
    this.player.traverse(child => {
      if (child.isMesh && child.geometry.boundingSphere !== null)
        playerBoundingSphere = child.geometry.boundingSphere;
    });

    for (const mesh of to_check) {
      if (playerBoundingSphere.intersectsSphere(mesh.geometry.boundingSphere)) {
        console.log(" Collision Detected with ");
        console.log(mesh.geometry.boundingSphere.center.toArray());
      }
    }
    

  }

  createRoom() {
    this.socket.emit("createRoom", this.shipTextureSelector.currentColor());
    this.createRoomBtn.classList.toggle("hide");
    this.joinRoomBtn.classList.toggle("hide");
    this.joinRoomId.classList.toggle("hide");
    document.querySelector("#color-changer").classList.toggle("hide");
  }

  joinRoom() {
    let roomId = this.joinRoomId.value;
    this.socket.emit("joinRoom", this.shipTextureSelector.currentColor(), roomId);
  }

  swapScreens() {
    this.stopReadyScene();
    this.startGameScene();
  }
}

const Application = new App();
const Server = new IO(Application);

(
  async function () {
    await Application.init();
    await Application.startReadyScene();
  }
)();

