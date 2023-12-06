const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Usuario = new Schema({
    codigo_etec: {
        type: Number,
        required: true
    },
    rm: {
        type: Number,
        required: true
    },
    nome: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    senha: {
        type: String,
        required: true
    }, 
    habilitacao: {
        type: String,
        required: true
    },
    turma: {
        type: String,
        required: true
    },
    turno: {
        type: String,
        required: true
    },
    matricula: {
        type: String,
        required: true
    },
    modulo: {
        type: String,
        required: true
    },
    ano_inicio: {
        type: Number,
        required: true
    },
    codigoRec: {
        type: String,
        default: ""
    },
    validadeCodigoRec: {
        type: Date, 
        default: Date.now()
    }
})

// Existem 2 parâmetros: o primeiro refere-se ao nome da collection (tabela). O segundo refere-se ao schema da collection (dados que farão parte da collection(documents))
mongoose.model('usuarios', Usuario)