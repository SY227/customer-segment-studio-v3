#!/usr/bin/env node
/* Isolated decorative-layer lifecycle test with a Three API adapter.
   Checks ownership, actor non-mutation and control semantics, NOT GPU rendering. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
let ts;try{ts=require(process.env.STUDIO_TYPESCRIPT_PATH||'typescript')}catch{console.error('Run npm ci first.');process.exit(1)}
const root=path.resolve(__dirname,'..');let checks=0;
const check=(name,fn)=>{fn();checks++;console.log('PASS '+name)};
const allResources=[];
class Resource{constructor(...args){this.args=args;this.disposeCount=0;allResources.push(this)}dispose(){this.disposeCount++}}
class Vec {constructor(x=0,y=0,z=0){this.set(x,y,z)}set(x,y,z){assert([x,y,z].every(Number.isFinite));Object.assign(this,{x,y,z});return this}clone(){return new Vec(this.x,this.y,this.z)}add(v){return this.set(this.x+v.x,this.y+v.y,this.z+v.z)}sub(v){return this.set(this.x-v.x,this.y-v.y,this.z-v.z)}multiplyScalar(s){return this.set(this.x*s,this.y*s,this.z*s)}normalize(){return this.multiplyScalar(1/(Math.hypot(this.x,this.y,this.z)||1))}distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z)}copy(v){return this.set(v.x,v.y,v.z)}setScalar(v){return this.set(v,v,v)}}
class Color{constructor(v){this.value=v}set(v){this.value=v;return this}multiplyScalar(v){this.multiplier=v;return this}}
class Obj {constructor(){this.children=[];this.position=new Vec();this.rotation=new Vec();this.scale=new Vec(1,1,1);this.quaternion={setFromUnitVectors:(a,b)=>{assert(Math.abs(Math.hypot(b.x,b.y,b.z)-1)<1e-8)}};this.visible=true;this.userData={}}add(...v){this.children.push(...v);return this}remove(o){this.children=this.children.filter(x=>x!==o)}clear(){this.children=[]}traverse(fn){fn(this);this.children.forEach(o=>o.traverse(fn))}}
class Mesh extends Obj{constructor(g,m){super();this.geometry=g;this.material=m}}
class Material extends Resource{constructor(options={}){super(options);Object.assign(this,options);this.color=new Color(options.color)}}
class Geometry extends Resource{setFromPoints(points){this.points=points;return this}setAttribute(k,v){this[k]=v;return this}}
class Shape{moveTo(){return this}lineTo(){return this}absarc(){return this}closePath(){return this}}
const T={Group:Obj,Vector3:Vec,Mesh,Line:Mesh,LineLoop:Mesh,Points:Mesh,Shape,Color,
 MeshStandardMaterial:Material,MeshBasicMaterial:Material,LineBasicMaterial:Material,PointsMaterial:Material,
 BoxGeometry:Geometry,PlaneGeometry:Geometry,ShapeGeometry:Geometry,TubeGeometry:Geometry,TorusGeometry:Geometry,
 IcosahedronGeometry:Geometry,BufferGeometry:Geometry,RingGeometry:Geometry,CylinderGeometry:Geometry,
 CatmullRomCurve3:class{constructor(p){this.points=p}},BufferAttribute:class{constructor(a,n){this.array=a;this.itemSize=n}},CanvasTexture:Resource,DoubleSide:2,SRGBColorSpace:'srgb'};
const output={};
const source=fs.readFileSync(path.join(root,'src/lib/createAtelierScene.ts'),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const fakeDocument={createElement:()=>({getContext:()=>({createRadialGradient:()=>({addColorStop:()=>{}}),fillRect:()=>{}})})};
vm.runInNewContext(code,{exports:output,document:fakeDocument,console});
const scene=new Obj();const originalRoom=new Obj();scene.add(originalRoom);
const visual=output.createAtelierScene(T,scene);
check('decoration attaches without removing the original room',()=>{assert.equal(scene.children.length,2);assert.equal(scene.children[0],originalRoom);assert.equal(scene.children[1].name,'AtelierDecorativeLayer')});
check('no decorative object impersonates a segment hit target',()=>scene.children[1].traverse(o=>assert(!o.userData.segmentKey)));
const actors=Array.from({length:9},(_,i)=>({segment:{key:'group-'+i,accent:'#b69c72',characterHeight:1.1},group:{position:{x:i-4,y:0,z:i*.2}}}));
const snapshot=JSON.stringify(actors);
visual.update(20,true,'group-4',actors);
check('all nine actors remain unmodified by the effect layer',()=>assert.equal(JSON.stringify(actors),snapshot));
check('render-resource parameters are finite',()=>{for(const r of allResources)for(const a of r.args)if(typeof a==='number')assert(Number.isFinite(a))});
const resourcesAfterFirstUpdate=allResources.length;
for(let i=0;i<120;i++)visual.update(i/60,i%2===0,'group-'+i%9,actors);
check('no per-frame resource creation after initial setup',()=>assert.equal(allResources.length,resourcesAfterFirstUpdate));
visual.dispose();
check('dispose removes only the decoration layer',()=>{assert.equal(scene.children.length,1);assert.equal(scene.children[0],originalRoom)});
check('owned resources are disposed exactly once',()=>allResources.forEach(r=>assert.equal(r.disposeCount,1)));
visual.dispose();visual.update(10,true,'group-1',actors);
check('cleanup is idempotent and late updates are safe',()=>allResources.forEach(r=>assert.equal(r.disposeCount,1)));
console.log(`\n${checks} isolated lifecycle checks passed. Adapter only; no WebGL was executed.`);
