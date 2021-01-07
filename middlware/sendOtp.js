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
      text: `Hello ${person}
      Did you just loged in, Your otp for ${purpose} to DronePoint is ${otp}.
      If its not you than someone else just tried to loged into your account.
      We Preffer you to change password or call support team if its not you.`,
      html:`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
          <style>
              body{
                  text-align: center;
                  background-color: tomato;
                  font-family: sans-serif;
              }
              .otp{
                  color: white;
              }
          </style>
      </head>
      <body>
          <h1>Drone-Point</h1>
          <br>
          <h2>Hello ${person}</h2>
          <p>Did you just loged in, Your otp for ${purpose} to DronePoint is</p>
          <h2 class="otp">${otp}.</h2> 
          <br>
          <hr>
          <p> If its not you than someone else just tried to loged into your account.
              We Preffer you to change password or call support team if its not you.</p>
      </body>
      </html>
      `
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