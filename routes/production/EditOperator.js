const EditOperator = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

// create application/json parser
var jsonParser = bodyParser.json()

//getALL ShiftIncharge
EditOperator.get ('/getOperator', jsonParser, (req, res, next) => {
    try {
        mchQueryMod(`SELECT * FROM magod_production.operator_list where Active='1' ORDER BY ID DESC`, (err, data) => {
            if (err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
    
});

//add
EditOperator.post('/addOperator', jsonParser, (req, res, next) => {
    try {
        // Check if the Name already exists
        mchQueryMod(`SELECT Name FROM magod_production.operator_list WHERE Name='${req.body.Name}' AND Active='1'`, (selectErr, selectData) => {
            if (selectErr) {
                logger.error(selectErr);
                return res.status(500).send('Internal Server Error');
            }

            if (selectData.length > 0) {
                // Name already exists, send the "already present" response
                res.send('Name already present');
            } else {
                // Name doesn't exist, proceed with the INSERT query
                mchQueryMod(`Insert into magod_production.operator_list (EmployeeID,Name,Skill_Level,Status) Values (0,'${req.body.Name}','${req.body.skilllevel}','${req.body.status}')`, (insertErr, insertData) => {
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

//add
// EditOperator.post('/addOperator', jsonParser, (req, res, next) => {
//     try {
//         mchQueryMod(`Insert into magod_production.operator_list (EmployeeID,Name,Skill_Level,Status) Values (0,'${req.body.Name}','${req.body.skilllevel}','${req.body.status}')`, (err, data) => {
//             if (err) logger.error(err);
//             res.send(data)
//         })
//     } catch (error) {
//         next(error)
//     }
// });


//save
EditOperator.post('/saveOperator', jsonParser, (req, res, next) => {
    // console.log("req.body", req.body);
    try {
        const { Name, Skill_Level, Status, ID } = req.body.rowselectOperator;
        // Update SQL query with proper syntax
        const query = `UPDATE magod_production.operator_list SET Name='${Name}', Skill_Level='${Skill_Level}', Status='${Status}' WHERE ID='${ID}'`;

        mchQueryMod(query, (err, data) => {
            if (err) {
                logger.error(err);
                return res.status(500).send({ error: 'Internal Server Error' });
            }
            res.send(data);
        });
    } catch (error) {
        logger.error(error);
        next(error);
    }
});

//delete 
EditOperator.post('/deleteOperator', jsonParser, (req, res, next) => {
    // console.log("deleteIncharge", req.body)
    try {
        const { ID } = req.body.rowselectOperator;
        mchQueryMod(`update magod_production.operator_list set Active='0' where ID='${ID}'`, (err, data) => {
            if (err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});


module.exports = EditOperator;