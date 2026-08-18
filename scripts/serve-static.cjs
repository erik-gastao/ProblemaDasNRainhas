// Servidor estático mínimo, sem dependências — só módulos nativos do Node.
//
// Existe porque o build do Vite usa caminhos absolutos ("/assets/..."), e
// navegadores baseados em Chromium bloqueiam <script type="module"> quando a
// página é aberta direto do disco (file://) por causa de CORS em módulos ES.
// Servir por http:// resolve os dois problemas de uma vez.
//
// Usado pelo pacote desktop gerado por scripts/package-desktop.mjs — ver
// README.md, seção "Versão desktop (clique e jogue)".
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { exec } = require('node:child_process');

const ROOT = path.join(__dirname, 'dist');
const PORT_START = 4173;
const PORT_ATTEMPTS = 20;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function resolveRequestPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const safe = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(ROOT, safe);

  // Nunca sai de dist/ — proteção contra path traversal.
  if (!filePath.startsWith(ROOT)) return path.join(ROOT, 'index.html');
  return filePath;
}

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Sem arquivo correspondente: cai no index.html (SPA).
      if (filePath !== path.join(ROOT, 'index.html')) {
        return serveFile(path.join(ROOT, 'index.html'), res);
      }
      res.writeHead(404);
      return res.end('404');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

function start(port, attemptsLeft) {
  const server = http.createServer((req, res) => {
    let filePath = resolveRequestPath(req.url);
    if (filePath.endsWith(path.sep)) filePath = path.join(filePath, 'index.html');
    serveFile(filePath, res);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      start(port + 1, attemptsLeft - 1);
    } else {
      console.error('Não consegui abrir uma porta local:', err.message);
      process.exit(1);
    }
  });

  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}/`;
    console.log('Problema das N Rainhas rodando em', url);
    console.log('Fechar esta janela encerra o jogo.');
    exec(`start "" "${url}"`); // abre no browser padrão do Windows
  });
}

start(PORT_START, PORT_ATTEMPTS);
