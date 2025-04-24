const {checkSchema} = require('express-validator');


module.exports ={
    signup: checkSchema({
        name:{
            trim: true,
            notEmpty: true,
            isLength:{
                options:{min:2}
            },
            errorMessage:'Nome precisa ter pelo menos 2 caracteres'
        },
        email:{
            isEmail: true,
            normalizeEmail:true,
            errorMessage: 'Email inválido'
        },
        password:{  
            isLength: {
                notEmpty:true,
                isLength:{
                    options:{min:2}
                },
            },
            errorMessage: 'Senha inválida (mínimo 2 caracteres)'
        },
        state:{
            notEmpty:true,
            errorMessage: 'Estado não preenchido'
        }
    })
}