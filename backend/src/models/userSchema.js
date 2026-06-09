const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minLength:6,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    
    image: { 
        type: String, 
        default: "",
        
    },
    banned: { type: Boolean, default: false },
   
    gender: { type: String, enum: ['male', 'female', 'other'] },

}, { timestamps: true });


const User = mongoose.models.user || mongoose.model('omegale',userSchema)
module.exports = User; 

