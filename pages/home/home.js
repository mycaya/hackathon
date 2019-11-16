var express = require("express");
var mongo = require('mongodb').MongoClient;
const router = express.Router();

router.get('/', (req, res) => {
    const url = 'mongodb://localhost:27017'
    mongo.connect(url, (err, client) => {
        if (err) {
            console.error(err)
            }
        res.render(__dirname+'/memes.hbs', {
            user: req.user
        });
        });
    });

module.exports = router;