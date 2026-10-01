const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { createSendToken, signAccessToken } = require('../utils/generateToken');
const jwt = require('jsonwebtoken');



const register=catchAsync(async(req,res,next)=>{
      console.log('Register controller reached', req.body);
    const {name,email,password,phone}=req.body;
    const existingUser=await User.findOne({email});
    if(existingUser){
        return next(new AppError('An account with this email already exists',400));
    }
    
    const newUser=await User.create({name,email,password,phone});

    createSendToken(newUser,201,res);
})

const login=catchAsync(async(req,res,next)=>{
    const {email,password}=req.body;

    const user=await User.findOne({email}).select('+password +active +loginAttempts +lockUntil')

   if(!user){
    return next(new AppError('Incorrect Email Or Password',401))
   }

     if (user.lockUntil && user.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return next(new AppError(`Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`, 423));
  }
   const isCorrect=await user.correctPassword(password,user.password)

   if(!isCorrect){
    user.loginAttempts+=1;

    if(user.loginAttempts>=5){
        user.lockUntil=Date.now() +30*60*1000;
        user.loginAttempts=0;
    }

    await user.save({validateBeforeSave:false});
    return next(new AppError('Incorrect email or password',401))
   }

   if(!user.active){
    return next(new AppError('This account has been disabled contact customer support',401))
   }

   user.loginAttempts=0;
   user.lockUntil=undefined;
   await user.save({validateBeforeSave:false})
   
   createSendToken(user,200,res);
})

const logout=(req,res)=>{
    res.cookie('accessToken','loggedout',{expires:new Date(Date.now()+1000),httpOnly:true});
    res.cookie('refreshToken','loggedout',{
        expires:new Date(Date.now()+1000),
        httpOnly:true,
        path:'/api/auth/refresh'
    })
    res.status(200).json({status:'success',message:'logged Out successfully'})
}


const refreshAccessToken=catchAsync(async(req,res,next)=>{
    const refreshToken=req.cookies.refreshToken;

    if(!refreshToken){
        return next(new AppError('No refresh token found.Please login again',401))
    }

    let decoded;
    try{
         decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    }catch(err){
        return next(new AppError('Invalide or expired token.Please login again',401))
    }

    const user=await User.findById(decoded.id);
    if(!user || !user.active){
        return next(new AppError('User no longer exists or its disabled',401))
    }

    const newAccessToken=signAccessToken(user._id);

    res.cookie('accessToken',newAccessToken,{
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
    })

    res.status(200).json({status:'success',message:'Access token refreshed'})
})

const getMe=(req,res)=>{
    res.status(200).json({
        status:'success',
        data:{user:req.user}
    })
}

module.exports={register,login,logout,refreshAccessToken,getMe}