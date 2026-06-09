const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/userMiddleware');
const {
    register,
    login,
    logout
    
   
} = require('../controler/userController');

router.post('/register',register ); 
router.post('/login', login);
router.post('/logout',authMiddleware, logout);
router.get('/check',authMiddleware,(req,res)=>{

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
})

module.exports = router;