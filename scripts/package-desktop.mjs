#!/usr/bin/env node
// Monta a pasta "clique e jogue": build de produção + Node portátil + bat de
// atalho, tudo dentro de release/. O usuário final não precisa instalar nada
// — só extrair e dar duplo clique em Jogar.bat.
//
// Ver README.md, seção "Versão desktop (clique e jogue)", para o porquê
// dessa abordagem em vez de Tauri/Electron/instalador.
import { execFileSync, execSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, rmSync, cpSync, writeFileSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const NODE_VERSION = 'v24.19.0'; // LTS "Krypton" — mesma major usada no desenvolvimento
const NODE_ARCHIVE = `node-${NODE_VERSION}-win-x64`;
const NODE_URL = `https://nodejs.org/dist/${NODE_VERSION}/${NODE_ARCHIVE}.zip`;

const CACHE_DIR = path.join(ROOT, '.cache');
const CACHE_ZIP = path.join(CACHE_DIR, `${NODE_ARCHIVE}.zip`);
const CACHE_EXTRACT = path.join(CACHE_DIR, NODE_ARCHIVE);

const RELEASE_DIR = path.join(ROOT, 'ClickAndGo');

async function downloadNode() {
  if (existsSync(path.join(CACHE_EXTRACT, 'node.exe'))) {
    console.log('Node portátil já em cache, pulando download.');
    return;
  }
  mkdirSync(CACHE_DIR, { recursive: true });
  console.log('Baixando', NODE_URL, '...');
  const res = await fetch(NODE_URL);
  if (!res.ok) throw new Error(`Download falhou: HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(CACHE_ZIP));

  console.log('Extraindo...');
  execFileSync('powershell', [
    '-NoProfile', '-Command',
    `Expand-Archive -Path "${CACHE_ZIP}" -DestinationPath "${CACHE_DIR}" -Force`,
  ]);
}

function build() {
  console.log('Gerando build de produção (npm run build)...');
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
}

function assembleRelease() {
  rmSync(RELEASE_DIR, { recursive: true, force: true });
  mkdirSync(RELEASE_DIR, { recursive: true });

  cpSync(path.join(CACHE_EXTRACT, 'node.exe'), path.join(RELEASE_DIR, 'node.exe'));
  cpSync(path.join(ROOT, 'scripts', 'serve-static.cjs'), path.join(RELEASE_DIR, 'serve-static.cjs'));
  cpSync(path.join(ROOT, 'dist'), path.join(RELEASE_DIR, 'dist'), { recursive: true });

  const bat = ['@echo off', 'cd /d "%~dp0"', 'node.exe serve-static.cjs', ''].join('\r\n');
  writeFileSync(path.join(RELEASE_DIR, 'Jogar.bat'), bat, 'ascii');
}

async function main() {
  build();
  await downloadNode();
  assembleRelease();
  console.log('\nPronto:', RELEASE_DIR);
  console.log('Compacte essa pasta e distribua. O usuário final só extrai e clica em Jogar.bat.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
