const nodeMailer = require('nodemailer')

async function sendOtp(email, purpose, person) {
    var minm = 1000000; 
    var maxm = 9999999; 
    const otp = await Math.floor(Math.random() * (maxm - minm + 1)) + minm
    
    console.log(`otp genrate ${otp}`)
    const transporter = nodeMailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'drone7160@gmail.com',
        pass: 'Drone_test@1' // naturally, replace both with your real credentials or an application-specific password
      }
    })
    
    const mailOptions = {
      from: 'drone7160@gmail.com',
      to: `${email}`,
      subject: `Drone login Otp`,
      text: `Hello ${person}<br>
             Did you just loged in, Your otp for ${purpose} to DronePoint is <strong>${otp}</strong>.
            <br>If its not you than someone else just tried to loged into your account.<br>
            We Preffer you to change password or call support team if its not you.`
    }
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
      console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    })

    return otp
}
  
module.exports = sendOtp