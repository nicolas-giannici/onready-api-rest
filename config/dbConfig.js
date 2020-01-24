/**  HOST */
let host = process.env.MYSQLHOST;

/**  DB NAME */
let name = process.env.DBNAME;

/**  DB USERNAME */
let username = process.env.DBUSERNAME;

/**  DB PASSWORD */
let password = process.env.DBPASSWORD;



module.exports = {
    host,
    name,
    username,
    password
};