const _ = require('underscore');

/**
 * 
 * @param {Object} obj 
 * @param {Array<String>} keys 
 * @description Verifica si el objeto contiene todas las keys del array.
 */
function hasAllKeys(obj, keys) {
    let retorno = true;

    if (Array.isArray(keys)) { // si el arg keys es un array

        keys.forEach(key => { // Prueba si cada key existe en el objeto

            if (!_.has(obj, key)) {
                retorno = false;
            }

        });

    } else { // si el arg keys no es un array
        retorno = false;
    }
    return retorno;
}



/**
 * 
 * @param {Object} obj 
 * @param {Array<String>} keys 
 * @returns retorna un array con las keys inexistentes en el objeto.
 */
function getKeyFaltante(obj, keys) {
    let retorno = [];

    if (Array.isArray(keys)) {

        keys.forEach(key => {

            if (!_.has(obj, key)) {
                retorno.push(key);
            }

        });
    }

    return retorno;
}

function createBodyParamsVerification() {
    let keys = Array.from(arguments);
    return (req, res, next) => {
        let keysFaltantes;
        let bData = hasAllKeys(req.body, keys);

        if (bData) {
            next();
        } else {
            keysFaltantes = getKeyFaltante(req.body, keys);
            console.log('keys faltantes', keysFaltantes);
            res.status(400).json({
                ok: false,
                error: 'Faltan parametros en el body',
                paramentrosFaltantes: keysFaltantes
            });
        }
    };
}

function createQueryParamsVerification() {
    let keys = Array.from(arguments);
    return (req, res, next) => {
        let keysFaltantes;
        let bData = hasAllKeys(req.query, keys);

        if (bData) {
            next();
        } else {
            keysFaltantes = getKeyFaltante(req.query, keys);
            console.log('keys faltantes', keysFaltantes);
            res.status(400).json({
                ok: false,
                error: 'Faltan parametros en el query',
                paramentrosFaltantes: keysFaltantes
            });
        }
    };
}

module.exports = {
    createBodyParamsVerification,
    createQueryParamsVerification
};