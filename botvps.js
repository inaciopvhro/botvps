// BACKEND DA API
// BIBLIOTECAS UTILIZADAS PARA COMPOSIÇÃO DA API
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
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
const idClient = 'bot-zdg-maratona-grupos';

// NUMEROS AUTORIZADOS
const permissaoBot = ["DDIdddXXXXXXXX@c.us"];

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
    executablePath: '/usr/bin/chromium-browser',
    //===================================================================================
    // CAMINHO DO CHROME PARA MAC (REMOVER O COMENTÁRIO ABAIXO)
    //executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    //===================================================================================
    // CAMINHO DO CHROME PARA LINUX (REMOVER O COMENTÁRIO ABAIXO)
    // executablePath: '/usr/bin/google-chrome-stable',
    //===================================================================================
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
  socket.emit('message', '© BOT-ZDG - Iniciado');
  socket.emit('qr', './icon.svg');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© BOT-ZDG QRCode recebido, aponte a câmera  seu celular!');
    });
});

client.on('ready', async () => {
  socket.emit('ready', '© BOT-ZDG Dispositivo pronto!');
  socket.emit('message', '© BOT-ZDG Dispositivo pronto!');
  socket.emit('qr', './check.svg')
  console.log('© BOT-ZDG Dispositivo pronto');
  const groups = await client.getChats()
  for (const group of groups){
    if(group.id.server.includes('g.us')){
      socket.emit('message', 'Nome: ' + group.name + ' - ID: ' + group.id._serialized.split('@')[0]);
      console.log('Nome: ' + group.name + ' - ID: ' + group.id._serialized.split('@')[0])
    }
  }
});

client.on('authenticated', () => {
    socket.emit('authenticated', '© BOT-ZDG Autenticado!');
    socket.emit('message', '© BOT-ZDG Autenticado!');
    console.log('© BOT-ZDG Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', '© BOT-ZDG Falha na autenticação, reiniciando...');
    console.error('© BOT-ZDG Falha na autenticação');
});

client.on('change_state', state => {
  console.log('© BOT-ZDG Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', '© BOT-ZDG Cliente desconectado!');
  console.log('© BOT-ZDG Cliente desconectado', reason);
  client.initialize();
});
});


// EVENTO DE ESCUTA DE MENSAGENS RECEBIDAS PELA API
client.on('message', async msg => {

  if (msg.body === null) return;

  // REMOVER MENSAGEM DE NÚMEROS NÃO AUTORIZADOS
  if (!permissaoBot.includes(msg.author || msg.from)) {
    try{
      msg.delete(true)
      client.sendMessage(msg.from, "😎 Você não tem autorização para enviar mensagens.")
    } catch (e){
      console.log('© Comunidade ZDG')
    }
  }
});


// INITIALIZE DO SERVIÇO
server.listen(port, function() {
  console.log('Aplicativo rodando na porta *: ' + port);
});
