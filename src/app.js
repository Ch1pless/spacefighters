import { io } from "socket.io-client";
import testFunc from "./game/test.js";
import * as twgl from "twgl-base.js";
import { Matrix4 } from "@math.gl/core";
import Stars from "./space/space.js";

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
    frameCount++;
    // restrain frameCount from overflowing
    if (frameCount >= 10000)
      frameCount = 0;
    requestAnimationFrame(App.draw);
  }
};

App.init();
IO.init();
App.draw();