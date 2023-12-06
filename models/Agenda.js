const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Agenda = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'usuarios',
        required: true
    },
    selectedData: {
        type: String,
        required: true, 
    },
    formatedData: {
        type: Date,
        required: true,
    },
    categoria: {
        type: String,
        required: true, 
    },
    conteudo: {
        type: String,
        required: true,
    },
    cor: {
        type: String,
        required: true,
    }
})

// Existem 2 parâmetros: o primeiro refere-se ao nome da collection (tabela). O segundo refere-se ao schema da collection (dados que farão parte da collection(documents))
mongoose.model('agendas', Agenda)