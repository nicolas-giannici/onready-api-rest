require('dotenv').config();
// EXPRESS AND HTTP SERVER INIT VAR 
const http = require('http');
const express = require('express');
const app = express();
const serverConfig = require('./config/serverConfig');
const bodyParser = require('body-parser');
const routes = require('./routes/routes');
const dbConnection = require('./database/dbConnection');

dbConnection.connect((err) => {
    if (err) {
        console.log(err);
    }
    console.log('Database: ', dbConnection.state);
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// agrego las rutas
app.use(routes);


const httpServer = http.createServer(app);
httpServer.listen(serverConfig.PORT, (err) => {
    if (err) {
        console.log(err);
    }
    console.clear();
    console.log('\nServer ready, listening in port: ' + httpServer.address().port);
});