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
const port = 8001;
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
  puppeteer: { headless: false,
  //executablePath: '/usr/bin/google-chrome-stable',
  //executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  executablePath: '/usr/bin/chromium-browser',  
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

// EVENTOS DE CONEXÃO EXPORTADOS PARA O INDEX.HTML VIA SOCKET
io.on('connection', function(socket) {
  socket.emit('message', '© BOT-Zeus - Iniciado');
  socket.emit('qr', './bolavermelha.jpg');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© BOT-Zeus QRCode recebido, aponte a câmera  seu celular!');
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

// INITIALIZE DO SERVIÇO
server.listen(port, function() {
  console.log('© Bot Zeus - Aplicativo rodando na porta *: ' + port);
});