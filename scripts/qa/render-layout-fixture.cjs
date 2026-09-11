#!/usr/bin/env node
/* Internal CSS/JSX fixture: hooks are stubs. NO React, Next, Three or WebGL runtime is claimed. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),os=require('node:os');
const ts=require(process.env.STUDIO_TYPESCRIPT_PATH||'typescript');
const root=path.resolve(__dirname,'../..'),output=process.env.STUDIO_QA_DIR||path.join(os.tmpdir(),'studio-v21-layout');fs.mkdirSync(output,{recursive:true});
const cache=new Map();let active='',index=0,current={},uid=0,selectedValue;
const hooks={useState:v=>{const i=index++;return [Object.hasOwn(current[active]||{},i)?current[active][i]:(typeof v==='function'?v():v),()=>{}]},useRef:v=>({current:v}),useEffect:()=>{},useMemo:fn=>fn(),useCallback:fn=>fn,memo:fn=>fn,useId:()=>`qa-id-${++uid}`};
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'qa-fragment'};
function load(p){
 if(cache.has(p))return cache.get(p);const exports={};cache.set(p,exports);
 const code=ts.transpileModule(fs.readFileSync(path.join(root,p),'utf8'),{fileName:p,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const req=k=>{
  if(k==='react')return hooks;if(k==='react/jsx-runtime')return jsx;
  if(k==='next/dynamic')return {default:fn=>{const text=fn.toString();for(const name of ['SegmentGuildCanvas','SegmentCardAvatar'])if(text.includes(name))return load('src/components/'+name+'.tsx')[name];throw Error('Unknown dynamic '+text)}};
  if(k==='three'||k==='xlsx')throw Error('No real '+k+' runtime exists in this CSS-only fixture.');
  const resolved=k.startsWith('@/')?'src/'+k.slice(2):path.posix.normalize(path.posix.join(path.posix.dirname(p),k));
  for(const ext of ['.tsx','.ts'])if(fs.existsSync(path.join(root,resolved+ext)))return load(resolved+ext);
  throw Error('Unsupported fixture import '+k);
 };
 vm.runInNewContext(code,{exports,require:req,console,Buffer,TextDecoder,TextEncoder,Map,Set,URL,AbortController},{filename:p});return exports;
}
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const kebab=s=>s.startsWith('--')?s:s.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
const unitless=new Set(['opacity','zIndex','fontWeight','lineHeight','flex','order','flexGrow','flexShrink','strokeWidth']);
function render(n){
 if(n==null||n===false||n===true)return '';if(Array.isArray(n))return n.map(render).join('');if(typeof n==='string'||typeof n==='number')return escape(n);
 if(typeof n.type==='function'){const old=active,oi=index;active=n.type.name;index=0;const result=render(n.type(n.props||{}));active=old;index=oi;return result;}
 if(n.type==='qa-fragment')return render(n.props.children);
 let attrs='';const p=n.props||{};const previousSelect=selectedValue;if(n.type==='select')selectedValue=p.value;
 for(let[k,v]of Object.entries(p)){
  if(['children','key','ref','suppressHydrationWarning'].includes(k)||k.startsWith('on')||v==null)continue;
  if(k==='className')k='class';if(k==='htmlFor')k='for';if(k==='tabIndex')k='tabindex';
  if(k==='style')v=Object.entries(v).map(([a,b])=>`${kebab(a)}:${typeof b==='number'&&!a.startsWith('--')&&!unitless.has(a)?b+'px':b}`).join(';');
  if(typeof v==='boolean'&&!k.startsWith('aria-')&&!k.startsWith('data-')){if(v)attrs+=' '+k;continue;}
  attrs+=' '+k+'="'+escape(v)+'"';
 }
 if(n.type==='option'&&String(p.value??p.children)===String(selectedValue))attrs+=' selected';
 if(n.type==='details'&&current.openDetails)attrs+=' open';
 let content=render(p.children);selectedValue=previousSelect;
 if(p.className==='guild-canvas-viewport')content='<div class="qa-stage"><strong>3D RUNTIME NOT EXECUTED</strong><p>Preserved models / motion source<br/>Layout placeholder only</p></div>';
 if(p.className==='segment-card-avatar-viewport')content='<div class="qa-avatar">Original model<br/>not rendered in this fixture</div>';
 return `<${n.type}${attrs}>${content}${['input','img','br','hr','meta','link'].includes(n.type)?'':`</${n.type}>`}`;
}
const app=load('src/components/StudioClient.tsx').StudioClient,service=load('src/lib/analysisService.ts'),importing=load('src/lib/orderImport.ts'),data=load('src/data/segmentGuildData.ts');
const sample=service.createSampleAnalysis();
const quality=service.analyzeTable(importing.tableFromCsv('customer_id,order_date,amount\nA,2026-06-01,10\nB,bad,20\n,2026-06-02,\nC,2026-06-03,-2\nD,2026-06-04,4'),{sourceLabel:'Synthetic quality fixture.csv',sourceKind:'upload'});
const inspection=importing.inspectTable(importing.tableFromCsv('Customer ID,Account ID,Purchase Date,Amount\nA,B,2026-06-01,12.00\nC,D,2026-06-02,19.00'));
const states={
 default:{},members:{StudioClient:{3:true},openDetails:true},'all-members':{StudioClient:{3:true},MemberReview:{0:'all'},openDetails:true},
 quality:{StudioClient:{0:quality,3:true},openDetails:true},mapping:{StudioClient:{5:{name:'Synthetic ambiguous-columns.csv',base64:'',inspection}}},
 privacy:{StudioClient:{4:'data'}},format:{StudioClient:{4:'format'}},sample:{StudioClient:{4:'sample'}},
 processing:{StudioClient:{6:true,7:'Calculating customer evidence…'}},error:{StudioClient:{8:'No valid transactions remained. Your previous review is unchanged.'}},
};
for(const group of data.SEGMENT_GUILD_DATA)states['group-'+group.label.toLowerCase().replaceAll(' ','-')]={StudioClient:{1:group.key,3:true},openDetails:true};
const css=['app/globals.css','app/atelier.css','app/outreach.css'].map(p=>fs.readFileSync(path.join(root,p),'utf8')).join('\n');
for(const[name,state]of Object.entries(states)){
 current=state;uid=0;const html=render({type:app,props:{initialAnalysis:sample}});
 fs.writeFileSync(path.join(output,name+'.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CSS fixture only — ${escape(name)}</title><style>${css}\n.qa-stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(140deg,#e8e6e1,#cadce2);color:#68707a;text-align:center;padding:35px;font:12px system-ui;letter-spacing:.12em}.qa-stage p{font-size:12px;letter-spacing:0;line-height:1.8}.qa-avatar{position:absolute;inset:0;display:grid;place-content:center;text-align:center;color:#8b8094;font:10px/1.8 system-ui}.qa-label{position:fixed;bottom:0;right:0;z-index:1000;color:#7b4848;background:#fff8efed;padding:4px 8px;font:9px system-ui;pointer-events:none}.speech-overlay{display:none!important}</style></head><body><a class="studio-skip" href="#main">Skip to the Studio</a>${html}<div class="qa-label">CSS FIXTURE ONLY — NO WEBGL / NO REACT RUNTIME</div><script>document.querySelectorAll('dialog').forEach(d=>d.showModal());</script></body></html>`);
}
console.log('Rendered '+Object.keys(states).length+' JSX/CSS-only fixtures. NOT runtime app screenshots. Output: '+output);
