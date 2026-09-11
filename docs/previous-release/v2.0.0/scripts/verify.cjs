#!/usr/bin/env node
'use strict';
/* Byte preservation, syntax, protected behavior + isolated business tests.
   No network or developer API key is used. Not a substitute for a real build. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const file = p => fs.readFileSync(path.join(root, p));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const baseline = JSON.parse(file('docs/preservation-baseline.json'));
const edits = JSON.parse(file('docs/visual-edit-audit.json'));
let passed = 0;
const check = (label, fn) => { fn(); passed++; console.log(`PASS ${label}`); };
const allowed = new Set(['app/page.tsx', 'app/layout.tsx', 'src/components/SegmentGuildCanvas.tsx']);
for (const [p, item] of Object.entries(baseline.files)) {
  if (allowed.has(p)) continue;
  check(`original bytes: ${p}`, () => assert.equal(sha(file(p)), item.sha256));
}
for (const [p, item] of Object.entries(edits)) {
  check(`recorded presentation edit: ${p}`, () => {
    assert(allowed.has(p));
    assert.equal(sha(file(p)), item.after_sha256);
    assert.equal(baseline.files[p].sha256, item.before_sha256);
  });
}
for (const [label, item] of Object.entries(JSON.parse(file('docs/protected-behavior.json')))) {
  check(`protected executable range: ${label}`, () => {
    const text = file(item.file).toString();
    const from = text.indexOf(item.start), to = text.indexOf(item.end, from);
    assert(from >= 0 && to > from);
    let chunk = text.slice(from, to + (item.include_end ? item.end.length : 0));
    if (item.exclude) chunk = chunk.replace(item.exclude, '');
    assert.equal(sha(chunk), item.sha256);
  });
}
const css = file('app/globals.css').toString() + '\n' + file('app/atelier.css').toString();
check('light palette matches V3 brand tokens', () => {
  for (const token of ['color-scheme: light', '#f7f7f4', '#10131a', '#786cff', '#46aef4', '#54c9c5', '#d7b463']) assert(css.includes(token), token);
  assert(!css.includes('color-scheme: dark'));
});
check('keyboard focus and reduced UI motion present', () => {
  assert(css.includes(':focus-visible')); assert(css.includes('prefers-reduced-motion: reduce'));
});
check('sample dialogs have local overflow handling', () => {
  assert(css.includes('max-height: calc(100dvh')); assert(css.includes('overflow-y: auto'));
});
check('no remote fonts, images, or newly exposed credentials in UI', () => {
  assert(!/@font-face|@import|url\(\s*['"]?https?:/i.test(css));
  assert.equal(file('.env.example').toString().trim(), 'GEMINI_API_KEY=');
});
let modelCount = 0;
for (const p of Object.keys(baseline.files).filter(p => p.endsWith('.glb'))) {
  check(`valid original GLB structure: ${path.basename(p)}`, () => {
    const b = file(p); assert.equal(b.toString('ascii', 0, 4), 'glTF');
    assert.equal(b.readUInt32LE(4), 2); assert.equal(b.readUInt32LE(8), b.length);
    assert.equal(b.readUInt32LE(16), 0x4E4F534A);
    const gltf = JSON.parse(b.toString('utf8', 20, 20 + b.readUInt32LE(12)));
    assert(gltf.meshes?.length > 0); assert(gltf.skins?.length > 0);
    assert(!gltf.buffers?.some(x => x.uri && !x.uri.startsWith('data:')));
    modelCount++;
  });
}
check('all original nine character models present', () => assert.equal(modelCount, 9));
check('source asset references resolve locally', () => {
  const sources = ['src/data/segmentGuildData.ts', 'src/components/SegmentGuildCanvas.tsx', 'src/components/SegmentCardAvatar.tsx'];
  const paths = sources.flatMap(p => [...file(p).toString().matchAll(/["'`](\/assets\/[^"'`]+\.(?:glb|fbx|png))["'`]/g)].map(m => m[1]));
  assert(paths.length > 20);
  for (const p of paths) assert(fs.existsSync(path.join(root, 'public', p)), p);
});
let ts;
try { ts = require(process.env.STUDIO_TYPESCRIPT_PATH || 'typescript'); }
catch { console.error('\nTypeScript is missing. Run npm ci first.'); process.exit(1); }
const sourceFiles = ['app/page.tsx', 'app/layout.tsx', 'app/api/segment-analysis/route.ts', 'src/components/HeaderActionsClient.tsx', 'src/components/SegmentCardAvatar.tsx', 'src/components/SegmentGuildCanvas.tsx', 'src/data/segmentGuildData.ts', 'src/lib/deterministicSegmentAnalysis.ts', 'next.config.ts', 'src/components/AtelierChrome.tsx', 'src/lib/createAtelierScene.ts'];
for (const p of sourceFiles) {
  check(`TypeScript syntax/transpilation: ${p}`, () => {
    const result = ts.transpileModule(file(p).toString(), {fileName:p, reportDiagnostics:true, compilerOptions:{target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.CommonJS, jsx:ts.JsxEmit.ReactJSX, isolatedModules:true}});
    const errors=(result.diagnostics || []).filter(d=>d.category===ts.DiagnosticCategory.Error);
    assert.equal(errors.length,0,ts.formatDiagnosticsWithColorAndContext(errors,{getCanonicalFileName:x=>x,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));
  });
}
const cache = new Map();
const fakeEnv = {}; // Never read a developer's .env or contact a real AI provider.
let providerFetch = async () => { throw new Error('Unexpected network call'); };
function load(p) {
  if (cache.has(p)) return cache.get(p);
  const exports = {};
  cache.set(p, exports);
  const code = ts.transpileModule(file(p).toString(), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const requireIsolated = request => {
    if (request === 'next/server') return {NextResponse:{json:(body, init)=>Response.json(body, init)}};
    if (request.startsWith('@/')) return load('src/'+request.slice(2)+'.ts');
    if (request.startsWith('.')) return load(path.posix.normalize(path.posix.join(path.posix.dirname(p),request))+'.ts');
    throw new Error(`Unsupported isolated dependency: ${request}`);
  };
  vm.runInNewContext(code,{exports,require:requireIsolated,Buffer,Response,Request,AbortController,Error,TypeError,process:{env:fakeEnv},fetch:(...args)=>providerFetch(...args),setTimeout,clearTimeout,console},{filename:p});
  return exports;
}
const data=load('src/data/segmentGuildData.ts');
const core=load('src/lib/deterministicSegmentAnalysis.ts');
const plain = value => JSON.parse(JSON.stringify(value));
check('all nine group labels and default selection unchanged', () => {
  assert.deepEqual(plain(data.SEGMENT_GUILD_DATA.map(x=>x.label)), ['Best Customers','Loyal Buyers','New Buyers','At-Risk VIPs','Growing Buyers','Occasional Buyers','Dormant VIPs','Light Repeaters','Inactive Customers']);
  assert.equal(data.DEFAULT_SEGMENT_KEY, 'Not Recent|High Frequency');
});
check('single customer and same-value ties keep baseline scoring', () => {
  const r = core.analyzeOrdersDeterministically([{customer_uid:'A',purchase_date:'2026-01-02',total:100}]);
  assert.equal(r.totalRevenue,100);assert.equal(r.totalCustomers,1);assert.equal(r.asOfDate,'2026-01-02');
  assert.equal(r.segments.length,9);assert.equal(r.segments.find(x=>x.label==='Growing Buyers').customerCount,1);
});
check('invalid rows do not alter valid totals', () => {
  const r=core.analyzeOrdersDeterministically([{customer_uid:' A ',purchase_date:'2026-01-02',total:100},{customer_uid:'A',purchase_date:'2026-01-03',total:20},{customer_uid:'',purchase_date:'2026-01-01',total:1000},{customer_uid:'B',purchase_date:'invalid',total:10}]);
  assert.equal(r.totalRevenue,120);assert.equal(r.totalCustomers,1);assert.equal(r.asOfDate,'2026-01-03');
});
check('empty dataset still raises a validation error', () => assert.throws(()=>core.analyzeOrdersDeterministically([]), /valid customer_uid/));
check('larger dataset preserves totals and customer coverage', () => {
  const rows=[];for(let i=1;i<=90;i++)for(let j=0;j<(i%8)+1;j++)rows.push({customer_uid:'C'+i,purchase_date:`2026-${String((i%6)+1).padStart(2,'0')}-${String((j%25)+1).padStart(2,'0')}`,total:i*2.5});
  const r=core.analyzeOrdersDeterministically(rows);
  assert.equal(r.totalCustomers,90);assert.equal(r.totalRevenue,rows.reduce((n,x)=>n+x.total,0));
  assert.equal(r.segments.reduce((n,x)=>n+x.customerCount,0),90);
  assert(Math.abs(r.segments.reduce((n,x)=>n+x.revenueShare,0)-1)<0.00001);
});
const route=load('app/api/segment-analysis/route.ts');
const request=body=>new Request('http://localhost/api/segment-analysis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
async function main(){
  const sampleResponse=await route.POST(request({mode:'sample'}));
  const sample=await sampleResponse.json();
  check('isolated sample API produces deterministic metrics without a key',()=>{
    assert.equal(sampleResponse.status,200); assert.equal(sample.sourceLabel,'Sample dataset');
    assert.equal(sample.totalRevenue,3543);assert.equal(sample.segments.length,9);
    assert.equal(sample.segments.reduce((n,x)=>n+x.customerCount,0),19);
  });
  const csv='customer_uid,purchase_date,total\r\n"A,one",2026-01-01,"$1,200.50"\r\n"A,one",2026-01-02,20\r\nB,2026-01-03,30';
  const uploadResponse=await route.POST(request({mode:'upload',fileName:'qa.csv',mimeType:'text/csv',fileBase64:Buffer.from(csv).toString('base64')}));
  const upload=await uploadResponse.json();
  check('isolated CSV upload / quoted amount / duplicate customer',()=>{
    assert.equal(uploadResponse.status,200);assert.equal(upload.totalRevenue,1250.5);assert.equal(upload.sourceLabel,'Uploaded dataset: qa.csv');
    assert.equal(upload.segments.reduce((n,x)=>n+x.customerCount,0),2);
  });
  const invalid=await route.POST(request({mode:'upload',fileName:'empty.csv',fileBase64:Buffer.from('customer_uid,purchase_date,total').toString('base64')}));
  const error=await invalid.json();
  check('isolated invalid upload preserves original error contract',()=>{assert.equal(invalid.status,500);assert.match(error.error,/valid customer_uid/);});
  fakeEnv.GEMINI_API_KEY='unit-test-not-a-real-key';
  providerFetch=async()=>Response.json({candidates:[{content:{parts:[{text:JSON.stringify({segments:[{label:'Best Customers',customerCount:999999,revenueShare:1,totalRevenue:999999,actionPreview:'A reviewed next action.'},{label:'A made-up segment',actionPreview:'Must be ignored'}]})}]}}]});
  const augmented=await(await route.POST(request({mode:'sample'}))).json();
  check('mocked AI can edit soft guidance, never hard metrics or labels',()=>{
    assert.equal(augmented.totalRevenue,sample.totalRevenue);assert.equal(augmented.segments.length,9);
    for(const s of sample.segments){const a=augmented.segments.find(x=>x.label===s.label);assert.equal(a.customerCount,s.customerCount);assert.equal(a.revenueShare,s.revenueShare);}
    assert.equal(augmented.segments.find(x=>x.label==='Best Customers').actionPreview,'A reviewed next action.');
  });
  delete fakeEnv.GEMINI_API_KEY;
  console.log(`\n${passed} checks passed.\nScope: byte preservation, asset structure, TS transpilation, isolated deterministic/CSV/API tests.\nNot covered: Next build, real Excel parser, live AI provider, browser/WebGL/real-device performance.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
