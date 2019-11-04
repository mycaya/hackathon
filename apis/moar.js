var express = require('express')
 , async = require('async')
 , http = require('http');
const router = express.Router()
var mongo = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded())
app.use(bodyParser.json())


//var router = require('express').Router();
router.post('/moar', function (req, res, next) {
     const url = 'mongodb://localhost:27017';
     const id = req.body.id;
     var o_id = new ObjectID(id);
     mongo.connect(url, (err, client) => {
       if (err) {
           console.error(err)
           }
       const db = client.db('figeur')
       const likes = db.collection('likes')
       const memes = db.collection('memes')
       likes.findOne({ id: (id) }, (err, match) => {
        if(match){
            likes.updateOne(
                { id: (id) },
                { $inc:{ likes: 1 }}
             )  
            }else{
                likes.insertOne(
                    { id: (id), likes: 1}
                 )  
                }});
        
memes.updateOne(
                            { '_id': o_id },
                            { $inc:{ likes: 1 }}
                         )  


   });
});


  module.exports = router

