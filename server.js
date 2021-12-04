
const express = require("express");
const createServer = require("http").createServer;
const Server = require("socket.io").Server;
const GameState = require("./GameState");

// Server Configuration and Deployment
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";
const port = isProduction ? 8080 : process.env.PORT;

const io_options = {
  origin: isProduction ? process.env.domain : `http://localhost:${port}`,
  methods: ["GET", "POST"]
};



const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, io_options);

if (!isProduction) {
  const webpack = require("webpack");
  const webpack_MW = require("webpack-dev-middleware");
  const webpack_HMW = require("webpack-hot-middleware");
  const webpack_config = require("./webpack.config.js");
  const compiler = webpack(webpack_config);

  app.use( webpack_MW(compiler, {
      publicPath: webpack_config.output.publicPath,
    }) 
  );
    
  app.use(webpack_HMW(compiler));
}
  
app.use(express.static("./public"));

app.get("/", (req, res) => { res.sendFile('index.html'); });

httpServer.listen(port);

console.log(`Server listening on port: ${port}`);

// Socket.io management
io.on("connection", client => { 
  console.log(`User ${client.id} connected at ${client.handshake.address}.`);

  client.on("disconnecting", () => {
    for (const room of client.rooms) {
      if (rooms[room] && rooms[room].stateInterval)
        clearInterval(rooms[room].stateInterval);
    }
  })

  client.on("disconnect", () => { 
    console.log(`User ${client.id} disconnected.`)
  });

  client.on("createRoom", (color) => {
    let newRoom = createRoom();
    client.join(newRoom);
    io.to(client.id).emit("room", newRoom);
    console.log(`Client has created room: ${newRoom}.`);
    rooms[newRoom] = new GameState();
    rooms[newRoom].addPlayer(client.id, color);
  });

  client.on("joinRoom", (color, room) => {
    if (rooms[room]) {
      console.log(`Client has joined room: ${room}`);
      rooms[room].addPlayer(client.id, color);
      client.join(room);
      io.to(room).emit("room", room);
      io.to(room).emit("startGame", rooms[room]);
      rooms[room].stateInterval = setInterval(() => { io.to(room).emit("updateGameState", rooms[room]); }, 1000 / 60);
    } else {
      console.log(`Room ${room} does not exist`);
    }
  });

  client.on("leaveRoom", (room) => {
    if (rooms[room]) {
      delete rooms[room];
    }
    client.leave(room);
    console.log(`Client ${client.id} left the room ${room}`);
  });

  client.on("updateState", (matrix, room) => {
    rooms[room].players[client.id].matrix = matrix;
  });

  client.on("updateMissile", (matrix, room) => {
    rooms[room].updateMissile(client.id, matrix);
  });

  client.on("destroyMissile", (room) => {
    rooms[room].removeMissile(client.id);
  });

  client.on("lose", (collidedWithEnemy, enemyId) => {
    if (collidedWithEnemy) {
      io.to(enemyId).emit("lose");
    } else {
      io.to(enemyId).emit("win");
    }
  })
});

const rooms = {};

function randomRoom() {
  let room = "";
  for (let i = 0; i < 4; ++i) {
    room += Math.floor(Math.random()*10).toString();
  }
  return room;
}

function createRoom() {
  let newRoom = randomRoom();
  while (rooms[newRoom]) newRoom = randomRoom();
  return newRoom;
}




