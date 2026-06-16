const redisClient = require("../config/redis");
const User =  require("../models/userSchema")
const validate = require('../utils/validate');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');



const register = async (req,res)=>{
       

    try{
   
      
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
      req.body.role = 'user'
 
      const user = await User.create(req.body);

      const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
      const reply = {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role:user.role,
    }
    
      res.cookie("token", token, {
       httpOnly:true,
       sameSite:"none",
       secure:true,
     });

     res.status(201).json({
        user:reply,

        message:"Loggin Successfully"
    })
    }
    catch(err){
    
        res.status(400).json({ message: err.message });
    }
}


const login = async (req, res) => {
  

  try {
    
    const { emailId, password } = req.body;
   
    const user = await User.findOne({ emailId });

    if (!user) throw new Error("Invalid Credentials"); 

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid Credentials");

    const reply = {
      firstName: user.firstName,
      emailId: user.emailId,
      _id: user._id,
      role: user.role,
    };

    const token = jwt.sign(
      { _id: user._id, emailId: emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

       res.cookie("token", token, {
       httpOnly:true,
       sameSite:"none",
       secure:true,
     });
     
    res.status(200).json({ 
      user: reply,
      message: "Logged in Successfully"
    });

  } catch (err) {
    res.status(401).json({ message: err.message }); 
  }
};



const logout = async(req,res)=>{

    try{
        const {token} = req.cookies;
        const payload = jwt.decode(token);


        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);
    
         res.cookie("token",null,{expires: new Date(Date.now())});
         res.send("Logged Out Succesfully");

    }
    catch(err){
       res.status(503).send("Error: "+err);
    }
}

const check = async(req,res)=>{

    const reply = {
        firstName: req.result.firstName,
        emailId: req.result.emailId,
        _id:req.result._id,
        role:req.result.role,
    }

    res.status(200).json({
        user:reply,
        message:"Valid User"
    });
}

const ICE_servers = async(req, res) => {
  res.json([
    { urls: "stun:global.stun.twilio.com:3478" },
    {
      urls: "turn:global.turn.twilio.com:3478?transport=udp",
      username:   process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL,
    },
  ]);
}


module.exports = {register, login,logout,check, ICE_servers};