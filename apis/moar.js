var express = require('express')
 , async = require('async')
 , http = require('http');
const router = express.Router()
var mongo = require('mongodb').MongoClient;
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded())
app.use(bodyParser.json())


//var router = require('express').Router();
router.post('/moar', function (req, res, next) {
      console.log('moar: '+(JSON.stringify(req.body)));
     //res.send('Hit catchr: '+(JSON.stringify(req.body)));

     const url = 'mongodb://localhost:27017';
     const id = (JSON.stringify(req.body));
     mongo.connect(url, (err, client) => {
       if (err) {
           console.error(err)
           }
       const db = client.db('figeur')
       const collection = db.collection('likes')
               let doc = {
                id: id
               };
               console.log(doc);
               collection.insert(doc, (err, doc) => {
               //res.json(doc);
               });
   });
});


  module.exports = router

