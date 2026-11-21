(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CertusFaceLivenessCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const EYE_LEFT = [36, 37, 38, 39, 40, 41];
  const EYE_RIGHT = [42, 43, 44, 45, 46, 47];
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function eyeAspectRatio(points, indices) {
    if (!Array.isArray(points) || indices.some(i => !points[i])) return NaN;
    const p = indices.map(i => points[i]);
    const width = distance(p[0], p[3]);
    if (!Number.isFinite(width) || width <= 0) return NaN;
    return (distance(p[1], p[5]) + distance(p[2], p[4])) / (2 * width);
  }

  function averageEyeAspectRatio(points) {
    const a = eyeAspectRatio(points, EYE_LEFT);
    const b = eyeAspectRatio(points, EYE_RIGHT);
    return Number.isFinite(a) && Number.isFinite(b) ? (a + b) / 2 : NaN;
  }

  function noseOffset(points) {
    if (!Array.isArray(points) || !points[30] || !points[36] || !points[45]) return NaN;
    const span = Math.abs(points[45].x - points[36].x);
    if (!Number.isFinite(span) || span <= 0) return NaN;
    const eyeCenter = (points[36].x + points[45].x) / 2;
    return (points[30].x - eyeCenter) / span;
  }

  function isTurnDetected(offset, side, threshold = 0.075) {
    if (!Number.isFinite(offset)) return false;
    return side === 'esquerda' ? offset <= -threshold : side === 'direita' && offset >= threshold;
  }

  function createChallengeSequence(random = Math.random) {
    const turn = random() < 0.5 ? 'esquerda' : 'direita';
    const first = random() < 0.5 ? 'blink' : 'turn';
    return first === 'blink' ? [{ type: 'blink' }, { type: 'turn', side: turn }] : [{ type: 'turn', side: turn }, { type: 'blink' }];
  }

  function isOneGoodFace(detections, videoWidth) {
    if (!Array.isArray(detections) || detections.length !== 1) return false;
    const d = detections[0];
    const box = d && d.detection && d.detection.box;
    return Boolean(box && Number(d.detection.score) >= 0.70 && Number(videoWidth) > 0 && box.width / videoWidth >= 0.18);
  }

  return { eyeAspectRatio, averageEyeAspectRatio, noseOffset, isTurnDetected, createChallengeSequence, isOneGoodFace };
});
