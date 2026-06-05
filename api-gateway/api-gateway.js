const httpProxy = require('express-http-proxy');
const express = require('express');
const app = express();
var logger = require('morgan');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function selectProxyHost(req) {
    if (req.path.startsWith('/armarios') || req.path.startsWith('/gavetas'))
        return 'http://localhost:8080';
    else if (req.path.startsWith('/condominos'))
        return 'http://localhost:8090';
    else if (req.path.startsWith('/entregas'))
        return 'http://localhost:8070';
    else if (req.path.startsWith('/log'))
        return 'http://localhost:8060';
    else return null;
}

app.use((req, res, next) => {
    var proxyHost = selectProxyHost(req);
  
    if (proxyHost == null) {
        res.status(404).send('Not found');
    } else {
        // CONFIGURAÇÃO DO PROXY: Garante que o body do POST seja repassado intacto
        httpProxy(proxyHost, {
            proxyReqBodyDecorator: function(bodyContent, srcReq) {
                return bodyContent;
            }
        })(req, res, next);
    }
});

app.listen(8000, () => {
    console.log('API Gateway iniciado na porta 8000!');
});