const scheduleListFabrication = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()


scheduleListFabrication.post("/getSchedulesByCustomer", jsonParser , async (req, res, next) => {
    // console.log('/getSchedulesByCustomer', req.body)
    try {
        misQueryMod(`SELECT o.*, c.Cust_name 
        FROM magodmis.orderschedule o, magodmis.order_list o1, magodmis.cust_data c 
        WHERE (o.Schedule_Status='Tasked' OR o.Schedule_Status='Programmed' 
               OR o.Schedule_Status='Production' OR o.Schedule_Status='Processing')
               AND c.cust_code=o.cust_code AND o.Order_No=o1.Order_No 
               AND o1.Type='Fabrication' AND c.Cust_Code='${req.body.Cust_Code}'
        ORDER BY o.Delivery_date
        `, (err, data) => {
            if (err) logger.error(err);
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
        })
    } catch (error) {
        next(error)    
    }
  }); 



scheduleListFabrication.get('/schedulesList', async (req, res, next) => {
    try {
        misQueryMod(`SELECT o.*,c.Cust_name FROM magodmis.orderschedule o,
        magodmis.cust_data c 
        WHERE (o.Schedule_Status='Tasked' OR o.Schedule_Status='Programmed' 
        OR o.Schedule_Status='Production' OR o.Schedule_Status='Processing' OR o.Schedule_Status='Completed' )
        AND c.cust_code=o.cust_code AND o.Type='Fabrication' 
        ORDER BY o.Delivery_date DESC;
        `, (err, data) => {
            if (err) logger.error(err);
            res.send(data);
        })
    } catch (error) {
        next(error)
    }
});






module.exports = scheduleListFabrication;