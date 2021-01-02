const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Developer = require('./Developer')

const coustmerSchema = new mongoose.Schema({
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

coustmerSchema.methods.generateLoginToken = async function(otp){
    const coustmer = this
    const loginToken = await jwt.sign({id: coustmer._id}, 'hell', {
        algorithm: "HS256",
        expiresIn: "1 days"
    })

    coustmer.loginStatus.otp.time= Date.now()
    coustmer.loginStatus.otp.value = otp
    coustmer.loginStatus.loginToken = loginToken
    
    await coustmer.save()

    return loginToken
}

coustmerSchema.methods.changePasswordOtp = async function(otp){
    const coustmer = this

    coustmer.passwordChangeStatus.otp.value = otp
    coustmer.passwordChangeStatus.otp.time = Date.now()
    
    await coustmer.save()
}

coustmerSchema.methods.generateToken = async function(){
    const coustmer = this
    const accessToken = jwt.sign({id: coustmer._id}, process.env.ACCESS_TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: "1 days"
    })

    coustmer.loginStatus.otp.value = null
    coustmer.loginStatus.loginToken = null
    coustmer.accessTokens.push(accessToken.toString())
    await coustmer.save()

    return accessToken
}

coustmerSchema.methods.verifyCoustmer = async function(){
    const coustmer = this
    const verifyingPerson = await Developer.findById(coustmer.verification.verifierId)

    if(!verifyingPerson){
        return false
    } else {
        return true
    }
}

coustmerSchema.pre('save', async function (next) {
    const coustmer = this

    if(coustmer.isModified('password')) {
        coustmer.password = await bcrypt.hash(coustmer.password, 8)
    }

    next()
})


const Coustmer = mongoose.model('Coustmer', coustmerSchema)

module.exports = Coustmer