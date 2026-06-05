// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Inicia o Servidor HTTP na porta 8090
let porta = 8090;
app.listen(porta, () => {
 console.log('Servidor em execução na porta: ' + porta);
});

// Importa o package do SQLite
const sqlite3 = require('sqlite3');

// Acessa o arquivo com o banco de dados
var db = new sqlite3.Database('./condominos.db', (err) => {
        if (err) {
            console.log('ERRO: não foi possível conectar ao SQLite.');
            throw err;
        }
        console.log('Conectado ao SQLite!');
});

// Estabelecer criacao de tabela. Cria a tabela cadastro, caso ela não exista
db.run(`CREATE TABLE IF NOT EXISTS condominos
        (cpf TEXT PRIMARY KEY NOT NULL,
        nome TEXT NOT NULL,
        telefone TEXT NOT NULL,
        cep TEXT NOT NULL,
        numero TEXT NOT NULL,
        armario_id INTEGER NOT NULL
        )`, 
        [], (err) => {
           if (err) {
              console.log('ERRO: não foi possível criar tabela.');
              throw err;
           }
      }); 


//CADASTRA um novo Condomino
app.post('/condominos', (req, res, next) => {
    db.run(`INSERT INTO condominos(cpf, nome, telefone, cep, numero, armario_id) VALUES(?,?,?,?,?,?)`, 
         [req.body.cpf, req.body.nome, req.body.telefone, req.body.cep, req.body.numero, req.body.armario_id], (err) => {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('Erro ao cadastrar condomino.');
        } else {
            console.log('Condomino cadastrado com sucesso!');
            res.status(200).send('Condominos cadastrado com sucesso!');
        }
    });
});

app.get('/condominos/armario/:armario_id', (req, res) => {
    db.all(
        `SELECT * FROM condominos WHERE armario_id = ?`,
        [req.params.armario_id],
        (err, result) => {
            if (err) {
                return res.status(500).send('Erro ao obter condôminos.');
            }

            res.status(200).json(result);
        }
    );
});

//RETORNA cadastro do Condomino com base no CPF
app.get('/condominos/:cpf', (req, res, next) => {
    db.get( `SELECT * FROM Condominos WHERE cpf = ?`, 
            req.params.cpf, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Condomino não encontrado.");
            res.status(404).send('Condomino não encontrado.');
        } else {
            res.status(200).json(result);
        }
    });
});


// ALTERA o cadastro de um cliente
app.patch('/condominos/:cpf', (req, res, next) => {
    db.run(`UPDATE condominos SET nome = COALESCE(?,nome), telefone = COALESCE(?,telefone), 
        cep = COALESCE(?,cep), numero = COALESCE(?,numero), armario_id = COALESCE(?, armario_id) WHERE cpf = ?`,
           [req.body.nome, req.body.telefone, req.body.cep, req.body.numero, req.body.armario_id, req.params.cpf], function(err) {
            if (err){
                res.status(500).send('Erro ao alterar dados.');
            } else if (this.changes == 0) {
                console.log("Condomino não encontrado.");
                res.status(404).send('Condomino não encontrado.');
            } else {
                res.status(200).send('Condomino alterado com sucesso!');
            }
    });
});

//REMOVE um cliente do cadastro
app.delete('/condominos/:cpf', (req, res, next) => {
    db.run(`DELETE FROM condominos WHERE cpf = ?`, req.params.cpf, function(err) {
      if (err){
         res.status(500).send('Erro ao remover Condomino.');
      } else if (this.changes == 0) {
         console.log("Cliente não encontrado.");
         res.status(404).send('Condominio não encontrado.');
      } else {
         res.status(200).send('Condomino removido com sucesso!');
      }
   });
})
