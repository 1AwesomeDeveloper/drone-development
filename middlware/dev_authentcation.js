const jwt = require('jsonwebtoken')
const Developer = require('../models/Developer')

const authDeveloper = async (req, res, next) =>{
    
    try{
        const accessToken = req.headers['auth']
        if(!accessToken){
            throw new Error()
        }
        
        const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
        const developer = await Developer.findById(payload.id)
        if(!developer){
            throw new Error()
        }

        const tokenExesist = developer.accessTokens.includes(accessToken)
        if(!tokenExesist || !developer.verificationStatus){
            throw new Error()
        }
        req.developer = developer
        next()
    } catch(e){
        console.log(e)
        return res.status(401).send({error:{message:'Please Login'}})
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
        const developer = await Developer.findById(payload.id)
        if(!developer){
            console.log('developer not found')
            throw new Error()
        }

        const validOtp = ((Date.now() - developer.loginStatus.otp.time) <= 120000)
        const tokenExesist = developer.loginStatus.loginToken == loginToken
        if(!tokenExesist || !validOtp){
            throw new Error()
        }

        if(otp != developer.loginStatus.otp.value || !otp){
            return res.send({error:{message:'Opt does not match'}})
        }
        
        req.developer = developer
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
        const developer = await Developer.findOne({email: payload.email})
        if(!developer){
            console.log('developer not found')
            throw new Error()
        }

        const validOtp = ((Date.now() - developer.passwordChangeStatus.otp.time) <= 120000)
        const tokenExesist = developer.passwordChangeStatus.passwordToken == passwordToken
        if(!tokenExesist || !validOtp){
            console.log(tokenExesist, validOtp)
            throw new Error()
        }

        if(otp != developer.passwordChangeStatus.otp.value || !otp){
            console.log(otp, developer.passwordChangeStatus.otp.value)
            return res.send({error:{message:'Opt does not match'}})
        }

        developer.password = newPassword
        developer.passwordChangeStatus.passwordToken = ''
        developer.passwordChangeStatus.otp.value = 0
        await developer.save()

        req.developer = developer
        next()
    } catch(e){
        console.log(e)
        return res.send({error:{message:'Some Error occured try agian'}})
    }

}

module.exports = { loginTokendecoder, authDeveloper, forgotPasswordTokendecoder }