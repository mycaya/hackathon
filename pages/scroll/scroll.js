var express = require("express");
var mongo = require('mongodb').MongoClient;
const router = express.Router();

router.get('/scroll', (req, res) => {
    const url = 'mongodb://localhost:27017'
    mongo.connect(url, (err, client) => {
        if (err) {
            console.error(err)
            }
        const db = client.db('figeur')
        const collection = db.collection('memes')
        collection.find().sort({created_on:-1, likes:-1,}).limit(15).toArray((err, items) => {
        res.render(__dirname+'/scroll.hbs', {
            items: items,
            user: req.user
        });
        //res.sendFile(__dirname+'/memes.html', {
            //environments: environments
        //});
        });
        });
    });

module.exports = router;