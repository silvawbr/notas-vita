// Ajuste os exemplos e suas frequências somente neste array.
const notes = [
  { name: "Dó 5", frequencyHz: 523.25, color: "#ffd7c4" },
  { name: "Ré 5", frequencyHz: 587.33, color: "#ffe5a8" },
  { name: "Mi 5", frequencyHz: 659.25, color: "#c6edce" },
  { name: "Fá 5", frequencyHz: 698.46, color: "#b7e9e4" },
  { name: "Sol 5", frequencyHz: 783.99, color: "#c1daf8" },
  { name: "Lá 5", frequencyHz: 880, color: "#dfcbf4" },
  { name: "Si 5", frequencyHz: 987.77, color: "#f3c7d2" },
];

const buttonContainer = document.querySelector("#note-buttons");
const playStatus = document.querySelector("#play-status");
const frequencyFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const activeTimers = new WeakMap();
let audioContext;

function createNoteButton(note) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "note-button";
  button.style.setProperty("--note-color", note.color);
  button.setAttribute("aria-label", `Tocar ${note.name}, ${frequencyFormatter.format(note.frequencyHz)} Hz`);

  const name = document.createElement("span");
  name.className = "note-name";
  name.textContent = note.name;

  const detail = document.createElement("span");
  detail.className = "note-detail";
  detail.textContent = `${frequencyFormatter.format(note.frequencyHz)} Hz`;
  button.append(name, detail);

  button.addEventListener("click", () => {
    const previousTimer = activeTimers.get(button);
    if (previousTimer !== undefined) {
      window.clearTimeout(previousTimer);
    }

    button.classList.add("is-playing");
    const timer = window.setTimeout(() => {
      button.classList.remove("is-playing");
      activeTimers.delete(button);
    }, 360);
    activeTimers.set(button, timer);
    playStatus.textContent = `Você ouviu ${note.name}. Toque de novo para repetir.`;
    playNote(note);
  });

  return button;
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

async function playNote(note) {
  try {
    const context = getAudioContext();

    // A criação e a retomada acontecem em resposta ao toque/clique da pessoa.
    if (context.state !== "running") {
      await context.resume();
    }

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const startAt = context.currentTime;
    const releaseStart = startAt + 0.23;
    const finishAt = startAt + 0.34;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(note.frequencyHz, startAt);
    envelope.gain.setValueAtTime(0, startAt);
    envelope.gain.setTargetAtTime(0.16, startAt, 0.008);
    envelope.gain.setValueAtTime(0.16, releaseStart);
    envelope.gain.setTargetAtTime(0, releaseStart, 0.025);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(finishAt + 0.01);
  } catch {
    playStatus.textContent = "O som não iniciou. Confira o volume e toque na nota novamente.";
  }
}

for (const note of notes) {
  buttonContainer.append(createNoteButton(note));
}
