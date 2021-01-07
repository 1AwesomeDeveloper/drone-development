const express = require('express')
const validator = require('validator')
const router = express.Router()

const { authDeveloper } = require('../middlware/dev_authentcation')
const upload = require('../middlware/imgaes')
const DgcaCall = require('../middlware/DgcaCall')

const DModal = require('../models/DModal')
const Drone = require('../models/Drone')
const Customer = require('../models/Customer')

//********************************************************* */
// Routes for different dorne modals*********************** */

router.post('/modalRegestration', upload, authDeveloper, async (req, res)=>{
    try{
        const obj = JSON.parse(JSON.stringify(req.body))
        for(var key in obj){
            if(!obj[key] || obj[key] == ""){
                console.log(obj[key], key)
                return res.send({message:`Please check ${key}`})
            }
        }
        console.log()

        obj.modalName = obj.modalName.toString()
        obj.modalNumber = obj.modalNumber.toString()
        obj.wingType = obj.wingType.toString()
        obj.droneCategoryType = obj.droneCategoryType.toString()
        obj.purposeOfOperation = obj.purposeOfOperation.toString()
        obj.engineType = obj.engineType.toString()

        if(req.file){
            obj.RPASModelPhoto = req.file.buffer.toString('base64')
        }
        
        const newModal = new DModal(obj)
        await newModal.save()

        res.send({message:`Your ${newModal.modalName} is reigstered.`})
    } catch (e) {
        if(e.MulterError){
            console.log('multer')
        }
        console.log(e)
        res.status(400).send({error:{message:'Please check the image type and size', error:e}})
    }
    
})

router.get('/viewModals', authDeveloper,async (req, res) =>{
    try{
        const modals = await DModal.find()
        
        res.send({modals:modals})
    } catch(e) {
        console.log(e)
        res.send(403).send({error:{message:'something went worng', error: e}})
    }
})

router.delete('/removeModal/:id', authDeveloper, async (req, res) =>{
    try {
        const removedModal = await DModal.findByIdAndDelete(req.params.id)
        res.send({message:`Your Modal with Name:${removedModal.modalName} and Modal Number:${removedModal.modalNumber} is removed Succesfully!`})
    } catch (error) {
        console.log(e)
        res.status(403).send({error:{message:'Something is worng', error: e}})
    }
})

router.get('/modals', authDeveloper, async (req, res) =>{
    try{
        const modalNames = await DModal.find({}, {modalName:1, _id:1})
        console.log(`req`)
        res.send({modalNames})
    } catch(e) {
        console.log(e)
        res.send(403).send({error:{message:'something went worng', error: e}})
    }
})

//********************************************************* */
// Routes for New Drones           *********************** */

router.post('/droneRegestration', authDeveloper, async (req, res) =>{
    try{
        const modal = await DModal.findOne({modalName: req.body.modal})
        if(!modal){
            return res.send({error:{message:"Modal of such Name not found."}})
        }

        const customer = await Customer.findOne({email:req.body.assignedTo})
        if(!customer){
            return res.status(403).send({error:{message:"Please provide a valid email for assignment."}})
        }
        
        req.body.modalId = modal._id
        //to be generated 128 bit and hex
        var UUID = (Math.floor((Math.random() * 0x100000000000000000000000000000000) + 1)).toString(16).toUpperCase();
        var droneExesist = await Drone.findOne({UUID: UUID})
        

       while(droneExesist){
            UIID = (Math.floor((Math.random() * 0x100000000000000000000000000000000) + 1)).toString(16).toUpperCase();
            droneExesist = await Drone.findOne({UUID: UUID}) 
        }
        req.body.UUID = UUID

        const drone = new Drone(req.body)
        //console.log(drone)

        let body = {
            drone : {
                droneTypeId: drone.droneNo,
                version : "1",
                txn: drone.UUID,
                deviceId: drone._id.toString(),
                deviceModelId: drone.modal,
                operatorBusinessIdentifier : "ThisIsATestDroneP123"
              },
                //signature : "[Base64 Encoded Digital Signature(SHA256withRSA signed)of the drone data in raw json form and is a mandatory string attribute]" ,
                //digitalCertificate : "[Base64 Encoded X509 Certificate of the manufacturer and is a mandatory string attribute]"
          }

          const status = await DgcaCall.verifyDroneRegestration(body)
          //console.log(status)
        //   if(status == -1 ){
        //       return res.status(400).send({error:{message: "Please check your info, rejected by DGCA"}})
        //   }
        //   else if(status == 0 ){
        //       return res.send({error:{message:"Server is down right now"}})
        //   }

        await drone.save()

        res.send({message:'Your Drone is registered'})
    } catch(e) {
        console.log(e)
        res.status(400).send({error:{message:'Something is wrong', error: e}})
    }
})

router.get('/viewDrones', authDeveloper, async (req, res) =>{
    try{
        const drones = await Drone.find({}, {_id: 1, modal: 1, assignedTo: 1, droneNo:1})
        res.send(drones)
    } catch(e) {
        console.log(e)
        res.status(403).send({error:{message:'Something is worng', error: e}})
    }
})

router.get('/droneDetails/:id', authDeveloper, async (req, res) => {
    try{
        if(!req.params.id){
            return res.send({error:{message:'Please provide drone Id'}})
        }
        const drone = await Drone.findById(req.params.id)
        if(!drone){
            return res.status(400).send({error:{message:'no modal with this name exesist'}})
        }

        res.send(drone)
    } catch(e){
        console.log(e)
        res.status(500).send({error:e})
    }
})

router.delete('/deRegisterDrone/:id', authDeveloper, async (req, res) =>{
    try {
        if(!req.params.id){
            return res.send({error:{message:'Please provide drone Id'}})
        }

        const drone = await Drone.findById(req.params.id)
        if(!drone){
            return res.status(400).send({error:{message:'This Drone is not present on our base'}})
        }

        let body = {
            drone : {
                droneTypeId: drone.droneNo,
                version : "1",
                txn: drone.UUID,
                deviceId: drone._id.toString(),
                deviceModelId: drone.modal,
                operatorBusinessIdentifier : "ThisIsATestDroneP123"
              },
                //signature : "[Base64 Encoded Digital Signature(SHA256withRSA signed)of the drone data in raw json form and is a mandatory string attribute]" ,
                //digitalCertificate : "[Base64 Encoded X509 Certificate of the manufacturer and is a mandatory string attribute]"
          }

        //   const status = await DgcaCall.verifyDroneDeregestration(body)
        //   //console.log(status)
        //   if(status == -1 ){
        //       return res.status(400).send({error:{message: "Please check your info."}})
        //   }
        //   else if(status == 0 ){
        //       return res.send({error:{message:"Server is down right now!!"}})
        //   }

        res.send({message:`Your dore with ID:${drone.droneId} and Modal:${drone.modal} is removed Succesfully.`})
    } catch (error) {
        console.log(e)
        res.status(403).send({error:{message:'Something is wrong', error:error.message}})
    }
})



module.exports = router