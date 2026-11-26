'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'operacao.js'), 'utf8');

test('12x36 schedule end time is derived from the 12-hour shift, including overnight shifts', () => {
  const start = source.indexOf('function schedule12x36End(');
  assert.ok(start >= 0, 'schedule12x36End helper exists');
  const bodyStart = source.indexOf('{', start);
  let depth = 0, end = -1;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  assert.ok(end > start, 'complete helper function found');
  const getEnd = vm.runInNewContext(`(${source.slice(start, end)})`);
  assert.equal(getEnd('08:00', 720), '20:00');
  assert.equal(getEnd('20:00', 720), '08:00');
  assert.equal(getEnd('not-a-time', 720), '');
});

test('12x36 schedules display the cycle, shift times, interval duration and rotating rest', () => {
  assert.match(source, /template_type==='12x36'\?'12h de plantão · 36h de descanso'/);
  assert.match(source, /schedule12x36End\(x\.rules\?\.cycle_anchor_start\|\|''/);
  assert.match(source, /'36h por ciclo'/);
  assert.match(source, /' \(horário não fixado\)'/);
});

test('editing a 12x36 schedule opens the 12x36 editor, not the weekday editor', () => {
  assert.match(source, /if\(schedule\?\.rules\?\.template_type==='12x36'\)schedule12x36Form\(schedule\);else scheduleForm\(schedule\)/);
});

test('12x36 editor accepts a known break duration without inventing fixed break times', () => {
  assert.match(source, /Intervalo dentro do plantão \(minutos; horário fixo opcional\)/);
  assert.match(source, /Início do intervalo \(opcional, se houver horário fixo\)/);
  assert.match(source, /Boolean\(payload\.break_start\)!==Boolean\(payload\.break_end\)/);
  assert.doesNotMatch(source, /name="break_start" type="time"[^>]*required/);
  assert.doesNotMatch(source, /name="break_end" type="time"[^>]*required/);
});
