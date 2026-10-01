const cron = require('node-cron');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Property = require('../models/Property');
const sendEmail = require('../utils/sendEmail');

const sendBookingReminders=async()=>{
  try{
    const now=new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingBookings=await Booking.find({
        status:'confirmed',
        reminderSend:false,
    })
    .populate('slot')
    .populate('property')
    .populate('customer');

    for(const booking of upcomingBookings){
        if(!booking.slot || !booking.property || !booking.customer) continue;

        const slotDateTime=new Date(booking.slot.date);
        const [hours,minutes]=booking.slot.startTime.split(':');
        slotDateTime.setHours(Number(hours),Number(minutes),0,0);

        if(slotDateTime>= now && slotDateTime <= in24hours){
            try{
                await sendEmail({
                                to: booking.customer.email,
            subject: 'Reminder: Your Property Viewing is Tomorrow',
            html: `
              <h2>Viewing Reminder</h2>
              <p>Hi ${booking.customer.name},</p>
              <p>This is a reminder that your viewing for <strong>${booking.property.title}</strong> is coming up:</p>
              <p><strong>${slotDateTime.toDateString()}</strong> at <strong>${booking.slot.startTime} - ${booking.slot.endTime}</strong></p>
              <p>Location: ${booking.property.location.address}, ${booking.property.location.city}</p>
            `,
                });

                booking.reminderSent=true;
                await booking.save();

                console.log(`Reminder sent for booking ${booking._id}`);
            }
            catch(emailErr){
                 console.error(`Failed to send reminder for booking ${booking._id}:`, emailErr.message);
            }
        }
    }
  }catch (err) {
    console.error('Error running booking reminder job:', err.message);
  }
}




module.exports = {  sendBookingReminders };
