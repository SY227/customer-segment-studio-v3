#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const css = fs.readFileSync('app/atelier.css','utf8');
let passed = 0;
const check=(label,fn)=>{fn();passed++;console.log(`PASS ${label}`)};
check('desktop two-column layout no longer stretches sibling heights',()=>{
  assert(/\.board-middle\s*\{[^}]*align-items:\s*start;/s.test(css));
});
check('hall panel opts out of sibling height stretching',()=>{
  assert(/\.hall-panel\s*\{[^}]*align-self:\s*start;/s.test(css));
});
check('desktop 3D viewport has fixed responsive height',()=>{
  assert(/\.guild-canvas-shell\s*\{[^}]*height:\s*570px;[^}]*min-height:\s*570px;[^}]*flex:\s*0 0 auto;/s.test(css));
});
check('wide-screen 3D viewport height is explicit',()=>assert(css.includes('height: 580px; min-height: 580px;')));
check('mid-size 3D viewport height is explicit',()=>assert(css.includes('height: 560px; min-height: 560px;')));
check('stacked-tablet 3D viewport height is explicit',()=>assert(css.includes('height: 510px; min-height: 510px; flex: 0 0 auto;')));
check('mobile 3D viewport height is explicit',()=>assert(css.includes('height: 370px; min-height: 370px;')));
console.log(`\n${passed} persistent-hall layout checks passed.`);
