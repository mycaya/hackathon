var express = require('express')
 , async = require('async')
 , http = require('http');
const router = express.Router()
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded())
app.use(bodyParser.json())

//var router = require('express').Router();
app.post('/catchr', function (req, res, next) {
      console.log('Hit catchr: '+(req.body));
      //res.send('Hit catchr: '+(JSON.stringify(req.body)));
      res.send('Hit catchr: '+ req.body);
  })

  module.exports = router


