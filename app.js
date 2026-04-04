const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config(); 

const app = express();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
});

db.connect((err) => {
    if (err) {
        console.error('❌ Erro de conexão com o TiDB:', err.message);
        return;
    }
    console.log('✅ Conectado ao TiDB Cloud com sucesso! ✨');
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(express.urlencoded({ extended: true })); 
app.use(session({
    secret: 'segredo-logic-beauty-fatec',
    resave: false,
    saveUninitialized: true
}));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login', { msg: "" });
});

app.post('/cadastrar', (req, res) => {
    const { nome, usuario, senha, telefone, data_nascimento } = req.body;
    const sql = "INSERT INTO usuarios (nome, usuario_email, usuario_senha, usuario_telefone, data_nascimento, usuario_tipo) VALUES (?, ?, ?, ?, ?, 'cliente')";

    db.query(sql, [nome, usuario, senha, telefone, data_nascimento], (err) => {
        if (err) {
            console.error(err);
            return res.render('login', { msg: "❌ Erro no cadastro. E-mail já existe?" });
        }
        res.render('login', { msg: "✨ Conta criada! Agora faça o login." });
    });
});

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;
    const sql = "SELECT * FROM usuarios WHERE usuario_email = ? AND usuario_senha = ?";

    db.query(sql, [usuario, senha], (err, results) => {
        if (err) throw err;
        if (results && results.length > 0) {
            req.session.user_id = results[0].id_usuarios;
            req.session.user_nome = results[0].nome;
            res.redirect('/meus-agendamentos');
        } else {
            res.render('login', { msg: "⚠️ E-mail ou senha incorretos." });
        }
    });
});

app.post('/agendar', (req, res) => {
    if (!req.session.user_id) {
        return res.render('login', { msg: "Você precisa logar para agendar!" });
    }

    const { data, hora, procedimento } = req.body;
    const data_hora = `${data} ${hora}`;
    const sql = "INSERT INTO agendamento (usuarios_id_usuarios, servicos_id_servico, data_hora_agendamento, status_agendamento) VALUES (?, 1, ?, 'pendente')";

    db.query(sql, [req.session.user_id, data_hora], (err) => {
        if (err) {
            console.error(err);
            return res.send("Erro ao processar agendamento.");
        }
        res.redirect('/meus-agendamentos');
    });
});

app.get('/meus-agendamentos', (req, res) => {
    if (!req.session.user_id) return res.redirect('/login');

    const sql = "SELECT * FROM agendamento WHERE usuarios_id_usuarios = ?";
    db.query(sql, [req.session.user_id], (err, results) => {
        if (err) throw err;
        res.render('meus-agendamentos', {
            nome_logado: req.session.user_nome,
            agendamentos: results
        });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Site online em: http://localhost:${PORT}`);
});