// Carregando módulos
const express = require('express')
const handlebars = require('express-handlebars')
const mongoose = require('mongoose')
const connectDatabase = require('./database/db')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash')
const passport = require('passport')
const bodyParser = require('body-parser')
const app = express()
const path = require('path')
const aluno = require('./routes/aluno')
require('./config/auth')(passport)  

// Controle de acesso
const { checkRedefinirSenhaAccess, checkAtualizarSenhaAccess } = require('./helpers/checkAccess')

// Configurações
// Conexão com o MongoDB Atlas
connectDatabase()

// Handlebars
app.engine('handlebars', handlebars.engine({
    defaultLayout: 'main'
}))
app.set('view engine', 'handlebars')

// Public 
app.use(express.static(path.join(__dirname, 'public')))

// Body-parser (o módulo do body-parser está imbutido no framework do express)
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}))

// Sessão
const sessionStore = new MongoStore({ mongooseConnection: mongoose.connection });

app.use(session({
    secret: "nodejs",
    resave: true,
    saveUninitialized: true,
    store: sessionStore,  // Use o MongoStore para armazenar sessões
}));

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

// Middleware (Variáveis Globais)
app.use((req, res, next) => {
    // Variáveis globais
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    // Armazena dados do usuário logado
    res.locals.user = req.user || null
    next()
})

app.get('/', (req, res) => {
    const colorTheme = "background-color: var(--main-bg-login); overflow-x: hidden;"
    res.render('index', {pageTitle: "PDA", colorTheme: colorTheme})
})

app.get('/adduser', (req, res) => {
    const colorTheme = "background-color: var(--main-bg-login); overflow-x: hidden;"
    res.render('adduser', {pageTitle: "SOMENTE ADMS", colorTheme: colorTheme})
})

app.get('/esquecisenha', (req, res) => {
    const colorTheme = "background-color: var(--main-bg-login); overflow-x: hidden;"
    res.render('esquecisenha', {pageTitle: 'PDA|Senha', colorTheme: colorTheme})
})

app.get('/redefinirsenha', checkRedefinirSenhaAccess, (req, res) => {
    const colorTheme = "background-color: var(--main-bg-login); overflow-x: hidden;"
    res.render('redefinirsenha', {pageTitle: 'PDA|Redefinir Senha', colorTheme: colorTheme})
})

app.get('/atualizarsenha', checkAtualizarSenhaAccess, (req, res) => {
    const { codigo_etec, rm, codigoRec } = req.query
    const colorTheme = "background-color: var(--main-bg-login); overflow-x: hidden;"
    res.render('atualizarsenha', {pageTitle: 'PDA|Atualizar Senha', colorTheme: colorTheme,  codigo_etec, rm, codigoRec})
})

app.get('/logout', (req, res) => {
    const msgTxt = "Deslogado com sucesso!"
    req.logout(err => {
        if(err) {
            req.flash("error_msg", "Erro ao deslogar!")
            res.redirect("/aluno/")
        } else {
            req.flash("error_msg", "Sua sessão expirou. Realize o login novamente!")
            res.redirect("/")
        }
    })
})

app.get('/404', (req, res) => {
    res.send("Erro 404!")
})

app.use('/aluno', aluno)

// Outros
// const port = process.env.PORT ? Number(process.env.PORT) : 8081
// app.listen(port, () => {
//     console.log("Servidor rodando...")
// })
const port = process.env.PORT ? Number(process.env.PORT) : 8081
app.listen(port, () => {
    console.log("Servidor rodando...")
})
// app.listen({
//     host: '0.0.0.0',
//     port: process.env.PORT ? Number(process.env.PORT) : 8081,
// }).then(() => {
//     console.log("Servidor rodando...")
// })