const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const { logger } = require('./helpers/logger');
var mysql = require('mysql2');


const app = express();
app.use(cors())

app.get('/', (req, res) => {
    res.send("hello");
});

const testRoute = require('./routes/production/testRoute');
app.use("/testRoute", testRoute);

const shiftManagerProfile = require('./routes/production/shiftManagerProfile');
app.use("/shiftManagerProfile", shiftManagerProfile);

const shiftManagerService = require('./routes/production/shiftManagerService');
app.use("/shiftManagerService", shiftManagerService);

const productionSetupRouter = require('./routes/production/machineSetup');
app.use("/productionSetup", productionSetupRouter);

const ProcesssetupRouter = require('./routes/production/ProcessSetup');
app.use("/processSetup", ProcesssetupRouter);

const EditShiftIcRouter = require('./routes/production/EditShiftIc');
app.use("/editShiftIc", EditShiftIcRouter);

const EditOperatorRouter = require('./routes/production/EditOperator');
app.use("/EditOperator", EditOperatorRouter);

const machineAllotmentRouter = require('./routes/production/machineAllotment');
app.use("/machineAllotment", machineAllotmentRouter);

const machineAllotmentServiceRouter = require('./routes/production/machineAllotmentService');
app.use("/machineAllotmentService", machineAllotmentServiceRouter);

const shiftEditorRouter = require('./routes/production/shiftEditor');
app.use("/shiftEditor", shiftEditorRouter); 


const scheduleListProfileRouter = require('./routes/production/scheduleListProfile');
app.use("/scheduleListProfile", scheduleListProfileRouter); 

const scheduleListServiceRouter = require('./routes/production/scheduleListService');
app.use("/scheduleListService", scheduleListServiceRouter); 

const scheduleListFabricationRouter = require('./routes/production/scheduleListFabrication');
app.use("/scheduleListFabrication", scheduleListFabricationRouter);

const userRouter = require('./routes/production/user');
app.use("/user", userRouter);

const reportsRouter = require('./routes/production/reports');
app.use("/reports", reportsRouter);

const locationRouter = require('./routes/production/Location');
app.use("/location", locationRouter);

 
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status || 500,
            message: err.message,
        }
    })
    logger.error(`Status Code : ${err.status}  - Error : ${err.message}`);
})


// starting the server
app.listen(process.env.PORT, () => {
    console.log('listening on port ' + process.env.PORT);
    logger.info('listening on port ' + process.env.PORT);
});