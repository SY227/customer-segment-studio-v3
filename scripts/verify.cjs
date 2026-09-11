#!/usr/bin/env node
'use strict';
/* V3 source/asset checks. Behavioral tests are separate; this is not a Next/WebGL run. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(read('docs/V2_BASELINE_HASHES.json'));
const intentionallyChanged=new Set(['next-env.d.ts','.gitignore','.env.example','package.json','package-lock.json','README.md','RELEASE.json','FILE_MANIFEST.sha256','app/page.tsx','app/layout.tsx','app/api/segment-analysis/route.ts','src/components/HeaderActionsClient.tsx','src/data/segmentGuildData.ts','src/lib/deterministicSegmentAnalysis.ts','scripts/verify.cjs','scripts/qa/render-layout-fixture.cjs','start-local.sh','docs/QA_REPORT.md']);
let passed=0;const check=(label,fn)=>{fn();passed++;console.log('PASS '+label)};
for(const [p,expected] of Object.entries(baseline)){
 if(intentionallyChanged.has(p))continue;
 check('preserved V2 bytes: '+p,()=>assert.equal(hash(read(p)),expected,p));
}
for(const [name,item] of Object.entries(JSON.parse(read('docs/protected-behavior.json')))){
 if(name==='page-business-controller')continue; // Replaced explicitly: API result + import mapping/member-review state.
 check('preserved 3D behavior range: '+name,()=>{
  const s=read(item.file).toString();const a=s.indexOf(item.start),b=s.indexOf(item.end,a);assert(a>=0&&b>a);
  let chunk=s.slice(a,b+(item.include_end?item.end.length:0));if(item.exclude)chunk=chunk.replace(item.exclude,'');assert.equal(hash(chunk),item.sha256);
 });
}
const glbs=Object.keys(baseline).filter(p=>p.endsWith('.glb'));
check('all nine original character GLBs are present and structurally valid',()=>{
 assert.equal(glbs.length,9);for(const p of glbs){const b=read(p);assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);const gltf=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));assert(gltf.meshes.length>0&&gltf.skins.length>0);}
});
const sourceRefs=['src/data/segmentGuildData.ts','src/components/SegmentGuildCanvas.tsx','src/components/SegmentCardAvatar.tsx'];
check('all local model/texture references resolve',()=>{
 const refs=sourceRefs.flatMap(p=>[...read(p).toString().matchAll(/["'`](\/assets\/[^"'`]+\.(?:glb|fbx|png))["'`]/g)].map(m=>m[1]));assert(refs.length>20);for(const p of refs)assert(fs.existsSync(path.join(root,'public',p)),p);
});
const pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json'));
check('generated Next type entry remains present',()=>assert.match(read('next-env.d.ts').toString(),/reference types="next"/));
check('version and install declarations agree',()=>{assert.equal(pkg.version,'3.0.0');assert.equal(lock.version,pkg.version);assert.equal(lock.packages[''].version,pkg.version);assert.deepEqual(lock.packages[''].dependencies,pkg.dependencies);assert.equal(lock.packages['node_modules/xlsx'].version,'0.20.3');});
check('environment example contains no API key value',()=>{assert.match(read('.env.example').toString(),/^GEMINI_API_KEY=$/m);assert(!fs.existsSync(path.join(root,'.env')));});
const css=['app/globals.css','app/atelier.css','app/outreach.css'].map(p=>read(p).toString()).join('\n');
check('no remote fonts or art added',()=>assert(!/@font-face|@import|url\(\s*['"]?https?:/i.test(css)));
check('keyboard and reduced-motion styles exist',()=>{assert(css.includes(':focus-visible'));assert(css.includes('prefers-reduced-motion: reduce'));});
check('member review freezes auto-selection without removing 3D motion',()=>{const s=read('src/components/StudioClient.tsx').toString();assert(s.includes('conversationPaused={conversationPaused || memberOpen || !!pending}'));assert(s.includes('onSelect={setSelectedKey}'));});
check('default data is analyzed server-side, not fabricated membership',()=>{const s=read('app/page.tsx').toString();assert(s.includes('createSampleAnalysis()'));assert(!s.includes('use client'));});
check('new client UI does not import server parsers or keys',()=>{for(const p of ['src/components/StudioClient.tsx','src/components/ImportMapping.tsx','src/components/MemberReview.tsx'])assert(!/from ["'][^"']*(orderImport|analysisService|softGuidance)|process\.env|AIza/.test(read(p).toString()));});
check('historical metric label replaces unsupported at-stake claim',()=>{const s=read('src/components/StudioClient.tsx').toString();assert(s.includes('Historical revenue represented'));assert(!s.includes('Revenue at stake'));});
let ts;try{ts=require(process.env.STUDIO_TYPESCRIPT_PATH||'typescript');}catch{throw Error('Run npm ci before QA.');}
const walk=d=>fs.readdirSync(path.join(root,d),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=[...walk('app'),...walk('src'),'next.config.ts'].filter(p=>/\.tsx?$/.test(p)&&!p.endsWith('.d.ts'));
for(const p of files)check('TypeScript/JSX syntax: '+p,()=>{
 const result=ts.transpileModule(read(p).toString(),{fileName:p,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,isolatedModules:true}});
 const errors=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);assert.equal(errors.length,0,errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('\n'));
});
console.log(`\n${passed} source/asset/syntax checks passed. Next.js build, full typecheck and browser/WebGL runtime are separate gates.`);
