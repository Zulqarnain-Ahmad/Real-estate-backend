const express=require('express');
const {sendBookingReminders} =require('../jobs/bookingCron');

const router=express.Router();

router.get('/send-reminders',async(req,res)=>{
    const authHeader=req.headers.authorization;

    if(authHeader !== `Bearer ${process.env.CRON_SECRET}`){
            return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
    }

    await sendBookingReminders();
    res.status(200).json({ status: 'success', message: 'Reminder check completed.' });
})

module.exports=router;