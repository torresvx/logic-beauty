const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
});

app.get('/', (req, res) => {
    res.render('index'); 
});

app.get('/login', (req, res) => {
    res.render('login'); 
});

app.get('/meus-agendamentos', (req, res) => {
    res.render('meus-agendamentos', { agendamentos: [] }); 
});

app.get('/consulta', (req, res) => {
    res.render('consulta', { agendamentos: [], clienteBusca: '' }); 
});

app.post('/cadastrar', (req, res) => {
    const { nome, usuario, senha, data_nascimento, telefone } = req.body;
    const sql = "INSERT INTO usuarios (nome, usuario_email, senha, data_nascimento, telefone) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [nome, usuario, senha, data_nascimento, telefone], (err) => {
        if (err) return res.status(500).send("Erro ao cadastrar");
        res.send("<h1>Cadastro realizado! ✅</h1><a href='/login'>Fazer Login</a>");
    });
});

app.post('/agendar', (req, res) => {
    const { data, hora, procedimento } = req.body;
    res.send("<h1>Agendamento solicitado! 📅</h1><a href='/'>Voltar</a>");
});

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;
    res.redirect('/meus-agendamentos');
});

const PORT = process.env.PORT || 10000; 
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor do Espaço Carol rodando na porta ${PORT}! 🚀`);
});