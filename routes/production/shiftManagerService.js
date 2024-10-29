const shiftManagerService = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod , productionQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

var jsonParser = bodyParser.json()

function delay(time) { 
    return new Promise(resolve => setTimeout(resolve, time));
  }

  //completed
  shiftManagerService.post('/taskNoProgramNoCompleted', jsonParser ,  async (req, res, next) => {
    //console.log('/taskNoProgramNoCompleted' , req.body)
     try {
         mchQueryMod(`
         SELECT n.*, (
            SELECT p.ProcessDescription 
            FROM machine_data.magod_process_list AS p 
            WHERE p.ProcessDescription = n.Operation
        ) AS ProcessDescription
        FROM magodmis.ncprograms AS n
        WHERE n.PStatus = 'Completed' and
        n.NCProgramNo = '${req.body.NCProgramNo}'
        AND EXISTS (
            SELECT 1 
            FROM machine_data.magod_process_list AS p 
            WHERE p.ProcessDescription = n.Operation 
            AND (p.Service = 1 OR p.Service = -1)
        )`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

 shiftManagerService.post('/profileListMachinesProgramesCompleted', jsonParser ,  async (req, res, next) => {
    try {
        mchQueryMod(`
        SELECT n.*, (
            SELECT p.ProcessDescription 
            FROM machine_data.magod_process_list AS p 
            WHERE p.ProcessDescription = n.Operation
        ) AS ProcessDescription
        FROM magodmis.ncprograms AS n
        WHERE n.PStatus = 'Completed' and
        n.Machine = '${req.body.MachineName}'
        AND EXISTS (
            SELECT 1 
            FROM machine_data.magod_process_list AS p 
            WHERE p.ProcessDescription = n.Operation 
            AND (p.Service = 1 OR p.Service = -1)
        );
        `, (err, data) => {
            if (err) logger.error(err);
            //console.log(data)
            res.send(data)
        })
    } catch (error) { 
        next(error)
    }
});


shiftManagerService.get('/allCompleted', jsonParser ,  async (req, res, next) => {
    //console.log('/taskNoProgramNoCompleted' , req.body)
     try {
         mchQueryMod(`
        SELECT n.*, 
       (SELECT p.ProcessDescription
        FROM machine_data.magod_process_list AS p
        WHERE p.ProcessDescription = n.Operation
        LIMIT 1) AS ProcessDescription
FROM magodmis.ncprograms AS n
WHERE n.PStatus = 'Completed'
  AND EXISTS (SELECT 1
              FROM machine_data.magod_process_list AS p
              WHERE p.ProcessDescription = n.Operation
                AND (p.Service = 1 OR p.Service = -1))
        
        `, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

 //Cutting
 shiftManagerService.get('/allProcessing', jsonParser ,  async (req, res, next) => {
    //console.log('/taskNoProgramNoCompleted' , req.body)
     try {
         mchQueryMod(`
         SELECT n.*, (
            SELECT p.ProcessDescription 
            FROM machine_data.magod_process_list AS p 
            WHERE p.ProcessDescription = n.Operation
        ) AS ProcessDescription
        FROM magodmis.ncprograms AS n
        WHERE n.PStatus = 'Cutting' OR n.PStatus = 'Processing'
        AND EXISTS (
            SELECT 1 
            FROM machine_data.magod_process_list AS p 
            WHERE p.ProcessDescription = n.Operation 
            AND (p.Service = 1 OR p.Service = -1)
        );`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

 shiftManagerService.post('/taskNoProgramNoProcessing', jsonParser ,  async (req, res, next) => {
    // console.log('/taskNoProgramNoProcessing' , req.body)
     try {
         mchQueryMod(`
         SELECT n.*, (
            SELECT p.ProcessDescription 
            FROM machine_data.magod_process_list AS p 
            WHERE p.ProcessDescription = n.Operation
        ) AS ProcessDescription
        FROM magodmis.ncprograms AS n
        WHERE n.PStatus = 'Cutting' OR n.PStatus = 'Processing' and
        n.NCProgramNo = '${req.body.NCProgramNo}'
        AND EXISTS (
            SELECT 1 
            FROM machine_data.magod_process_list AS p 
            WHERE p.ProcessDescription = n.Operation 
            AND (p.Service = 1 OR p.Service = -1)
        )
         `, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

 shiftManagerService.post('/profileListMachinesProgramesProcessing', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesProcessing' , req.body)
     try {
         misQueryMod(`
         SELECT n.*, (
            SELECT p.ProcessDescription 
            FROM machine_data.magod_process_list AS p 
            WHERE p.ProcessDescription = n.Operation
        ) AS ProcessDescription
        FROM magodmis.ncprograms AS n
        WHERE n.PStatus = 'Cutting' OR n.PStatus = 'Processing' and
        n.Machine = '${req.body.MachineName}'
        AND EXISTS (
            SELECT 1 
            FROM machine_data.magod_process_list AS p 
            WHERE p.ProcessDescription = n.Operation 
            AND (p.Service = 1 OR p.Service = -1)
        );
         `, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) {
         next(error)
     }
 });

  shiftManagerService.get('/serviceListMachinesTaskNo', async (req, res, next) => {
    // console.log('OnClick of Machines')
    let outputArray = []
    try {
        misQueryMod(`SELECT DISTINCT m.refName , m.Machine_srl, n.TaskNo, n.Mtrl_Code,n.NCProgramNo, n.PStatus,n.Operation 
        FROM machine_data.machine_list m
        LEFT JOIN magodmis.ncprograms n ON n.Machine = m.refName AND (n.PStatus = 'Cutting'|| n.PStatus = 'Completed' ||  n.PStatus = 'Processing')
        JOIN machine_data.magod_process_list p On p.ProcessDescription=n.Operation where
         m.Working and p.Service = 1 OR p.Service = -1 and m.Working`, async (err, data) => {
            if (err) logger.error(err);
            const machineMap = {};

            // Iterate through the input array
            data.forEach((item) => {
                const machineName = item.refName;
                
                // If the machine doesn't exist in the mapping object, create it
                if (!machineMap[machineName]) {
                    machineMap[machineName] = {
                        MachineName: machineName,
                        process: []
                    };
                }
                
                if(item.TaskNo || item.Mtrl_Code || item.NCProgramNo || item.PStatus){
                // Add the process information to the machine in the mapping object
                machineMap[machineName].process.push({
                    TaskNo: item.TaskNo,
                    Mtrl_Code: item.Mtrl_Code,
                    NCProgramNo: item.NCProgramNo,
                    PStatus: item.PStatus
                });
            }
            });
            
            // Push the values from the mapping object to the result array
            for (const machine in machineMap) {
                outputArray.push(machineMap[machine]);
            }
            
            // Output the result array
            console.log(outputArray, outputArray.length);            
            res.send(outputArray)
        })
    } catch (error) {
        next(error)
    }
});

shiftManagerService.post('/shiftManagerServiceFilteredMachines', jsonParser ,  async (req, res, next) => {
    // console.log('/machineAllotmentScheduleTableFormMachines')

    console.log(req.body.Operation)
         try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
         machine_data.service_operationslist p 
         WHERE m1.Machine_srl=m.Machine_srl AND o.Operation=m1.RefProcess 
         AND m.Working AND p.OperationId=o.OperationID AND m1.Mprocess='${req.body.Operation}'`, (err, data) => {
            if (err) logger.error(err);
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
    
    //res.send('Request Recieved')  
});

shiftManagerService.get('/orderByOperationsService', jsonParser ,  async (req, res, next) => {
    let outputArray = []
   //console.log('/profileListMachinesProgramesProcessing' , req.body)
    try {
        mchQueryMod(`SELECT ol.Operation, ol.ProcessId,mpl.Machine_srl, ml.refName, n.NCProgramNo, n.TaskNo , n.PStatus FROM machine_data.service_operationslist pcol
        INNER JOIN machine_data.operationslist ol ON pcol.OperationId = ol.OperationID 
        JOIN machine_data.machine_process_list mpl ON mpl.RefProcess = ol.Operation
                   JOIN machine_data.machine_list ml ON ml.Machine_srl = mpl.Machine_srl AND ml.Working = '1'
        LEFT JOIN magodmis.ncprograms n ON n.Machine=ml.refName AND n.Operation=ol.Operation AND (PStatus='Completed' || PStatus='Cutting')`, async (err, data) => {
            if (err) logger.error(err);

            // The original array of objects
            const originalData = [
                // ... (your original data here)
            ];
            
            // Initialize an empty result array
            const result = [];
            
            // Create a map to store machines based on Operation
            const machineMap = new Map();
            
            // Iterate through the original data
            data.forEach((item) => {
                const operation = item.Operation;
                const machine_srl = item.Machine_srl;
                const refName = item.refName;
                const NCProgramNo = item.NCProgramNo;
                const TaskNo = item.TaskNo;
                const PStatus = item.PStatus;
            
                // Check if the operation exists in the map
                if (!machineMap.has(operation)) {
                machineMap.set(operation, []);
                }
            
                // Find the machine in the map
                const machines = machineMap.get(operation);
                const machineIndex = machines.findIndex((machine) => machine.Machine_srl === machine_srl);
            
                // If the machine doesn't exist, create it
                if (machineIndex === -1) {
                const newMachine = {
                    Machine_srl: machine_srl,
                    refName: refName,
                    process: [],
                };
                if (NCProgramNo !== null && TaskNo !== null && PStatus !== null) {
                    newMachine.process.push({ NCProgramNo, TaskNo, PStatus });
                }
                machines.push(newMachine);
                } else {
                // If the machine already exists, push the process data if available
                if (NCProgramNo !== null && TaskNo !== null && PStatus !== null) {
                    machines[machineIndex].process.push({ NCProgramNo, TaskNo, PStatus });
                }
                }
            });
            
            // Iterate through the machineMap to create the final result
            machineMap.forEach((machines, operation) => {
                result.push({
                Operation: operation,
                Machines: machines,
                });
            });
            
            // Output the result in the desired format
        console.log(JSON.stringify(result, null, 4), result.length);
           res.send(result)
        })
    } catch (error) {
        next(error)
    }
});

shiftManagerService.get('/orderByCustomersService', jsonParser ,  async (req, res, next) => {
    // console.log('/orderByCustomers')
    let outputArray = []

    try {
        misQueryMod(`SELECT Cust_name, Cust_Code FROM magodmis.cust_data where LastBilling > '2021-06-11 00:00:00'`, async (err, data) => {
            if (err) logger.error(err);

            for(let i =0;i<data.length;i++){
                try {
                    let customObject = {Customer : ""}
                    misQueryMod(`select NCProgramNo, TaskNo , Machine , PStatus from magodmis.ncprograms where Cust_Code = '${data[i].Cust_Code}' && (PStatus='Completed' || PStatus='Cutting')`, async (err, datanc) => {
                        if (err) logger.error(err);
                        console.log(datanc, data[i]) 
                        data[i].programs = datanc
                        customObject.Customer = data[i]
                        //customObject.programs.push(datanc)
                        outputArray.push(customObject)
                        //res.send(data)  
                        await delay(20000)
                    })
                } catch (error) {  
                    next(error) 
                }
            }
            //res.send(data)
            await delay(30000) 
            res.send(outputArray)
        })
    } catch (error) {  
        next(error) 
    }
   
});

shiftManagerService.post('/ProductionTaskList', jsonParser, async (req, res, next) => {
    // console.log('requiredtype',req.body);
    try {
      mchQueryMod(`SELECT n.TaskNo, m1.Mtrl_Code, m1.Operation, m1.NestCount, m1.NoOfDwgs, m1.DwgsNested, m1.PartsNested, m1.TotalParts, m1.Priority, m1.EstimatedTime, SUM(n.qty) AS NoOfSheets
      FROM magodmis.ncprograms n
      JOIN magodmis.nc_task_list m1 ON n.TaskNo = m1.TaskNo
      JOIN magodmis.orderschedule o ON o.ScheduleId = m1.ScheduleId
      WHERE (n.PStatus = 'Cutting' OR n.PStatus = 'Completed' OR n.PStatus = 'Processing')
        AND o.Type = '${req.body.Type}'
      GROUP BY n.TaskNo
      `, (err, data) => {
        if (err) logger.error(err);
        console.log(data.length)
        res.send(data)
      })
    } catch (error) {
      next(error)
    }
  });



  module.exports = shiftManagerService;