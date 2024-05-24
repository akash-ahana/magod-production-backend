const machineAllotment = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod , productionQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

// create application/json parser
var jsonParser = bodyParser.json() 

function delay(time) { 
    return new Promise(resolve => setTimeout(resolve, time));
  }

// Gets Information all the machine Operators
// change the query - add active machine in where condition
machineAllotment.get('/getMachineProcess', jsonParser ,  async (req, res, next) => {
    
    // console.log('/getMachineOperators REQUEST' , req.body)
    let outputArray = []
    let machineArray = []
    
    try {
        mchQueryMod(` SELECT * FROM machine_data.machine_list`, async (err, data) => {
            if (err) logger.error(err);
            
            // console.log(data.length)
            for(let i =0 ; i<data.length;i++) {
                let customObject = {MachineName : "" , process : []}
                customObject.MachineName = data[i].refName

                //getting processForMachine
                
                 try {
                    mchQueryMod(`select * from machine_process_list where Machine_srl='${data[i].Machine_srl}'`, (err, datanew) => {
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

            await delay(1000)

            res.send(outputArray)
        })
    } catch (error) {
        next(error)
    }
});

machineAllotment.get('/profileListMachineswithLoad', async (req, res, next) => { 
    let outputArray = []
    try {
        misQueryMod(`SELECT DISTINCT m.refName , m.Machine_srl,m1.RefProcess,ncp.EstimatedTime AS TotalLoad FROM machine_data.machine_list m 
        JOIN machine_data.machine_process_list m1 ON m1.Machine_srl= m.Machine_srl 
        JOIN machine_data.operationslist o ON o.Operation=m1.RefProcess 
       JOIN machine_data.profile_cuttingoperationslist p ON p.OperationId=o.OperationID 
       LEFT JOIN magodmis.ncprograms ncp ON ncp.Machine = m.refName && ncp.Operation = m1.RefProcess && (ncp.PStatus = 'Created' || ncp.PStatus = 'MtrlReturn' || ncp.PStatus = 'Cutting' || ncp.PStatus = 'Mtrl Issue' || ncp.PStatus = 'Processing') 
        WHERE m.Working ;`, async (err, data) => { 
            if (err) logger.error(err);
                // Input data

            //       const output = [];
                  
            //       // Group the input data by MachineName
            //       const groupedData = data.reduce((acc, item) => {
            //         const { refName, RefProcess, TotalLoad } = item;
                  
            //         if (!acc[refName]) {
            //           acc[refName] = {
            //             MachineName: refName,
            //             process: [],
            //             load: 0,
            //             hours: 0,
            //             minutes: 0,
            //             formattedLoad: "00:00",
            //           };
            //         }
                  
            //         let processEntry = acc[refName].process.find(
            //             (process) => process.RefProcess === RefProcess
            //           );
            //         if (!processEntry) {
            //         acc[refName].process.push({
            //           RefProcess,
            //           processLoad: [{ TotalLoad: TotalLoad!=null?TotalLoad:TotalLoad }],
            //           formattedLoad: TotalLoad > 0 ? `00:${TotalLoad.toString().padStart(2, '0')}` : '00:00',
            //         });
            //         }
            //         else{

            //             acc[refName].process.forEach((element,index) => {
            //                 if(element.RefProcess == RefProcess){
            //                     acc[refName].process[index].processLoad[0].TotalLoad+=TotalLoad
            //                 }
                            
            //             });
            
            //         }
                  
            //         acc[refName].load += TotalLoad;
            //         acc[refName].hours = Math.floor(acc[refName].load / 60);
            //         acc[refName].minutes = acc[refName].load % 60;
            //         acc[refName].formattedLoad = `${acc[refName].hours.toString().padStart(2, '0')}:${acc[refName].minutes.toString().padStart(2, '0')}`;
                  
            //         return acc;
            //       }, {});
                  
            //       // Convert the grouped data to an array
            //       for (const machineName in groupedData) {
            //         output.push(groupedData[machineName]);
            //       }
                  
            //       console.log(JSON.stringify(output, null, 2));
                  
            // res.send(data)
            const output = [];

            // Group the input data by MachineName
            const groupedData = data.reduce((acc, item) => {
              const { refName, RefProcess, TotalLoad } = item;
            
              if (!acc[refName]) {
                acc[refName] = {
                  MachineName: refName,
                  process: [],
                  load: 0,
                  hours: 0,
                  minutes: 0,
                  formattedLoad: "00:00",
                };
              }
            
              let processEntry = acc[refName].process.find(
                (process) => process.RefProcess === RefProcess
              );
              if (!processEntry) {
                acc[refName].process.push({
                  RefProcess,
                  processLoad: [{ TotalLoad: TotalLoad != null ? TotalLoad : TotalLoad }],
                  formattedLoad: TotalLoad > 0 ? `00:${TotalLoad.toString().padStart(2, '0')}` : '00:00',
                //   procHours: 0,
                //   procMinutes: 0,
                });
              } else {
                acc[refName].process.forEach((element, index) => {
                  if (element.RefProcess === RefProcess) {
                    acc[refName].process[index].processLoad[0].TotalLoad += TotalLoad;
                  }
                });
              }
            
              acc[refName].load += TotalLoad;
              acc[refName].hours = Math.floor(acc[refName].load / 60);
              acc[refName].minutes = acc[refName].load % 60;
            
              // Apply the custom conditions and formulas
              const prochours = Math.floor(acc[refName].load / 60);
              const procminutes = acc[refName].load % 60;
              let procnewminutes = procminutes <= 9 ? "0" + procminutes : procminutes;
              let procnewhours = prochours <= 9 ? "0" + prochours : prochours;
            
              acc[refName].formattedLoad = `${procnewhours.toString().padStart(2, '0')}:${procnewminutes.toString().padStart(2, '0')}`;
            
              // Calculate prochours and procminutes for each RefProcess entry
              acc[refName].process.forEach((entry) => {
                // console.log(entry.processLoad[0].TotalLoad)
                procHours = Math.floor(entry.processLoad[0].TotalLoad / 60);
                procMinutes = entry.processLoad[0].TotalLoad % 60;
                entry.formattedLoad = entry.processLoad[0].TotalLoad != null ? `${procHours.toString().padStart(2, '0')}:${procMinutes.toString().padStart(2, '0')}` : '00:00';
              });
            
              return acc;
            }, {});
            
            // Convert the grouped data to an array
            for (const machineName in groupedData) {
              output.push(groupedData[machineName]);
            }
            
            // console.log(JSON.stringify(output, null, 2));
            
            res.send(output);
        })
    } catch (error) {
        next(error)
    }
});


// NCprogram tab table data for machine
machineAllotment.post('/getNCprogramTabTableDatauseEffect', jsonParser, async (req, res, next) => {
    // console.log('/getNCprogramTabTableDatauseEffect request is ', req.body.length);
    try {
      setTimeout(() => {
        misQueryMod(
          `SELECT *, c.Cust_name FROM magodmis.ncprograms ncp
          INNER JOIN magodmis.cust_data c ON c.Cust_Code = ncp.Cust_Code
          WHERE ncp.PStatus = 'Created' OR ncp.PStatus = 'MtrlReturn' 
          OR ncp.PStatus = 'Cutting' OR ncp.PStatus = 'Mtrl Issue'
          OR ncp.PStatus = 'Processing' ORDER BY NCProgramNo DESC`,
          (err, data) => {
            if (err) logger.error(err);
            // console.log(data);
            res.send(data);
          }
        );
      }); // 10 seconds delay
  
    } catch (error) {
      next(error);
    }
  });
  



// NCprogram tab table data for machine
machineAllotment.post('/getNCprogramTabTableData', jsonParser ,  async (req, res, next) => {
    // console.log('/getNCprogramTabTableData request is ' , req.body.length)
    try {
    //    console.log(req.body.MachineName.MachineName) 
        misQueryMod(` SELECT * , c.Cust_name  FROM magodmis.ncprograms ncp
        inner join magodmis.cust_data c on c.Cust_Code = ncp.Cust_Code
        where ncp.Machine = '${req.body.MachineName.MachineName}' && (PStatus = 'Created' || PStatus = 'MtrlReturn' || PStatus = 'Cutting' || PStatus = 'Mtrl Issue' || PStatus = 'Processing' ) ORDER BY NCProgramNo DESC`, (err, data) => {
            if (err) logger.error(err);
            // console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }

    //res.send('Request Recieved')  
});

///////
machineAllotment.post('/afterChangeMachine', jsonParser ,  async (req, res, next) => {
    try {
        if (req.body.MachineName==undefined) {
            // If MachineName is null or undefined, send an empty array as the response
            res.send([]);
            return; // Exit the function early
        }
        
        misQueryMod(` SELECT * , c.Cust_name  FROM magodmis.ncprograms ncp
        INNER JOIN magodmis.cust_data c ON c.Cust_Code = ncp.Cust_Code
        WHERE ncp.Machine = '${req.body.MachineName}' && (PStatus = 'Created' || PStatus = 'MtrlReturn' || PStatus = 'Cutting' || PStatus = 'Mtrl Issue' || PStatus = 'Processing')`, (err, data) => {
            if (err) {
                logger.error(err);
                res.status(500).send('Internal Server Error');
            } else {
                res.send(data);
            }
        });
    } catch (error) {
        next(error);
    }
});


machineAllotment.get('/machineAllotmentSchedule', jsonParser ,  async (req, res, next) => {
    // console.log('/machineAllotmentSchedule')

    
         try {
      // console.log(req.body.MachineName.MachineName)
        misQueryMod(`SELECT os.* , c.Cust_name FROM magodmis.orderschedule os
        join magodmis.cust_data c on c.Cust_Code = os.Cust_Code
         where os.Type = 'Profile' && ( os.Schedule_Status = 'Production' || os.Schedule_Status = 'Programmed' || os.Schedule_Status = 'Tasked') `, (err, data) => {
            if (err) logger.error(err);
            //console.log(data.length)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
    
    //res.send('Request Recieved')  
});

machineAllotment.post('/machineAllotmentScheduleTableForm', jsonParser ,  async (req, res, next) => {
    // console.log('/machineAllotmentScheduleTableForm' , req.body)

    // console.log(req.body.Operation)
         try {
      // console.log(req.body.MachineName.MachineName)
        misQueryMod(`SELECT ntl.* , c.Cust_name  FROM magodmis.nc_task_list ntl 
        join magodmis.cust_data c on c.Cust_Code = ntl.Cust_Code
        where ntl.ScheduleId = '${req.body.ScheduleId}' `, (err, data) => {
            if (err) logger.error(err);
            //console.log(data.length)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
    
    //res.send('Request Recieved')  
});

machineAllotment.post('/machineAllotmentScheduleTableFormMachines', jsonParser ,  async (req, res, next) => {
    // console.log('/machineAllotmentScheduleTableFormMachines',req.body.Operation)

    // console.log()
         try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
         machine_data.profile_cuttingoperationslist p 
         WHERE m1.Machine_srl=m.Machine_srl AND o.Operation=m1.RefProcess 
         AND m.Working AND p.OperationId=o.OperationID AND o.Operation='${req.body.Operation}'`, (err, data) => {
            if (err) logger.error(err);
            // console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
    
    //res.send('Request Recieved')  
});

machineAllotment.post('/changeMachineInForm', jsonParser ,  async (req, res, next) => {
    // console.log('/changeMachineInForm',req.body);

    // console.log(req.body.Operation)
         try {
        misQueryMod(`update magodmis.nc_task_list ntl 
        SET Machine = '${req.body.newMachine}' WHERE NcTaskId='${req.body.NcTaskId}';`, (err, data) => {
            if (err) logger.error(err);
            // console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
    
    //res.send('Request Recieved')  
});

machineAllotment.post('/releaseForProgramming', jsonParser ,  async (req, res, next) => {
    // console.log('/releaseForProgramming')
    // console.log(req.body.Operation) 
         try {
        misQueryMod(`update magodmis.nc_task_list ntl 
        SET TStatus = 'Programming' WHERE NcTaskId='${req.body.NcTaskId}';`, (err, data) => {
            if (err) logger.error(err);
            // console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

machineAllotment.post('/changeMachineHeaderButton', jsonParser ,  async (req, res, next) => {
    // console.log('/changeMachineHeaderButton' , req.body.newMachine,req.body.programs[i].NCProgramNo);

    for( let i =0 ; i< req.body.programs.length ; i++) {
        // console.log('inside for loop' , req.body.programs[i].NCProgramNo)
        if (req.body.programs[i].PStatus === 'Mtrl Issue') {
            try {
                misQueryMod(`update magodmis.ncprograms 
                SET Machine = '${req.body.newMachine}',Pstatus='Created' WHERE NCProgramNo='${req.body.programs[i].NCProgramNo}'`, (err, data) => {
                    if (err) logger.error(err); 
                    // console.log(data)
                    //res.send(data)
                })
            } catch (error) {
                next(error)
            }           } else {
                try {
                    misQueryMod(`update magodmis.ncprograms 
                    SET Machine = '${req.body.newMachine}',Pstatus='Created' WHERE NCProgramNo='${req.body.programs[i].NCProgramNo}'`, (err, data) => {
                        if (err) logger.error(err); 
                        // console.log(data)
                        //res.send(data)
                    })
                } catch (error) {
                    next(error)
                }           }
    }
    res.send('Request Recieved')  
});


machineAllotment.post('/formRefresh', jsonParser ,  async (req, res, next) => {
    // console.log('/formRefresh')
    // console.log(req.body)
         try {
        misQueryMod(`select * from magodmis.nc_task_list
         WHERE NcTaskId='${req.body.NcTaskId}'`, (err, data) => {
            if (err) logger.error(err);
            // console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

module.exports = machineAllotment;