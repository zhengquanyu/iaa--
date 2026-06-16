const fs=require('fs');
const path=require('path');
const {PNG}=require('pngjs');
const root=path.resolve(__dirname,'..');
const atlasPath=path.join(root,'subpackages/game/native/6b/6bc5fc93-b403-4b31-a0e1-7ccff54c45d7.7b5a8.png');
const atlasTextPath=path.join(root,'subpackages/game/native/d6/d614ee96-d20f-4373-8064-5d92fd589021.ac70a.atlas');
const outDir=path.join(root,'animal_replacement_spine_parts/18_sheep_strict_all_nonblack_blue');
function stamp(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`}
const backupDir=path.join(root,'backups',`spine_sheep_strict_all_nonblack_blue_${stamp()}`);
const slots=['sheep_body','sheep_leg1','sheep_leg2','sheep_leg3','sheep_leg4','sheep_eye','sheep_ear1','sheep_ear2','sheep_hair','sheep_wei','sheep_light'];
const load=f=>PNG.sync.read(fs.readFileSync(f));
const save=(f,p)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,PNG.sync.write(p));};
const blank=(w,h)=>new PNG({width:w,height:h});
const ix=(p,x,y)=>(y*p.width+x)*4;
const get=(p,x,y)=>{const i=ix(p,x,y);return[p.data[i],p.data[i+1],p.data[i+2],p.data[i+3]]};
const set=(p,x,y,c)=>{const i=ix(p,x,y);p.data[i]=c[0];p.data[i+1]=c[1];p.data[i+2]=c[2];p.data[i+3]=c[3];};
function parseAtlas(text){const lines=text.split(/\r?\n/), regions={}; for(let i=0;i<lines.length;i++){const name=lines[i].trim(); if(!slots.includes(name))continue; const r={name}; for(let j=i+1;j<Math.min(lines.length,i+8);j++){const l=lines[j].trim(); let m; if(l.startsWith('rotate:'))r.rotate=l.endsWith('true'); if(m=l.match(/^xy:\s*(\d+),\s*(\d+)/)){r.x=+m[1];r.y=+m[2]} if(m=l.match(/^size:\s*(\d+),\s*(\d+)/)){r.w=+m[1];r.h=+m[2]}} regions[name]=r;} return regions;}
function rotCcw(s){const d=blank(s.height,s.width); for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)set(d,y,s.width-1-x,get(s,x,y)); return d;}
function rotCw(s){const d=blank(s.height,s.width); for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)set(d,s.height-1-y,x,get(s,x,y)); return d;}
function extract(a,r){const pw=r.rotate?r.h:r.w, ph=r.rotate?r.w:r.h, top=a.height-r.y-ph, d=blank(pw,ph); for(let y=0;y<ph;y++)for(let x=0;x<pw;x++)set(d,x,y,get(a,r.x+x,top+y)); return r.rotate?rotCcw(d):d;}
function write(a,r,s0){const s=r.rotate?rotCw(s0):s0, top=a.height-r.y-s.height; for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)set(a,r.x+x,top+y,get(s,x,y));}
function recolorPixel(r,g,b,a,name){if(a<=8)return[0,0,0,0]; if(name==='sheep_eye')return[r,g,b,a]; const lum=(r+g+b)/3; const chroma=Math.max(r,g,b)-Math.min(r,g,b); if(lum<48 && chroma<105)return[r,g,b,a]; const shade=Math.max(.5,Math.min(1.18,lum/178)); return [Math.round(Math.min(118,Math.max(32,52*shade))),Math.round(Math.min(192,Math.max(108,148*shade))),Math.round(Math.min(255,Math.max(182,234*shade))),a];}
function recolor(p,name){const d=blank(p.width,p.height); for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)set(d,x,y,recolorPixel(...get(p,x,y),name)); return d;}
function stats(p){let o={alpha:0,nearBlack:0,blue:0,nonBlue:0,light:0}; for(let i=0;i<p.data.length;i+=4){const r=p.data[i],g=p.data[i+1],b=p.data[i+2],a=p.data[i+3]; if(a<=8)continue; o.alpha++; const lum=(r+g+b)/3,ch=Math.max(r,g,b)-Math.min(r,g,b); if(lum<48&&ch<105)o.nearBlack++; else if(b>r+12&&b>=g-18&&b>90)o.blue++; else o.nonBlue++; if(lum>150)o.light++;} return o;}
fs.mkdirSync(backupDir,{recursive:true}); fs.copyFileSync(atlasPath,path.join(backupDir,path.basename(atlasPath))); fs.copyFileSync(atlasTextPath,path.join(backupDir,path.basename(atlasTextPath)));
const atlas=load(atlasPath), regions=parseAtlas(fs.readFileSync(atlasTextPath,'utf8')), report=[];
for(const name of slots){const before=extract(atlas,regions[name]); const after=recolor(before,name); write(atlas,regions[name],after); save(path.join(outDir,`${name}.png`),after); report.push(`${name}: before=${JSON.stringify(stats(before))} after=${JSON.stringify(stats(after))}`);}
save(atlasPath,atlas);
fs.writeFileSync(path.join(outDir,'manifest.txt'),['Sheep strict all nonblack blue recolor install','','Fix: every visible sheep_* pixel except sheep_eye and true black outline is blue.','This catches pale wool fringes, gray edge pixels, cream leg wool, and brown anti-aliased edge pixels.',`atlas_texture=${path.relative(root,atlasPath).replace(/\\/g,'/')}`,`atlas_text=${path.relative(root,atlasTextPath).replace(/\\/g,'/')}`,`backup=${path.relative(root,backupDir).replace(/\\/g,'/')}`,'',...report,''].join('\n'));
console.log(`Updated ${path.relative(root,atlasPath)}`); console.log(`Backup ${path.relative(root,backupDir)}`); console.log(report.join('\n'));
