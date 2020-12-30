const mongoose = require('mongoose')

const droneShema = new mongoose.Schema({
    modal:{
        type:String,
        required:true
    },
    //earlier it was modal id
    // still we store modal id in it
    modalId:{
        type:String,
        required:true
    },
    //earlier it was drone id
    //128bit hex autogenerate
    UUID:{
        type:String,
        required:true
    },
    //drone no is controller no provided by front end
    droneNo:{
        type:Number,
        required:true
    },
    manufactringDate:{
        type:Date,
        required:true
    },
    manufactringBatch:{
        type:String,
        required:true
    },
    manufactringShift:{
        type:String,
        required:true
    },
    serialNumber:{
        type:Number,
        required:true
    },
    hardMake:{
        type:Number,
        required:true
    },
    hardVersion:{
        type:Number,
        required:true
    },
    hardSerialNumber:{
        type:Number,
        required:true
    },
    softMake:{
        type:Number,
        required:true
    },
    softVersion:{
        type:Number,
        required:true
    },
    softSerialNumber:{
        type:Number,
        required:true
    },
    assignedTo:{
        type:String,
        required:true
    },
    /* registered:{
        type:Boolean,
        default:false,
        required:true
    }, */
    accessDates:[{
        type:Date
    }]
})

const Drone = mongoose.model('Drone', droneShema)

module.exports = Drone