const jwt = require('jsonwebtoken')
const Coustmer = require('../models/Coustmer')

const authCoustmer = async (req, res, next) =>{
    
    try{
        const accessToken = req.headers['auth']
        if(!accessToken){
            throw new Error()
        }
        
        const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
        const coustmer = await Coustmer.findById(payload.id)
        if(!coustmer){
            throw new Error()
        }

        const tokenExesist = coustmer.accessTokens.includes(accessToken)
        if(!tokenExesist || !coustmer.verificationStatus){
            throw new Error()
        }
        req.coustmer = coustmer
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
        const coustmer = await Coustmer.findById(payload.id)
        if(!coustmer){
            console.log('coustmer not found')
            throw new Error()
        }

        const validOtp = ((Date.now() - coustmer.loginStatus.otp.time) <= 120000)
        const tokenExesist = coustmer.loginStatus.loginToken == loginToken
        if(!tokenExesist || !validOtp){
            throw new Error()
        }

        if(otp != coustmer.loginStatus.otp.value || !otp){
            return res.send({error:{message:'Opt does not match'}})
        }
        
        req.coustmer = coustmer
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
        const coustmer = await Coustmer.findOne({email: payload.email})
        if(!coustmer){
            console.log('coustmer not found')
            throw new Error()
        }

        const validOtp = ((Date.now() - coustmer.passwordChangeStatus.otp.time) <= 120000)
        const tokenExesist = coustmer.passwordChangeStatus.passwordToken == passwordToken
        if(!tokenExesist || !validOtp){
            console.log(tokenExesist, validOtp)
            throw new Error()
        }

        if(otp != coustmer.passwordChangeStatus.otp.value || !otp){
            console.log(otp, coustmer.passwordChangeStatus.otp.value)
            return res.send({error:{message:'Opt does not match'}})
        }

        coustmer.password = newPassword
        coustmer.passwordChangeStatus.passwordToken = ''
        coustmer.passwordChangeStatus.otp.value = 0
        await coustmer.save()

        req.coustmer = coustmer
        next()
    } catch(e){
        console.log(e)
        return res.send({error:{message:'Some Error occured try agian'}})
    }

}

module.exports = { loginTokendecoder, authCoustmer, forgotPasswordTokendecoder }