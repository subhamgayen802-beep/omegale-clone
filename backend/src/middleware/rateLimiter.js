const redisClient = require("../config/redis");
const crypto = require("crypto")

const windowSize = 60; 
const maxRequest = 60;   

const rateLimiter = async (req, res, next) => {
  try {
    const key = `rate:${req.ip}`;
    const current_time = Date.now() / 1000;
    const window_time = current_time - windowSize;

    await redisClient.zRemRangeByScore(key, 0, window_time);

    const numberOfRequest = await redisClient.zCard(key);

    if (numberOfRequest >= maxRequest) {
      return res.status(429).json({
        message: "Too many requests!"
      });
    }

    const requestId = crypto.randomUUID();
    await redisClient.zAdd(key, [{
      score: current_time,
      value: `${current_time}-${requestId}`
    }]);

    await redisClient.expire(key, windowSize);
    next();

  } catch (error) {
    console.error("Rate limiter error:", error);
    next();
  }
};

module.exports = rateLimiter;

