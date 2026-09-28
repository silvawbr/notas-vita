# Block 1 — Explorar notas

Uma página estática para Marina ouvir notas e comparar sua altura com a flauta doce. As seis notas são exemplos exploratórios; nenhuma foi tirada da partitura da aula de *Asa Branca*.

## Abrir

No computador, abra `index.html` em um navegador moderno. Para experimentar no celular pela mesma rede Wi-Fi, execute nesta pasta:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

No celular, abra `http://IP-DO-COMPUTADOR:8000` (substitua pelo IP local do computador). O firewall pode pedir autorização para a conexão local. Não há etapa de build, gerenciador de pacotes, dependências ou lockfile.

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

As frequências usam afinação temperada com Lá 4 = 440 Hz. O som é uma senoide eletrônica com início e fim suaves; não imita o timbre da flauta.

## Ambiente e compatibilidade verificados

Verificação feita em 28/09/2026:

- Navegador disponível para teste: Google Chrome 154.0.8037.58 no macOS. A equipe do Chrome anunciou a série 154 no canal estável para desktop em 22/09/2026 ([nota oficial](https://chromereleases.googleblog.com/2026/09/stable-channel-update-for-desktop_0856730748.html)).
- Ferramentas instaladas: Node.js v24.14.0, npm 11.9.0 e Python 3.14.2. Node/npm não são usados pelo app; Python serve apenas o diretório pela biblioteca padrão.
- Na data da verificação, a linha Node.js 24 era LTS; a versão publicada mais recente da linha era v24.21.0 ([calendário oficial](https://nodejs.org/en/about/previous-releases), [release v24.21.0](https://nodejs.org/en/blog/release/v24.21.0)). Não houve atualização porque o app não usa Node nem npm.
- Não havia stack, dependências nem lockfile no diretório inicial; por isso não foi necessário atualizar nada.
- O áudio usa `AudioContext`, `OscillatorNode`, `GainNode` e `AudioParam.setTargetAtTime`, listadas pela MDN como amplamente disponíveis. O contexto é criado ou retomado no clique/toque, conforme as recomendações para políticas de reprodução automática ([MDN: AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext), [MDN: OscillatorNode](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode), [MDN: GainNode](https://developer.mozilla.org/en-US/docs/Web/API/GainNode), [MDN: setTargetAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime), [MDN: boas práticas Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [MDN: reprodução automática](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)).
- A interação visual e o áudio ainda precisam de teste no navegador: a ferramenta desta sessão recusou abrir o arquivo local por política de segurança. Chrome 154 foi identificado no computador, mas não executado com esta página; Safari/iOS e Android também não foram testados.
