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

app.use(express.static('public'));
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});

cron.schedule('0 0 * * *', () => {
    const sql = `
        SELECT nome, usuario_email 
        FROM usuarios 
        WHERE DATE_FORMAT(data_nascimento, '%m-%d') = DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 3 DAY), '%m-%d')
    `;

    db.query(sql, (err, results) => {
        if (err) return console.error("Erro na cron:", err);
        results.forEach(user => {
            const mailOptions = {
                from: `Espaço Carol <${process.env.EMAIL_USER}>`,
                to: user.usuario_email,
                subject: '🎁 Presente para você!',
                text: `Olá ${user.nome}! Seu aniversário é em 3 dias! Ganhe 30% OFF e um procedimento grátis!`
            };
            transporter.sendMail(mailOptions);
        });
    });
});

app.post('/finalizar-atendimento', (req, res) => {
    const { usuario_id } = req.body;

    const sqlUpdate = "UPDATE usuarios SET atendimentos_concluidos = atendimentos_concluidos + 1 WHERE id_usuarios = ?";
    
    db.query(sqlUpdate, [usuario_id], (err) => {
        if (err) throw err;

        db.query("SELECT atendimentos_concluidos FROM usuarios WHERE id_usuarios = ?", [usuario_id], (err, results) => {
            if (results[0].atendimentos_concluidos >= 5) {
                console.log("Cliente fiel! Ganhou procedimento grátis.");
            }
            res.send("Atendimento finalizado!");
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor do Espaço Carol rodando na porta ${PORT}! 🚀`);
});