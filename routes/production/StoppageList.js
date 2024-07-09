// const reports = require("express").Router();
// const { misQuery, setupQuery, misQueryMod, mchQueryMod } = require('../../helpers/dbconn');
// const { logger } = require('../../helpers/logger')
// var bodyParser = require('body-parser')
// var jsonParser = bodyParser.json()


// reports.get('/getGroupName', jsonParser, async (req, res, next) => {
//     try {
//       mchQueryMod(`SELECT * FROM magod_production.stoppage_category where Active=1 ORDER BY StoppageGpId DESC`, (err, data) => {
//         if (err) logger.error(err);
//         // console.log(data.length)
//         res.send(data)
//       })
//     } catch (error) {
//       next(error)
//     }
//   });
  
//   reports.post('/getReason', jsonParser, async (req, res, next) => {
//     // console.log("get Reason",req.body);
//     try {
//       mchQueryMod(`SELECT * FROM magod_production.stoppagereasonlist WHERE StoppageGpId = ${req.body.StoppageGpId} AND \`Use\` = '1' ORDER BY StoppageID DESC`, (err, data) => {
//         if (err) logger.error(err);
//         // console.log(data.length)
//         res.send(data);
//       });
//     } catch (error) {
//       next(error);
//     }
//   });
  
  
//   reports.post('/addGroupName', jsonParser, async (req, res, next) => {
//     try {
//       mchQueryMod(`Insert into magod_production.stoppage_category (GroupName,Active) Values ('${req.body.GroupName}',1)
//       `, (err, data) => {
//         if (err) logger.error(err);
//         // console.log(data.length)
//         res.send(data)
//       })
//     } catch (error) {
//       next(error)
//     }
//   });
//   reports.post('/addReason', jsonParser, async (req, res, next) => {
//     // console.log("add reason", req.body);
  
//     try {
//       const { Reason, GroupId } = req.body;
  
//       if (typeof Reason !== 'undefined' && typeof GroupId !== 'undefined') {
//         mchQueryMod(`INSERT INTO magod_production.stoppagereasonlist (Stoppage, StoppageGpId, \`Use\`, Machine_Type) VALUES ('${Reason}', '${GroupId}', 1, 'All')`, (err, data) => {
//           if (err) logger.error(err);
//           res.send(data);
//         });
//       } else {
//         res.status(400).json({ error: 'Invalid input data' });
//       }
//     } catch (error) {
//       next(error);
//     }
//   });
  
  
//   reports.post('/deleteGroup', jsonParser, async (req, res, next) => {
//     try {
//       mchQueryMod(`UPDATE magod_production.stoppage_category SET Active = 0 WHERE StoppageGpId = '${req.body.StoppageGpId}'`, (err, data) => {
//         if (err) logger.error(err);
//         // console.log(data.length)
//         res.send(data)
//       })
//     } catch (error) {
//       next(error)
//     }
//   });
  
//   reports.post('/deleteReason', jsonParser, async (req, res, next) => {
//     // console.log("Delete Reason", req.body);
//     try {
//       mchQueryMod(`UPDATE magod_production.stoppagereasonlist SET \`Use\` = 0 WHERE StoppageID = '${req.body.StoppageID}'`, (err, data) => {
//         if (err) logger.error(err);
//         // console.log(data.length)
//         res.send(data);
//       });
//     } catch (error) {
//       next(error);
//     }
//   });