const express = require('express')
const jwt = require('jsonwebtoken')
const { loginTokendecoder, authDeveloper, forgotPasswordTokendecoder } = require('../middlware/dev_authentcation')
const mail = require('../middlware/mail')
const Developer = require('../models/Developer')
const Coustmer = require('../models/Coustmer')
const developerOtpGeneration = require('../middlware/developerOtpValidation')
const sendOtp = require('../middlware/sendOtp')

const router = express.Router()

router.post('/register', async (req, res) =>{
    try{
        //console.log("hell 213213")
        const developerDetails = {
            name:req.body.name,
            phNumber:req.body.phNumber,
            email:req.body.email,
            password:req.body.password
        }
        const developer = new Developer(developerDetails)
        await developer.save()
        mail(developerDetails.email, {
            head:'Welcome to drone Point',
            msg:'Thankyou for regestring on DronePoint but you have to wait for verification mail by our developers.'
        }, developerDetails.name, 'Regestration on DronePoint')

        res.send({message:'You are registred Succesfully! but you have to wait until someone verifiy you, you will be thorugh mail when verified'})
    } catch (e) {
        console.log("hell")
        console.log(e)
        res.status(500).send({error:{message:'Check you Details something is wrong'}})
    }
})

router.post('/login', async (req, res) =>{
    try{
        const { email, password } = req.body
        
        const valid = await developerOtpGeneration(email, password)
        if(!valid.status){
            console.log(valid)
            if(valid.error)
                return res.send({error: valid.error})
            
            return res.send({error:{message:'Either you are not registered or not verifed by our develoers'}})
        }

        const loginToken = valid.loginToken
        res.send({message:`Please valid by entering otp send to ${email}`, loginToken})
        
    } catch(e) {
        console.log(e)
        res.status(500).send({error:{message:'Server is down right now'}})
    }
})

router.post('/otpValidation', loginTokendecoder, async (req, res) =>{
    try{
        const { otp } = req.body
        const accessTokens = await req.developer.generateToken()
        console.log(otp)
        res.send({message:`Welcome, ${req.developer.name}`, accessToken})
    } catch(e) {
        res.status(500).send({error:{message:'Server is down right now'}})
    }
})

router.get('/profile', authDeveloper, (req, res) =>{
    try{
        const developer = {message:`Welcome back ${req.developer.name}`,name: req.developer.name, email:req.developer.email, dob:req.developer.dob}
        res.send(developer)
    } catch(e) {
        console.log(e)
        res.status(500).send({error:{message:'Server is down right now'}})
    }
})

router.get('/changePassword', authDeveloper, async (req, res) =>{
    try{
        const otp = await sendOtp(req.developer.email, 'Password Change')
        req.developer.changePasswordOtp(otp)
        
        res.send({message:'Validate opt sent to your mail'})
    } catch (e) {
        console.log(e)
        res.status(500).send({error:{message:'No otp request'}})
    }
})

router.post('/changePassword', authDeveloper, async (req, res) =>{
    try{
        const { otp, newPassword } = req.body
        console.log(otp, newPassword)
        const validOtp = ((Date.now() - req.developer.passwordChangeStatus.otp.time) <= 120000)
        if(!validOtp){
            console.log('vliadity time')
            return res.send({error:{message:'Invalid Otp'}})
        }

        if(otp != req.developer.passwordChangeStatus.otp.value){
            console.log('otp')
            return res.send({error:{message:'Invalid Otp'}})
        }

        req.developer.password = newPassword
        req.developer.accessTokens = []
        await req.developer.save()
        const accessTokens = await req.developer.generateToken()
        
        res.send({accessTokens, message:'Your password has been changed successfuly'})
    } catch (e) {
        console.log(e)
        res.status(500).send({error:{message:'Server is down right now'}})
    }
})

router.post('/forgotPassword', async (req, res) =>{
    try{
        const { email } = req.body
        console.log(email)
        const passwordChangeToken = await jwt.sign({email}, 'hell', {
            algorithm: "HS256"
        }) 
        const otp = await sendOtp(email, 'Password Change')
        console.log('we are here')
        const devloper = await Developer.findOneAndUpdate({email}, {
            passwordChangeStatus:{
                passwordToken:passwordChangeToken,
                otp:{
                    value:Number(otp),
                    time:Date.now()
                }
            }
        })

        
        res.send({message:'Validate opt sent to your mail', passwordChangeToken})
    } catch (e) {
        console.log(e)
        res.status(500).send({error:{message:'No otp request'}})
    }
})

router.post('/fpOtpValidation', forgotPasswordTokendecoder, async (req, res) =>{
    try{
        const { otp, newPassword } = req.body
        console.log(otp, newPassword)

        res.send({message:'Your password has been changed successfuly'})
    } catch (e) {
        console.log(e)
        res.status(500).send({error:{message:'Server is down right now'}})
    }
})

router.get('/logout', authDeveloper, async (req, res) =>{
    try{
        await Developer.findByIdAndUpdate(req.developer._id, {accessTokens:[]})
        res.send({message:`${req.developer.name}, you are loged out Successfuly!`})
    } catch(e){
        console.log(e.message)
        res.status(403).send({error:{message:'Something is worng', error:error.message}})
    }
})

router.delete('/deleteAccount', authDeveloper, async (req, res) =>{
    try {
        const removedAccount = await Developer.findByIdAndDelete(req.developer._id)
        res.send({message:`${req.developer.name}, Your account is deletd `})
    } catch (error) {
        res.status(403).send({error:{message:'Something is worng', error:error.message}})
    }
})

router.get('/unverifiedAccounts', authDeveloper, async (req, res) =>{
    try{
        const unverifiedDev = await Developer.find({verificationStatus: false})
        const unverifiedCts = await Coustmer.find({verificationStatus:false})
        res.send({unverifiedDev, unverifiedCts})
    } catch(error){
        res.status(403).send({error:{message:'Something is worng', error:error.message}})
    }
})

router.get('/verifyCts/:id', authDeveloper, async (req, res)=>{
    try{
        
        const customer = await Coustmer.findByIdAndUpdate(
            {_id:req.params.id},
            {
                verificationStatus:true
            }) 
            
        await mail(customer.email,{
            head:'Welcome to DronePoint',
            msg:'Your are now a verified user and can use our services.Thankyou for choosing us'
        }, customer.name, 'Drone point Verification' )

        res.send({message:`${customer.name} is successfully verified`})
    } catch(error){
        console.log(error)
        res.status(403).send({error:{message:'Something is worng', error:error.message}})
    }
})

router.get('/verifyDev/:id', authDeveloper, async (req, res)=>{
    try{
        const developer = await Developer.findByIdAndUpdate({_id:req.params.id},{verificationStatus:true,})

        await mail(customer.email,{
            head:'Welcome to DronePoint',
            msg:'Your are now a verified user and can use our services.Thankyou for choosing us'
        }, customer.name, 'Drone point Verification' )

        res.send({message:`${developer.name} is successfully verified`})
    } catch(error){
        console.log(error)
        res.status(403).send({error:{message:'Something is worng', error:error.message}})
    }
})

module.exports = router