// partes do site só poderão ser acessadas caso o usuário estiver logado
module.exports = {
    eAluno: function(req, res, next){

        if(req.isAuthenticated()){
            return next()
        }
        // req.flash("error_msg", "Você precisa ser um ADM para obter acesso à página")
        res.redirect('/')
    }
}