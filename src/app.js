import { io } from "socket.io-client";
import * as twgl from "twgl-base.js";
import { Matrix4, Vector3, toRadians } from "@math.gl/core";
import Stars from "./space/space.js";
import test from "./game/test.js";

const IO = {
  init: () => {
    IO.socket = io();
    IO.bindEvents();
  },

  bindEvents: () => {
    IO.socket.on('connect', IO.onConnect);
    IO.socket.on('error', IO.onError);
  },

  onConnect: () => {
    App.clientID = IO.socket.sessionid;
    console.log('Connected to Socket Server Succesfully');
  },

  onError: (data) => {
    alert(data.message);
  }
};

let frameCount = 0;

const App = {
  // Game ID for the Socket.IO Room
  gameId: 0,
  // Role of the Client: Player or Host
  role: '',
  // Client ID, unique ID for communication with Socket.IO
  clientId: null,

  init: () => {
    console.log('Application started');
    App.gl = twgl.getContext(document.getElementById("game"));
    App.stars = new Stars(App.gl, 10000, 10000);
    App.box = new test(App.gl, 2);
    App.box.position = new Vector3(5., -3., -15.);

    document.addEventListener('keydown', event => {
      if (event.key == 'ArrowUp') {
        App.box.rotation.rotateAxis(toRadians(-0.5), new Vector3(1, 0, 0));
      } else if (event.key == 'ArrowDown') {
        App.box.rotation.rotateAxis(toRadians(0.5), new Vector3(1, 0, 0));
      } else if (event.key == 'ArrowLeft') {
        App.box.rotation.rotateAxis(toRadians(-0.5), new Vector3(0, 1, 0));
      } else if (event.key == 'ArrowRight') {
        App.box.rotation.rotateAxis(toRadians(0.5), new Vector3(0, 1, 0));
      }
    });
  },

  resizeGLToScreenSize() {
    let width = App.gl.canvas.clientWidth;
    let height = App.gl.canvas.clientHeight;
    if (App.gl.canvas.width != width ||
        App.gl.canvas.height != height) {
          App.gl.canvas.width = width;
          App.gl.canvas.height = height;
        }
  },

  draw: () => {
    App.resizeGLToScreenSize();
    App.stars.renderStars(frameCount);
    App.box.lookAt(new Vector3(0, 1, 0).transformAsPoint(App.stars.rotation));
    App.box.render();
    frameCount++;
    requestAnimationFrame(App.draw);
  }
};

const Game = {

  init: () => {

  },

  physics: () => {

  },

  input_events: () => {

  },

  game_logic: () => {

  },

  scene_rendering: () => {

  },

  gui_rendering: () => {

  },

  decomissioning: () => {

  }
}

App.init();
IO.init();
App.draw();