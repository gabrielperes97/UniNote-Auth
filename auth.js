const superagent = require('superagent');

let config = require('./configs/' + (process.env.NODE_ENV || "dev") + ".json");

//var vorpal = require('vorpal')();
//var repl = require('vorpal-repl');
//vorpal.use(repl).show();

module.exports = () => {
    return function authenticate(req, res, next) {

        superagent.get(config.auth_server + "/validate")
            .set('authorization', req.headers.authorization)
            .end((err, res_user) => {

                if (err) {
                    res.json({ success: false, message: "Não autorizado" })
                }
                else {
                    req.user = res_user.body
                    next();
                }
            })
    }
}