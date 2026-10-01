const jwt=require('jsonwebtoken');
const User=require('../models/User');
const AppError=require('../utils/AppError');

const protect=async(req,res,next)=>{
    try{
        const token=req.cookies.accessToken;

        if(!token){
             return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
        }

        const decoded=jwt.verify(token,process.env.JWT_SECRET);

        const currentUser=await User.findById(decoded.id).select('+active');

        if(!currentUser.active){
            return next(new AppError('This account has been disabled.', 401));
        }

        if(currentUser.changedPasswordAfter(decoded.iat)){
             return next(new AppError('Password was recently changed. Please log in again.', 401));
        }

        req.user=currentUser;
        next();
    }catch(err){
        return next(new AppError('Invalid or expired token.Please log in again',401))
    }

}

const restrictTo=(...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action.', 403));
        }

        next()
    }
}

module.exports={protect,restrictTo}