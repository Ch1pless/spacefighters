const express = require("express");
const createServer = require("http").createServer;
const Server = require("socket.io").Server;
const webpack = require("webpack");
const webpack_MW = require("webpack-dev-middleware");
const webpack_HMW = require("webpack-hot-middleware");

// Server Configuration and Deployment
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";
const port = isProduction ? 8080 : process.env.PORT;

const io_options = {
  origin: isProduction ? process.env.domain : `http://localhost:${port}`,
  methods: ["GET", "POST"]
};

const webpack_config = require("./webpack.config.js");
const compiler = webpack(webpack_config);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, io_options);


app.use( webpack_MW(compiler, {
    publicPath: webpack_config.output.publicPath,
  }) 
);
  
app.use(webpack_HMW(compiler));
  
app.use(express.static("./public"));

app.get("/", (req, res) => { res.sendFile('index.html'); });


httpServer.listen(port);

console.log(`Server listening on port: ${port}`);

// Socket.io management
io.on("connection", client => { console.log(`User ${client.id} connected at ${client.handshake.address}.`); });