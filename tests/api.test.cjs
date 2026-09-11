'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {createLoader,plain}=require('./load-ts.cjs');
const request=(body,headers={})=>new Request('http://localhost:3021/api/segment-analysis',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
const upload=(csv,extra={})=>({mode:'upload',fileName:'qa.csv',fileBase64:Buffer.from(csv).toString('base64'),...extra});

test('API no-key sample returns complete deterministic evidence and no-store headers',async()=>{
 const {load}=createLoader();const r=await load('app/api/segment-analysis/route.ts').POST(request({mode:'sample'}));const b=await r.json();
 assert.equal(r.status,200);assert.equal(b.totalRevenue,3543);assert.equal(b.customers.length,19);assert.equal(b.transactionCount,29);assert.equal(b.guidance.source,'template');assert.match(r.headers.get('cache-control'),/no-store/);
});
test('inspect endpoint returns column preview, not an analyzed demo or AI request',async()=>{
 const {load}=createLoader();const p=upload('Customer ID,Date,Amount\nA,2026-01-01,10');p.mode='inspect';
 const r=await load('app/api/segment-analysis/route.ts').POST(request(p));const b=await r.json();assert.equal(r.status,200);assert.equal(b.inspection.columns.length,3);assert.equal(b.totalRevenue,undefined);
});
test('canonical upload still works and returns real member IDs',async()=>{
 const {load}=createLoader();const r=await load('app/api/segment-analysis/route.ts').POST(request(upload('customer_uid,purchase_date,total\nA,2026-01-01,10')));const b=await r.json();assert.equal(r.status,200);assert.equal(b.totalRevenue,10);assert.equal(b.customers[0].customerUid,'A');assert.equal(b.sourceLabel,'Uploaded dataset: qa.csv');
});
test('ambiguous mapping returns 422 until the user chooses a source column',async()=>{
 const {load}=createLoader();const route=load('app/api/segment-analysis/route.ts');const p=upload('Customer ID,Account ID,Date,Amount\nA,B,2026-01-01,10');
 const r=await route.POST(request(p));assert.equal(r.status,422);assert.equal((await r.json()).code,'MAPPING_REQUIRED');
 const good=await route.POST(request({...p,mapping:{customer:1,date:2,amount:3}}));assert.equal(good.status,200);assert.equal((await good.json()).customers[0].customerUid,'B');
});
test('validation rejects bad mode, malformed encoding, and oversized files',async()=>{
 const {load}=createLoader();const route=load('app/api/segment-analysis/route.ts');
 for(const p of [{mode:'other'}, {mode:'upload',fileName:'test.csv',fileBase64:'%'}, {mode:'upload',fileName:'test.exe',fileBase64:'YQ=='}]) assert((await route.POST(request(p))).status>=400);
 const r=await route.POST(request({mode:'sample'},{'Content-Length':String(4*1024*1024)}));assert.equal(r.status,413);
});
test('cross-origin uploads are refused; same-origin requests are accepted',async()=>{
 const {load}=createLoader();const route=load('app/api/segment-analysis/route.ts');
 assert.equal((await route.POST(request({mode:'sample'},{Origin:'https://other.example'}))).status,403);
 assert.equal((await route.POST(request({mode:'sample'},{Origin:'http://localhost:3021'}))).status,200);
});
test('all-invalid file returns 422 instead of a fake successful demo',async()=>{
 const {load}=createLoader();const r=await load('app/api/segment-analysis/route.ts').POST(request(upload('customer_uid,purchase_date,total\nA,bad,')));assert.equal(r.status,422);assert.match((await r.json()).error,/No valid transactions/);
});
test('AI must be requested; a configured key alone never invokes it',async()=>{
 let calls=0;const {load}=createLoader({env:{GEMINI_API_KEY:'test-only'},fetch:async()=>{calls++;throw Error('Must not run')}});
 const b=await(await load('app/api/segment-analysis/route.ts').POST(request({mode:'sample'}))).json();assert.equal(calls,0);assert.equal(b.guidance.source,'template');
});
test('AI whitelist prevents injection of hard metrics, members, labels or top-level totals',async()=>{
 let captured='';
 const payload={totalRevenue:999999,customers:[{customerUid:'EVIL'}],segments:[{label:'Best Customers',customerCount:9999,revenueShare:1,segmentKey:'EVIL',customers:[{customerUid:'X'}],actionPreview:'Test a reviewed next action.'},{label:'Invented group',actionPreview:'Ignore this'}]};
 const {load}=createLoader({env:{GEMINI_API_KEY:'test-only'},fetch:async(url,opts)=>{captured=opts.body;assert(!url.includes('test-only'));return Response.json({candidates:[{content:{parts:[{text:JSON.stringify(payload)}]}}]})}});
 const route=load('app/api/segment-analysis/route.ts');const baseline=await(await route.POST(request({mode:'sample'}))).json();const actual=await(await route.POST(request({mode:'sample',includeAI:true}))).json();
 assert.equal(actual.totalRevenue,baseline.totalRevenue);assert.deepEqual(actual.customers,baseline.customers);assert.equal(actual.segments.length,9);
 for(const s of baseline.segments){const a=actual.segments.find(x=>x.label===s.label);assert.equal(a.customerCount,s.customerCount);assert.equal(a.revenueShare,s.revenueShare);assert.equal(a.segmentKey,undefined)}
 assert.equal(actual.segments.find(s=>s.label==='Best Customers').actionPreview,'Test a reviewed next action.');assert.equal(actual.guidance.source,'ai');
 assert(!captured.includes('VIP_001'));assert(!captured.includes('customer_uid'));assert(!captured.includes('purchase_date'));assert(!captured.includes('fileName'));
});
test('filenames and customer IDs are never included in the provider prompt',()=>{
 const {load}=createLoader();const service=load('src/lib/analysisService.ts');const guidance=load('src/lib/softGuidance.ts');const a=service.createSampleAnalysis();a.sourceLabel='Secret company CEO export.csv';a.customers[0].customerUid='sensitive@example.test';const text=guidance.buildSoftGuidancePrompt(a);assert(!text.includes('Secret company'));assert(!text.includes('sensitive@example.test'));assert(!text.includes('VIP_001'));
});
test('provider failure falls back promptly with an explicit status; no fabricated metrics',async()=>{
 let calls=0;const {load}=createLoader({env:{GEMINI_API_KEY:'test-only'},fetch:async()=>{calls++;return new Response('fail',{status:500})}});
 const r=await load('app/api/segment-analysis/route.ts').POST(request({mode:'sample',includeAI:true}));const b=await r.json();assert.equal(r.status,200);assert.equal(b.guidance.source,'fallback');assert.equal(b.totalRevenue,3543);assert.equal(calls,2);
});
test('requested AI without a key returns deterministic results and disclosed fallback',async()=>{
 const {load}=createLoader();const b=await(await load('app/api/segment-analysis/route.ts').POST(request({mode:'sample',includeAI:true}))).json();assert.equal(b.guidance.source,'fallback');assert.match(b.guidance.message,/No Gemini key/);assert.equal(b.customers.length,19);
});
test('provider text filtering rejects unsupported claims and duplicated labels',()=>{
 const {load}=createLoader();const g=load('src/lib/softGuidance.ts');const r=g.sanitizeSoftGuidance({segments:[{label:'Best Customers',objective:'fake',actionPreview:'Guaranteed 40% recovery.',kpi:'Review response'},{label:'Best Customers',kpi:'Duplicate'},{label:'Fake',kpi:'No'}]});assert.equal(r.length,1);assert.equal(r[0].objective,undefined);assert.equal(r[0].actionPreview,undefined);assert.equal(r[0].kpi,'Review response');
});

test('partial AI guidance records soft-field provenance without relabeling untouched templates',()=>{
 const {load}=createLoader();const a=load('src/lib/analysisService.ts').createSampleAnalysis();const g=load('src/lib/softGuidance.ts');
 const out=g.applySoftGuidance(a,{segments:[{label:'Best Customers',actionPreview:'Test a relevant reminder.'}]},'test-model');
 assert.deepEqual(plain(out.guidance.aiFieldsBySegment),{'Best Customers':['actionPreview']});
 const exporting=load('src/lib/actionExport.ts');const presentation=load('src/lib/presentation.ts');const imp=load('src/lib/orderImport.ts');
 const best=out.customers.find(c=>c.segment==='Best Customers');const other=out.customers.find(c=>c.segment!=='Best Customers');
 const rows=imp.parseCsv(exporting.buildActionCsv(out,[best,other],presentation.segmentsForAnalysis(out)));
 assert.match(rows[1][14],/suggested_action: AI; objective: reviewed prompt/);assert.doesNotMatch(rows[2][14],/: AI/);
});
