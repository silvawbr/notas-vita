// Ajuste os exemplos e suas frequências somente neste array.
const notes = [
  { name: "Sol 5", frequencyHz: 783.99, color: "#c1daf8", keyboardCode: "KeyA", keyboardLabel: "A" },
  { name: "Lá 5", frequencyHz: 880, color: "#dfcbf4", keyboardCode: "KeyS", keyboardLabel: "S" },
  { name: "Si 5", frequencyHz: 987.77, color: "#f3c7d2", keyboardCode: "KeyD", keyboardLabel: "D" },
  { name: "Dó 6", frequencyHz: 1046.50, color: "#ffd7c4", keyboardCode: "KeyF", keyboardLabel: "F" },
  { name: "Ré 6", frequencyHz: 1174.66, color: "#ffe5a8", keyboardCode: "KeyG", keyboardLabel: "G" },
];

const buttonContainer = document.querySelector("#note-buttons");
const melodyList = document.querySelector("#melody-list");
const melodyEmpty = document.querySelector("#melody-empty");
const melodyCount = document.querySelector("#melody-count");
const melodyHint = document.querySelector("#melody-hint");
const playStatus = document.querySelector("#play-status");
const chooseModeButton = document.querySelector("#choose-mode-button");
const recordModeButton = document.querySelector("#record-mode-button");
const chooseControls = document.querySelector("#choose-controls");
const recordControls = document.querySelector("#record-controls");
const soundHint = document.querySelector("#sound-hint");
const replayButton = document.querySelector("#replay-button");
const undoButton = document.querySelector("#undo-button");
const clearButton = document.querySelector("#clear-button");
const clearConfirmation = document.querySelector("#clear-confirmation");
const confirmClearButton = document.querySelector("#confirm-clear-button");
const cancelClearButton = document.querySelector("#cancel-clear-button");
const recordButton = document.querySelector("#record-button");
const recordPlayButton = document.querySelector("#record-play-button");
const recordClearButton = document.querySelector("#record-clear-button");
const recordConfirmation = document.querySelector("#record-confirmation");
const recordConfirmationMessage = document.querySelector("#record-confirmation-message");
const confirmRecordActionButton = document.querySelector("#confirm-record-action-button");
const cancelRecordActionButton = document.querySelector("#cancel-record-action-button");
const playbackOverlay = document.querySelector("#playback-overlay");
const playbackCloseIconButton = document.querySelector("#playback-close-icon");
const playbackCloseButton = document.querySelector("#playback-close-button");
const playbackPauseButton = document.querySelector("#playback-pause-button");
const playbackReplayButton = document.querySelector("#playback-replay-button");
const playbackProgressLabel = document.querySelector("#playback-progress-label");
const playbackSequence = document.querySelector("#playback-sequence");
const playbackNoteName = document.querySelector("#playback-note-name");
const playbackNoteHint = document.querySelector("#playback-note-hint");
const playbackStage = document.querySelector(".playback-stage");
const recorderFigure = document.querySelector("#recorder-figure");
const fingeringDots = document.querySelector("#fingering-dots");
const fingeringDescription = document.querySelector("#fingering-description");
const frequencyFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const durationFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const NOTE_INTERVAL_MS = 430;
const NOTE_DURATION_SECONDS = 0.32;
const KEYBOARD_NOTES = new Map(notes.map((note) => [note.keyboardCode, note]));

let audioContext;
let mode = "choose";
let melody = [];
let recordedEvents = [];
let recordingActive = false;
let recordingStartedAt = null;
let activeInput = null;
let activePlayback = null;
let pendingRecordAction = null;
let recordingWasPlayed = false;
const pressedKeyboardCodes = new Set();

function formatDuration(durationMs) {
  return `${durationFormatter.format(durationMs / 1000)} s`;
}

function createNoteButton(note) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "note-button";
  button.dataset.keyboardCode = note.keyboardCode;
  button.style.setProperty("--note-color", note.color);

  const name = document.createElement("span");
  name.className = "note-name";
  name.textContent = note.name;

  const detail = document.createElement("span");
  detail.className = "note-detail";
  detail.textContent = `${frequencyFormatter.format(note.frequencyHz)} Hz`;

  const keyHint = document.createElement("span");
  keyHint.className = "note-key-hint";
  keyHint.setAttribute("aria-hidden", "true");
  keyHint.textContent = `Tecla ${note.keyboardLabel}`;
  button.append(name, detail, keyHint);

  button.addEventListener("click", (event) => {
    if (mode === "choose") {
      addNote(note, button);
      return;
    }

    // Um clique sem evento de ponteiro vem de tecnologia assistiva; ele toca uma nota curta.
    if (event.detail === 0 && recordingActive) {
      beginNote(note, { type: "assistive-click", id: note.keyboardCode, button });
      const pressed = activeInput;
      window.setTimeout(() => {
        if (activeInput === pressed) finishActiveNote();
      }, 180);
    }
  });

  button.addEventListener("pointerdown", (event) => {
    if (mode !== "record" || !recordingActive || (event.pointerType === "mouse" && event.button !== 0)) return;
    try {
      button.setPointerCapture(event.pointerId);
    } catch {
      // Alguns navegadores não permitem captura para este ponteiro; os eventos globais também encerram a nota.
    }
    beginNote(note, { type: "pointer", id: event.pointerId, button });
  });

  button.addEventListener("pointerup", (event) => finishInput("pointer", event.pointerId));
  button.addEventListener("pointercancel", (event) => finishInput("pointer", event.pointerId));
  button.addEventListener("lostpointercapture", (event) => finishInput("pointer", event.pointerId));
  button.addEventListener("pointermove", (event) => {
    if (activeInput?.type !== "pointer" || activeInput.id !== event.pointerId) return;
    const bounds = button.getBoundingClientRect();
    const left = event.clientX >= bounds.left && event.clientX <= bounds.right;
    const top = event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    if (!left || !top) finishInput("pointer", event.pointerId);
  });
  button.addEventListener("keydown", (event) => {
    if (mode !== "record" || !recordingActive || !["Space", "Enter", "NumpadEnter"].includes(event.code)) return;
    event.preventDefault();
    if (event.repeat || activeInput?.type === "button-key" && activeInput.id === event.code) return;
    beginNote(note, { type: "button-key", id: event.code, button });
  });

  return button;
}

function renderMelody(currentIndex = -1) {
  const isRecordingMode = mode === "record";
  const entries = isRecordingMode
    ? recordedEvents
    : melody.map((note) => ({ note }));
  const count = entries.length;
  melodyList.replaceChildren();
  melodyEmpty.hidden = count > 0;
  melodyCount.textContent = `(${count} ${count === 1 ? "nota" : "notas"})`;
  replayButton.disabled = melody.length === 0;
  undoButton.disabled = melody.length === 0;
  clearButton.disabled = melody.length === 0;
  recordButton.textContent = recordingActive
    ? "Encerrar gravação"
    : recordedEvents.length > 0 ? "Gravar outra vez" : "Gravar";
  recordButton.setAttribute("aria-pressed", String(recordingActive));
  recordPlayButton.disabled = recordedEvents.length === 0 || recordingActive;
  recordPlayButton.textContent = recordingWasPlayed ? "Ouvir novamente" : "Ouvir minha música";
  recordClearButton.disabled = recordedEvents.length === 0 || recordingActive;
  melodyHint.textContent = isRecordingMode
    ? "Cada toque vira uma nota; o espaço entre os toques também fica na gravação. As barrinhas comparam as durações. Deslize ou role horizontalmente para ver a sequência."
    : "As notas aparecem na ordem escolhida. Você pode repetir uma nota. Deslize ou role horizontalmente para ver a melodia completa.";
  melodyEmpty.textContent = isRecordingMode
    ? "Toque em Gravar e depois toque ou segure as notas."
    : "Sua melodia aparecerá aqui.";
  buttonContainer.setAttribute(
    "aria-label",
    isRecordingMode ? "Teclas para tocar e gravar notas" : "Notas para adicionar à melodia",
  );
  buttonContainer.classList.toggle("is-record-mode", isRecordingMode);
  for (const noteButton of buttonContainer.querySelectorAll(".note-button")) {
    const note = KEYBOARD_NOTES.get(noteButton.dataset.keyboardCode);
    if (!note) continue;
    noteButton.setAttribute(
      "aria-label",
      isRecordingMode
        ? `Tocar ${note.name}, ${frequencyFormatter.format(note.frequencyHz)} Hz. Solte para terminar. Tecla ${note.keyboardLabel}.`
        : `Adicionar ${note.name}, ${frequencyFormatter.format(note.frequencyHz)} Hz à melodia e ouvir a nota.`,
    );
  }
  soundHint.textContent = isRecordingMode
    ? "No modo Tocar e gravar, use o mouse, o toque ou as teclas A, S, D, F e G. Se outra nota for pressionada, a anterior termina primeiro."
    : "O app toca um som eletrônico simples; o timbre é diferente do da flauta.";

  const longestDuration = isRecordingMode
    ? Math.max(1, ...recordedEvents.map((event) => event.durationMs))
    : 1;

  entries.forEach((entry, index) => {
    const item = document.createElement("li");
    item.className = "melody-item";
    if (isRecordingMode) item.classList.add("is-recorded");
    item.style.setProperty("--note-color", entry.note.color);

    let silenceMs = 0;
    if (isRecordingMode && index > 0) {
      const previous = recordedEvents[index - 1];
      silenceMs = Math.max(0, entry.startMs - previous.startMs - previous.durationMs);
      const rest = document.createElement("span");
      rest.className = "melody-rest";
      rest.textContent = `Pausa ${formatDuration(silenceMs)}`;
      item.append(rest);
    }

    const order = document.createElement("span");
    order.className = "melody-order";
    order.textContent = String(index + 1);

    const swatch = document.createElement("span");
    swatch.className = "melody-swatch";
    swatch.setAttribute("aria-hidden", "true");

    const name = document.createElement("span");
    name.className = "melody-name";
    name.textContent = entry.note.name;
    item.append(order, swatch, name);

    if (isRecordingMode) {
      const durationMark = document.createElement("span");
      durationMark.className = "duration-mark";
      const width = Math.max(12, Math.round(54 * entry.durationMs / longestDuration));
      durationMark.style.setProperty("--duration-width", `${width}px`);
      durationMark.setAttribute("aria-hidden", "true");

      const duration = document.createElement("span");
      duration.className = "duration-label";
      duration.textContent = formatDuration(entry.durationMs);
      item.append(durationMark, duration);
      item.setAttribute(
        "aria-label",
        `Nota ${index + 1}: ${entry.note.name}, duração ${formatDuration(entry.durationMs)}${index > 0 ? `, pausa anterior ${formatDuration(silenceMs)}` : ""}`,
      );
    } else {
      item.setAttribute("aria-label", `Nota ${index + 1}: ${entry.note.name}`);
    }

    if (index === currentIndex) {
      item.classList.add("is-current");
      item.setAttribute("aria-current", "true");
      const playing = document.createElement("span");
      playing.className = "melody-playing-label";
      playing.textContent = "Tocando agora";
      item.append(playing);
    }

    melodyList.append(item);
  });

  const visibleIndex = currentIndex >= 0 ? currentIndex : count - 1;
  const visibleItem = melodyList.children[visibleIndex];
  if (visibleItem) {
    const listBounds = melodyList.getBoundingClientRect();
    const itemBounds = visibleItem.getBoundingClientRect();
    if (itemBounds.left < listBounds.left) {
      melodyList.scrollLeft -= listBounds.left - itemBounds.left;
    } else if (itemBounds.right > listBounds.right) {
      melodyList.scrollLeft += itemBounds.right - listBounds.right;
    }
  }
  melodyList.tabIndex = melodyList.scrollWidth > melodyList.clientWidth ? 0 : -1;
}

function buildPlaybackSequence(sequence) {
  playbackSequence.replaceChildren();
  sequence.forEach((event, index) => {
    const item = document.createElement("li");
    item.className = "playback-sequence-item";
    item.dataset.eventIndex = String(index);
    item.setAttribute("aria-label", `Evento ${index + 1}: ${event.note.name}`);

    const number = document.createElement("span");
    number.className = "playback-sequence-number";
    number.setAttribute("aria-hidden", "true");
    number.textContent = String(index + 1);

    const name = document.createElement("span");
    name.textContent = event.note.name;
    item.append(number, name);
    playbackSequence.append(item);
  });
}

function fingeringState(config, holeNumber) {
  if (config.quarterOpen.includes(holeNumber)) return "quarter-open";
  if (config.closed.includes(holeNumber)) return "closed";
  return "open";
}

function renderFingering(note) {
  const config = window.RECORDER_FINGERINGS[note.name];
  if (!config) {
    recorderFigure.hidden = true;
    return false;
  }

  const holeNames = Array.from({ length: 8 }, (_, holeNumber) => {
    const state = fingeringState(config, holeNumber);
    const location = holeNumber === 0 ? "traseiro, polegar esquerdo" : "frontal";
    const label = state === "quarter-open" ? "1/4 aberto" : state === "closed" ? "fechado" : "aberto";
    return `furo ${holeNumber} (${location}) ${label}`;
  });

  for (const hole of fingeringDots.querySelectorAll("[data-hole]")) {
    const state = fingeringState(config, Number(hole.dataset.hole));
    hole.classList.remove("is-open", "is-closed", "is-quarter-open");
    hole.classList.add(`is-${state}`);
  }

  fingeringDots.setAttribute("aria-label", `${note.name}: ${holeNames.join("; ")}.`);
  fingeringDescription.textContent = holeNames.join(" · ");
  recorderFigure.hidden = false;
  return true;
}

function hideFingering() {
  recorderFigure.hidden = true;
  playbackStage.classList.remove("has-fingering");
}

function updatePlaybackSequence(playback, elapsedMs, activeIndex, completedCount, nextIndex, finished) {
  for (const item of playbackSequence.children) {
    const index = Number(item.dataset.eventIndex);
    const isCurrent = !finished && index === activeIndex;
    const isComplete = finished || playback.sequence[index].startMs + playback.sequence[index].durationMs <= elapsedMs;
    const isUpNext = !finished && activeIndex < 0 && index === nextIndex;
    item.classList.toggle("is-current", isCurrent);
    item.classList.toggle("is-complete", isComplete);
    item.classList.toggle("is-up-next", isUpNext);
    if (isCurrent) {
      item.setAttribute("aria-current", "step");
    } else {
      item.removeAttribute("aria-current");
    }
  }

  if (finished) {
    playbackProgressLabel.textContent = `Sequência concluída · ${playback.sequence.length} eventos`;
  } else if (activeIndex >= 0) {
    playbackProgressLabel.textContent = `Nota ${activeIndex + 1} de ${playback.sequence.length}`;
  } else if (elapsedMs < 0) {
    playbackProgressLabel.textContent = `Preparando · ${playback.sequence.length} eventos`;
  } else if (nextIndex >= 0) {
    playbackProgressLabel.textContent = completedCount === 0
      ? `Pausa gravada antes do evento ${nextIndex + 1}`
      : `Pausa gravada entre os eventos ${completedCount} e ${nextIndex + 1}`;
  }
}

function playbackPositionMs(playback, usePausedPosition = true) {
  if (usePausedPosition && playback.isPaused) return playback.pausedPositionMs;
  return (audioContext.currentTime - playback.startAt) * 1000;
}

function renderRecordingPlayback(playback) {
  if (activePlayback !== playback || playback.startAt === null) return;

  const elapsedMs = playbackPositionMs(playback);
  const lastEvent = playback.sequence.at(-1);
  const totalDurationMs = lastEvent.startMs + lastEvent.durationMs;
  if (elapsedMs >= totalDurationMs) {
    finishRecordingPlayback(playback, elapsedMs);
    return;
  }

  const activeIndex = elapsedMs < 0
    ? -1
    : playback.sequence.findIndex((event) => elapsedMs >= event.startMs && elapsedMs < event.startMs + event.durationMs);
  const completedCount = elapsedMs < 0
    ? 0
    : playback.sequence.filter((event) => event.startMs + event.durationMs <= elapsedMs).length;
  const nextIndex = activeIndex >= 0
    ? -1
    : playback.sequence.findIndex((event) => event.startMs > elapsedMs);

  updatePlaybackSequence(playback, elapsedMs, activeIndex, completedCount, nextIndex, false);
  playbackPauseButton.textContent = playback.isPaused ? "Continuar" : "Pausar";
  playbackPauseButton.disabled = false;

  if (activeIndex >= 0) {
    const event = playback.sequence[activeIndex];
    playbackNoteName.textContent = event.note.name;
    playbackNoteHint.textContent = playback.isPaused
      ? "Reprodução pausada nesta nota. Toque em Continuar para retomar."
      : "Acompanhe esta posição dos dedos enquanto a nota soa.";
    playbackStage.classList.toggle("has-fingering", renderFingering(event.note));
    playStatus.textContent = playback.isPaused
      ? `Reprodução pausada na nota ${activeIndex + 1} de ${playback.sequence.length}.`
      : `Tocando nota ${activeIndex + 1} de ${playback.sequence.length}: ${event.note.name}.`;
  } else if (elapsedMs < 0) {
    playbackNoteName.textContent = "Preparando…";
    playbackNoteHint.textContent = "A sequência vai começar.";
    hideFingering();
    playStatus.textContent = "Preparando sua música…";
  } else if (nextIndex >= 0) {
    const nextEvent = playback.sequence[nextIndex];
    playbackNoteName.textContent = "Pausa";
    playbackNoteHint.textContent = `Silêncio gravado. Prepare ${nextEvent.note.name} para a próxima nota.`;
    hideFingering();
    playStatus.textContent = `Pausa antes da nota ${nextIndex + 1} de ${playback.sequence.length}.`;
  }

  renderMelody(activeIndex);
}

function finishRecordingPlayback(playback, elapsedMs) {
  if (activePlayback !== playback) return;
  activePlayback = null;
  playback.finished = true;
  playback.timer = null;
  recordingWasPlayed = true;
  playbackNoteName.textContent = "Concluída";
  playbackNoteHint.textContent = "Você pode ouvir de novo ou fechar o acompanhamento.";
  hideFingering();
  playbackPauseButton.textContent = "Pausar";
  playbackPauseButton.disabled = true;
  updatePlaybackSequence(playback, elapsedMs, -1, playback.sequence.length, -1, true);
  renderMelody();
  playStatus.textContent = `Sua música terminou: ${playback.sequence.length} ${playback.sequence.length === 1 ? "nota" : "notas"}.`;
}

function closeClearConfirmation() {
  clearConfirmation.hidden = true;
  clearButton.hidden = false;
}

function closeRecordConfirmation() {
  recordConfirmation.hidden = true;
  pendingRecordAction = null;
}

function addNote(note, button) {
  stopPlayback();
  closeClearConfirmation();
  melody = [...melody, note];
  renderMelody();
  previewNote(note, button);
}

function getAudioContext() {
  if (!audioContext) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextConstructor) {
      throw new Error("Este navegador não oferece Web Audio API.");
    }

    audioContext = new AudioContextConstructor();
  }

  return audioContext;
}

function stopPlayback({ keepRecordingOverlay = false } = {}) {
  const playback = activePlayback;
  if (!playback) return;

  activePlayback = null;
  playback.button?.classList.remove("is-playing");
  if (playback.timer !== null) {
    window.clearTimeout(playback.timer);
    playback.timer = null;
  }
  for (const timer of playback.timers ?? []) {
    window.clearTimeout(timer);
  }
  playback.timers?.clear();
  const resolveWait = playback.resolveWait;
  playback.resolveWait = null;
  resolveWait?.();

  const stopAt = audioContext?.currentTime ?? 0;
  for (const voice of playback.voices) {
    voice.gain.gain.cancelScheduledValues(stopAt);
    if (audioContext?.state === "running") {
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, stopAt);
      voice.gain.gain.linearRampToValueAtTime(0, stopAt + 0.01);
      try {
        voice.oscillator.stop(stopAt + 0.015);
      } catch {
        // A voz já pode ter terminado entre a interação e o cancelamento.
      }
    } else {
      voice.gain.gain.setValueAtTime(0, stopAt);
      try {
        voice.oscillator.stop();
      } catch {
        // A voz já pode ter terminado entre a interação e o cancelamento.
      }
    }
  }

  if (playback.kind === "recording" && !keepRecordingOverlay && playbackOverlay.open) {
    playbackOverlay.close();
  }

  renderMelody();
}

function playNote(playback, note) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const startAt = context.currentTime + 0.02;
  const releaseAt = startAt + 0.23;
  const finishAt = startAt + NOTE_DURATION_SECONDS;
  const voice = { oscillator, gain: envelope };

  playback.voices.add(voice);
  oscillator.onended = () => playback.voices.delete(voice);
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(note.frequencyHz, startAt);
  envelope.gain.setValueAtTime(0, startAt);
  envelope.gain.linearRampToValueAtTime(0.16, startAt + 0.012);
  envelope.gain.setValueAtTime(0.16, releaseAt);
  envelope.gain.linearRampToValueAtTime(0, finishAt);
  oscillator.connect(envelope);
  envelope.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(finishAt + 0.01);
}

function waitForNextNote(playback, durationMs = NOTE_INTERVAL_MS) {
  return new Promise((resolve) => {
    playback.resolveWait = resolve;
    playback.timer = window.setTimeout(() => {
      playback.timer = null;
      playback.resolveWait = null;
      resolve();
    }, durationMs);
  });
}

async function previewNote(note, button) {
  const playback = { voices: new Set(), timer: null, resolveWait: null, button };
  activePlayback = playback;
  button.classList.add("is-playing");
  playStatus.textContent = `Tocando ${note.name}.`;

  try {
    const context = getAudioContext();
    if (context.state !== "running") {
      await context.resume();
    }
    if (activePlayback !== playback) return;

    playNote(playback, note);
    await waitForNextNote(playback, NOTE_DURATION_SECONDS * 1000);

    if (activePlayback !== playback) return;
    activePlayback = null;
    button.classList.remove("is-playing");
    playStatus.textContent = `${note.name} adicionada e tocada. Toque em Ouvir para escutar a melodia.`;
  } catch {
    if (activePlayback !== playback) return;
    stopPlayback();
    playStatus.textContent = "O som não iniciou. Confira o volume e toque na nota novamente.";
  }
}

async function startPlayback() {
  stopPlayback();
  if (melody.length === 0) return;

  const playback = { voices: new Set(), timer: null, resolveWait: null };
  const sequence = [...melody];
  activePlayback = playback;
  playStatus.textContent = "Preparando o som…";

  try {
    const context = getAudioContext();
    if (context.state !== "running") {
      await context.resume();
    }
    if (activePlayback !== playback) return;

    for (let index = 0; index < sequence.length; index += 1) {
      if (activePlayback !== playback) return;

      const note = sequence[index];
      renderMelody(index);
      playStatus.textContent = `Tocando nota ${index + 1} de ${sequence.length}: ${note.name}.`;
      playNote(playback, note);
      await waitForNextNote(playback);
    }

    if (activePlayback !== playback) return;
    activePlayback = null;
    renderMelody();
    playStatus.textContent = `Melodia concluída: ${sequence.length} ${sequence.length === 1 ? "nota" : "notas"}.`;
  } catch {
    if (activePlayback !== playback) return;
    stopPlayback();
    playStatus.textContent = "O som não iniciou. Confira o volume e toque em Ouvir.";
  }
}

function undoLastNote() {
  if (melody.length === 0) return;

  stopPlayback();
  closeClearConfirmation();
  melody = melody.slice(0, -1);
  renderMelody();
  if (melody.length === 0) {
    buttonContainer.querySelector("button")?.focus();
  }
  playStatus.textContent = melody.length > 0
    ? `Última nota removida. A melodia tem ${melody.length} ${melody.length === 1 ? "nota" : "notas"}. Toque em Ouvir para escutá-la.`
    : "A melodia está vazia. Escolha uma nota para começar.";
}

function askToClearMelody() {
  stopPlayback();
  clearButton.hidden = true;
  clearConfirmation.hidden = false;
  confirmClearButton.focus();
  playStatus.textContent = "A reprodução parou. Confirme se quer apagar todas as notas.";
}

function clearMelody() {
  melody = [];
  closeClearConfirmation();
  renderMelody();
  buttonContainer.querySelector("button")?.focus();
  playStatus.textContent = "Melodia apagada. Escolha uma nota para começar outra.";
}

function beginNote(note, input) {
  if (mode !== "record" || !recordingActive) return;
  if (activeInput?.type === input.type && activeInput.id === input.id) return;

  stopPlayback();
  closeRecordConfirmation();
  finishActiveNote();

  const pressedAt = performance.now();
  if (recordingStartedAt === null) recordingStartedAt = pressedAt;
  const pressed = {
    ...input,
    note,
    startedAt: pressedAt,
    startMs: pressedAt - recordingStartedAt,
    voice: null,
  };
  activeInput = pressed;
  pressed.button.classList.add("is-playing");
  playStatus.textContent = `Tocando ${note.name}. Solte para terminar a nota.`;
  void startHeldVoice(pressed);
}

async function startHeldVoice(pressed) {
  try {
    const context = getAudioContext();
    if (context.state !== "running") {
      await context.resume();
    }
    if (activeInput !== pressed || !recordingActive) return;

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const startAt = context.currentTime + 0.012;
    const voice = { context, oscillator, gain: envelope, startAt };
    pressed.voice = voice;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(pressed.note.frequencyHz, startAt);
    envelope.gain.setValueAtTime(0, startAt);
    envelope.gain.linearRampToValueAtTime(0.16, startAt + 0.012);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(startAt);
  } catch {
    if (activeInput === pressed) {
      playStatus.textContent = "A nota foi gravada, mas o som não iniciou. Confira o volume e tente novamente.";
    }
  }
}

function stopHeldVoice(voice) {
  if (!voice) return;
  const { context, oscillator, gain, startAt } = voice;
  if (context.state !== "running") {
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setValueAtTime(0, context.currentTime);
    try {
      oscillator.stop();
    } catch {
      // A voz pode terminar entre a perda de foco e o encerramento imediato.
    }
    return;
  }
  const releaseAt = Math.max(context.currentTime + 0.012, startAt);
  gain.gain.cancelScheduledValues(releaseAt);
  gain.gain.setValueAtTime(0.16, releaseAt);
  gain.gain.linearRampToValueAtTime(0, releaseAt + 0.01);
  try {
    oscillator.stop(releaseAt + 0.013);
  } catch {
    // A voz pode terminar entre o evento de soltura e o agendamento do encerramento.
  }
}

function finishActiveNote() {
  const pressed = activeInput;
  if (!pressed) return;

  activeInput = null;
  pressed.button.classList.remove("is-playing");
  stopHeldVoice(pressed.voice);

  const durationMs = Math.max(0, performance.now() - pressed.startedAt);
  recordedEvents.push({
    note: pressed.note,
    startMs: pressed.startMs,
    durationMs,
  });
  renderMelody();
  playStatus.textContent = `${pressed.note.name} gravada por ${formatDuration(durationMs)}.`;
}

function finishInput(type, id) {
  if (activeInput?.type === type && activeInput.id === id) finishActiveNote();
}

function startRecording() {
  if (recordingActive) return;
  stopPlayback();
  recordingActive = true;
  recordingStartedAt = null;
  pressedKeyboardCodes.clear();
  closeRecordConfirmation();
  renderMelody();
  playStatus.textContent = "Gravação pronta. Toque ou segure uma nota para começar.";
  try {
    const context = getAudioContext();
    if (context.state !== "running") {
      context.resume().catch(() => {
        if (recordingActive) playStatus.textContent = "O áudio não iniciou. Confira o volume e tente tocar uma nota.";
      });
    }
  } catch {
    playStatus.textContent = "Este navegador não oferece áudio. A gravação não pode começar.";
    recordingActive = false;
    renderMelody();
  }
}

function stopRecording(message = "Gravação encerrada.") {
  if (!recordingActive) return;
  finishActiveNote();
  recordingActive = false;
  recordingStartedAt = null;
  pressedKeyboardCodes.clear();
  renderMelody();
  playStatus.textContent = recordedEvents.length > 0
    ? `${message} ${recordedEvents.length} ${recordedEvents.length === 1 ? "nota pronta" : "notas prontas"} para ouvir.`
    : "Gravação encerrada sem notas. Toque em Gravar para tentar de novo.";
}

function askForRecordAction(action) {
  if (recordingActive) return;
  stopPlayback();
  pendingRecordAction = action;
  recordConfirmationMessage.textContent = action === "replace"
    ? "Apagar a gravação atual e começar outra?"
    : "Apagar esta gravação?";
  confirmRecordActionButton.textContent = action === "replace" ? "Apagar e gravar" : "Apagar gravação";
  recordConfirmation.hidden = false;
  confirmRecordActionButton.focus();
  playStatus.textContent = action === "replace"
    ? "A gravação atual está guardada até você confirmar a troca."
    : "A gravação está guardada até você confirmar a exclusão.";
}

function confirmRecordAction() {
  const action = pendingRecordAction;
  closeRecordConfirmation();
  if (action === "replace") {
    recordedEvents = [];
    recordingWasPlayed = false;
    startRecording();
    return;
  }
  if (action === "clear") {
    recordedEvents = [];
    recordingWasPlayed = false;
    renderMelody();
    recordButton.focus();
    playStatus.textContent = "Gravação apagada. Toque em Gravar para criar outra.";
  }
}

function cancelRecordAction() {
  closeRecordConfirmation();
  recordClearButton.focus();
  playStatus.textContent = "Gravação mantida.";
}

function scheduleRecordedNote(playback, event, startAt) {
  const context = getAudioContext();
  const durationSeconds = event.durationMs / 1000;
  const finishAt = startAt + durationSeconds;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const voice = { oscillator, gain: envelope };
  const attack = Math.min(0.012, durationSeconds / 3);
  const release = Math.min(0.018, durationSeconds / 3);

  playback.voices.add(voice);
  oscillator.onended = () => playback.voices.delete(voice);
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(event.note.frequencyHz, startAt);
  envelope.gain.setValueAtTime(0, startAt);
  envelope.gain.linearRampToValueAtTime(0.16, startAt + attack);
  envelope.gain.setValueAtTime(0.16, Math.max(startAt + attack, finishAt - release));
  envelope.gain.linearRampToValueAtTime(0, finishAt);
  oscillator.connect(envelope);
  envelope.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(finishAt);
}

function scheduleNextPlaybackBoundary(playback) {
  if (activePlayback !== playback || playback.isPaused) return;

  const elapsedMs = playbackPositionMs(playback);
  if (elapsedMs >= playback.totalDurationMs) {
    renderRecordingPlayback(playback);
    return;
  }

  const nextBoundaryMs = playback.boundaries.find((boundaryMs) => boundaryMs > elapsedMs + 1);
  const targetMs = nextBoundaryMs ?? playback.totalDurationMs;
  const targetTime = playback.startAt + targetMs / 1000;
  const delayMs = Math.max(0, (targetTime - audioContext.currentTime) * 1000) + 5;
  playback.timer = window.setTimeout(() => {
    playback.timer = null;
    if (activePlayback !== playback) return;
    renderRecordingPlayback(playback);
    scheduleNextPlaybackBoundary(playback);
  }, delayMs);
}

async function playRecording() {
  stopPlayback({ keepRecordingOverlay: true });
  if (recordedEvents.length === 0 || recordingActive) return;

  const sequence = recordedEvents.map((event) => ({ ...event }));
  const playback = {
    kind: "recording",
    voices: new Set(),
    timers: new Set(),
    timer: null,
    sequence,
    startAt: null,
    isPaused: false,
    pausedPositionMs: null,
    boundaries: [],
    totalDurationMs: 0,
  };
  activePlayback = playback;
  buildPlaybackSequence(sequence);
  playbackNoteName.textContent = "Preparando…";
  playbackNoteHint.textContent = "A sequência vai começar.";
  playbackProgressLabel.textContent = `Preparando · ${sequence.length} eventos`;
  playbackPauseButton.textContent = "Pausar";
  playbackPauseButton.disabled = true;
  hideFingering();
  if (!playbackOverlay.open) playbackOverlay.showModal();
  playStatus.textContent = "Preparando sua música…";

  try {
    const context = getAudioContext();
    if (context.state !== "running") {
      await context.resume();
    }
    if (activePlayback !== playback) return;

    playback.startAt = context.currentTime + 0.04;
    const boundarySet = new Set();
    for (const event of sequence) {
      const eventStartAt = playback.startAt + event.startMs / 1000;
      scheduleRecordedNote(playback, event, eventStartAt);
      boundarySet.add(event.startMs);
      boundarySet.add(event.startMs + event.durationMs);
    }
    const lastEvent = sequence.at(-1);
    playback.totalDurationMs = lastEvent.startMs + lastEvent.durationMs;
    playback.boundaries = [...boundarySet].sort((first, second) => first - second);
    renderRecordingPlayback(playback);
    scheduleNextPlaybackBoundary(playback);
  } catch {
    if (activePlayback !== playback) return;
    stopPlayback({ keepRecordingOverlay: true });
    playbackNoteName.textContent = "Não foi possível tocar";
    playbackNoteHint.textContent = "Confira o volume e tente ouvir a gravação de novo.";
    playbackProgressLabel.textContent = "Reprodução não iniciada";
    playbackPauseButton.disabled = true;
    hideFingering();
    playStatus.textContent = "O som não iniciou. Confira o volume e toque em Ouvir minha música.";
  }
}

async function toggleRecordingPlayback() {
  const playback = activePlayback;
  if (playback?.kind !== "recording" || playback.startAt === null) return;

  if (!playback.isPaused) {
    if (playback.timer !== null) {
      window.clearTimeout(playback.timer);
      playback.timer = null;
    }
    playback.isPaused = true;
    playback.pausedPositionMs = playbackPositionMs(playback, false);
    renderRecordingPlayback(playback);

    try {
      if (audioContext.state === "running") await audioContext.suspend();
      if (activePlayback !== playback) return;
      playback.pausedPositionMs = playbackPositionMs(playback, false);
      renderRecordingPlayback(playback);
    } catch {
      if (activePlayback !== playback) return;
      playback.isPaused = false;
      playback.pausedPositionMs = null;
      renderRecordingPlayback(playback);
      scheduleNextPlaybackBoundary(playback);
      playbackNoteHint.textContent = "Não foi possível pausar o áudio. A reprodução continua.";
    }
    return;
  }

  try {
    if (audioContext.state !== "running") await audioContext.resume();
    if (activePlayback !== playback) return;
    playback.isPaused = false;
    playback.pausedPositionMs = null;
    renderRecordingPlayback(playback);
    scheduleNextPlaybackBoundary(playback);
  } catch {
    if (activePlayback !== playback) return;
    playbackNoteHint.textContent = "Não foi possível continuar o áudio. Tente ouvir de novo.";
  }
}

function setMode(nextMode) {
  if (mode === nextMode) return;
  stopPlayback();
  if (recordingActive) stopRecording("Gravação encerrada ao trocar de modo.");
  closeClearConfirmation();
  closeRecordConfirmation();
  mode = nextMode;
  const recordingMode = mode === "record";
  chooseModeButton.classList.toggle("is-selected", !recordingMode);
  chooseModeButton.setAttribute("aria-pressed", String(!recordingMode));
  recordModeButton.classList.toggle("is-selected", recordingMode);
  recordModeButton.setAttribute("aria-pressed", String(recordingMode));
  chooseControls.hidden = recordingMode;
  recordControls.hidden = !recordingMode;
  renderMelody();
  playStatus.textContent = recordingMode
    ? "Toque em Gravar para começar."
    : "Escolha uma nota para começar sua melodia.";
}

function handleLostFocus() {
  const hadPlayback = activePlayback !== null;
  if (activeInput) finishActiveNote();
  if (recordingActive) stopRecording("Gravação encerrada quando a janela perdeu o foco.");
  pressedKeyboardCodes.clear();
  stopPlayback();
  if (hadPlayback && !recordingActive) playStatus.textContent = "Som interrompido quando a janela perdeu o foco.";
}

replayButton.addEventListener("click", () => {
  closeClearConfirmation();
  startPlayback();
});
undoButton.addEventListener("click", undoLastNote);
clearButton.addEventListener("click", askToClearMelody);
confirmClearButton.addEventListener("click", clearMelody);
cancelClearButton.addEventListener("click", () => {
  closeClearConfirmation();
  clearButton.focus();
  playStatus.textContent = "Melodia mantida. Toque em Ouvir para escutá-la.";
});
chooseModeButton.addEventListener("click", () => setMode("choose"));
recordModeButton.addEventListener("click", () => setMode("record"));
recordButton.addEventListener("click", () => {
  if (recordingActive) {
    stopRecording();
  } else if (recordedEvents.length > 0) {
    askForRecordAction("replace");
  } else {
    startRecording();
  }
});
recordPlayButton.addEventListener("click", playRecording);
recordClearButton.addEventListener("click", () => askForRecordAction("clear"));
confirmRecordActionButton.addEventListener("click", confirmRecordAction);
cancelRecordActionButton.addEventListener("click", cancelRecordAction);
playbackPauseButton.addEventListener("click", toggleRecordingPlayback);
playbackReplayButton.addEventListener("click", playRecording);
playbackCloseIconButton.addEventListener("click", () => playbackOverlay.close());
playbackCloseButton.addEventListener("click", () => playbackOverlay.close());
playbackOverlay.addEventListener("click", (event) => {
  if (event.target === playbackOverlay) playbackOverlay.close();
});
playbackOverlay.addEventListener("close", () => {
  if (activePlayback?.kind === "recording") {
    stopPlayback({ keepRecordingOverlay: true });
  }
  playbackSequence.replaceChildren();
  playbackProgressLabel.textContent = "Reprodução encerrada.";
  playbackNoteName.textContent = "Preparando…";
  playbackNoteHint.textContent = "A sequência vai começar.";
  playbackPauseButton.textContent = "Pausar";
  playbackPauseButton.disabled = false;
  hideFingering();
  renderMelody();
  playStatus.textContent = "Reprodução interrompida.";
  recordPlayButton.focus();
});

window.addEventListener("keydown", (event) => {
  if (mode !== "record" || !recordingActive || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const note = KEYBOARD_NOTES.get(event.code);
  if (!note) return;
  const target = event.target;
  if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable='true']")) return;
  if (target instanceof HTMLButtonElement && !target.classList.contains("note-button")) return;
  event.preventDefault();
  if (pressedKeyboardCodes.has(event.code)) return;
  pressedKeyboardCodes.add(event.code);
  const button = buttonContainer.querySelector(`[data-keyboard-code="${event.code}"]`);
  if (button) beginNote(note, { type: "keyboard", id: event.code, button });
});

window.addEventListener("keyup", (event) => {
  pressedKeyboardCodes.delete(event.code);
  finishInput("keyboard", event.code);
  finishInput("button-key", event.code);
});

window.addEventListener("pointerup", (event) => finishInput("pointer", event.pointerId));
window.addEventListener("pointercancel", (event) => finishInput("pointer", event.pointerId));
window.addEventListener("blur", handleLostFocus);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) handleLostFocus();
});

  for (const note of notes) {
  buttonContainer.append(createNoteButton(note));
}
renderMelody();
