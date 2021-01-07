const jwt = require('jsonwebtoken')
const Customer = require('../models/Customer')

const authCustomer = async (req, res, next) =>{
    
    try{
        const accessToken = req.headers['auth']
        if(!accessToken){
            throw new Error()
        }
        
        const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
        const customer = await Customer.findById(payload.id)
        if(!customer){
            throw new Error()
        }

        const tokenExesist = customer.accessTokens.includes(accessToken)
        if(!tokenExesist || !customer.verificationStatus){
            throw new Error()
        }
        req.customer = customer
        next()
    } catch(e){
        return res.status(403).send({error:{message:'Please Login'}})
    }

}

const loginTokendecoder = async (req, res, next) =>{
    
    try{
        const { otp } = req.body
        console.log(req.headers)
        const loginToken = req.headers['loingauth']
        if(!loginToken){
            throw new Error()
        }
        
        const payload = jwt.verify(loginToken, 'hell')
        const customer = await Customer.findById(payload.id)
        if(!customer){
            console.log('customer not found')
            throw new Error()
        }

        const validOtp = ((Date.now() - customer.loginStatus.otp.time) <= 180000)
        const tokenExesist = customer.loginStatus.loginToken == loginToken
        if(!tokenExesist || !validOtp){
            console.log('Otp expired')
            throw new Error()
        }

        if(otp != customer.loginStatus.otp.value || !otp){
            return res.send({error:{message:'Opt does not match'}})
        }
        
        req.customer = customer
        next()
    } catch(e){
        console.log(e)
        return res.status(401).send({error:{message:'Please Login'}})
    }

}

const forgotPasswordTokendecoder = async (req, res, next) =>{
    
    try{
        const { otp, newPassword } = req.body
        console.log(otp, newPassword)
        const passwordToken = req.headers['passwordauth']
        if(!passwordToken){
            throw new Error()
        }
        
        const payload = jwt.verify(passwordToken, 'hell')
        const customer = await Customer.findOne({email: payload.email})
        if(!customer){
            console.log('customer not found')
            throw new Error()
        }

        const validOtp = ((Date.now() - customer.passwordChangeStatus.otp.time) <= 120000)
        const tokenExesist = customer.passwordChangeStatus.passwordToken == passwordToken
        if(!tokenExesist || !validOtp){
            console.log(tokenExesist, validOtp)
            throw new Error()
        }

        if(otp != customer.passwordChangeStatus.otp.value || !otp){
            console.log(otp, customer.passwordChangeStatus.otp.value)
            return res.send({error:{message:'Opt does not match'}})
        }

        customer.password = newPassword
        customer.passwordChangeStatus.passwordToken = ''
        customer.passwordChangeStatus.otp.value = 0
        await customer.save()

        req.customer = customer
        next()
    } catch(e){
        console.log(e)
        return res.send({error:{message:'Some Error occured try agian'}})
    }

}

module.exports = { loginTokendecoder, authCustomer, forgotPasswordTokendecoder }