const machineSetup = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

// create application/json parser
var jsonParser = bodyParser.json()


// //gives a list of all machines 
// machineSetup.get('/getallmachines', async (req, res, next) => {
//     console.log('requested')
//     try {
//         mchQueryMod("Select * from machine_data.machine_list where activeMachine=1", (err, data) => {
//             if (err) logger.error(err);
//             //console.log(data)
//             let newData = data;
//             for(let i =0; i<data.length;i++){
//                // console.log(data[i].InstallDate)
//                 //console.log(data[i].UnistallDate)
//                 if(data[i].InstallDate == null){
//                   //  console.log('InstallDate is Null')
//                 } else {
//                   //  console.log(data[i].InstallDate , 'Install Date in STRING')
//                   //  console.log(moment(data[i].InstallDate).format('YYYY-MM-DD') , 'Converted DATE FROM mONMENT')
//                     data[i].InstallDate = moment(data[i].InstallDate).format('YYYY-MM-DD')
//                 }

//                 if(data[i].UnistallDate == null){
//                   //  console.log('Uninstall Date  is Null')
//                 } else {
//                   //  console.log(data[i].UnistallDate , 'Uninstall Date in STRING')
//                   //  console.log(moment(data[i].UnistallDate).format('YYYY-MM-DD') , 'Converted DATE FROM mONMENT')
//                     data[i].UnistallDate = moment(data[i].UnistallDate).format('YYYY-MM-DD')
//                 }

//             }
//            // console.log('newData' , newData[0])     
//             res.send(data)
//         })
//     } catch (error) {
//         next(error)
//     }
// });

//gives a list of all machines 
machineSetup.get('/getallmachines', async (req, res, next) => {
    //console.log('requested')
    try {
        mchQueryMod("Select * from machine_data.machine_list where activeMachine=1 ORDER BY Machine_srl DESC", (err, data) => {
            if (err) logger.error(err);
            //console.log(data)
            let newData = data;
            for(let i =0; i<data.length;i++){
               // console.log(data[i].InstallDate)
                //console.log(data[i].UnistallDate)
                if(data[i].InstallDate == null){ 
                  //  console.log('InstallDate is Null')
                } else {
                  //  console.log(data[i].InstallDate , 'Install Date in STRING')
                  //  console.log(moment(data[i].InstallDate).format('YYYY-MM-DD') , 'Converted DATE FROM mONMENT')
                    data[i].InstallDate = moment(data[i].InstallDate).format('YYYY-MM-DD')
                }

                if(data[i].UnistallDate == null){
                  //  console.log('Uninstall Date  is Null')
                } else {
                  //  console.log(data[i].UnistallDate , 'Uninstall Date in STRING')
                  //  console.log(moment(data[i].UnistallDate).format('YYYY-MM-DD') , 'Converted DATE FROM mONMENT')
                    data[i].UnistallDate = moment(data[i].UnistallDate).format('YYYY-MM-DD')
                }

            }
            let isRegnNumberPresent = null;
            let isLocationPresent = null;
            let isInstallDatePresent = null;
            let newArr1 = [];
            let newArr2 = [];
            let newArr3 = [];
            newArr1 = data.map(v => ({...v, isRegnNumberPresent: true}))
            //newArr1 = newArr1.map(v => ({...v, isLocationPresent: false}))
           // newArr1 = newArr1.map(v => ({...v, isInstallDatePresent: false}))
            //console.log(data[0].RegnNo)

            for( let i = 0; i<newArr1.length ; i++) { 
               // console.log( 'Registration NUMBER IS ' , newArr1[i].RegnNo , 'Location is ' , newArr1[i].location , ' Install Date is ' , newArr1[i].InstallDate , 'For Machine Serial ' , newArr1[i].Machine_srl)
                if(newArr1[i].RegnNo === null || newArr1[i].RegnNo==='') {
                    //console.log(' Inside Register Number is null')
                    newArr1[i].isRegnNumberPresent = false
                } 

            }

            newArr2 = newArr1.map(v => ({...v, isLocationPresent: true}))

            for( let i = 0; i<newArr2.length ; i++) { 
                // console.log( 'Registration NUMBER IS ' , newArr1[i].RegnNo , 'Location is ' , newArr1[i].location , ' Install Date is ' , newArr1[i].InstallDate , 'For Machine Serial ' , newArr1[i].Machine_srl)
                 if(newArr2[i].location === null || newArr2[i].location === '') {
                    // console.log(' Inside Register Number is null')
                     newArr2[i].isLocationPresent = false
                 } 
 
             }

             newArr3 = newArr2.map(v => ({...v, isInstallDatePresent: true}))
             for( let i = 0; i<newArr3.length ; i++) { 
               // console.log( 'Registration NUMBER IS ' , newArr1[i].RegnNo , 'Location is ' , newArr1[i].location , ' Install Date is ' , newArr1[i].InstallDate , 'For Machine Serial ' , newArr1[i].Machine_srl)
                if(newArr3[i].InstallDate === null || newArr3[i].InstallDate === '') {
                   // console.log(' Inside Install Date is null')
                    newArr3[i].isInstallDatePresent = false 
                } 

            }
            res.send(newArr3)
        })
    } catch (error) {
        next(error)
    }
});

//drop down list for machine type 
machineSetup.get('/getMachineTypes', async (req, res, next) => {
    try {
        mchQueryMod("Select *  from machine_data.machinetype", (err, data) => {
            if (err) logger.error(err);
           // console.log(data)
           // console.log(data.length)
            let machineTypes = [];
            
            for (let i = 0; i < data.length; i++) {
                machineTypes[i] = data[i].MachineType
              }
              //console.log(machineTypes)
            res.send(machineTypes)
        })
    } catch (error) {
        next(error)
    }
});




//adds a new machine to the db 
machineSetup.post('/addNewMachine', jsonParser ,  async (req, res, next) => {

    try {
        //nested try block to check refNo is always unique
        try {
            mchQueryMod(`Select refName from machine_data.machine_list where refName ='${req.body.refName}'`, (err, data) => {
                if (err) logger.error(err);
                
                //console.log(data.length)
                //console.log(req.body.formdata.refName)
                if (data.length == 1) {
                    
                    res.send('Reference number is already present, please enter a new Reference Number')
                } else {
                    mchQueryMod(`INSERT INTO machine_data.machine_list(refName ,manufacturer , Model , Machine_Type, activeMachine) VALUES ( '${req.body.refName}' , '${req.body.manufacturer}',  '${req.body.model}' , '${req.body.Machine_Type}', 1 )`, (err, data) => {
                        if (err) {
                            logger.error(err);
                            //console.log('The error is ' + err)
                            res.send(err)
                            
                        } else {
                            //res.send(data)
                            res.send(req.body.manufacturer + " , " + req.body.model + " " + "added as " + req.body.refName + " " + "to Magod Machine List")
                        }
                        
                    })
                }
                
            })
        } catch (error) {
            next(error)
        }
        
    } catch (error) {
        console.log(error)
        next(error)
    }
});

//saves or updates the  new machine details to the db 
machineSetup.post('/saveMachine', jsonParser ,  async (req, res, next) => {
    let machineInstallDate = null;
    let machineUninstallDate = null;
    console.log(req.body.UnistallDate);

    if (req.body.UnistallDate === '' && req.body.InstallDate != '') {
        try {
            mchQueryMod(`UPDATE machine_data.machine_list SET remarks='${req.body.remarks}', InstallDate='${req.body.InstallDate}', TgtRate='${req.body.TgtRate}', Working='${req.body.Working}', location='${req.body.location}', RegnNo='${req.body.RegnNo}', Machine_Type='${req.body.Machine_Type}' WHERE refName='${req.body.refName}'`, (err, data) => {
                if (err) logger.error(err);
                res.send(data);
            });
        } catch (error) {
            next(error);
        }
    } else if (req.body.InstallDate === '' && req.body.UnistallDate != '') {
        try {
            mchQueryMod(`UPDATE machine_data.machine_list SET remarks='${req.body.remarks}', UnistallDate='${req.body.UnistallDate}', TgtRate='${req.body.TgtRate}', Working='${req.body.Working}', location='${req.body.location}', RegnNo='${req.body.RegnNo}', Machine_Type='${req.body.Machine_Type}' WHERE refName='${req.body.refName}'`, (err, data) => {
                if (err) logger.error(err);
                res.send(data);
            });
        } catch (error) {
            next(error);
        }
    } else if (req.body.UnistallDate === '' && req.body.InstallDate === '') {
        try {
            mchQueryMod(`UPDATE machine_data.machine_list SET remarks='${req.body.remarks}', TgtRate='${req.body.TgtRate}', Working='${req.body.Working}', location='${req.body.location}', RegnNo='${req.body.RegnNo}', Machine_Type='${req.body.Machine_Type}', UnistallDate='${req.body.UnistallDate}' WHERE refName='${req.body.refName}'`, (err, data) => {
                if (err) logger.error(err);
                res.send(data);
            });
        } catch (error) {
            next(error);
        }
    } else {
        try {
            mchQueryMod(`UPDATE machine_data.machine_list SET remarks='${req.body.remarks}', InstallDate='${req.body.InstallDate}', UnistallDate='${req.body.UnistallDate}', TgtRate='${req.body.TgtRate}', Working='${req.body.Working}', location='${req.body.location}', RegnNo='${req.body.RegnNo}', Machine_Type='${req.body.Machine_Type}' WHERE refName='${req.body.refName}'`, (err, data) => {
                if (err) logger.error(err);
                res.send(data);
            });
        } catch (error) {
            next(error);
        }
    }
});

//fetch single machine details
machineSetup.post('/getMachine', jsonParser , async (req, res, next) => {
    //console.log(req.body)
    try {
        mchQueryMod(`Select * from machine_data.machine_list where refName='${req.body.refName}'`, (err, data) => {
            if (err) logger.error(err);
            for(let i =0; i<data.length;i++){
                // console.log(data[i].InstallDate)
                 //console.log(data[i].UnistallDate)
                 if(data[i].InstallDate == null){
                   //  console.log('InstallDate is Null')
                 } else {
                   //  console.log(data[i].InstallDate , 'Install Date in STRING')
                   //  console.log(moment(data[i].InstallDate).format('YYYY-MM-DD') , 'Converted DATE FROM mONMENT')
                     data[i].InstallDate = moment(data[i].InstallDate).format('YYYY-MM-DD')
                 }
 
                 if(data[i].UnistallDate == null){
                   //  console.log('Uninstall Date  is Null')
                 } else {
                   //  console.log(data[i].UnistallDate , 'Uninstall Date in STRING')
                   //  console.log(moment(data[i].UnistallDate).format('YYYY-MM-DD') , 'Converted DATE FROM mONMENT')
                     data[i].UnistallDate = moment(data[i].UnistallDate).format('YYYY-MM-DD')
                 }
 
             }
             let isRegnNumberPresent = null;
             let isLocationPresent = null;
             let isInstallDatePresent = null;
             let newArr1 = [];
             let newArr2 = [];
             let newArr3 = [];
             newArr1 = data.map(v => ({...v, isRegnNumberPresent: true}))
             //newArr1 = newArr1.map(v => ({...v, isLocationPresent: false}))
            // newArr1 = newArr1.map(v => ({...v, isInstallDatePresent: false}))
             //console.log(data[0].RegnNo)
 
             for( let i = 0; i<newArr1.length ; i++) { 
                // console.log( 'Registration NUMBER IS ' , newArr1[i].RegnNo , 'Location is ' , newArr1[i].location , ' Install Date is ' , newArr1[i].InstallDate , 'For Machine Serial ' , newArr1[i].Machine_srl)
                 if(newArr1[i].RegnNo === null || newArr1[i].RegnNo==='') {
                     //console.log(' Inside Register Number is null')
                     newArr1[i].isRegnNumberPresent = false
                 } 
 
             }
 
             newArr2 = newArr1.map(v => ({...v, isLocationPresent: true}))
 
             for( let i = 0; i<newArr2.length ; i++) { 
              //    console.log( 'Registration NUMBER IS ' , newArr1[i].RegnNo , 'Location is ' , newArr1[i].location , ' Install Date is ' , newArr1[i].InstallDate , 'For Machine Serial ' , newArr1[i].Machine_srl)
                  if(newArr2[i].location === null || newArr2[i].location === '') {
                      console.log(' Inside Register Number is null')
                      newArr2[i].isLocationPresent = false
                  } 
  
              }
 
              newArr3 = newArr2.map(v => ({...v, isInstallDatePresent: true}))
              for( let i = 0; i<newArr3.length ; i++) { 
           //      console.log( 'Registration NUMBER IS ' , newArr1[i].RegnNo , 'Location is ' , newArr1[i].location , ' Install Date is ' , newArr1[i].InstallDate , 'For Machine Serial ' , newArr1[i].Machine_srl)
                 if(newArr3[i].InstallDate === null || newArr3[i].InstallDate === '') {
              //       console.log(' Inside Install Date is null')
                     newArr3[i].isInstallDatePresent = false 
                 } 
 
             }
            res.send(newArr3)
        })
    } catch (error) {
        next(error)
    }
});



//delete machine 
machineSetup.post('/deleteMachine', jsonParser , async (req, res, next) => {
    //console.log(req.body)
    try {
        mchQueryMod(`UPDATE  machine_list SET activeMachine = '0' WHERE refName='${req.body.refName}'`, (err, data) => {
            if (err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

//add process to machine
machineSetup.get('/getAllProcessList', jsonParser , async (req, res, next) => {
    //console.log(req.body)
    try {
        mchQueryMod(`select * from machine_data.magod_process_list where Active='1' ORDER BY Id DESC`, (err, data) => {
            if (err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});


//adds a process to the machine //add process and save process button
machineSetup.post('/addProcessToMachine', jsonParser , async (req, res, next) => {
   // console.log('Add Process To Machine' , req.body)
    try {
        mchQueryMod(`INSERT INTO machine_data.machine_process_list(Machine_srl ,Mprocess , RefProcess , TgtRate,Active) VALUES ( '${req.body.Machine_srl}' , '${req.body.Mprocess}',  '${req.body.RefProcess}' , '${req.body.TgtRate}',1)`, (err, data) => {
            if (err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
}); 

//fetch all the process for the machine
machineSetup.post('/getProcessForMachine', jsonParser , async (req, res, next) => {
    try {
        mchQueryMod(`select * from machine_process_list where Machine_srl='${req.body.Machine_srl}' and Active='1'  ORDER BY Id DESC`, (err, data) => {
            if (err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

//deletes a process from the machine
machineSetup.post('/deleteProcessFromMachine', jsonParser , async (req, res, next) => {
    //console.log(req.body)
    try {
        mchQueryMod(`Update machine_process_list set Active='0' where Machine_srl='${req.body.Machine_srl}' and Mprocess='${req.body.Mprocess}'`, (err, data) => {
            if (err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

//fetch process list for machine using Machine Ref name 
machineSetup.post('/getProcessForMachineRefName', jsonParser , async (req, res, next) => {    
    try {
        mchQueryMod(`Select * from machine_list where refName='${req.body.refName}'`, (err, data) => {
            if (err) logger.error(err);
           // res.send(data)
         //  console.log(data[0].Machine_srl)
           
           try {
            mchQueryMod(`Select * from machine_process_list where Machine_srl='${data[0].Machine_srl}'`, (err, data1) => {
                if (err) logger.error(err);
                res.send(data1) 
            })
        } catch (error) {
            next(error)
        }
        })
    } catch (error) {
        next(error)
    }
});



module.exports = machineSetup;