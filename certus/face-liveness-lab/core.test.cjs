'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('./core.js');

function points() {
  const p = Array.from({ length: 68 }, (_, i) => ({ x: i, y: 0 }));
  // Two open, symmetric eyes with EAR 0.25 and outer corners at x=0 and x=10.
  p[36]={x:0,y:0}; p[37]={x:1,y:-0.5}; p[38]={x:3,y:-0.5};
  p[39]={x:4,y:0}; p[40]={x:3,y:0.5}; p[41]={x:1,y:0.5};
  p[42]={x:6,y:0}; p[43]={x:7,y:-0.5}; p[44]={x:9,y:-0.5};
  p[45]={x:10,y:0}; p[46]={x:9,y:0.5}; p[47]={x:7,y:0.5};
  p[30] = {x:5,y:0};
  return p;
}

test('eye openness uses both landmark eye shapes', () => {
  assert.equal(core.averageEyeAspectRatio(points()), 0.25);
});

test('nose offset is normalized to eye span and turn side is directional', () => {
  const p = points();
  p[30] = {x:4,y:0};
  const left = core.noseOffset(p);
  assert.equal(left, -0.1);
  assert.equal(core.isTurnDetected(left, 'esquerda'), true);
  assert.equal(core.isTurnDetected(left, 'direita'), false);
});

test('challenge set has one blink and one unpredictable turn direction/order', () => {
  const seq = core.createChallengeSequence(() => 0.1);
  assert.deepEqual(seq, [{type:'turn',side:'esquerda'},{type:'blink'}]);
  assert.equal(seq.filter(x => x.type === 'blink').length, 1);
  assert.equal(seq.filter(x => x.type === 'turn').length, 1);
});

test('only one sufficiently large and confident face is accepted', () => {
  const face = {detection:{score:0.8,box:{width:140}}};
  assert.equal(core.isOneGoodFace([face], 640), true);
  assert.equal(core.isOneGoodFace([], 640), false);
  assert.equal(core.isOneGoodFace([face, face], 640), false);
  assert.equal(core.isOneGoodFace([{detection:{score:0.5,box:{width:140}}}], 640), false);
  assert.equal(core.isOneGoodFace([{detection:{score:0.8,box:{width:40}}}], 640), false);
});
