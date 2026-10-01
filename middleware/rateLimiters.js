const rateLimit=require('express-rate-limit');

const globalLimiter=rateLimit({
    windowMs:15*60*1000,
    max:200,
    message:'Too many requests from IP try again later',
    standardHeaders:true,
    legacyHeaders:false
})

const authLimiter=rateLimit({
    windowMs:15*60*1000,
    max:10,
    message:'Too many login/signup attempts try again in 15 minutes',
    standardHeaders:true,
    legacyHeaders:false
})

const bookingLimiter=rateLimit({
    windowMs:60*60*1000,
    max:15,
    message:'Too many booking requests. Please try again later',
    standardHeaders:true,
    legacyHeaders:false
})

module.exports = { globalLimiter, authLimiter, bookingLimiter };