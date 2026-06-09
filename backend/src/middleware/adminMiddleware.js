const jwt = require("jsonwebtoken")
const redisClint = require("../config/redis");
const User = require("../models/userSchema");

const adminMiddleware = async (req,res,next) => {

    try{
        const {token} = req.cookies;

        if(!token)
            throw new Error("Token is not present ");

        const payload = jwt.verify(token,process.env.JWT_KEY);

        const {_id} = payload;

         if(!_id)
            throw new Error("Id is not present ");

        const result = await User.findById(_id);

        if(payload.role!="admin")
            throw new Error("Invalid token  ");
       
         if(!result)
            throw new Error("User Doesn't Exist ");


        const Isblocked = await redisClint.exists(`token:${token}`);

         if(Isblocked)
            throw new Error("Invalid token");

         req.result = result;


         next();

    }
    catch(err){
         res.send("Error "+err.message);
    }
}


module.exports = adminMiddleware;