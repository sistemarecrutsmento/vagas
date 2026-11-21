'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('./core.js');

test('MediaPipe blink blendshapes are read by eye and clamped', () => {
  assert.deepEqual(core.eyeBlinkScores([
    { categoryName: 'eyeBlinkLeft', score: 0.21 },
    { categoryName: 'eyeBlinkRight', score: 0.38 }
  ]), { left: 0.21, right: 0.38 });
  assert.equal(core.categoryScore([{categoryName:'eyeBlinkLeft',score:1.4}], 'eyeBlinkLeft'), 1);
  assert.ok(Number.isNaN(core.categoryScore([], 'eyeBlinkLeft')));
});

test('blink needs bilateral closure and a reopened pair of eyes', () => {
  const baseline = {left:0.08,right:0.11};
  assert.equal(core.isBlinkClosed({left:0.65,right:0.71}, baseline), true);
  assert.equal(core.isBlinkClosed({left:0.8,right:0.2}, baseline), false);
  assert.equal(core.isEyesReopened({left:0.12,right:0.14}, baseline), true);
  assert.equal(core.isEyesReopened({left:0.75,right:0.14}, baseline), false);
});

test('nose movement is normalized to the MediaPipe eye-corner span', () => {
  const points = Array.from({length:478}, (_,i)=>({x:0.5,y:0.5,z:0}));
  points[33]={x:.3,y:.4,z:0}; points[263]={x:.7,y:.4,z:0}; points[1]={x:.54,y:.55,z:0};
  assert.ok(Math.abs(core.noseOffset(points) - .1) < 1e-9);
  assert.equal(core.hasTurnedFrom(.18,.1,.065), true);
  assert.equal(core.hasReturnedTo(.16,.1,.075), true);
});

test('face framing accepts one sufficiently large centered face and rejects too-small input', () => {
  const points = Array.from({length:478}, (_,i)=>({x:.5,y:.5,z:0}));
  points[33]={x:.3,y:.3,z:0}; points[263]={x:.7,y:.3,z:0};
  points[10]={x:.5,y:.15,z:0}; points[152]={x:.5,y:.85,z:0};
  points[234]={x:.2,y:.5,z:0}; points[454]={x:.8,y:.5,z:0};
  assert.equal(core.isFaceWellFramed(points),true);
  assert.equal(core.isFaceWellFramed([{x:.5,y:.5}]),false);
});

test('challenge sequence contains the original movements and one randomized expression', () => {
  const first = core.createChallengeSequence(()=>.1).map(x=>x.type);
  const second = core.createChallengeSequence(()=>.9).map(x=>x.type);
  for (const types of [first, second]) {
    assert.equal(types.length, 3);
    assert.equal(new Set(types).size, 3);
    assert.ok(types.includes('blink'));
    assert.ok(types.includes('turn'));
    assert.ok(types.includes('mouth') || types.includes('smile'));
  }
  assert.notDeepEqual(first, second);
});

test('mouth and smile gestures require an active and relaxed reading', () => {
  const neutral = { jawOpen: 0.05, smileLeft: 0.04, smileRight: 0.06 };
  assert.deepEqual(core.expressionScores([
    { categoryName: 'jawOpen', score: 0.42 },
    { categoryName: 'mouthSmileLeft', score: 0.31 },
    { categoryName: 'mouthSmileRight', score: 0.27 }
  ]), { jawOpen: 0.42, smileLeft: 0.31, smileRight: 0.27 });
  assert.equal(core.isExpressionActive({ jawOpen: 0.48 }, neutral, 'mouth'), true);
  assert.equal(core.isExpressionRelaxed({ jawOpen: 0.08 }, neutral, 'mouth'), true);
  assert.equal(core.isExpressionActive({ smileLeft: 0.48, smileRight: 0.46 }, neutral, 'smile'), true);
  assert.equal(core.isExpressionRelaxed({ smileLeft: 0.08, smileRight: 0.1 }, neutral, 'smile'), true);
  assert.equal(core.isExpressionActive({ smileLeft: 0.12, smileRight: 0.1 }, neutral, 'smile'), false);
});

test('browser self-checks cover core maths and challenge flow', () => {
  const checks = core.runSelfTests();
  assert.equal(checks.length, 9);
  assert.ok(checks.every(check => check.pass), JSON.stringify(checks));
});
