// BACKEND DA API
// BIBLIOTECAS UTILIZADAS PARA COMPOSIÇÃO DA API
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const { body, validationResult } = require('express-validator');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// PORTA ONDE O SERVIÇO SERÁ INICIADO
const port = 3100;
const idClient = 'BotZeus';

// NUMEROS AUTORIZADOS
const permissaoBot = ["556992102573@c.us"];

// SERVIÇO EXPRESS
app.use(express.json());
app.use(express.urlencoded({
extended: true
}));
app.use(fileUpload({
debug: true
}));
app.use("/", express.static(__dirname + "/"))

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

// PARÂMETROS DO CLIENT DO WPP
const client = new Client({
  authStrategy: new LocalAuth({ clientId: idClient }),
  puppeteer: { headless: true,
  //executablePath: '/usr/bin/google-chrome-stable',
  //executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  //executablePath: '/usr/bin/chromium-browser',  
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ] }
});

// INITIALIZE DO CLIENT DO WPP
client.initialize();

function delay(t, v) {
  return new Promise(function(resolve) {
      setTimeout(resolve.bind(null, v), t)
  });
};

const createConnection = async () => {
	return await mysql.createConnection({
		host: '141.136.42.73',
		user: 'phpmyadmin',
		password: 'Inacio2628',
		database: 'phpmyadmin'
	});
};

const getUser = async (msgfom) => {
	const connection = await createConnection();
	const [rows] = await connection.execute('SELECT contato FROM contatos WHERE contato = ?', [msgfom]);
  delay(1000).then(async function() {
		await connection.end();
		delay(500).then(async function() {
			connection.destroy();
		});
	});
	if (rows.length > 0) return true;
	return false;
};

const setUser = async (msgfom, nome) => {
	const connection = await createConnection();
	const [rows] = await connection.execute('INSERT INTO `contatos` (`id`, `contato`, `nome`) VALUES (NULL, ?, ?)', [msgfom, nome]);
  delay(1000).then(async function() {
		await connection.end();
		delay(500).then(async function() {
			connection.destroy();
		});
	});
	if (rows.length > 0) return rows[0].contato;
	return false;
};

// EVENTOS DE CONEXÃO EXPORTADOS PARA O INDEX.HTML VIA SOCKET
io.on('connection', function(socket) {
  socket.emit('message', '© BOT-Zeus - Iniciado');
  socket.emit('qr', './bolavermelha.jpg');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© BOT-Zeus QRCode recebido, aponte a câmera do seu celular!');
    });
});

client.on('ready', async () => {
  socket.emit('ready', '© BOT-Zeus Dispositivo pronto!');
  socket.emit('message', '© BOT-Zeus Dispositivo pronto!');
  socket.emit('qr', './bolaverde.jpg')
  console.log('© BOT-Zeus Dispositivo pronto');
  const groups = await client.getChats()
  for (const group of groups){
    if(group.id.server.includes('g.us')){
      socket.emit('message', 'Nome: ' + group.name + ' - ID: ' + group.id._serialized.split('@')[0]);
      console.log('Nome: ' + group.name + ' - ID: ' + group.id._serialized.split('@')[0])
    }
  }
});

client.on('authenticated', () => {
    socket.emit('authenticated', '© BOT-Zeus Autenticado!');
    socket.emit('message', '© BOT-Zeus Autenticado!');
    console.log('© BOT-Zeus Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', '© BOT-Zeus Falha na autenticação, reiniciando...');
    console.error('© BOT-Zeus Falha na autenticação');
});

client.on('change_state', state => {
  console.log('© BOT-Zeus Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', '© BOT-Zeus Cliente desconectado!');
  console.log('© BOT-Zeus Cliente desconectado', reason);
  client.initialize();
});
});

// EVENTO DE ESCUTA DE MENSAGENS RECEBIDAS PELA API
client.on('message', async msg => {

  if (msg.body === null) return;

  // REMOVER LINKS
  const chat = await client.getChatById(msg.id.remote);
  for (const participant of chat.participants) {
    if (participant.id._serialized === msg.author && participant.isAdmin) {
      return;
    }
    if ((participant.id._serialized === msg.author && !participant.isAdmin) &&
        (msg.body.toLowerCase().includes("www")
          || msg.body.toLowerCase().includes("http")
          || msg.body.toLowerCase().includes(".br")
          || msg.body.toLowerCase().includes("://")
          || msg.body.toLowerCase().includes(".com.br")
          || msg.body.toLowerCase().includes(".com"))){
      try{
        await msg.delete(true)
        await client.sendMessage(msg.from, "😎 link não permitido")
      } catch (e){
        console.log('© Inácio Informatica')
      }
    }
  }
});
client.on('message', async msg => {
  if (msg.body === null) return;
  // COMANDO BOT
  if (msg.body.startsWith('!ass ')) {
    // MUDAR TITULO DO GRUPO
    if (!permissaoBot.includes(msg.author || msg.from)) return msg.reply("Você não pode enviar esse comando.");
    let newSubject = msg.body.slice(5);
    client.getChats().then(chats => {
      const groups = chats.filter(chat => chat.isGroup);
      if (groups.length == 0) {
        msg.reply('Você não tem grupos.');
      }
      else {
        groups.forEach((group, i) => {
          setTimeout(function() {
            try{
              group.setSubject(newSubject);
              console.log('Assunto alterado para o grupo: ' + group.name);
            } catch(e){
              console.log('Erro ao alterar assunto do grupo: ' + group.name);
            }
          },1000 + Math.floor(Math.random() * 4000) * (i+1) )
        });
      }
    });
  }
  else if (msg.body.startsWith('!desc ')) {
    // MUDAR DESCRICAO DO GRUPO
    if (!permissaoBot.includes(msg.author || msg.from)) return msg.reply("Você não pode enviar esse comando.");
    let newDescription = msg.body.slice(6);
    client.getChats().then(chats => {
      const groups = chats.filter(chat => chat.isGroup);
      if (groups.length == 0) {
        msg.reply('Você não tem grupos.');
      }
      else {
        groups.forEach((group, i) => {
          setTimeout(function() {
            try{
              group.setDescription(newDescription);
              console.log('Descrição alterada para o grupo: ' + group.name);
            } catch(e){
              console.log('Erro ao alterar descrição do grupo: ' + group.name);
            }
          },1000 + Math.floor(Math.random() * 4000) * (i+1) )
        });
      }
    });
  }
  else if (msg.body.startsWith('!ban ')) {
  // BAN USUARIO PIRATA
  if (!permissaoBot.includes(msg.author || msg.from)) return msg.reply("Você não pode enviar esse comando.");
  let usuarioPirata = msg.body.slice(5);
  client.getChats().then(chats => {
      const groups = chats.filter(chat => chat.isGroup);
      if (groups.length == 0) {
        msg.reply('Você não tem grupos.');
      }
      else {
        groups.forEach((group, i) => {
          setTimeout(async function() {
            try {
              await group.removeParticipants([usuarioPirata + `@c.us`]);
              console.log('Participante ' + usuarioPirata + ' banido do grupo: ' + group.name);
            } catch(e){
              console.log('Participante não faz parte do grupo: ' + group.name);
            }
          },1000 + Math.floor(Math.random() * 4000) * (i+1) )
        });
      }
    });
  }
  else if (msg.body.startsWith('!fcgr')) {
    // FECHAR TODOS OS GRUPOS QUE O BOT É ADMIN;
    if (!permissaoBot.includes(msg.author || msg.from)) return msg.reply("Você não pode enviar esse comando.");
    client.getChats().then(chats => {
      const groups = chats.filter(chat => chat.isGroup);
      if (groups.length == 0) {
        msg.reply('Você não tem grupos.');
      }
      else {
        groups.forEach((group, i) => {
          setTimeout(function() {
            try {
              group.setMessagesAdminsOnly(true);
              console.log('Grupo fechado: ' + group.name);
            } catch(e){
              console.log('Erro ao fechar grupo: ' + group.name);
            }
          },1000 + Math.floor(Math.random() * 4000) * (i+1) )
        });
      }
    });
  }
  else if (msg.body.startsWith('!abrgr')) {
  //ABRIR TODOS OS GRUPOS QUE O BOT É ADMIN;
  if (!permissaoBot.includes(msg.author || msg.from)) return msg.reply("Você não pode enviar esse comando.");
  client.getChats().then(chats => {
    const groups = chats.filter(chat => chat.isGroup);
      if (groups.length == 0) {
        msg.reply('Você não tem grupos.');
      }
      else {
        groups.forEach((group, i) => {
          setTimeout(function() {
            try {
              group.setMessagesAdminsOnly(false);
              console.log('Grupo aberto: ' + group.name);
            } catch(e){
              console.log('Erro ao abrir grupo: ' + group.name);
            }
          },1000 + Math.floor(Math.random() * 4000) * (i+1) )
        });
      }
    });
  }
});
client.on('message_create', async msg => {
  if (msg.body === '!pdr'){
    const chat = await client.getChatById(msg.id.remote);
    const text = (await msg.getQuotedMessage()).body;
    let mentions = [];
    for(let participant of chat.participants) {
      if (participant.id._serialized === msg.author && !participant.isAdmin) 
        return msg.reply("Você não pode enviar esse comando.");
      try{
        const contact = await client.getContactById(participant.id._serialized);
        mentions.push(contact);
        } catch (e)
          {console.log('© Bot Inacio: '+e);}
      }
      console.log(text)
      await chat.sendMessage(text, { mentions: mentions });
  }
});
// EVENTO DE NOVO USUÁRIO EM GRUPO
client.on('group_join', async (notification) => {
  // LISTAR GRUPOS
  const groups = await client.getChats()
  console.log('-----------------------------\nBOT-Zeus Grupos atualizados:\n-----------------------------')
  try{
    for (const group of groups){
      if(group.id.server.includes('g.us')){
        console.log('Nome: ' + group.name + ' - ID: ' + group.id._serialized.replace(/\D/g,''))
      }
    }
  } catch (e){
    console.log('© Inacio Informatica')
  }

  // GRAVAR USUÁRIOS DO GRUPOS
  try{
    const contact = await client.getContactById(notification.id.participant)
    const nomeContato = (contact.pushname === undefined) ? contact.verifiedName : contact.pushname;
    const user = notification.id.participant.replace(/\D/g, '');
    const getUserFrom = await getUser(user);

    if (getUserFrom === false) {
      await setUser(user, nomeContato);
      console.log('Usuário armazenado: ' + user + ' - ' + nomeContato)
    }

    if (getUserFrom !== false) {
      console.log('Usuário já foi armazenado')
    }
  }
  catch(e){
    console.log('Não foi possível armazenar o usuário' + e)
  }  

  // MENSAGEM DE SAUDAÇÃO
  if (notification.id.remote) {
    const contact = await client.getContactById(notification.id.participant)
    const texto1 = ', tudo bem? Seja bem vindo ao grupo de dicas e estrategias de jogos. \n\n👉 *Dicas*: Dicas das melhores plataformas\n👉 *Horarios Pagantes*: Sempre informando os melhores horarios\n\nPs.: 🔞 Proibidos para menores de 18 anos\n\nJOGUE COM RESPONSABILIDADE\n\nBoa Sorte';
    const textos = [texto1];

    const mensagemTexto = `@${contact.number}!` + textos;
    const chat = await client.getChatById(notification.id.remote);

    console.log('Grupo: ' + notification.id.remote + ' - Mensagem: ' + mensagemTexto);

    delay(1000).then(async function() {
      try {
        chat.sendStateTyping();
      } catch(e){
        console.log('© Inacio Informatica: '+e)
      }
    });

    delay(5000).then(async function() {
      try{
        client.sendMessage(notification.id.remote, mensagemTexto, { mentions: [contact] });
        chat.clearState();
      } catch(e){
        console.log('© Comunidade ZDG')
      }
    });
  }

});
// INITIALIZE DO SERVIÇO
server.listen(port, function() {
  console.log('© Bot Zeus - Aplicativo rodando na porta *: ' + port);
});