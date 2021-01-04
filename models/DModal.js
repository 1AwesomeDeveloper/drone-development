const mongoose = require('mongoose')

const droneSchema = new mongoose.Schema({
    modalName:{
        type:String,
        required:true,
        uppercase:true,
        unique:[true, 'This modal is already registerd']
    },
    modalNumber:{
        type:String,
        required:true,
        uppercase:true,
    },
    wingType:{
        type:String,
        // enum:['some', '2', '1', '3'],
        required:true
    },
    maxTakeOffWeight:{
        type:Number,
        required:true
    },
    maxHeightAttainable:{
        type:Number,
        required:true
    },
    compatiblePayload:{
        type:Number,
        required:true
    },
    droneCategoryType:{
        type:String,
        // enum:['Nano(+250g)'],
        required:true
    },
    RPASModelPhoto:{
        type:String,
        //required:true
    },
    pursposeOfOperation:{
        type:String,
        required:true
    },
    engineType:{
        type:String,
        required:true
    },
    enginePower:{
        type:Number,
        required:true
    },
    engineCount:{
        type:Number,
        required:true
    },
    fuelCapacity:{
        type:Number,
        required:true
    },
    propellerDetails:{
        type:String,
        required:true
    },
    maxEndurance:{
        type:Number,
        required:true
    },
    maxRange:{
        type:Number,
        required:true
    },
    maxSpeed:{
        type:Number,
        required:true
    },
    length:{
        type:Number,
        required:true
    },
    breadth:{
        type:Number,
        required:true
    },
    height:{
        type:Number,
        required:true
    },
    inAir:{
        type:Number,
        default:0
    }
})

const DModal = mongoose.model('DModal', droneSchema)

module.exports = DModal