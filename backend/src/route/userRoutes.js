const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/userMiddleware');
const {
    register,
    login,
    logout,
    check,
    ICE_servers
    
   
} = require('../controler/userController');

router.post('/register',register ); 
router.post('/login', login);
router.post('/logout',authMiddleware, logout);
router.get('/check',authMiddleware,check)
router.get("/ice-servers",ICE_servers)


module.exports = router;