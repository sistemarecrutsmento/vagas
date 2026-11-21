(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CertusFaceLivenessCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function median(values) {
    const valid = Array.isArray(values) ? values.filter(Number.isFinite).sort((a, b) => a - b) : [];
    if (!valid.length) return NaN;
    const mid = Math.floor(valid.length / 2);
    return valid.length % 2 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
  }

  function categoryScore(categories, name) {
    if (!Array.isArray(categories)) return NaN;
    const found = categories.find(item => item && item.categoryName === name);
    const value = found && Number(found.score);
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : NaN;
  }

  function eyeBlinkScores(categories) {
    return {
      left: categoryScore(categories, 'eyeBlinkLeft'),
      right: categoryScore(categories, 'eyeBlinkRight')
    };
  }

  function noseOffset(landmarks) {
    if (!Array.isArray(landmarks) || !landmarks[1] || !landmarks[33] || !landmarks[263]) return NaN;
    const eyeSpan = Math.abs(landmarks[263].x - landmarks[33].x);
    if (!Number.isFinite(eyeSpan) || eyeSpan <= 0) return NaN;
    return (landmarks[1].x - (landmarks[33].x + landmarks[263].x) / 2) / eyeSpan;
  }

  function faceBounds(landmarks) {
    if (!Array.isArray(landmarks) || landmarks.length < 100) return null;
    const xs = landmarks.map(point => point && Number(point.x)).filter(Number.isFinite);
    const ys = landmarks.map(point => point && Number(point.y)).filter(Number.isFinite);
    if (xs.length < 100 || ys.length < 100) return null;
    const left = Math.min(...xs), right = Math.max(...xs);
    const top = Math.min(...ys), bottom = Math.max(...ys);
    return { left, right, top, bottom, width: right - left, height: bottom - top,
      centerX: (left + right) / 2, centerY: (top + bottom) / 2 };
  }

  function isFaceWellFramed(landmarks) {
    const box = faceBounds(landmarks);
    return Boolean(box && box.width >= 0.16 && box.height >= 0.18 && box.width <= 0.94 && box.height <= 0.96 && box.centerX >= 0.08 && box.centerX <= 0.92 && box.centerY >= 0.08 && box.centerY <= 0.92);
  }

  function isBlinkClosed(scores, baseline, margin = 0.24, floor = 0.48) {
    if (!scores || !baseline || !Number.isFinite(scores.left) || !Number.isFinite(scores.right) || !Number.isFinite(baseline.left) || !Number.isFinite(baseline.right)) return false;
    return scores.left >= Math.max(floor, baseline.left + margin) && scores.right >= Math.max(floor, baseline.right + margin);
  }

  function isEyesReopened(scores, baseline, margin = 0.16, cap = 0.5) {
    if (!scores || !baseline || !Number.isFinite(scores.left) || !Number.isFinite(scores.right) || !Number.isFinite(baseline.left) || !Number.isFinite(baseline.right)) return false;
    return scores.left <= Math.min(cap, baseline.left + margin) && scores.right <= Math.min(cap, baseline.right + margin);
  }

  function hasTurnedFrom(offset, baseline, threshold = 0.075) {
    return Number.isFinite(offset) && Number.isFinite(baseline) && Math.abs(offset - baseline) >= threshold;
  }

  function hasReturnedTo(offset, baseline, tolerance = 0.055) {
    return Number.isFinite(offset) && Number.isFinite(baseline) && Math.abs(offset - baseline) <= tolerance;
  }

  function createChallengeSequence(random = Math.random) {
    return random() < 0.5 ? [{ type: 'blink' }, { type: 'turn' }] : [{ type: 'turn' }, { type: 'blink' }];
  }

  function runSelfTests() {
    const results = [];
    const check = (name, condition) => results.push({ name, pass: Boolean(condition) });
    const eyeScores = eyeBlinkScores([
      { categoryName: 'eyeBlinkLeft', score: 0.08 },
      { categoryName: 'eyeBlinkRight', score: 0.1 }
    ]);
    check('blendshapes dos dois olhos', eyeScores.left === 0.08 && eyeScores.right === 0.1);
    check('fechamento bilateral', isBlinkClosed({ left: 0.7, right: 0.72 }, eyeScores));
    check('reabertura bilateral', isEyesReopened({ left: 0.1, right: 0.12 }, eyeScores));
    const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    points[1] = { x: 0.54, y: 0.5, z: 0 };
    points[33] = { x: 0.3, y: 0.35, z: 0 };
    points[263] = { x: 0.7, y: 0.35, z: 0 };
    points[10] = { x: 0.5, y: 0.15, z: 0 };
    points[152] = { x: 0.5, y: 0.85, z: 0 };
    points[234] = { x: 0.2, y: 0.5, z: 0 };
    points[454] = { x: 0.8, y: 0.5, z: 0 };
    check('enquadramento sintético', isFaceWellFramed(points));
    check('normalização da pose', Math.abs(noseOffset(points) - 0.1) < 1e-9);
    check('retorno à posição inicial', hasReturnedTo(0.12, 0.1, 0.03));
    const blinkFirst = createChallengeSequence(() => 0.1).map(item => item.type).join(',');
    const turnFirst = createChallengeSequence(() => 0.9).map(item => item.type).join(',');
    check('duas ordens do desafio', blinkFirst === 'blink,turn' && turnFirst === 'turn,blink');
    return results;
  }

  return { median, categoryScore, eyeBlinkScores, noseOffset, faceBounds, isFaceWellFramed, isBlinkClosed, isEyesReopened, hasTurnedFrom, hasReturnedTo, createChallengeSequence, runSelfTests };
});
