// Módulos
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require("../models/Usuario")
const Usuario = mongoose.model("usuarios")
require("../models/Agenda")
const Agenda = mongoose.model("agendas")
require("../models/Boletim")
const Boletim = mongoose.model("boletins")
const bcrypt = require('bcryptjs')
const passport = require('passport')
const path = require('path')
const fs = require('fs')
// Enviar email
const nodemailer = require('nodemailer')
// Baixar PDF
const puppeteer = require('puppeteer')
const pdf = require('html-pdf')
const ejs = require('ejs')
// const pdf = require('pdfkit')

// Controle de acesso
const {eAluno} = require('../helpers/eAluno')

// Adicionais
const colorTheme = "background-color: var(--main-bg)"

// Rotas aluno
router.get('/', eAluno, (req, res) => {
  const userName = req.user.nome
  const userId = req.user._id
 
  Agenda.find({usuario: userId}).sort({formatedData: 'asc'}).lean().then((agendas) => {
    res.render('aluno/home', {pageTitle: "PDA|Home", colorTheme: colorTheme, home: true, userName: userName, agendas: agendas})
  }).catch((err) => {
    req.flash("error_msg", "Houve um erro ao listar as agendas")
    res.redirect('/aluno/')
  })
})

router.get('/calendario', eAluno, (req, res) => {
  const userId = req.user._id
  const userName = req.user.nome

  Agenda.find({usuario: userId}).sort({formatedData: 'asc'}).lean().then((agendas) => {
    res.render('aluno/calendario', { pageTitle: "PDA|Calendário", colorTheme: colorTheme, calendario: true, userName: userName, agendas: agendas})
  }).catch((err) => {
    req.flash("error_msg", "Houve um erro ao listar as agendas!")
    res.redirect('/aluno/calendario')
  })
})

router.get('/boletim', eAluno, (req, res) => {
  const userName = req.user.nome;
  const currentYear = new Date().getFullYear();
  const yearOfEnrollment = req.user.ano_inicio;

  // Calcular a série atual com base no ano de matrícula
  const seriesIndex = currentYear - yearOfEnrollment + 1;
  let serieSelecionada = req.session.selectedSerie; // Use a série armazenada na sessão, se houver

  // Se a série não estiver armazenada na sessão, calcular com base no ano de matrícula
  if (!serieSelecionada) {
    if (seriesIndex >= 1 && seriesIndex <= 3) {
      serieSelecionada = `${seriesIndex}ª Série`;
    } else if (seriesIndex > 3) {
      serieSelecionada = "3ª Série";
    } else {
      req.flash("error_msg", "Série inválida");
      return res.redirect('/aluno/boletim');
    }
  }

  const seriesOptions = [];
  const maxIteration = Math.min(3, seriesIndex);

  for (let i = 1; i <= maxIteration; i++) {
    seriesOptions.push({
      value: `${i}ª Série`,
      isSelected: `${i}ª Série` === serieSelecionada
    });
  }

  Boletim.findOne({ usuario: req.user._id }).then((boletim) => {
    let serie = {};
    let serieKey;

    if (boletim) {
      // Se o boletim for encontrado, determina a série com base na série selecionada
      switch (serieSelecionada) {
        case "1ª Série":
          serie = boletim.serie1;
          serieKey = 'serie1';
          break;
        case "2ª Série":
          serie = boletim.serie2;
          serieKey = 'serie2';
          break;
        case "3ª Série":
          serie = boletim.serie3;
          serieKey = 'serie3';
          break;
        default:
          // Se a série selecionada não for válida, use a primeira série válida
          serieSelecionada = "1ª Série";
          serie = boletim.serie1;
          serieKey = 'serie1';
          break;
      }
  
      // Calcular a frequência para cada matéria e atualizar no banco de dados
      const updateOps = {};
      for (let i = 1; i <= 14; i++) {
        const materiaKey = `materia${String(i).padStart(2, '0')}`; // materia01, materia02, ..., materia14
        const materia = serie[materiaKey];
        const totalAulas = materia.aulas;
        const faltas = materia.faltas;
        const presencas = totalAulas - faltas;
        const frequencia = Math.round((presencas / totalAulas) * 100); // Porcentagem de frequência arredondada para inteiro
  
        // Preparar operações de atualização
        updateOps[`${serieKey}.${materiaKey}.frequencia`] = frequencia;
      }
  
      // console.log(updateOps) -> Visualizar frequências

      // Atualizar o documento do boletim com as novas frequências
      Boletim.updateOne({ _id: boletim._id }, { $set: updateOps }).then(() => {
        console.log("Frequências atualizadas com sucesso!");
      }).catch((err) => {
        console.error(err);
        console.log("Erro ao atualizar as frequências!");
      });
    }

    // Registra a série selecionada numa session
    req.session.selectedSerie = serieSelecionada
    res.render('aluno/boletim', {pageTitle: "PDA|Boletim", colorTheme: colorTheme, boletim: true, userName: userName, serieSelecionada: serieSelecionada, serie: serie, seriesOptions: seriesOptions})

  }).catch((err) => {
    console.error(err)
    req.flash("error_msg", "Houve um erro ao carregar o boletim!")
    res.redirect('/aluno/boletim')
  })
})

router.post('/boletim', eAluno, (req, res) => {
  const userName = req.user.nome
  const serieSelecionada = req.body.serie
  const currentYear = new Date().getFullYear()
  const yearOfEnrollment = req.user.ano_inicio

  const seriesOptions = [];
  const maxIteration = Math.min(3, currentYear - yearOfEnrollment + 1)
  for (let i = 1; i <= maxIteration; i++) {
    seriesOptions.push({
      value: `${i}ª Série`,
      isSelected: `${i}ª Série` === serieSelecionada
    });
  }

  Boletim.findOne({ usuario: req.user._id }).then((boletim) => {
    if (boletim) {
      let serie;
      let serieKey;
      switch (serieSelecionada) {
        case "1ª Série":
          serie = boletim.serie1;
          serieKey = 'serie1';
          break;
        case "2ª Série":
          serie = boletim.serie2;
          serieKey = 'serie2';
          break;
        case "3ª Série":
          serie = boletim.serie3;
          serieKey = 'serie3';
          break;
        default:
          req.flash("error_msg", "Série inválida");
          return res.redirect('/aluno/boletim');
      }
  
      // Calcular a frequência para cada matéria e atualizar no banco de dados
      const updateOps = {};
      for (let i = 1; i <= 14; i++) {
        const materiaKey = `materia${String(i).padStart(2, '0')}`; // materia01, materia02, ..., materia14
        const materia = serie[materiaKey];
        const totalAulas = materia.aulas;
        const faltas = materia.faltas;
        const presencas = totalAulas - faltas;
        const frequencia = (presencas / totalAulas) * 100; // Porcentagem de frequência
  
        // Preparar operações de atualização
        updateOps[`${serieKey}.${materiaKey}.frequencia`] = frequencia;
      }
  
      // console.log(updateOps) -> Visualizar frequências

      // Atualizar o documento do boletim com as novas frequências
      Boletim.updateOne({ _id: boletim._id }, { $set: updateOps }).then(() => {
        console.log("Frequências atualizadas com sucesso!");
      }).catch((err) => {
        console.error(err);
        console.log("Erro ao atualizar as frequências!");
      });

      req.session.selectedSerie = serieSelecionada;

      res.render('aluno/boletim', { pageTitle: "PDA|Boletim", colorTheme: colorTheme, boletim: true, userName: userName, serie: serie, seriesOptions: seriesOptions })

    } else {
      req.flash("error_msg", "Boletim não encontrado")
      res.redirect('/aluno/boletim')
    }
  }).catch((err) => {
    console.error(err)
    req.flash("error_msg", "Houve um erro ao carregar o boletim!")
    res.redirect('/aluno/boletim')
  })
})

router.get('/empenho', eAluno, (req, res) => {
  const userName = req.user.nome;
  const userId = req.user._id;
  const imagePath = '../img/pizza.png';
  const currentYear = new Date().getFullYear();
  const yearOfEnrollment = req.user.ano_inicio;
  const seriesIndex = currentYear - yearOfEnrollment + 1;
  let serieAtual;

  if (seriesIndex >= 1 && seriesIndex <= 3) {
    serieAtual = `serie${seriesIndex}`;
  } else if (seriesIndex > 3) {
    serieAtual = "serie3";
  } else {
    req.flash("error_msg", "Série inválida");
    return res.redirect('/aluno/');
  }

  Boletim.findOne({ usuario: userId }).lean().then((boletim) => {
    if (!boletim) {
      req.flash("error_msg", "Boletim não encontrado!");
      return res.redirect('/aluno/');
    }

    const serieData = boletim[serieAtual];
    const nomeReduzido = {
      "LÍNGUA PORTUGUESA, LITERATURA E COMUNICAÇÃO PROFISSIONAL": "LÍNGUA PORTUGUESA",
      "LÍNGUA ESTRANGEIRA MODERNA - INGLÊS E COMUNICAÇÃO PROFISSIONAL": "INGLÊS",
      "LÍNGUA ESTRANGEIRA MODERNA - ESPANHOL": "ESPANHOL",
      "FUNDAMENTOS DA INFORMÁTICA": "FINF",
      "PROGRAMAÇÃO E ALGORITMOS": "PA",
      "GESTÃO DE CONTEÚDO WEB I": "GCW I",
      "GESTÃO DE CONTEÚDO WEB II": "GCW II",
      "USABILIDADE E DESIGN DE INTERAÇÃO": "UDI",
      "DESENVOLVIMENTO PARA DISPOSITIVOS MÓVEIS I": "DDM I",
      "DESENVOLVIMENTO PARA DISPOSITIVOS MÓVEIS II": "DDM II",
      "ACESSIBILIDADE DIGITAL": "ACESSIBILIDADE D.",
      "ÉTICA E CIDADANIA ORGANIZACIONAL": "ÉTICA",
      "SEGURANÇA DA INFORMAÇÃO": "SI",
      "PLANEJAMENTO E DESENVOLVIMENTO DO TRABALHO DE CONCLUSÃO DE CURSO (TCC) EM INFORMÁTICA PARA INTERNET": "TCC"
    };

    const materias = [];

    for (let i = 1; i <= 14; i++) {
      const materiaKey = `materia${String(i).padStart(2, '0')}`;
      if (serieData[materiaKey]) {
        const nomeCompleto = serieData[materiaKey].nome;
        const nomeCurto = nomeReduzido[nomeCompleto] || nomeCompleto; // Usa o nome reduzido se disponível, senão usa o nome completo
        materias.push({
          nome: nomeCurto,
          presencas: serieData[materiaKey].aulas - serieData[materiaKey].faltas,
          faltas: serieData[materiaKey].faltas,
          frequencia: serieData[materiaKey].frequencia
        });
      }
    }

    res.render('aluno/empenho', {
      pageTitle: "PDA|Empenho",
      colorTheme: colorTheme,
      empenho: true,
      userName: userName,
      imagePath: imagePath,
      materias: materias
    });
  }).catch((err) => {
    console.error(err);
    req.flash("error_msg", "Houve um erro ao carregar o Empenho!");
    res.redirect('/aluno/');
  });
});

router.get('/horario', eAluno, (req, res) => {
  const userName = req.user.nome
  res.render('aluno/horario', {pageTitle: "PDA|Horário", colorTheme: colorTheme, horario: true, userName: userName})
})

router.get('/meuperfil', eAluno, (req, res) => {
  const userName = req.user.nome
  Usuario.find({rm: req.user.rm}).lean().then((usuarios) => {
    res.render('aluno/meuperfil', {pageTitle: "PDA|Meu Perfil", colorTheme: colorTheme, meuperfil: true, userName: userName, usuarios: usuarios})
  }).catch((err) => {
    res.redirect('/')
  })
})

router.get('/login', (req, res) => {
  res.render('index')
})  

router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/aluno/',
    failureRedirect: '/',
    failureFlash: true
  })(req, res, next)  
})

router.post('/trocarsenha', (req, res) => {
  var erros = []

  if (req.body.senhaAtual != req.user.senha) {
    bcrypt.compare(req.body.senhaAtual, req.user.senha, (erro, batem) => {
      if(batem){
      }else{
        erros.push({texto: "Senha atual incorreta!"})
        console.log("senha incorreta")
      }
    })
  }

  if (req.body.novaSenha.length < 4) {
    erros.push({texto: "Senha muito pequena!"})
    console.log("senha pequena")
  }


  if (req.body.novaSenha != req.body.novaSenha2) {
    erros.push({texto: "Senhas não coincidem, tente novamente!"})
    console.log("senhas diferentes")
  }

  if(erros.length > 0){
    const userName = req.user.nome
    Usuario.find({rm: req.user.rm}).lean().then((usuarios) => {
      res.render('aluno/meuperfil', {pageTitle: "PDA|Meu Perfil", colorTheme: colorTheme, meuperfil: true, userName: userName, usuarios: usuarios, erros: erros})
    }).catch((err) => {
      res.redirect('/')
    })
  } else{
    Usuario.findOne({ rm: req.user.rm }).then((usuario) => {
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.novaSenha, salt, (err, hash) => {
            if (err) {
              console.log("Erro no salvamento da nova senha!")
              return res.redirect("/aluno/")
            }
 
            usuario.senha = hash

            usuario.save().then(() => {
              req.flash("success_msg", "Senha alterada com sucesso!")
              res.redirect("/")
            }).catch((err) => {
              console.log("Erro no salvamento da nova senha!")
              res.redirect("/aluno/")
            })
          })
        })
      })
      .catch((err) => {
        req.flash("error_msg", "Erro ao alterar a senha!");
        res.redirect("/aluno/meuperfil");
      })
    }
})

router.post('/esquecisenha', (req, res) => {
  const { codigo_etec, rm, email } = req.body
  const codigoIntervalo = new Date(Date.now() - 10 * 60 * 1000) // Obtém a data atual menos 10 minutos (tempo de espera para o próximo código)

  // Verifique se existe um usuário com o código da ETEC, RM e email fornecidos
  Usuario.findOne({ codigo_etec, rm, email }).then((usuario) => {
    if (!usuario) {
      // Usuário não encontrado, redirecione com uma mensagem de erro
      req.flash("error_msg", "Usuário não encontrado. Verifique as informações inseridas!");
      res.redirect('/esquecisenha')

    } else if (usuario.validadeCodigoRec > codigoIntervalo && usuario.validadeCodigoRec != null) {
      req.flash("error_msg", "Aguarde alguns instantes para gerar outro código de acesso!")
      res.redirect('/esquecisenha') 

    } else {
      // Gere um código de acesso aleatório (você já tem a função generateRandomCode)
      // const codigoAcesso = generateRandomCode(8); --- SENHA ---
      const codigoAcesso = req.body.codigoAcesso
      
      const nome = usuario.nome
      const nameParts = nome.split(" ")
      const firstName = nameParts[0] 
      
      // Associe o código de acesso ao usuário no banco de dados  --- ALTERAR SENHA ---
      usuario.codigoRec = codigoAcesso

      // Salve as alterações no banco de dados
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(codigoAcesso, salt, (err, hash) => {
          if (err) {
            console.log("Erro no salvamento do código de acesso!")
            return res.redirect("/esquecisenha")
          }

          usuario.codigoRec = hash
          usuario.validadeCodigoRec = Date.now()

          usuario.save().then(() => {
            req.flash("success_msg", "Código de acesso gerado com sucesso!")
            res.redirect('/redefinirsenha')

            // Email Template - Configurações
            const emailTemplatePath = path.join(__dirname, '../views/templates/email-template.html');
            const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf8')

            // Configurar opções para o serviço Outlook
            const transporter = nodemailer.createTransport({
              host: 'smtp-mail.outlook.com',
              port: 587,
              secure: false, // true for 465, false for other ports
              requireTLS: true,
              auth: {
                user: 'pda.suporte@outlook.com',
                pass: 'pda_etec2023'
              }
            })

            const emailContent = emailTemplate
            .replace('{{codigoAcesso}}', codigoAcesso)
            .replace('{{nome}}', nome)

            // Enviar o código de acesso por email
            const mailOptions = {
              from: 'pda.suporte@outlook.com',
              to: usuario.email,
              subject: 'Código de Acesso para ' + firstName,
              html: emailContent
            }

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error(error)
                req.flash("error_msg", "Erro ao enviar o código de acesso por email!")
                res.redirect('/esquecisenha')
              } else {
                console.log('Email enviado: ' + info.response);
                req.flash("success_msg", "Código de aceesso enviado por e-mail!")
                res.redirect('/')
              }
            }) 
          }).catch((err) => {
            // Trate erros de salvamento no banco de dados
            console.error(err)
            req.flash("error_msg", "Erro ao gerar o código de acesso. Tente novamente!")
            res.redirect('/esquecisenha')
          })
        })
      })
    }
  }).catch((err) => {
    // Trate erros de consulta no banco de dados
    console.error(err)
    req.flash("error_msg", "Erro ao verificar o usuário. Tente novamente!")
    res.redirect('/esquecisenha')
  })
})

router.post('/redefinirsenha', (req, res) => {
  const { codigo_etec, rm } = req.body
  const validadeTempo = new Date(Date.now() - 30 * 60 * 1000) // Obtém a data atual menos 30 minutos

  // Verifique se existe um usuário com o código da ETEC, RM e email fornecidos
  Usuario.findOne({ codigo_etec, rm }).then((usuario) => {
    if (!usuario) { 
      // Usuário não encontrado, redirecione com uma mensagem de erro
      req.flash("error_msg", "Dados inválidos. Tente novamente!")
      return res.redirect('/redefinirsenha')
    }
  
    // Comparar o códigoRec fornecido pelo usuário com o códigoRec armazenado no banco de dados
    bcrypt.compare(req.body.codigoRec, usuario.codigoRec, (erro, batem) => {
      if (batem) {
        // Verifique a validade do códigoRec
        if (usuario.validadeCodigoRec < validadeTempo) {
          req.flash("error_msg", "Código de acesso vencido!")
          return res.redirect('/esquecisenha')
        }

        // Redirecione com uma mensagem de sucesso
        req.flash("success_msg", "Dados verificados com sucesso!")
        res.redirect(`/atualizarsenha?codigo_etec=${codigo_etec}&rm=${rm}`)
      } else {
        req.flash("error_msg", "Dados inválidos. Tente novamente!")
        res.redirect('/redefinirsenha')
      }
    })
  })
})

router.post('/atualizarsenha', (req, res) => {
  const { codigo_etec, rm } = req.body

  Usuario.findOne({ codigo_etec, rm }).then((usuario) => {
    if (!usuario) { 
      // Usuário não encontrado, redirecione com uma mensagem de erro
      req.flash("error_msg", "Dados inválidos. Tente novamente!")
      res.redirect(`/atualizarsenha?codigo_etec=${codigo_etec}&rm=${rm}`)
    } else {

      var erros = []

      if (req.body.novaSenha.length < 4) {
        erros.push({texto: "Senha muito pequena!"})
        console.log("senha pequena")
      }
    
      if (req.body.novaSenha != req.body.novaSenha2) {
        erros.push({texto: "Senhas não coincidem. Tente novamente!"})
        console.log("senhas diferentes")
      }

      if(erros.length > 0){
        // const { codigo_etec, rm } = req.query
        // const colorTheme = "background-color: var(--main-bg-login); overflow-x: hidden;"
        // res.render('atualizarsenha', {pageTitle: 'PDA|Atualizar Senha', colorTheme: colorTheme, codigo_etec, rm, erros:erros})
        req.flash("error_msg", "Senhas curtas e/ou diferentes. Tente novamente após a verificação!")
        res.redirect('/redefinirsenha')

      } else {
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.novaSenha, salt, (err, hash) => {
            if (err) {
              console.log("Erro no salvamento da nova senha!")
              return res.redirect(`/atualizarsenha?codigo_etec=${codigo_etec}&rm=${rm}`)
            }
 
            usuario.senha = hash

            usuario.save().then(() => {
              req.flash("success_msg", "Senha alterada com sucesso!")
              res.redirect('/')
            }).catch((err) => {
              console.error(err)
              req.flash("error_msg", "Erro ao alterar senha!")
              res.redirect(`/atualizarsenha?codigo_etec=${codigo_etec}&rm=${rm}`)
            })
          })
        })
      }
    }
  })
})

router.get('/logout', (req, res) => {
  const msgTxt = "Deslogado com sucesso!"
    req.logout(err => {
        if(err) {
            req.flash("error_msg", "Erro ao deslogar!")
            res.redirect("/aluno/")
        } else {
            req.flash("success_msg", "Deslogado com sucesso!")
            res.redirect("/")
        }
    })
})

// Rotas agenda (calendário)
router.post('/novaagenda', (req, res) => {
  var erros = []

  if (!req.body.categoria || typeof req.body.categoria == undefined || req.body.categoria == null || req.body.categoria == "Escolha:") {
    erros.push({
        texto: "Selecione uma categoria!"
    })
  }

  if (!req.body.conteudo || typeof req.body.conteudo == undefined || req.body.conteudo == null) {
    erros.push({
        texto: "Adicione um conteúdo!"
    })
  }

  if(erros.length > 0){
    const userId = req.user._id
    const userName = req.user.nome
  
    Agenda.find({usuario: userId}).sort({formatedData: 'asc'}).lean().then((agendas) => {
      res.render('aluno/calendario', { pageTitle: "PDA|Calendário", colorTheme: colorTheme, calendario: true, userName: userName, agendas: agendas, erros: erros })
    }).catch((err) => {
      res.redirect('/')
    })

  } else{
    const dataString = req.body.data
    
    // Divisão da string em dia, mês e ano
    const partesData = dataString.split('/')
    const dia = parseInt(partesData[0], 10)
    const mes = parseInt(partesData[1], 10) - 1
    const ano = parseInt(partesData[2], 10)
  
    // Estrutura da data
    const data = new Date(ano, mes, dia);
  
    const novaAgenda = {
      usuario: req.user._id,
      categoria: req.body.categoria,
      conteudo: req.body.conteudo,
      cor: req.body.cor,
      selectedData: req.body.data,
      formatedData: data
    }
  
    new Agenda(novaAgenda).save().then(() => {
      req.flash("success_msg", "Agendamento realizado com sucesso!")
      res.redirect('/aluno/calendario')
    }).catch((err) => {
      req.flash("error_msg", "Erro ao salvar o agendamento!")
      console.log(err)
      res.redirect('/aluno/calendario')
    })
  }
})

router.post('/agenda/editar', eAluno, (req, res) => {
  // Validação do formulário (Mensagem dizendo se o formulário foi enviado com sucesso ou não)
  var erros = []

  if (!req.body.categoria || typeof req.body.categoria == undefined || req.body.categoria == null || req.body.categoria == "Escolha:") {
    erros.push({
        texto: "Selecione uma categoria!"
    })
  }

  if (!req.body.conteudo || typeof req.body.conteudo == undefined || req.body.conteudo == null) {
    erros.push({
        texto: "Adicione um conteúdo!"
    })
  }

  if(erros.length > 0){
    const userId = req.user._id
    const userName = req.user.nome
  
    Agenda.find({usuario: userId}).sort({formatedData: 'asc'}).lean().then((agendas) => {
      res.render('aluno/calendario', { pageTitle: "PDA|Calendário", colorTheme: colorTheme, calendario: true, userName: userName, agendas: agendas, erros: erros })
    }).catch((err) => {
      res.redirect('/')
    })

  } else{
    // Busca por um id na collection que seja igual ao registrado como hidden na página de editar categorias ("req.body.id")
    Agenda.findOne({_id: req.body.id}).then((agenda) => {
        agenda.categoria = req.body.categoria
        agenda.conteudo = req.body.conteudo
        agenda.cor = req.body.cor

        agenda.save().then(() => {
            req.flash("success_msg", "Evento editado com sucesso!")
            res.redirect('/aluno/calendario')
        }).catch((err) => {
            req.flash("error_msg", "Erro ao editar o evento!")
            res.redirect('/aluno/calendario')
        })
    }).catch((err) => {
        req.flash("error_msg", "Erro ao editar o evento!")
        res.redirect('/aluno/calendario')
        console.log(err)
    })
  } 
})

router.post('/agenda/deletar', eAluno, (req, res) => {
  Agenda.deleteOne({_id: req.body.id}).then(() => {
    req.flash("success_msg", "Evento deletado com sucesso!")
    res.redirect('/aluno/calendario')
  }).catch((err) => {
      req.flash("error_msg", "Erro ao deletar o evento")
      console.log(err)
      res.redirect('/aluno/calendario')
  })
})

// Rota para baixar PDF

process.env.OPENSSL_CONF = '/etc/ssl/openssl.cnf';

router.post('/baixarpdf', (req, res) => {
  const templatePath = path.join(__dirname, '../views/templates/pdf-template.html');
  const rm = req.user.rm

  fs.readFile(templatePath, 'utf8', (err, template) => {
    if (err) {
      console.error('Erro ao ler o arquivo pdf-template.ejs:', err);
      req.flash("error_msg", "Erro ao gerar PDF!");
      res.redirect('/aluno/boletim');
      return;
    }

    Boletim.findOne({ usuario: req.user._id }).then(boletim => {
      if (!boletim) {
        // Se o boletim não for encontrado, envia uma mensagem ao usuário
        req.flash("error_msg", "Não há dados no boletim para download.");
        res.redirect('/aluno/boletim');
        return;
      }

      let serie;
      let ano;
      switch (req.session.selectedSerie) {
        case "1ª Série":
          serie = boletim.serie1
          ano = req.user.ano_inicio
          break;
        case "2ª Série":
          serie = boletim.serie2
          ano = (req.user.ano_inicio + 1)
          break;
        case "3ª Série":
          serie = boletim.serie3
          ano = (req.user.ano_inicio + 2)
          break;
        default:
          req.flash("error_msg", "Série inválida");
          res.redirect('/aluno/boletim');
          return;
      }
  
      // console.log(serie) - Visualizar dados da série selecionada

      // Verifique se a série e a propriedade 'portugues' estão definidas
      if (!serie) {
        req.flash("error_msg", "Informações da série ou componente curricular não encontradas!");
        res.redirect('/aluno/boletim');
        return;
      }

      // Inicialize as variáveis para contar o total de aulas e faltas
      let totalAulas = 0;
      let totalFaltas = 0;

      // Iterar sobre as matérias com base na convenção de nomenclatura
      for (let i = 1; i <= 14; i++) {
        // Construir o nome da matéria (com zero à esquerda para números de 1 a 9)
        let nomeMateria = `materia${i.toString().padStart(2, '0')}`;

        // Verificar se a matéria existe no objeto 'serie'
        if (serie.hasOwnProperty(nomeMateria)) {
          totalAulas += serie[nomeMateria].aulas;
          totalFaltas += serie[nomeMateria].faltas;
        }
      }

      // Aulas por bimestre (Bim4 é o total de aulas) - Todas as matérias possuem a mesma quantidade de aulas
      const aulasPorBimestre = ((totalAulas / 14) / 4) 
      const constante = (aulasPorBimestre * 14)
      const aulasBim1 = constante
      const aulasBim2 = constante + aulasBim1
      const aulasBim3 = constante + aulasBim2

      // Limite de faltas
      const limiteFaltas = (0.25 * totalAulas)

      // Frequência total
      const totalPresencas = totalAulas - totalFaltas;
      let freqT = totalPresencas / totalAulas * 100; // Frequência em porcentagem
      const freqTotal = freqT.toFixed(2).replace('.', ','); // Frequência com somente 2 casas decimais

      // Resultado final
      console.log(freqT)
      let resultado
      if(freqT >= 75) {
        resultado = "Promovido"
      } else {
        resultado = "Reprovado"
      }
      const resultadoFinal = resultado

      // Envio de informações para o template PDF
      const htmlTemplate = ejs.render(template, { 
        user: req.user, 
        session: req.session, 
        serie: serie, 
        ano: ano, 
        totalAulas: totalAulas,
        aulasBim1: aulasBim1,
        aulasBim2: aulasBim2,
        aulasBim3: aulasBim3,
        totalFaltas: totalFaltas, 
        limiteFaltas: limiteFaltas, 
        freqTotal: freqTotal,
        resultadoFinal: resultadoFinal
      });

      generatePDF(htmlTemplate, (err, pdfBuffer) => {
        if (err) {
          console.error('Erro ao gerar o PDF:', err);
          req.flash("error_msg", "Erro ao gerar PDF!");
          res.redirect('/aluno/boletim');
        } else {
          console.log('PDF gerado com sucesso!');
          req.flash("success_msg", "PDF gerado com sucesso!");
  
          res.setHeader('Content-Disposition', `attachment; filename=Boletim_${rm}.pdf`);
          res.setHeader('Content-Type', 'application/pdf');
          res.status(200).send(pdfBuffer);
        }
      });
    }).catch(err => {
      console.error('Erro ao obter dados do banco de dados:', err);
      req.flash("error_msg", "Erro ao obter dados do banco de dados!");
      res.redirect('/aluno/boletim');
    });
  });
});

function generatePDF(htmlTemplate, callback) {
  pdf.create(htmlTemplate).toBuffer((err, buffer) => {
    if (err) {
      console.error('Erro ao gerar o PDF:', err);
      callback(err);
    } else {
      console.log('PDF gerado com sucesso');
      callback(null, buffer);
    }
  });
}

// Rotas adduser
router.post('/adduser', (req, res) => {
  const novoUsuario = {
    codigo_etec: req.body.codigo_etec,
    rm: req.body.rm,
    nome: req.body.nome,
    email: req.body.email,
    senha: req.body.senha,
    habilitacao: req.body.habilitacao,
    turma: req.body.turma,
    matricula: req.body.matricula,
    modulo: req.body.modulo,
    turno: req.body.turno,
    ano_inicio: req.body.ano_inicio
  };

  Usuario.findOne({ rm: req.body.rm }).lean().then((usuario) => {
    var erros = [];

    if (!req.body.rm || typeof req.body.rm == undefined || req.body.rm == null) {
      erros.push({ texto: "Adicione um RM válido!" });
    }

    if (usuario) {
      erros.push({ texto: "Esse RM já existe!" });
    }

    if (erros.length > 0) {
      req.flash("error_msg", "RM inválido ou já existente!");
      res.redirect('/adduser');
    } else {
      new Usuario(novoUsuario).save().then((usuarioCriado) => {
        console.log("Usuário add");

        // Adiciona um boletim ao usuário cadastrado
        if (req.body.opcao === "modelo1"){ 
          const boletim = {
            usuario: usuarioCriado._id,
            serie1: {
              nome: "1ª Série",
              materia01: {
                nome: "LÍNGUA PORTUGUESA, LITERATURA E COMUNICAÇÃO PROFISSIONAL",
                bim1: "MB",
                bim2: "MB",
                bim3: "B",
                bim4: "B",
                final: "B",
                conselho: "B",
                aulas: 188,
                faltas: 3,
                frequencia: 90
              },
              materia02: {
                nome: "LÍNGUA ESTRANGEIRA MODERNA - INGLÊS E COMUNICAÇÃO PROFISSIONAL",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 0,
                frequencia: 100
              },
              materia03: {
                nome: "MATEMÁTICA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 160,
                faltas: 6,
                frequencia: 100
              },
              materia04: {
                nome: "EDUCAÇÃO FÍSICA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 0,
                frequencia: 100
              },
              materia05: {
                nome: "LÍNGUA ESTRANGEIRA MODERNA - ESPANHOL",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 82,
                faltas: 7,
                frequencia: 100
              },
              materia06: {
                nome: "ARTE",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 9,
                frequencia: 100
              },
              materia07: {
                nome: "FILOSOFIA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 40,
                faltas: 5,
                frequencia: 100
              },
              materia08: {
                nome: "SOCIOLOGIA",
                bim1: "B",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 40,
                faltas: 5,
                frequencia: 100
              },
              materia09: {
                nome: "ARTE DIGITAL",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 82,
                faltas: 1,
                frequencia: 100
              },
              materia10: {
                nome: "BANCO DE DADOS",
                bim1: "MB",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 3,
                frequencia: 100
              },
              materia11: {
                nome: "FUNDAMENTOS DA INFORMÁTICA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 5,
                frequencia: 100
              },
              materia12: {
                nome: "PROGRAMAÇÃO E ALGORITMOS",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 120,
                faltas: 0,
                frequencia: 100
              },
              materia13: {
                nome: "GESTÃO DE CONTEÚDO WEB I",
                bim1: "B",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "B",
                conselho: "B",
                aulas: 80,
                faltas: 0,
                frequencia: 100
              },
              materia14: {
                nome: "INTERFACES WEB I",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 0,
                frequencia: 100
              }
            },
            serie2: {
              nome: "2ª Série",
              materia01: {
                nome: "LÍNGUA PORTUGUESA, LITERATURA E COMUNICAÇÃO PROFISSIONAL",
                bim1: "B",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 160,
                faltas: 3,
                frequencia: 90
              },
              materia02: {
                nome: "LÍNGUA ESTRANGEIRA MODERNA - INGLÊS E COMUNICAÇÃO PROFISSIONAL",
                bim1: "B",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 76,
                faltas: 1,
                frequencia: 100
              },
              materia03: {
                nome: "MATEMÁTICA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 3,
                frequencia: 100
              },
              materia04: {
                nome: "EDUCAÇÃO FÍSICA",
                bim1: "MB",
                bim2: "B",
                bim3: "B",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 0,
                frequencia: 100
              },
              materia05: {
                nome: "HISTÓRIA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 0,
                frequencia: 100
              },
              materia06: {
                nome: "GEOGRAFIA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 2,
                frequencia: 100
              },
              materia07: {
                nome: "FÍSICA",
                bim1: "B",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 0,
                frequencia: 100
              },
              materia08: {
                nome: "QUÍMICA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 86,
                faltas: 1,
                frequencia: 100
              },
              materia09: {
                nome: "BIOLOGIA",
                bim1: "MB",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 3,
                frequencia: 100
              },
              materia10: {
                nome: "GESTÃO DE CONTEÚDO WEB II",
                bim1: "MB",
                bim2: "MB",
                bim3: "B",
                bim4: "B",
                final: "B",
                conselho: "B",
                aulas: 78,
                faltas: 2,
                frequencia: 100
              },
              materia11: {
                nome: "INTERFACES WEB II",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 84,
                faltas: 5,
                frequencia: 100
              },
              materia12: {
                nome: "USABILIDADE E DESIGN DE INTERAÇÃO",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 0,
                frequencia: 100
              },
              materia13: {
                nome: "DESENVOLVIMENTO PARA DISPOSITIVOS MÓVEIS I",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 0,
                frequencia: 100
              },
              materia14: {
                nome: "SISTEMAS WEB I",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 84,
                faltas: 1,
                frequencia: 100
              }
            },
            serie3: {
              nome: "3ª Série",
              materia01: {
              nome: "LÍNGUA PORTUGUESA, LITERATURA E COMUNICAÇÃO PROFISSIONAL",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 60,
              faltas: 0,
              frequencia: 100
              },
              materia02: {
              nome: "LÍNGUA ESTRANGEIRA MODERNA - INGLÊS E COMUNICAÇÃO PROFISSIONAL",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 62,
              faltas: 2,
              frequencia: 97
              },
              materia03: {
              nome: "MATEMÁTICA",
              bim1: "MB",
              bim2: "MB",
              bim3: "B",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 87,
              faltas: 1,
              frequencia: 99
              },
              materia04: {
              nome: "HISTÓRIA",
              bim1: "MB",
              bim2: "B",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 56,
              faltas: 0,
              frequencia: 100
              },
              materia05: {
              nome: "GEOGRAFIA",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 60,
              faltas: 0,
              frequencia: 100
              },
              materia06: {
              nome: "FÍSICA",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 58,
              faltas: 3,
              frequencia: 95
              },
              materia07: {
              nome: "QUÍMICA",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 62,
              faltas: 2,
              frequencia: 97
              },
              materia08: {
              nome: "BIOLOGIA",
              bim1: "MB",
              bim2: "MB",
              bim3: "B",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 54,
              faltas: 10,
              frequencia: 81
              },
              materia09: {
              nome: "DESENVOLVIMENTO PARA DISPOSITIVOS MÓVEIS II",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 60,
              faltas: 0,
              frequencia: 100
              },
              materia10: {
              nome: "SISTEMAS WEB II",
              bim1: "MB",
              bim2: "MB",
              bim3: "B",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 95,
              faltas: 0,
              frequencia: 100
              },
              materia11: {
              nome: "ACESSIBILIDADE DIGITAL",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 60,
              faltas: 0,
              frequencia: 100
              },
              materia12: {
              nome: "ÉTICA E CIDADANIA ORGANIZACIONAL",
              bim1: "B",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 30,
              faltas: 2,
              frequencia: 93
              },
              materia13: {
              nome: "PLANEJAMENTO E DESENVOLVIMENTO DO TRABALHO DE CONCLUSÃO DE CURSO (TCC) EM INFORMÁTICA PARA INTERNET",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 92,
              faltas: 0,
              frequencia: 100
              },
              materia14: {
              nome: "SEGURANÇA DA INFORMAÇÃO",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 58,
              faltas: 3,
              frequencia: 95
              }
            }
          };
  
          new Boletim(boletim).save().then(() => {
            console.log("Boletim gerado!")
          }).catch((err) => {
            console.log("Erro ao gerar boletim: " + err)
          })
        }

        if (req.body.opcao === "modelo2"){
          const boletim = {
            usuario: usuarioCriado._id,
            serie1: {
              nome: "1ª Série",
              materia01: {
                nome: "LÍNGUA PORTUGUESA, LITERATURA E COMUNICAÇÃO PROFISSIONAL",
                bim1: "B",
                bim2: "B",
                bim3: "B",
                bim4: "B",
                final: "B",
                conselho: "B",
                aulas: 188,
                faltas: 5,
                frequencia: 90
              },
              materia02: {
                nome: "LÍNGUA ESTRANGEIRA MODERNA - INGLÊS E COMUNICAÇÃO PROFISSIONAL",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 2,
                frequencia: 100
              },
              materia03: {
                nome: "MATEMÁTICA",
                bim1: "MB",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 160,
                faltas: 6,
                frequencia: 100
              },
              materia04: {
                nome: "EDUCAÇÃO FÍSICA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "B",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 0,
                frequencia: 100
              },
              materia05: {
                nome: "LÍNGUA ESTRANGEIRA MODERNA - ESPANHOL",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 82,
                faltas: 7,
                frequencia: 100
              },
              materia06: {
                nome: "ARTE",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 9,
                frequencia: 100
              },
              materia07: {
                nome: "FILOSOFIA",
                bim1: "B",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 40,
                faltas: 5,
                frequencia: 100
              },
              materia08: {
                nome: "SOCIOLOGIA",
                bim1: "B",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 40,
                faltas: 3,
                frequencia: 100
              },
              materia09: {
                nome: "ARTE DIGITAL",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 82,
                faltas: 1,
                frequencia: 100
              },
              materia10: {
                nome: "BANCO DE DADOS",
                bim1: "MB",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 3,
                frequencia: 100
              },
              materia11: {
                nome: "FUNDAMENTOS DA INFORMÁTICA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 7,
                frequencia: 100
              },
              materia12: {
                nome: "PROGRAMAÇÃO E ALGORITMOS",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 120,
                faltas: 0,
                frequencia: 100
              },
              materia13: {
                nome: "GESTÃO DE CONTEÚDO WEB I",
                bim1: "B",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 0,
                frequencia: 100
              },
              materia14: {
                nome: "INTERFACES WEB I",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 2,
                frequencia: 100
              }
            },
            serie2: {
              nome: "2ª Série",
              materia01: {
                nome: "LÍNGUA PORTUGUESA, LITERATURA E COMUNICAÇÃO PROFISSIONAL",
                bim1: "B",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 160,
                faltas: 3,
                frequencia: 90
              },
              materia02: {
                nome: "LÍNGUA ESTRANGEIRA MODERNA - INGLÊS E COMUNICAÇÃO PROFISSIONAL",
                bim1: "B",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 76,
                faltas: 1,
                frequencia: 100
              },
              materia03: {
                nome: "MATEMÁTICA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 3,
                frequencia: 100
              },
              materia04: {
                nome: "EDUCAÇÃO FÍSICA",
                bim1: "MB",
                bim2: "B",
                bim3: "B",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 0,
                frequencia: 100
              },
              materia05: {
                nome: "HISTÓRIA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 0,
                frequencia: 100
              },
              materia06: {
                nome: "GEOGRAFIA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 2,
                frequencia: 100
              },
              materia07: {
                nome: "FÍSICA",
                bim1: "B",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 0,
                frequencia: 100
              },
              materia08: {
                nome: "QUÍMICA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 86,
                faltas: 1,
                frequencia: 100
              },
              materia09: {
                nome: "BIOLOGIA",
                bim1: "MB",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 3,
                frequencia: 100
              },
              materia10: {
                nome: "GESTÃO DE CONTEÚDO WEB II",
                bim1: "MB",
                bim2: "MB",
                bim3: "B",
                bim4: "B",
                final: "B",
                conselho: "B",
                aulas: 78,
                faltas: 2,
                frequencia: 100
              },
              materia11: {
                nome: "INTERFACES WEB II",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 84,
                faltas: 5,
                frequencia: 100
              },
              materia12: {
                nome: "USABILIDADE E DESIGN DE INTERAÇÃO",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 2,
                frequencia: 100
              },
              materia13: {
                nome: "DESENVOLVIMENTO PARA DISPOSITIVOS MÓVEIS I",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "B",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 0,
                frequencia: 100
              },
              materia14: {
                nome: "SISTEMAS WEB I",
                bim1: "B",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 84,
                faltas: 5,
                frequencia: 100
              }
            },
            serie3: {
              nome: "3ª Série",
              materia01: {
              nome: "LÍNGUA PORTUGUESA, LITERATURA E COMUNICAÇÃO PROFISSIONAL",
              bim1: "MB",
              bim2: "B",
              bim3: "B",
              bim4: "B",
              final: "B",
              conselho: "B",
              aulas: 60,
              faltas: 0,
              frequencia: 100
              },
              materia02: {
              nome: "LÍNGUA ESTRANGEIRA MODERNA - INGLÊS E COMUNICAÇÃO PROFISSIONAL",
              bim1: "B",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 62,
              faltas: 2,
              frequencia: 97
              },
              materia03: {
              nome: "MATEMÁTICA",
              bim1: "MB",
              bim2: "MB",
              bim3: "B",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 87,
              faltas: 1,
              frequencia: 99
              },
              materia04: {
              nome: "HISTÓRIA",
              bim1: "MB",
              bim2: "B",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 56,
              faltas: 0,
              frequencia: 100
              },
              materia05: {
              nome: "GEOGRAFIA",
              bim1: "B",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 60,
              faltas: 0,
              frequencia: 100
              },
              materia06: {
              nome: "FÍSICA",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 58,
              faltas: 5,
              frequencia: 95
              },
              materia07: {
              nome: "QUÍMICA",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "B",
              final: "MB",
              conselho: "MB",
              aulas: 62,
              faltas: 2,
              frequencia: 97
              },
              materia08: {
              nome: "BIOLOGIA",
              bim1: "MB",
              bim2: "MB",
              bim3: "B",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 54,
              faltas: 10,
              frequencia: 81
              },
              materia09: {
              nome: "DESENVOLVIMENTO PARA DISPOSITIVOS MÓVEIS II",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 60,
              faltas: 0,
              frequencia: 100
              },
              materia10: {
              nome: "SISTEMAS WEB II",
              bim1: "MB",
              bim2: "MB",
              bim3: "B",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 95,
              faltas: 5,
              frequencia: 100
              },
              materia11: {
              nome: "ACESSIBILIDADE DIGITAL",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 60,
              faltas: 0,
              frequencia: 100
              },
              materia12: {
              nome: "ÉTICA E CIDADANIA ORGANIZACIONAL",
              bim1: "B",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 30,
              faltas: 2,
              frequencia: 93
              },
              materia13: {
              nome: "PLANEJAMENTO E DESENVOLVIMENTO DO TRABALHO DE CONCLUSÃO DE CURSO (TCC) EM INFORMÁTICA PARA INTERNET",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 92,
              faltas: 0,
              frequencia: 100
              },
              materia14: {
              nome: "SEGURANÇA DA INFORMAÇÃO",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 58,
              faltas: 7,
              frequencia: 95
              }
            }
          };
  
          new Boletim(boletim).save().then(() => {
            console.log("Boletim gerado!")
          }).catch((err) => {
            console.log("Erro ao gerar boletim: " + err)
          })
        }

        if (req.body.opcao === "modelo3"){
          const boletim = {
            usuario: usuarioCriado._id,
            serie1: {
              nome: "1ª Série",
              materia01: {
                nome: "LÍNGUA PORTUGUESA, LITERATURA E COMUNICAÇÃO PROFISSIONAL",
                bim1: "MB",
                bim2: "MB",
                bim3: "B",
                bim4: "B",
                final: "B",
                conselho: "B",
                aulas: 188,
                faltas: 3,
                frequencia: 90
              },
              materia02: {
                nome: "LÍNGUA ESTRANGEIRA MODERNA - INGLÊS E COMUNICAÇÃO PROFISSIONAL",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 0,
                frequencia: 100
              },
              materia03: {
                nome: "MATEMÁTICA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 160,
                faltas: 6,
                frequencia: 100
              },
              materia04: {
                nome: "EDUCAÇÃO FÍSICA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 0,
                frequencia: 100
              },
              materia05: {
                nome: "LÍNGUA ESTRANGEIRA MODERNA - ESPANHOL",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 82,
                faltas: 7,
                frequencia: 100
              },
              materia06: {
                nome: "ARTE",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 9,
                frequencia: 100
              },
              materia07: {
                nome: "FILOSOFIA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 40,
                faltas: 5,
                frequencia: 100
              },
              materia08: {
                nome: "SOCIOLOGIA",
                bim1: "B",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 40,
                faltas: 5,
                frequencia: 100
              },
              materia09: {
                nome: "ARTE DIGITAL",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 82,
                faltas: 1,
                frequencia: 100
              },
              materia10: {
                nome: "BANCO DE DADOS",
                bim1: "MB",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 3,
                frequencia: 100
              },
              materia11: {
                nome: "FUNDAMENTOS DA INFORMÁTICA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 5,
                frequencia: 100
              },
              materia12: {
                nome: "PROGRAMAÇÃO E ALGORITMOS",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 120,
                faltas: 0,
                frequencia: 100
              },
              materia13: {
                nome: "GESTÃO DE CONTEÚDO WEB I",
                bim1: "B",
                bim2: "B",
                bim3: "MB",
                bim4: "B",
                final: "B",
                conselho: "B",
                aulas: 80,
                faltas: 0,
                frequencia: 100
              },
              materia14: {
                nome: "INTERFACES WEB I",
                bim1: "B",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 0,
                frequencia: 100
              }
            },
            serie2: {
              nome: "2ª Série",
              materia01: {
                nome: "LÍNGUA PORTUGUESA, LITERATURA E COMUNICAÇÃO PROFISSIONAL",
                bim1: "B",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 160,
                faltas: 2,
                frequencia: 90
              },
              materia02: {
                nome: "LÍNGUA ESTRANGEIRA MODERNA - INGLÊS E COMUNICAÇÃO PROFISSIONAL",
                bim1: "B",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 76,
                faltas: 1,
                frequencia: 100
              },
              materia03: {
                nome: "MATEMÁTICA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 3,
                frequencia: 100
              },
              materia04: {
                nome: "EDUCAÇÃO FÍSICA",
                bim1: "MB",
                bim2: "B",
                bim3: "B",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 0,
                frequencia: 100
              },
              materia05: {
                nome: "HISTÓRIA",
                bim1: "MB",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 0,
                frequencia: 100
              },
              materia06: {
                nome: "GEOGRAFIA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "B",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 2,
                frequencia: 100
              },
              materia07: {
                nome: "FÍSICA",
                bim1: "B",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 0,
                frequencia: 100
              },
              materia08: {
                nome: "QUÍMICA",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 86,
                faltas: 1,
                frequencia: 100
              },
              materia09: {
                nome: "BIOLOGIA",
                bim1: "MB",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 78,
                faltas: 3,
                frequencia: 100
              },
              materia10: {
                nome: "GESTÃO DE CONTEÚDO WEB II",
                bim1: "MB",
                bim2: "MB",
                bim3: "B",
                bim4: "B",
                final: "B",
                conselho: "B",
                aulas: 78,
                faltas: 2,
                frequencia: 100
              },
              materia11: {
                nome: "INTERFACES WEB II",
                bim1: "MB",
                bim2: "MB",
                bim3: "B",
                bim4: "B",
                final: "B",
                conselho: "B",
                aulas: 84,
                faltas: 7,
                frequencia: 100
              },
              materia12: {
                nome: "USABILIDADE E DESIGN DE INTERAÇÃO",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 2,
                frequencia: 100
              },
              materia13: {
                nome: "DESENVOLVIMENTO PARA DISPOSITIVOS MÓVEIS I",
                bim1: "MB",
                bim2: "MB",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 80,
                faltas: 0,
                frequencia: 100
              },
              materia14: {
                nome: "SISTEMAS WEB I",
                bim1: "MB",
                bim2: "B",
                bim3: "MB",
                bim4: "MB",
                final: "MB",
                conselho: "MB",
                aulas: 84,
                faltas: 1,
                frequencia: 100
              }
            },
            serie3: {
              nome: "3ª Série",
              materia01: {
              nome: "LÍNGUA PORTUGUESA, LITERATURA E COMUNICAÇÃO PROFISSIONAL",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 60,
              faltas: 0,
              frequencia: 100
              },
              materia02: {
              nome: "LÍNGUA ESTRANGEIRA MODERNA - INGLÊS E COMUNICAÇÃO PROFISSIONAL",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 62,
              faltas: 2,
              frequencia: 97
              },
              materia03: {
              nome: "MATEMÁTICA",
              bim1: "MB",
              bim2: "MB",
              bim3: "B",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 87,
              faltas: 1,
              frequencia: 99
              },
              materia04: {
              nome: "HISTÓRIA",
              bim1: "MB",
              bim2: "B",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 56,
              faltas: 0,
              frequencia: 100
              },
              materia05: {
              nome: "GEOGRAFIA",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 60,
              faltas: 0,
              frequencia: 100
              },
              materia06: {
              nome: "FÍSICA",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 58,
              faltas: 3,
              frequencia: 95
              },
              materia07: {
              nome: "QUÍMICA",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 62,
              faltas: 5,
              frequencia: 97
              },
              materia08: {
              nome: "BIOLOGIA",
              bim1: "MB",
              bim2: "MB",
              bim3: "B",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 54,
              faltas: 8,
              frequencia: 81
              },
              materia09: {
              nome: "DESENVOLVIMENTO PARA DISPOSITIVOS MÓVEIS II",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 60,
              faltas: 0,
              frequencia: 100
              },
              materia10: {
              nome: "SISTEMAS WEB II",
              bim1: "MB",
              bim2: "MB",
              bim3: "B",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 95,
              faltas: 0,
              frequencia: 100
              },
              materia11: {
              nome: "ACESSIBILIDADE DIGITAL",
              bim1: "B",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 60,
              faltas: 4,
              frequencia: 100
              },
              materia12: {
              nome: "ÉTICA E CIDADANIA ORGANIZACIONAL",
              bim1: "B",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 30,
              faltas: 2,
              frequencia: 93
              },
              materia13: {
              nome: "PLANEJAMENTO E DESENVOLVIMENTO DO TRABALHO DE CONCLUSÃO DE CURSO (TCC) EM INFORMÁTICA PARA INTERNET",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "MB",
              final: "MB",
              conselho: "MB",
              aulas: 92,
              faltas: 0,
              frequencia: 100
              },
              materia14: {
              nome: "SEGURANÇA DA INFORMAÇÃO",
              bim1: "MB",
              bim2: "MB",
              bim3: "MB",
              bim4: "B",
              final: "MB",
              conselho: "MB",
              aulas: 58,
              faltas: 2,
              frequencia: 95
              }
            }
          };
  
          new Boletim(boletim).save().then(() => {
            console.log("Boletim gerado!")
          }).catch((err) => {
            console.log("Erro ao gerar boletim: " + err)
          })
        }

        const emailTemplatePath = path.join(__dirname, '../views/templates/boasvindas-template.html');
        const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf8');
        const transporter = nodemailer.createTransport({
          service: 'Outlook',
          auth: {
            user: 'pda.suporte@outlook.com',
            pass: 'pda_etec2023'
          }
        });

        const emailContent = emailTemplate
          .replace('{{codigo_etec}}', novoUsuario.codigo_etec)
          .replace('{{rm}}', novoUsuario.rm)
          .replace('{{nome}}', novoUsuario.nome)
          .replace('{{senha}}', novoUsuario.senha);

        const mailOptions = {
          from: 'pda.suporte@outlook.com',
          to: novoUsuario.email,
          subject: 'Código de Acesso para ' + novoUsuario.nome,
          html: emailContent
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error(error);
            req.flash("error_msg", "Erro ao enviar o código de acesso por email!");
            res.redirect('/adduser');
          } else {
            console.log('Email enviado: ' + info.response);
            req.flash("success_msg", "Email enviado com sucesso!");
            res.redirect('/adduser');
          }
        });
      }).catch((err) => {
        console.log("Usuário n add");
        console.log(err);
        req.flash("error_msg", "Erro ao registrar usuário!");
        res.redirect('/adduser');
      });
    }
  }).catch((err) => {
    console.log(err);
    req.flash("error_msg", "Erro ao verificar RM!");
    res.redirect('/adduser');
  });
});

module.exports = router