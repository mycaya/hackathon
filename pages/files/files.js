var express = require("express");
const router = express.Router();

router.get('/Decision-Tree_Autosys.vsdx', (req, res) => {
        res.sendFile(__dirname+'/Decision-Tree_Autosys.vsdx', {
        });
    });

module.exports = router;