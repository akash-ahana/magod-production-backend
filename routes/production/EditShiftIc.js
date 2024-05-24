const EditShiftIc = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

// create application/json parser
var jsonParser = bodyParser.json()

//getALL ShiftIncharge
EditShiftIc.get ('/getShiftIc', jsonParser, (req, res, next) => {
    try {
        mchQueryMod(`SELECT * FROM magod_production.shift_ic_list where Active='1' ORDER BY ID DESC`, (err, data) => {
            if (err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
    
});

//add
EditShiftIc.post('/addShiftIncharge', jsonParser, (req, res, next) => {
    try {
        // Check if the Name already exists
        mchQueryMod(`SELECT Name FROM magod_production.shift_ic_list WHERE Name='${req.body.Name}' AND Active='1'`, (selectErr, selectData) => {
            if (selectErr) {
                logger.error(selectErr);
                return res.status(500).send('Internal Server Error');
            }

            if (selectData.length > 0) {
                // Name already exists, send the "already present" response
                res.send('Name already present');
            } else {
                // Name doesn't exist, proceed with the INSERT query
                mchQueryMod(`INSERT INTO magod_production.shift_ic_list (EmployeeID, Name, Skill_Level, Status) VALUES (0, '${req.body.Name}', '${req.body.skilllevel}', '${req.body.status}')`, (insertErr, insertData) => {
                    if (insertErr) {
                        logger.error(insertErr);
                        return res.status(500).send('Internal Server Error');
                    }
                    res.send('Insert successful');
                });
            }
        });
    } catch (error) {
        next(error);
    }
});


//save
EditShiftIc.post('/saveShiftIncharge', jsonParser, (req, res, next) => {
    // console.log("save", req.body.rowselectShiftIc);

    try {
        mchQueryMod(`
            UPDATE magod_production.shift_ic_list 
            SET Name='${req.body.rowselectShiftIc.Name}',
                Skill_Level='${req.body.rowselectShiftIc.Skill_Level}', 
                Status='${req.body.rowselectShiftIc.Status}' 
            WHERE ID='${req.body.rowselectShiftIc.ID}'
        `, (err, data) => {
            if (err) {
                logger.error(err);
                res.status(500).send(err); // Sending an error response to the client
            } else {
                res.send(data);
                // console.log(data);
            }
        });
    } catch (error) {
        next(error);
    }
});

//delete
EditShiftIc.post('/deleteIncharge', jsonParser, (req, res, next) => {
    // console.log("deleteIncharge", req.body)
    try {
        const { ID } = req.body.rowselectShiftIc;
        mchQueryMod(`update magod_production.shift_ic_list set Active='0' where ID='${ID}'`, (err, data) => {
            if (err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});



module.exports = EditShiftIc;