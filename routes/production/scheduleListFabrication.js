const scheduleListFabrication = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')

// scheduleListFabrication.get('/schedulesList', async (req, res, next) => {
//     try {
//         misQueryMod(`select osd.OrdSchNo, c.Cust_name, osd.schTgtDate, osd.Delivery_Date ,  osd.Schedule_Status , ol.Type from magodmis.orderschedule osd
//         inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code
//         inner join magodmis.order_list ol on ol.Order_No = osd.Order_No
//         where ol.Type = 'Fabrication'`, (err, data) => {
//             if (err) logger.error(err);
//             const slicedArray = data.slice(0, 200);
//             res.send(slicedArray)
//         })
//     } catch (error) {
//         next(error)
//     }
// });

scheduleListFabrication.get('/schedulesList', async (req, res, next) => {
    try {
        misQueryMod(`SELECT o.*,c.Cust_name FROM magodmis.orderschedule o, magodmis.order_list o1,
        magodmis.cust_data c 
        WHERE (o.Schedule_Status='Tasked' OR o.Schedule_Status='Programmed' 
        OR o.Schedule_Status='Production' OR o.Schedule_Status='Processing' 
        OR o.Schedule_Status='Completed')
        AND c.cust_code=o.cust_code AND o.Order_No=o1.Order_No AND o1.Type='Fabrication' 
        ORDER BY o.Delivery_date;
        `, (err, data) => {
            if (err) logger.error(err);
            const slicedArray = data.slice(0, 200);
            res.send(slicedArray)
        })
    } catch (error) {
        next(error)
    }
});






module.exports = scheduleListFabrication;