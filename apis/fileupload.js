const express = require('express')
const router = express.Router()
const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
var mongo = require('mongodb').MongoClient;
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded())
app.use(bodyParser.json())


const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION
})

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'figeur',
    contentType: multerS3.AUTO_CONTENT_TYPE,

    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname })
    },
    key: (req, file, cb) => {
      //2nd argument is what the file is named. Prefice with '<folder-name>/' + for dropping into folder
      cb(null, file.originalname)
    }
  })
})

// Upload a file
router.post('/upload', upload.array('files'/*maxnumberofuploads, 3*/), (req, res) => {
  
  if (!req.files) res.status(400).json({ error: 'No files were uploaded.' })
  req.files.forEach(function(thiselement, index){
  const url = 'mongodb://localhost:27017'
  mongo.connect(url, (err, client) => {
    if (err) {
        console.error(err)
        }
    const db = client.db('figeur')
    const collection = db.collection('memes')
            let doc = {
                link: "https://figeur.s3.us-east-2.amazonaws.com/"+thiselement.originalname,
                'created_on' : new Date()
            };
            console.log(doc);
            collection.insert(doc, (err, doc) => {
            //res.json(doc);
            });
});
});
res.redirect("/");
  /*res.status(201).json({
    message: 'Successfully uploaded ' + req.files.length + ' files!',
    files: req.files
  })*/
})

module.exports = router


const AWS = require('aws-sdk');
const Busboy = require('busboy');

const BUCKET_NAME = 'figeur';
const IAM_USER_KEY = 'AKIA6NNN2THAIUWJYZJL';
const IAM_USER_SECRET = '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';
const AWS_DEFAULT_REGION = 'us-east-2';

function uploadToS3(file) {
  let s3bucket = new AWS.S3({
    accessKeyId: IAM_USER_KEY,
    secretAccessKey: IAM_USER_SECRET,
    Bucket: BUCKET_NAME,
    region: AWS_DEFAULT_REGION
  });
  s3bucket.createBucket(function () {
      var params = {
        Bucket: BUCKET_NAME,
        region: AWS_DEFAULT_REGION,
        Key: file.name,
        Body: file.data
      };
      s3bucket.upload(params, function (err, data) {
        if (err) {
          console.log('error in callback');
          console.log(err);
        }
        console.log('success');
        console.log(data);
      });
  });
}
/*
//var router = require('express').Router();
router.post('/api/upload', function (req, res, next) {
    // This grabs the additional parameters so in this case passing in
    // "element1" with a value.
    const element1 = req.body.element1;

    var busboy = new Busboy({ headers: req.headers });

    // The file upload has completed
    busboy.on('finish', function() {
      console.log('Upload finished');
      
      // Your files are stored in req.files. In this case,
      // you only have one and it's req.files.element2:
      // This returns:
      // {
      //    element2: {
      //      data: ...contents of the file...,
      //      name: 'Example.jpg',
      //      encoding: '7bit',
      //      mimetype: 'image/png',
      //      truncated: false,
      //      size: 959480
      //    }
      // }
      
      // Grabs your file object from the request.
      const file = req.files.element2;


      console.log("flie!:" + file);
      
      // Begins the upload to the AWS S3
      uploadToS3(file);
    });
    //Commented out to avoid res.json
    //req.pipe(busboy);
  })
*/
  module.exports = router


