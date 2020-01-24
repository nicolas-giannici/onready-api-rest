const express = require('express');
let app = express();
const crearPelicula = require('./crearPelicula');
const modificarPelicula = require('./modificarPelicula');
const getPeliculas = require('./getPeliculas');

// Agrego las rutas creadas a la app principal
app.use(modificarPelicula);
app.use(crearPelicula);
app.use(getPeliculas);

module.exports = app;