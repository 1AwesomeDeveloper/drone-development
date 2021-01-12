const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Developer = require('./Developer')

const customerSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    phNumber:{
        type:Number,
        minlength:10,
        maxlength:10
    },
    email:{
        type:String,
        lowercase:true,
        trim:true,
        required:true
    },
    verificationStatus:{
        type:Boolean,
        default:false
    },
    password:{
        type:String
    },
    loginStatus:{
        loginToken:{
            type:String,
            default:''
        },
        otp:{
            time:{
                type:Date
            },
            value:{
                type:Number,
                minlength:5,
                maxlength:5,
                default: 00000
            }
        }
    },
    passwordChangeStatus:{
        passwordToken:{
            type:String,
            default:''
        },
        otp:{
            time:{
                type:Date
            },
            value:{
                type:Number,
                minlength:5,
                maxlength:5
            }
        }
    },
    accessTokens:[String]
})

customerSchema.methods.generateLoginToken = async function(otp){
    const customer = this
    const loginToken = await jwt.sign({id: customer._id}, 'hell', {
        algorithm: "HS256",
        expiresIn: "1 days"
    })

    customer.loginStatus.otp.time= Date.now()
    customer.loginStatus.otp.value = otp
    customer.loginStatus.loginToken = loginToken
    
    await customer.save()

    return loginToken
}

customerSchema.methods.changePasswordOtp = async function(otp){
    const customer = this

    customer.passwordChangeStatus.otp.value = otp
    customer.passwordChangeStatus.otp.time = Date.now()
    
    await customer.save()
}

customerSchema.methods.generateToken = async function(){
    const customer = this
    const accessToken = jwt.sign({id: customer._id}, process.env.ACCESS_TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: "1800000"
    })

    customer.loginStatus.otp.value = null
    customer.loginStatus.loginToken = null
    customer.accessTokens.push(accessToken.toString())
    await customer.save()

    return accessToken
}

customerSchema.methods.verifyCustomer = async function(){
    const customer = this
    const verifyingPerson = await Developer.findById(customer.verification.verifierId)

    if(!verifyingPerson){
        return false
    } else {
        return true
    }
}

customerSchema.pre('save', async function (next) {
    const customer = this

    if(customer.isModified('password')) {
        customer.password = await bcrypt.hash(customer.password, 8)
    }

    next()
})


const Customer = mongoose.model('Customer', customerSchema)

module.exports = Customer