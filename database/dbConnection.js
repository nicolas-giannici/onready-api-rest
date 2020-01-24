const dbConfig = require('../config/dbConfig'); // get database info
const mysql = require('mysql');

let dbConnection = mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.name,
    multipleStatements: true,
    insecureAuth: true, // Esto permite la coneccion con bases de datos con el metodo de autenticacion antiguos

});

let asyncQuery = (sql, opts = {}) => {
    return new Promise((resolve, reject) => {
        dbConnection.query(sql, opts, (error, results, fields) => {
            if (error) {
                return reject(error);
            }
            resolve({ results, fields });
        });
    });
};

dbConnection.asyncQuery = asyncQuery;

module.exports = dbConnection;