const express = require('express');
let app = express();
const crearPelicula = require('./crearPelicula');
const modificarPelicula = require('./modificarPelicula');
const getPeliculas = require('./getPeliculas');
const eliminarPelicula = require('./eliminarPelicula');
const swaggerUi = require('swagger-ui-express');
const openApiDocumentation = require('../openAPI/openapi.json');

// Agrego las rutas creadas a la app principal
app.use(modificarPelicula);
app.use(crearPelicula);
app.use(getPeliculas);
app.use(eliminarPelicula);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocumentation));

module.exports = app;