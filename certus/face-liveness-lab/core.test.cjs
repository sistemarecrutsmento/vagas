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

test('challenge order changes while each challenge appears exactly once', () => {
  const firstBlink = core.createChallengeSequence(()=>.1);
  const firstTurn = core.createChallengeSequence(()=>.9);
  assert.deepEqual(firstBlink.map(x=>x.type),['blink','turn']);
  assert.deepEqual(firstTurn.map(x=>x.type),['turn','blink']);
});
