
const jwt = require("jsonwebtoken")
const redisClint = require("../config/redis");
const User = require("../models/userSchema");

const userMiddleware = async (req,res,next) => {

    try{
        const {token} = req.cookies;

        if(!token)
            throw new Error("Token is not present ");

        const payload = jwt.verify(token,process.env.JWT_KEY);

        const {_id} = payload;

         if(!_id)
            throw new Error("Id is not present ");

        const result = await User.findById(_id);
       
         if(!result)
            throw new Error("User Doesn't Exist ");

         if (result.banned)
             throw new Error("Account has been banned");


        const Isblocked = await redisClint.exists(`token:${token}`);

         if(Isblocked)
            throw new Error("Invalid token");

         req.result = result;


         next();

    }
    catch(err){
          res.status(401).json({ message: err.message });
    }
}


module.exports = userMiddleware;