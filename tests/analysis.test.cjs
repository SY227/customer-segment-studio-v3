'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, plain, root } = require('./load-ts.cjs');
const { load } = createLoader();
const core = load('src/lib/deterministicSegmentAnalysis.ts');
const original = load('docs/previous-release/v2.0.0/src/lib/deterministicSegmentAnalysis.ts.txt');
const data = load('src/data/segmentGuildData.ts');
const originalData = load('docs/previous-release/v2.0.0/src/data/segmentGuildData.ts.txt');
const importing = load('src/lib/orderImport.ts');
const service = load('src/lib/analysisService.ts');
const exporting = load('src/lib/actionExport.ts');
const presentation = load('src/lib/presentation.ts');
const sampleData = load('src/data/sampleOrders.ts');
const sample = service.createSampleAnalysis();
const map = { customer: 0, date: 1, amount: 2 };
const hard = r => ({ totalRevenue: r.totalRevenue, totalCustomers: r.totalCustomers, asOfDate: r.asOfDate, segments: r.segments });
const table = csv => importing.tableFromCsv(csv);

test('sample has one reconciled source: 19 customers, 29 transactions, $3543 and June 20', () => {
  assert.equal(sample.totalCustomers,19); assert.equal(sample.transactionCount,29); assert.equal(sample.totalRevenue,3543); assert.equal(sample.asOfDate,'2026-06-20');
  assert.equal(sample.sourceKind,'sample'); assert.equal(sample.guidance.source,'template');
  assert.equal(sample.customers.length,sample.totalCustomers);
  assert.equal(sample.customers.reduce((sum,c) => sum+c.orderCount,0),sample.transactionCount);
  assert.equal(Math.round(sample.customers.reduce((sum,c) => sum+c.historicalSpend,0)*100)/100,sample.totalRevenue);
  assert.equal(fs.readFileSync(path.join(root,'public/sample-outreach-transactions.csv'),'utf8').trim(),sampleData.SAMPLE_ORDERS_CSV.trim());
});

test('all nine identities, default selection, asset mapping, motion and room parameters are preserved',()=>{
  const keys=['key','label','asset','textureOverride','characterHeight','priorityRank','accent','accentSoft','roomX','roomY','driftX','driftY','walkDurationMs','walkDelayMs','depth'];
  const pick=segments=>segments.map(s=>Object.fromEntries(keys.map(k=>[k,s[k]??null])));
  assert.deepEqual(plain(pick(data.SEGMENT_GUILD_DATA)),plain(pick(originalData.SEGMENT_GUILD_DATA)));
  assert.equal(data.DEFAULT_SEGMENT_KEY, originalData.DEFAULT_SEGMENT_KEY);
});

for (const size of [1,2,3,8,19,90,201]) {
  test(`V2 scoring regression for ${size} customers: same totals, bands and group coverage`,()=>{
    const rows=[];
    for(let i=1;i<=size;i++) for(let j=0;j<(i%8)+1;j++) rows.push({customer_uid:'C'+i,purchase_date:`2026-${String((i%6)+1).padStart(2,'0')}-${String((j%25)+1).padStart(2,'0')}`,total:i*2.5});
    const actual=core.analyzeOrdersDeterministically(rows); const old=original.analyzeOrdersDeterministically(rows);
    assert.deepEqual(plain(hard(actual)),plain(hard(old)));
    assert.equal(actual.customers.length,size);
    for(const s of actual.segments) assert.equal(actual.customers.filter(c=>c.segment===s.label).length,s.customerCount);
  });
}

test('single customer and complete ties keep middle scores rather than fabricated VIP/first-order categories',()=>{
  const r=core.analyzeOrdersDeterministically([{customer_uid:'A',purchase_date:'2026-01-02',total:100}]);
  assert.equal(r.customers[0].segment,'Growing Buyers');assert.equal(r.customers[0].recencyScore,2);assert.equal(r.customers[0].purchaseStrengthBand,'Medium');
  assert.equal(r.basis.recency.tied,true);assert.match(r.basis.purchaseStrength,/Frequency score \+ monetary score/);
});

test('as-of remains latest valid transaction, never the wall clock',()=>{
  const r=core.analyzeOrdersDeterministically([{customer_uid:'A',purchase_date:'2020-01-01',total:100},{customer_uid:'B',purchase_date:'2020-01-11',total:10}]);
  assert.equal(r.asOfDate,'2020-01-11');assert.equal(r.customers.find(c=>c.customerUid==='A').recencyDays,10);
});

test('invalid normalized rows remain excluded by the deterministic engine',()=>{
  const rows=[{customer_uid:' A ',purchase_date:'2026-01-02',total:100},{customer_uid:'A',purchase_date:'2026-01-03',total:20},{customer_uid:'',purchase_date:'2026-01-01',total:1000},{customer_uid:'B',purchase_date:'invalid',total:10}];
  assert.deepEqual(plain(hard(core.analyzeOrdersDeterministically(rows))),plain(hard(original.analyzeOrdersDeterministically(rows))));
});
test('empty deterministic dataset rejects',()=>assert.throws(()=>core.analyzeOrdersDeterministically([]),/valid customer_uid/));

test('quoted CSV, BOM, CRLF, escaped quote and comma-in-ID are handled',()=>{
  const t=table('\uFEFFcustomer_uid,purchase_date,total\r\n"A,one",2026-01-01,"$1,200.50"\r\n"A,one",2026-01-02,20\r\n"B""two",2026-01-03,30');
  const result=service.analyzeTable(t,{sourceLabel:'test',sourceKind:'upload'});
  assert.equal(result.totalRevenue,1250.5);assert.equal(result.totalCustomers,2);assert.equal(result.customers[1].customerUid,'B"two');
});
test('quoted multiline field is supported without promoting a free-text note into analysis',()=>{
  const t=table('customer_id,date,amount,note\nA,2026-01-01,10,"one\nline"');
  assert.equal(t.rows.length,1);assert.equal(t.rows[0].cells[3],'one\nline');
});
test('malformed CSV quoting is rejected, not silently repaired',()=>{
  assert.throws(()=>table('customer_id,date,amount\n"A,2026-01-01,1'),/not closed/);
  assert.throws(()=>table('customer_id,date,amount\n"A"x,2026-01-01,1'),/Malformed CSV/);
});
test('missing and extra fields do not silently shift columns',()=>{
  assert.throws(()=>table('customer_id,date,amount\nA,2026-01-01,1,extra'),/more fields/);
  const r=importing.normalizeTable(table('customer_id,date,amount\nA,2026-01-01'),map,'iso');assert.equal(r.quality.reasonCounts.invalidAmount,1);
});

test('all prescribed column aliases resolve positionally',()=>{
  for(const field of ['customer','date','amount']) for(const alias of importing.FIELD_ALIASES[field]) {
    const h={customer:'customer_uid',date:'purchase_date',amount:'total'};h[field]=alias;
    const i=importing.inspectTable(table(`${h.customer},${h.date},${h.amount}\nA,2026-01-01,10`));
    assert.equal(i.suggestedMapping[field],['customer','date','amount'].indexOf(field));
  }
});
test('normalization accepts spacing/case and does not pick an ambiguous ID column',()=>{
  const t=table('Customer ID,Account_ID,Purchase Date,Amount\nA,B,2026-01-01,10');
  const i=importing.inspectTable(t);assert.equal(i.suggestedMapping.customer,null);assert.deepEqual(plain(i.candidates.customer),[0,1]);
  assert.throws(()=>importing.validateMapping(undefined,t),/Missing or ambiguous/);
  assert.equal(service.analyzeTable(t,{mapping:{customer:1,date:2,amount:3},sourceLabel:'test',sourceKind:'upload'}).customers[0].customerUid,'B');
});
test('duplicate header names remain distinct column choices; no object-key overwrite',()=>{
  const t=table('customer_uid,purchase_date,total,total\nA,2026-01-01,10,20');
  assert.equal(importing.inspectTable(t).suggestedMapping.amount,null);
  assert.equal(service.analyzeTable(t,{mapping:{customer:0,date:1,amount:3},sourceLabel:'test',sourceKind:'upload'}).totalRevenue,20);
});
test('field mapping must use distinct in-range integer column positions',()=>{
  const t=table('customer_uid,purchase_date,total\nA,2026-01-01,10');
  for(const mapping of [{customer:0,date:0,amount:2},{customer:-1,date:1,amount:2},{customer:0,date:1,amount:8},{customer:0.5,date:1,amount:2}]) assert.throws(()=>importing.validateMapping(mapping,t));
});

test('invalid records have explicit overlapping issue counts; blank records counted separately',()=>{
  const t=table('customer_uid,purchase_date,total\nA,2026-01-01,10\n,not-a-date,\nB,2026-02-30,9\nC,2026-01-01,\n\n');
  const {rows,quality:q}=importing.normalizeTable(t,map,'iso');
  assert.equal(rows.length,1);assert.equal(q.inputRows,4);assert.equal(q.validRows,1);assert.equal(q.rejectedRows,3);assert.equal(q.blankRowsSkipped,1);
  assert.equal(q.reasonCounts.missingCustomerId,1);assert.equal(q.reasonCounts.invalidDate,2);assert.equal(q.reasonCounts.invalidAmount,2);
  assert.equal(q.inputRows,q.validRows+q.rejectedRows);
});
test('date parsing never silently rolls February 30 into March',()=>{
  assert.equal(importing.parsePurchaseDate('2026-02-30','iso'),null);assert.equal(importing.parsePurchaseDate('2024-02-29','iso'),'2024-02-29');
});
test('ambiguous local dates require explicit MDY or DMY',()=>{
  assert.equal(importing.parsePurchaseDate('03/04/2026','iso'),null);
  assert.equal(importing.parsePurchaseDate('03/04/2026','mdy'),'2026-03-04');assert.equal(importing.parsePurchaseDate('03/04/2026','dmy'),'2026-04-03');
});
test('ISO timestamps require a timezone and are reduced to UTC day',()=>{
  assert.equal(importing.parsePurchaseDate('2026-03-04T23:30:00-08:00','iso'),'2026-03-05');
  assert.equal(importing.parsePurchaseDate('2026-03-04T23:30:00','iso'),null);
});
test('Excel serials: 1900 leap-day fiction rejected; 1904 dates supported',()=>{
  assert.equal(importing.parsePurchaseDate(1,'iso',true,false),'1900-01-01');assert.equal(importing.parsePurchaseDate(60,'iso',true,false),null);
  assert.equal(importing.parsePurchaseDate(61,'iso',true,false),'1900-03-01');assert.equal(importing.parsePurchaseDate(0,'iso',true,true),'1904-01-01');
  assert.equal(importing.parsePurchaseDate('45000','iso',false),null);
});
test('blank amount never becomes zero; grouping separators and decimals are validated',()=>{
  for(const x of ['', ' ', '$', '12,34', '12.345', 'Infinity','1e3','€12,50']) assert.equal(importing.parseAmount(x),null,x);
  assert.equal(importing.parseAmount('0'),0);assert.equal(importing.parseAmount('$1,200.50'),1200.5);assert.equal(importing.parseAmount('(12.50)'),-12.5);
});
test('negative and zero amounts preserve baseline signed-row behavior with warnings',()=>{
  const t=table('customer_uid,purchase_date,total\nA,2026-01-01,100\nA,2026-01-02,-20\nB,2026-01-03,0');
  const result=service.analyzeTable(t,{sourceLabel:'test',sourceKind:'upload'});assert.equal(result.totalRevenue,80);assert.equal(result.transactionCount,3);
  assert.equal(result.quality.negativeAmountRows,1);assert.equal(result.quality.zeroAmountRows,1);assert.equal(result.customers[0].orderCount,2);
});
test('signed proportions are not clamped or divided by 100 in the UI adapter',()=>{
  const r=service.analyzeTable(table('customer_uid,purchase_date,total\nA,2026-01-01,100\nB,2026-01-02,-50'),{sourceLabel:'test',sourceKind:'upload'});
  const p=presentation.segmentsForAnalysis(r); for(const s of r.segments) assert.equal(p.find(x=>x.label===s.label).revenueShare,s.revenueShare);
});
test('nonpositive totals suppress proportion meaning, not the signed historical values',()=>{
  const r=service.analyzeTable(table('customer_uid,purchase_date,total\nA,2026-01-01,-5'),{sourceLabel:'test',sourceKind:'upload'});
  assert.equal(r.totalRevenue,-5);assert(r.segments.every(s=>s.revenueShare===0));assert(r.quality.messages.some(x=>x.includes('not meaningful')));
});
test('repeated rows are deliberately kept, not silently deduplicated',()=>{
  const r=service.analyzeTable(table('customer_uid,purchase_date,total\nA,2026-01-01,10\nA,2026-01-01,10'),{sourceLabel:'test',sourceKind:'upload'});
  assert.equal(r.transactionCount,2);assert.equal(r.totalRevenue,20);assert.match(r.basis.rowPolicy,/retained/);
});
test('all-invalid imported file rejects rather than reverting to demo metrics',()=>assert.throws(()=>service.analyzeTable(table('customer_uid,purchase_date,total\nA,bad,10'),{sourceLabel:'test',sourceKind:'upload'}),/No valid transactions/));
test('large member results are complete; 10,001 customers rejected rather than truncated',()=>{
  const rows=Array.from({length:10001},(_,i)=>({customer_uid:'C'+i,purchase_date:'2026-01-01',total:1}));
  assert.throws(()=>core.analyzeOrdersDeterministically(rows),/10,000/);
});
test('rejected record examples are bounded without dropping totals',()=>{
  const t=table('customer_uid,purchase_date,total\n'+Array.from({length:14},()=>',bad,').join('\n'));
  const q=importing.normalizeTable(t,map,'iso').quality;assert.equal(q.rejectedRows,14);assert.equal(q.examples.length,10);assert.equal(q.examplesTruncated,true);
});

test('action CSV contains exactly the selected customers, plus evidence and labeled suggestions',()=>{
  const selected=sample.customers.filter(c=>c.segment===sample.customers[0].segment);
  const csv=exporting.buildActionCsv(sample,selected,presentation.segmentsForAnalysis(sample));
  const rows=importing.parseCsv(csv);assert.equal(rows.length,selected.length+1);
  assert.deepEqual(plain(rows.slice(1).map(r=>r[0])),plain(selected.map(c=>c.customerUid)));
  const headers=rows[0];for(const name of ['reason','analysis_as_of','guidance_source','suggested_action']) assert(headers.includes(name));
  for(const name of ['owner','due_date','renewal_date','churn_probability','predicted_revenue']) assert(!headers.includes(name));
});
test('full CSV export reconciles to all members, not a rendered table page',()=>{
  const rows=importing.parseCsv(exporting.buildActionCsv(sample,sample.customers,presentation.segmentsForAnalysis(sample)));
  assert.equal(rows.length-1,19);assert.equal(rows[0].length,15);assert(rows.every(r=>r.length===15));
});
test('CSV protects formula-like text without changing numeric negative values',()=>{
  for(const text of ['=HYPERLINK("a")','+SUM(1)','-ID','@SUM(1)','  =cmd','\t=cmd']) assert.match(exporting.csvCell(text),/^"'/);
  assert.equal(exporting.csvCell(-12.5),'"-12.5"');assert.equal(exporting.csvCell('A,"B"'),'"A,""B"""');
});
test('export rejects foreign member IDs',()=>assert.throws(()=>exporting.buildActionCsv(sample,[{...sample.customers[0],customerUid:'foreign'}],presentation.segmentsForAnalysis(sample)),/outside this analysis/));
test('identifiers that look like object prototype keys are safe Map values',()=>{
  const r=service.analyzeTable(table('customer_uid,purchase_date,total\n__proto__,2026-01-01,10\nconstructor,2026-01-02,20'),{sourceLabel:'test',sourceKind:'upload'});
  assert.equal(r.totalCustomers,2);assert.equal(r.totalRevenue,30);
});

test('export facts are resolved from the analysis, not a caller-modified member object',()=>{
 const forged={...sample.customers[0],historicalSpend:999999};
 const csv=exporting.buildActionCsv(sample,[forged],presentation.segmentsForAnalysis(sample));
 const rows=importing.parseCsv(csv);assert.equal(Number(rows[1][5]),sample.customers[0].historicalSpend);
});
test('export refuses duplicate member requests',()=>assert.throws(()=>exporting.buildActionCsv(sample,[sample.customers[0],sample.customers[0]],presentation.segmentsForAnalysis(sample)),/duplicate customer/));
test('member spend reconciles within each segment as well as the full review',()=>{
 for(const group of sample.segments){const members=sample.customers.filter(c=>c.segment===group.label);const spend=members.reduce((s,c)=>s+c.historicalSpend,0);assert(Math.abs(spend/sample.totalRevenue-group.revenueShare)<0.000001);}
});
test('50,000 valid records stay complete at the defined row boundary',()=>{
 const t=table('customer_uid,purchase_date,total\n'+Array.from({length:50000},(_,i)=>`C${i%500},2026-01-01,1.00`).join('\n'));
 const a=service.analyzeTable(t,{sourceLabel:'synthetic limit fixture',sourceKind:'upload'});assert.equal(a.transactionCount,50000);assert.equal(a.totalCustomers,500);assert.equal(a.totalRevenue,50000);
});
