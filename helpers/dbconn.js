var mysql = require('mysql2');

var misConn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Welcome@123',
    database: 'magodmis',
    dateStrings:true, 
    port:33062
});

var setupConn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Welcome@123',
    database: 'magod_setup',
    dateStrings:true,  
    port:33062

});

var qtnConn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Welcome@123',
    database: 'magodqtn',
    dateStrings:true,
    port:33062
});

var mchConn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Welcome@123',
    database: 'machine_data',
    dateStrings:true,
    port:33062
});

var slsConn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password:'Welcome@123',
    database: 'magod_sales',
    dateStrings:true,
    port:33062
});

var mtrlConn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Welcome@123',
    database: 'magod_mtrl',
    dateStrings:true,
    port:33062
});

var productionConn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Welcome@123', 
    database: 'magod_production',
    dateStrings:true,
    port:33062
});

let misQuery = async (q, callback) => {
    misConn.connect();
    misConn.query(q, (err, res, fields) => {
        if (err) throw err;
        callback(res);
    })
}

let productionQueryMod = async (q, callback) => {
    productionConn.connect();
    productionConn.query(q, (err, res, fields) => {
        if(err) callback(err, null);
        else callback(null, res);
    })
}

let misQueryMod = async (q, callback) => {
    misConn.connect();
    misConn.query(q, (err, res, fields) => {
        if(err) callback(err, null);
        else callback(null, res);
    })
}

let mtrlQueryMod = async (m, callback) => {
    mtrlConn.connect();
    mtrlConn.query(m, (err, res, fields) => {
        if(err) callback(err, null);
        else callback(null, res);
    })
}

let setupQuery = (q, callback) => {
    setupConn.connect();
    setupConn.query(q, (err, res, fields) => {
        if (err) throw err;
        callback(res);
    })
}

let setupQueryMod = async (q, callback) => {
    setupConn.connect();
    setupConn.query(q, (err, res, fields) => {
        if(err) callback(err, null);
        else callback(null, res);
    })
}

let qtnQuery = (q, callback) => {
   // console.log(q);
    qtnConn.connect();
    qtnConn.query(q, (err, res, fields) => {
        if (err) throw err;
        callback(res);
        // return res[0].solution;
    })
}

let qtnQueryMod = (q, callback) => {
    // console.log(q);
     qtnConn.connect();
     qtnConn.query(q, (err, res, fields) => {
         if (err) callback(err, null);
         else callback(null, res);
         // return res[0].solution;
     })
 }

 let qtnQueryModv2 = (q, values, callback) => {
    // console.log(q);
     qtnConn.connect();
     qtnConn.query(q, values, (err, res, fields) => {
         if (err) callback(err, null);
         else callback(null, res);
         // return res[0].solution;
     })
 }
 
 let slsQueryMod = (s, callback) => {
    slsConn.connect();
    slsConn.query(s, (err, res, fields) => {
        if(err) callback(err, null);
        else callback(null, res);
    })
 }

 let mchQueryMod = (m, callback) => {
    mchConn.connect();
    mchConn.query(m, (err, res, fields) => {
        if(err) callback(err, null);
        else callback(null, res);
    })
 }

 let mchQueryMod1 = async (m) => {
    try {
        const [rows, fields] = await mchConn.promise().query(m);
        return rows;
    } catch (error) {
        throw error;
    }
};




module.exports = { misQuery, setupQuery, qtnQuery, misQueryMod, qtnQueryMod, qtnQueryModv2, slsQueryMod, mchQueryMod, mtrlQueryMod, setupQueryMod , productionQueryMod,mchQueryMod1 };