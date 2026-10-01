const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');
const { globalLimiter } = require('./middleware/rateLimiters');
const errorHandler = require('./middleware/errorMiddleware');
const authRoutes=require('./routes/authRoutes')
const sanitizeInputs = require('./middleware/sanitizeMiddleware');
const path=require('path')
const propertyRoutes=require('./routes/propertyRoutes')
const slotRoutes=require('./routes/slotRoutes')
const bookingRoutes=require('./routes/bookingRoutes')
const userRoutes=require('./routes/userRoutes')
const analyticsRoutes = require('./routes/analyticsRoutes');
const cronRoutes=require('./routes/cronRoutes')

const app=express();

if(process.env.NODE_ENV==='development'){
    app.use(morgan('dev'))
}

app.use(helmet());
app.use(cors({
    origin:process.env.CLIENT_URL,
    credentials:true
}))

app.use(express.json({limit:'10kb'}))
app.use(cookieParser());
app.use(sanitizeInputs);
app.use(hpp());
app.use(compression())
app.use('/api/cron',cronRoutes)
app.use('/api',globalLimiter)
app.use('/api/auth', authRoutes);
app.use('/api/properties',propertyRoutes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/slots',slotRoutes);
app.use('/api/bookings',bookingRoutes)
app.use('/api/users',userRoutes)
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

app.use(errorHandler)

module.exports=app;