const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config(); 

const app = express();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    user: process.env.DB_USER || '3UCq6evf31n5FLN.root',
    password: process.env.DB_PASSWORD || 'ORs5jUCM8PMzN31l',
    database: process.env.DB_NAME || 'logic_beauty',
    port: process.env.DB_PORT || 4000,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
});

db.connect((err) => {
    if (err) {
        console.error('❌ Erro de conexão com o banco:', err.message);
        return;
    }
    console.log('✅ Logic Beauty conectado ao TiDB Cloud! ✨');
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'segredo-fatec-logic-beauty',
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
            return res.render('login', { msg: "❌ Erro no cadastro. Verifique se o e-mail já existe." });
        }
        res.render('login', { msg: "✨ Conta criada com sucesso! Faça login." });
    });
});

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;
    const sql = "SELECT * FROM usuarios WHERE usuario_email = ? AND usuario_senha = ?";

    db.query(sql, [usuario, senha], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            req.session.user_id = results[0].id_usuarios;
            req.session.user_nome = results[0].nome;
            res.redirect('/meus-agendamentos');
        } else {
            res.render('login', { msg: "⚠️ E-mail ou senha incorretos." });
        }
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

app.get('/consulta', (req, res) => {
    const busca = req.query.nome || "";
    const sql = `SELECT u.nome, a.data_hora_agendamento, a.status_agendamento 
                 FROM usuarios u 
                 JOIN agendamento a ON u.id_usuarios = a.usuarios_id_usuarios`;

    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render('consulta', { agendamentos: results, busca: busca });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

cron.schedule('0 9 * * *', () => {
    const sql = `SELECT nome, usuario_email FROM usuarios 
                 WHERE DATE_FORMAT(data_nascimento, '%m-%d') = DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 3 DAY), '%m-%d')`;

    db.query(sql, (err, results) => {
        if (err) return console.error('Erro na automação:', err);

        if (results.length > 0) {
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'seu-email@gmail.com', 
                    pass: 'sua-senha-app'       
                }
            });

            results.forEach(user => {
                transporter.sendMail({
                    from: '"Logic Beauty 💅"',
                    to: user.usuario_email,
                    subject: "Seu presente está chegando! 🎁",
                    text: `Olá ${user.nome}! Vimos que seu aniversário é em 3 dias! Use o cupom NIVER30 e ganhe 30% de desconto.`
                });
            });
            console.log('📧 E-mails de marketing enviados com sucesso!');
        }
    });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Logic Beauty rodando em: http://localhost:${PORT}`);
});