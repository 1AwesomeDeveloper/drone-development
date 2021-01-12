const multer = require('multer')
const path = require('path')

const upload  = multer({
    limits:{fileSize: 1000000},
    fileFilter: function(req, file, cb){
        checkFileType(file, cb, req)
    }
}).single('imagePic') //this is name attribute of input in from where file is uploaded


function checkFileType(file, cb, req){
    // allowed exte
    const fileTypes = /image|jpeg|jpg|png|gif/
    //check ext
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase())

    //check mine type
    const mimeType = fileTypes.test(file.mimetype)

    if(mimeType && extname){
        return cb(null, true)
    } else {
        req.errorMessage = 'Please provide jpeg/jpg/png type image of less than 1MB'
        return cb(true, true)
    }
}

module.exports = upload