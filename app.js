const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const developer = require('./routes/developer')
const customer = require('./routes/customer')
const drone = require('./routes/drone')

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.get('/', (req, res) =>{
    try{
        console.log("woo") 
        res.send({message:'Welcome to Drone managment Service'})}
    catch(e){ res.status(500).send('Server is down right now')}
})

app.use('/developer', developer)
app.use('/customer', customer)
app.use('/drone', drone)

mongoose.connect(process.env.MONGO_URL, 
    {
        useCreateIndex: true,
        useNewUrlParser: true, 
        useUnifiedTopology: true
    }).then(response=>{
        console.log('connected to database')
    }).catch(e =>{
        console.log(e)
    })

app.listen(process.env.PORT, ()=>{console.log(`app is running on port ${process.env.PORT}`)})