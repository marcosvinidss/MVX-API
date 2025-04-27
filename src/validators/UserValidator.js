const { editAction } = require('../controllers/AdsController');
const { signin } = require('../controllers/AuthController');
const { checkSchema } = require('express-validator');

module.exports = {
    editAction: checkSchema({
        token: {
            notEmpty: true,
        },
        name: {
            optional: true,
            trim: true,
            notEmpty: {
                errorMessage: 'Nome não pode ser vazio'
            },
            isLength: {
                options: { min: 2 },
                errorMessage: 'Nome precisa ter pelo menos 2 caracteres'
            }
        },
        email: {
            optional: true,
            isEmail: {
                errorMessage: 'Email inválido'
            },
            normalizeEmail: true
        },
        password: {
            optional: true,
            trim: true,
            notEmpty: {
                errorMessage: 'Senha não pode ser vazia'
            },
            isLength: {
                options: { min: 2 },
                errorMessage: 'Senha inválida (mínimo 2 caracteres)'
            }
        },
        state: {
            optional: true,
            notEmpty: true,
            errorMessage:'Estado não preenchido'
        }
    }),
}
