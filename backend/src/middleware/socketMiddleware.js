const jwt = require("jsonwebtoken");
const redisClint = require("../config/redis");
const User = require("../models/userSchema");


const socketMiddleware = async (socket, next) => {
  try {

  
    const cookieHeader = socket.handshake.headers.cookie;
    // console.log(cookieHeader)
    
    if (!cookieHeader) {
      return next(new Error("Token not present"));
    }

  
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => c.split("="))
    );

    const token = cookies["token"];

    if (!token) {
      return next(new Error("Token not present"));
    }

    const payload = jwt.verify(token, process.env.JWT_KEY);
    const { _id } = payload;

    const result = await User.findById(_id);
    if (!result) return next(new Error("User does not exist"));

    const isBlocked = await redisClint.exists(`token:${token}`);
    if (isBlocked) return next(new Error("Blocked token"));

    socket.user = result;
    next();

  } catch (err) {
    next(new Error(err.message));
  }
};

module.exports = socketMiddleware;