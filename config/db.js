const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);

    if (error.reason && error.reason.servers) {
      for (const [host, server] of error.reason.servers) {
        console.error(`  ${host} -> ${server.error ? server.error.message : 'no error recorded'}`);
      }
    }

    throw error;
  }
};

module.exports = connectDB;