const shiftEditor = require("express").Router();
const { misQuery, setupQuery, misQueryMod, mchQueryMod , productionQueryMod } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

// create application/json parser
var jsonParser = bodyParser.json() 


// Returns the type of Shifts - First, Second , Third , General, Special
shiftEditor.get('/typesOfShifts', async (req, res, next) => {
    // console.log('Types of Shifts Request')
    const shifts = [ "First" , "Second" , "Third" , "General"]
    res.send(shifts)  
});

//Returns the types of shifts and their timings
shiftEditor.get('/shiftTimings', async (req, res, next) => {
    try {
        const shiftInchargeNames = [];
        productionQueryMod("Select * from magod_production.shiftdb", (err, data) => {
            if (err) logger.error(err);
            // for (let i = 0; i < data.length; i++) {
            //     shiftInchargeNames[i] = data[i].Name
            //   }
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});


//Returns the List of ShiftIncharges , in the organisation
shiftEditor.get('/shiftInchargeList', async (req, res, next) => {
    // console.log('Shift Incharge List Requested')
    try {
        const shiftInchargeNames = [];
        productionQueryMod(`Select Name from magod_production.shift_ic_list where Active='1'`, (err, data) => {
            if (err) logger.error(err);
            for (let i = 0; i < data.length; i++) {
                shiftInchargeNames[i] = data[i].Name
              }
            res.send(shiftInchargeNames)
        })
    } catch (error) {
        next(error)
    }
});

// Creates Weekly Shift Planner 
shiftEditor.post('/createWeeklyShiftPlan', jsonParser, async (req, res, next) => {
    let inputArray = req.body;
    let shiftDataPresent = false; // Flag to track whether shift data is already present

    for (let i = 0; i < inputArray.length; i++) {
        if (inputArray[i].isChecked === false) {
            try {
                await new Promise((resolve, reject) => {
                    // Check if shift data exists for the date and shift
                    misQueryMod(
                        `SELECT * FROM day_shiftregister WHERE ShiftDate = '${inputArray[i].ShiftDate}' AND Shift = '${inputArray[i].Shift}'`,
                        (err, data) => {
                            if (err) {
                                logger.error(err);
                                return reject(err);
                            }

                            if (data.length > 0) {
                                shiftDataPresent = true; // Shift data is already present
                            }

                            resolve();
                        }
                    );
                });

                if (!shiftDataPresent) {
                    // If shift data is not present, insert the record
                    await new Promise((resolve, reject) => {
                        misQueryMod(
                            `INSERT INTO day_shiftregister (ShiftDate, Shift, FromTime, ToTime, Shift_Ic) VALUES ('${inputArray[i].ShiftDate}', '${inputArray[i].Shift}', '${inputArray[i].FromTime}', '${inputArray[i].ToTime}', '${inputArray[i].Shift_Ic}' )`,
                            (err, data) => {
                                if (err) {
                                    logger.error(err);
                                    return reject(err);
                                }
                                resolve();
                            }
                        );
                    });
                }
            } catch (error) {
                next(error);
                return;
            }
        }
    }

    if (shiftDataPresent) {
        res.send('Shift Data Already present');
    } else {
        res.send('Shift Data Successfully added');
    }
});

/////4TH TABLE
// shiftEditor.post('/getDailyShiftPlanTable', jsonParser, async (req, res, next) => {
//     console.log('/getDailyShiftPlanTable', req.body);
//     const shiftDate = req.body.ShiftDate?.item; // Safely access the ShiftDate property
//     const dateSplit = shiftDate.split("/");
//     const [day, month, year] = dateSplit;
//     const finalDay = `${year}-${month}-${day}`;
//     console.log("Final Date in 4th Table ", finalDay);

//     try {
//         productionQueryMod(`SELECT * FROM day_shiftregister WHERE ShiftDate='${finalDay}'`, (err, data) => {
//             if (err) {
//                 console.error(err);
//                 next(err); // Pass the error to the error handling middleware
//             } else {
//                 console.log("4th Table response is ", data);
//                 res.send(data); // Send the data response
//             }
//         });
//     } catch (error) {
//         console.error(error);
//         next(error); // Pass the error to the error handling middleware
//     }
// });

/////////////////////////

//4th Row First Table 
shiftEditor.post('/getDailyShiftPlanTable', jsonParser ,  async (req, res, next) => {
//    console.log('/getDailyShiftPlanTable' , req.body)
   try {
    const shiftDate = req.body.ShiftDate?.item; // Safely access the ShiftDate property
    if (!shiftDate) {
        return res.status(400).send('ShiftDate is missing in the request body');
    }
    const dateSplit = shiftDate.split("/");
    const [day, month, year] = dateSplit;
    const finalDay = `${year}-${month}-${day}`;
    // console.log("required final day",finalDay)
   
    misQueryMod(`SELECT * FROM day_shiftregister WHERE ShiftDate='${finalDay}'`, (err, data) => {
        // console.log("Shift Editor",data)
        if (err) {
            console.error(err);
            return res.status(500).send('An error occurred while querying the database');
        }

        if (data === null || data.length === 0) {
            console.log('DATA IS EMPTY');
            return res.send([]);
        } else {
            // console.log('DATA IS PRESENT');
            // console.log("response required for that date is", data);
            return res.send(data);
        }
    });
} catch (error) {
    console.error(error);
    return res.status(500).send('An unexpected error occurred');
}
});



// Gets Information of weekly shift plan
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  } 
 shiftEditor.post('/getWeeklyShiftPlanSecondTable', jsonParser ,  async (req, res, next) => {
    //delay is given so that as soon as the data is created from create week shift , the table has to get populated with all the records 
    // console.log('/getWeeklyShiftPlanSecondTable REQUEST IS ' , req.body)
    await delay(200);
    let newDates = [];
    if(req.body === '') {
        res.send(null)   
    } else {
        for(let i=0; i<req.body.length; i++) {
                    //console.log(letinputArray[i].ShiftDate)
                    let dateSplit = req.body[i].split("/");
                  let year = dateSplit[2];
                  let month = dateSplit[1];
                  let day = dateSplit[0];
                  let finalDay = year+"-"+month+"-"+day
                  req.body[i].ShiftDatae = finalDay
                  newDates.push(finalDay)
                  //console.log(finalDay)   
                }
                try {
                        misQueryMod(` SELECT * FROM day_shiftregister WHERE ShiftDate='${newDates[0]}' || ShiftDate='${newDates[1]}' || ShiftDate='${newDates[2]}' || ShiftDate='${newDates[3]}' || ShiftDate='${newDates[4]}' || ShiftDate='${newDates[5]}' || ShiftDate='${newDates[6]}'`, (err, data) => {
                            if (err) logger.error(err);
                            
                            if(data === null) {
                              //  console.log('DATA IS EMPTY')
                            } else {
                                // console.log('DATA IS PRESENT')
                                for(let i =0 ; i < data.length ; i++) {
                                    let dateSplit = data[i].ShiftDate.split("-");
                                    let year = dateSplit[2];
                                    let month = dateSplit[1];
                                    let day = dateSplit[0];
                                    let finalDay = year+"-"+month+"-"+day 
                                   // console.log( 'RESPONSE SHIFT DATE IS ' , finalDay)
                                    data[i].ShiftDate = finalDay 
            
                                    let dateSplitFromTime = data[i].FromTime.split("-");
                                    //console.log( ' DATE SPLIT RESPONSE From tIME IS ' , dateSplitFromTime)
                                    let yearFromTime = dateSplitFromTime[0];
                                    let monthFromTime = dateSplitFromTime[1];
                                    let dayFromTimeINITIAL = dateSplitFromTime[2].split(" ");
                                    let dayFromTimeFinal = dayFromTimeINITIAL[0]
                                    let time = dayFromTimeINITIAL[1]
                                    let finalDayFromTime = dayFromTimeFinal+"-"+monthFromTime+"-"+yearFromTime+" "+time
                                    //console.log( 'RESPONSE From tIME IS ' , finalDayFromTime)
                                    data[i].FromTime = finalDayFromTime 
            
                                    let dateSplitToTime = data[i].ToTime.split("-");
                                    // console.log( ' DATE SPLIT RESPONSE To tIME IS ' , dateSplitToTime)
                                    let yearToTime = dateSplitToTime[0];
                                    let monthToTime = dateSplitToTime[1];
                                    let dayToTimeINITIAL = dateSplitToTime[2].split(" ");
                                    let dayToTimeFinal = dayToTimeINITIAL[0]
                                    let time1 = dayToTimeINITIAL[1]
                                    let finalDayToTime= dayToTimeFinal+"-"+monthToTime+"-"+yearToTime+" "+time1
                                   // console.log( 'RESPONSE To tIME IS ' , finalDayToTime)
                                    data[i].ToTime = finalDayToTime 
                                    //data[i].FromTime = finalDayFromTime 
            
                                } 
                            }
                           // console.log('/getWeeklyShiftPlanSecondTable RESPONSE IS' , data)
                            res.send(data)
                            
                        })
                    } catch (error) {  
                        next(error)
                    }


    }
});

// Gets Information of the daily shift plan of a particular shift
shiftEditor.post('/getDailyShiftPlan', jsonParser ,  async (req, res, next) => {
    try { 
       
        misQueryMod(` SELECT * FROM day_shiftregister WHERE ShiftDate='${req.body.ShiftDate}' and Shift='${req.body.Shift}'`, (err, data) => {
            if (err) logger.error(err);
            
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

// Gets Information all the machine Operators
shiftEditor.get('/getMachineOperators', jsonParser ,  async (req, res, next) => {
   // console.log('/getMachineOperators REQUEST' , req.body)
    try {
       
        productionQueryMod(`SELECT * FROM magod_production.operator_list where  Active='1'`, (err, data) => {
            if (err) logger.error(err);
            
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

// Gets Information all the machine Operators for a particular Shift
shiftEditor.post('/getMachineOperatorsShift', jsonParser ,  async (req, res, next) => {
    // console.log("DayShiftID is",req.body);
    if(req.body.hasOwnProperty("DayShiftId")) {
        let dateSplit = req.body.ShiftDate.split("-");
        let year = dateSplit[2];
        let month = dateSplit[1];
        let day = dateSplit[0];
        let finalDay = year + "-" + month + "-" + day + " 00:00:00"
        // console.log('RESPONSE SHIFT DATE IS ', finalDay)
        req.body.ShiftDate = finalDay

        FromTime=req.body.FromTime.split(' ');
        FromTime1=FromTime[0].split('-')
        FromTimeNew=FromTime1[2]+"-"+FromTime1[1]+"-"+FromTime1[0]+" "+FromTime[1];

        ToTime=req.body.ToTime.split(' ');
        ToTime1=ToTime[0].split('-')
        ToTimeNew=ToTime1[2]+"-"+ToTime1[1]+"-"+ToTime1[0]+" "+ToTime[1];
        // console.log("finalDay",finalDay,"FromTimeNew is",FromTimeNew,"ToTimeNew",ToTimeNew);

        try { 
       
            misQueryMod(`SELECT * FROM magodmis.shiftregister where ShiftDate ='${finalDay}' and  Shift='${req.body.Shift}' and FromTime='${FromTimeNew}' and ToTime='${ToTimeNew}' ORDER BY ShiftID DESC`, (err, data) => {
                if (err) logger.error(err);  
                // console.log(' /getMachineOperatorsShift TABLE Response ' , data)
                res.send(data);
                // console.log("data",data); 
            })
        } catch (error) {
            next(error)  
        }
    } 
    
    //console.log(req.body.ShiftDate)
    
});

// Set Machine Operator For a Single Day 
shiftEditor.post('/setMachineOperatorDay', jsonParser, async (req, res, next) => {
    let newShift = "";
    let newShift1 = "";
    // Date formatting for ShiftDate
    let dateSplit = req.body.ShiftDate.split("-");
    let year = dateSplit[2];
    let month = dateSplit[1];
    let day = dateSplit[0];
    let finalDay = year + "-" + month + "-" + day + " 00:00:00";
    req.body.ShiftDate = finalDay;

    // Date formatting for FromTime
    let dateSplitFromTime = req.body.FromTime.split("-");
    let yearFromTime = dateSplitFromTime[2];
    let monthFromTime = dateSplitFromTime[1];
    let dayFromTime = dateSplitFromTime[0];
    let yearSplit = yearFromTime.split(" ");
    let finalDayFromTime = yearSplit[0] + "-" + monthFromTime + "-" + dayFromTime + " " + yearSplit[1];
    req.body.FromTime = finalDayFromTime;

    // Date formatting for ToTime
    let dateSplitToTime = req.body.ToTime.split("-");
    let yearToTime = dateSplitToTime[2];
    let monthToTime = dateSplitToTime[1];
    let dayToTime = dateSplitToTime[0];
    let yearSplit1 = yearToTime.split(" ");
    let finalDayToTime = yearSplit1[0] + "-" + monthToTime + "-" + dayToTime + " " + yearSplit1[1];
    req.body.ToTime = finalDayToTime;

    if (req.body.Shift === "First") {
        newShift = "General";
    } else if (req.body.Shift === "Second") {
        newShift = "General";
    } else if (req.body.Shift === "Third") {

        // Calculate the next day for toTime
        let shiftDate = new Date(finalDay);
        let nextDay = new Date(shiftDate);
        nextDay.setDate(nextDay.getDate() + 1); // Add one day

        // Format the next day's date
        let nextYear = nextDay.getFullYear();
        let nextMonth = ('0' + (nextDay.getMonth() + 1)).slice(-2); // Ensure month is 2 digits
        let nextDate = ('0' + nextDay.getDate()).slice(-2); // Ensure date is 2 digits
        let nextFinalDay = `${nextYear}-${nextMonth}-${nextDate}`;

    } else if (req.body.Shift === "General") {
        newShift = "First";
        newShift1 = "Second";
    }

    // req.body.FromTime = req.body.ShiftDate + fromTime;
    if (req.body.Shift !== "Third") {
    }

    try {
        // Check if the data already exists for the given ShiftDate, Operator, or Machine
        const [operatorData, machineData] = await Promise.all([
            new Promise((resolve, reject) => {
                misQueryMod(`SELECT * FROM magodmis.shiftregister WHERE ShiftDate='${req.body.ShiftDate}' AND (Shift='${req.body.Shift}' OR Shift='${newShift}' OR Shift='${newShift1}') AND Operator='${req.body.Operator}'`, (err, data) => {
                    if (err) {
                        console.error(err);
                        return reject(err);
                    }
                    resolve(data);
                });
            }),
            new Promise((resolve, reject) => {
                misQueryMod(`SELECT * FROM magodmis.shiftregister WHERE ShiftDate='${req.body.ShiftDate}'AND (Shift='${req.body.Shift}' OR Shift='${newShift}' OR Shift='${newShift1}') AND Machine='${req.body.Machine}'`, (err, data) => {
                    if (err) {
                        console.error(err);
                        return reject(err);
                    }
                    resolve(data);
                });
            })
        ]);

        if ((operatorData && operatorData.length > 0) || (machineData && machineData.length > 0)) {
            // Operator or Machine already present for the given ShiftDate
            res.send("Operator/Machine is already present");
        } else {
            // Operator and Machine not present, insert the new record
            misQueryMod(`INSERT INTO magodmis.shiftregister (ShiftDate, Shift, FromTime, ToTime, Machine, Operator, DayShiftID) VALUES 
                ('${req.body.ShiftDate}', '${req.body.Shift}', '${req.body.FromTime}', '${req.body.ToTime}', '${req.body.Machine}', '${req.body.Operator}', '${req.body.DayShiftID}')`, (err, data) => {
                if (err) {
                    console.error(err);
                    return next(err);
                }
                res.send("Data Successfully Added");
            });
        }
    } catch (error) {
        next(error);
    }
});

 

// Delete Machine Operator For a Single Day 
shiftEditor.post('/deleteMachineOperatorDay', jsonParser ,  async (req, res, next) => {
    // console.log("deleteMachineOperatorDay",req.body);

    try {
        misQueryMod(`DELETE FROM magodmis.shiftregister WHERE ShiftDate='${req.body.ShiftDate}' && Shift='${req.body.Shift}' && Machine='${req.body.Machine}' && Operator='${req.body.Operator}' and FromTime='${req.body.FromTime}' and ToTime='${req.body.ToTime}'`, (err, data) => {
            if (err) logger.error(err); 
          //  console.log(data)
            res.send(data) 
        })
    } catch (error) {
        next(error) 
    }

});

// Update Single Day Shift - Shift Incharge 
shiftEditor.post('/updateSingleDaySihiftIncharge', jsonParser ,  async (req, res, next) => {
    // console.log('/updateSingleDaySihiftIncharge REQUEST' , req.body)
    try {
       
        misQueryMod(` UPDATE  magodmis.day_shiftregister 
        SET Shift_Ic = '${req.body.newShift_Ic}'
        WHERE DayShiftId='${req.body.DayShiftId}'`, (err, data) => {
            if (err) logger.error(err);
            // console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }

    //res.send('Request Recieved')

});

// Update Single Day Shift - Shift Instructions
shiftEditor.post('/updateSingleDaySihiftInstructions', jsonParser ,  async (req, res, next) => {
    // console.log('/updateSingleDaySihiftInstructions REQUEST' , req.body)

    try {
       
        misQueryMod(` UPDATE  magodmis.day_shiftregister 
        SET Shift_instruction = '${req.body.shiftInstruction}'
        WHERE DayShiftId='${req.body.DayShiftId}'`, (err, data) => {
            if (err) logger.error(err);
           // console.log(data)
            res.send(data)
        }) 
    } catch (error) {
        next(error)  
    }

    //res.send('Request Recieved')
    
    
});

//Delete Operator For Week
shiftEditor.post('/deleteWeekOperatorForMachine', jsonParser ,  async (req, res, next) => {
    //console.log('/deleteWeekOperatorForMachine REQUEST' , req.body)

    let letinputArray = req.body.selectedWeek

    for(let i=0; i<letinputArray.length; i++) {
        //console.log(letinputArray[i].ShiftDate)
        let dateSplit = letinputArray[i].split("/");
      let year = dateSplit[2];
      let month = dateSplit[1];
      let day = dateSplit[0];
      let finalDay = year+"-"+month+"-"+day
      letinputArray[i] = finalDay + " 00:00:00"
      //console.log(finalDay) 
    }

   // console.log('After Date Conversion ' , letinputArray)
    for(let i =0; i<letinputArray.length;i++) {
        try {
        misQueryMod(` DELETE FROM magodmis.shiftregister WHERE Shift='${req.body.selectedShift}' && ShiftDate='${letinputArray[i]}' && Machine='${req.body.selectedMachine}' && Operator='${req.body.selectedOperator}' `, (err, data) => {
            if (err) logger.error(err);
            //console.log(data)
            //res.send(data)
        })
    } catch (error) { 
        next(error)
    } 

    } 
    res.send('Deleted Week Shift Operators')  
});


// Delete Week Shift 
shiftEditor.post('/deleteWeekShift', jsonParser ,  async (req, res, next) => {
    // console.log('/deleteWeekShift REQUEST' , req.body)
    let letinputArray = req.body.selectedWeek
    for(let i=0; i<letinputArray.length; i++) {
        //console.log(letinputArray[i].ShiftDate)
        let dateSplit = letinputArray[i].split("/");
      let year = dateSplit[2];
      let month = dateSplit[1];
      let day = dateSplit[0];
      let finalDay = year+"-"+month+"-"+day
      letinputArray[i] = finalDay
      //console.log(finalDay) 
    }
   // console.log('After Date Conversion ' , letinputArray)
    for(let i =0; i<letinputArray.length;i++) {
        try {
            misQueryMod(` DELETE FROM magodmis.shiftregister WHERE Shift='${req.body.selectedShift}' && ShiftDate='${letinputArray[i] + " 00:00:00"}'  `, (err, data) => {
                if (err) logger.error(err);
               // console.log(data)
                //res.send(data)
            })
        } catch (error) { 
            next(error)
        } 
        try {
        misQueryMod(` DELETE FROM magodmis.day_shiftregister WHERE Shift='${req.body.selectedShift}' && ShiftDate = '${letinputArray[i]}'`, (err, data) => {
            if (err) logger.error(err);
            //console.log(data)
            //res.send(data)
        })
    } catch (error) {
        next(error)
    }

    } 
    res.send('Deleted Week Shift ')  
});



// Delete Single Day Shift 
shiftEditor.post('/deleteSingleDayShift', jsonParser ,  async (req, res, next) => {
    //console.log('/deleteSingleDayShift REQUEST' , req.body)
    try {
       
        misQueryMod(` DELETE FROM magodmis.day_shiftregister WHERE DayShiftId='${req.body.DayShiftId}'`, (err, data) => {
            if (err) logger.error(err);
            //console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});


// getSingleDayDetailShiftInformation
shiftEditor.post('/setMachineOperators', jsonParser, async (req, res, next) => {
    let inputArray = req.body;

    let hasError = false;
    let operatorAlreadyPresent = false;

    for (let i = 0; i < inputArray.length; i++) {
        // Skip the record if `isChecked` is true
        if (inputArray[i].isChecked) {
            continue; 
        }

        // Date formatting code
        let dateSplit = inputArray[i].ShiftDate.split("/");
        let year = dateSplit[2];
        let month = dateSplit[1];
        let day = dateSplit[0];
        let finalDay = `${year}-${month}-${day}`;
        inputArray[i].ShiftDate = finalDay;

        // Determine fromTime and toTime based on the Shift type
        let fromTime = "";
        let toTime = "";
        let newShift = "";
        let newShift1 = "";
        if (inputArray[i].Shift === "First") {
            fromTime = " 06:00:00";
            toTime = " 14:00:00";
            newShift = "General";
        } else if (inputArray[i].Shift === "Second") {
            fromTime = " 14:00:00";
            toTime = " 22:00:00";
            newShift = "General";
        } else if (inputArray[i].Shift === "Third") {
            fromTime = " 22:00:00";

            // Calculate the next day for toTime
            let shiftDate = new Date(finalDay);
            let nextDay = new Date(shiftDate);
            nextDay.setDate(nextDay.getDate() + 1);

            let nextYear = nextDay.getFullYear();
            let nextMonth = ('0' + (nextDay.getMonth() + 1)).slice(-2);
            let nextDate = ('0' + nextDay.getDate()).slice(-2);
            let nextFinalDay = `${nextYear}-${nextMonth}-${nextDate}`;

            toTime = " 06:00:00";
            inputArray[i].ToTime = nextFinalDay + toTime;
        } else if (inputArray[i].Shift === "General") {
            fromTime = " 09:00:00";
            toTime = " 17:00:00";
            newShift = "First";
            newShift1 = "Second";
        }

        inputArray[i].FromTime = inputArray[i].ShiftDate + fromTime;
        if (inputArray[i].Shift !== "Third") {
            inputArray[i].ToTime = inputArray[i].ShiftDate + toTime;
        }

        try {
            // Prepare the queries
            const operatorQuery = `SELECT * FROM magodmis.shiftregister WHERE ShiftDate='${inputArray[i].ShiftDate}' AND (Shift='${inputArray[i].Shift}' OR Shift='${newShift}' OR Shift='${newShift1}')  AND Operator='${inputArray[i].Operator}'`;
            const machineQuery = `SELECT * FROM magodmis.shiftregister WHERE ShiftDate='${inputArray[i].ShiftDate}' AND (Shift='${inputArray[i].Shift}' OR Shift='${newShift}' OR Shift='${newShift1}') AND Machine='${inputArray[i].Machine}'`;

            const [operatorData, machineData] = await Promise.all([
                new Promise((resolve, reject) => {
                    misQueryMod(operatorQuery, (err, data) => {
                        if (err) {
                            console.error(err);
                            hasError = true;
                            return reject(err);
                        }
                        resolve(data);
                    });
                }),
                new Promise((resolve, reject) => {
                    misQueryMod(machineQuery, (err, data) => {
                        if (err) {
                            console.error(err);
                            hasError = true;
                            return reject(err);
                        }
                        resolve(data);
                    });
                })
            ]);

            if (operatorData.length > 0 || machineData.length > 0) {
                console.log("operatorData.length", operatorData.length, "machineData.length", machineData.length);
                operatorAlreadyPresent = true;
            } else {
                const dayShiftID = 123; // Replace with the actual dayShiftID
                const insertData = await new Promise((resolve, reject) => {
                    misQueryMod(`INSERT INTO magodmis.shiftregister (ShiftDate, Shift, FromTime, ToTime, Machine, Operator, DayShiftID) VALUES 
                        ('${inputArray[i].ShiftDate}', '${inputArray[i].Shift}', '${inputArray[i].FromTime}', '${inputArray[i].ToTime}', '${inputArray[i].Machine}', '${inputArray[i].Operator}', '${dayShiftID}')`, (err, data) => {
                        if (err) {
                            console.error(err);
                            hasError = true;
                            return reject(err);
                        }
                        resolve(data);
                    });
                });
            }
        } catch (error) {
            hasError = true;
            next(error);
        }
    }
    if (hasError) {
        return res.status(404).send('No data found for the provided shift date and shift.');
    } else {
        if (operatorAlreadyPresent) {
            res.send('Operator/Machine already present');
        } else {
            res.send('Machine Operator Added Successfully');
        }
    }
});



// getFullWeekDetailPlan
// Utility function to introduce a delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

shiftEditor.post('/getFullWeekDetailPlan', jsonParser, async (req, res, next) => {
    try {
        const inputArray = req.body.ShiftDate;
        const outputArray = [];

        for (let i = 0; i < inputArray.length; i++) {
            const dateSplit = inputArray[i].split("/"); 
            const year = dateSplit[2];
            const month = dateSplit[1];
            const day = dateSplit[0];    
            const finalDay = `${year}-${month}-${day}`;

            // Step 1: Fetch day_shiftregister data for the current finalDay
            const dayShiftData = await new Promise((resolve, reject) => {
                misQueryMod(`select * FROM magodmis.day_shiftregister WHERE ShiftDate='${finalDay}'`, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });
            await delay(500); // Adjust the delay time as needed
            const innerArray = [];
            // Step 2: Process each day_shiftregister entry and fetch related shiftregister data
            for (const dayShift of dayShiftData) {
                const customObject = {
                    ShiftIc: dayShift.Shift_Ic,
                    Shift: dayShift.Shift,
                    day: dayShift.ShiftDate,
                    machineOperators: []
                };
                const shiftData = await new Promise((resolve, reject) => {
                    misQueryMod(`select * FROM magodmis.shiftregister WHERE DayShiftID='${dayShift.ShiftId}' && Shift='${dayShift.Shift}'`, (err, data) => {
                        if (err) reject(err);
                        else resolve(data);
                    });
                });

                customObject.machineOperators = shiftData;
                innerArray.push(customObject);
            }
            outputArray.push(innerArray);
        }
        res.send(outputArray);
    } catch (error) {
        next(error);
    }
});

/////Try PDF MACHINE OPEARTOR
shiftEditor.post('/getPdfMachineOperator', jsonParser ,  async (req, res, next) => {
    //delay is given so that as soon as the data is created from create week shift , the table has to get populated with all the records 
    let newDates = [];
for (let i = 0; i < req.body.ShiftDate.length; i++) {
    let dateSplit = req.body.ShiftDate[i].split("/");
    let year = dateSplit[2];
    let month = dateSplit[1];
    let day = dateSplit[0];
    let finalDay = `${year}-${month}-${day} 00:00:00`;
    newDates.push(finalDay);
    // console.log(newDates);
}
                try {
                        misQueryMod(` SELECT * FROM magodmis.shiftregister WHERE ShiftDate='${newDates[0]}' || ShiftDate='${newDates[1]}' || ShiftDate='${newDates[2]}' || ShiftDate='${newDates[3]}' || ShiftDate='${newDates[4]}' || ShiftDate='${newDates[5]}' || ShiftDate='${newDates[6]}'`, (err, data) => {
                            if (err) logger.error(err);
                            
                            if(data === null) {
                              //  console.log('DATA IS EMPTY')
                            } else {
                                // console.log('DATA IS PRESENT')
                            }
                           // console.log('/getWeeklyShiftPlanSecondTable RESPONSE IS' , data)
                            res.send(data)
                            // console.log("pdf machineOperatorData",data)
                        })
                    } catch (error) {  
                        next(error)
                    }
});

/////WeeklyPrint PDF 
shiftEditor.post('/TryWeeklyPdf', jsonParser, async (req, res, next) => {

    try {
        const flatShiftArray = await Promise.all(req.body.ShiftDate.flatMap(async (date) => {
            const dateParts = date.split("/");
            const day = dateParts[0];
            const month = dateParts[1];
            const year = dateParts[2];
            const finalDay = year + "-" + month + "-" + day;
            const finalDay1 = year + "-" + month + "-" + day + " " + "00:00:00";

            try {
                const firstQueryResult = await fetchFirstQueryData(finalDay);

                return await Promise.all(firstQueryResult.map(async (item) => {
                    const customObject = { ShiftIc: "", Shift: "", day: "",Shift_instruction: "", machineOperators: [] };
                    customObject.ShiftIc = item.Shift_Ic;
                    customObject.Shift = item.Shift;
                    customObject.day = finalDay;
                    customObject.Shift_instruction=item.Shift_instruction;

                    try {
                        // Pass finalDay1 as a parameter to fetchSubArrayData
                        const subArrayData = await fetchSubArrayData(item.Shift, item.DayShiftId, finalDay1);
                        customObject.machineOperators = subArrayData;
                    } catch (subArrayError) {
                        logger.error('Error fetching subarray data:', subArrayError);
                    }

                    return customObject;
                }));
            } catch (firstQueryError) {
                logger.error('Error fetching first query data:', firstQueryError);
                return [];
            }
        }));

        const sortedShiftArray = flatShiftArray.sort((a, b) => (a.day > b.day) ? 1 : (a.day < b.day) ? -1 : 0);
        res.send(sortedShiftArray);
    } catch (error) {
        next(error);
    }
});

async function fetchFirstQueryData(finalDay) {
    return new Promise((resolve, reject) => {
        misQueryMod(`SELECT * FROM magodmis.day_shiftregister WHERE ShiftDate='${finalDay}'`, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
}

async function fetchSubArrayData(shift, dayShiftID, finalDay1) {
    // console.log("Required Shift is ", shift, finalDay1);
    return new Promise((resolve, reject) => {
        // Use finalDay1 in the query
        misQueryMod(`SELECT * FROM magodmis.shiftregister  WHERE Shift='${shift}' AND ShiftDate='${finalDay1}'`, (err, data) => {
            // console.log("second query result is ", data);
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
}


//getmachineListfor DropDown
shiftEditor.get('/getMachineList', async (req, res, next) => {
    try {
        const shiftInchargeNames = [];
        productionQueryMod(`Select * from machine_data.machine_list where activeMachine=1 and Working=1`, (err, data) => {
            if (err) logger.error(err);
            // for (let i = 0; i < data.length; i++) {
            //     shiftInchargeNames[i] = data[i].Name
            //   }
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});



//create special Shift
shiftEditor.post('/createSpecialShift', jsonParser, async (req, res, next) => {
    // console.log("req.body special shift", req.body.FromTime);
    try {
        const { ShiftDate, FromTime, ToTime, Shift_Ic } = req.body;
        // console.log(FromTime)
        let ShiftDate1=FromTime.split(' ');
        let ShiftDate2=ShiftDate1[0];
        // const formatedShiftDate1=ShiftDate1[0].split('-');
        // let formatedShiftDate=formatedShiftDate1[2]+"-"+formatedShiftDate1[1]+"-"+formatedShiftDate1[0];
        // console.log("formated",formatedShiftDate);
         

        misQueryMod(
            `INSERT INTO magodmis.day_shiftregister (ShiftDate, Shift, FromTime, ToTime, Shift_Ic) VALUES ('${ShiftDate2}', 'Special', '${FromTime}', '${ToTime}', '${Shift_Ic}' )`,
            (err, data) => {
                if (err) {
                    console.error("Error executing query:", err);
                    next(err); // Call next with the error to pass it to the error handling middleware
                } else {
                    // console.log("Query result:", data);
                    res.send(data);
                    // console.log("data",data)
                }
            }
        );
    } catch (error) {
        console.error("Error in try-catch block:", error);
        next(error);
    }
});



//get Print Pdf for  a day
shiftEditor.post('/printdayShiftPlan', jsonParser, (req, res, next) => {
    // console.log("req.body", req.body);

    const shiftDate = req.body.ShiftDate;
    const newDate = shiftDate + " " + "00:00:00";

    try {
        productionQueryMod(`SELECT * FROM magodmis.day_shiftregister WHERE ShiftDate='${shiftDate}'`, (err, dayShiftData) => {
            if (err) {
                console.log("err", err);
                next(err); // Forward error to error handler middleware
                return;
            }

            productionQueryMod(`SELECT * FROM magodmis.shiftregister WHERE ShiftDate='${newDate}'`, (err, shiftData) => {
                if (err) {
                    console.log("err", err);
                    next(err); // Forward error to error handler middleware
                    return;
                }

                const newData = dayShiftData.map(dayShift => {
                    const shiftIc = dayShift.Shift_Ic;
                    const shift = dayShift.Shift;
                    const Shift_instruction=dayShift.Shift_instruction;
                
                    // Trimming the time part from the shiftDate
                    const shiftDateTrimmed = dayShift.ShiftDate.split(' ')[0];
                    // console.log("shiftDateTrimmed", shiftDateTrimmed);
                
                    // Filtering shiftData based on Shift and ShiftDate
                    const shiftOperators = shiftData.filter(operator =>
                        operator.Shift.trim().toLowerCase() === shift.trim().toLowerCase() &&
                        operator.ShiftDate.split(' ')[0] === shiftDateTrimmed
                    );
                
                    const machineOperators = shiftOperators.map(operator => ({
                        Machine: operator.Machine,
                        Operator: operator.Operator,
                        FromTime: operator.FromTime,
                        ToTime: operator.ToTime,
                    }));
                
                    // Log machineOperators array and its contents
                    // console.log("machineOperators:", machineOperators);
                
                    return {
                        ShiftIc: shiftIc,
                        Shift: shift,
                        FromTime: dayShift.FromTime,
                        ToTime: dayShift.ToTime,
                        Shift_instruction:dayShift.Shift_instruction,
                        machineOperators: machineOperators  // Ensure that machineOperators is an array of objects
                    };
                });
                
                res.json(newData);  // Send newData as JSON                
                // console.log("response is", newData);                
            });
        });
    } catch (error) {
        next(error); // Forward error to error handler middleware
    }
});

// weekly create button disable api
shiftEditor.post('/buttondisabledata', jsonParser, async (req, res, next) => {
    let inputArray = req.body;


    if (!Array.isArray(inputArray)) {
        return res.status(400).send({ error: "Invalid input format" });
    }

    // Convert dates from 'DD/MM/YYYY' to 'YYYY-MM-DD'
    inputArray = inputArray.map(dateString => {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month}-${day}`;
    });

    let allShiftsPresent = false; // Flag to track whether all shifts data are already present for any date


    try {
        for (let i = 0; i < inputArray.length; i++) {
            await new Promise((resolve, reject) => {
                // Check if shift data exists for the date
                misQueryMod(
                    `SELECT * FROM day_shiftregister WHERE ShiftDate = '${inputArray[i]}'`,
                    (err, data) => {
                        if (err) {
                            logger.error("Database error:", err);
                            return reject(err);
                        }

                        if (data.length > 0) {
                            // Check if all shifts are present
                            const shifts = data.map(item => item.Shift);
                            if (shifts.includes('First') && shifts.includes('Second') && shifts.includes('Third')) {
                                allShiftsPresent = true; // All shifts data is already present for this date
                            }
                        }

                        resolve();
                    }
                );
            });

            // If all shifts data is found, exit the loop early
            if (allShiftsPresent) {
                break;
            }
        }

        // Send response based on the presence of all shifts data
        if (allShiftsPresent) {
            res.json(true);
        } else {
            res.json(false);
        }
    } catch (error) {
        console.error("Internal server error:", error);
        next(error);
    }
});










module.exports = shiftEditor; 