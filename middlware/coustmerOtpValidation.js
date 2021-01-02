const Coustmer = require('../models/Coustmer')
const sendOtp = require('./sendOtp')
const bcrypt = require('bcrypt')

const coustmerOtpGeneration = async(email, password)=>{
    //find coustmer
    const customer = await Coustmer.findOne({email})
    console.log(customer)
    if(!customer){
        console.log('customer not found')
        return {status:false} 
    }
    
    // check customer password
    const isMatch = await bcrypt.compare(password, customer.password)
    if(!isMatch || !customer.verificationStatus){
        console.log('invlaid password')
        return {status:false}
    }

    const otp = await sendOtp(email, 'login', 'customer')
    console.log(otp)
    loginToken = await customer.generateLoginToken(otp)

    return {loginToken, status:true}
}


module.exports = coustmerOtpGeneration