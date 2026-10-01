const nodemailer=require('nodemailer');

const transporter=nodemailer.createTransport({
    host:process.env.EMAIL_HOST,
    port:process.env.EMAIL_PORT,
    secure:process.env.EMAIL_PORT==465,
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS,
    }
})

const sendEmail=async({to,subject,html})=>{
    await transporter.sendMail({
            from: `"Real Estate" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    })
}

module.exports=sendEmail;