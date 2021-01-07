const nodeMailer = require('nodemailer')

async function sendMail(email, message, name, subject) {
    
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
      subject: `${subject}`,
      text: `Hello ${name}
      ${message.head}
       ${message.msg}`,
      html:`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
          <style>
              body{
                  font-family: sans-serif;
              }
              .otp{
                  color:rgb(37, 37, 37);
              }
          </style>
      </head>
      <body style="background-color:rgb(104, 218, 253);text-align: center; ">
          <h1>Drone-Point</h1>
          <br>
          <h2>Hello ${name}</h2>
          <h3>${message.head}</h3>
          <p>${message.msg}</p>
          <br>
          <hr>
          <p> If its not you or you not have apllied for this please contact support team.</p>
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

    return true
}
  
module.exports = sendMail