const testRoute = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod , productionQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

var jsonParser = bodyParser.json()

testRoute.post('/testRoute', jsonParser ,  async (req, res, next) => {
    console.log('/testRoute' , req.body) 


    //  try {
    //      misQueryMod(`Select * from magodmis.day_shiftregister where ShiftDate = '${req.body.ShiftDate}' && Shift = '${req.body.Shift}'`, (err, data) => {
    //          if (err) logger.error(err);
    //          console.log(data)
    //          res.send(data) 
    //      })
    //  } catch (error) { 
    //      next(error) 
    //  }
    
 });

module.exports = testRoute; 