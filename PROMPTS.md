# Registro dos prompts

Registro dos principais prompts usados com a IA (Claude Code, modelo Opus 5)
durante o desenvolvimento. Os prompts estão **transcritos literalmente** dos
logs de sessão do Claude Code — erros de digitação inclusive — para que o
registro seja fiel e não uma reconstrução posterior.

Ferramenta: Claude Code (CLI) · Modelo: Claude Opus 5 · Idioma da conversa:
português.

---

## 1. Planejamento — definição do escopo

> agora vamos começar o problema das n rainhas, vamos planejar antes, preciso de
> uma aplicação web, preciso que o tabuleiro seja interagivel, sem aplicar nenhum
> algoritmo de resoluçao, somente quero que crie um tabuleiro com N dinamico, com
> movimentação manual das rainhas tambem por hora, se n=4, 4 rainhas podem ser
> adicionadas no tabuleiro e movimentadas conforme suas regras, me diga se
> entendeu e me traga perguntas para melhorararmos o inicio da implementação

**Intenção:** abrir com planejamento, não com código. O trecho decisivo é
*"me diga se entendeu e me traga perguntas"* — obriga a IA a expor o que
entendeu e a levantar as ambiguidades **antes** de escrever qualquer arquivo,
em vez de preencher as lacunas por conta própria com suposições invisíveis.

**Resultado:** a IA devolveu perguntas sobre pontos que de fato estavam em
aberto: o que acontece ao arrastar uma rainha para uma casa em conflito, como
N seria escolhido, e qual o limite superior de N. Nenhum arquivo foi criado
nesta rodada.

**Observação:** a expressão *"movimentadas conforme suas regras"* era ambígua no
prompt original — podia significar "a rainha se move como no xadrez" ou "o
conflito segue as regras do xadrez". A pergunta da IA expôs essa ambiguidade, e
o prompt seguinte a resolveu. Esse foi o ponto de maior risco de retrabalho no
projeto inteiro, e custou uma pergunta em vez de uma reescrita.

## 2. Resposta às perguntas — as regras do produto

> arrasto da rainha deve poder ser para qualuqer lugar mesmo que entre em
> conflito, exibir mensagem de conflito, e tambem antes disso deve ter uma
> maneira de selecionar a quantidade de rainhas o que interfirirá no tamanho so
> tabuleiro, vamos limitar a 16x16 por hora

**Intenção:** fechar as três decisões em aberto de uma vez.

**Resultado:** três regras que atravessam todo o código:

1. **Movimento livre ≠ conflito.** A rainha vai para qualquer casa vazia; o
   conflito é *reportado*, nunca *impedido*. Isso é o que impede a
   representação por vetor de permutação (ver `ARQUITETURA.md`, seção 3) e o
   que define a assinatura de `move()` em `useBoard.ts`.
2. **N é escolhido antes de jogar**, e determina o tamanho do tabuleiro —
   originou o componente `BoardSetup.tsx`.
3. **`MAX_N = 16`** — virou constante em `src/types.ts`, e o valor 16 acabou
   determinando o alfabeto de coordenadas em `coords.ts` (`a`..`p` são
   exatamente 16 letras).

## 3. Isolamento do ambiente

> a execução exigira algo global que influencie no meu computadorr, devemos usar
> um ambiente isolado na pasta?

**Intenção:** verificar o impacto da instalação na máquina antes de autorizar o
scaffold.

**Resultado:** confirmado que `npm install` instala apenas em `node_modules/`
dentro da pasta do projeto, sem `-g` e sem tocar em nada fora dela — apagar a
pasta remove o projeto por completo. Essa garantia virou um parágrafo explícito
no `README.md`.

**Observação:** prompt de verificação, não de construção. Vale registrar
justamente por isso: interromper para checar uma consequência antes de aprovar
é parte do processo, e evitou aceitar cegamente o que a ferramenta faria.

## 4. Autorização do scaffold

> pode seguir com o scaffold

**Intenção:** liberar a construção depois de o plano e as regras estarem
fechados.

**Resultado:** criação do projeto Vite + React 19 + TypeScript, com a separação
em `logic/` (funções puras), `hooks/` (estado) e `components/` (interface), mais
os testes em Vitest. É a estrutura descrita em `ARQUITETURA.md`.

**Observação:** prompt curto porque o contexto já tinha sido construído nos
anteriores. Um "faça uma aplicação web das N rainhas" logo na primeira mensagem
teria produzido código de qualidade muito menor — provavelmente com o conflito
bloqueando o movimento, e com a detecção de conflitos misturada dentro do
componente do tabuleiro.

## 5. Documentação de execução

> arrume o readme para portugues e diga como rodar

**Intenção:** tornar o projeto executável por quem não participou da conversa —
requisito direto da entrega.

**Resultado:** `README.md` reescrito em português, com pré-requisitos (versão do
Node exigida pelo Vite 8), tabela de comandos e instruções de uso do tabuleiro.

## 6. Verificação da reprodutibilidade

> então é so clonar em outro pc abrir a parta e rodar esses comandos?

**Intenção:** confirmar que as instruções realmente funcionam numa máquina
limpa.

**Resultado:** confirmado, e o README ganhou a seção "Em outra máquina" com a
sequência `git clone` → `npm install` → `npm run dev`, além da explicação de por
que `package-lock.json` é versionado e `node_modules/` não.

## 7. Ajuste de interface

> vamos deixar o tabuleiro podendo ser mudando com uma barra de arrastar

**Intenção:** permitir mudar N durante o jogo, não só na tela inicial.

**Resultado:** componente `SizeSlider.tsx` e a função `resize()` no `useBoard`.
Levantou uma questão de projeto que o prompt não mencionava: *o que fazer com as
rainhas já postas quando o tabuleiro encolhe?* A resposta virou `fitQueens()` em
`src/logic/board.ts` — descarta quem ficou fora do grid, corta o excedente, e
zera o histórico de desfazer (os estados antigos pertencem a um tabuleiro de
outra dimensão).

## 8. Documentação da entrega

> [enunciado da atividade, colado integralmente]

**Intenção:** produzir os artefatos de entrega que ainda faltavam — o registro
de prompts e a explicação da arquitetura com diagrama.

**Resultado:** este arquivo e o `ARQUITETURA.md`. Os prompts foram extraídos dos
logs de sessão do Claude Code (`~/.claude/projects/`) em vez de reescritos de
memória, para que o registro seja verificável.

## 9. Empacotamento desktop — Tauri, reversão e Node portátil

> fale sobre a viabilidade de criar um .bat ou .exe, algum arquivo clicavel
> para instalar o necessario, via prompts automaticos etc, para o user
> somente clicar e "jogar"

**Intenção:** distribuir o app pra alguém sem Node instalado, sem exigir
terminal.

**Resultado:** levantamento de opções (bat + `npx serve`, `dist/index.html`
aberto direto, bat com Node portátil embutido, empacotamento nativo com
Tauri, auto-installer). O prompt seguinte —
*"tenha em mente que esse projeto será expandido no futuro com algoritmos
para resolução dos problemas"* — mudou o critério de escolha: com Web
Workers/WASM prováveis mais adiante, Tauri passou a ser recomendado por dar
acesso a filesystem real e auto-update, apesar do custo de setup maior.

> vamos usar tauri, lembrese de colocar tudo que acha necessario no readme

**Intenção:** seguir com Tauri e documentar o porquê.

**Resultado:** scaffold criado (`src-tauri/`, deps `@tauri-apps/*`). Rust
instalado via winget. Build falhou por linker: a máquina tinha uma instalação
incompleta do Visual Studio Build Tools (sem Windows SDK — a instalação
anterior tinha ficado cancelada, `isComplete: false` no `vswhere`). Completar
o SDK exigiu elevação (UAC) e um download de ~1–2 GB.

> cancele tudo

**Intenção:** interromper o instalador do Windows SDK em andamento.

**Resultado:** processos do instalador mortos (via `taskkill` elevado —
matar processo elevado exige elevação também). Nenhum componente novo do SDK
chegou a ser instalado.

> reverter e remover tudo que fizemos e mudar a abordagem

**Intenção:** desfazer a tentativa Tauri por completo antes de trocar de
estratégia.

**Resultado:** `git checkout` nos arquivos modificados, `src-tauri/`
removido, `npm install` pra ressincronizar `node_modules`, Rust desinstalado
via winget (`winget uninstall Rustlang.Rustup`). Repositório voltou ao estado
anterior à tentativa — nada disso tinha sido commitado.

> volta pra opção 3 (bat + node portátil), ela é a que nao requer grandes
> passos certo?

**Intenção:** confirmar e seguir com a opção sem toolchain de compilação.

**Resultado:** `scripts/serve-static.cjs` (servidor estático sem
dependências) e `scripts/package-desktop.mjs` (builda, baixa o Node
portátil oficial de nodejs.org, monta `release/ProblemaDasNRainhas/` com
`node.exe` + `dist/` + `Jogar.bat`). Testado de ponta a ponta: `npm run
package:win` gera a pasta, `Jogar.bat` sobe o servidor e abre o navegador,
`curl` confirmou HTML e JS servidos corretamente.

**Observação:** o custo real de cada abordagem só apareceu na prática, não na
análise — a viabilidade de Tauri dependia do estado de uma instalação do
Visual Studio Build Tools que não era visível de antemão. A opção descartada
por complexidade (`.bat` + runtime portátil) acabou sendo a que funcionou de
primeira, sem depender de nada pré-instalado na máquina do usuário.

---

## Prompts de configuração de ambiente

Não são de desenvolvimento, mas fizeram parte da sessão e estão nos logs:
`"antes de começarmos preciso instalar globalmente a skill RTK"`, `"busque
voce"`, `"veja se o rtk esta funcionando e o caveman ativado"`, `"cavemode"`,
`"faça isso"`, `"reinicie a sessão pra ver o badge"` — todos referentes à
configuração da própria ferramenta de IA (modo de resposta compacto e proxy de
CLI), sem efeito sobre o código da aplicação.

---

## O que o processo mostrou

**Planejar antes de gerar foi o que mais influenciou o resultado.** As duas
primeiras rodadas não produziram nenhum arquivo, e são as responsáveis pela
qualidade de tudo que veio depois: a regra "movimento livre, conflito só
reportado" atravessa `useBoard.ts`, `Board.tsx` e `conflicts.ts`. Se ela tivesse
sido descoberta depois do scaffold, teria custado uma reescrita das três
camadas.

**Pedir perguntas em vez de código é uma alavanca barata.** Um prompt que termina
em *"me traga perguntas"* custa uma rodada e devolve a lista de decisões que a
IA teria tomado sozinha, em silêncio.

**A IA levanta subproblemas que o prompt não previu.** O prompt do slider não
dizia nada sobre encolher o tabuleiro com rainhas já postas — mas o caso existe,
e precisou de uma decisão humana. Cabe a nós reconhecer e decidir esses casos,
não apenas aceitar o primeiro comportamento gerado.

**As decisões precisam ser justificáveis, não só funcionais.** Cada escolha
registrada aqui tem um porquê explicado em `ARQUITETURA.md`: por que lista de
rainhas e não matriz, por que `O(n²)` par a par e não `O(n)` com contadores, por
que a camada de domínio não importa React. Esse último ponto é o que sustenta a
próxima etapa da disciplina — os algoritmos de otimização vão reaproveitar
`detectConflicts` como função de avaliação, sem tocar na interface.
