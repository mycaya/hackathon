var express = require("express");
var mongo = require('mongodb').MongoClient;
const router = express.Router();

router.get('/meme', (req, res) => {
    const url = 'mongodb://localhost:27017'
    mongo.connect(url, (err, client) => {
        if (err) {
            console.error(err)
            }
        const db = client.db('figeur')
        const collection = db.collection('memes')
        collection.find().sort({created_on:-1, likes:-1,}).limit(10).toArray((err, items) => {
        res.render(__dirname+'/meme.hbs', {
            items: items,
            user: req.user,
            session: req.sessionID
        });
        console.log(req.sessionID)
        //res.sendFile(__dirname+'/memes.html', {
            //environments: environments
        //});
        });
        });
    });

module.exports = router;