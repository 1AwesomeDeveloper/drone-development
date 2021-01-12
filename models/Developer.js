const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const developerSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    phNumber:{
        type:Number,
        required:true
    },
    email:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        unique:[true,'Invalid Email']
    },
    password:{
        type:String,
        required:true,
        minlen:[8, 'password is too short']
    },
    verificationStatus:{
        type: Boolean,
        require:true,
        default:false
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

developerSchema.methods.generateLoginToken = async function(otp){
    const developer = this
    const loginToken = await jwt.sign({id: developer._id}, 'hell', {
        algorithm: "HS256",
        expiresIn: "1 days"
    })

    developer.loginStatus.otp.time= Date.now()
    developer.loginStatus.otp.value = otp
    developer.loginStatus.loginToken = loginToken
    
    await developer.save()

    return loginToken
}

developerSchema.methods.changePasswordOtp = async function(otp){
    const developer = this

    developer.passwordChangeStatus.otp.value = otp
    developer.passwordChangeStatus.otp.time = Date.now()
    
    await developer.save()
}

developerSchema.methods.generateToken = async function(){
    const developer = this
    const accessToken = jwt.sign({id: developer._id}, process.env.ACCESS_TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: "900000"
    })

    developer.loginStatus.otp.value = null
    developer.loginStatus.loginToken = null
    developer.accessTokens.push(accessToken.toString())
    await developer.save()

    return accessToken
}

developerSchema.pre('save', async function (next) {
    const developer = this

    if(developer.isModified('password')) {
        developer.password = await bcrypt.hash(developer.password, 8)
    }
    

    next()
})

const Developer = mongoose.model('Developer', developerSchema)

module.exports = Developer