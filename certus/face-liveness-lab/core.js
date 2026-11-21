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

  return { median, categoryScore, eyeBlinkScores, noseOffset, faceBounds, isFaceWellFramed, isBlinkClosed, isEyesReopened, hasTurnedFrom, hasReturnedTo, createChallengeSequence };
});
