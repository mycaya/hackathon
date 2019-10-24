var express = require("express");
var mongo = require('mongodb').MongoClient;
const router = express.Router();

router.get('/s3', (req, res) => {
        res.render(__dirname+'/s3.hbs', {
        });
        //res.sendFile(__dirname+'/memes.html', {
            //environments: environments
        //});
    });

module.exports = router;