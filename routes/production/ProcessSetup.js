const processSetup = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

// create application/json parser
var jsonParser = bodyParser.json()


processSetup.post('/addProcess', jsonParser, (req, res, next) => {
    // console.log(req.body);
    try {
        mchQueryMod(`Insert into machine_data.magod_process_list(ProcessID,ProcessDescription,RawMaterial,Service,MultiOperation,Profile,No_of_Operations,Active) values('${req.body.ProcessID}','${req.body.ProcessDescription}','${req.body.RawMaterial}',0,0,0,'${req.body.No_of_Operations}',1)`, (err, data) => {
            if (err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

processSetup.post('/SavedProcess', jsonParser, (req, res, next) => {
    try {
        // Determine the values for MultiOperation and No_of_Operations based on Service and Profile
        // let multiOperationValue = req.body.Service === 1 && req.body.Profile === 1 ? 1 : 0;
        // let noOfOperationsValue = req.body.Service === 1 && req.body.Profile === 1 ? 2 : 1;


        mchQueryMod(`UPDATE machine_data.magod_process_list 
            SET Service='${req.body.Service}', Profile='${req.body.Profile}',
                MultiOperation=${req.body.fabrication}, No_of_Operations=${req.body.selectRow.No_of_Operations} where ID='${req.body.ID}'`,
            (err, data) => {
                if (err) logger.error(err);
                res.send(data);
            });
    } catch (error) {
        next(error);
    }
});


processSetup.post('/deleteProcess', jsonParser, (req, res, next) => {
    try {
        mchQueryMod(`UPDATE machine_data.magod_process_list 
        SET Active='0' where ID='${req.body.ID}'`, (err, data) => {
            if (err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});



module.exports = processSetup;