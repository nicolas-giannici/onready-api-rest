const express = require('express');
const app = express();
const dbConnection = require('../database/dbConnection');
const { createBodyParamsVerification } = require('../util/util');


let verParams = createBodyParamsVerification('nombre', 'origen', 'fechaEstreno', 'director', 'reparto');

app.post('/apiv1/peliculas/nuevaPelicula', verParams, async(req, res) => {

    let data = req.body;
    let reparto = data.reparto;

    // La funcion escape de mysql retorna la variable ingresada 
    // luego de checkearla y modificarla en caso de que tenga codigo sql
    // evitando asi injecciones de SQL mal intencionadas

    let nombrePel = dbConnection.escape(data.nombre);
    let origenPel = dbConnection.escape(data.origen);
    let directorPel = dbConnection.escape(data.director);
    let fechaEstrenoPel = dbConnection.escape(data.fechaEstreno);

    let sqlPelicula = `
        INSERT INTO peliculas (nombre, origen, director, fecha_estreno)
        VALUES ( ${nombrePel}, ${origenPel}, ${directorPel}, ${fechaEstrenoPel})`;


    let sqlActor = (nombre, apellido) => {
        nombre = dbConnection.escape(nombre); // clear tainted var
        apellido = dbConnection.escape(apellido); // clear tainted var
        return (
            `INSERT INTO actores (nombre, apellido)
        SELECT * FROM (SELECT ${nombre},${apellido}) AS tmp
        WHERE NOT EXISTS (
            SELECT nombre, apellido FROM actores WHERE nombre = ${nombre} and apellido=${apellido}
        ) LIMIT 1; SELECT actores_id FROM actores WHERE nombre = ${nombre} and apellido=${apellido};`
        );
    };

    let sqlPeliculaActores = (IDActor, IDPelicula) => {
        IDActor = dbConnection.escape(IDActor);
        IDPelicula = dbConnection.escape(IDPelicula);
        return (
            `INSERT INTO pelicula_actores (id_actor, id_pelicula)
            VALUES ( ${IDActor} , ${IDPelicula} )`
        );
    };


    try {
        let response = await dbConnection.asyncQuery(sqlPelicula);
        let tam = reparto.length;
        let IDPelicula = response.results.insertId;
        let IDSActores = [];


        for (let i = 0; i < tam; i++) {
            let actor = reparto[i];
            response = await dbConnection.asyncQuery(sqlActor(actor.nombre, actor.apellido));
            IDSActores.push(response.results[1][0].actores_id);
        }

        tam = IDSActores.length;

        for (let e = 0; e < tam; e++) {
            let IDActor = IDSActores[e];
            await dbConnection.asyncQuery(sqlPeliculaActores(IDActor, IDPelicula));
            IDSActores.push(response.results.insertId);
        }

        res.status(200).json({
            ok: true,
            pelicula: req.body
        });

    } catch (error) {


        console.log('Error: ', error);
        if (error.errno === 1062) {
            return res.status(400).json({
                ok: false,
                error: 'La pelicula ' + data.nombre + ' ya existe en los registros'
            });
        }
        res.status(500).json({
            error: error.code
        });
    }
});



module.exports = app;