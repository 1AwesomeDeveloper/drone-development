const Developer = require('../models/Developer')
const sendOtp = require('./sendOtp')
const bcrypt = require('bcrypt')

const developerOtpGeneration = async(email, password)=>{
    //find developer
    const developer = await Developer.findOne({email})
    if(!developer){
        console.log('developer not found')
        return {status:false} 
    }
    
    // check developer password
    const isMatch = await bcrypt.compare(password, developer.password)
    if(!isMatch || !developer.verificationStatus){
        console.log('invlaid password')
        return {status:false}
    }

    const otp = await sendOtp(email, 'login', 'developer')
    console.log(otp)
    loginToken = await developer.generateLoginToken(otp)

    return {loginToken, status:true}
}


module.exports = developerOtpGeneration