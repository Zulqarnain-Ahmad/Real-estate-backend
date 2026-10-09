const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');

const connectDB = require('./config/db');
const AppError = require('./utils/AppError');
const { globalLimiter } = require('./middleware/rateLimiters');
const errorHandler = require('./middleware/errorMiddleware');
const sanitizeInputs = require('./middleware/sanitizeMiddleware');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const cronRoutes = require('./routes/cronRoutes');

const app = express();

// Vercel sits behind a proxy; this makes req.ip (and rate limiting) use the real visitor IP
app.set('trust proxy', 1);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(helmet());

// Strip any trailing slash so "https://site.vercel.app/" still matches the browser's origin
const allowedOrigin = (process.env.CLIENT_URL || '').replace(/\/+$/, '');

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// Health check: no database needed, so it works even if the DB is down
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(sanitizeInputs);
app.use(hpp());
app.use(compression());

app.use('/api', globalLimiter);

// Connect to the database only for requests that need it (cached after the first connection)
app.use(async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  try {
    await connectDB();
    next();
  } catch (err) {
    next(new AppError('Database connection failed. Please try again shortly.', 503));
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cron', cronRoutes);

// Unknown routes return a clean JSON 404 instead of Express's default HTML page
app.use((req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

// Must stay last
app.use(errorHandler);

module.exports = app;