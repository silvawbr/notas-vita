// Yamaha's soprano recorder chart, German system. Hole 0 is the rear thumb hole;
// holes 1–7 are on the front. A value of 0.25 means one quarter of the hole is open.
window.RECORDER_FINGERINGS = Object.freeze({
  "Sol 5": Object.freeze({ closed: Object.freeze([0, 1, 2, 3]), quarterOpen: Object.freeze([]) }),
  "Lá 5": Object.freeze({ closed: Object.freeze([0, 1, 2]), quarterOpen: Object.freeze([]) }),
  "Si 5": Object.freeze({ closed: Object.freeze([0, 1]), quarterOpen: Object.freeze([]) }),
  "Dó 6": Object.freeze({ closed: Object.freeze([1, 4, 5]), quarterOpen: Object.freeze([0]) }),
  "Ré 6": Object.freeze({ closed: Object.freeze([1, 3, 4, 6]), quarterOpen: Object.freeze([0]) }),
});
