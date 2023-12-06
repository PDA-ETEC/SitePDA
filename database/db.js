const mongoose = require('mongoose')

// Conexão com o MongoDB Atlas - ONLINE
const connectDatabase = () => {
    console.log("Conectando...")

    mongoose.connect("mongodb+srv://nicolas:pdaetec23@pda.ukqk3fg.mongodb.net/pda", {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        console.log("MongoDB Atlas Conectado!")
    }).catch((err) => {
        console.log("Erro ao conectar:\n" + err)
    })
}

module.exports = connectDatabase