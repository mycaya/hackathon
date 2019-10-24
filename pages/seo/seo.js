var express = require("express");
const router = express.Router();

router.get('/sitemap.txt', (req, res) => {
        res.sendFile(__dirname+'/sitemap.txt', {
        });
    });

module.exports = router;