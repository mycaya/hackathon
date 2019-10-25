var express = require("express");
const router = express.Router();
var app = express();

router.get('/login', (req, res) => {
    res.sendFile(__dirname+'/login.html', {
        //environments: environments
    });
    });

module.exports = router;