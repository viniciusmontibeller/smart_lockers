// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');

function getDataHoraAtual() {
    const agora = new Date();

    const pad = (valor) => String(valor).padStart(2, '0');

    const data = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
    const hora = `${pad(agora.getHours())}:${pad(agora.getMinutes())}:${pad(agora.getSeconds())}`;

    return { data, hora };
}

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
                cpf TEXT NOT NULL,
                armario_id INTEGER NOT NULL,
                numero_gaveta INTEGER NOT NULL,
                tamanho_gaveta TEXT NOT NULL CHECK(tamanho_gaveta IN ('P', 'M', 'G', 'XG')),
                data DATE NOT NULL,
                hora TIME NOT NULL,
                UNIQUE(armario_id, numero_gaveta)
                
        )`, 
        [], (err) => {
                if (err) {
                console.log('ERRO: não foi possível criar tabela entregas.');
                throw err;
                }
});


//verificação gavetas
app.get('/entregas/gavetas-livres/:armarioId/:tamanho', async (req, res) => {
    try {
        const resposta = await axios.get(
            `http://localhost:8080/gavetas/${req.params.armarioId}/tamanho/${req.params.tamanho}`
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
app.post('/entregas', async (req, res) => {

    let gaveta

    try {
        // Verifica se o condômino existe /condominos/armario/:armario_id
        const respostaCondomino = await axios.get(
            `http://localhost:8090/condominos/${req.body.cpf}`
        );

        const condomino = respostaCondomino.data;

        if (condomino.armario_id != req.body.armario_id) {
            return res.status(403).send('Condômino não tem acesso a este armário.');
        }


        // Verifica gavetas livres
        const resposta = await axios.get(
            `http://localhost:8070/entregas/gavetas-livres/${req.body.armario_id}/${req.body.tamanho}`
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

    const { data, hora } = getDataHoraAtual();

    db.run(
        `INSERT INTO entregas
        (
            entrega_id,
            cpf,
            armario_id,
            numero_gaveta,
            tamanho_gaveta,
            data,
            hora
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            req.body.entrega_id,
            req.body.cpf,
            gaveta.armario_id,
            gaveta.numero,
            req.body.tamanho,
            data,
            hora,
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
                        tamanho_gaveta: req.body.tamanho,
                        data,
                        hora
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

//CRIA ENTREGA 2 (opcional) - Caso entregador ja tenha selecionado condomino valido, e escolhido uma gaveta 
app.post('/entregas/selecionada', async (req, res) => {
    const { entrega_id, cpf, armario_id, numero_gaveta, tamanho_gaveta } = req.body

    const { data, hora } = getDataHoraAtual();

    db.run(
        `INSERT INTO entregas
        (
            entrega_id,
            cpf,
            armario_id,
            numero_gaveta,
            tamanho_gaveta,
            data,
            hora
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            entrega_id,
            cpf,
            armario_id,
            numero_gaveta,
            tamanho_gaveta,
            data,
            hora,
        ],
        async function(err) {

            if (err) {
                console.log("Erro ao cadastrar entrega: " + err);
                return res.status(500).send('Erro ao cadastrar entrega. Verifique se a gaveta já está ocupada.')
            }

            try {
                await axios.post(
                    'http://localhost:8060/log',
                    {
                        entrega_id,
                        retirado: 0,
                        cpf,
                        armario_id,
                        numero_gaveta,
                        tamanho_gaveta,
                        data,
                        hora
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

// estregas por condomino
app.get('/entregas/condominos/:cpf', (req, res) => {
    db.all(
        `SELECT * FROM entregas WHERE cpf = ?`,
        [req.params.cpf],
        (err, result) => {
            if (err) {
                return res.status(500).send('Erro ao obter entregas.');
            }

            res.status(200).json(result);
        }
    );
});

// listar todas as entregas
app.get('/entregas', (req, res) => {
    db.all(`SELECT * FROM entregas`, [], (err, result) => {
        if (err) { 
            console.log("Erro: " + err);
            return res.status(500).send('Erro ao obter dados.');
        }

        res.status(200).json(result);
    });
});

app.get('/entregas/:entrega_id', (req, res, next) => {
    db.get( `SELECT * FROM entregas WHERE entrega_id = ?`, 
        [req.params.entrega_id], (err, result) => {
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

//ABRE GAVETA
app.post('/entregas/abrir', async (req, res) => {

    const {
        cpf,
        armario_id,
        numero_gaveta
    } = req.body;

    const { data, hora } = getDataHoraAtual();

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
                        tamanho_gaveta: entrega.tamanho_gaveta,
                        data,
                        hora
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