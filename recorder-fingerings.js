// Four-hole layout from Marina's activity: hole 0 is the rear thumb hole;
// holes 1–3 are the front holes. The note patterns follow the worksheet diagrams.
window.RECORDER_FINGERINGS = Object.freeze({
  holes: Object.freeze([0, 1, 2, 3]),
  notes: Object.freeze({
    "Sol 5": Object.freeze({ closed: Object.freeze([0, 1, 2, 3]), quarterOpen: Object.freeze([]) }),
    "Lá 5": Object.freeze({ closed: Object.freeze([0, 1, 2]), quarterOpen: Object.freeze([]) }),
    "Si 5": Object.freeze({ closed: Object.freeze([0, 1]), quarterOpen: Object.freeze([]) }),
    "Dó 6": Object.freeze({ closed: Object.freeze([0, 2]), quarterOpen: Object.freeze([]) }),
    "Ré 6": Object.freeze({ closed: Object.freeze([2]), quarterOpen: Object.freeze([]) }),
  }),
});
