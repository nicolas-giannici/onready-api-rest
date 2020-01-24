const express = require('express');
const app = express();
const dbConnection = require('../database/dbConnection');
const { createQueryParamsVerification } = require('../util/util');


let existePelicula = async(id) => {

    id = dbConnection.escape(id);
    let response = await dbConnection.asyncQuery(`SELECT count(*) as cantidad FROM peliculas WHERE pelicula_id = ${id}`);
    let cant = response.results[0].cantidad;

    if (cant < 1) {
        return false;
    } else {
        return true;
    }
};

let getIdActores = async(idPel) => {
    idPel = dbConnection.escape(idPel);

    let sqlGetIdsActores = `SELECT id_actor FROM pelicula_actores WHERE id_pelicula = ${idPel} ;`;

    let response = await dbConnection.asyncQuery(sqlGetIdsActores);
    let idsActores = [];
    response.results.forEach(act => {
        idsActores.push(act.id_actor);
    });
    return idsActores;
};

let deletePelicula = async(id) => {

    let escapedId = dbConnection.escape(id);
    let sqlDeletePelicula = `
    SET SQL_SAFE_UPDATES = 0;
    DELETE FROM peliculas
    WHERE pelicula_id = ${escapedId}; 
    DELETE FROM pelicula_actores
    WHERE id_pelicula = ${escapedId};
    SET SQL_SAFE_UPDATES = 1;
    `;

    await dbConnection.asyncQuery(sqlDeletePelicula);

    let bPelicula = await existePelicula(id);

    if (bPelicula) {
        return false;
    } else {
        return true;
    }
};

let deleteActores = async(idPelicula, idActores) => {
    let escapedPelId = idPelicula;
    let cantidadAct = idActores.length;
    let response;
    for (let i = 0; i < cantidadAct; i++) {
        const idActor = idActores[i];
        let escapedActId = dbConnection.escape(idActor);
        let sql = `SELECT count(*) as cantOtrasPeliculas FROM pelicula_actores WHERE id_actor = '${escapedActId}' and id_pelicula != '${escapedPelId}'`;
        response = await dbConnection.asyncQuery(sql);
        let otrasPeliculas = response.results[0].cantOtrasPeliculas;
        if (otrasPeliculas < 1) {
            await dbConnection.asyncQuery(`DELETE FROM actores WHERE actores_id = ${escapedActId};`);
        }
    }
};




let verQueryParams1 = createQueryParamsVerification('id');
app.delete('/apiv1/peliculas/eliminarPelicula', verQueryParams1, async(req, res) => {
    const IdPelicula = req.query.id;
    try {
        let bPelicula = await existePelicula(IdPelicula);

        if (!bPelicula) {
            return res.status(400).json({
                ok: false,
                error: 'No existe ninguna pelicula con en ID ingresado.'
            });
        }

        let idsActores = await getIdActores(IdPelicula);
        let bDeletedPelicula = await deletePelicula(IdPelicula);

        if (!bDeletedPelicula) {
            return res.status(500).json({
                ok: false,
                error: 'No se pudo eliminar la pelicula.'
            });
        }
        await deleteActores(IdPelicula, idsActores);

        res.status(200).json({
            ok: true
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            error
        });
    }

});

module.exports = app;