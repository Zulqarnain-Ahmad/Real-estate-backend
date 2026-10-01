const jwt=require('jsonwebtoken');

const signAccessToken=(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN || '15m',

    })
}


const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

const createSendToken=(user,statusCode,res)=>{
    const accessToken=signAccessToken(user._id);
    const refreshToken=signRefreshToken(user._id);

    const cookieOptions={
        httpOnly:true,
        secure:process.env.NODE_ENV==='production',
        sameSite:'strict'
    }

    res.cookie('accessToken',accessToken,{
        ...cookieOptions,
        maxAge:15*60*1000,
    });

    res.cookie('refreshToken',refreshToken,{
           ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
    })

    user.password=undefined;

    res.status(statusCode).json({
        status:'success',
        data:{
            user,
        }
    })
}


module.exports = { signAccessToken, signRefreshToken, createSendToken };
