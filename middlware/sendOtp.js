const nodeMailer = require('nodemailer')

async function sendOtp(email, purpose) {
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
      text: `YOur otp for ${purpose} to Drone Mania is ${otp}`
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