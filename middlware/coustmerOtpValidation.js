const Coustmer = require('../models/Coustmer')
const sendOtp = require('./sendOtp')
const bcrypt = require('bcrypt')

const coustmerOtpGeneration = async(email, password)=>{
    //find coustmer
    const coustmer = await Coustmer.findOne({email})
    if(!coustmer){
        console.log('coustmer not found')
        return {status:false} 
    }
    
    // check coustmer password
    const isMatch = await bcrypt.compare(password, coustmer.password)
    if(!isMatch || !coustmer.verificationStatus){
        console.log('invlaid password')
        return {status:false}
    }

    const otp = await sendOtp(email, 'login')
    console.log(otp)
    loginToken = await coustmer.generateLoginToken(otp)

    return {loginToken, status:true}
}


module.exports = coustmerOtpGeneration