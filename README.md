# Block 2 — Montar uma melodia

Uma página estática para Marina criar uma sequência curta com as notas de exemplo do Block 1. Cada nota escolhida é acrescentada ao fim; o botão **Ouvir** toca a melodia completa. O app não atribui a criação à partitura da aula de *Asa Branca*.

## Abrir

No computador, abra `index.html` em um navegador moderno ou execute nesta pasta:

```sh
./serve.sh
```

O script serve por padrão em `http://127.0.0.1:8000`, acessível apenas neste computador. Para testar em um celular conectado à mesma rede Wi-Fi, execute `./serve.sh --network` e abra `http://IP-DO-COMPUTADOR:8000` (substitua pelo IP local do computador). Essa opção expõe o servidor à rede local; o firewall pode pedir autorização. Defina `PORT=8080` antes do comando para escolher outra porta. O servidor da biblioteca padrão do Python serve apenas para desenvolvimento; não use como hospedagem de produção. Não há etapa de build, gerenciador de pacotes, dependências ou lockfile.

## Brincar com a sequência

- Toque numa nota para ouvi-la individualmente e acrescentá-la à sequência. Repetir uma nota cria outra posição na sequência.
- Use **Ouvir** para tocar a melodia desde o início.
- **Desfazer última** remove uma posição e para a reprodução atual.
- **Limpar melodia** abre uma confirmação com as opções **Apagar melodia** e **Manter melodia**.
- As notas têm 320 ms de duração e começam a cada 430 ms. Não há controle de ritmo.

Um novo toque numa nota durante a reprodução interrompe a sequência, toca a nota escolhida individualmente e atualiza a melodia. **Ouvir** inicia a reprodução da sequência atual desde o começo. Desfazer e iniciar a limpeza interrompem o som e deixam a melodia parada; cancelar a limpeza preserva a sequência. Assim, há apenas uma reprodução ativa e a lista destacada corresponde à reprodução iniciada pelo botão.

## Notas de exemplo

Edite o array `notes` no início de `app.js` para mudar nomes, frequências e cores.

| Nota | Frequência aproximada |
| --- | ---: |
| Dó 5 | 523,25 Hz |
| Ré 5 | 587,33 Hz |
| Mi 5 | 659,25 Hz |
| Fá 5 | 698,46 Hz |
| Sol 5 | 783,99 Hz |
| Lá 5 | 880 Hz |
| Si 5 | 987,77 Hz |
| Dó 6 | 1.046,50 Hz |
| Ré 6 | 1.174,66 Hz |
| Mi 6 | 1.318,51 Hz |
| Fá 6 | 1.396,92 Hz |
| Sol 6 | 1.567,98 Hz |
| Lá 6 | 1.760 Hz |
| Si 6 | 1.975,53 Hz |

As frequências usam afinação temperada com Lá 4 = 440 Hz. O som é uma senoide eletrônica com início e fim suaves; não imita o timbre da flauta.

## Ferramentas, versões e compatibilidade

Verificação das versões instaladas e da documentação oficial em 28/09/2026:

- O app continua em HTML, CSS e JavaScript sem framework nem dependências. Não há `package.json` nem lockfile.
- Google Chrome `154.0.8037.58` (macOS), versão instalada confirmada; a série Chrome 154 chegou ao canal estável para desktop em 22/09/2026 ([anúncio oficial](https://chromereleases.googleblog.com/2026/09/stable-channel-update-for-desktop_0856730748.html)).
- Node.js `v24.14.0` e npm `11.9.0` estão instalados, mas o app não os usa. A linha Node.js 24 consta como LTS e a versão v24.21.0 foi publicada em 07/09/2026 ([status das versões](https://nodejs.org/en/about/previous-releases), [v24.21.0](https://nodejs.org/en/blog/release/v24.21.0)); não atualizei o ambiente porque nenhuma dependência Node é necessária.
- Python `3.14.2` está instalado e é usado apenas para servir os arquivos localmente. Python `3.14.7` é a manutenção estável mais recente da série na data consultada ([versões publicadas](https://www.python.org/doc/versions/), [Python 3.14.7](https://www.python.org/downloads/release/python-3147/)). Não atualizei a instalação do ambiente para este app; não há bibliotecas Python externas.
- O áudio usa `AudioContext`, osciladores e envelopes da Web Audio API. A MDN classifica `AudioContext` e `resume()` como amplamente disponíveis; recomenda criar ou retomar o contexto em resposta a uma interação, conforme as políticas de reprodução automática dos navegadores ([AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext), [resume()](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume), [boas práticas de Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [guia de reprodução automática](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)). O app mantém um único contexto: tocar numa nota ou acionar **Ouvir** inicia áudio após a interação.
- O servidor de desenvolvimento segue a interface oficial `python -m http.server` ([documentação do Python](https://docs.python.org/3/library/http.server.html)); não faz parte do app em produção.

## Validação do Block 2

- `node --check app.js`: passou.
- `sh -n serve.sh`: passou.
- Teste no navegador e viewport móvel: pendente de um URL `http(s)` de preview. O navegador disponível recusou abrir o arquivo `file://` por política de segurança; a política também impede contornar isso servindo o mesmo arquivo localmente ou usando outra superfície de navegador. Chrome em dispositivo físico, Safari/iOS e Android não foram testados.
