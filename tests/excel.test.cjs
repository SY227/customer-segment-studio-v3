'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {createLoader}=require('./load-ts.cjs');
let XLSX;
try{XLSX=require('xlsx');}catch(error){if(process.env.STUDIO_ALLOW_MISSING_DEPENDENCIES!=='1')throw new Error('Install the release dependencies with npm ci. Real Excel tests are required for the full suite.');}
const actual=test;
function excelTest(name,fn){actual(name,{skip:!XLSX?'DELIVERY ENVIRONMENT: Excel package not installed; real parser test not executed':false},fn)}
const workbook=(rows,type='xlsx',date1904=false)=>{
 const wb=XLSX.utils.book_new();wb.Workbook={WBProps:{date1904}};XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'Orders');return XLSX.write(wb,{type:'buffer',bookType:type});
};
excelTest('REAL XLSX parser: first sheet, serial dates, numeric values and record reconciliation',async()=>{
 const {load}=createLoader();const imp=load('src/lib/orderImport.ts');const service=load('src/lib/analysisService.ts');
 const bytes=workbook([['Customer ID','Order Date','Amount'],['A',46023,10],['A',46024,20],['B',46025,30]]);
 const t=await imp.decodeFile(bytes.toString('base64'),'actual.xlsx');const a=service.analyzeTable(t,{sourceLabel:'actual.xlsx',sourceKind:'upload'});
 assert.equal(a.totalRevenue,60);assert.equal(a.totalCustomers,2);assert.equal(a.transactionCount,3);assert.equal(t.sheetName,'Orders');assert.equal(a.customers[0].orderCount,2);
});
excelTest('REAL legacy XLS parser preserves the CSV-compatible input path',async()=>{
 const {load}=createLoader();const imp=load('src/lib/orderImport.ts');const service=load('src/lib/analysisService.ts');
 const bytes=workbook([['customer_uid','purchase_date','total'],['A','2026-01-01',12.5]],'biff8');
 const t=await imp.decodeFile(bytes.toString('base64'),'actual.xls');const a=service.analyzeTable(t,{sourceLabel:'actual.xls',sourceKind:'upload'});assert.equal(a.totalRevenue,12.5);assert.equal(a.totalCustomers,1);
});
excelTest('REAL XLSX parser rejects formula cells in selected fields instead of executing them',async()=>{
 const {load}=createLoader();const imp=load('src/lib/orderImport.ts');const wb=XLSX.utils.book_new();const ws=XLSX.utils.aoa_to_sheet([['customer_uid','purchase_date','total'],['A','2026-01-01',10],['B','2026-01-02',20]]);ws.C2={t:'n',f:'1+9',v:10};XLSX.utils.book_append_sheet(wb,ws,'Orders');const bytes=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
 const t=await imp.decodeFile(bytes.toString('base64'),'formula.xlsx');const result=imp.normalizeTable(t,{customer:0,date:1,amount:2},'iso');assert.equal(result.quality.reasonCounts.formulaCell,1);assert.equal(result.rows.length,1);
});
excelTest('REAL XLSX first-tab policy and 1904 workbook dates are visible',async()=>{
 const {load}=createLoader();const imp=load('src/lib/orderImport.ts');const service=load('src/lib/analysisService.ts');const wb=XLSX.utils.book_new();wb.Workbook={WBProps:{date1904:true}};XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['customer_uid','purchase_date','total'],['A',0,10]]),'First');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['ignored'],[100]]),'Other');
 const t=await imp.decodeFile(XLSX.write(wb,{type:'buffer',bookType:'xlsx'}).toString('base64'),'epoch.xlsx');const a=service.analyzeTable(t,{sourceLabel:'epoch.xlsx',sourceKind:'upload'});assert.equal(a.asOfDate,'1904-01-01');assert.equal(t.sheetCount,2);assert(imp.inspectTable(t).messages.some(s=>s.includes('Only the first sheet')));
});
