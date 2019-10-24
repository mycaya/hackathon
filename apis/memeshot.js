var express = require('express')
 , async = require('async')
 , http = require('http');
const router = express.Router()
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded())
app.use(bodyParser.json())


//var router = require('express').Router();
app.get('/memeshot', function (req, res, next) {
      console.log('memeshot: '+(req.body));
      res.send('Hit memeshot: '+ req.body);
     //res.send('Hit catchr: '+(JSON.stringify(req.body)));
      const url = 'mongodb://localhost:27017'
      mongo.connect(url, (err, client) => {
          if (err) {
              console.error(err)
              }
          const db = client.db('figeur')
          const collection = db.collection('memes')
          collection.find().sort({created_on:-1}).limit(2).toArray((err, items) => {
      res.send(items);
    });
});
  })

  module.exports = router


