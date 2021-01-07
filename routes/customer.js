//
const express = require('express')
const jwt = require('jsonwebtoken')
const { loginTokendecoder, authCustomer, forgotPasswordTokendecoder } = require('../middlware/cst_authentaction')
const Customer = require('../models/Customer')
const Drone = require('../models/Drone')
const customerOtpGeneration = require('../middlware/customerOtpValidation')
const sendOtp = require('../middlware/sendOtp')
const mail = require('../middlware/mail')


const router = express.Router()

router.post('/register', async (req, res) =>{
    try{
        const exesist = await Customer.findOne({email: req.body.email})
        if(exesist){
            response.status(403).send({error:{message:'Invalid Details'}})
        }

        const customerDetails = {
            name:req.body.name,
            email:req.body.email,
            password:req.body.password,
            phNumber:req.body.phNumber
        }

        const customer = new Customer(customerDetails)
        await customer.save()

        mail(customerDetails.email, {
            head:'Welcome to drone Point',
            msg:'Thankyou for regestring on DronePoint but you have to wait for verification mail by our developers.'
        }, customerDetails.name, 'Regestration on DronePoint')
        res.send({message:'You are registred Succesfully! but you have to wait until someone verify you'})
    } catch (e) {
        console.log(e)
        res.status(403).send({error:{message:'Invlaid Deatils Or server is down!!'}})
    }
})

router.post('/login', async (req, res) =>{
    try{
        const { email, password } = req.body
        
        const valid = await customerOtpGeneration(email, password)
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
        const accessToken = await req.customer.generateToken()
        console.log(otp)
        res.send({message:`Welcome, ${req.customer.name}`, accessToken})
    } catch(e) {
        res.status(500).send({error:{message:'Server is down right now'}})
    }
})

router.get('/profile', authCustomer, (req, res) =>{
    try{
        const customer = {message:`Welcome back ${req.customer.name}`,name: req.customer.name, email:req.customer.email, phNumber:req.customer.phNumber}
        res.send(customer)
    } catch(e) {
        console.log(e)
        res.status(500).send({error:{message:'Server is down right now'}})
    }
})

router.get('/changePassword', authCustomer, async (req, res) =>{
    try{
        const otp = await sendOtp(req.customer.email, 'Password Change')
        req.customer.changePasswordOtp(otp)
        
        res.send({message:'Validate opt sent to your mail'})
    } catch (e) {
        console.log(e)
        res.status(500).send({error:{message:'No otp request'}})
    }
})

router.post('/changePassword', authCustomer, async (req, res) =>{
    try{
        const { otp, newPassword } = req.body
        console.log(otp, newPassword)
        const validOtp = ((Date.now() - req.customer.passwordChangeStatus.otp.time) <= 120000)
        if(!validOtp){
            console.log('vliadity time')
            return res.send({error:{message:'Invalid Otp'}})
        }

        if(otp != req.customer.passwordChangeStatus.otp.value){
            console.log('otp')
            return res.send({error:{message:'Invalid Otp'}})
        }

        req.customer.password = newPassword
        req.customer.accessTokens = []
        await req.customer.save()
        const accessTokens = await req.customer.generateToken()
        
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
        const customer = await Customer.findOneAndUpdate({email}, {
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

router.get('/logout', authCustomer, async (req, res) =>{
    try{
        await Customer.findByIdAndUpdate(req.customer._id, {accessTokens:[]})
        res.send({message:`${req.customer.name}, you are loged out Successfuly!`})
    } catch(e){
        console.log(e.message)
        res.status(403).send({error:{message:'Something is worng', error:error.message}})
    }
})

router.delete('/deleteAccount', authCustomer, async (req, res) =>{
    try {
        const removedAccount = await Customer.findByIdAndDelete(req.customer._id)
        res.send({message:`${req.customer.name}, Your account is deletd `})
    } catch (error) {
        res.status(403).send({error:{message:'Something is worng', error:error.message}})
    }
})


router.post('/checkMyDrones', authCustomer, async (req, res) => {
    try{
        const drones = await Drone.find({assignedto: req.customer.email}, {droneNo:1, modal:1, _id:1})
        if(!drone){
            return res.send({error:{message:"There is no drone registered by You."}})
        }

        res.send(drones)
    } catch(e) {
        res.status(400).send({error:{message:"Something went wrong try again"}})
    }
})

router.post('/flyDrone', authCustomer, async (req, res) => {
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