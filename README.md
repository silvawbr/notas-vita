# Block 2 e 2.1 — Montar, tocar e gravar uma melodia

Uma página estática para Marina brincar com as notas de exemplo do Block 1. **Escolher notas** mantém o Block 2: cada nota escolhida é acrescentada à sequência e **Ouvir** toca a melodia completa. **Tocar e gravar** permite segurar as notas, registrar o ritmo e escutar a gravação. O app não atribui a criação à partitura da aula de *Asa Branca*.

## Abrir

No computador, abra `index.html` em um navegador moderno ou execute nesta pasta:

```sh
./serve.sh
```

O script serve por padrão em `http://127.0.0.1:8000`, acessível apenas neste computador. Para testar em um celular conectado à mesma rede Wi-Fi, execute `./serve.sh --network` e abra `http://IP-DO-COMPUTADOR:8000` (substitua pelo IP local do computador). Essa opção expõe o servidor à rede local; o firewall pode pedir autorização. Defina `PORT=8080` antes do comando para escolher outra porta. O servidor da biblioteca padrão do Python serve apenas para desenvolvimento; não use como hospedagem de produção.

O app não usa framework, dependências npm nem serviços externos. Para gerar os arquivos estáticos de produção em `dist/`, execute `npm run build`; o script copia `index.html`, `app.js`, `styles.css` e `recorder-fingerings.js`. Não há lockfile porque o projeto não instala pacotes.

## Publicar na Vercel

O repositório do app é [`silvawbr/notas-vita`](https://github.com/silvawbr/notas-vita). Importe esse repositório em um projeto Vercel próprio, com a raiz no diretório principal do repositório. O arquivo `vercel.json` define o preset **Other**, pula a instalação de pacotes, executa `npm run build` e publica `dist/`. `package.json` define Node.js `24.x`, usado somente durante o build; o app publicado é estático e não cria funções serverless nem precisa de variáveis de ambiente.

Configure `main` como a branch de Production; pushes nessa branch atualizam o deployment de Production automaticamente. As outras branches ficam como Preview. Um nome adequado para o projeto é `notas-vita`; a disponibilidade desse nome no namespace Vercel deve ser conferida durante a criação.

## Block 2 — Escolher notas

- Toque numa nota para ouvi-la individualmente e acrescentá-la à sequência. Repetir uma nota cria outra posição na sequência.
- Use **Ouvir** para tocar a melodia desde o início.
- **Desfazer última** remove uma posição e para a reprodução atual.
- **Limpar melodia** abre uma confirmação com as opções **Apagar melodia** e **Manter melodia**.
- As notas têm 320 ms de duração e começam a cada 430 ms. Este modo não grava o ritmo.

Um novo toque numa nota durante a reprodução interrompe a sequência, toca a nota escolhida individualmente e atualiza a melodia. **Ouvir** inicia a reprodução da sequência atual desde o começo. Desfazer e iniciar a limpeza interrompem o som e deixam a melodia parada; cancelar a limpeza preserva a sequência. Assim, há apenas uma reprodução ativa e a lista destacada corresponde à reprodução iniciada pelo botão.

## Block 2.1 — Tocar e gravar

- Toque em **Tocar e gravar**, depois em **Gravar**. A nota soa enquanto o dedo ou o botão do mouse ficar pressionado; solte para encerrá-la. Também é possível segurar **A, S, D, F e G** no teclado, na ordem das notas exibidas.
- A gravação começa no primeiro toque. Cada evento guarda a nota, o instante de início e a duração medidos com `performance.now()`. O início de cada nota também preserva o silêncio desde o fim da anterior.
- Pressionar outra nota encerra a anterior e inicia a nova. Há uma nota ativa por vez; repetir a mesma nota cria outro evento.
- Soltar fora do botão, cancelar o ponteiro, perder o foco da janela ou ocultar a página encerra a nota. Perder foco também encerra a gravação. Repetição automática de tecla não cria eventos extras.
- **Ouvir minha música** reproduz os instantes e as durações gravados, inclusive as pausas. Depois da primeira execução, o botão passa a **Ouvir novamente**. A nota em reprodução fica destacada; cada nota mostra sua duração e as pausas aparecem antes da nota seguinte.
- **Gravar outra vez** pede confirmação antes de substituir uma gravação. **Apagar gravação** também pede confirmação; cancelar mantém a gravação.
- Não há limite artificial de duração de nota.

## Block 2.2 — Ver as notas durante a reprodução

- **Ouvir minha música** abre o acompanhamento e inicia a gravação. O nome da nota, o dedilhado e o evento destacado avançam no tempo gravado; durante um silêncio, a tela mostra a pausa e a próxima nota.
- A lista numerada mantém cada toque como um evento próprio, mesmo quando duas notas seguidas têm o mesmo nome. As posições usam os tempos e as durações originais da gravação.
- **Pausar** congela o áudio e o acompanhamento; **Continuar** retoma do mesmo ponto. **Ouvir de novo** reinicia a sequência e **Fechar** encerra o som e remove o destaque.
- O diagrama usa círculos preenchidos para furos fechados, contornos para abertos e um círculo parcialmente preenchido para o furo aberto em 1/4. O furo traseiro 0 é do polegar esquerdo; os furos 1–7 ficam na frente. O padrão visual segue os círculos da atividade, com os estados de Sol 5, Lá 5, Si 5, Dó 6 e Ré 6 conferidos na [tabela oficial Yamaha para flauta doce soprano germânica](https://www.yamaha.com/en/musical_instrument_guide/recorder/play/play002.html) e no [quadro de dedilhado Yamaha](https://www.yamaha.com/en/musical_instrument_guide/common/images/recorder/fingering_german.pdf).
- A associação reutilizável fica em `recorder-fingerings.js`; o build copia essa configuração junto dos arquivos estáticos.

## Notas configuradas

Edite o array `notes` no início de `app.js` para mudar nomes, frequências, cores ou teclas.

| Nota | Frequência aproximada | Tecla |
| --- | ---: | :---: |
| Sol 5 | 783,99 Hz | A |
| Lá 5 | 880 Hz | S |
| Si 5 | 987,77 Hz | D |
| Dó 6 | 1.046,50 Hz | F |
| Ré 6 | 1.174,66 Hz | G |

As frequências usam afinação temperada com Lá 4 = 440 Hz. O som é uma senoide eletrônica com início e fim suaves; não imita o timbre da flauta.

Para testar a gravação, use Sol 5, Lá 5, Si 5, Ré 6, Ré 6, Si 5, Dó 6, Dó 6. Este roteiro confirma as oitavas disponíveis e é apenas um exemplo de teste, não a partitura da aula.

## Ferramentas, versões e compatibilidade

Verificação das versões instaladas e da documentação oficial em 29/09/2026:

- O app continua em HTML, CSS e JavaScript sem framework nem bibliotecas externas. `package.json` contém somente o script de build e a faixa de Node; não há lockfile. O acompanhamento usa `<dialog>` e `AudioContext.suspend()` / `resume()`, APIs amplamente disponíveis segundo a [documentação MDN de `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog), [`showModal()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal), [`suspend()`](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend) e [`resume()`](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume).
- Google Chrome `154.0.8037.58` (macOS), versão instalada confirmada; a série Chrome 154 chegou ao canal estável para desktop em 22/09/2026 ([anúncio oficial](https://chromereleases.googleblog.com/2026/09/stable-channel-update-for-desktop_0856730748.html)).
- Node.js local `v24.14.0` e npm `11.9.0`; Node é usado apenas no build. A série Node 24 está em LTS, e o release oficial mais recente da série consultado foi `24.21.0` (09/09/2026). Vercel oferece `24.x` e atualiza patches automaticamente; `engines.node` já declara essa faixa. O patch local está atrás, mas o build usa APIs estáveis de Node e não há necessidade concreta de alterar o projeto ([release Node.js 24.21.0](https://nodejs.org/en/blog/release/v24.21.0), [versões Node.js na Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)). O app publicado é estático e não usa runtime Node nem funções.
- Python local `3.14.2` serve arquivos apenas no desenvolvimento, via biblioteca padrão. Python `3.14.7` é a manutenção estável mais recente da série consultada (05/08/2026). A versão local está atrás, mas o servidor usa `http.server`, presente nessa versão, e não há dependências Python a atualizar ([Python 3.14.7](https://www.python.org/downloads/release/python-3147/), [documentação `http.server`](https://docs.python.org/3/library/http.server.html)).
- O áudio usa `AudioContext`, osciladores e envelopes da Web Audio API; a página cria um contexto e retoma o áudio a partir da interação. `AudioContext` é amplamente disponível ([documentação MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)). Ponteiros unificam mouse e toque, e `KeyboardEvent.repeat` permite ignorar repetição automática; ambas as APIs são amplamente disponíveis ([Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events), [KeyboardEvent.repeat](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat)).
- O servidor de desenvolvimento segue a interface oficial `python -m http.server` ([documentação do Python](https://docs.python.org/3/library/http.server.html)); não faz parte do app em produção.

## Validação

- `npm run build`: **PASS**; gera os arquivos estáticos em `dist/`.
- `node --check app.js`, `node --check scripts/build.js`, `sh -n serve.sh` e `git diff --check`: **PASS**.
- Interações no navegador e largura móvel: **NOT RUN**. `./serve.sh` não conseguiu abrir `127.0.0.1:8000` por `PermissionError`; o navegador também bloqueou a URL local `file:`. Nenhum iPhone ou Android físico foi testado.
