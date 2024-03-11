const machineAllotmentService = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod , productionQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

var jsonParser = bodyParser.json() 

function delay(time) { 
    return new Promise(resolve => setTimeout(resolve, time));
  }


  machineAllotmentService.get('/MachineswithLoadService', async (req, res, next) => { 
    let outputArray = []
    try {
        misQueryMod(` SELECT DISTINCT m.refName , m.Machine_srl,m1.RefProcess,ncp.EstimatedTime AS TotalLoad FROM machine_data.machine_list m 
        JOIN machine_data.machine_process_list m1 ON m1.Machine_srl= m.Machine_srl 
        JOIN machine_data.operationslist o ON o.Operation=m1.RefProcess 
       JOIN machine_data.service_operationslist p ON p.OperationId=o.OperationID 
       LEFT JOIN magodmis.ncprograms ncp ON ncp.Machine = m.refName && ncp.Operation = m1.RefProcess && (ncp.PStatus = 'Created' || ncp.PStatus = 'MtrlReturn' || ncp.PStatus = 'Cutting' || ncp.PStatus = 'Mtrl Issue' || ncp.PStatus = 'Processing') 
        WHERE m.Working;`, async (err, data) => { 
            if (err) logger.error(err);
            //console.log('data length is ' , data.length)
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
machineAllotmentService.post('/getNCprogramTabTableData', jsonParser ,  async (req, res, next) => {
    try {
        misQueryMod(` SELECT * , c.Cust_name  FROM magodmis.ncprograms ncp
        inner join magodmis.cust_data c on c.Cust_Code = ncp.Cust_Code
        where ncp.Machine = '${req.body.MachineName.MachineName}' && (PStatus = 'Cutting' || PStatus = 'Mtrl Issue' || PStatus = 'Created' || PStatus = 'Processing' || PStatus = 'Mtrl Return')`, (err, data) => {
            if (err) logger.error(err);
            //console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }

}); 

machineAllotmentService.post('/afterChangeMachine', jsonParser ,  async (req, res, next) => {
    try {
      //  console.log(req.body.MachineName.MachineName)
        misQueryMod(` SELECT * , c.Cust_name  FROM magodmis.ncprograms ncp
        inner join magodmis.cust_data c on c.Cust_Code = ncp.Cust_Code
        where ncp.Machine = '${req.body.MachineName}' && (PStatus = 'Cutting' || PStatus = 'Mtrl Issue' || PStatus = 'Created' || PStatus = 'Processing' || PStatus = 'Mtrl Return')`, (err, data) => {
            if (err) logger.error(err);
            //console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }

    //res.send('Request Recieved')  
}); 

machineAllotmentService.get('/machineAllotmentServiceSchedule', jsonParser ,  async (req, res, next) => {
    // console.log('/machineAllotmentSchedule')
         try {
      // console.log(req.body.MachineName.MachineName)
        misQueryMod(`SELECT os.* , c.Cust_name FROM magodmis.orderschedule os
        join magodmis.cust_data c on c.Cust_Code = os.Cust_Code
         where os.Type = 'Service' && ( os.Schedule_Status = 'Production' || os.Schedule_Status = 'Programmed' || os.Schedule_Status = 'Tasked') `, (err, data) => {
            if (err) logger.error(err);
            //console.log(data.length)
            res.send(data)  
        })
    } catch (error) {
        next(error) 
    } 
    
    //res.send('Request Recieved')   
});

machineAllotmentService.post('/machineAllotmentScheduleTableFormMachinesService', jsonParser ,  async (req, res, next) => {
    // console.log('/machineAllotmentScheduleTableFormMachines')

    // console.log(req.body.Operation)
         try {
        misQueryMod(`SELECT distinct m.refName , m.Machine_srl FROM machine_data.machine_list m,
        machine_data.machine_process_list m1,machine_data.operationslist o,
        machine_data.service_operationslist p 
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


module.exports = machineAllotmentService;