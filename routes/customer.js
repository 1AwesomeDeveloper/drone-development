//
const express = require('express')
const jwt = require('jsonwebtoken')
const { loginTokendecoder, authCoustmer, forgotPasswordTokendecoder } = require('../middlware/cst_authentaction')
const Coustmer = require('../models/Coustmer')
const Drone = require('../models/Drone')
const coustmerOtpGeneration = require('../middlware/coustmerOtpValidation')
const sendOtp = require('../middlware/sendOtp')


const router = express.Router()

router.post('/register', async (req, res) =>{
    try{
        const exesist = Coustmer.findOne({email: req.body.email})

        if(!exesist){
            response.status(403).send({error:{message:'Invalid Details'}})
        }

        const custmerDetails = {
            name:req.body.name,
            email:req.body.email,
            password:req.body.password,
            phNumber:req.body.phNumber
        }

        const coustmer = new Coustmer(custmerDetails)
        await coustmer.save()
        res.send({message:'You are registred Succesfully! but you have to wait until someone verify you'})
    } catch (e) {
        console.log(e)
        res.status(403).send({error:{message:'Invlaid Deatils Or server is down!!'}})
    }
})

router.post('/login', async (req, res) =>{
    try{
        const { email, password } = req.body
        
        const valid = await coustmerOtpGeneration(email, password)
        if(!valid.status){
            console.log(valid)
            if(valid.error)
                return res.send({error: valid.error})
            
            console.log(email, password)
            return res.send({error:{message:'Either you are not registered or not verifed by our developers'}})
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
        const accessToken = await req.coustmer.generateToken()
        console.log(otp)
        res.send({message:`Welcome, ${req.coustmer.name}`, accessToken})
    } catch(e) {
        res.status(500).send({error:{message:'Server is down right now'}})
    }
})

router.get('/profile', authCoustmer, (req, res) =>{
    try{
        const coustmer = {message:`Welcome back ${req.coustmer.name}`,name: req.coustmer.name, email:req.coustmer.email, phNumber:req.coustmer.phNumber}
        res.send(coustmer)
    } catch(e) {
        console.log(e)
        res.status(500).send({error:{message:'Server is down right now'}})
    }
})

router.get('/changePassword', authCoustmer, async (req, res) =>{
    try{
        const otp = await sendOtp(req.coustmer.email, 'Password Change')
        req.coustmer.changePasswordOtp(otp)
        
        res.send({message:'Validate opt sent to your mail'})
    } catch (e) {
        console.log(e)
        res.status(500).send({error:{message:'No otp request'}})
    }
})

router.post('/changePassword', authCoustmer, async (req, res) =>{
    try{
        const { otp, newPassword } = req.body
        console.log(otp, newPassword)
        const validOtp = ((Date.now() - req.coustmer.passwordChangeStatus.otp.time) <= 120000)
        if(!validOtp){
            console.log('vliadity time')
            return res.send({error:{message:'Invalid Otp'}})
        }

        if(otp != req.coustmer.passwordChangeStatus.otp.value){
            console.log('otp')
            return res.send({error:{message:'Invalid Otp'}})
        }

        req.coustmer.password = newPassword
        req.coustmer.accessTokens = []
        await req.coustmer.save()
        const accessTokens = await req.coustmer.generateToken()
        
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
        const coustmer = await Coustmer.findOneAndUpdate({email}, {
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

router.get('/logout', authCoustmer, async (req, res) =>{
    try{
        await Coustmer.findByIdAndUpdate(req.coustmer._id, {accessTokens:[]})
        res.send({message:`${req.coustmer.name}, you are loged out Successfuly!`})
    } catch(e){
        console.log(e.message)
        res.status(403).send({error:{message:'Something is worng', error:error.message}})
    }
})

router.delete('/deleteAccount', authCoustmer, async (req, res) =>{
    try {
        const removedAccount = await Coustmer.findByIdAndDelete(req.coustmer._id)
        res.send({message:`${req.coustmer.name}, Your account is deletd `})
    } catch (error) {
        res.status(403).send({error:{message:'Something is worng', error:error.message}})
    }
})


router.post('/checkMyDrones', authCoustmer, async (req, res) => {
    try{
        const drones = await Drone.find({assignedto: req.coustmer.email}, {droneNo:true, modal:true, _id:true})
        if(!drone){
            return res.send({error:{message:"There is no drone registered by You."}})
        }

        res.send(drones)
    } catch(e) {
        res.status(400).send({error:{message:"Something went wrong try again"}})
    }
})

router.post('/flyDrone', authCoustmer, async (req, res) => {
    try{
        const drone = await Drone.updateOne({_id:req.body.id},{$push: { accessDates: Date.now() }})
        if(!drone){
            return res.send({error:{message:"There is no such drone in your account."}})
        }

        res.send({message:"You can now fly your drone."})
    } catch(e){
        console.log(e)
        res.status(500).send({error:{message:"Something went wrong Please try again."}})
    }
})

module.exports = router