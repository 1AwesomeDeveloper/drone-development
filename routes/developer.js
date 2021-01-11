const express = require('express')
const jwt = require('jsonwebtoken')
const { loginTokendecoder, authDeveloper, forgotPasswordTokendecoder } = require('../middlware/dev_authentcation')
const mail = require('../middlware/mail')
const Drone = require('../models/Drone')
const Developer = require('../models/Developer')
const Customer = require('../models/Customer')
const developerOtpGeneration = require('../middlware/developerOtpValidation')
const sendOtp = require('../middlware/sendOtp')

const router = express.Router()

router.post('/register', async (req, res) =>{
    try{

        const exesist = await Developer.findOne({email: req.body.email})
        if(exesist){
            return res.send({error:{message:'You are already registered'}})
        }

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

        res.send({message:'You are registred Succesfully! but you have to wait until someone verifiy you, you will be informed thorugh mail when verified'})
    } catch (e) {
        console.log("hell")
        console.log(e)
        res.status(500).send({error:{message:'Check you Details something is wrong'}})
    }
})

//routechanged
router.post('/registerCustomer', authDeveloper, async (req, res) =>{
    try{
        const exesist = await Customer.findOne({email: req.body.email})
        if(exesist){
            return res.status(403).send({error:{message:'Customer mail is already registered'}})
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
        res.send({message:req.body.email + ' is registred Succesfully! but you have to verify him.'})
    } catch (e) {
        console.log(e)
        res.status(403).send({error:{message:'Invlaid Deatils Or server is down!! see console for error'}, e:e})
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
        const accessToken = await req.developer.generateToken()
        console.log(otp)
        res.send({message:`Welcome, ${req.developer.name}`, accessToken})
    } catch(e) {
        console.log(e)
        res.status(500).send({error:{message:'Server is down right now'}})
    }
})

router.get('/profile', authDeveloper, (req, res) =>{
    try{
        const developer = {message:`Welcome back ${req.developer.name}`,name: req.developer.name, email:req.developer.email, mobile:req.developer.phNumber}
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
        const accessToken = await req.developer.generateToken()
        
        res.send({accessToken, message:'Your password has been changed successfuly'})
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
        const unverifiedDev = await Developer.find({verificationStatus: false},{name:1,_id:1,email:1,phNumber:1})
        const unverifiedCts = await Customer.find({verificationStatus:false},{name:1,_id:1,email:1,phNumber:1})
        res.send({unverifiedDev, unverifiedCts})
    } catch(error){
        res.status(403).send({error:{message:'Something is worng', error:error.message}})
    }
})

router.get('/verifyCts/:id', authDeveloper, async (req, res)=>{
    try{
        
        const customer = await Customer.findByIdAndUpdate(
            {_id:req.params.id},
            {
                verificationStatus:true
            }) 
            
        await mail(customer.email,{
            head:'Welcome to DronePoint',
            msg:'Your are now a verified user and can use our services.Thankyou for choosing us'
        }, customer.name, 'Drone point Verification' )

        res.send({status:true})
    } catch(error){
        console.log(error)
        res.status(403).send({error:{message:'Something is worng', error:error.message}, status:false})
    }
})

router.get('/verifyDev/:id', authDeveloper, async (req, res)=>{
    try{
        const developer = await Developer.findByIdAndUpdate({_id:req.params.id},{verificationStatus:true,})

        await mail(developer.email,{
            head:'Welcome to DronePoint',
            msg:'Your are now a verified user and can use our services.Thankyou for choosing us'
        }, developer.name, 'Drone point Verification' )

        res.send({status:true})
    } catch(error){
        console.log(error)
        res.status(403).send({error:{message:'Something is worng', error:error.message, status:false}})
    }
})

// get keys and logs
router.get('/allKeys/:id', authDeveloper, async (req, res) =>{
    try{
        console.log(req.params.id)
        const modal = await Drone.findOne({_id:req.params.id}, {'keyRegistry.time':1, 'keyRegistry._id':1})
        if(!modal){
            return res.send({error:{message:'There is no key for this drone.'}})
        }

        res.send(modal)
    } catch {
        console.log(e)
        res.status(500).send({error:{message:"Something went wrong Please try again. This is an internal error"}})
    }
})

router.get('/allLogs/:id', authDeveloper, async (req, res) =>{
    try{
        console.log(req.params.id)
        const modal = await Drone.findOne({_id:req.params.id}, {'logRegistry.time':1, 'logRegistry._id':1})
        if(!modal){
            return res.send({error:{message:'There is no key for this drone.'}})
        }

        res.send(modal)
    } catch {
        console.log(e)
        res.status(500).send({error:{message:"Something went wrong Please try again. This is an internal error"}})
    }
})

router.get('/downloadKey' , async (req, res) =>{
    
    try{

        console.log(req.query)
        if(!req.query.kid|| !req.query.token ||!req.query.id){
            return res.send({error:{message:'Please provide valid key id, dorne id and your validation for key downlaod'}})
        }

        const token = req.query.token
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const developer = await Developer.findById(payload.id)
        if(!developer){
            return res.send({error:{message:'Pleae login'}})
        }

        const tokenExesist = developer.accessTokens.includes(token)
        if(!tokenExesist || !developer.verificationStatus){
            return res.send({error:{message:'Pleae login'}})
        }

        const id = req.query.id
        const { keyRegistry } = await Drone.findOne({_id:id}, {_id: 0, keyRegistry: {"$elemMatch": {_id: req.query.kid}}})

        console.log(keyRegistry)

        if(!keyRegistry[0]){
            return res.send({message:'There is no key availabe for this modal'})
        }

        let date = new Date(keyRegistry[0].time)
        let dateString = date.toLocaleDateString()

        res.set({
            encoding: keyRegistry[0].file.encoding,
            mimetype:keyRegistry[0].file.mimetype,
            orignalname:keyRegistry[0].file.orignalname,
            'Content-Disposition': 'attachment; filename=' + `key${dateString}.${keyRegistry[0].file.extname}`,
            size:keyRegistry[0].file.size
          })
     
          res.send(keyRegistry[0].file.buffer);
    } catch(e) {
        console.log(e)
        res.status(500).send({error:{message:"Something went wrong Please try again. This is an internal error"}})
    }
})

router.get('/downloadLog' , async (req, res) =>{
    
    try{

        if(!req.query.lid|| !req.query.token ||!req.query.id){
            return res.send({error:{message:'Please provide valid log id, dorne id and your validation for key downlaod'}})
        }

        const token = req.query.token
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const developer = await Developer.findById(payload.id)
        if(!developer){
            return res.send({error:{message:'Pleae login'}})
        }

        const tokenExesist = developer.accessTokens.includes(token)
        if(!tokenExesist || !developer.verificationStatus){
            return res.send({error:{message:'Pleae login'}})
        }

        const id = req.query.id
        const { logRegistry } = await Drone.findOne({_id:id}, {_id: 0, logRegistry: {"$elemMatch": {_id: req.query.lid}}})

        if(!logRegistry[0]){
            return res.send({message:'There is no log availabe for this modal'})
        }

        let date = new Date(logRegistry[0].time)
        let dateString = date.toLocaleDateString()

        res.set({
            encoding: logRegistry[0].file.encoding,
            mimetype:logRegistry[0].file.mimetype,
            orignalname:logRegistry[0].file.orignalname,
            'Content-Disposition': 'attachment; filename=' + `log${dateString}.${logRegistry[0].file.extname}`,
            size:logRegistry[0].file.size
          })
     
          res.send(logRegistry[0].file.buffer);
    } catch(e) {
        console.log(e)
        res.status(500).send({error:{message:"Something went wrong Please try again. This is an internal error"}})
    }
})

module.exports = router