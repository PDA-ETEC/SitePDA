module.exports = {
    checkRedefinirSenhaAccess: function(req, res, next){
        // Verifique se a requisição veio da rota '/esquecisenha'
        if (req.headers.referer && req.headers.referer.includes('/esquecisenha') || req.headers.referer && req.headers.referer.includes('/redefinirsenha') || req.headers.referer && req.headers.referer.includes('/atualizarsenha')) {
            // Se sim, continue para a próxima middleware ou rota
            next()
        } else {
            // Se não, redirecione para uma página de erro ou outra página
            res.redirect('/')
        }
    },

    checkAtualizarSenhaAccess: function(req, res, next){
        // Verifique se a requisição veio da rota '/redefinirsenha'
        if (req.headers.referer && req.headers.referer.includes('/redefinirsenha')) {
            // Se sim, continue para a próxima middleware ou rota
            next()
        } else {
            // Se não, redirecione para uma página de erro ou outra página
            res.redirect('/')
        }
    }
}