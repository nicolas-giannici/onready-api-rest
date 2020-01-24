const express = require('express');
const app = express();
const dbConnection = require('../database/dbConnection');
const { createQueryParamsVerification } = require('../util/util');




let getActoresByIdPelicula = async(idPel) => {
    idPel = dbConnection.escape(idPel);
    let actores = [];
    let sqlGetIdsActores = `SELECT id_actor FROM pelicula_actores WHERE id_pelicula = ${idPel} ;`;

    let response = await dbConnection.asyncQuery(sqlGetIdsActores);
    let idsActores = [];
    response.results.forEach(act => {
        idsActores.push(act.id_actor);
    });

    for (let e = 0; e < idsActores.length; e++) {
        const idAct = idsActores[e];

        let sqlGetActorById = `SELECT nombre, apellido FROM  actores WHERE actores_id = ${idAct};`;

        response = await dbConnection.asyncQuery(sqlGetActorById);
        let actor = response.results[0];
        actores.push(actor);
    }

    return actores;
};






let verQueryParams1 = createQueryParamsVerification('pagina');
app.get('/apiv1/peliculas', verQueryParams1, async(req, res) => {
    let response;
    const DEFAULT_LIMIT = 5;
    const MAX_LIMIT = 15;
    let query = req.query;

    let cantidad = query.cantidad || DEFAULT_LIMIT;
    let pagina = query.pagina;

    // Verifica que ambos parametros sean del tipo Number

    if (isNaN(cantidad)) {
        return res.status(400).json({
            ok: false,
            error: 'el parametro "cantidad" no es un Número'
        });
    }

    if (isNaN(pagina)) {
        return res.status(400).json({
            ok: false,
            error: 'el parametro "pagina" no es un Número'
        });
    }

    try {

        // Corrige cantidad y pagina si fuera necesario
        if (cantidad < DEFAULT_LIMIT) {
            cantidad = DEFAULT_LIMIT;
        }

        if (cantidad > MAX_LIMIT) {
            cantidad = MAX_LIMIT;
        }
        if (pagina < 1) {
            pagina = 1;
        }

        let sqlGetCantidadPel = 'SELECT count(*) as cantidadPeliculas FROM peliculas;';
        response = await dbConnection.asyncQuery(sqlGetCantidadPel);
        let totalPeliculas = response.results[0].cantidadPeliculas;
        let totalPaginas = Math.round(totalPeliculas / cantidad);

        if (pagina > totalPaginas) { // Si la pagina ingresada es mayor al maximo se retorna la ultima pagina
            pagina = totalPaginas;
        }

        let offset = (pagina - 1) * cantidad;
        let sqlGetPeliculasPaginadas = `SELECT * FROM (SELECT * FROM peliculas ORDER BY nombre ASC ) as pels LIMIT ${cantidad} OFFSET ${offset};`;
        response = await dbConnection.asyncQuery(sqlGetPeliculasPaginadas);
        let peliculas = response.results;
        console.log(peliculas);
        for (let i = 0; i < peliculas.length; i++) {
            let pelId = peliculas[i].pelicula_id;
            let actores = await getActoresByIdPelicula(pelId);
            peliculas[i].reparto = actores;
        }



        res.status(400).json({
            ok: true,
            peliculas,
            pagina,
            cantidadPorPagina: cantidad,
            paginasRestantes: totalPaginas - pagina,
            totalPeliculas
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error.code
        });
    }
});





let verQueryParams2 = createQueryParamsVerification('nombre');
app.get('/apiv1/peliculas/obtenerPorNombre', verQueryParams2, async(req, res) => {
    try {
        let nombre = dbConnection.escape(req.query.nombre);
        let sqlGetPelicula = `SELECT * FROM peliculas WHERE nombre = ${nombre}`;
        let response; // Se utiliza para almacenar todas las respuestas de la base de datos.


        // Obtenemos la pelicula desde la tabla peliculas en la base de datos
        response = await dbConnection.asyncQuery(sqlGetPelicula);
        let resultados = response.results;

        if (resultados.length < 1) {
            return res.status(404).json({
                ok: false,
                error: 'No se encontro ninguna pelicula con el nombre ' + nombre
            });
        }
        let pelicula = resultados[0];

        // Con el id obtenido, buscamos los ids de cada actor perteneciente a la pelicula
        let idPelicula = dbConnection.escape(resultados[0].pelicula_id);
        let sqlGetActoresIds = `SELECT id_actor FROM pelicula_actores WHERE id_pelicula = ${idPelicula};`;
        response = await dbConnection.asyncQuery(sqlGetActoresIds);
        let resutaldosActores = response.results;
        let idsActores = [];
        resutaldosActores.forEach(r => {
            idsActores.push(r.id_actor);
        });

        // Con los ids de los actores ahora obtenemos sus datos.
        let actores = [];

        for (let t = 0; t < idsActores.length; t++) {
            const idActor = dbConnection.escape(idsActores[t]);
            let sqlGetActor = `SELECT nombre, apellido FROM actores WHERE actores_id = ${idActor} ;`;
            response = await dbConnection.asyncQuery(sqlGetActor);
            if (response.results.length > 0) {
                actores.push(response.results[0]);
            }
        }

        // agregamos los actores al objeto pelicula

        pelicula.reparto = actores;
        res.status(200).json({
            ok: true,
            pelicula
        });

    } catch (error) {
        res.status(503).json({
            ok: false,
            error: error.code
        });
    }

});


module.exports = app;