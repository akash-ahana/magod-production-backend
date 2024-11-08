const scheduleListService = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

// scheduleListService.get('/schedulesList', async (req, res, next) => {
//     try {
//         misQueryMod(`select osd.OrdSchNo, c.Cust_name, osd.schTgtDate, osd.Delivery_Date ,  osd.Schedule_Status , ol.Type from magodmis.orderschedule osd
//         inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code
//         inner join magodmis.order_list ol on ol.Order_No = osd.Order_No
//         where ol.Type = 'Service'`, (err, data) => {
//             if (err) logger.error(err);
//             console.log('data length is ' , data.length)
//             const slicedArray = data.slice(0, 200);
//             res.send(slicedArray);
//         })
//     } catch (error) {
//         next(error)
//     }

// });

scheduleListService.post("/getSchedulesByCustomer", jsonParser , async (req, res, next) => {
    // console.log('/getSchedulesByCustomer service', req.body)
    try {
        misQueryMod(`SELECT o.*, c.Cust_name 
        FROM magodmis.orderschedule o, magodmis.order_list o1, magodmis.cust_data c 
        WHERE (o.Schedule_Status='Tasked' OR o.Schedule_Status='Programmed' 
               OR o.Schedule_Status='Production' OR o.Schedule_Status='Processing')
               AND c.cust_code=o.cust_code AND o.Order_No=o1.Order_No 
               AND o1.Type='Service' AND c.Cust_Code='${req.body.Cust_Code}'
        ORDER BY o.Delivery_date
        `, (err, data) => {
            if (err) logger.error(err);
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
            // console.log("response is",data);
        })
    } catch (error) {
        next(error)    
    }
  });  
  

scheduleListService.get('/schedulesList', async (req, res, next) => {
    try {
        misQueryMod(`SELECT o.*,c.Cust_name FROM magodmis.orderschedule o,
        magodmis.cust_data c 
        WHERE (o.Schedule_Status='Tasked' OR o.Schedule_Status='Programmed' 
        OR o.Schedule_Status='Production' OR o.Schedule_Status='Processing' OR o.Schedule_Status='Completed' )
        AND c.cust_code=o.cust_code  AND o.Type='Service' 
        ORDER BY o.Delivery_date DESC`, (err, data) => {
            if (err) logger.error(err);
            res.send(data);
        })
    } catch (error) {
        next(error)
    }

});

scheduleListService.post('/schedulesListSecondTableService', jsonParser ,  async (req, res, next) => {
    // console.log('schedulesListSecondTablesService' , req.body)
    try {
        misQueryMod(`SELECT * FROM magodmis.nc_task_list where ScheduleNo = '${req.body.ScheduleID}' `, (err, data) => {
            if (err) logger.error(err);
            res.send(data) 
        }) 
    } catch (error) {
        next(error)    
    }
}); 

scheduleListService.get('/schedulesListStatusProgrammedService', async (req, res, next) => {
    // console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`SELECT *, c.Cust_name
        FROM magodmis.orderschedule osd
        INNER JOIN magodmis.cust_data c ON c.Cust_Code = osd.Cust_Code
        WHERE osd.Type = 'Service'
          AND osd.Schedule_Status = 'Programmed'
          AND osd.Delivery_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
        ORDER BY osd.Delivery_date`, (err, data) => {
            if (err) logger.error(err);
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

scheduleListService.get('/schedulesListStatusCompletedService', async (req, res, next) => {
    // console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`select * , c.Cust_name ,DATE_FORMAT(osd.schTgtDate, '%d/%m/%Y') AS schTgtDate,
        DATE_FORMAT(osd.Delivery_date, '%d/%m/%Y') AS Delivery_Date  from magodmis.orderschedule osd inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code where osd.Type='Service' && osd.Schedule_Status = 'Completed'  AND osd.Delivery_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)  order by osd.Delivery_date`, (err, data) => {
            if (err) logger.error(err);
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

scheduleListService.get('/schedulesListStatusProductionService', async (req, res, next) => {
    // console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`SELECT *, c.Cust_name,DATE_FORMAT(osd.schTgtDate, '%d/%m/%Y') AS schTgtDate,
        DATE_FORMAT(osd.Delivery_date, '%d/%m/%Y') AS Delivery_Date
        FROM magodmis.orderschedule osd
        INNER JOIN magodmis.cust_data c ON c.Cust_Code = osd.Cust_Code
        WHERE osd.Type = 'Service'
          AND osd.Schedule_Status = 'Production'
          AND osd.Delivery_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
        ORDER BY osd.Delivery_date;`, (err, data) => {
            if (err) logger.error(err);
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
        })
    } catch (error) { 
        next(error)  
    }
});

scheduleListService.get('/schedulesListStatusTaskedService', async (req, res, next) => {
    // console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`SELECT *, c.Cust_name,DATE_FORMAT(osd.schTgtDate, '%d/%m/%Y') AS schTgtDate,
        DATE_FORMAT(osd.Delivery_date, '%d/%m/%Y') AS Delivery_Date
        FROM magodmis.orderschedule osd
        INNER JOIN magodmis.cust_data c ON c.Cust_Code = osd.Cust_Code
        WHERE osd.Type = 'Service'
          AND osd.Schedule_Status = 'Tasked'
          AND osd.Delivery_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
        ORDER BY osd.Delivery_date`, (err, data) => {
            if (err) logger.error(err);
            //const slicedArray = data.slice(0, 200);  
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

// scheduleListService.get('/schedulesListStatusProgrammedService', async (req, res, next) => {
//     // console.log('Request Done to Get Schedule List Profile Table ')
//     try {
//         misQueryMod(`select * , c.Cust_name from magodmis.orderschedule osd inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code where osd.Type='Profile' && osd.Schedule_Status = 'Programmed'  order by osd.Delivery_date`, (err, data) => {
//             if (err) logger.error(err);
//             //const slicedArray = data.slice(0, 200); 
//             res.send(data)
//         })
//     } catch (error) {
//         next(error) 
//     }
// });


module.exports = scheduleListService;