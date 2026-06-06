// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Inicia o Servidor HTTP na porta 8060? confirmar portas
let porta = 8060;
app.listen(porta, () => {
 console.log('Servidor em execução na porta: ' + porta);
});

// Importa o package do SQLite
const sqlite3 = require('sqlite3');

// Acessa o arquivo com o banco de dados
var db = new sqlite3.Database('./logs.db', (err) => {
        if (err) {
            console.log('ERRO: não foi possível conectar ao SQLite.');
            throw err;
        }
        console.log('Conectado ao SQLite!');
});

// Estabelecer criacao de tabela. Cria a tabela cadastro, caso ela não exista
db.run(`CREATE TABLE IF NOT EXISTS logs (
                entrega_id INTEGER,
                retirado INTEGER NOT NULL CHECK (retirado IN (0, 1)),
                cpf TEXT NOT NULL,
                armario_id INTEGER NOT NULL,
                numero_gaveta INTEGER NOT NULL,
                tamanho_gaveta TEXT NOT NULL CHECK(tamanho_gaveta IN ('P', 'M', 'G', 'XG')),
                data DATE NOT NULL,
                hora TIME NOT NULL,
                PRIMARY KEY (entrega_id, retirado)
        )`, 
        [], (err) => {
                if (err) {
                console.log('ERRO: não foi possível criar tabela logging.');
                throw err;
                }
});

      
app.post('/log', (req, res, next) => {
        db.run(`INSERT INTO logs (entrega_id, retirado, cpf, armario_id, numero_gaveta, tamanho_gaveta, data, hora) VALUES(?,?,?,?,?,?,?,?)`,
                [req.body.entrega_id, req.body.retirado, req.body.cpf, req.body.armario_id, req.body.numero_gaveta, req.body.tamanho_gaveta, req.body.data, req.body.hora], (err) => {
                if (err) {
                        console.log("Error: " + err);
                        res.status(500).send('Erro ao criar entrada de log.');
                } else {
                        console.log('Log criado com sucesso!');
                        res.status(200).send('Log criado com sucesso!');
                }
    });
});

app.get('/log/armarios/:armario_id', (req, res) => {
    db.all(
        `SELECT * FROM logs WHERE armario_id = ?`,
        [req.params.armario_id],
        (err, result) => {
            if (err) {
                return res.status(500).send('Erro ao obter logs.');
            }

            res.status(200).json(result);
        }
    );
});

app.get('/log/condominos/:cpf', (req, res) => {
    db.all(
        `SELECT * FROM logs WHERE cpf = ?`,
        [req.params.cpf],
        (err, result) => {
            if (err) {
                return res.status(500).send('Erro ao obter logs.');
            }

            res.status(200).json(result);
        }
    );
});

app.get('/log/retirados', (req, res) => {
    db.all(
        `SELECT * FROM logs WHERE retirado = 1`,
        [],
        (err, result) => {
            if (err) {
                return res.status(500).send('Erro ao obter logs.');
            }

            res.status(200).json(result);
        }
    );
});

// busca todos os log
app.get('/log', (req, res, next) => {
    db.all(`SELECT * FROM logs`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});
