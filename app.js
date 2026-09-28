// Ajuste os exemplos e suas frequências somente neste array.
const notes = [
  { name: "Sol 5", frequencyHz: 783.99, color: "#c1daf8" },
  { name: "Lá 5", frequencyHz: 880, color: "#dfcbf4" },
  { name: "Si 5", frequencyHz: 987.77, color: "#f3c7d2" },
  { name: "Dó 6", frequencyHz: 1046.50, color: "#ffd7c4" },
  { name: "Ré 6", frequencyHz: 1174.66, color: "#ffe5a8" },
];

const buttonContainer = document.querySelector("#note-buttons");
const melodyList = document.querySelector("#melody-list");
const melodyEmpty = document.querySelector("#melody-empty");
const melodyCount = document.querySelector("#melody-count");
const playStatus = document.querySelector("#play-status");
const replayButton = document.querySelector("#replay-button");
const undoButton = document.querySelector("#undo-button");
const clearButton = document.querySelector("#clear-button");
const clearConfirmation = document.querySelector("#clear-confirmation");
const confirmClearButton = document.querySelector("#confirm-clear-button");
const cancelClearButton = document.querySelector("#cancel-clear-button");
const frequencyFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const NOTE_INTERVAL_MS = 430;
const NOTE_DURATION_SECONDS = 0.32;

let audioContext;
let melody = [];
let activePlayback = null;

function createNoteButton(note) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "note-button";
  button.style.setProperty("--note-color", note.color);
  button.setAttribute(
    "aria-label",
    `Adicionar ${note.name}, ${frequencyFormatter.format(note.frequencyHz)} Hz à melodia e ouvir a nota`,
  );

  const name = document.createElement("span");
  name.className = "note-name";
  name.textContent = note.name;

  const detail = document.createElement("span");
  detail.className = "note-detail";
  detail.textContent = `${frequencyFormatter.format(note.frequencyHz)} Hz`;
  button.append(name, detail);

  button.addEventListener("click", () => addNote(note, button));
  return button;
}

function renderMelody(currentIndex = -1) {
  melodyList.replaceChildren();
  melodyEmpty.hidden = melody.length > 0;
  melodyCount.textContent = `(${melody.length} ${melody.length === 1 ? "nota" : "notas"})`;
  replayButton.disabled = melody.length === 0;
  undoButton.disabled = melody.length === 0;
  clearButton.disabled = melody.length === 0;

  melody.forEach((note, index) => {
    const item = document.createElement("li");
    item.className = "melody-item";
    item.style.setProperty("--note-color", note.color);

    const order = document.createElement("span");
    order.className = "melody-order";
    order.textContent = String(index + 1);

    const swatch = document.createElement("span");
    swatch.className = "melody-swatch";
    swatch.setAttribute("aria-hidden", "true");

    const name = document.createElement("span");
    name.className = "melody-name";
    name.textContent = note.name;

    item.append(order, swatch, name);
    item.setAttribute("aria-label", `Nota ${index + 1}: ${note.name}`);
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
}

function closeClearConfirmation() {
  clearConfirmation.hidden = true;
  clearButton.hidden = false;
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

function stopPlayback() {
  const playback = activePlayback;
  if (!playback) return;

  activePlayback = null;
  playback.button?.classList.remove("is-playing");
  if (playback.timer !== null) {
    window.clearTimeout(playback.timer);
    playback.timer = null;
  }
  const resolveWait = playback.resolveWait;
  playback.resolveWait = null;
  resolveWait?.();

  const stopAt = audioContext?.currentTime ?? 0;
  for (const voice of playback.voices) {
    voice.gain.gain.cancelScheduledValues(stopAt);
    if (audioContext?.state === "running") {
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, stopAt);
      voice.gain.gain.linearRampToValueAtTime(0, stopAt + 0.01);
    } else {
      voice.gain.gain.setValueAtTime(0, stopAt);
    }
    try {
      if (audioContext?.state === "running") {
        voice.oscillator.stop(stopAt + 0.015);
      } else {
        voice.oscillator.stop();
      }
    } catch {
      // A voz já pode ter terminado entre a interação e o cancelamento.
    }
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

for (const note of notes) {
  buttonContainer.append(createNoteButton(note));
}
renderMelody();
