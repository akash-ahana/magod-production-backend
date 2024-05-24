const location = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod,productionQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

location.post('/getlocation', jsonParser, async (req, res, next) => {
    // console.log("Delete Reason", req.body);
    try {
      mchQueryMod(`SELECT * FROM magod_setup.unit_info where Current='-1'`, (err, data) => {
        if (err) logger.error(err);
        // console.log(data.length)
        res.send(data);
      });
    } catch (error) {
      next(error);
    }
  });


module.exports = location;