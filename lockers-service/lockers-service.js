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
db.serialize(() => {
        db.run("PRAGMA foreign_keys = ON;");

        db.run(`CREATE TABLE IF NOT EXISTS armarios (
                        id integer PRIMARY KEY,
                        condominio text,
                        cep integer,
                        numero integer
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
                        FOREIGN KEY (armario_id) REFERENCES armarios(id) ON DELETE CASCADE,
                        PRIMARY KEY (armario_id, numero)
                )`, 
        [], (err) => {
           if (err) {
              console.log('ERRO: não foi possível criar tabela gavetas.');
              throw err;
           }
        });
})

// {
//         'id': '1'
//         'condominio': 'alameda',
//         'cep': '37427000',
//         'numero' : '10',
//         'tamanhos': {
//                 'P': '4',
//                 'M': '6',
//                 'G': '4',
//                 'GG': '9'
//         }
// }

app.post('/armarios', (req, res, next) => {
        db.serialize(() => {
                const data = req.body

                db.run(`INSERT INTO armarios(id, condominio, cep, numero) VALUES(?,?,?,?)`, 
                        [data.id, data.condominio, data.cep, data.numero],
                        (err) => {
                                if (err) {
                                        console.log("Error: " + err);
                                        return res.status(500).send('Erro ao cadastrar armario');
                                }

                                let numero = 1
                                let erroGaveta = false

                                Object.entries(data.tamanhos).forEach(([tamanho, quantidade]) => {
                                        for (let i = 1; i <= Number(quantidade); i ++) {
                                                db.run(`INSERT INTO gavetas(armario_id, numero, tamanho) VALUES(?,?,?)`, 
                                                        [data.id, numero, tamanho],
                                                        (err) => {
                                                                if (err) {
                                                                        erroGaveta = true;
                                                                        console.log("Error: " + err);
                                                                }
                                                        }
                                                );

                                                numero++
                                        }
                                })

                                if (erroGaveta) {
                                        return res.status(500).send('Armario criado, mas houve erro ao cadastrar gavetas');
                                }

                                return res.status(201).send('Armario e gavetas cadastrados com sucesso!');
                        }
                );
        })
});

// busca todos os armarios
app.get('/armarios', (req, res, next) => {
    db.all(`SELECT * FROM armarios`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

// retorna gavetas por armario selecionado
app.get('/gavetas/:id', (req, res, next) => {
    db.all(`SELECT * FROM gavetas WHERE armario_id = ?`, [req.params.id], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

// busca todos os armarios e gavetas - > Reduntante, pode ser apagado
app.get('/armariosegavetas', (req, res, next) => {
    db.all(`SELECT * FROM armarios JOIN gavetas ON armarios.id = gavetas.armario_id`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

// retorna armario e suas gavetas - > Reduntante, pode ser apagado
app.get('/armariocomgavetas/:id', (req, res, next) => {
    db.all(`SELECT * FROM armarios JOIN gavetas ON armarios.id = gavetas.armario_id WHERE gavetas.armario_id = ?`, [req.params.id], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

app.patch('/armarios/:id', (req, res, next) => {
    db.run(`UPDATE armarios SET condominio = COALESCE(?,condominio), cep = COALESCE(?,cep), numero = COALESCE(?,NUMERO) WHERE id = ?`,
           [req.body.condominio, req.body.cep, req.body.numero, req.params.id], function(err) {
            if (err){
                res.status(500).send('Erro ao alterar dados.');
            } else if (this.changes == 0) {
                console.log("Cliente não encontrado.");
                res.status(404).send('Cliente não encontrado.');
            } else {
                res.status(200).send('Cliente alterado com sucesso!');
            }
    });
});
// nao sera alterado as gavetas, criou o armario criou gavetas pela sua existencia.

// Ao deletar o armario, e deletado as gavetas -> FOREIGN KEY (armario_id) REFERENCES armarios(id) ON DELETE CASCADE
app.delete('/armarios/:id', (req, res, next) => {
        db.serialize(() => {
                db.run(`DELETE FROM armarios WHERE id = ?`, req.params.id, function(err) {
                  if (err){
                     res.status(500).send('Erro ao remover armario.');
                  } else if (this.changes == 0) {
                     console.log("Armario não encontrado.");
                     res.status(404).send('Armario não encontrado.');
                  } else {
                     res.status(200).send('Armario removido com sucesso!');
                  }
                });
        })
});