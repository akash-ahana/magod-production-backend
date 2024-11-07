const scheduleListProfile = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

function delay(time) { 
    return new Promise(resolve => setTimeout(resolve, time));
  }

  scheduleListProfile.post("/getSchedulesByCustomer", jsonParser , async (req, res, next) => {
    // console.log('/getSchedulesByCustomer', req.body)
    try {
        misQueryMod(`SELECT o.*, c.Cust_name 
        FROM magodmis.orderschedule o, magodmis.order_list o1, magodmis.cust_data c 
        WHERE (o.Schedule_Status='Tasked' OR o.Schedule_Status='Programmed' 
               OR o.Schedule_Status='Production' OR o.Schedule_Status='Processing')
               AND c.cust_code=o.cust_code AND o.Order_No=o1.Order_No 
               AND o1.Type='Profile' AND c.Cust_Code='${req.body.Cust_Code}'
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


  scheduleListProfile.post("/getcustomerdetailsData", async (req, res, next) => {
    console.log('get customer details data',req.body)
    try {
      let custid = req.body.custcode;
      misQueryMod(
        `Select * from magodmis.cust_data where Cust_Code='${custid}'`,
        (err, data) => {
          if (err) logger.error(err);
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  });

  scheduleListProfile.post("/allcustomersData", async (req, res, next) => {
    try {
      misQueryMod(
        "Select * from magodmis.cust_data order by Cust_name asc",
        (err, data) => {
          if (err) logger.error(err);
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  });

// scheduleListProfile.get('/schedulesList', async (req, res, next) => {
//     try {
//         misQueryMod(`SELECT osd.ScheduleId ,c.Cust_name, osd.Delivery_Date , osd.TgtDelDate, osd.Schedule_Status, ol.Type FROM magodmis.orderschedule osd
//         inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code
//         inner join magodmis.order_list ol on ol.Order_No = osd.Order_No 
//         where ol.Type = 'Profile'`, (err, data) => {
//             if (err) logger.error(err);
//             console.log(data.length)
//             const slicedArray = data.slice(0, 200);
//             res.send(slicedArray)
//         })
//     } catch (error) {
//         next(error)
//     }
// });

// scheduleListProfile.get('/schedulesList', async (req, res, next) => {
//     console.log('Request Done to Get Schedule List Profile Table ')
//     try {
//         misQueryMod(`select osd.OrdSchNo, c.Cust_name, osd.schTgtDate, osd.Delivery_Date ,  osd.Schedule_Status , ol.Type from magodmis.orderschedule osd 
//         inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code
//         inner join magodmis.order_list ol on ol.Order_No = osd.Order_No
//         where ol.Type = 'Profile' && osd.Schedule_Status = 'Tasked' || osd.Schedule_Status = 'Programmed' || osd.Schedule_Status = 'Production' || osd.Schedule_Status = 'Completed' || osd.Schedule_Status = 'Processing'`, (err, data) => {
//             if (err) logger.error(err);
//             console.log(data.length)
//             //const slicedArray = data.slice(0, 200); 
//             res.send(data)
//         })
//     } catch (error) {
//         next(error)
//     }
// });

scheduleListProfile.get('/printSchedulesList', async (req, res, next) => {
    //console.log('Request Done to Get Schedule List Profile Table')
    let customArray = []
    try {
        let taskedObject = { status : "" , data : []}
        misQueryMod(`select osd.OrdSchNo, osd.Delivery_Date , osd.schTgtDate  , c.Cust_name from magodmis.orderschedule osd inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code where osd.Type='Profile' && osd.Schedule_Status = 'Tasked' order by osd.Delivery_date`, async (err, data) => {
            if (err) logger.error(err);
           // console.log(data.length)
            taskedObject.status = "Tasked"
            taskedObject.data = data
            customArray.push(taskedObject) 
        })
    } catch (error) {
        next(error)
    }
    res.send(customArray)
    
});

scheduleListProfile.get('/schedulesList', async (req, res, next) => {
    //console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`SELECT o.*,c.Cust_name FROM magodmis.orderschedule o,
        magodmis.cust_data c 
        WHERE (o.Schedule_Status='Tasked' OR o.Schedule_Status='Programmed' 
        OR o.Schedule_Status='Production' OR o.Schedule_Status='Processing' OR o.Schedule_Status='Completed' )
        AND c.cust_code=o.cust_code  AND o.Type='Profile' 
        ORDER BY o.Delivery_date  DESC`, (err, data) => {
            if (err) logger.error(err);
          //  console.log(data.length)
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

scheduleListProfile.get('/schedulesListStatusProgrammed', async (req, res, next) => {
   // console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`select * , c.Cust_name,DATE_FORMAT(osd.schTgtDate, '%d/%m/%Y') AS schTgtDate,
        DATE_FORMAT(osd.Delivery_date, '%d/%m/%Y') AS Delivery_Date from magodmis.orderschedule osd inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code where osd.Type='Profile' && osd.Schedule_Status = 'Programmed' AND osd.Delivery_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)  order by osd.Delivery_date`, (err, data) => {
            if (err) logger.error(err);
          //  console.log(data.length)  
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

scheduleListProfile.get('/schedulesListStatusCompleted', async (req, res, next) => {
   // console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`select * , c.Cust_name ,DATE_FORMAT(osd.schTgtDate, '%d/%m/%Y') AS schTgtDate,
        DATE_FORMAT(osd.Delivery_date, '%d/%m/%Y') AS Delivery_Date  from magodmis.orderschedule osd inner join magodmis.cust_data c on c.Cust_Code = osd.Cust_Code where osd.Type='Profile' && osd.Schedule_Status = 'Completed'  AND osd.Delivery_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)  order by osd.Delivery_date`, (err, data) => {
            if (err) logger.error(err);
          //  console.log(data.length)
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

scheduleListProfile.get('/schedulesListStatusProduction', async (req, res, next) => {
   // console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`SELECT *, c.Cust_name,DATE_FORMAT(osd.schTgtDate, '%d/%m/%Y') AS schTgtDate,
        DATE_FORMAT(osd.Delivery_date, '%d/%m/%Y') AS Delivery_Date
        FROM magodmis.orderschedule osd
        INNER JOIN magodmis.cust_data c ON c.Cust_Code = osd.Cust_Code
        WHERE osd.Type = 'Profile'
          AND osd.Schedule_Status = 'Production'
          AND osd.Delivery_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
        ORDER BY osd.Delivery_date;
        `, (err, data) => {
            if (err) logger.error(err);
           // console.log(data.length)
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
        })
    } catch (error) {
        next(error) 
    }
});

scheduleListProfile.get('/schedulesListStatusTasked', async (req, res, next) => {
   // console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`SELECT *, c.Cust_name,DATE_FORMAT(osd.schTgtDate, '%d/%m/%Y') AS schTgtDate,
        DATE_FORMAT(osd.Delivery_date, '%d/%m/%Y') AS Delivery_Date
        FROM magodmis.orderschedule osd
        INNER JOIN magodmis.cust_data c ON c.Cust_Code = osd.Cust_Code
        WHERE osd.Type = 'Profile'
          AND osd.Schedule_Status = 'Tasked'
          AND osd.Delivery_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
        ORDER BY osd.Delivery_date;
        `, (err, data) => {
            if (err) logger.error(err);
           // console.log(data.length)
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

scheduleListProfile.get('/schedulesListStatusProgrammed', async (req, res, next) => {
    //console.log('Request Done to Get Schedule List Profile Table ')
    try {
        misQueryMod(`SELECT *, c.Cust_name
        FROM magodmis.orderschedule osd
        INNER JOIN magodmis.cust_data c ON c.Cust_Code = osd.Cust_Code
        WHERE osd.Type = 'Profile'
          AND osd.Schedule_Status = 'Programmed'
          AND osd.Delivery_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
        ORDER BY osd.Delivery_date;
        `, (err, data) => {
            if (err) logger.error(err);
            //console.log(data.length)
            //const slicedArray = data.slice(0, 200); 
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

scheduleListProfile.post('/schedulesListSecondTable', jsonParser ,  async (req, res, next) => {
//    console.log('schedulesListSecondTable' , req.body)
    try {
        misQueryMod(`select  * from magodmis.nc_task_list where ScheduleNo = '${req.body.ScheduleID}' `, (err, data) => {
            if (err) logger.error(err);
           // console.log('response' , data)  
            res.send(data) 
        }) 
    } catch (error) {
        next(error)    
    }
}); 

scheduleListProfile.post('/schedulesListPartsList', jsonParser ,  async (req, res, next) => {
    // console.log('schedulesList Parts List Table request ' , req.body) 
    try {
        misQueryMod(`SELECT n.Mtrl_Code, n.CustMtrl, n.MProcess,t.* 
        FROM magodmis.task_partslist t,magodmis.nc_task_list n 
        WHERE t.TaskNo=n.TaskNo  AND n.ScheduleID='${req.body.processrowselect.ScheduleID}' and 
        t.TaskNo='${req.body.processrowselect.TaskNo}' order by Task_Part_ID;`, (err, data) => {
            if (err) logger.error(err);
           // console.log('response parts list table' , data) 
            res.send(data)       
        })
    } catch (error) {
        next(error) 
    }
});

scheduleListProfile.post('/printShowParts', jsonParser ,  async (req, res, next) => {
   // console.log('schedulesList Parts List Table request ' , req.body) 
    try {
        misQueryMod(`SELECT *  FROM magodmis.task_partslist tpl where tpl.TaskNo = '${req.body.TaskId}'`, (err, data) => {
            if (err) logger.error(err);
           // console.log('response parts list table' , data) 
            res.send(data)       
        })
    } catch (error) {
        next(error)  
    }
});

scheduleListProfile.post('/schedulesListProgramList', jsonParser ,  async (req, res, next) => {
   // console.log('schedulesList Program List Table request ' , req.body) 
    try {
        misQueryMod(`SELECT *  FROM magodmis.ncprograms 
        where TaskNo = '${req.body.TaskId}'`, (err, data) => {
            if (err) logger.error(err);
            //console.log('response program list table' , data)  
            res.send(data) 
        })
    } catch (error) {
        next(error) 
    }
});

scheduleListProfile.post('/scheduleListSaveCleared', jsonParser ,  async (req, res, next) => {
    console.log(req.body)
    for (let i = 0 ; i < req.body.length ; i++) {
    try {
        misQueryMod(`UPDATE magodmis.task_partslist
        JOIN magodmis.orderschedule ON magodmis.task_partslist.OrdSch = magodmis.orderschedule.OrdSchNo
        SET magodmis.task_partslist.QtyCleared = '${req.body[i].QtyCleared}'
        WHERE magodmis.task_partslist.Task_Part_ID = '${req.body[i].Task_Part_ID}' AND magodmis.task_partslist.OrdSch = '${req.body[i].OrdSch}';
        `, (err, data) => {
            if (err) logger.error(err);
           // res.send(data) 
        })
    } catch (error) {
        next(error) 
    }
    }
    res.send('Request Recieved')
});


scheduleListProfile.post('/scheduleListSaveClearedCompleted', jsonParser ,  async (req, res, next) => {
    for (let i = 0 ; i < req.body.length ; i++) {
    try {
        misQueryMod(`UPDATE magodmis.task_partslist
        JOIN magodmis.orderschedule ON magodmis.task_partslist.OrdSch = magodmis.orderschedule.OrdSchNo
        SET magodmis.task_partslist.QtyCleared = '${req.body[i].QtyCleared}', magodmis.orderschedule.Schedule_Status = 'Completed'
        WHERE magodmis.task_partslist.Task_Part_ID = '${req.body[i].Task_Part_ID}' AND magodmis.task_partslist.OrdSch = '${req.body[i].OrdSch}';
        `, (err, data) => {
            if (err) logger.error(err);
           // res.send(data) 
        })
    } catch (error) {
        next(error) 
    }
    }
    res.send('Request Recieved')
});

// //ShowParts PDF
scheduleListProfile.post('/ShowParts', jsonParser ,  async (req, res, next) => {
    try {
        const processtable = req.body.processtable; // Assuming it's an array

        const responseData = [];

        for (let i = 0; i < processtable.length; i++) {
            const taskNo = processtable[i].TaskNo;

            // Asynchronously query the database for each taskNo
            misQueryMod(`SELECT * FROM magodmis.task_partslist WHERE TaskNo='${taskNo}'`, (err, data) => {
                if (err) {
                    logger.error(err);
                    return res.status(500).send({ error: 'An error occurred while querying the database.' });
                }

                responseData.push({taskNo, data});

                // Check if all queries have completed before sending the response
                if (responseData.length === processtable.length) {
                    res.send(responseData);
                }
            });
        }
    } catch (error) {
        next(error);
    }
});


//update ScheduleStatus
//update task status
//update task parts - quantity cleared




module.exports = scheduleListProfile;