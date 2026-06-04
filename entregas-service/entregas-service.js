// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Inicia o Servidor HTTP na porta 8070? confirmar portas
let porta = 8070;
app.listen(porta, () => {
 console.log('Servidor em execução na porta: ' + porta);
});

// Importa o package do SQLite
const sqlite3 = require('sqlite3');

//Importa o Axios
const axios = require('axios');

// Acessa o arquivo com o banco de dados
var db = new sqlite3.Database('./entregas.db', (err) => {
        if (err) {
            console.log('ERRO: não foi possível conectar ao SQLite.');
            throw err;
        }
        console.log('Conectado ao SQLite!');
});

// Estabelecer criacao de tabela. Cria a tabela entrega, caso ela não exista
db.run(`CREATE TABLE IF NOT EXISTS entregas (
                entrega_id INTEGER PRIMARY KEY,
                cpf INTEGER,
                armario_id INTEGER,
                numero_gaveta INTEGER,
                data DATE,
                hora TIME
                
        )`, 
        [], (err) => {
                if (err) {
                console.log('ERRO: não foi possível criar tabela entregas.');
                throw err;
                }
});


//verificação gavetas
app.get('/gavetas-livres/:tamanho', async (req, res) => {
    try {
        const resposta = await axios.get(
            `http://localhost:8080/gavetas/tamanho/${req.params.tamanho}`
        );
        const gavetas = resposta.data;
        db.all(
            `SELECT armario_id, numero_gaveta
             FROM entregas`,
            [],
            (err, entregas) => {
                if (err) {
                    return res.status(500)
                        .send('Erro ao consultar entregas.');
                }
                const livres = gavetas.filter(gaveta =>

                    !entregas.some(entrega =>

                        entrega.armario_id == gaveta.armario_id &&
                        entrega.numero_gaveta == gaveta.numero
                    )
                );
                res.status(200).json(livres);
            }
        );
    } catch {
        res.status(500).send(
            'Erro ao consultar lockers.'
        );
    }
});

//CRIA ENTREGA
app.post('/entrega', async (req, res) => {


let gaveta    
        try {
        // Verifica se o condômino existe
        await axios.get(
            `http://localhost:8090/condomino/${req.body.cpf}`
        );

        // Verifica gavetas livres
        const resposta = await axios.get(
            `http://localhost:8070/gavetas-livres/${req.body.tamanho}`
        );

        if (resposta.data.length === 0) {
            return res.status(400)
                .send('Não há gavetas disponíveis.');
        }

        gaveta = resposta.data[0]

    } catch (err) {

        if (err.response?.status === 404) {
            return res.status(404)
                .send('Condômino ou gaveta não encontrados.');
        }

        return res.status(500)
            .send('Erro ao validar dados.');
    }

    db.run(
        `INSERT INTO entregas
        (
            entrega_id,
            cpf,
            armario_id,
            numero_gaveta,
            data,
            hora
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            req.body.entrega_id,
            req.body.cpf,
            gaveta.armario_id,
            gaveta.numero,
            req.body.data,
            req.body.hora,
        ],
        async function(err) {

            if (err) {
                return res.status(500)
                    .send('Erro ao cadastrar entrega.');
            }

            try {

                await axios.post(
                    'http://localhost:8060/log',
                    {
                        entrega_id: req.body.entrega_id,
                        retirado: 0,
                        cpf: req.body.cpf,
                        armario_id: gaveta.armario_id,
                        numero_gaveta: gaveta.numero,
                        data: req.body.data,
                        hora: req.body.hora
                    }
                );

            } catch (e) {
                console.log('Erro ao registrar log.');
            }

            res.status(201).send(
                'Entrega cadastrada com sucesso.'
                
            );
        }
    );
});

//ABRE GAVETA
app.post('/entregas/abrir', async (req, res) => {

    const {
        cpf,
        armario_id,
        numero_gaveta
    } = req.body;

    db.get(
        `SELECT *
         FROM entregas
         WHERE armario_id = ?
         AND numero_gaveta = ?`,
        [armario_id, numero_gaveta],
        async (err, entrega) => {
            if (err) {
                return res.status(500).send(err);}
            if (!entrega) {
                return res.status(404)
                          .send('Entrega não encontrada.');
            }
            if (entrega.cpf != cpf) {
                return res.status(403)
                          .send('CPF não autorizado.');
            }
                try {

                    await axios.post(
                        'http://localhost:8050/abrir',
                        {
                            armario_id,
                            numero_gaveta
                        }
                    );

                await axios.post(
                    'http://localhost:8060/log',
                    {
                        entrega_id: entrega.entrega_id,
                        retirado: 1,
                        cpf: entrega.cpf,
                        armario_id: entrega.armario_id,
                        numero_gaveta: entrega.numero_gaveta,
                        data: entrega.data,
                        hora: entrega.hora
                    }
                );

                db.run(
                    `DELETE FROM entregas
                    WHERE entrega_id = ?`,
                    [entrega.entrega_id],
                    function(err) {

                        if (err) {
                            return res.status(500)
                                .send('Erro ao remover entrega.');
                        }
                        if (this.changes === 0) {
                            return res.status(404)
                                .send('Entrega não encontrada.');
                        }


                        res.status(200).send(
                            'Gaveta aberta e entrega retirada com sucesso.'
                        );
                    }
                );
            } catch (err) {

                res.status(500).send(
                    'Erro ao abrir gaveta.'
                );
            }
        }
    );
});

app.get('/entrega/:entrega_id', (req, res, next) => {
    db.get( `SELECT * FROM entregas WHERE entrega_id = ?`, 
            req.params.entrega_id, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Entrega não encontrado.");
            res.status(404).send('Entrega não encontrado.');
        } else {
            res.status(200).json(result);
        }
    });
});