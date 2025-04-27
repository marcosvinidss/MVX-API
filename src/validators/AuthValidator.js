const { signin } = require('../controllers/AuthController');
const { checkSchema } = require('express-validator');

module.exports = {
    signup: checkSchema({
        name: {
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
            isEmail: {
                errorMessage: 'Email inválido'
            },
            normalizeEmail: true
        },
        password: {
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
            notEmpty: {
                errorMessage: 'Estado não preenchido'
            }
        }
    }),
    signin: checkSchema({
        email: {
            isEmail: {
                errorMessage: 'Email inválido'
            },
            normalizeEmail: true
        },
        password: {
            trim: true,
            notEmpty: {
                errorMessage: 'Senha não pode ser vazia'
            },
            isLength: {
                options: { min: 2 },
                errorMessage: 'Senha inválida (mínimo 2 caracteres)'
            }
        }
    })
}
