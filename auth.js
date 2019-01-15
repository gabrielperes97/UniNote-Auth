const superagent = require('superagent');

let config = require('./configs/' + (process.env.NODE_ENV || "dev") + ".json");

//var vorpal = require('vorpal')();
//var repl = require('vorpal-repl');
//vorpal.use(repl).show();

module.exports = () => {
    return function authenticate(req, res, next) {
        
        superagent.get(auth_server+"/validate")
            .query({authenticate: req.authenticate})
            .end((err, res_user) => {
                
                if (err) {
                    res.json({success: false, message: "Não autorizado"})
                }
                else{
                    req.user = res_user
                    next(req, res);
                }
            })
    } 
}