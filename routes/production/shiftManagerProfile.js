const shiftManagerProfile = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod , productionQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

var jsonParser = bodyParser.json()

function delay(time) { 
    return new Promise(resolve => setTimeout(resolve, time));
  }

//   shiftManagerProfile.post('/getShiftInformation', jsonParser ,  async (req, res, next) => {
//     // console.log('/getShiftInformation' , req.body)
//      try {
//          misQueryMod(`Select * from magodmis.day_shiftregister where ShiftDate = '${req.body.ShiftDate}' && Shift = '${req.body.Shift}'`, (err, data) => {
//              if (err) logger.error(err);
//              console.log(data)
//              res.send(data) 
//          })
//      } catch (error) { 
//          next(error)
//      }
    
//  });

 shiftManagerProfile.post("/getShiftInformation", async (req, res, next) => {
  try {
    const now = new Date();
    // Get current date and time
    const currentDate = new Date().toISOString().slice(0, 10); // Format as 'YYYY-MM-DD'
    const currentDateTime = `${now.toISOString().slice(0, 10)} ${now.toTimeString().split(' ')[0]}`;
 
 
    // Define the SQL query to get shifts for the current date
    const query = `
      SELECT *
      FROM magodmis.day_shiftregister
      WHERE ShiftDate = '${currentDate}';
    `;
 
    // Execute the query
    misQueryMod(query, (err, data) => {
      if (err) {
        logger.error(err);
        return res.status(500).send("Internal Server Error");
      }
 
 
      if (!data || data.length === 0) {
        // If no data is found for the current date, return a message
        return res.send("No shift data available for the current date.");
      }
 
      // Filter data to find entries where the current time is within fromtime and totime
      const currentShiftData = data.filter((shift) => {
        const fromTime = shift.FromTime;
        const toTime = shift.ToTime;
 
        // console.log("fromTime is",fromTime);
        // console.log("toTime  is",toTime);
        // Check if the current time falls within fromtime and totime range
        return currentDateTime >= fromTime && currentDateTime <= toTime;
      });
 
      // Send the resulting data or a message if no matching shift is found
      if (currentShiftData.length > 0) {
        res.send(currentShiftData);
      } else {
        res.send("No current shift matches the time range.");
      }
    });
  } catch (error) {
    next(error);
  }
});

shiftManagerProfile.get('/profileListMachines', async (req, res, next) => {
    let outputArray = []
    try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
         machine_data.profile_cuttingoperationslist p 
         WHERE m1.Machine_srl=m.Machine_srl AND o.Operation=m1.RefProcess 
         AND m.Working AND p.OperationId=o.OperationID`, async (err, data) => { 
            if (err) logger.error(err);
            // console.log('data length is ' , data.length)
           for (let i =0 ; i<data.length ; i++) {
                let customObject = {MachineName : "" , process : []}
                customObject.MachineName = data[i].refName

                //getting processForMachine
                try {
                    mchQueryMod(`select RefProcess from machine_process_list where Machine_srl='${data[i].Machine_srl}'`, (err, datanew) => {
                        if (err) logger.error(err);
                        // console.log('PROCESS FOR MACHINE' , data[i].refName, + " " + datanew.length)
                        for(let k =0 ; k<datanew.length ; k++) {
                            customObject.process.push(datanew[k])
                        }
                        
                       // res.send(data)
                    })
                } catch (error) { 
                    next(error)
                }

               // console.log('CUSTOM OBJECT IS ' , customObject)


                outputArray.push(customObject)

           }
           // const slicedArray = data.slice(0, 200);
           // res.send(data)
           await delay(1000)
            res.send(outputArray)
        })
    } catch (error) {
        next(error)
    }
});



const util = require('util');
const mchQueryModPromisified = util.promisify(mchQueryMod);

shiftManagerProfile.get('/profileListMachinesTaskNo', async (req, res, next) => {
    // console.log('OnClick of Machines')
    let outputArray = []
    try {
        misQueryMod(`SELECT DISTINCT m.refName , m.Machine_srl, n.TaskNo, n.Mtrl_Code,n.NCProgramNo, n.PStatus,n.Operation 
        FROM machine_data.machine_list m
        LEFT JOIN magodmis.ncprograms n ON n.Machine = m.refName AND (n.PStatus = 'Cutting'|| n.PStatus = 'Completed' || n.PStatus = 'Processing')
        JOIN machine_data.magod_process_list p On p.ProcessDescription=n.Operation where
         m.Working and p.Profile = 1 OR p.Profile = -1 and m.Working`, async (err, data) => {
            if (err) logger.error(err);
            // console.log('data length is ' , data.length)
        
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
                
                // Add the process information to the machine in the mapping object
                if(item.TaskNo || item.Mtrl_Code || item.NCProgramNo || item.PStatus){
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
            // console.log(outputArray, outputArray.length);            
            res.send(outputArray)
        })
    } catch (error) {
        next(error)
    }
});


shiftManagerProfile.get('/profileMachines', async (req, res, next) => {
    let outputArray = []
    try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
         machine_data.profile_cuttingoperationslist p 
         WHERE m1.Machine_srl=m.Machine_srl AND o.Operation=m1.RefProcess 
         AND m.Working AND p.OperationId=o.OperationID`, async (err, data) => {
            if (err) logger.error(err);
            //console.log('data length is ' , data.length)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

shiftManagerProfile.post('/shiftManagerProfileFilteredMachines', jsonParser ,  async (req, res, next) => {
        // console.log(req.body.Operation)
         try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
         machine_data.profile_cuttingoperationslist p 
         WHERE m1.Machine_srl=m.Machine_srl AND o.Operation=m1.RefProcess 
         AND m.Working AND p.OperationId=o.OperationID AND m1.Mprocess='${req.body.Operation}'`, (err, data) => {
            if (err) logger.error(err);
            // console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
    });

shiftManagerProfile.post('/taskNoProgramNoCompleted', jsonParser ,  async (req, res, next) => {
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
            AND (p.Profile = 1 OR p.Profile = -1)
        )`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

 shiftManagerProfile.post('/taskNoProgramNoProcessing', jsonParser ,  async (req, res, next) => {
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
            AND (p.Profile = 1 OR p.Profile = -1)
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

shiftManagerProfile.post('/profileListMachinesProgramesCompleted', jsonParser ,  async (req, res, next) => {
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
            AND (p.Profile = 1 OR p.Profile = -1)
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

shiftManagerProfile.post('/profileListMachinesProgramesProcessing', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesProcessing' , req.body)
     try {
         misQueryMod(`
         SELECT n.*, (
            SELECT p.ProcessDescription 
            FROM machine_data.magod_process_list AS p 
            WHERE p.ProcessDescription = n.Operation
        ) AS ProcessDescription
        FROM magodmis.ncprograms AS n
        WHERE n.PStatus = 'Cutting'  OR n.PStatus = 'Processing' and
        n.Machine = '${req.body.MachineName}'
        AND EXISTS (
            SELECT 1 
            FROM machine_data.magod_process_list AS p 
            WHERE p.ProcessDescription = n.Operation 
            AND (p.Profile = 1 OR p.Profile = -1)
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

 shiftManagerProfile.post('/OperationMachinesProgramesCompleted', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesCompleted' , req.body)
     try {
         mchQueryMod(`SELECT * FROM magodmis.ncprograms where Machine = '${req.body.MachineName}' && Operation = '${req.body.Operation}' && PStatus = 'Completed'`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

 shiftManagerProfile.post('/OperationMachinesProgramesProcessing', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesProcessing' , req.body)
     try {
         misQueryMod(`SELECT * FROM magodmis.ncprograms where Machine = '${req.body.MachineName}' && Operation = '${req.body.Operation}' &&  PStatus = 'Cutting' OR n.PStatus = 'Processing'`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) {
         next(error)
     }
 });

 shiftManagerProfile.post('/OperationProgramesCompleted', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesCompleted' , req.body)
     try {
         mchQueryMod(`SELECT * FROM magodmis.ncprograms where Operation = '${req.body.Operation}' && PStatus = 'Completed'`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

 shiftManagerProfile.post('/CustomerProgramesCompleted', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesCompleted' , req.body)
     try {
         mchQueryMod(`SELECT * FROM magodmis.ncprograms where Cust_Code = '${req.body.Cust_Code}' && PStatus = 'Completed' `, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

 shiftManagerProfile.post('/CustomerProgramesProcessing', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesProcessing' , req.body)
     try {
         misQueryMod(`SELECT * FROM magodmis.ncprograms where Cust_Code = '${req.body.Cust_Code}'  &&  PStatus = 'Cutting' OR n.PStatus = 'Processing'`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) {
         next(error)
     }
 });

 shiftManagerProfile.post('/OperationProgramesProcessing', jsonParser ,  async (req, res, next) => {
    //console.log('/profileListMachinesProgramesProcessing' , req.body)
     try {
         misQueryMod(`SELECT * FROM magodmis.ncprograms where  Operation = '${req.body.Operation}' &&  PStatus = 'Cutting' OR n.PStatus = 'Processing'`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) {
         next(error)
     }
 });

 shiftManagerProfile.get('/orderByOperations', jsonParser ,  async (req, res, next) => {
    let outputArray = []
   //console.log('/profileListMachinesProgramesProcessing' , req.body)
    try {
        mchQueryMod(`SELECT ol.Operation, ol.ProcessId,mpl.Machine_srl, ml.refName, n.NCProgramNo, n.TaskNo , n.PStatus FROM machine_data.profile_cuttingoperationslist pcol
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
            // console.log(JSON.stringify(result, null, 4), result.length);
  


            
           res.send(result)
        })
    } catch (error) {
        next(error)
    }
});

 shiftManagerProfile.post('/shiftManagerncProgramTaskList', jsonParser ,  async (req, res, next) => {
    // console.log("req.body is shiftManagerncProgramTaskList",req.body);
     try {
         misQueryMod(`SELECT * FROM magodmis.ncprogram_partslist where NCId = '${req.body.Ncid}'`, (err, data) => {
             if (err) logger.error(err);
             
             res.send(data)
         })
     } catch (error) {  
         next(error)
     }
 });

 shiftManagerProfile.post('/shiftManagerCloseProgram', jsonParser ,  async (req, res, next) => {
    // console.log("req.body shiftManagerCloseProgram", req.body);

    for(let i = 0; i < req.body.length; i++) {
        try {
            // Update magodmis.ncprogram_partslist
            misQueryMod(`
                UPDATE magodmis.ncprogram_partslist
                SET QtyCleared = '${req.body[i].QtyCleared}',
                    QtyRejected = '${req.body[i].QtyRejected}',
                    Remarks = '${req.body[i].Remarks}'
                WHERE NcProgramNo = '${req.body[i].NcProgramNo}'
                    && TaskNo = '${req.body[i].TaskNo}'
                    && DwgName= '${req.body[i].DwgName}'`, 
            (err, data) => {
                if (err) logger.error(err);
            });

            // Update magodmis.task_partslist
            misQueryMod(`
                UPDATE magodmis.task_partslist
                SET QtyToNest='${req.body[i].TotQtyNested}',
                    QtyProduced='${req.body[i].QtyCleared}'
                WHERE Task_Part_ID='${req.body[i].Task_Part_Id}'`, 
            (err, data) => {
                if (err) logger.error(err);
            });
        } catch (error) {    
            next(error);
        }
    }
    res.send(true);
});

 shiftManagerProfile.post('/CloseProgram', jsonParser, async (req, res, next) => {
    // console.log('Close Program request is ', req.body);
    try {
        // First update query
        misQueryMod(`
        SELECT CASE WHEN SUM(Used) + SUM(Rejected) = n.QtyAllotted THEN 1 ELSE 0 END AS canClose
        FROM magodmis.ncprograms n,
        (
          SELECT n.Used, n.Rejected, n.ShapeMtrlID
          FROM magodmis.ncprogrammtrlallotmentlist n
          WHERE n.NCProgramNo='${req.body.NCProgramNo}'
          UNION
          SELECT n.Used, n.Rejected, n.ShapeMtrlID
          FROM magodmis.ncprogramusedmtrllist n
          WHERE n.NCProgramNo='${req.body.NCProgramNo}'
        ) AS A
        WHERE n.NCProgramNo='${req.body.NCProgramNo}'`, (err, data) => {
            if (err) {
                logger.error(err);
                res.status(500).json({ error: 'An error occurred while updating the first table.' });
            } else {
                // Check the result of the query
                const canCloseValue = data[0].canClose;
                // console.log("canCloseValue is",canCloseValue);
                if (canCloseValue === 0) {
                    // Send a response indicating that material should be returned or updated
                    res.send('Return or update Material before closing Program');
                } else {
                    res.send("Change status")
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

//Upadte Status after closeProgram Button
shiftManagerProfile.post('/updateClosed', jsonParser ,  async (req, res, next) => {
    // console.log('/updateClosed' , req.body);
     try {
         misQueryMod(`UPDATE magodmis.ncprograms SET PStatus = 'Closed' WHERE NCProgramNo = '${req.body.NCProgramNo}';`, (err, data) => {
             if (err) logger.error(err);
            //  console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

 //Upadte Status after closeProgram Button
shiftManagerProfile.post('/updateMtrlIssue', jsonParser ,  async (req, res, next) => {
    // console.log('/updateMtrlIssue' , req.body);
     try {
         misQueryMod(`UPDATE magodmis.ncprograms SET PStatus = 'Mtrl Issue' WHERE NCProgramNo = '${req.body.NCProgramNo}';`, (err, data) => {
             if (err) logger.error(err);
            //  console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });


//  ////
 shiftManagerProfile.post('/changeMachine', jsonParser ,  async (req, res, next) => {
    // console.log('/changeMachine' , req.body);
     try {
         misQueryMod(`UPDATE magodmis.ncprograms SET Machine = '${req.body.NewMachine}' WHERE NCProgramNo = '${req.body.NCProgramNo}';`, (err, data) => {
             if (err) logger.error(err);
            //  console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });


 shiftManagerProfile.get('/productionTaskListTabData', jsonParser ,  async (req, res, next) => {
    // console.log('/productionTaskListTabData' , req.body)
    let customArray = [];
     try {
         misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
         machine_data.machine_process_list m1,machine_data.operationslist o,
          machine_data.profile_cuttingoperationslist p 
          WHERE m1.Machine_srl=m.Machine_srl AND o.Operation=m1.RefProcess 
          AND m.Working AND p.OperationId=o.OperationID`, (err, data) => {
             if (err) logger.error(err);
            //  console.log(data)
             let newArray = [];
             
             for( let i =0 ; i<data.length ; i++) {
                // console.log(data[i].refName)
                try {
                    misQueryMod(`SELECT * FROM magodmis.ncprograms where Machine = '${data[i].refName}'`, (err, datanew) => {
                        if (err) logger.error(err);
                        for( let k = 0 ; k< datanew.length ; k++) {
                            customArray.push(datanew[i])
                        }
                        
                    })
                } catch (error) { 
                    next(error)
                }
             }
             delay(3000) 
             //
         })
     } catch (error) { 
         next(error)
     }
     res.send(customArray)
 });

 shiftManagerProfile.get('/orderByCustomers', jsonParser ,  async (req, res, next) => {
    // console.log('/orderByCustomers')
    let outputArray = []

    try {
        misQueryMod(`SELECT C.Cust_name, C.Cust_Code, N.NCProgramNo, N.TaskNo , N.Machine , N.PStatus FROM magodmis.cust_data C LEFT JOIN magodmis.ncprograms N ON C.Cust_Code = N.Cust_Code  AND (N.PStatus='Completed' || N.PStatus='Cutting') WHERE C.LastBilling > '2021-06-11 00:00:00'`, async (err, data) => {
            if (err) logger.error(err);
            // console.log(data)
            // console.log(data.length)

            data.forEach((item) => {
    const customerIndex = outputArray.findIndex((custItem) => custItem.Customer.Cust_Code === item.Cust_Code);
    if (customerIndex === -1) {
        const newCustomer = {
            Customer: {
                Cust_name: item.Cust_name,
                Cust_Code: item.Cust_Code,
                programs: [],
            },
        };
        outputArray.push(newCustomer);
    }
    
    const program = {
        NCProgramNo: item.NCProgramNo,
        TaskNo: item.TaskNo,
        Machine: item.Machine || "",
        PStatus: item.PStatus,
    };
    
    if (customerIndex !== -1) {
        outputArray[customerIndex].Customer.programs.push(program);
    }
});

// console.log(JSON.stringify(outputArray, null, 4));
        // console.log(outputArray.length)
            res.send(outputArray)
        })
    } catch (error) {  
        next(error) 
    }
   
});


//////////////////
shiftManagerProfile.post('/ProductionTaskList', jsonParser, async (req, res, next) => {
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
        // console.log(data.length)
        res.send(data)
      })
    } catch (error) {
      next(error)
    }
  });

  //MachineLog
  shiftManagerProfile.post('/machineLog', jsonParser, async (req, res, next) => {
    // console.log('requiredtype',req.body);
    try {
        const firstQuery = `SELECT magodmis.shiftlogbook.*, magodmis.shiftregister.Shift, magodmis.shiftregister.ShiftID,
        (TIMESTAMPDIFF(MINUTE, magodmis.shiftlogbook.FromTime, magodmis.shiftlogbook.ToTime)) AS MachineTime
      FROM magodmis.shiftlogbook
      JOIN magodmis.shiftregister ON magodmis.shiftlogbook.ShiftID = magodmis.shiftregister.ShiftID
      WHERE magodmis.shiftlogbook.FromTime >= CONCAT('${req.body.Date}', ' 06:00:00')
          AND magodmis.shiftlogbook.ToTime < CONCAT(DATE_ADD('${req.body.Date}', INTERVAL 1 DAY), ' 06:00:00')
          AND magodmis.shiftlogbook.TaskNo != '100'
          AND magodmis.shiftlogbook.Machine='${req.body.Machine.MachineName}'`;
    
        mchQueryMod(firstQuery, async (err, data) => {
          if (err) {
            console.error('Error executing first query:', err);
            return next(err);
          }    
          // Extract unique MProcess values from the first query result
          const MProcessValues = Array.from(new Set(data.map((row) => row.MProcess)));
    
          if (MProcessValues.length === 0) {
            // console.log('No MProcess values found');
            // Handle the case where no MProcess values are present (e.g., handle as 'Administrative')
            const combinedData = {
              firstQueryResult: data,
              secondQueryResult: [{ Operation: 'Administrative' }],
            };
            return res.status(200).json(combinedData);
          }
    
          // Prepare the second query with the unique MProcess values
          const secondQuery = `SELECT magodmis.shiftlogbook.MProcess, COALESCE(machine_data.operationslist.Operation, 'Administrative') AS Operation
               FROM machine_data.operationslist
               LEFT JOIN magodmis.shiftlogbook ON machine_data.operationslist.ProcessId = magodmis.shiftlogbook.MProcess
                WHERE magodmis.shiftlogbook.MProcess IN (${MProcessValues.map((value) => `'${value}'`).join(', ')})`;
    
          mchQueryMod(secondQuery, (err, operationsData) => {
            if (err) {
              console.error('Error executing second query:', err);
              return next(err);
            }    
            // Combine the results from both queries
            const combinedData = data.map((row) => ({
              ...row,
              Operation: operationsData.find((opData) => opData.MProcess === row.MProcess)?.Operation,
            }));
    
            res.send(combinedData);
          });
        });
      } catch (error) {
        console.error('Error in API request:', error);
        next(error);
      }
  });

  //////
  shiftManagerProfile.get('/allCompleted', jsonParser ,  async (req, res, next) => {
    //console.log('/taskNoProgramNoCompleted' , req.body)
     try {
         mchQueryMod(`SELECT n.*, 
         (SELECT p.ProcessDescription
          FROM machine_data.magod_process_list AS p
          WHERE p.ProcessDescription = n.Operation
          LIMIT 1) AS ProcessDescription
  FROM magodmis.ncprograms AS n
  WHERE n.PStatus = 'Completed'
    AND EXISTS (SELECT 1
                FROM machine_data.magod_process_list AS p
                WHERE p.ProcessDescription = n.Operation
                  AND (p.Profile = 1 OR p.Profile = -1))
  `, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });

  //////
  shiftManagerProfile.get('/allProcessing', jsonParser ,  async (req, res, next) => {
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
            AND (p.Profile = 1 OR p.Profile = -1)
        );`, (err, data) => {
             if (err) logger.error(err);
             //console.log(data)
             res.send(data)
         })
     } catch (error) { 
         next(error)
     }
 });


 //Shift Report
 shiftManagerProfile.post('/shiftReport', jsonParser, async (req, res, next) => {
    try {
        mchQueryMod(`Select ml.refName, sl.ShiftID,sl.Machine,sl.MProcess,sl.FromTime, sl.ToTime, sl.TaskNo,  sr.Shift, TIMESTAMPDIFF(MINUTE, sl.FromTime, sl.ToTime) as timediff, sl.StoppageID, 
        IF(sl.MProcess = '' , (SELECT sc.GroupName FROM magod_production.stoppagereasonlist as srl join magod_production.stoppage_category as sc on srl.StoppageGpId=sc.StoppageGpId 
        where sl.StoppageID=srl.StoppageID ), IF(sl.MProcess = 'Stoppage' && sl.TaskNo='100' , (SELECT sc.GroupName FROM magod_production.stoppagereasonlist as srl join magod_production.stoppage_category as sc on srl.StoppageGpId=sc.StoppageGpId 
        where sl.StoppageID=srl.StoppageID ), IF(sl.MProcess = 'Stoppage', (SELECT nc.Operation FROM magodmis.nc_task_list as nc where sl.TaskNo=nc.TaskNo), (select ol.Operation from machine_data.operationslist as ol where ol.ProcessId=sl.MProcess)))) as operation
        from  machine_data.machine_list as ml left join magodmis.shiftlogbook as sl on sl.Machine= ml.refName and DATE(sl.FromTime) like '${req.body.Date}' left  join magodmis.shiftregister as sr on sl.ShiftID=sr.ShiftID`, (err, data) => {
            if (err) logger.error(err);
            // console.log(data.length, data, req.body.Date)
  
            const MachineProcessData = [];
            // Iterate over each object in data
            data.forEach((item) => {
                
              // Find the machine object in MachineProcessData
              let machineObj = MachineProcessData.find((machine) => machine.MachineName === item.Machine);
  
              // If machine object doesn't exist, create a new one
              if (!machineObj) {
                machineObj = {
                  MachineName: item.ShiftID==null? item.refName: item.Machine,
                  operations: [],
                };
                // console.log(item,machineObj)
                MachineProcessData.push(machineObj);
              }
  
              
  
              // If shift object doesn't exist, create a new one
              if (item.ShiftID!=null){
             
  
              
              // Find the operation object in taskObj.operations
              let operationObj = machineObj.operations.find((operation) => operation.Operation === (item.operation || "Break"));
  
              // If operation object doesn't exist, create a new one
              if (!operationObj) {
                operationObj = {
                  Operation: item.operation || "Break",
                  time: item.timediff == null? '': item.timediff.toString(),
                };
                machineObj.operations.push(operationObj);
              } else {
                operationObj.time = (parseInt(operationObj.time) + parseInt(item.timediff)).toString();
              }
            }
            });
  
            // console.log(MachineProcessData);
            res.send(MachineProcessData)
        })
    } catch (error) {
        next(error)
    }
  });


  

module.exports = shiftManagerProfile;