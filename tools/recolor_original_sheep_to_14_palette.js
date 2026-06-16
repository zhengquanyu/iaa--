const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const root = path.resolve(__dirname, '..');
const atlasPath = path.join(root, 'subpackages/game/native/6b/6bc5fc93-b403-4b31-a0e1-7ccff54c45d7.7b5a8.png');
const atlasTextPath = path.join(root, 'subpackages/game/native/d6/d614ee96-d20f-4373-8064-5d92fd589021.ac70a.atlas');
const originalAtlasPath = path.join(root, 'backups/spine_sheep_14_20260610-100729/6bc5fc93-b403-4b31-a0e1-7ccff54c45d7.7b5a8.png');
const paletteDir = path.join(root, 'animal_replacement_spine_parts/14_sheep');
const slots = ['sheep_body','sheep_leg1','sheep_leg2','sheep_leg3','sheep_leg4','sheep_eye','sheep_ear1','sheep_ear2','sheep_hair','sheep_wei','sheep_light'];
function stamp(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`}
const backupDir = path.join(root, 'backups', `spine_sheep_14_recolor_${stamp()}`);
const load=f=>PNG.sync.read(fs.readFileSync(f)); const save=(f,p)=>fs.writeFileSync(f, PNG.sync.write(p));
const blank=(w,h)=>new PNG({width:w,height:h}); const ix=(p,x,y)=>(y*p.width+x)*4;
function get(p,x,y){const i=ix(p,x,y);return [p.data[i],p.data[i+1],p.data[i+2],p.data[i+3]]}
function set(p,x,y,c){const i=ix(p,x,y);p.data[i]=c[0];p.data[i+1]=c[1];p.data[i+2]=c[2];p.data[i+3]=c[3]}
function parseAtlas(text){const lines=text.split(/\r?\n/); const m=(lines.find(l=>l.startsWith('size:'))||'').match(/size:\s*(\d+),\s*(\d+)/); const out={width:+m[1],height:+m[2],regions:{}}; for(let i=0;i<lines.length;i++){const name=lines[i].trim(); if(!slots.includes(name))continue; const r={name}; for(let j=i+1;j<Math.min(lines.length,i+8);j++){const l=lines[j].trim(); if(l.startsWith('rotate:'))r.rotate=l.endsWith('true'); if(l.startsWith('xy:')){const m=l.match(/xy:\s*(\d+),\s*(\d+)/); r.x=+m[1]; r.y=+m[2]} if(l.startsWith('size:')){const m=l.match(/size:\s*(\d+),\s*(\d+)/); r.w=+m[1]; r.h=+m[2]}} out.regions[name]=r} return out}
function rotCcw(s){const d=blank(s.height,s.width); for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)set(d,y,s.width-1-x,get(s,x,y)); return d}
function rotCw(s){const d=blank(s.height,s.width); for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)set(d,s.height-1-y,x,get(s,x,y)); return d}
function cropPacked(a,r){const pw=r.rotate?r.h:r.w, ph=r.rotate?r.w:r.h, top=a.height-r.y-ph, d=blank(pw,ph); for(let y=0;y<ph;y++)for(let x=0;x<pw;x++)set(d,x,y,get(a,r.x+x,top+y)); return d}
function extract(a,r){const p=cropPacked(a,r); return r.rotate?rotCcw(p):p}
function resize(s,w,h){const d=blank(w,h); for(let y=0;y<h;y++)for(let x=0;x<w;x++){const sx=Math.min(s.width-1,Math.max(0,Math.round((x+.5)*s.width/w-.5))); const sy=Math.min(s.height-1,Math.max(0,Math.round((y+.5)*s.height/h-.5))); set(d,x,y,get(s,sx,sy))} return d}
function avg(s){let r=0,g=0,b=0,n=0; for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){const c=get(s,x,y); if(c[3]>8){r+=c[0];g+=c[1];b+=c[2];n++}} return n?[r/n,g/n,b/n]:[255,255,255]}
function near(s,x,y,fb){let c=get(s,x,y); if(c[3]>8)return c; for(let rad=1;rad<=12;rad++)for(let yy=y-rad;yy<=y+rad;yy++)for(let xx=x-rad;xx<=x+rad;xx++){if(xx<0||yy<0||xx>=s.width||yy>=s.height)continue; c=get(s,xx,yy); if(c[3]>8)return c} return [fb[0],fb[1],fb[2],255]}
function recolor(orig,pal0){const pal=resize(pal0,orig.width,orig.height), fb=avg(pal), d=blank(orig.width,orig.height); for(let y=0;y<orig.height;y++)for(let x=0;x<orig.width;x++){const o=get(orig,x,y); if(o[3]<=8){set(d,x,y,[0,0,0,0]);continue} const p=near(pal,x,y,fb); const shade=Math.max(.62,Math.min(1.18,(o[0]+o[1]+o[2])/(3*220))); set(d,x,y,[Math.min(255,Math.round(p[0]*shade)),Math.min(255,Math.round(p[1]*shade)),Math.min(255,Math.round(p[2]*shade)),o[3]])} return d}
function write(a,r,s0){const s=r.rotate?rotCw(s0):s0, top=a.height-r.y-s.height; for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)set(a,r.x+x,top+y,get(s,x,y))}
function alpha(p){let n=0; for(let i=3;i<p.data.length;i+=4)if(p.data[i]>8)n++; return n}
fs.mkdirSync(backupDir,{recursive:true}); fs.copyFileSync(atlasPath,path.join(backupDir,path.basename(atlasPath))); fs.copyFileSync(atlasTextPath,path.join(backupDir,path.basename(atlasTextPath)));
const info=parseAtlas(fs.readFileSync(atlasTextPath,'utf8')), origAtlas=load(originalAtlasPath), out=load(originalAtlasPath), report=[];
for(const name of slots){const r=info.regions[name], o=extract(origAtlas,r), pal=load(path.join(paletteDir,`${name}.png`)), rec=recolor(o,pal); write(out,r,rec); report.push(`${name}: originalAlpha=${alpha(o)}, newAlpha=${alpha(rec)}`)}
save(atlasPath,out); fs.writeFileSync(path.join(backupDir,'recolor_report.txt'),report.join('\n')+'\n'); console.log(`Recolored ${path.relative(root,atlasPath)}`); console.log(`Backup ${path.relative(root,backupDir)}`); console.log(report.join('\n'));
