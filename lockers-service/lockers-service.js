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

await db.run("PRAGMA foreign_keys = ON;");

// Estabelecer criacao de tabela. Cria a tabela cadastro, caso ela não exista
db.serialize(() => {
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
                try {
                        db.run(`INSERT INTO armarios(id, condominio, cep, numero) VALUES(?,?,?,?)`, 
                                [data.id, data.condominio, data.cep, data.numero], (err) => {
                                if (err) {
                                        console.log("Error: " + err);
                                        res.status(500).send('Erro ao cadastrar armario');
                                } else {
                                        console.log('Armario cadastrado com sucesso!');
                                        res.status(200).send('Armario cadastrado com sucesso!');
                                }
                        });
                        
                        let numero = 1
                        Object.entries(data.tamanhos).forEach(([tamanho, quantidade]) => {
                                for (let i = 1; i <= Number(quantidade); i ++) {
                                        db.run(`INSERT INTO gavetas(armario_id, numero, tamanho, ocupado) VALUES(?,?,?,?)`, 
                                                [data.id, numero, tamanho, false], (err) => {
                                                if (err) {
                                                        console.log("Error: " + err);
                                                        throw new Error('Erro ao cadastrar gaveta')
                                                }
                                        });
                                numero++
                        }
                        })

                        console.log('Gavetas cadastradas com sucesso!');
                        res.status(200).send('Gavetas cadastradas com sucesso!');

                } catch (error) {
                        console.error(error.message)
                }


                // const gavetasP = data.tamanho['P']
                // const gavetasM = data.tamanho['M']
                // const gavetasG = data.tamanho['G']
                // const gavetasGG = data.tamanho['GG']

                // for (let i = 1; i <= gavetasP; i ++){
                //         db.run(`INSERT INTO gavetas(armario_id, numero, tamanho, ocupado) VALUES(?,?,?,?)`, 
                //                 [data.id, numero, Object.keys(data.tamanho)[0], false], (err) => {
                //                 if (err) {
                //                         console.log("Error: " + err);
                //                         res.status(500).send('Erro ao cadastrar cliente.');
                //                 } else {
                //                         console.log('Cliente cadastrado com sucesso!');
                //                         res.status(200).send('Cliente cadastrado com sucesso!');
                //                 }
                //         });
                //         numero++
                // }
                // for (let i = 1; i <= gavetasM; i ++){
                //         db.run(`INSERT INTO gavetas(armario_id, numero, tamanho, ocupado) VALUES(?,?,?)`, 
                //                 [data.armario_id, numero, Object.keys(data.tamanho)[1], false], (err) => {
                //                 if (err) {
                //                         console.log("Error: " + err);
                //                         res.status(500).send('Erro ao cadastrar cliente.');
                //                 } else {
                //                         console.log('Cliente cadastrado com sucesso!');
                //                         res.status(200).send('Cliente cadastrado com sucesso!');
                //                 }
                //         });
                //         numero++
                // }
                // for (let i = 1; i <= gavetasG; i ++){
                //         db.run(`INSERT INTO gavetas(armario_id, numero, tamanho, ocupado) VALUES(?,?,?)`, 
                //                 [data.armario_id, numero, Object.keys(data.tamanho)[2], false], (err) => {
                //                 if (err) {
                //                         console.log("Error: " + err);
                //                         res.status(500).send('Erro ao cadastrar cliente.');
                //                 } else {
                //                         console.log('Cliente cadastrado com sucesso!');
                //                         res.status(200).send('Cliente cadastrado com sucesso!');
                //                 }
                //         });
                //         numero++
                // }        
                // for (let i = 1; i <= gavetasGG; i ++){
                //         db.run(`INSERT INTO gavetas(armario_id, numero, tamanho, ocupado) VALUES(?,?,?)`, 
                //                 [data.armario_id, numero, Object.keys(data.tamanho)[3], false], (err) => {
                //                 if (err) {
                //                         console.log("Error: " + err);
                //                         res.status(500).send('Erro ao cadastrar cliente.');
                //                 } else {
                //                         console.log('Cliente cadastrado com sucesso!');
                //                         res.status(200).send('Cliente cadastrado com sucesso!');
                //                 }
                //         });
                //         numero++
                // }

        })
});

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

app.get('/gavetas/:id', (req, res, next) => {
    db.all(`SELECT * FROM gavetas WHERE armario_id = ?`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

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

                db.run(`DELETE FROM gavetas WHERE armario_id = ?`, req.params.id, function(err) {
                  if (err){
                     res.status(500).send('Erro ao remover gavetas.');
                  } else if (this.changes == 0) {
                     console.log("Gavetas não encontradas.");
                     res.status(404).send('Gavetas não encontradas.');
                  } else {
                     res.status(200).send('Gavetas removidas com sucesso!');
                  }
                });
        })
});