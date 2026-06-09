const mongoose=require('mongoose');


async function main() {
  try {
    await mongoose.connect(process.env.DB_CONNECT);
    
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
    
};

module.exports=main;