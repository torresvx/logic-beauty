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
    res.render('meus-agendamentos'); 
});

app.get('/consulta', (req, res) => {
    res.render('consulta'); 
});

app.get('/editar-agendamento', (req, res) => {
    res.render('editar-agendamento');
});

app.post('/finalizar-atendimento', (req, res) => {
    const { usuario_id } = req.body;
    const sqlUpdate = "UPDATE usuarios SET atendimentos_concluidos = atendimentos_concluidos + 1 WHERE id_usuarios = ?";
    
    db.query(sqlUpdate, [usuario_id], (err) => {
        if (err) throw err;
        db.query("SELECT atendimentos_concluidos FROM usuarios WHERE id_usuarios = ?", [usuario_id], (err, results) => {
            if (results && results[0] && results[0].atendimentos_concluidos >= 5) {
                console.log("Cliente fiel! Ganhou procedimento grátis.");
            }
            res.send("Atendimento finalizado!");
        });
    });
});

const PORT = process.env.PORT || 10000; 
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor do Espaço Carol rodando na porta ${PORT}! 🚀`);
});