<<<<<<< HEAD
    const express = require('express');
    const session = require('express-session');
    const mysql = require('mysql2');
    const path = require('node:path');
    const nodemailer = require('nodemailer');
    require('dotenv').config();
    
    const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
=======
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
>>>>>>> fc6a6b60ed2097f4da1a528c0deb0463a789a122
        pass: process.env.EMAIL_PASS
    }
});

<<<<<<< HEAD
    const app = express();

    app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();});
        
    app.disable('x-powered-by');
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.urlencoded({ extended: true }));

    app.use(session({
        secret: 'espacocarol2026',
        resave: true,
        saveUninitialized: true
    }));

    const db = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        //ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });

    const protegerRota = (tipo) => (req, res, next) => {
        if (req.session.utilizador && req.session.utilizador.tipo === tipo) next();
        else res.redirect('/login');
    };

    // --- ROTAS ---
    app.get('/', (req, res) => res.render('index'));
    app.get('/login', (req, res) => res.render('login'));
    app.get('/cadastro', (req, res) => res.render('cadastro'));

    app.post('/login', (req, res) => {
        const { email, senha } = req.body;
        db.query("SELECT * FROM usuarios WHERE usuario_email = ? AND usuario_senha = ?", [email, senha], (err, results) => {
            if (results.length > 0) {
                req.session.utilizador = { id: results[0].id_usuarios, nome: results[0].nome, tipo: results[0].usuario_tipo };
                req.session.save(() => {
                    if (results[0].usuario_tipo === 'admin') res.redirect('/dashboard-admin');
                    else if (results[0].usuario_tipo === 'cabeleireira') res.redirect('/dashboard-cabeleireira');
                    else res.redirect('/dashboard-cliente');
                });
            } else res.send("<script>alert('Login inválido!'); window.location.href='/login';</script>");
        });
    });

    // --- DASHBOARD CLIENTE ---
    app.get('/dashboard-cliente', protegerRota('cliente'), (req, res) => {
        const clienteId = req.session.utilizador.id;

        // CORREÇÃO 1: Atualizado para buscar a profissional direto da tabela usuarios
        db.query(`SELECT a.data_hora_agendamento, s.nome_servico, u_prof.nome AS profissional 
            FROM agendamento a
            JOIN servicos s ON a.servicos_id_servico = s.id_servico
            JOIN usuarios u_prof ON a.profissional_id_usuarios = u_prof.id_usuarios
            WHERE a.usuarios_id_usuarios = ?
            ORDER BY a.data_hora_agendamento ASC`, [clienteId], (err, agendamentos) => {
            
            db.query("SELECT * FROM servicos", (erro, servicos) => {
                db.query("SELECT id_usuarios AS id_profissional, nome FROM usuarios WHERE usuario_tipo = 'cabeleireira'", (erro, profs) => {
                    res.render('dashboard-cliente', {
                        nomeCliente: req.session.utilizador.nome,
                        agendamentos: agendamentos || [],
                        servicos: servicos || [],
                        profissionais: profs || []
                    });
                });
            });
        });
    });
    

    app.post('/cliente/agendar', protegerRota('cliente'), (req, res) => {
        const clienteId = req.session.utilizador.id;
        const { servico_id, profissional_id, data_hora } = req.body;
     
        
        if (!profissional_id || !servico_id || !data_hora) {
            return res.json({ ok: false, mensagem: 'Campos incompletos!' });
        }0.
        

        // --- BARREIRA DE SEGURANÇA: DIAS E HORÁRIOS ---
        const dataEscolhida = new Date(data_hora);
        const diaSemana = dataEscolhida.getDay(); // 0 = Domingo, 1 = Segunda, 2 = Terça...
        const hora = dataEscolhida.getHours();    // Formato 24h (ex: 14 para 2 da tarde)

        if (dataEscolhida < new Date()){
            return res.json({ok: false, mensagem: "Não é possivel marcar no passado!"});
        }

        // Bloqueia Domingo (0) e Segunda (1)
        if (diaSemana === 0 || diaSemana === 1) {
            return res.json({ ok: false, mensagem: 'Atendemos apenas de Terça a Sábado!' });
        }

        // Bloqueia antes das 09h e a partir das 19h (7 da noite)
        // Usamos 19 porque se a pessoa marcar 19:30, o sistema também bloqueia.
        if (hora < 9 || hora >= 19) {
            return res.json({ ok: false, mensagem: 'O horário de funcionamento é das 09h às 19h da terça-feira a sabado.' });
        }
        // ----------------------------------------------

const dataFormatada = data_hora.replace('T', ' ') + ':00';
        
        // --- BARREIRA CONTRA DUPLO AGENDAMENTO NO MESMO SEGUNDO ---
        db.query(
            "SELECT id_agendamento FROM agendamento WHERE profissional_id_usuarios = ? AND data_hora_agendamento = ?",
            [profissional_id, dataFormatada],
            (err, ocupado) => {
                if (err) return res.json({ ok: false, mensagem: 'Erro ao verificar disponibilidade!' });
                
                // Se achou alguém no banco nesse exato horário e com essa profissional:
                if (ocupado.length > 0) {
                    return res.json({ ok: false, mensagem: 'Poxa, este horário acabou de ser reservado por outra pessoa!' });
                }
                
                // Se a agenda estiver livre, fazemos o INSERT!
                db.query("INSERT INTO agendamento (data_hora_agendamento, usuarios_id_usuarios, profissional_id_usuarios, servicos_id_servico) VALUES (?, ?, ?, ?)",
                    [dataFormatada, clienteId, profissional_id, servico_id],
                    (errInsert) => {
                        if (errInsert) {
                            return res.json({ ok: false, mensagem: 'Erro no banco de dados!', detalhe: errInsert.message, codigo: errInsert.code });
                        }
                        res.json({ ok: true, mensagem: 'Agendamento realizado com sucesso!' });
                    }
                );        
            }
        );
    });

    app.post('/cadastrar', (req, res) => {
        // 1. Recebe os dados exatamente como estão no atributo 'name' do seu EJS
        const { nome, email, senha, telefone, data_nascimento } = req.body;
        
        // 2. Validação para garantir que nenhum campo ficou em branco
        if (!nome || !email || !senha || !telefone || !data_nascimento) {
            return res.send("<script>alert('Por favor, preencha todos os campos!'); history.back();</script>");
        }

        // 3. Insere no banco de dados
        // Note que aqui usamos os nomes exatos das COLUNAS do seu banco
        const sql = `INSERT INTO usuarios 
                    (nome, usuario_email, usuario_senha, usuario_telefone, data_nascimento) 
                    VALUES (?, ?, ?, ?, ?)`;

        // 4. Aqui passamos as VARIÁVEIS que extraímos do req.body na mesma ordem dos '?'
        db.query(
            sql,
            [nome, email, senha, telefone, data_nascimento],
            (err) => {
                if (err) {
                    console.error("Erro ao cadastrar usuário:", err); 
                    
                    // Se o email já existir no banco (regra UNIQUE)
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.send("<script>alert('Este email já está cadastrado. Tente fazer login!'); history.back();</script>");
                    }

                    return res.send("<script>alert('Erro no servidor ao tentar cadastrar!'); history.back();</script>");
                }
                
                // Sucesso! Redireciona para o login
                res.send("<script>alert('Cadastro realizado com sucesso!'); window.location.href='/login';</script>");
            }
        );
    });

    app.post('/admin/cadastrar-cabeleireira', (req, res) => {
        // 1. req.body pega exatamente os "names" que você colocou nos <input> do HTML
        const { nome, email, senha, telefone, tipo } = req.body;

        const telefonePadrao = '00000000000'
        const dataNascimentoPadrao = '2000-01-01';

        // 2. Comando SQL de Inserção. 
        // Usamos os pontos de interrogação (?) como um "escudo" de segurança (Prepared Statements)
        // Isso impede que hackers enviem códigos maliciosos pelos campos de texto.
        const sql = `
            INSERT INTO usuarios (nome, usuario_email, usuario_senha, usuario_telefone, data_nascimento, usuario_tipo) 
            VALUES (?, ?, ?, ?, ? , 'cabeleireira')
        `;

        // 3. Executa a inserção substituindo os "?" pelas variáveis na mesma ordem
        db.query(sql, [nome, email, senha, telefone, dataNascimentoPadrao], (erro, resultados) => {
            if (erro) {
                console.error('❌ Erro ao cadastrar usuário:', erro);
                // Em caso de erro, devolvemos uma página de erro ou mensagem
                return res.status(500).send('Erro ao processar o cadastro no banco de dados.');
            }

            console.log('✅ Novo usuário cadastrado com sucesso!');
            // (A letra "F" perdida que estava aqui e ia bugar tudo foi removida!)
            
            // 4. O "Pulo do Gato" do EJS: Redirecionamento
            // Depois de salvar no banco, mandamos o navegador dar um "refresh" de volta para o painel
            res.redirect('/admin/dashboard-admin'); 
        });
    });

    app.get('/admin/dashboard-admin', protegerRota('admin'), (req, res) => {
        // 1. Busca usuários
        db.query("SELECT * FROM usuarios", (err, contas) => {
            if (err) return res.send("Erro ao buscar usuários");
            
            // 2. Busca serviços
            db.query("SELECT * FROM servicos", (err, servicos) => {
                if (err) return res.send("Erro ao buscar serviços");

                // 3. Renderiza enviando os dois objetos
                res.render('dashboard-admin', { 
                    contas: contas || [], 
                    servicos: servicos || [] // <--- Esta linha é a chave!
                });
            });
        });
    });
    // --- DASHBOARD CABELEIREIRA ---
    // --- DASHBOARD CABELEIREIRA (ATUALIZADA COM SERVIÇOS) ---
    app.get('/dashboard-cabeleireira', protegerRota('cabeleireira'), (req, res) => {
        const idProfissional = req.session.utilizador.id;

        // Busca 1: Agendamentos e Lucro
        db.query(`SELECT a.id_agendamento, a.data_hora_agendamento, a.status_agendamento, s.nome_servico, s.preco_servico, u_cliente.nome AS nome_cliente 
                FROM agendamento a 
                JOIN servicos s ON a.servicos_id_servico = s.id_servico 
                JOIN usuarios u_cliente ON a.usuarios_id_usuarios = u_cliente.id_usuarios 
                WHERE a.profissional_id_usuarios = ? 
                ORDER BY a.data_hora_agendamento DESC`, [idProfissional], (err, agendamentos) => {
            
                    const lista = agendamentos || [];

    // O cálculo de lucro deve usar o status real do banco: 'concluido'
    const lucro = lista.filter(a => a.status_agendamento === 'concluido').reduce((soma, a) => soma + parseFloat(a.preco_servico || 0), 0);  



            // Busca 2: Clientes
            db.query(`SELECT u.nome AS cliente_nome, u.usuario_telefone AS cliente_telefone, s.nome_servico, a.data_hora_agendamento FROM agendamento a JOIN usuarios u ON a.usuarios_id_usuarios = u.id_usuarios JOIN servicos s ON a.servicos_id_servico = s.id_servico WHERE a.profissional_id_usuarios = ? ORDER BY a.data_hora_agendamento DESC`, [idProfissional], (err2, clientes) => {
                
                // Busca 3: Todos os serviços disponíveis na loja
                db.query("SELECT * FROM servicos", (err3, todosServicos) => {
                    
                    // Busca 4: Os serviços específicos que ESTA profissional faz
                    db.query("SELECT servico_id FROM profissional_servicos WHERE profissional_id = ?", [idProfissional], (err4, meusServicos) => {
                        const meusIds = meusServicos ? meusServicos.map(s => s.servico_id) : [];

                        // ENTREGANDO TUDO PARA O HTML AQUI:
                        res.render('dashboard-cabeleireira', {
                            nomeProfissional: req.session.utilizador.nome,
                            agendamentos: lista, 
                            lucro: lucro, 
                            clientes: clientes || [],
                            servicosDisponiveis: todosServicos || [], // <--- Isso resolve o seu erro!
                            minhasEspecialidades: meusIds
                        });
                    });
                });
            });
        });
    });

    app.post('/admin/cadastrar-servico', protegerRota('admin'), (req, res) => {
        // 1. Recebendo também a duracao_estimada_servico
        const { nome_servico, descricao_servico, preco_servico, duracao_estimada_servico } = req.body;
        
        // Verifique se os dados estão chegando
        if (!nome_servico || !preco_servico || !duracao_estimada_servico) {
            return res.send("<script>alert('Preencha os campos obrigatórios!'); history.back();</script>");
        }

        // 2. Query atualizada com os 4 campos
        const sql = "INSERT INTO servicos (nome_servico, descricao_servico, preco_servico, duracao_estimada_servico) VALUES (?, ?, ?, ?)";
        
        // 3. Executando a inserção com a variável da duração
        db.query(sql, [nome_servico, descricao_servico, preco_servico, duracao_estimada_servico], (err, result) => {
            if (err) {
                console.error(err);
                return res.send("Erro ao salvar no banco: " + err.message);
            }
            // 4. Redirecionamento corrigido para recarregar com dados
            res.redirect('/dashboard-admin'); 
        });
    });

    // --- DASHBOARD ADMIN ---
    app.get('/dashboard-admin', protegerRota('admin'), (req, res) => {
        // 1. Busca os usuários
        db.query("SELECT * FROM usuarios", (err, contas) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Erro ao buscar usuários");
            }
            
            // 2. Busca os serviços dentro do callback dos usuários
            db.query("SELECT * FROM servicos", (err, servicos) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Erro ao buscar serviços");
                }

                // 3. Renderiza passando AMBOS os dados
                res.render('dashboard-admin', { 
                    contas: contas || [], 
                    servicos: servicos || [] 
                });
            });
        });
    });
    // --- SALVAR SERVIÇOS DA CABELEIREIRA ---
    app.post('/cabeleireira/salvar-servicos', protegerRota('cabeleireira'), (req, res) => {
        const idProfissional = req.session.utilizador.id;
        
        // Pega os checkboxes marcados (o "name" no HTML está como "servicos")
        let servicos = req.body.servicos; 

        // 1. Tratamento de dados:
        // Se nenhum serviço for marcado, o HTML não envia nada (fica undefined).
        if (!servicos) {
            servicos = [];
        } else if (!Array.isArray(servicos)) {
            // Se a pessoa marcar apenas UM checkbox, o Express recebe como String. Transformamos em Array.
            servicos = [servicos];
        }
        

        // 2. Primeiro, limpamos os serviços que já estavam cadastrados para essa profissional no banco
        db.query("DELETE FROM profissional_servicos WHERE profissional_id = ?", [idProfissional], (err) => {
            if (err) {
                console.error("Erro ao deletar serviços antigos:", err);
                return res.send("<script>alert('Erro ao atualizar serviços no banco de dados!'); history.back();</script>");
            }

            // 3. Se a lista de serviços estiver vazia (ela desmarcou tudo), só redirecionamos de volta
            if (servicos.length === 0) {
                return res.redirect('/dashboard-cabeleireira');
            }

            // 4. Montamos os novos dados para inserir no banco
            // O formato para o MySQL deve ser um array de arrays: [[id_prof, servico_1], [id_prof, servico_2]]
            const valoresInsercao = servicos.map(servicoId => [idProfissional, servicoId]);

            // 5. Inserimos as novas especialidades
            db.query("INSERT INTO profissional_servicos (profissional_id, servico_id) VALUES ?", [valoresInsercao], (err2) => {
                if (err2) {
                    console.error("Erro ao inserir novos serviços:", err2);
                    return res.send("<script>alert('Erro ao salvar as novas especialidades!'); history.back();</script>");
                }
                
                // Sucesso! Atualiza a página da cabeleireira
                res.redirect('/dashboard-cabeleireira');
            });
        });
    });

    app.get('/api/profissionais-por-servico/:idServico', (req, res) => {
        const idServico = req.params.idServico;
        
        // Busca profissionais que estão atreladas a esse serviço específico
        const sql = `
            SELECT u.id_usuarios AS id_profissional, u.nome 
            FROM usuarios u
            JOIN profissional_servicos ps ON u.id_usuarios = ps.profissional_id
            WHERE ps.servico_id = ? AND u.usuario_tipo = 'cabeleireira'
        `;
        
        db.query(sql, [idServico], (err, resultados) => {
            if (err) {
                console.error("Erro ao buscar profissionais por serviço:", err);
                return res.status(500).json([]); // Devolve um array vazio em caso de erro
            }
            
            // Devolve os dados em formato JSON para o frontend ler
    // Devolve os dados em formato JSON para o frontend ler
            res.json(resultados); 
        });
    }); // <--- É ESTA LINHA AQUI QUE FALTOU NO SEU VS CODE!

    app.post('/cabeleireira/atualizar-agendamento/:id', (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        
        // Certifique-se de que o status enviado está entre os permitidos pelo ENUM
        const sql = "UPDATE agendamento SET status_agendamento = ? WHERE id_agendamento = ?";
        db.query(sql, [status, id], (err, result) => {
            if (err) return res.status(500).send(err);
            res.sendStatus(200);
        });
    });

    app.post('/cabeleireira/deletar-agendamento/:id', protegerRota('cabeleireira'), (req, res) => {
        const { id } = req.params;
        
        // Comando para apagar do banco de dados
        const sql = "DELETE FROM agendamento WHERE id_agendamento = ?";
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error("Erro ao excluir:", err);
                return res.status(500).send("Erro ao excluir agendamento.");
            }
            res.sendStatus(200); // Sucesso
        });
    });

    app.post('/admin/deletar-servico/:id', protegerRota('admin'), (req, res) => {
        const { id } = req.params;
        
        // Deleta o serviço pelo ID
        db.query("DELETE FROM servicos WHERE id_servico = ?", [id], (err, result) => {
            if (err) {
                console.error("Erro ao excluir serviço:", err);
                return res.status(500).send("Erro ao excluir.");
            }
            res.sendStatus(200);
        });
    });
    app.post('/admin/editar-conta', protegerRota('admin'), (req, res) => {
    const { id_usuario, nome, email, senha, telefone, tipo } = req.body;

    // Comando SQL para atualizar os dados do usuário
    const sql = `UPDATE usuarios SET nome = ?, usuario_email = ?, usuario_senha = ?, usuario_telefone = ?, usuario_tipo = ? WHERE id_usuarios = ?`;
    
        db.query(sql, [nome, email, senha, telefone, tipo, id_usuario], (err, result) => {
            if (err) {
                console.error("Erro ao atualizar conta:", err);
                return res.send("<script>alert('Erro ao atualizar usuário!'); history.back();</script>");
            }
            res.redirect('/admin/dashboard-admin');
        });
    });
    app.get('/api/horarios-ocupados/:idProfissional/:data', (req, res) => {
        const { idProfissional, data } = req.params;
        
        // Pede pro próprio MySQL já devolver a hora exata formatada em texto (ex: "09:30")
        // Isso evita o bug de Fuso Horário (Timezone) do Node.js
        const sql = `SELECT DATE_FORMAT(data_hora_agendamento, '%H:%i') as hora_formatada 
                     FROM agendamento 
                     WHERE profissional_id_usuarios = ? AND DATE(data_hora_agendamento) = ?`;
        
        db.query(sql, [idProfissional, data], (err, resultados) => {
            if (err) {
                console.error("Erro na API de horários:", err);
                return res.json([]);
            }
            
            // Pega o resultado "cru" do banco e cria uma lista simples: ["09:00", "14:30"]
            const horariosOcupados = resultados.map(linha => linha.hora_formatada);
            
            res.json(horariosOcupados); 
        });
    });
    app.post('/recuperar-senha', (req, res) => {
        const { email } = req.body;

        // 1. Verifica se o e-mail existe no banco
        db.query("SELECT * FROM usuarios WHERE usuario_email = ?", [email], (err, results) => {
            if (err) return res.send("<script>alert('Erro no servidor!'); history.back();</script>");
            
            if (results.length === 0) {
                return res.send("<script>alert('E-mail não encontrado!'); history.back();</script>");
            }

            // 2. Gera um código aleatório de 6 dígitos
            const codigo = Math.floor(100000 + Math.random() * 900000).toString();

            // 3. Define a validade do código (Ex: 15 minutos a partir de agora)
            const expiracao = new Date();
            expiracao.setMinutes(expiracao.getMinutes() + 15);

            // 4. Salva o código e a validade no banco de dados para esse usuário
            db.query("UPDATE usuarios SET codigo_recuperacao = ?, expiracao_codigo = ? WHERE usuario_email = ?",
                [codigo, expiracao, email],
                (errUpdate) => {
                    if (errUpdate) return res.send("<script>alert('Erro ao gerar código!'); history.back();</script>");

                    // 5. Monta o e-mail e envia
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: email,
                        subject: 'Recuperação de Senha - Espaço Beauty',
                        html: `
                            <div style="font-family: Arial, sans-serif; text-align: center; color: #4A2E35;">
                                <h2>Recuperação de Senha</h2>
                                <p>Você solicitou a recuperação de senha. Seu código é:</p>
                                <h1 style="color: #B76E79; letter-spacing: 5px;">${codigo}</h1>
                                <p>Este código é válido por 15 minutos.</p>
                                <p>Se não foi você, apenas ignore este e-mail.</p>
                            </div>
                        `
                    };

                    transporter.sendMail(mailOptions, (errMail, info) => {
                        if (errMail) {
                            console.error("Erro no Nodemailer:", errMail);
                            return res.send("<script>alert('Erro ao enviar o e-mail de recuperação.'); history.back();</script>");
                        }
                        
                        // Salva o email na sessão para usar na tela de digitar o código
                        req.session.emailRecuperacao = email; 
                        
                        // Redireciona para a tela onde ele vai digitar os 6 números
                        res.send("<script>alert('Código enviado com sucesso! Verifique seu e-mail.'); window.location.href='/validar-codigo';</script>");
                    });
                }
            );
        });
    });
    app.get('/validar-codigo', (req, res) => {
        // Se a pessoa tentou acessar essa página sem ter pedido o email antes, manda pro login
        if (!req.session.emailRecuperacao) {
            return res.redirect('/login');
        }
        res.render('validar-codigo', { email: req.session.emailRecuperacao });
    });

    // --- ROTA PARA CONFERIR SE O CÓDIGO ESTÁ CERTO ---
    app.post('/verificar-codigo', (req, res) => {
        const { codigo } = req.body;
        const email = req.session.emailRecuperacao;

        if (!email) return res.redirect('/login');

        // Vai no banco ver se o código bate e se não expirou
        const sql = `SELECT * FROM usuarios WHERE usuario_email = ? AND codigo_recuperacao = ? AND expiracao_codigo > NOW()`;
        
        db.query(sql, [email, codigo], (err, results) => {
            if (err) return res.send("<script>alert('Erro no banco de dados!'); history.back();</script>");

            if (results.length > 0) {
                // Código certo e dentro da validade!
                res.redirect('/nova-senha');
            } else {
                // Código errado ou já expirou
                res.send("<script>alert('Código inválido ou expirado! Tente solicitar novamente.'); history.back();</script>");
            }
        });
    });

    // --- ROTA PARA MOSTRAR A TELA DE NOVA SENHA ---
    app.get('/nova-senha', (req, res) => {
        if (!req.session.emailRecuperacao) return res.redirect('/login');
        res.render('nova-senha');
    });

    // --- ROTA PARA SALVAR A NOVA SENHA NO BANCO ---
    app.post('/salvar-nova-senha', (req, res) => {
        const { nova_senha, confirmar_senha } = req.body;
        const email = req.session.emailRecuperacao;

        if (!email) return res.redirect('/login');

        if (nova_senha !== confirmar_senha) {
            return res.send("<script>alert('As senhas não coincidem!'); history.back();</script>");
        }

        // Atualiza a senha no banco e zera o código de recuperação para ninguém usar de novo
        const sql = `UPDATE usuarios SET usuario_senha = ?, codigo_recuperacao = NULL, expiracao_codigo = NULL WHERE usuario_email = ?`;
        
        db.query(sql, [nova_senha, email], (err) => {
            if (err) return res.send("<script>alert('Erro ao atualizar a senha!'); history.back();</script>");

            // Limpa a sessão
            req.session.emailRecuperacao = null;
            res.send("<script>alert('Senha alterada com sucesso! Faça login com sua nova senha.'); window.location.href='/login';</script>");
        });
    });

    app.listen(3000, '127.0.0.1', () => {
    console.log('Servidor rodando em http://127.0.0.1:3000');
=======
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
>>>>>>> fc6a6b60ed2097f4da1a528c0deb0463a789a122
});