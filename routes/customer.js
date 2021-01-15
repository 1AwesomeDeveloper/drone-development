//
const express = require('express')
const jwt = require('jsonwebtoken')
const { loginTokendecoder, authCustomer, forgotPasswordTokendecoder } = require('../middlware/cst_authentaction')
const Customer = require('../models/Customer')
const Drone = require('../models/Drone')
const DModal = require('../models/DModal')
const customerOtpGeneration = require('../middlware/customerOtpValidation')
const sendOtp = require('../middlware/sendOtp')
const mail = require('../middlware/mail')
const { uploadKey, uploadLog } = require('../middlware/fileUpload')
const Developer = require('../models/Developer')


const router = express.Router()

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


router.post('/checkMyDrone', authCustomer, async (req, res) => {
    try{
        if(!req.body.flightControllerNumber){
            return res.status(403).send({error:{message:'Please Provide flight controller number.'}})
        }
        const drone = await Drone.findOne({flightControllerNumber: req.body.flightControllerNumber, assignedTo:req.customer.email})
        if(!drone){
            throw new Error()
        }

        res.send({message: `your Done with modal Id -${drone.modalId} and Flight Controller Number -${drone.flightControllerNumber} is registered`})
    } catch(e) {
        res.status(400).send({error:{message:"Your drone is not registered"}})
    }
})

router.post('/flyUp', authCustomer, uploadKey, async (req, res) => {
    try{
        const obj = {id:req.query.id}
        if(!obj.id){
            return res.status(403).send({error:{message:'Please Provide drone Id to store key'}})
        }

        if(req.multermsg){
            return res.send({error:{message:req.multermsg}})
        }

        if(!req.file){
            return res.status(403).send({error:{message:'Please provide a file'}})
        }

        const file =req.file

        const key ={
                        time:Date.now(),
                        file:{
                            fieldname: file.fieldname,
                            originalname: file.originalname,
                            encoding: file.encoding,
                            mimetype: file.mimetype,
                            extname:req.extname,
                            size:file.size,
                            buffer: file.buffer
                        }
                    }

        const drone = await Drone.updateOne({flightControllerNumber:obj.id, assignedTo:req.customer.email},{$addToSet:{keyRegistry:key}})

        if(!drone.n){
            return res.send({error:{message:"There is no such drone in your account."}})
        }

        res.send({message:"Your key is upadted in database."})
    } catch(e){
        console.log(e)
        res.status(500).send({error:{message:"Something went wrong Please try again."}})
    }
})

router.post('/flyDown', authCustomer, uploadLog, async (req, res) => {
    try{
        const obj = {id:req.query.id}
        console.log(obj.id)
        if(!obj.id){
            return res.status(403).send({error:{message:'Please Provide drone Id to store key'}})
        }
        if(req.multermsg){
            return res.send({error:{message:req.multermsg}})
        }

        if(!req.file){
            return res.status(403).send({error:{message:'Please provide a file'}})
        }

        const file =req.file
        console.log(file)

        const key ={
                        time:Date.now(),
                        file:{
                            fieldname: file.fieldname,
                            originalname: file.originalname,
                            encoding: file.encoding,
                            mimetype: file.mimetype,
                            extname:req.extname,
                            size:file.size,
                            buffer: file.buffer
                        }
                    }

        const drone = await Drone.updateOne({flightControllerNumber:obj.id, assignedTo:req.customer.email},{$addToSet: {logRegistry:key}})
        if(!drone.n){
            return res.send({error:{message:"There is no such drone in your account."}})
        }

        res.send({message:"Your flight log is upadted in database."})
    } catch(e){
        console.log(e)
        res.status(500).send({error:{message:"Something went wrong Please try again."}})
    }
})

router.get('/allFirmware/:id', authCustomer, async (req, res) =>{
    try{
        console.log(req.params.id)
        const modal = await DModal.findById(req.params.id, {'firmwareRegistry.version':1,'firmwareRegistry.time':1, 'firmwareRegistry._id':1})

        if(!modal){
            return res.send({error:{message:'There is no modal with this id.'}})
        }

        res.send(modal)
    } catch {
        console.log(e)
        res.status(500).send({error:{message:"Something went wrong Please try again. This is an internal error"}})
    }
})


//under construction
router.get('/downloadFirmware' , async (req, res) =>{
    
    try{

        console.log(req.query)
        if(!req.query.fid|| !req.query.token ||!req.query.id){
            return res.send({error:{message:'Please provide valid id, full date with time, token for xx.xx.xx firmware downlaod'}})
        }

        const token = req.query.token
        if(!token){
            return res.send({error:{message:'Please login'}})
        }

        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const customer = await Customer.findById(payload.id)
        if(!customer){
            return res.send({error:{message:'Pleae login'}})
        }

        const tokenExesist = customer.accessTokens.includes(token)
        if(!tokenExesist || !customer.verificationStatus){
            return res.send({error:{message:'Pleae login'}})
        }

        const id = req.query.id
        
        const { firmwareRegistry } = await DModal.findById(id, {_id: 0, firmwareRegistry: {"$elemMatch": {_id: req.query.fid}}})

        console.log(firmwareRegistry)

        if(!firmwareRegistry[0]){
            return res.send({message:'There is no firmware availabe for this modal'})
        }

        let date = new Date(firmwareRegistry[0].time)
        let dateString = date.toLocaleDateString()

        res.set({
            encoding: firmwareRegistry[0].file.encoding,
            mimetype:firmwareRegistry[0].file.mimetype,
            orignalname:firmwareRegistry[0].file.orignalname,
            'Content-Disposition': 'attachment; filename=' + `firmware${dateString}.${firmwareRegistry[0].file.extname}`,
            size:firmwareRegistry[0].file.size
          })
     
          res.send(firmwareRegistry[0].file.buffer);
    } catch(e) {
        console.log(e)
        res.status(500).send({error:{message:"Something went wrong Please try again. This is an internal error"}})
    }
})

router.get('/latestFirmwareDownload', async (req, res) =>{
    try{
        const token = req.query.token
        if(!token){
            return res.send({error:{message:'Please login'}})
        }

        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const customer = await Customer.findById(payload.id)
        if(!customer){
            return res.send({error:{message:'Pleae login'}})
        }

        const tokenExesist = customer.accessTokens.includes(token)
        if(!tokenExesist || !customer.verificationStatus){
            return res.send({error:{message:'Pleae login'}})
        }

        const id = req.query.id
        const { latestFirmware } = await DModal.findById(id, {latestFirmware:1})

        let date = new Date(latestFirmware.time)
        let dateString = date.toLocaleDateString()

        res.set({
            encoding: latestFirmware.file.encoding,
            mimetype:latestFirmware.file.mimetype,
            orignalname:latestFirmware.file.orignalname,
            'Content-Disposition': 'attachment; filename=' + `firmware${dateString}${latestFirmware.file.extname}`,
            size:latestFirmware.file.size
        })
     
        res.send(latestFirmware.file.buffer);

    } catch(e){
        console.log(e)
        res.status(500).send({error:{message:"Something went wrong Please try again. This is an internal error"}})
    }
})

module.exports = router