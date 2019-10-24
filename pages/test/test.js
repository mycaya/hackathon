var express = require("express");
const router = express.Router();
var app = express();

router.get('/test', (req, res) => {
    res.sendFile(__dirname+'/test.html', {
        //environments: environments
    });
    });

module.exports = router;