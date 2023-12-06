const localStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Model de usuário
require('../models/Usuario')
const Usuario = mongoose.model('usuarios')

module.exports = function(passport){
    // 'email' é o que será comparado para fazer a verificação
    // passwordField: 'senha' tem a função de dizer que o campo em que a senha será digitada tem nome de "senha". Caso o nome do campo fosse "password", o passport reconheceria automaticamente
    passport.use(new localStrategy({usernameField: 'rm', passwordField: 'senha', passReqToCallback: true}, (req, rm, senha, done) => {
        if(isNaN(req.body.codigo_etec)){
            return done(null, false, { message: "Código da ETEC inválido!" })
        }else{
            Usuario.findOne({rm: rm, codigo_etec: req.body.codigo_etec}).then((usuario) => {
                
                if(!usuario){
                    return done(null, false, {message: "Esta conta não existe!"})
                }
    
                if(senha === usuario.senha){    
                    return done(null, usuario)
                }else if (senha !== usuario.senha) {
                    bcrypt.compare(senha, usuario.senha, (erro, batem) => {
                        if(batem){
                            return done(null, usuario)
                        }else{
                            return done(null, false, {message: "Senha incorreta!"})
                        }
                    })
    
                }else{
                    return done(null, false, {message: "Credenciais incorretas!"})
                }
            })
        }
    }))

    // passport.use('custom', new localStrategy(
    //     {
    //       usernameField: 'rm', // Nome do campo de usuário
    //       passwordField: 'senha', // Nome do campo de senha
    //       passReqToCallback: true // Passar a solicitação para a função de verificação
    //     },
    //     (req, rm, senha, done) => {
    //       const codigo_etec = req.body.codigo_etec; // Campo de código_etec
      
    //       // Lógica de verificação personalizada aqui
    //       // Você pode verificar os campos (por exemplo, consultar um banco de dados)
    //       Usuario.findOne({rm: rm}).then((usuario) => {
    //       if (rm === usuario.rm && senha === usuario.senha && codigo_etec === usuario.codigo_etec) {
    //         return done(null, { rm: rm });
    //       } else {
    //         return done(null, false, { message: 'Falha na autenticação' });
    //       }
    //       })
    //     }
    //   ));

    passport.serializeUser((usuario,done)=>{
        done(null,usuario.id)
    
    })
      
    passport.deserializeUser((id,done)=>{
        Usuario.findById(id).then((usuario)=>{
            done(null,usuario)
        }).catch((err)=>{
             done (null,false,{message:'Algo deu errado'})
        })
    })
}

// const localStrategy = require('passport-local').Strategy;
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// // Model de usuário
// require('../models/Usuario'); // Certifique-se de que o caminho está correto
// const Usuario = mongoose.model('usuarios');

// module.exports = function(passport) {
//     passport.use(new localStrategy({ usernameField: 'rm', passwordField: 'senha' }, (rm, senha, done) => {
//         Usuario.findOne({ rm: rm }).then((usuario) => {
//             if (!usuario) {
//                 return done(null, false, { message: 'Esta conta não existe' });
//             }

//             bcrypt.compare(senha, usuario.senha, (erro, batem) => {
//                 if (batem) {
//                     return done(null, usuario);
//                 } else {
//                     return done(null, false, { message: 'Senha incorreta' });
//                 }
//             });
//         });
//     }));

//     passport.serializeUser((usuario, done) => {
//         done(null, usuario.id);
//     });

//     passport.deserializeUser((id, done) => {
//         Usuario.findById(id).then((usuario) => {
//             done(null, usuario);
//         }).catch((err) => {
//             done(null, false, { message: 'Algo deu errado' });
//         });
//     });
// };
