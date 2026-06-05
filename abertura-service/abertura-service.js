// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

let porta = 8050;
app.listen(porta, () => {
 console.log('Servidor em execução na porta: ' + porta);
});

app.post('/abrir', (req, res) => {
    const { armario_id, numero_gaveta } = req.body;

    console.log(`Abrindo gaveta ${numero_gaveta} do armário ${armario_id}`);

    res.status(200).send('Gaveta aberta com sucesso.');
});
