const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// 1. GLOBAL CORS MIDDDLEWARE SETUP
app.use(cors({
  origin: "https://real-estate-frontend-phi-eight.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

// 2. EXPLICIT PREFLIGHT OPTIONS ROUTE HANDLER 
// This guarantees that any preflight OPTIONS requests immediately exit with an HTTP 200 OK status
app.options('*', cors());

app.use(express.json());

// 3. SERVERLESS-SAFE CACHED DATABASE CONNECTION MIGRATION
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    // Falls back to your working connection string if the environment variable has whitespace
    const dbUri = process.env.MONGO_URI || "mongodb+srv://ahmadzulqarnain929_db_user:IKDBuCkmlYkZIvRh@cluster0.er1izm1.mongodb.net/?appName=RealEstaate";
    const db = await mongoose.connect(dbUri.trim());
    isConnected = db.connections[0].readyState;
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("Database connection failure:", err.message);
  }
};

// Middleware to establish database connectivity context on every request run
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

/* ==========================================
   YOUR CORE API ROUTE MODULES (Example Layout)
========================================== */
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/properties', require('./routes/properties'));

// Root diagnostic status test endpoint
app.get('/api', (req, res) => {
  res.status(200).json({ status: "Online", message: "Backend API is fully operational" });
});

// 4. CRITICAL VERCEL SERVERLESS EXPORT RULE
// Do not use app.listen() in production; Vercel mounts your exported app instance dynamically
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Local development running on port ${PORT}`));
}

module.exports = app;
