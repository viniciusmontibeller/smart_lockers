// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Inicia o Servidor HTTP na porta 8080
let porta = 8080;
app.listen(porta, () => {
 console.log('Servidor em execução na porta: ' + porta);
});

// Importa o package do SQLite
const sqlite3 = require('sqlite3');

// Acessa o arquivo com o banco de dados
var db = new sqlite3.Database('./dados.db', (err) => {
        if (err) {
            console.log('ERRO: não foi possível conectar ao SQLite.');
            throw err;
        }
        console.log('Conectado ao SQLite!');
});

// Estabelecer criacao de tabela. Cria a tabela cadastro, caso ela não exista
db.run(`CREATE TABLE IF NOT EXISTS `, 
        [], (err) => {
           if (err) {
              console.log('ERRO: não foi possível criar tabela.');
              throw err;
           }
      });

db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS armarios (
                        id integer PRIMARY KEY,
                        condominio text,
                        cep integer
                        numero integer,
                )`, 
        [], (err) => {
                if (err) {
                console.log('ERRO: não foi possível criar tabela armarios.');
                throw err;
                }
        });

        db.run(`CREATE TABLE IF NOT EXISTS gavetas (
                        armario_id INTEGER,
                        numero INTEGER NOT NULL,
                        tamanho TEXT NOT NULL CHECK(TAMANHO IN ('P', 'M', 'G', 'GG')),
                        ocupado BOOLEAN,
                        FOREIGN KEY (armario_id) REFERENCES armarios (id),
                        PRIMARY KEY (armario_id, numero)
                )`, 
        [], (err) => {
           if (err) {
              console.log('ERRO: não foi possível criar tabela gavetas.');
              throw err;
           }
        });
})

{
        'id': 1
        'condominio': 'sdahusdhudhaudhsuid',
        'cep': '3742734293479',
        'numero' : '10',
        'tamanhos': {
                'P': '4',
                'M': '6',
                'G': '4',
                'GG': '9'
        }
}

app.post('/armarios', (req, res, next) => {
        db.serialize(() => {
                data = req.body

                db.run(`INSERT INTO armarios(id, condominio, cep, numero) VALUES(?,?,?)`, 
                        [data.id, data.condominio, data.cep, data.numero], (err) => {
                        if (err) {
                                console.log("Error: " + err);
                                res.status(500).send('Erro ao cadastrar cliente.');
                        } else {
                                console.log('Cliente cadastrado com sucesso!');
                                res.status(200).send('Cliente cadastrado com sucesso!');
                        }
                });
                
                gavetasP = data.tamanho['P']
                gavetasM = data.tamanho['M']
                gavetasG = data.tamanho['G']
                gavetasGG = data.tamanho['GG']

                numero = 1

                for (i = 1; i <= gavetasP; i ++){
                        db.run(`INSERT INTO gavetas(armario_id, numero, tamanho, ocupado) VALUES(?,?,?)`, 
                                [data.id, data.numero, Object.keys(data.tamanho)[0], false], (err) => {
                                if (err) {
                                        console.log("Error: " + err);
                                        res.status(500).send('Erro ao cadastrar cliente.');
                                } else {
                                        console.log('Cliente cadastrado com sucesso!');
                                        res.status(200).send('Cliente cadastrado com sucesso!');
                                }
                        });
                        numero++
                }
                for (i = 1; i <= gavetasM; i ++){
                        db.run(`INSERT INTO gavetas(armario_id, numero, tamanho, ocupado) VALUES(?,?,?)`, 
                                [data.armario_id, data.numero, Object.keys(data.tamanho)[1], false], (err) => {
                                if (err) {
                                        console.log("Error: " + err);
                                        res.status(500).send('Erro ao cadastrar cliente.');
                                } else {
                                        console.log('Cliente cadastrado com sucesso!');
                                        res.status(200).send('Cliente cadastrado com sucesso!');
                                }
                        });
                        numero++
                }
                for (i = 1; i <= gavetasG; i ++){
                        db.run(`INSERT INTO gavetas(armario_id, numero, tamanho, ocupado) VALUES(?,?,?)`, 
                                [data.armario_id, data.numero, Object.keys(data.tamanho)[2], false], (err) => {
                                if (err) {
                                        console.log("Error: " + err);
                                        res.status(500).send('Erro ao cadastrar cliente.');
                                } else {
                                        console.log('Cliente cadastrado com sucesso!');
                                        res.status(200).send('Cliente cadastrado com sucesso!');
                                }
                        });
                        numero++
                }        
                for (i = 1; i <= gavetasGG; i ++){
                        db.run(`INSERT INTO gavetas(armario_id, numero, tamanho, ocupado) VALUES(?,?,?)`, 
                                [data.armario_id, data.numero, Object.keys(data.tamanho)[3], false], (err) => {
                                if (err) {
                                        console.log("Error: " + err);
                                        res.status(500).send('Erro ao cadastrar cliente.');
                                } else {
                                        console.log('Cliente cadastrado com sucesso!');
                                        res.status(200).send('Cliente cadastrado com sucesso!');
                                }
                        });
                        numero++
                }

        })
});
