//manufacturerbusinessIdentifier to be added
//in drone routes get txn from manufacturer
//in drone routes signature and digital certificate is missing
const axios = require('axios')

const Dgcacall = {
    verifyDroneRegestration,
    verifyDroneDeregestration
}

async function verifyDroneRegestration(body) {
    var status = 0;
    await axios({
        method:'post',
        url:'https://digitalsky.dgca.gov.in/api/droneDevice/register/<manufacturerBusinessIdentifier>',
        header:{
            contenType: 'application/json'
        },
        data:body
    })
    .then(response =>{
        console.log("success")
        console.log(response.data)
        status = 1
    }).catch(e => {
        console.log("fail")
        console.log(e.request.outputData.forEach(element => {
          console.log(element)  
        }))
        status = -1
    })

    return status
}

async function verifyDroneDeregestration(body){
    var status = 0;
    await axios({
        method:'patch',
        url:'https://digitalsky.dgca.gov.in/api/droneDevice/deregister/<manufacturerBusinessIdentifier>',
        header:{
            contenType: 'application/json'
        },
        data:body
    })
    .then(response =>{
        console.log("success")
        console.log(response.data)
        status = 1
    }).catch(e => {
        console.log("fail")
        console.log(e)
        status = -1
    })

    return status
}

module.exports = Dgcacall