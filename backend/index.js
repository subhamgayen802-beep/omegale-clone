require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const main = require("./src/config/monngodb");
const redisClient = require("./src/config/redis");
const rateLimiter = require("./src/middleware/rateLimiter");
const socketMiddleware = require("./src/middleware/socketMiddleware");
const socketHandler = require("./src/connection/socket");
const userRoutes =require("./src/route/userRoutes");
const adminRoutes = require("./src/route/adminRoute")
require("node:dns/promises").setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

app.use(cors({
  origin:
    process.env.FRONTEND_URL ||
    "http://localhost:5173",

  credentials: true
}));

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

app.use(cookieParser());

app.use(rateLimiter);

app.use("/api",userRoutes);

app.use("/api/admin",adminRoutes)

app.get("/", (req, res) => {
  res.send("Server running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",

    credentials: true
  },

  transports: ["polling","websocket"]
});

io.use(socketMiddleware);

socketHandler(io);

const PORT = process.env.PORT || 5000;

const initializeConnection = async () => {

  try {

    await Promise.all([
      main(),
      redisClient.connect()
    ]);

    console.log("Database connected");

    server.listen(PORT, () => {

      console.log(
        `Server running on ${PORT}`
      );

    });

  } catch (err) {

    console.error(err);

  }

};

initializeConnection();