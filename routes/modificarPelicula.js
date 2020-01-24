/* eslint-disable no-unused-vars */
const express = require('express');
const app = express();
const dbConnection = require('../database/dbConnection');
const _ = require('underscore');
const { createQueryParamsVerification } = require('../util/util');



let createSqlUpdate = (id, data) => {
    let sql = '';
    let aux;
    let element;

    for (const key in data) {

        if (data[key] !== null && data[key] !== undefined) {
            element = dbConnection.escape(data[key]);
            aux = `UPDATE peliculas SET ${key} = ${element}` +
                `WHERE pelicula_id = ${id} ;`;
            sql = sql + aux;
        }

    }

    aux = `SELECT * FROM peliculas WHERE pelicula_id = ${id};`;
    sql = sql + aux;

    return sql;
};


let createSqlDeleteRep = (idPel) => {

    let sqlGet = `DELETE FROM pelicula_actores WHERE id_pelicula = ${idPel};`;
    return sqlGet;

};


let sqlActor = (nombre, apellido) => {

    nombre = dbConnection.escape(nombre); // clear tainted var
    apellido = dbConnection.escape(apellido); // clear tainted var

    return (
        `INSERT INTO actores (nombre, apellido)
    SELECT * FROM (SELECT ${nombre},${apellido}) AS tmp
    WHERE NOT EXISTS (
        SELECT nombre, apellido FROM actores WHERE nombre = ${nombre} and apellido = ${apellido}
    ) LIMIT 1;SELECT actores_id FROM actores WHERE nombre = ${nombre} and apellido = ${apellido};`
    );

};

let sqlPeliculaActores = (IDActor, IDPelicula) => {

    IDActor = dbConnection.escape(IDActor);
    return (
        `INSERT INTO pelicula_actores (id_actor, id_pelicula)
        VALUES ( ${IDActor} , ${IDPelicula} )`
    );

};



let verParams = createQueryParamsVerification('id');


app.post('/apiv1/peliculas/modificarPelicula', verParams, async(req, res) => {

    let IDPelicula = dbConnection.escape(req.query.id);

    // Verifica si el id ingresado pertenece a una pelicula
    try {
        let existePel = await dbConnection.asyncQuery(`SELECT count(*) as cantidad FROM peliculas WHERE pelicula_id = ${IDPelicula}`);
        if (existePel.results[0].cantidad === 0) {

            return res.status(400).json({
                ok: false,
                error: 'No existe ninguna pelicula con el id ingresado.'
            });
        }
    } catch (error) {
        return res.status(500).json({
            ok: false,
            error: error
        });
    }


    let data = _.pick(req.body, ['nombre', 'origen', 'fechaEstreno', 'director', 'reparto']);


    // Si el objeto esta vacio no hay ningun parametro necesario para continuar
    if (Object.keys(data).length < 1) {
        return res.status(400).json({
            ok: false,
            error: 'No se recibio ningun parametro valido en el body.'
        });
    }

    let reparto = data.reparto; // separo el array de reparto con los actores para hacer un query separado
    delete data.reparto;


    try {
        let response;
        if (Object.keys(data).length > 1) {
            let sqlPelicula = createSqlUpdate(IDPelicula, data); // Crea un codigo sql para actualizar datos de la tabla peliculas
            response = await dbConnection.asyncQuery(sqlPelicula);
        }


        if (reparto !== null && Array.isArray(reparto) && reparto.length > 0) {

            let sqlDeleteRep = createSqlDeleteRep(IDPelicula);
            response = await dbConnection.asyncQuery(sqlDeleteRep);
            let newIdsActores = [];

            for (let i = 0; i < reparto.length; i++) {
                const actor = reparto[i];
                let sqlAct = sqlActor(actor.nombre, actor.apellido);
                response = await dbConnection.asyncQuery(sqlAct);
                newIdsActores.push(response.results[1][0].actores_id);
            }

            for (let e = 0; e < newIdsActores.length; e++) {
                const newIdActor = newIdsActores[e];
                let sqlPeliculaActor = sqlPeliculaActores(newIdActor, IDPelicula);
                await dbConnection.asyncQuery(sqlPeliculaActor);
            }
        }

        response = await dbConnection.asyncQuery(`SELECT * FROM peliculas WHERE pelicula_id = ${IDPelicula} ;`);
        let newPelicula = response.results[0];

        let toResp = {
            ok: true,
            pelicula: {
                ...newPelicula,
                reparto
            }
        };
        return res.status(200).json(toResp);

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            error: error
        });
    }

});




module.exports = app;