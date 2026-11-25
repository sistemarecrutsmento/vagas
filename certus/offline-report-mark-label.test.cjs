'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ui=fs.readFileSync('certus/operacao.js','utf8');

test('management timesheet row renders a pending shared-terminal mark with unconfirmed-time label',()=>{
 assert.match(ui,/m\.validationStatus==='pending'&&\(m\.source==='shared_terminal'\|\|m\.metadata\?\.offline_time_unverified===true\)\?' \(Offline — horário não confirmado\)'/);
});

test('selected day detail explicitly labels a pending offline mark',()=>{
 assert.match(ui,/— Offline; horário não confirmado/);
});
