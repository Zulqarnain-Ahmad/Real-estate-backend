const mongoose=require('mongoose')

const connectDB = async () => {
  
  if(mongoose.connection.readyState >=1){
    return;
  }

  try {
   const conn=await mongoose.connect(process.env.MONGO_URI,{
    serverSelectionTimeoutMS:5000,
   });
   console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
  console.error(`Error connecting to MongoDB: ${error.message}`)
  throw error;
};}

module.exports=connectDB;